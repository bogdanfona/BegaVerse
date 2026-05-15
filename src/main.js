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

  if (page === 'simcity') initSimGrid();
  if (page === 'history') attachEraListeners();
  if (page === 'sensors') startLiveSensorSim();

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
      if (s.history.length >= 12) s.history.shift();
      s.history.push(s.ph);
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
  MOCK_DATA.sensors.forEach(s => {
    if (s.status === 'offline') return;
    setMetricDOM(s.id, 'ph',          String(s.ph),          s.ph > 7 ? 'good' : s.ph > 6.5 ? 'warning' : 'danger',                              (s.ph / 14 * 100).toFixed(1));
    setMetricDOM(s.id, 'turbidity',   s.turbidity + ' NTU',  s.turbidity < 20 ? 'good' : s.turbidity < 40 ? 'warning' : 'danger',               Math.min(s.turbidity / 80 * 100, 100).toFixed(1));
    setMetricDOM(s.id, 'temperature', s.temperature + '°C',  (s.temperature >= 10 && s.temperature <= 22) ? 'good' : s.temperature <= 26 ? 'warning' : 'danger', Math.min(s.temperature / 35 * 100, 100).toFixed(1));
    setMetricDOM(s.id, 'oxygen',      s.oxygen + ' mg/L',    s.oxygen >= 7 ? 'good' : s.oxygen >= 5 ? 'warning' : 'danger',                     Math.min(s.oxygen / 12 * 100, 100).toFixed(1));
  });
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

// ——— INIT ———

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
