// ===========================
// BegaVerse — Main App Logic
// ===========================

let currentPage = 'dashboard';
let currentTool = 'select';
let simGridData = {};
let simStats = { trees: 0, objects: 0 };
let liveDataInterval = null;
let liveSecondsElapsed = 0;

// ——— NAVIGATION ———

function navigate(page) {
  stopLiveSensorSim();
  if (window._bega3dCleanup) window._bega3dCleanup();
  currentPage = page;
  const main = document.getElementById('main-content');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  try {
    main.innerHTML = Pages[page] ? Pages[page]() : '<p>Page not found</p>';
  } catch (err) {
    main.innerHTML = '<div style="padding:32px"><div class="card" style="border-color:#EF535040"><div style="font-family:var(--font-mono);font-size:0.7rem;color:#EF5350;margin-bottom:8px;">RENDER ERROR — ' + page + '</div><pre style="color:rgba(232,244,253,0.6);font-size:0.72rem;white-space:pre-wrap;word-break:break-all;">' + err.stack + '</pre></div></div>';
    console.error('Page render error:', err);
  }

  if (page === 'simcity') setTimeout(initBega3D, 50);
  if (page === 'history') attachEraListeners();
  if (page === 'sensors') startLiveSensorSim();
  if (page === 'quests')  setTimeout(loadQuestsPage, 50);

  closeSidebar();
}

// ——— LIVE SENSOR SIMULATION ———

function startLiveSensorSim() {
  liveSecondsElapsed = 0;
  liveDataInterval = setInterval(() => {
    if (currentPage !== 'sensors') { stopLiveSensorSim(); return; }
    liveSecondsElapsed += 15;

    const tsEl = document.getElementById('last-updated-ts');
    if (tsEl) {
      tsEl.textContent = liveSecondsElapsed < 60
        ? `Live · ${liveSecondsElapsed}s ago`
        : `Live · ${Math.floor(liveSecondsElapsed / 60)}m ${liveSecondsElapsed % 60}s ago`;
    }

    MOCK_DATA.sensors.forEach(s => {
      if (s.status === 'offline') return;
      s.ph          = Math.max(6.0, Math.min(9.0, +((s.ph          + (Math.random() - 0.5) * 0.1 ).toFixed(1))));
      s.turbidity   = Math.max(1,   Math.round(s.turbidity   + (Math.random() - 0.5) * 2));
      s.temperature = Math.max(10,  Math.min(30, +((s.temperature + (Math.random() - 0.5) * 0.2 ).toFixed(1))));
      s.oxygen      = Math.max(4,   Math.min(12, +((s.oxygen      + (Math.random() - 0.5) * 0.1 ).toFixed(1))));
      s.waterLevel  = Math.max(50,  Math.min(280, Math.round(s.waterLevel + (Math.random() - 0.5) * 3)));
      if (s.history.length >= 12) s.history.shift();
      s.history.push(s.ph);
      if (s.waterLevelHistory.length >= 12) s.waterLevelHistory.shift();
      s.waterLevelHistory.push(s.waterLevel);
    });

    updateSensorDOMValues();
  }, 15000);
}

function stopLiveSensorSim() {
  if (liveDataInterval) { clearInterval(liveDataInterval); liveDataInterval = null; }
}

function setMetricDOM(sensorId, metric, displayVal, cls, pct) {
  const valEl = document.getElementById(`val-${sensorId}-${metric}`);
  const barEl = document.getElementById(`bar-${sensorId}-${metric}`);
  if (valEl) valEl.textContent = displayVal;
  if (barEl) { barEl.className = `sdc-metric-bar ${cls}`; barEl.style.width = pct + '%'; }
}

function updateSensorDOMValues() {
  var maxWL = 0;
  MOCK_DATA.sensors.forEach(s => {
    if (s.status === 'offline') return;
    setMetricDOM(s.id, 'ph',          String(s.ph),          s.ph > 7 ? 'good' : s.ph > 6.5 ? 'warning' : 'danger',                              (s.ph / 14 * 100).toFixed(1));
    setMetricDOM(s.id, 'turbidity',   s.turbidity + ' NTU',  s.turbidity < 20 ? 'good' : s.turbidity < 40 ? 'warning' : 'danger',               Math.min(s.turbidity / 80 * 100, 100).toFixed(1));
    setMetricDOM(s.id, 'temperature', s.temperature + '°C',  (s.temperature >= 10 && s.temperature <= 22) ? 'good' : s.temperature <= 26 ? 'warning' : 'danger', Math.min(s.temperature / 35 * 100, 100).toFixed(1));
    setMetricDOM(s.id, 'oxygen',      s.oxygen + ' mg/L',    s.oxygen >= 7 ? 'good' : s.oxygen >= 5 ? 'warning' : 'danger',                     Math.min(s.oxygen / 12 * 100, 100).toFixed(1));
    setMetricDOM(s.id, 'waterLevel',  s.waterLevel + ' cm',  s.waterLevel < 180 ? 'good' : s.waterLevel < 220 ? 'warning' : 'danger',           Math.min(s.waterLevel / 300 * 100, 100).toFixed(1));

    // Update water level overview gauge bars
    const wlBar = document.getElementById('wl-bar-' + s.id);
    const wlVal = document.getElementById('wl-val-' + s.id);
    const wlColor = s.waterLevel < 180 ? '#66BB6A' : s.waterLevel < 220 ? '#FFA726' : '#EF5350';
    if (wlBar) { wlBar.style.width = Math.min(s.waterLevel / 300 * 100, 100).toFixed(1) + '%'; wlBar.style.background = wlColor; }
    if (wlVal) { wlVal.textContent = s.waterLevel + ' cm'; wlVal.style.color = wlColor; }

    if (s.waterLevel > maxWL) maxWL = s.waterLevel;
  });

  // Update the aggregate water level display
  const activeSensors = MOCK_DATA.sensors.filter(s => s.status !== 'offline');
  const avgWL = activeSensors.length ? Math.round(activeSensors.reduce((a, s) => a + s.waterLevel, 0) / activeSensors.length) : 0;
  const wlStatusColor = maxWL >= 220 ? '#EF5350' : maxWL >= 180 ? '#FFA726' : '#66BB6A';
  const wlStatusText  = maxWL >= 220 ? 'FLOOD RISK' : maxWL >= 180 ? 'ELEVATED' : 'NORMAL';
  const avgEl  = document.getElementById('wl-avg-display');
  const badgeEl = document.getElementById('wl-status-badge');
  if (avgEl)  { avgEl.textContent = avgWL + ' cm'; avgEl.style.color = wlStatusColor; }
  if (badgeEl){ badgeEl.textContent = wlStatusText; badgeEl.style.color = wlStatusColor; badgeEl.style.borderColor = wlStatusColor + '80'; }
}

