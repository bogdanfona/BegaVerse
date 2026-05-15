// ===========================
// BegaVerse — Main App Logic
// ===========================

let currentPage = 'dashboard';
let currentTool = 'select';
let simGridData = {};
let simStats = { trees: 0, objects: 0 };

// ——— NAVIGATION ———

function navigate(page) {
  currentPage = page;
  const main = document.getElementById('main-content');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Render page
  main.innerHTML = Pages[page] ? Pages[page]() : '<p>Page not found</p>';

  // Post-render hooks
  if (page === 'simcity') initSimGrid();
  if (page === 'history') attachEraListeners();

  // Close sidebar on mobile
  closeSidebar();
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

// ——— INIT ———

document.addEventListener('DOMContentLoaded', () => {
  // Create sidebar overlay for mobile
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.onclick = closeSidebar;
  document.body.appendChild(overlay);

  // Initial page render
  navigate('dashboard');

  // Live clock for footer — subtle updates
  setInterval(() => {
    // Simulate live sensor tick
  }, 10000);
});
