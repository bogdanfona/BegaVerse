import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  PanResponder, Dimensions, StatusBar,
} from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import * as Haptics from 'expo-haptics';
import { BegaColors, BegaCardShadow } from '../../constants/theme';
import { useBegaNotify } from '../components/BegaNotification';

const { width: SW, height: SH } = Dimensions.get('window');

// ── GPU water shaders ────────────────────────────────────────────────
// Vertex shader displaces geometry with overlapping sine waves and
// computes analytical normals from their derivatives for correct lighting.
const WATER_VERT = `
  uniform float uTime;
  varying vec2  vUv2;
  varying vec3  vNorm;
  void main() {
    vUv2 = uv;
    vec3 p = position;
    float w = 0.12*sin(p.z*0.080+uTime*1.50)
            + 0.07*sin(p.z*0.150+p.x*0.500+uTime*2.10)
            + 0.05*sin(p.z*0.060-p.x*0.350+uTime*1.20)
            + 0.03*sin(p.x*0.700+uTime*2.80)
            + 0.02*sin(p.z*0.220+uTime*3.30);
    p.y += w;
    float dz = 0.12*0.080*cos(p.z*0.080+uTime*1.50)
             + 0.07*0.150*cos(p.z*0.150+p.x*0.500+uTime*2.10)
             + 0.05*0.060*cos(p.z*0.060-p.x*0.350+uTime*1.20);
    float dx = 0.07*0.500*cos(p.z*0.150+p.x*0.500+uTime*2.10)
             - 0.05*0.350*cos(p.z*0.060-p.x*0.350+uTime*1.20)
             + 0.03*0.700*cos(p.x*0.700+uTime*2.80);
    vNorm = normalize(normalMatrix * normalize(vec3(dx, 1.0, dz)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const WATER_FRAG = `
  uniform float uTime;
  varying vec2  vUv2;
  varying vec3  vNorm;
  void main() {
    vec3 N = normalize(vNorm);
    vec3 L = normalize(vec3(0.55, 1.0, 0.30));
    vec3 V = vec3(0.0, 1.0, 0.0);
    float diff = dot(N, L) * 0.45 + 0.55;
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 80.0);
    float fr   = clamp(1.0 - N.y, 0.0, 1.0);
    vec3 deep    = vec3(0.05+sin(uTime*0.35)*0.008, 0.22+sin(uTime*0.28)*0.012, 0.46+sin(uTime*0.42)*0.018);
    vec3 shallow = vec3(0.16, 0.44, 0.68);
    vec3 col  = mix(deep, shallow, fr * 0.65) * diff;
    float edge = min(vUv2.x, 1.0 - vUv2.x);
    float foam = 1.0 - smoothstep(0.0, 0.06, edge);
    col = mix(col, vec3(0.80, 0.92, 1.0), foam * 0.55);
    col += vec3(spec*0.80, spec*0.90, spec);
    gl_FragColor = vec4(col, 0.90);
  }