// ——— MOBILE SIDEBAR ———

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// ——— SENSOR DETAIL ———

function showSensorDetail(id) {
  const sensor = MOCK_DATA.sensors.find(s => s.id === id);
  if (!sensor) return;
  navigate('canal');
  setTimeout(() => {
    const el = document.getElementById('sensor-' + id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.borderColor = 'var(--bega-cyan)'; setTimeout(() => el.style.borderColor = '', 2000); }
  }, 100);
}

// ——— ERA DETAIL ———

function showEraDetail(year) {
  const era = MOCK_DATA.eras.find(e => e.year === year);
  if (!era) return;
  const panel = document.getElementById('era-detail');
  if (!panel) return;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="card" style="border-color:${era.color}40;animation:fadeSlideIn 0.3s ease forwards;">
      <div style="display:flex;align-items:flex-start;gap:16px;">
        <div style="font-size:3rem;flex-shrink:0;">${era.icon}</div>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.72rem;color:${era.color};margin-bottom:4px;">${era.year}</div>
          <div style="font-family:var(--font-display);font-size:1.4rem;color:#e8f4fd;margin-bottom:6px;">${era.label}</div>
          <div style="font-size:0.85rem;color:rgba(232,244,253,0.65);line-height:1.6;margin-bottom:12px;">${era.desc}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${era.facts.map(f => `<div class="badge" style="background:${era.color}18;border:1px solid ${era.color}30;color:${era.color};">${f}</div>`).join('')}
          </div>
          <div style="margin-top:14px;">
            <div class="card-label">QR Code</div>
            <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(79,195,247,0.06);border:1px solid var(--bega-border);border-radius:8px;padding:8px 14px;font-family:var(--font-mono);font-size:0.78rem;color:var(--bega-cyan);">
              <div style="width:32px;height:32px;border:2px solid ${era.color};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:8px;color:${era.color};">QR</div>
              ${era.qr}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function attachEraListeners() {
  // QR cards already use onclick — nothing extra needed
}

// ——— SIMCITY GRID ———

const GRID_COLS = 18;
const GRID_ROWS = 8;
// Row 3-4 = water, rest = land banks
const WATER_ROWS = [3, 4];

const TOOL_EMOJI = {
  select: null,
  tree: '🌳',
  bench: '🪑',
  flower: '🌸',
  lamp: '💡',
  erase: null
};

function getCellType(row) {
  if (WATER_ROWS.includes(row)) return 'water';
  return 'land-empty';
}

function initSimGrid() {
  const wrap = document.getElementById('sim-grid-wrap');
  if (!wrap) return;

  const cols = GRID_COLS;
  const rows = GRID_ROWS;

  // Build initial grid data
  if (Object.keys(simGridData).length === 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}-${c}`;
        simGridData[key] = { type: getCellType(r), content: null };
      }
    }
  }

  renderSimGrid();
}

function renderSimGrid() {
  const wrap = document.getElementById('sim-grid-wrap');
  if (!wrap) return;

  const cellSize = Math.min(36, Math.floor((wrap.offsetWidth - 20) / GRID_COLS));

  let html = `<div class="sim-grid" style="grid-template-columns:repeat(${GRID_COLS},${cellSize}px);grid-template-rows:repeat(${GRID_ROWS},${cellSize}px);width:fit-content;">`;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const key = `${r}-${c}`;
      const cell = simGridData[key];
      const isWater = WATER_ROWS.includes(r);
      let cls = isWater ? 'water' : (cell.content ? 'land-' + contentClass(cell.content) : 'land-empty');
      html += `<div class="sim-cell ${cls}" onclick="simClick(${r},${c})" title="${isWater ? 'Canal water' : 'Land parcel'}">${cell.content ? TOOL_EMOJI[cell.content] || '' : (isWater ? (c % 4 === 0 ? '〜' : '') : '')}</div>`;
    }
  }

  html += '</div>';
  wrap.innerHTML = html;
  updateSimStats();
}

function contentClass(content) {
  if (content === 'tree' || content === 'flower') return 'tree';
  if (content === 'bench') return 'bench';
  if (content === 'lamp') return 'bench';
  return 'park';
}

function simClick(row, col) {
  const key = `${row}-${col}`;
  const cell = simGridData[key];
  const isWater = WATER_ROWS.includes(row);
  const status = document.getElementById('sim-status');

  if (isWater) {
    if (status) status.textContent = '💧 This is the Bega Canal — cannot build here.';
    return;
  }

  if (currentTool === 'select') {
    if (status) status.textContent = cell.content ? `Cell (${row},${col}): ${cell.content}` : `Cell (${row},${col}): empty land`;
    return;
  }

  if (currentTool === 'erase') {
    if (cell.content) {
      const was = cell.content;
      cell.content = null;
      if (status) status.textContent = `🗑️ Removed ${was} from (${row},${col})`;
    }
  } else {
    cell.content = currentTool;
    if (status) status.textContent = `${TOOL_EMOJI[currentTool]} Placed ${currentTool} at (${row},${col})`;
  }

  renderSimGrid();
}

function selectTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.sim-tool').forEach(el => {
    el.classList.toggle('active', el.dataset.tool === tool);
  });
}

function updateSimStats() {
  const cells = Object.values(simGridData);
  const trees = cells.filter(c => c.content === 'tree' || c.content === 'flower').length;
  const objects = cells.filter(c => c.content && c.content !== 'tree' && c.content !== 'flower').length;
  const total = trees + objects;

  const treesEl = document.getElementById('stat-trees');
  const objsEl = document.getElementById('stat-objects');
  const co2El = document.getElementById('stat-co2');
  const scoreEl = document.getElementById('stat-score');

  if (treesEl) treesEl.textContent = trees;
  if (objsEl) objsEl.textContent = objects;
  if (co2El) co2El.textContent = (trees * 21) + ' kg';
  if (scoreEl) scoreEl.textContent = trees * 10 + objects * 5;
}

// ——— SENSOR PLACEMENT ———

function getNextSensorId() {
  const nums = MOCK_DATA.sensors.map(s => parseInt(s.id.replace('S', '')) || 0);
  return 'S' + String(Math.max(...nums, 0) + 1).padStart(3, '0');
}

function toggleAddSensorMode() {
  const overlay = document.getElementById('map-click-overlay');
  const hint    = document.getElementById('map-add-hint');
  const btn     = document.getElementById('btn-add-sensor');
  if (!overlay) return;

  const active = overlay.style.pointerEvents === 'all';
  overlay.style.pointerEvents = active ? 'none' : 'all';
  if (hint) hint.style.display = active ? 'none' : 'block';
  if (btn)  { btn.style.color = active ? '' : 'var(--bega-cyan)'; btn.style.borderColor = active ? '' : 'var(--bega-cyan)'; }
  if (active) cancelAddSensor();
}

function handleMapClick(event) {
  const overlay = document.getElementById('map-click-overlay');
  if (!overlay || overlay.style.pointerEvents !== 'all') return;

  const rect = overlay.getBoundingClientRect();
  const fx = (event.clientX - rect.left) / rect.width;   // 0..1 left→right
  const fy = (event.clientY - rect.top)  / rect.height;  // 0..1 top→bottom

  // Map SVG fraction to approximate Bega Canal lat/lon
  // Canal spans ~21.195E–21.237E west→east, ~45.753N at top
  const lon = parseFloat((21.195 + fx * 0.042).toFixed(4));
  const lat = parseFloat((45.753 - fy * 0.010).toFixed(4));

  showSensorPlacementForm(lat, lon);
}

function showSensorPlacementForm(lat, lon) {
  const formDiv = document.getElementById('sensor-placement-form');
  if (!formDiv) return;
  const id = getNextSensorId();

  formDiv.style.display = 'block';
  formDiv.innerHTML =
    '<div class="card" style="border-color:var(--bega-cyan);animation:fadeSlideIn 0.2s ease forwards;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<div class="card-title"><span class="dot" style="background:var(--bega-cyan);"></span>New Sensor &mdash; ' + id + '</div>' +
        '<div class="badge badge-online" style="display:inline-flex;align-items:center;gap:5px;"><span class="pulse-dot" style="width:5px;height:5px;flex-shrink:0;"></span>Will go online</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +
        '<div>' +
          '<div class="card-label" style="margin-bottom:6px;">Sensor Name</div>' +
          '<input id="new-sensor-name" type="text" placeholder="e.g. Podul Traian"' +
          ' style="width:100%;background:rgba(79,195,247,0.06);border:1px solid var(--bega-border);' +
          'border-radius:8px;padding:8px 12px;color:#e8f4fd;font-family:var(--font-mono);font-size:0.82rem;' +
          'outline:none;box-sizing:border-box;transition:border-color 0.2s;"' +
          ' onfocus="this.style.borderColor=\'var(--bega-cyan)\'"' +
          ' onblur="this.style.borderColor=\'var(--bega-border)\'"' +
          ' onkeydown="if(event.key===\'Enter\')confirmAddSensor(\'' + id + '\',' + lat + ',' + lon + ')">' +
        '</div>' +
        '<div>' +
          '<div class="card-label" style="margin-bottom:6px;">Coordinates</div>' +
          '<div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--bega-cyan);padding:8px 0;">' + lat + '&deg;N &middot; ' + lon + '&deg;E</div>' +
          '<div style="font-family:var(--font-mono);font-size:0.62rem;color:rgba(79,195,247,0.35);">Bega Canal &middot; Timi&#537;oara</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:rgba(79,195,247,0.04);border-radius:8px;padding:10px 14px;margin-bottom:16px;border:1px solid var(--bega-border);">' +
        '<div class="card-label" style="margin-bottom:8px;">Initial readings &mdash; simulated until physical sensor connects</div>' +
        '<div style="display:flex;gap:20px;flex-wrap:wrap;">' +
          '<span style="font-family:var(--font-mono);font-size:0.75rem;"><span style="color:rgba(79,195,247,0.5);">pH </span><span style="color:#66BB6A;">7.0</span></span>' +
          '<span style="font-family:var(--font-mono);font-size:0.75rem;"><span style="color:rgba(79,195,247,0.5);">Turbidity </span><span style="color:#66BB6A;">15 NTU</span></span>' +
          '<span style="font-family:var(--font-mono);font-size:0.75rem;"><span style="color:rgba(79,195,247,0.5);">Temp </span><span style="color:#66BB6A;">18.0&deg;C</span></span>' +
          '<span style="font-family:var(--font-mono);font-size:0.75rem;"><span style="color:rgba(79,195,247,0.5);">O&#8322; </span><span style="color:#66BB6A;">8.0 mg/L</span></span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn" onclick="confirmAddSensor(\'' + id + '\',' + lat + ',' + lon + ')" style="font-size:0.8rem;padding:8px 18px;">&#10003; Place Sensor</button>' +
        '<button class="btn btn-ghost" onclick="cancelAddSensor()" style="font-size:0.8rem;padding:8px 16px;">Cancel</button>' +
      '</div>' +
    '</div>';

  formDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { const inp = document.getElementById('new-sensor-name'); if (inp) inp.focus(); }, 80);
}

function confirmAddSensor(id, lat, lon) {
  const nameInput = document.getElementById('new-sensor-name');
  const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Sensor ' + id;

  const ph          = parseFloat((7.0  + (Math.random() - 0.5) * 0.6).toFixed(1));
  const turbidity   = Math.round(15   + (Math.random() - 0.5) * 10);
  const temperature = parseFloat((18.0 + (Math.random() - 0.5) * 2.0).toFixed(1));
  const oxygen      = parseFloat((8.0  + (Math.random() - 0.5) * 1.0).toFixed(1));
  const history     = Array.from({ length: 12 }, () => parseFloat((ph + (Math.random() - 0.5) * 0.3).toFixed(1)));

  MOCK_DATA.sensors.push({ id, name, lat, lon, status: 'online', ph, turbidity, temperature, oxygen, history, custom: true });

  navigate('sensors');
}

function cancelAddSensor() {
  const formDiv = document.getElementById('sensor-placement-form');
  if (formDiv) formDiv.style.display = 'none';
}

// ——— 3D CANAL VIEW ———

const SHOP_COSTS  = { tree:500, bench:200, flowers:150, lamp:300, fountain:800 };
const SHOP_SCORES = { tree:20,  bench:8,   flowers:5,   lamp:6,   fountain:15  };
const SHOP_CO2    = { tree:21,  bench:0,   flowers:1,   lamp:0,   fountain:0   };
const SHOP_ICONS  = { tree:'🌳', bench:'🪑', flowers:'🌸', lamp:'💡', fountain:'⛲' };

let _bega3dMoveInterval = null;
let _bega3dBudget = 5000;
let _bega3dPlaced = 0;
let _bega3dScore  = 0;
let _bega3dCO2    = 0;
let _selectedShopItem = null;

function bega3dStartMove(dir) {
  bega3dMove(dir);
  _bega3dMoveInterval = setInterval(() => bega3dMove(dir), 100);
}

function bega3dStopMove() {
  if (_bega3dMoveInterval) { clearInterval(_bega3dMoveInterval); _bega3dMoveInterval = null; }
}

function bega3dMove(dir) {
  if (!window._bega3dState) return;
  const s = window._bega3dState;
  if (dir === 'forward')  s.camZ -= 4;
  if (dir === 'backward') s.camZ += 4;
  if (dir === 'left')     s.camAngleY = Math.max(-0.52, s.camAngleY - 0.12);
  if (dir === 'right')    s.camAngleY = Math.min(0.52,  s.camAngleY + 0.12);
  s.camZ = Math.max(-220, Math.min(220, s.camZ));
  s.updateCamera();
}

function selectShopItem(id) {
  _selectedShopItem = (id === null || _selectedShopItem === id) ? null : id;
  ['tree','bench','flowers','lamp','fountain'].forEach(iid => {
    const btn = document.getElementById('shop-btn-' + iid);
    if (!btn) return;
    const on = _selectedShopItem === iid;
    btn.style.borderColor = on ? '#2476B5' : 'rgba(36,118,181,0.45)';
    btn.style.color       = on ? '#4FC3F7' : 'rgba(79,195,247,0.9)';
    btn.style.background  = on ? 'rgba(36,118,181,0.18)' : 'rgba(3,12,24,0.88)';
  });
  const hint = document.getElementById('place-hint');
  if (hint) {
    hint.style.display = _selectedShopItem ? 'block' : 'none';
    if (_selectedShopItem) hint.textContent = 'CLICK BANK TO PLACE ' + SHOP_ICONS[_selectedShopItem] + ' (€' + SHOP_COSTS[_selectedShopItem] + ') · ESC TO CANCEL';
  }
  const cv = document.getElementById('bega-3d-canvas');
  if (cv) cv.style.cursor = _selectedShopItem ? 'cell' : 'crosshair';
}

function bega3dUpdateStats() {
  [
    ['shop-budget', '€' + _bega3dBudget.toLocaleString()],
    ['shop-placed', _bega3dPlaced + (_bega3dPlaced === 1 ? ' item' : ' items')],
    ['stat-budget', _bega3dBudget.toLocaleString()],
    ['stat-placed', _bega3dPlaced],
    ['stat-green',  _bega3dScore],
    ['stat-co2-3d', _bega3dCO2],
  ].forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
}

function initBega3D() {
  if (typeof THREE === 'undefined') {
    const c = document.getElementById('bega-3d-container');
    if (c) c.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-mono);color:rgba(79,195,247,0.4);">THREE.JS NOT LOADED</div>';
    return;
  }
  const canvas = document.getElementById('bega-3d-canvas');
  if (!canvas) return;
  const container = canvas.parentElement;

  // Reset shop state on each page load
  _bega3dBudget = 5000; _bega3dPlaced = 0; _bega3dScore = 0; _bega3dCO2 = 0; _selectedShopItem = null;
  bega3dUpdateStats();

  // ── Real Bega canal centerline — derived from OSM Way 23620260 + adjacent ways
  // Center: lat 45.748°N, lon 21.230°E  |  scale: ~21m/unit
  // Z = east (larger Z = further east),  X = north offset from scene center
  // Path: canal flows SW→NE through city, then curves SE after Podul Muncii
  const BEGA_WP = [
    [-240, -74], [-210, -64], [-180, -53], [-150, -38],
    [-120, -22], [ -90,  -8], [ -60,   8], [ -30,  20],
    [   0,  30], [  30,  42], [  60,  56], [  90,  72],
    [ 120,  84], [ 150,  86], [ 180,  78], [ 210,  62],
    [ 240,  42]
  ];

  function cX(z) {
    if (z <= BEGA_WP[0][0]) return BEGA_WP[0][1];
    if (z >= BEGA_WP[BEGA_WP.length-1][0]) return BEGA_WP[BEGA_WP.length-1][1];
    for (let i = 0; i < BEGA_WP.length - 1; i++) {
      const [z0, x0] = BEGA_WP[i], [z1, x1] = BEGA_WP[i+1];
      if (z >= z0 && z <= z1) return x0 + (z - z0) / (z1 - z0) * (x1 - x0);
    }
    return 0;
  }
  function cXd(z) {
    for (let i = 0; i < BEGA_WP.length - 1; i++) {
      const [z0, x0] = BEGA_WP[i], [z1, x1] = BEGA_WP[i+1];
      if (z >= z0 && z <= z1) return (x1 - x0) / (z1 - z0);
    }
    return 0;
  }

  // Ribbon geometry: mesh strip following canal curve
  function createRibbon(leftFn, rightFn, segs, y) {
    const v = [], idx = [], uv = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, z = -240 + t * 480;
      v.push(leftFn(z), y, z, rightFn(z), y, z);
      uv.push(0, t, 1, t);
      if (i < segs) { const b = i*2; idx.push(b, b+2, b+1, b+1, b+2, b+3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ── Scene ──
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaec8d8);
  scene.fog = new THREE.Fog(0xaec8d8, 60, 145);

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(52, container.offsetWidth / container.offsetHeight, 0.1, 300);

  // ── Lights ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.58));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
  sun.position.set(18, 35, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(2048);
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top  =  80; sun.shadow.camera.bottom = -80;
  sun.shadow.camera.far  = 200;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc8dff0, 0.3);
  fill.position.set(-12, 12, -8);
  scene.add(fill);

  // ── Materials ──
  const M = {
    ground:    new THREE.MeshLambertMaterial({ color: 0xc8c4b8 }),
    canal:     new THREE.MeshLambertMaterial({ color: 0x4a8dbf, transparent: true, opacity: 0.90 }),
    wall:      new THREE.MeshLambertMaterial({ color: 0xc4c0b4 }),
    green:     new THREE.MeshLambertMaterial({ color: 0x6B9945 }),
    path:      new THREE.MeshLambertMaterial({ color: 0xbab6aa }),
    bridge:    new THREE.MeshLambertMaterial({ color: 0xb0aca4 }),
    trunk:     new THREE.MeshLambertMaterial({ color: 0x7a5c2a }),
    bench:     new THREE.MeshLambertMaterial({ color: 0x8B5A2B }),
    lamp:      new THREE.MeshLambertMaterial({ color: 0x606468 }),
    lamp_glow: new THREE.MeshBasicMaterial({  color: 0xFFE87C }),
    soil:      new THREE.MeshLambertMaterial({ color: 0x5a3a1a }),
    stone:     new THREE.MeshLambertMaterial({ color: 0xd0ccc0 }),
    spray:     new THREE.MeshBasicMaterial({  color: 0x88CCFF, transparent: true, opacity: 0.52 }),
    water_top: new THREE.MeshBasicMaterial({  color: 0x4a90d9, transparent: true, opacity: 0.65 }),
  };
  const canopyMats = [0x3D8B37, 0x4A9B3F, 0x2E7A2A, 0x5AAA48, 0x3F9040].map(c => new THREE.MeshLambertMaterial({ color: c }));
  const buildMats  = [0xeeeae0, 0xe2dfd8, 0xf0ece4, 0xd8d4cc].map(c => new THREE.MeshLambertMaterial({ color: c }));
  const flowerMats = [0xFF69B4, 0xFF3333, 0xFFAA22, 0xFF88CC, 0xFFDD00, 0xCC44FF].map(c => new THREE.MeshLambertMaterial({ color: c }));

  // ── Ground ──
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(100, 600), M.ground);
  gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true;
  scene.add(gnd);

  // ── Canal water (curved) ──
  const CW = 7.5;
  const canalMesh = new THREE.Mesh(createRibbon(z => cX(z)-CW/2, z => cX(z)+CW/2, 120, 0.22), M.canal);
  canalMesh.receiveShadow = true;
  scene.add(canalMesh);

  // ── Retaining walls ──
  const WW = 0.3;
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)-CW/2-WW, z => cX(z)-CW/2,    100, 0.00), M.wall));
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)+CW/2,    z => cX(z)+CW/2+WW, 100, 0.00), M.wall));
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)-CW/2-WW, z => cX(z)-CW/2,    100, 0.55), M.wall));
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)+CW/2,    z => cX(z)+CW/2+WW, 100, 0.55), M.wall));

  // ── Concrete paths ──
  const PO = 4.8, PW = 2.0;
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)-PO-PW, z => cX(z)-PO,    100, 0.04), M.path));
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)+PO,    z => cX(z)+PO+PW, 100, 0.04), M.path));

  // ── Green promenades ──
  const GRO = 7.0, GRW = 10;
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)-GRO-GRW, z => cX(z)-GRO, 80, 0.02), M.green));
  scene.add(new THREE.Mesh(createRibbon(z => cX(z)+GRO,     z => cX(z)+GRO+GRW, 80, 0.02), M.green));

  // ── Decorative trees ──
  function makeDecTree(x, z) {
    const g = new THREE.Group();
    const th = 0.9 + Math.random()*0.6;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, th, 7), M.trunk);
    tr.position.y = th/2; tr.castShadow = true; g.add(tr);
    const cr = 0.65 + Math.random()*0.45;
    const cn = new THREE.Mesh(new THREE.SphereGeometry(cr, 9, 7), canopyMats[Math.floor(Math.random()*5)]);
    cn.position.y = th + cr*0.65; cn.castShadow = true; g.add(cn);
    g.position.set(x, 0, z);
    scene.add(g);
  }
  for (let z = -230; z <= 230; z += 5.5) {
    const cx = cX(z), j = (Math.random()-0.5)*1.5;
    makeDecTree(cx - 8.5  + (Math.random()-0.5)*0.8, z+j);
    makeDecTree(cx - 12.5 + (Math.random()-0.5)*1.0, z+j+2);
    makeDecTree(cx + 8.5  + (Math.random()-0.5)*0.8, z-j);
    makeDecTree(cx + 12.5 + (Math.random()-0.5)*1.0, z-j+2);
  }

  // ── Buildings — x is offset from canal centre (cX(z) + x keeps them on the correct bank) ──
  [
    [-22,-115,12,14,13],[-27,-92,8,10,9],[-20,-68,14,21,16],[-24,-44,9,13,11],
    [-21,-20,11,17,13], [-26,  6,8,10,9],[-22, 34,13,24,15],[-27, 60,8,12,10],
    [-20, 88,12,17,14], [-25,115,7,11,8],[-22,142,14,26,17],[-27,170,9,14,11],
    [ 22,-115,12,13,13],[ 27,-88,8,19,9],[ 20,-65,14,17,16],[ 24,-40,9,12,11],
    [ 21,-15,11,21,13], [ 26, 12,8,10,9],[ 22, 40,13,16,15],[ 27, 67,8,13,10],
    [ 20,102,12,18,14], [ 25,130,7,10,8],[ 22,160,14,23,17],
  ].forEach(([x,z,w,h,d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildMats[Math.floor(Math.random()*4)]);
    m.position.set(cX(z) + x, h/2, z); m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  });

  // ── Real Bega bridges — Z positions derived from OSM; rotated perpendicular to canal ──
  [
    { z:-185, name:'Podul Mihai Viteazul' },
    { z:-120, name:'Podul Dacilor'        },
    { z: -68, name:'Podul Decebal'        },
    { z: -18, name:'Podul Michelangelo'   },
    { z:  32, name:'Podul Eroilor'        },
    { z: 118, name:'Podul Muncii'         },
  ].forEach(({ z }) => {
    const cx = cX(z), angle = -Math.atan2(cXd(z), 1);
    const bg = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 3.5), M.bridge);
    deck.castShadow = true; deck.receiveShadow = true; bg.add(deck);
    [-9, -5.5, 5.5, 9].forEach(rx => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 0.22), M.bridge);
      post.position.set(rx, 0.92, 0); bg.add(post);
    });
    [-9.5, 9.5].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3.5), M.bridge);
      rail.position.set(rx, 1.6, 0); bg.add(rail);
    });
    bg.position.set(cx, 0.55, z); bg.rotation.y = angle;
    scene.add(bg);
  });

  // ── Bank hit planes for item placement ──
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
  const lHit = new THREE.Mesh(createRibbon(z => cX(z)-20,      z => cX(z)-PO-0.5, 80, 0.18), hitMat);
  const rHit = new THREE.Mesh(createRibbon(z => cX(z)+PO+0.5,  z => cX(z)+20,     80, 0.18), hitMat);
  scene.add(lHit); scene.add(rHit);
  const hitPlanes = [lHit, rHit];

  // ── 3D item creators ──
  function make3DTree(x, z) {
    const g = new THREE.Group();
    const th = 1.1 + Math.random()*0.5;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, th, 7), M.trunk);
    tr.position.y = th/2; tr.castShadow = true; g.add(tr);
    const cr = 0.75 + Math.random()*0.4;
    const cn = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 8), canopyMats[Math.floor(Math.random()*5)]);
    cn.position.y = th + cr*0.65; cn.castShadow = true; g.add(cn);
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function make3DBench(x, z) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.5), M.bench);
    seat.position.y = 0.46; seat.castShadow = true; g.add(seat);
    [-0.75, 0.75].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.46), M.bench);
      leg.position.set(lx, 0.23, 0); g.add(leg);
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), M.bench);
    back.position.set(0, 0.72, -0.22); back.castShadow = true; g.add(back);
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function make3DFlowers(x, z) {
    const g = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.15, 12), M.soil);
    bed.position.y = 0.075; g.add(bed);
    for (let i = 0; i < 10; i++) {
      const ang = (i/10)*Math.PI*2 + Math.random()*0.4, r = 0.2 + Math.random()*0.5;
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 6), flowerMats[i%6]);
      f.position.set(Math.cos(ang)*r, 0.28, Math.sin(ang)*r); g.add(f);
    }
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function make3DLamp(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 4.2, 7), M.lamp);
    pole.position.y = 2.1; pole.castShadow = true; g.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), M.lamp);
    arm.position.set(0.38, 4.0, 0); arm.rotation.z = Math.PI/2.3; g.add(arm);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), M.lamp_glow);
    head.position.set(0.7, 4.15, 0); g.add(head);
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function make3DFountain(x, z) {
    const g = new THREE.Group();
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.2, 0.28, 16), M.stone);
    basin.position.y = 0.14; g.add(basin);
    const wt = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.05, 16), M.water_top);
    wt.position.y = 0.27; g.add(wt);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8), M.stone);
    col.position.y = 0.88; g.add(col);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.18, 12), M.stone);
    top.position.y = 1.58; g.add(top);
    const spray = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 8, 1, true), M.spray);
    spray.position.y = 2.12; g.add(spray);
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  const makers = { tree: make3DTree, bench: make3DBench, flowers: make3DFlowers, lamp: make3DLamp, fountain: make3DFountain };

  // ── Camera state ──
  const state = { camZ: 0, camAngleY: 0 };
  window._bega3dState = state;
  state.updateCamera = function() {
    const cx = cX(state.camZ);
    const lookZ = state.camZ - 18;
    const lookX = cX(lookZ) + Math.sin(state.camAngleY) * 12;
    camera.position.set(cx + Math.sin(state.camAngleY) * 3, 8, state.camZ + 9);
    camera.lookAt(lookX, 1.5, lookZ);
    const lat = (45.7530 - state.camZ/12000).toFixed(4);
    const lon = (21.2160 + state.camZ/16000).toFixed(4);
    const el = document.getElementById('bega3d-coords');
    if (el) el.textContent = 'LAT ' + lat + '° · LON ' + lon + '°';
  };
  state.updateCamera();

  // ── Keyboard ──
  const onKey = (e) => {
    if (!document.getElementById('bega-3d-canvas')) { document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape') { selectShopItem(null); return; }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowUp'   || e.key === 'w' || e.key === 'W') state.camZ -= 4;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.camZ += 4;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.camAngleY = Math.max(-0.52, state.camAngleY - 0.12);
    if (e.key === 'ArrowRight'|| e.key === 'd' || e.key === 'D') state.camAngleY = Math.min(0.52,  state.camAngleY + 0.12);
    state.camZ = Math.max(-220, Math.min(220, state.camZ));
    state.updateCamera();
  };
  document.addEventListener('keydown', onKey);

  // ── Click: place items on bank ──
  const raycaster = new THREE.Raycaster();
  const mouse2 = new THREE.Vector2();
  canvas.addEventListener('click', (e) => {
    if (!_selectedShopItem) return;
    const rect = canvas.getBoundingClientRect();
    mouse2.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    mouse2.y = -((e.clientY - rect.top)  / rect.height) *  2 + 1;
    raycaster.setFromCamera(mouse2, camera);
    const hits = raycaster.intersectObjects(hitPlanes);
    if (!hits.length) return;
    const cost = SHOP_COSTS[_selectedShopItem];
    if (_bega3dBudget < cost) {
      const bel = document.getElementById('shop-budget');
      if (bel) { bel.style.color = '#B82828'; setTimeout(() => { bel.style.color = '#C8A020'; }, 700); }
      return;
    }
    const pt = hits[0].point;
    makers[_selectedShopItem](pt.x, pt.z);
    _bega3dBudget -= cost; _bega3dPlaced++;
    _bega3dScore  += SHOP_SCORES[_selectedShopItem];
    _bega3dCO2    += SHOP_CO2[_selectedShopItem];
    bega3dUpdateStats();
    if (_bega3dBudget < cost) selectShopItem(null);
  });

  // ── Render loop ──
  let animId;
  const clock = new THREE.Clock();
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    M.canal.color.setRGB(0.28 + Math.sin(t*0.7)*0.022, 0.55 + Math.sin(t*0.5)*0.018, 0.75 + Math.sin(t*0.9)*0.028);
    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ──
  const ro = new ResizeObserver(() => {
    if (!container.isConnected) { ro.disconnect(); return; }
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  // ── Cleanup ──
  window._bega3dCleanup = () => {
    cancelAnimationFrame(animId);
    document.removeEventListener('keydown', onKey);
    bega3dStopMove();
    ro.disconnect();
    renderer.dispose();
    delete window._bega3dState;
    delete window._bega3dCleanup;
  };
}

// ——— QUESTS PAGE ───────────────────────────────────────────────────────────

const QUEST_USER_ID = 'user_bogdan';

async function loadQuestsPage() {
  try {
    const [defs, progress, balance] = await Promise.all([
      BegaFirebase.fetchQuestDefinitions(),
      BegaFirebase.fetchUserQuestProgress(QUEST_USER_ID),
      BegaFirebase.fetchWalletBalance(QUEST_USER_ID),
    ]);

    // Update wallet
    const walletEl = document.getElementById('wallet-pts');
    if (walletEl) walletEl.textContent = Number(balance).toLocaleString();

    // Compute stats
    let active = 0, done = 0, ptsEarned = 0;
    defs.forEach(q => {
      const p = progress[q.id];
      if (p && p.completed) { done++; ptsEarned += q.reward; }
      else if (p && p.progress > 0) active++;
    });
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('stat-active', active);
    setEl('stat-done', done);
    setEl('stat-pts-earned', ptsEarned.toLocaleString());

    // Render quest list
    const list = document.getElementById('quest-list');
    if (!list) return;

    if (defs.length === 0) {
      list.innerHTML = '<div class="alert alert-info"><div class="alert-icon">ℹ️</div><div>No quests found in Firebase yet. Open the mobile app first to seed the quest definitions.</div></div>';
      return;
    }

    list.innerHTML = defs.map(q => {
      const p        = progress[q.id] || {};
      const current  = p.progress || 0;
      const completed = p.completed || false;
      const pct      = Math.min((current / q.maxProgress) * 100, 100).toFixed(1);
      const barColor = completed ? '#66BB6A' : '#2476B5';
      const accentColor = completed ? '#66BB6A' : '#C08420';

      return `<div class="card" style="border-left:3px solid ${accentColor};margin-bottom:12px;padding:18px;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
          <span style="font-size:1.8rem;">${q.icon || '🎯'}</span>
          <div style="flex:1;">
            <div style="font-size:0.98rem;font-weight:600;color:#e8f4fd;margin-bottom:2px;">${q.title}</div>
            <div style="font-family:var(--font-mono);font-size:0.62rem;color:rgba(232,244,253,0.35);letter-spacing:1.5px;">${(q.category || '').toUpperCase()}</div>
          </div>
          <div style="font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:${completed ? '#66BB6A' : '#C08420'};
            background:${completed ? 'rgba(102,187,106,0.1)' : 'rgba(192,132,32,0.1)'};
            border:1px solid ${completed ? 'rgba(102,187,106,0.35)' : 'rgba(192,132,32,0.35)'};
            padding:4px 10px;border-radius:3px;white-space:nowrap;">
            ${completed ? '✓ DONE' : '+' + q.reward + ' PTS'}
          </div>
        </div>
        <div style="font-size:0.84rem;color:rgba(232,244,253,0.5);margin-bottom:14px;line-height:1.5;">${q.description}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="flex:1;height:3px;background:rgba(36,118,181,0.3);border-radius:2px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${barColor};border-radius:2px;transition:width 0.6s;"></div>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.72rem;color:rgba(232,244,253,0.4);">${current}/${q.maxProgress}</span>
        </div>
        ${completed ? `<div style="margin-top:12px;background:rgba(102,187,106,0.07);border:1px solid rgba(102,187,106,0.2);border-radius:3px;padding:8px 12px;text-align:center;font-family:var(--font-mono);font-size:0.72rem;color:#66BB6A;letter-spacing:1px;">QUEST COMPLETE · ${q.reward} PTS EARNED</div>` : ''}
      </div>`;
    }).join('');

  } catch (err) {
    console.error('loadQuestsPage error:', err);
    const list = document.getElementById('quest-list');
    if (list) list.innerHTML = '<div class="alert" style="border-color:#EF535040;"><div class="alert-icon">⚠️</div><div>Could not load quests from Firebase. Check console for details.</div></div>';
  }
}

// ——— INIT ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  window.onerror = (msg, src, line, col, err) => {
    const main = document.getElementById('main-content');
    if (main && !main.innerHTML.trim()) {
      main.innerHTML = '<div style="padding:32px"><div class="card" style="border-color:#EF535040"><div style="font-family:var(--font-mono);font-size:0.7rem;color:#EF5350;margin-bottom:8px;">GLOBAL JS ERROR</div><pre style="color:rgba(232,244,253,0.6);font-size:0.72rem;white-space:pre-wrap;">' + msg + '\n' + src + ':' + line + ':' + col + '</pre></div></div>';
    }
    console.error('Global error:', msg, src, line, col, err);
  };

  // Create sidebar overlay for mobile
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.onclick = closeSidebar;
  document.body.appendChild(overlay);

  // Block default href="#" scroll on nav links so navigate() runs cleanly
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => e.preventDefault());
  });

  navigate('dashboard');
});