`;

// ── Procedural texture generators (DataTexture — works in expo-gl) ────
function makeTex(size, fn) {
  const d = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const c = fn(x, y, size);
      const i = (y * size + x) * 4;
      d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2]; d[i+3] = 255;
    }
  const t = new THREE.DataTexture(d, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

function concreteTex() {
  return makeTex(128, (x, y) => {
    const hj = y % 32 < 2, vj = x % 64 < 2;
    const n  = (Math.random() - 0.5) * 22;
    const b  = (hj || vj) ? 115 : 150;
    const v  = Math.max(80, Math.min(200, b + n));
    return [v, v, Math.max(70, v - 7)];
  });
}
function wetConcreteTex() {
  return makeTex(64, (x, y) => {
    const n = (Math.random() - 0.5) * 16;
    const v = Math.max(80, Math.min(145, 118 + n));
    return [Math.max(60, v - 6), Math.max(70, v + 2), Math.max(60, v - 2)];
  });
}
function grassTex() {
  return makeTex(128, () => {
    const n = (Math.random() - 0.5) * 35;
    return [
      Math.max(20, Math.min(80, 36 + n)),
      Math.max(60, Math.min(145, 98 + n)),
      Math.max(10, Math.min(50, 26 + n)),
    ];
  });
}
function asphaltTex() {
  return makeTex(128, (x, y) => {
    const n  = (Math.random() - 0.5) * 18;
    const v  = Math.max(160, Math.min(218, 192 + n));
    return [v - 3, v - 5, v - 9];
  });
}

// ── Water simulation constants ────────────────────────────────────────
const W_NZ   = 80;   // more segments = smoother GPU waves
const W_NX   = 12;
const W_HALF = 7.1;

// Pre-builds a vertex grid for the water surface.
// Only Y is animated each frame; X/Z are fixed by the canal curve.
function createWaterGrid() {
  const verts = new Float32Array((W_NZ + 1) * (W_NX + 1) * 3);
  const uvs   = new Float32Array((W_NZ + 1) * (W_NX + 1) * 2);
  const idx   = [];
  for (let iz = 0; iz <= W_NZ; iz++) {
    const tz = iz / W_NZ;
    const wz = -240 + tz * 480;
    const cx = cX(wz);
    for (let ix = 0; ix <= W_NX; ix++) {
      const tx = ix / W_NX;
      const lx = -W_HALF + tx * W_HALF * 2;
      const vi = iz * (W_NX + 1) + ix;
      verts[vi * 3]     = cx + lx;
      verts[vi * 3 + 1] = 0.05;
      verts[vi * 3 + 2] = wz;
      uvs[vi * 2]       = tx * 6;
      uvs[vi * 2 + 1]   = tz * 30;
    }
  }
  for (let iz = 0; iz < W_NZ; iz++) {
    for (let ix = 0; ix < W_NX; ix++) {
      const a = iz * (W_NX + 1) + ix;
      const c = (iz + 1) * (W_NX + 1) + ix;
      idx.push(a, c, a + 1, a + 1, c, c + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ── Vertical wall strip along the canal ──────────────────────────────
// Produces a vertical curtain at x = xFn(z), from yBot to yTop.
function createCanalWall(xFn, yBot, yTop, segs) {
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const z = -240 + t * 480;
    const x = xFn(z);
    pos.push(x, yBot, z,  x, yTop, z);
    uvs.push(0, t,         1, t);
    if (i < segs) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1,  b + 1, b + 2, b + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ── Canal centreline (from website source) ────────────────────────────
const BEGA_WP = [
  [-240, -74], [-210, -64], [-180, -53], [-150, -38], [-120, -22],
  [-90, -8],   [-60, 8],    [-30, 20],   [0, 30],     [30, 42],
  [60, 56],    [90, 72],    [120, 84],   [150, 86],   [180, 78],
  [210, 62],   [240, 42],
];

function cX(z) {
  const t   = (z + 240) / 480;
  const idx = Math.min(Math.floor(t * (BEGA_WP.length - 1)), BEGA_WP.length - 2);
  const f   = t * (BEGA_WP.length - 1) - idx;
  return BEGA_WP[idx][1] + (BEGA_WP[idx + 1][1] - BEGA_WP[idx][1]) * f;
}

function cXd(z) {
  return (cX(z + 1) - cX(z - 1)) / 2;
}

function createRibbon(leftFn, rightFn, segs, y) {
  const geo = new THREE.BufferGeometry();
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t  = i / segs;
    const z  = -240 + t * 480;
    const xl = leftFn(z), xr = rightFn(z);
    pos.push(xl, y, z, xr, y, z);
    uvs.push(0, t, 1, t);
    if (i < segs) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ── Sensor definitions ────────────────────────────────────────────────
const SENSORS = [
  { id: 'S001', name: 'Podul Decebal',      z: -68,  status: 'online',  ph: 7.2, turbidity: 12, temp: 18.4, o2: 8.6 },
  { id: 'S002', name: 'Podul Michelangelo', z: -18,  status: 'online',  ph: 6.9, turbidity: 18, temp: 17.8, o2: 7.9 },
  { id: 'S003', name: 'Podul Eroilor',      z: 32,   status: 'warning', ph: 6.5, turbidity: 34, temp: 19.1, o2: 6.2 },
  { id: 'S004', name: 'Parcul Rozelor',     z: 80,   status: 'online',  ph: 7.4, turbidity: 8,  temp: 17.2, o2: 9.1 },
  { id: 'S005', name: 'Zona Industrială',   z: -120, status: 'offline', ph: null, turbidity: null, temp: null, o2: null },
];

const SENSOR_HEX = { online: 0x66BB6A, warning: 0xFFA726, offline: 0xEF5350 };

// ── Shop items ────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: 'tree',     label: 'TREE',     icon: '🌳', cost: 500, score: 20, co2: 21 },
  { id: 'bench',    label: 'BENCH',    icon: '🪑', cost: 200, score: 8,  co2: 0  },
  { id: 'flowers',  label: 'FLOWERS',  icon: '🌸', cost: 150, score: 5,  co2: 1  },
  { id: 'lamp',     label: 'LAMP',     icon: '💡', cost: 300, score: 6,  co2: 0  },
  { id: 'fountain', label: 'FOUNTAIN', icon: '⛲', cost: 800, score: 15, co2: 0  },
];

// ── 3D object makers ──────────────────────────────────────────────────
function make3DTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x8B6914 })
  );
  trunk.position.set(0, 0.6, 0);
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0x2D8B3F })
  );
  crown.position.set(0, 1.9, 0);
  const group = new THREE.Group();
  group.add(trunk, crown);
  group.position.set(x, 2.4, z);
  return group;
}

function make3DBench(x, z) {
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.1, 0.45),
    new THREE.MeshLambertMaterial({ color: 0xB87333 })
  );
  seat.position.set(0, 0.5, 0);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 0.08),
    new THREE.MeshLambertMaterial({ color: 0xB87333 })
  );
  back.position.set(0, 0.82, -0.18);
  const group = new THREE.Group();
  group.add(seat, back);
  group.position.set(x, 2.4, z);
  return group;
}

function make3DFlowers(x, z) {
  const headColors = [0xFF69B4, 0xFF6347, 0xFFD700, 0x9370DB, 0xFF4500];
  const group = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const ox = Math.cos(angle) * 0.3, oz = Math.sin(angle) * 0.3;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: 0x5B8A35 })
    );
    stem.position.set(ox, 0.25, oz);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 4, 3),
      new THREE.MeshLambertMaterial({ color: headColors[i] })
    );
    head.position.set(ox, 0.55, oz);
    group.add(stem, head);
  }
  group.position.set(x, 2.4, z);
  return group;
}

function make3DLamp(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 3.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x708090 })
  );
  pole.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0xFFFDE7, emissive: 0xFFF9C4, emissiveIntensity: 0.8 })
  );
  head.position.set(0, 3.6, 0);
  const group = new THREE.Group();
  group.add(pole, head);
  group.position.set(x, 2.4, z);
  return group;
}

function make3DFountain(x, z) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
  const base   = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.25, 12), mat);
  const bowl   = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.3, 12), new THREE.MeshLambertMaterial({ color: 0xA0A0A0 }));
  bowl.position.y = 0.28;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.8, 6), new THREE.MeshLambertMaterial({ color: 0xB0B0B0 }));
  column.position.y = 0.7;
  const top    = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 4), new THREE.MeshLambertMaterial({ color: 0x87CEEB, emissive: 0x4FC3F7, emissiveIntensity: 0.3 }));
  top.position.y = 1.2;
  const group = new THREE.Group();
  group.add(base, bowl, column, top);
  group.position.set(x, 2.4, z);
  return group;
}

// ── Component ─────────────────────────────────────────────────────────
export default function ARDimensionScreen({ navigation }) {
  const { showToast } = useBegaNotify();

  // Render-loop refs (no re-render on change)
  const cameraRef      = useRef(null);
  const sceneRef       = useRef(null);
  const rendererRef    = useRef(null);
  const glRef          = useRef(null);
  const animIdRef      = useRef(null);
  const camStateRef    = useRef({ z: 0, angleY: 0 });
  const budgetRef      = useRef(5000);
  const selectedIRef   = useRef(null);
  const hitPlanesRef   = useRef([]);
  const sensorMeshRef  = useRef([]);
  const sensorPosRef   = useRef(SENSORS.map(() => ({ x: -999, y: -999, visible: false })));
  const moveRef        = useRef({ fwd: false, back: false, left: false, right: false });
  const waterGeoRef    = useRef(null);
  const waterMatRef    = useRef(null);
  const handleTapRef   = useRef(null);

  // UI state
  const [budget,        setBudget]        = useState(5000);
  const [score,         setScore]         = useState(0);
  const [co2,           setCO2]           = useState(0);
  const [placed,        setPlaced]        = useState(0);
  const [selectedItem,  setSelectedItem]  = useState(null);
  const [selectedSensor,setSelectedSensor]= useState(null);
  const [coords,        setCoords]        = useState('LAT 45.7530° · LON 21.2160°');
  const [sensorDots,    setSensorDots]    = useState(SENSORS.map(() => ({ x: -999, y: -999, visible: false })));
  const [showShop,      setShowShop]      = useState(true);
  const [ready,         setReady]         = useState(false);

  // ── D-pad movement (16 ms tick) ────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const cam = camStateRef.current;
      const m   = moveRef.current;
      if (m.fwd)   cam.z    -= 0.9;
      if (m.back)  cam.z    += 0.9;
      if (m.left)  cam.angleY -= 0.03;
      if (m.right) cam.angleY += 0.03;
      cam.z      = Math.max(-230, Math.min(230, cam.z));
      cam.angleY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cam.angleY));
    }, 16);
    return () => clearInterval(id);
  }, []);

  // ── Coordinate display (400 ms tick) ──────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const z   = camStateRef.current.z;
      const lat = (45.753 + z * 0.000048).toFixed(4);
      const lon = (21.216 + z * 0.000062).toFixed(4);
      setCoords(`LAT ${lat}° · LON ${lon}°`);
    }, 400);
    return () => clearInterval(id);
  }, []);

  // ── Sensor dot screen-positions (200 ms tick) ──────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const camera = cameraRef.current;
      if (!camera) return;
      camera.updateMatrixWorld();
      const next = sensorMeshRef.current.map(mesh => {
        if (!mesh) return { x: -999, y: -999, visible: false };
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        wp.project(camera);
        return {
          x: ((wp.x + 1) / 2) * SW,
          y: ((1 - wp.y) / 2) * SH,
          visible: wp.z > 0 && wp.z < 1,
        };
      });
      sensorPosRef.current = next;
      setSensorDots([...next]);
    }, 200);
    return () => clearInterval(id);
  }, []);

  // ── Tap handler (kept in ref so panResponder always has latest) ────
  useEffect(() => {
    handleTapRef.current = (tapX, tapY) => {
      // Check sensor dots first
      for (let i = 0; i < SENSORS.length; i++) {
        const sp = sensorPosRef.current[i];
        if (!sp.visible) continue;
        if (Math.hypot(tapX - sp.x, tapY - sp.y) < 28) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setSelectedSensor(SENSORS[i]);
          return;
        }
      }

      // Item placement via raycasting
      const item = SHOP_ITEMS.find(s => s.id === selectedIRef.current);
      if (!item) return;
      if (budgetRef.current < item.cost) {
        showToast('Not enough budget!', 'error');
        return;
      }
      const camera = cameraRef.current;
      const scene  = sceneRef.current;
      if (!camera || !scene) return;

      const ndcX     = (tapX / SW) * 2 - 1;
      const ndcY     = -((tapY / SH) * 2 - 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const hits = raycaster.intersectObjects(hitPlanesRef.current);
      if (!hits.length) return;

      const pt  = hits[0].point;
      const obj =
        item.id === 'tree'     ? make3DTree(pt.x, pt.z)    :
        item.id === 'bench'    ? make3DBench(pt.x, pt.z)   :
        item.id === 'flowers'  ? make3DFlowers(pt.x, pt.z) :
        item.id === 'lamp'     ? make3DLamp(pt.x, pt.z)    :
        make3DFountain(pt.x, pt.z);

      scene.add(obj);
      budgetRef.current -= item.cost;
      setBudget(budgetRef.current);
      setScore(s => s + item.score);
      setCO2(c => c + item.co2);
      setPlaced(p => p + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`${item.label} placed! +${item.score} score`, 'success');
    };
  });

  // ── PanResponder ───────────────────────────────────────────────────
  const lastPan  = useRef({ x: 0, y: 0 });
  const tapStart = useRef({ x: 0, y: 0, t: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        lastPan.current  = { x: pageX, y: pageY };
        tapStart.current = { x: pageX, y: pageY, t: Date.now() };
      },
      onPanResponderMove: (e) => {
        const { pageX } = e.nativeEvent;
        const dx = pageX - lastPan.current.x;
        lastPan.current.x = pageX;
        camStateRef.current.angleY -= dx * 0.005;
        camStateRef.current.angleY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camStateRef.current.angleY));
      },
      onPanResponderRelease: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        const dx = Math.abs(pageX - tapStart.current.x);
        const dy = Math.abs(pageY - tapStart.current.y);
        const dt = Date.now() - tapStart.current.t;
        if (dx < 8 && dy < 8 && dt < 300) {
          handleTapRef.current?.(pageX, pageY);
        }
      },
    })
  ).current;

  // ── Three.js scene ─────────────────────────────────────────────────
  const onContextCreate = async (gl) => {
    glRef.current = gl;

    // Three.js r166 calls canvas.classList.contains() during init.
    // expo-three's canvas mock omits classList, causing the render error.
    // We provide a complete canvas mock directly to WebGLRenderer instead.
    const noopClassList = { contains: () => false, add: () => {}, remove: () => {}, toggle: () => false };
    const canvas = {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      classList: noopClassList,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      clientWidth: gl.drawingBufferWidth,
      clientHeight: gl.drawingBufferHeight,
      getBoundingClientRect: () => ({
        x: 0, y: 0, left: 0, top: 0,
        right: gl.drawingBufferWidth, bottom: gl.drawingBufferHeight,
        width: gl.drawingBufferWidth, height: gl.drawingBufferHeight,
        toJSON: () => {},
      }),
      ownerDocument: { createElement: () => ({}), createElementNS: () => ({}) },
    };

    const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaec8d8);
    scene.fog = new THREE.Fog(0xaec8d8, 60, 145);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      65, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 300
    );
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.58));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -80;
    sun.shadow.camera.right = sun.shadow.camera.top = 80;
    sun.shadow.camera.far = 250;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc8dff0, 0.3);
    fill.position.set(-30, 40, -20);
    scene.add(fill);

    // ── Terrain ───────────────────────────────────────────────────────
    const gTex = grassTex();       gTex.repeat.set(6, 60);
    const aTex = asphaltTex();     aTex.repeat.set(2, 40);
    const cTex = concreteTex();    cTex.repeat.set(4, 50);
    const wTex = wetConcreteTex(); wTex.repeat.set(3, 35);

    // Full raised bank — all green grass from canal wall edge out to embankment edge
    const grassMat = new THREE.MeshLambertMaterial({ map: gTex });
    scene.add(new THREE.Mesh(createRibbon(z => cX(z) - 42, z => cX(z) - 7.5, 80, 2.4), grassMat));
    scene.add(new THREE.Mesh(createRibbon(z => cX(z) +  7.5, z => cX(z) + 42, 80, 2.4), grassMat));

    // Street-level ground at Y=0 — makes the embankment look solid, not floating
    const streetMat = new THREE.MeshLambertMaterial({ map: aTex });
    scene.add(new THREE.Mesh(createRibbon(z => cX(z) - 55, z => cX(z) - 17, 80, 0.0), streetMat));
    scene.add(new THREE.Mesh(createRibbon(z => cX(z) + 17, z => cX(z) + 55, 80, 0.0), streetMat));

    // ── Concrete canal walls (Bega-style retaining walls) ─────────────
    // The Bega canal has vertical concrete walls rising ~2.5 m above water.
    const concreteMat = new THREE.MeshPhongMaterial({
      map: cTex, specular: 0x1A1A14, shininess: 8, side: THREE.DoubleSide,
    });
    const capMat = new THREE.MeshPhongMaterial({
      map: cTex, specular: 0x111108, shininess: 6, side: THREE.DoubleSide,
    });
    // Weathered lower band (algae / damp concrete near waterline)
    const wetMat = new THREE.MeshLambertMaterial({ map: wTex, side: THREE.DoubleSide });

    // Inner wall face — full height
    scene.add(new THREE.Mesh(createCanalWall(z => cX(z) - 7.5, -0.5, 2.4, 100), concreteMat));
    scene.add(new THREE.Mesh(createCanalWall(z => cX(z) + 7.5, -0.5, 2.4, 100), concreteMat));

    // Wet / algae band at waterline (bottom 0.8 m)
    scene.add(new THREE.Mesh(createCanalWall(z => cX(z) - 7.5, -0.5, 0.3, 80), wetMat));
    scene.add(new THREE.Mesh(createCanalWall(z => cX(z) + 7.5, -0.5, 0.3, 80), wetMat));

    // Outer retaining face — visible drop from raised land down to street level
    scene.add(new THREE.Mesh(createCanalWall(z => cX(z) - 17, 0.0, 2.4, 80), concreteMat));
    scene.add(new THREE.Mesh(createCanalWall(z => cX(z) + 17, 0.0, 2.4, 80), concreteMat));

    // Canal floor (concrete / mud, partially visible through water)
    scene.add(new THREE.Mesh(
      createRibbon(z => cX(z) - 7.5, z => cX(z) + 7.5, 60, -0.45),
      new THREE.MeshLambertMaterial({ color: 0x8B8070 })
    ));

    // ── Water simulation ──────────────────────────────────────────────
    // GPU ShaderMaterial: vertex shader displaces the mesh with overlapping
    // sine waves; fragment shader computes Phong + Fresnel + edge foam.
    const waterMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader:   WATER_VERT,
      fragmentShader: WATER_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
    });
    waterMatRef.current = waterMat;

    const waterGeo = createWaterGrid();
    waterGeoRef.current = waterGeo;
    scene.add(new THREE.Mesh(waterGeo, waterMat));

    // Edge foam — thin lighter strips at the canal walls
    const foamMat = new THREE.MeshLambertMaterial({
      color: 0xCCE8FF, transparent: true, opacity: 0.38,
    });
    scene.add(new THREE.Mesh(
      createRibbon(z => cX(z) - W_HALF, z => cX(z) - W_HALF + 0.8, 60, 0.13),
      foamMat
    ));
    scene.add(new THREE.Mesh(
      createRibbon(z => cX(z) + W_HALF - 0.8, z => cX(z) + W_HALF, 60, 0.13),
      foamMat
    ));

    // ── Trees — 4 per 8 m (inner + outer promenade rows, matching website density) ─
    const trkMat   = new THREE.MeshLambertMaterial({ color: 0x7A5C2A });
    const treeCols = [0x2D6B22, 0x3A8A2A, 0x1E5018, 0x4A9030, 0x266820, 0x357530];
    for (let z = -228; z <= 228; z += 8) {
      const j = (Math.random() - 0.5) * 2;
      [
        [cX(z + j)      - 10.8, z + j    ],
        [cX(z + j + 4)  - 14.2, z + j + 4],
        [cX(z - j)      + 10.8, z - j    ],
        [cX(z - j + 4)  + 14.2, z - j + 4],
      ].forEach(([tx, tz]) => {
        const th = 2.4 + Math.random() * 2.2;
        const cr = 0.72 + Math.random() * 0.48;
        const trk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, th, 6), trkMat);
        trk.position.set(tx, 2.4 + th / 2, tz);
        const crn = new THREE.Mesh(
          new THREE.SphereGeometry(cr, 7, 5),
          new THREE.MeshLambertMaterial({ color: treeCols[Math.floor(Math.random() * 6)] })
        );
        crn.position.set(tx, 2.4 + th + cr * 0.65, tz);
        scene.add(trk, crn);
      });
    }

    // ── Bollards (concrete pillars on wall cap, every 6 m) ───────────────
    const bollardGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.72, 6);
    const bollardMat = new THREE.MeshPhongMaterial({ map: cTex, specular: 0x0A0A08, shininess: 4 });
    for (let bz = -228; bz <= 228; bz += 6) {
      const bcx = cX(bz);
      const bL = new THREE.Mesh(bollardGeo, bollardMat);
      bL.position.set(bcx - 7.5, 2.76, bz);
      scene.add(bL);
      const bR = new THREE.Mesh(bollardGeo, bollardMat);
      bR.position.set(bcx + 7.5, 2.76, bz);
      scene.add(bR);
    }

    // ── Lamp posts (promenade, every 22 m, staggered L/R) ────────────────
    const lpPoleMat = new THREE.MeshPhongMaterial({ color: 0x5C6870, specular: 0x202828, shininess: 22 });
    const lpHeadMat = new THREE.MeshLambertMaterial({ color: 0xFFFDE7, emissive: 0xFFF176, emissiveIntensity: 1.0 });
    const lpPoleGeo = new THREE.CylinderGeometry(0.055, 0.085, 4.5, 6);
    const lpHeadGeo = new THREE.SphereGeometry(0.23, 6, 4);
    for (let lz = -225; lz <= 225; lz += 22) {
      const llx = cX(lz) - 12.5;
      const lpL = new THREE.Mesh(lpPoleGeo, lpPoleMat);
      lpL.position.set(llx, 4.65, lz);
      const lhL = new THREE.Mesh(lpHeadGeo, lpHeadMat);
      lhL.position.set(llx, 7.15, lz);
      scene.add(lpL, lhL);

      const rlx = cX(lz + 11) + 12.5;
      const lpR = new THREE.Mesh(lpPoleGeo, lpPoleMat);
      lpR.position.set(rlx, 4.65, lz + 11);
      const lhR = new THREE.Mesh(lpHeadGeo, lpHeadMat);
      lhR.position.set(rlx, 7.15, lz + 11);
      scene.add(lpR, lhR);
    }

    // Bridges
    const BRIDGE_ZS = [-185, -120, -68, -18, 32, 118];
    BRIDGE_ZS.forEach(bz => {
      const bx    = cX(bz);
      const angle = Math.atan2(cXd(bz), 1);
      const bg    = new THREE.Group();

      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(22, 0.5, 3.5),
        new THREE.MeshLambertMaterial({ color: 0xa09070 })
      );
      bg.add(deck);

      const postMat = new THREE.MeshLambertMaterial({ color: 0x888070 });
      [-9, -3, 3, 9].forEach(px => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), postMat);
        post.position.set(px, 1.35, 0);
        bg.add(post);
      });

      const railMat = new THREE.MeshLambertMaterial({ color: 0x808070 });
      [-10.5, 10.5].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3.2), railMat);
        rail.position.set(rx, 2.5, 0);
        bg.add(rail);
      });

      bg.rotation.y = angle;
      bg.position.set(bx, 0.6, bz);
      scene.add(bg);
    });

    // Sensor markers
    const sensorMeshes = [];
    SENSORS.forEach((s, i) => {
      const col = SENSOR_HEX[s.status];
      const mx  = cX(s.z) + 10.5; // on the promenade, just outside the wall cap
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 4, 6),
        new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: 0.4 })
      );
      beam.position.y = 2;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.6 })
      );
      sphere.position.y = 4.5;
      const grp = new THREE.Group();
      grp.add(beam, sphere);
      grp.position.set(mx, 2.4, s.z);
      scene.add(grp);
      sensorMeshes.push(sphere);
    });
    sensorMeshRef.current = sensorMeshes;

    // ── Buildings — identical layout to the website's 3D AR scene ────────
    // Positions: [x-offset from canal center, z, width, height, depth]
    // Beige/cream palette matching Timișoara's Habsburg-era architecture.
    const bldMats = [
      new THREE.MeshLambertMaterial({ color: 0xeeeae0 }),
      new THREE.MeshLambertMaterial({ color: 0xe2dfd8 }),
      new THREE.MeshLambertMaterial({ color: 0xf0ece4 }),
      new THREE.MeshLambertMaterial({ color: 0xd8d4cc }),
    ];
    [
      [-22,-115,12,14,13], [-27, -92, 8,10, 9], [-20,-68,14,21,16], [-24,-44, 9,13,11],
      [-21, -20,11,17,13], [-26,   6, 8,10, 9], [-22, 34,13,24,15], [-27, 60, 8,12,10],
      [-20,  88,12,17,14], [-25, 115, 7,11, 8], [-22,142,14,26,17], [-27,170, 9,14,11],
      [ 22,-115,12,13,13], [ 27, -88, 8,19, 9], [ 20,-65,14,17,16], [ 24,-40, 9,12,11],
      [ 21, -15,11,21,13], [ 26,  12, 8,10, 9], [ 22, 40,13,16,15], [ 27, 67, 8,13,10],
      [ 20, 102,12,18,14], [ 25, 130, 7,10, 8], [ 22,160,14,23,17],
    ].forEach(([xo, bz, w, h, d], i) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldMats[i % 4]);
      b.position.set(cX(bz) + xo, h / 2, bz);
      scene.add(b);
    });

    // Bank hit planes (invisible, raised to land level — full bank width including ledge)
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
    const hitL = new THREE.Mesh(createRibbon(z => cX(z) - 17, z => cX(z) - 7.5, 60, 2.4), hitMat);
    const hitR = new THREE.Mesh(createRibbon(z => cX(z) + 7.5, z => cX(z) + 17, 60, 2.4), hitMat.clone());
    scene.add(hitL, hitR);
    hitPlanesRef.current = [hitL, hitR];

    setReady(true);

    // Render loop
    let t = 0;
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      t += 0.016;

      // Camera follow — elevated view above the raised bank
      const cam = camStateRef.current;
      camera.position.set(
        cX(cam.z) + Math.sin(cam.angleY) * 2,
        5.9,
        cam.z + 5
      );
      camera.lookAt(
        cX(cam.z - 22) + Math.sin(cam.angleY) * 16,
        3.4,
        cam.z - 22
      );

      // GPU water — vertex shader handles all animation via uTime uniform
      if (waterMatRef.current) waterMatRef.current.uniforms.uTime.value = t;

      // Sensor pulse
      sensorMeshRef.current.forEach((mesh, i) => {
        if (!mesh) return;
        const s = 0.88 + Math.sin(t * 2.2 + i * 1.4) * 0.14;
        mesh.scale.setScalar(s);
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // ── UI ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 3D canvas */}
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
        {...panResponder.panHandlers}
      />

      {/* Top HUD */}
      <View style={styles.hud} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {[
            { v: `€${budget}`, sub: 'BUDGET' },
            { v: score,        sub: 'SCORE'  },
            { v: co2,          sub: 'CO₂ kg' },
            { v: placed,       sub: 'PLACED' },
          ].map((s, i) => (
            <View key={i} style={styles.statPill}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <View style={styles.coordBar}>
          <Text style={styles.coordText}>// {coords}</Text>
        </View>
      </View>

      {/* Sensor dots (non-interactive layer) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {SENSORS.map((s, i) => {
          const dot = sensorDots[i];
          if (!dot.visible) return null;
          const col = s.status === 'online'  ? BegaColors.greenBright
                    : s.status === 'warning' ? BegaColors.orangeBright
                    : BegaColors.redBright;
          return (
            <View
              key={s.id}
              style={[styles.sensorDot, { left: dot.x - 8, top: dot.y - 8, backgroundColor: col }]}
            />
          );
        })}
      </View>

      {/* Sensor info panel */}
      {selectedSensor && (
        <View style={styles.sensorPanel}>
          <TouchableOpacity
            style={styles.sensorClose}
            onPress={() => setSelectedSensor(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.sensorCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.sensorId}>{selectedSensor.id}</Text>
          <Text style={styles.sensorName}>{selectedSensor.name}</Text>
          <View style={[styles.sensorStatusPill, {
            borderColor: selectedSensor.status === 'online'  ? BegaColors.greenBright
                       : selectedSensor.status === 'warning' ? BegaColors.orangeBright
                       : BegaColors.redBright,
          }]}>
            <Text style={[styles.sensorStatusText, {
              color: selectedSensor.status === 'online'  ? BegaColors.greenBright
                   : selectedSensor.status === 'warning' ? BegaColors.orangeBright
                   : BegaColors.redBright,
            }]}>● {selectedSensor.status.toUpperCase()}</Text>
          </View>

          {selectedSensor.status !== 'offline' ? (
            <View style={styles.readings}>
              {[
                { label: 'pH',        val: selectedSensor.ph,        unit: '',      warn: v => v < 6.5 || v > 8.5 },
                { label: 'TURBIDITY', val: selectedSensor.turbidity, unit: ' NTU',  warn: v => v > 25 },
                { label: 'TEMP',      val: selectedSensor.temp,      unit: '°C',    warn: v => v > 20 },
                { label: 'O₂',        val: selectedSensor.o2,        unit: ' mg/L', warn: v => v < 7 },
              ].map(r => (
                <View key={r.label} style={styles.readingRow}>
                  <Text style={styles.readingLabel}>{r.label}</Text>
                  <Text style={[styles.readingVal, r.warn(r.val) && styles.readingWarn]}>
                    {r.val}{r.unit}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.offlineMsg}>NO DATA — SENSOR OFFLINE</Text>
          )}
        </View>
      )}

      {/* D-pad */}
      <View style={styles.dpad}>
        <TouchableOpacity style={styles.dpadBtn}
          onPressIn={() => { moveRef.current.fwd = true; }}
          onPressOut={() => { moveRef.current.fwd = false; }}
          activeOpacity={0.7}>
          <Text style={styles.dpadArrow}>▲</Text>
        </TouchableOpacity>
        <View style={styles.dpadRow}>
          <TouchableOpacity style={styles.dpadBtn}
            onPressIn={() => { moveRef.current.left = true; }}
            onPressOut={() => { moveRef.current.left = false; }}
            activeOpacity={0.7}>
            <Text style={styles.dpadArrow}>◀</Text>
          </TouchableOpacity>
          <View style={styles.dpadCenter} />
          <TouchableOpacity style={styles.dpadBtn}
            onPressIn={() => { moveRef.current.right = true; }}
            onPressOut={() => { moveRef.current.right = false; }}
            activeOpacity={0.7}>
            <Text style={styles.dpadArrow}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.dpadBtn}
          onPressIn={() => { moveRef.current.back = true; }}
          onPressOut={() => { moveRef.current.back = false; }}
          activeOpacity={0.7}>
          <Text style={styles.dpadArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Shop */}
      <View style={styles.shopWrap}>
        <TouchableOpacity
          style={styles.shopToggle}
          onPress={() => setShowShop(s => !s)}
          activeOpacity={0.8}
        >
          <Text style={styles.shopToggleText}>{showShop ? '▼ ITEM SHOP' : '▲ ITEM SHOP'}</Text>
        </TouchableOpacity>

        {showShop && (
          <View style={styles.shopPanel}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopScroll}
            >
              {SHOP_ITEMS.map(item => {
                const isSelected = selectedItem === item.id;
                const canAfford  = budget >= item.cost;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.shopItem,
                      isSelected  && styles.shopItemActive,
                      !canAfford  && styles.shopItemDim,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!canAfford) { showToast('Insufficient budget!', 'error'); return; }
                      const next = isSelected ? null : item.id;
                      setSelectedItem(next);
                      selectedIRef.current = next;
                      if (next) showToast(`${item.label} selected · tap bank to place`, 'info');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.shopIcon}>{item.icon}</Text>
                    <Text style={styles.shopLabel}>{item.label}</Text>
                    <Text style={[styles.shopCost, !canAfford && { color: BegaColors.coral }]}>
                      €{item.cost}
                    </Text>
                    {isSelected && <View style={styles.shopDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedItem && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setSelectedItem(null); selectedIRef.current = null; }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>✕ CANCEL PLACEMENT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Loading screen */}
      {!ready && (
        <View style={styles.loading}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingAccent} />
            <View style={styles.loadingInner}>
              <Text style={styles.loadingTag}>[ BEGA RIVER ]</Text>
              <Text style={styles.loadingTitle}>LOADING 3D MAP</Text>
              <Text style={styles.loadingSub}>Initialising canal geometry…</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BegaColors.deep },

  // ── HUD ────────────────────────────────────────────────────────────
  hud: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 52, paddingHorizontal: 14, paddingBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start', marginBottom: 10,
    backgroundColor: 'rgba(6,18,32,0.88)',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingHorizontal: 14, paddingVertical: 8,
  },
  backBtnText: { color: BegaColors.textMuted, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 },

  statsRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  statPill: {
    backgroundColor: 'rgba(6,18,32,0.88)',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 5, marginBottom: 4, alignItems: 'center',
  },
  statVal: { fontSize: 12, fontWeight: '700', color: BegaColors.cyan, fontFamily: 'monospace' },
  statSub: { fontSize: 7, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1, marginTop: 1 },

  coordBar: {
    backgroundColor: 'rgba(6,18,32,0.82)',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  coordText: { fontSize: 8, color: BegaColors.cyan, fontFamily: 'monospace', letterSpacing: 1 },

  // ── Sensor dot ─────────────────────────────────────────────────────
  sensorDot: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#fff',
  },

  // ── Sensor panel ───────────────────────────────────────────────────
  sensorPanel: {
    position: 'absolute', right: 14, top: SH * 0.2,
    width: 196,
    backgroundColor: 'rgba(6,12,24,0.95)',
    borderWidth: 1, borderColor: BegaColors.cardBorderStrong,
    borderLeftWidth: 3, borderLeftColor: BegaColors.cyan,
    borderRadius: 4, padding: 14,
    ...BegaCardShadow,
  },
  sensorClose:      { position: 'absolute', top: 8, right: 10 },
  sensorCloseText:  { color: BegaColors.textMuted, fontSize: 15, fontWeight: '700' },
  sensorId:         { fontSize: 8, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 3 },
  sensorName:       { fontSize: 11, color: BegaColors.textPrimary, fontWeight: '700', marginBottom: 8, paddingRight: 18 },
  sensorStatusPill: {
    borderWidth: 1, borderRadius: 2,
    paddingHorizontal: 7, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  sensorStatusText: { fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 },

  readings: { marginTop: 2 },
  readingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BegaColors.cardBorder,
  },
  readingLabel: { fontSize: 8, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1 },
  readingVal:   { fontSize: 11, color: BegaColors.textPrimary, fontFamily: 'monospace', fontWeight: '700' },
  readingWarn:  { color: BegaColors.orangeBright },
  offlineMsg:   { fontSize: 9, color: BegaColors.coral, fontFamily: 'monospace', letterSpacing: 1, marginTop: 8 },

  // ── D-pad ──────────────────────────────────────────────────────────
  dpad: {
    position: 'absolute', bottom: 200, left: 16, alignItems: 'center',
  },
  dpadRow:    { flexDirection: 'row', alignItems: 'center' },
  dpadCenter: { width: 38, height: 38 },
  dpadBtn: {
    width: 42, height: 42, borderRadius: 4, margin: 2,
    backgroundColor: 'rgba(6,18,32,0.9)',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  dpadArrow: { color: BegaColors.cyan, fontSize: 16 },

  // ── Shop ───────────────────────────────────────────────────────────
  shopWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  shopToggle: {
    alignSelf: 'center', marginBottom: 4,
    backgroundColor: 'rgba(6,18,32,0.92)',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingHorizontal: 20, paddingVertical: 6,
  },
  shopToggleText: { color: BegaColors.cyan, fontSize: 9, fontFamily: 'monospace', letterSpacing: 2 },
  shopPanel: {
    backgroundColor: 'rgba(6,12,24,0.97)',
    borderTopWidth: 1, borderTopColor: BegaColors.cardBorder,
    paddingBottom: 20,
  },
  shopScroll: { paddingHorizontal: 12, paddingVertical: 10 },
  shopItem: {
    width: 74, alignItems: 'center', position: 'relative',
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, paddingVertical: 10, paddingHorizontal: 4,
    marginRight: 8,
  },
  shopItemActive: {
    borderColor: BegaColors.cyan,
    backgroundColor: 'rgba(36,118,181,0.18)',
  },
  shopItemDim:  { opacity: 0.38 },
  shopIcon:     { fontSize: 26, marginBottom: 4 },
  shopLabel:    { fontSize: 7, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 0.8, marginBottom: 2 },
  shopCost:     { fontSize: 9, color: BegaColors.gold, fontFamily: 'monospace', fontWeight: '700' },
  shopDot: {
    position: 'absolute', top: 5, right: 5,
    width: 6, height: 6, borderRadius: 3, backgroundColor: BegaColors.cyan,
  },
  cancelBtn: {
    marginHorizontal: 12, marginTop: 4,
    borderWidth: 1, borderColor: BegaColors.coral,
    borderRadius: 3, paddingVertical: 8, alignItems: 'center',
  },
  cancelBtnText: { color: BegaColors.coral, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 },

  // ── Loading ────────────────────────────────────────────────────────
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BegaColors.deep,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  loadingCard: {
    flexDirection: 'row',
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, overflow: 'hidden', width: '100%',
    ...BegaCardShadow,
  },
  loadingAccent: { width: 3, backgroundColor: BegaColors.cyan },
  loadingInner:  { flex: 1, padding: 24, alignItems: 'center' },
  loadingTag:    { fontSize: 9, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 },
  loadingTitle:  { fontSize: 24, fontWeight: '800', color: BegaColors.textPrimary, letterSpacing: 3, marginBottom: 8 },
  loadingSub:    { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1 },
});
