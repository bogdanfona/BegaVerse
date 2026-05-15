// ===========================
// BegaVerse — Page Renderers
// ===========================

function sensorColor(metric, val) {
  if (metric === 'ph')          return val > 7    ? '#66BB6A' : val > 6.5  ? '#FFA726' : '#EF5350';
  if (metric === 'turbidity')   return val < 20   ? '#66BB6A' : val < 40   ? '#FFA726' : '#EF5350';
  if (metric === 'temperature') return (val >= 10 && val <= 22) ? '#66BB6A' : val <= 26 ? '#FFA726' : '#EF5350';
  if (metric === 'oxygen')      return val >= 7   ? '#66BB6A' : val >= 5   ? '#FFA726' : '#EF5350';
  return '#4FC3F7';
}

function sensorClass(metric, val) {
  if (metric === 'ph')          return val > 7    ? 'good' : val > 6.5  ? 'warning' : 'danger';
  if (metric === 'turbidity')   return val < 20   ? 'good' : val < 40   ? 'warning' : 'danger';
  if (metric === 'temperature') return (val >= 10 && val <= 22) ? 'good' : val <= 26 ? 'warning' : 'danger';
  if (metric === 'oxygen')      return val >= 7   ? 'good' : val >= 5   ? 'warning' : 'danger';
  return 'good';
}

function renderSensorCard(s) {
  var sId = s.id;
  var sName = s.name;

  if (s.status === 'offline') {
    return '<div class="card" id="sensor-' + sId + '">' +
      '<div class="sdc-header"><div>' +
      '<div class="hash-cell" style="font-size:0.78rem;margin-bottom:3px;">' + sId + '</div>' +
      '<div style="font-size:0.98rem;font-weight:500;color:#e8f4fd;margin-bottom:4px;">' + sName + '</div>' +
      '<div style="font-family:var(--font-mono);font-size:0.65rem;color:rgba(79,195,247,0.35);">' + s.lat + 'N ' + s.lon + 'E</div>' +
      '</div><div class="badge badge-offline">offline</div></div>' +
      '<div style="padding:28px 0;text-align:center;">' +
      '<div style="font-size:2rem;opacity:0.2;margin-bottom:8px;">&#128225;</div>' +
      '<div style="font-family:var(--font-mono);font-size:0.78rem;color:rgba(232,244,253,0.2);">No data &mdash; sensor offline</div>' +
      '</div></div>';
  }

  var phCls   = sensorClass('ph',          s.ph);
  var turbCls = sensorClass('turbidity',   s.turbidity);
  var tempCls = sensorClass('temperature', s.temperature);
  var o2Cls   = sensorClass('oxygen',      s.oxygen);

  var phLbl   = s.ph > 7 ? 'Normal' : s.ph > 6.5 ? 'Acidic' : 'Critical';
  var turbLbl = s.turbidity < 20 ? 'Clear' : s.turbidity < 40 ? 'Murky' : 'Turbid';
  var tempLbl = (s.temperature >= 10 && s.temperature <= 22) ? 'Nominal' : s.temperature <= 26 ? 'Warm' : 'Hot';
  var o2Lbl   = s.oxygen >= 7 ? 'Good' : s.oxygen >= 5 ? 'Low' : 'Critical';

  var phPct   = ((s.ph / 14) * 100).toFixed(1);
  var turbPct = Math.min(s.turbidity / 80 * 100, 100).toFixed(1);
  var tempPct = Math.min(s.temperature / 35 * 100, 100).toFixed(1);
  var o2Pct   = Math.min(s.oxygen / 12 * 100, 100).toFixed(1);

  var badgeCls  = s.status === 'online' ? 'badge-online' : 'badge-warning';
  var pulseDot  = s.status === 'online' ? '<span class="pulse-dot" style="width:5px;height:5px;flex-shrink:0;"></span>' : '';
  var sparkHtml = s.history.length ? Charts.sparkline(s.history, 260, 44) : '';

  return '<div class="card" id="sensor-' + sId + '">' +
    '<div class="sdc-header"><div>' +
    '<div class="hash-cell" style="font-size:0.78rem;margin-bottom:3px;">' + sId + '</div>' +
    '<div style="font-size:0.98rem;font-weight:500;color:#e8f4fd;margin-bottom:4px;">' + sName + '</div>' +
    '<div style="font-family:var(--font-mono);font-size:0.65rem;color:rgba(79,195,247,0.35);">' + s.lat + 'N &middot; ' + s.lon + 'E</div>' +
    '</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">' +
    '<div class="badge ' + badgeCls + '" style="display:inline-flex;align-items:center;gap:5px;">' + pulseDot + s.status + '</div>' +
    '<div style="font-family:var(--font-mono);font-size:0.6rem;color:rgba(79,195,247,0.3);">ESP32 &middot; MQTT</div>' +
    '</div></div>' +
    '<div class="sdc-metrics">' +
      '<div class="sdc-metric-row">' +
        '<div class="sdc-metric-label">pH</div>' +
        '<div class="sdc-metric-bar-wrap"><div class="sdc-metric-bar ' + phCls + '" id="bar-' + sId + '-ph" style="width:' + phPct + '%"></div></div>' +
        '<div class="sdc-metric-value" id="val-' + sId + '-ph">' + s.ph + '</div>' +
        '<div class="sdc-metric-status ' + phCls + '">' + phLbl + '</div>' +
      '</div>' +
      '<div class="sdc-metric-row">' +
        '<div class="sdc-metric-label">Turbidity</div>' +
        '<div class="sdc-metric-bar-wrap"><div class="sdc-metric-bar ' + turbCls + '" id="bar-' + sId + '-turbidity" style="width:' + turbPct + '%"></div></div>' +
        '<div class="sdc-metric-value" id="val-' + sId + '-turbidity">' + s.turbidity + ' NTU</div>' +
        '<div class="sdc-metric-status ' + turbCls + '">' + turbLbl + '</div>' +
      '</div>' +
      '<div class="sdc-metric-row">' +
        '<div class="sdc-metric-label">Temp</div>' +
        '<div class="sdc-metric-bar-wrap"><div class="sdc-metric-bar ' + tempCls + '" id="bar-' + sId + '-temperature" style="width:' + tempPct + '%"></div></div>' +
        '<div class="sdc-metric-value" id="val-' + sId + '-temperature">' + s.temperature + '&#8451;</div>' +
        '<div class="sdc-metric-status ' + tempCls + '">' + tempLbl + '</div>' +
      '</div>' +
      '<div class="sdc-metric-row">' +
        '<div class="sdc-metric-label">O&#8322;</div>' +
        '<div class="sdc-metric-bar-wrap"><div class="sdc-metric-bar ' + o2Cls + '" id="bar-' + sId + '-oxygen" style="width:' + o2Pct + '%"></div></div>' +
        '<div class="sdc-metric-value" id="val-' + sId + '-oxygen">' + s.oxygen + ' mg/L</div>' +
        '<div class="sdc-metric-status ' + o2Cls + '">' + o2Lbl + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bega-border);">' +
      '<div style="font-family:var(--font-mono);font-size:0.6rem;color:rgba(79,195,247,0.4);letter-spacing:0.08em;margin-bottom:8px;">pH TREND &middot; LAST 12 READINGS</div>' +
      sparkHtml +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid rgba(79,195,247,0.08);">' +
      '<div style="font-family:var(--font-mono);font-size:0.6rem;color:rgba(79,195,247,0.35);">&#9679; Updated 2 min ago</div>' +
      '<div style="font-family:var(--font-mono);font-size:0.6rem;color:rgba(79,195,247,0.25);">10 min interval</div>' +
    '</div>' +
  '</div>';
}

const Pages = {

  // ——— OVERVIEW DASHBOARD ———
  dashboard() {
    const d = MOCK_DATA;
    const s = d.stats;
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · COMMAND DASHBOARD · SITREP</div>
        <h1 class="page-title">Bega River<br><em>Command</em></h1>
        <p class="page-subtitle">Operational overview — Timișoara Sector · Romania</p>
      </div>

      <!-- Key Metrics -->
      <div class="grid-4">
        <div class="card card-glow-cyan">
          <div class="card-label">Water Quality</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
            ${Charts.qualityRing(s.waterQuality, 80)}
            <div>
              <div style="font-size:0.8rem;color:rgba(232,244,253,0.5);margin-bottom:4px;">Overall index</div>
              <div class="badge badge-online">✓ Good</div>
            </div>
          </div>
        </div>

        <div class="card card-glow-cyan">
          <div class="card-label">Sensors Active</div>
          <div class="card-value">${s.sensorsOnline}<span class="card-unit">/ ${s.totalSensors}</span></div>
          <div class="card-trend neutral">MVP · ${s.totalSensors - s.sensorsOnline} planned</div>
          ${Charts.sparkline([3,3,4,3,4,4,4,4,4,4,4,4], 120, 36)}
        </div>

        <div class="card card-glow-green">
          <div class="card-label">AR Scans Today</div>
          <div class="card-value">${s.arScans}</div>
          <div class="card-trend up">↑ 23% vs yesterday</div>
          ${Charts.sparkline([180,210,190,245,220,280,295,310,330,340,338,342], 120, 36, '#66BB6A')}
        </div>

        <div class="card card-glow-green">
          <div class="card-label">Trees Planted</div>
          <div class="card-value">${s.treesPlanted}</div>
          <div class="card-trend up">↑ 3 this week (SimCity)</div>
          ${Charts.sparkline([40,44,46,48,51,55,57,59,61,63,65,67], 120, 36, '#66BB6A')}
        </div>
      </div>

      <!-- Canal Map -->
      <div class="section-title">Live Canal Overview</div>
      <div class="card" style="padding:0;margin-bottom:24px;">
        <div class="map-container" style="border:none;border-radius:14px;">
          ${Charts.canalMap(MOCK_DATA.sensors)}
          <div class="map-overlay">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <div class="map-badge"><span style="color:#66BB6A">●</span> 4 online</div>
              <div class="map-badge"><span style="color:#FFA726">●</span> 1 warning</div>
              <div class="map-badge"><span style="color:#EF5350">●</span> 1 offline</div>
            </div>
            <div style="display:flex;gap:8px;align-items:flex-end;">
              <div class="map-badge">📍 Timișoara · Bega Canal</div>
              <div class="map-badge" style="cursor:pointer;pointer-events:all" onclick="navigate('canal')">Full Map →</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sensors + Alerts row -->
      <div class="grid-2-3">
        <div class="card">
          <div class="card-title"><span class="dot"></span>Live Sensor Readings</div>
          <div class="sensor-row">
            <div class="sensor-item">
              <div class="sensor-name">pH Level</div>
              <div class="sensor-bar-wrap"><div class="sensor-bar good" style="width:72%"></div></div>
              <div class="sensor-val">7.2</div>
            </div>
            <div class="sensor-item">
              <div class="sensor-name">Turbidity</div>
              <div class="sensor-bar-wrap"><div class="sensor-bar warning" style="width:34%"></div></div>
              <div class="sensor-val">12 NTU</div>
            </div>
            <div class="sensor-item">
              <div class="sensor-name">Temperature</div>
              <div class="sensor-bar-wrap"><div class="sensor-bar good" style="width:60%"></div></div>
              <div class="sensor-val">18.4°C</div>
            </div>
            <div class="sensor-item">
              <div class="sensor-name">O₂ (dissolved)</div>
              <div class="sensor-bar-wrap"><div class="sensor-bar good" style="width:80%"></div></div>
              <div class="sensor-val">8.6 mg/L</div>
            </div>
          </div>
          <div style="margin-top:14px;">
            <button class="btn btn-ghost" style="font-size:0.78rem;padding:7px 14px" onclick="navigate('sensors')">
              View all sensors →
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--bega-amber)"></span>Alerts & Reports</div>
          ${MOCK_DATA.reports.slice(0, 3).map(r => `
            <div class="alert ${r.severity === 'high' ? 'alert-warn' : 'alert-info'}" style="margin-bottom:8px;">
              <div class="alert-icon">${r.type === 'Oil Spill' ? '🛢️' : r.type === 'Trash' ? '🗑️' : '💧'}</div>
              <div>
                <div style="font-weight:500;font-size:0.82rem;margin-bottom:2px;">${r.type} — ${r.location}</div>
                <div style="font-size:0.75rem;opacity:0.7">${r.time} · ${r.status}</div>
              </div>
              <div class="badge ${r.status === 'resolved' ? 'badge-online' : r.status === 'pending' ? 'badge-warning' : 'badge-offline'}" style="margin-left:auto;align-self:flex-start;font-size:0.65rem;">
                ${r.status}
              </div>
            </div>
          `).join('')}
          <button class="btn btn-ghost" style="font-size:0.78rem;padding:7px 14px;margin-top:4px" onclick="navigate('reports')">
            All reports →
          </button>
        </div>
      </div>

      <!-- Bottom stats -->
      <div class="grid-3">
        <div class="card">
          <div class="card-label">Blockchain Commits</div>
          <div class="card-value">${s.tokensOnChain.toLocaleString()}</div>
          <div class="card-trend neutral">Sepolia Testnet · Ethereum</div>
        </div>
        <div class="card">
          <div class="card-label">App Users</div>
          <div class="card-value">${s.activeUsers.toLocaleString()}</div>
          <div class="card-trend up">↑ 12% this month</div>
        </div>
        <div class="card">
          <div class="card-label">Reports Today</div>
          <div class="card-value">${s.reportsToday}</div>
          <div class="card-trend neutral">Avg response: 47 min</div>
        </div>
      </div>
    </div>`;
  },

  // ——— BEGA CANAL PAGE ———
  canal() {
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · CANAL RECONNAISSANCE</div>
        <h1 class="page-title">Canal<br><em>Recon</em></h1>
        <p class="page-subtitle">Live field map — sensor nodes, zones &amp; underwater intelligence</p>
      </div>

      <!-- Full canal map -->
      <div class="card" style="padding:0;margin-bottom:24px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#071220,#0a1f38);padding:0;border-radius:14px;">
          ${Charts.canalMap(MOCK_DATA.sensors)}
        </div>
        <div style="padding:16px;display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--bega-border);">
          <div class="map-badge"><span style="color:#66BB6A">●</span> Sensor online</div>
          <div class="map-badge"><span style="color:#FFA726">●</span> Warning</div>
          <div class="map-badge"><span style="color:#EF5350">●</span> Offline</div>
          <div class="map-badge" style="margin-left:auto;">↕ Scroll to explore zones</div>
        </div>
      </div>

      <!-- Sensor detail list -->
      <div class="section-title">Sensor Network</div>
      <div class="grid-2" style="margin-bottom:24px;">
        ${MOCK_DATA.sensors.map(s => `
          <div class="card" id="sensor-${s.id}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
              <div>
                <div class="card-label">${s.id}</div>
                <div style="font-size:0.95rem;font-weight:500;color:#e8f4fd;">${s.name}</div>
              </div>
              <div class="badge ${s.status === 'online' ? 'badge-online' : s.status === 'warning' ? 'badge-warning' : 'badge-offline'}">
                ${s.status}
              </div>
            </div>
            ${s.status !== 'offline' ? `
            <div class="sensor-row" style="gap:8px;">
              <div class="sensor-item">
                <div class="sensor-name">pH</div>
                <div class="sensor-bar-wrap"><div class="sensor-bar ${s.ph > 7 ? 'good' : s.ph > 6.5 ? 'warning' : 'danger'}" style="width:${(s.ph/14)*100}%"></div></div>
                <div class="sensor-val">${s.ph}</div>
              </div>
              <div class="sensor-item">
                <div class="sensor-name">Turbidity</div>
                <div class="sensor-bar-wrap"><div class="sensor-bar ${s.turbidity < 20 ? 'good' : s.turbidity < 40 ? 'warning' : 'danger'}" style="width:${Math.min(s.turbidity/80*100,100)}%"></div></div>
                <div class="sensor-val">${s.turbidity} NTU</div>
              </div>
              <div class="sensor-item">
                <div class="sensor-name">Temp</div>
                <div class="sensor-bar-wrap"><div class="sensor-bar good" style="width:${(s.temperature/40)*100}%"></div></div>
                <div class="sensor-val">${s.temperature}°C</div>
              </div>
            </div>
            <div style="margin-top:10px;">
              ${s.history.length ? Charts.sparkline(s.history, 200, 40) : ''}
            </div>
            ` : `<div style="color:rgba(232,244,253,0.3);font-size:0.82rem;font-family:var(--font-mono);">— no data —</div>`}
          </div>
        `).join('')}
      </div>

      <!-- Underwater teaser -->
      <div class="underwater-teaser">
        <div style="font-size:3rem;margin-bottom:12px;opacity:0.4;">🌊</div>
        <div class="underwater-label">Coming Soon</div>
        <div class="underwater-title">Underwater View</div>
        <div class="underwater-sub">Scan the Bega and explore what's beneath the surface — fish, sediment, infrastructure. Integration pending sonar + AR module.</div>
        <div style="margin-top:16px;">
          <div class="badge badge-warning" style="display:inline-flex;">🔧 In Development</div>
        </div>
      </div>
    </div>`;
  },

  // ——— TIME TRAVEL / HISTORY ———
  history() {
    const eras = MOCK_DATA.eras;
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · INTELLIGENCE ARCHIVE</div>
        <h1 class="page-title">Historical<br><em>Intel</em></h1>
        <p class="page-subtitle">Declassified records — scan QR codes at canal positions to unlock each era</p>
      </div>

      <!-- Era selector -->
      <div class="section-title">Historical Eras · QR Access Points</div>
      <div class="qr-grid" style="margin-bottom:28px;">
        ${eras.map(e => `
          <div class="qr-card" onclick="showEraDetail('${e.year}')">
            <div class="qr-icon">${e.icon}</div>
            <div class="qr-era">${e.year}</div>
            <div class="qr-name">${e.label.split('—')[0].trim()}</div>
            <div style="margin-top:8px;">
              <div style="width:28px;height:28px;border:1.5px solid ${e.color};border-radius:5px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-family:var(--font-mono);color:${e.color};opacity:0.8;">QR</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Detail panel -->
      <div id="era-detail" style="display:none;margin-bottom:28px;">
        <!-- filled dynamically -->
      </div>

      <!-- Timeline -->
      <div class="section-title">Canal Timeline</div>
      <div class="card">
        <div class="timeline">
          ${eras.map(e => `
            <div class="timeline-item">
              <div class="timeline-dot" style="background:${e.color};box-shadow:0 0 8px ${e.color}60;"></div>
              <div class="timeline-year">${e.year}</div>
              <div class="timeline-title">${e.label}</div>
              <div class="timeline-desc">${e.desc}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                ${e.facts.map(f => `<div class="badge badge-online" style="font-size:0.65rem;">${f}</div>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- AR note -->
      <div class="alert alert-info" style="margin-top:16px;">
        <div class="alert-icon">📱</div>
        <div>
          <strong>Mobile AR:</strong> Download the BegaVerse app and scan the QR codes placed at 7 locations along the canal to see each era overlaid on the real world.
        </div>
      </div>
    </div>`;
  },

  // ——— SIMCITY / LAND & BUILD ———
  simcity() {
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · OPERATIONS ZONE</div>
        <h1 class="page-title">Riverbank<br><em>Ops</em></h1>
        <p class="page-subtitle">Acquire parcels, deploy assets — all linked to real-world coordinates on the Bega</p>
      </div>

      <div class="grid-2-3">
        <!-- Sim Grid -->
        <div class="card">
          <div class="card-title"><span class="dot" style="background:#66BB6A"></span>Interactive Map Grid</div>

          <div class="sim-toolbar" id="sim-toolbar">
            <button class="sim-tool active" data-tool="select" onclick="selectTool('select')">👆 Select</button>
            <button class="sim-tool" data-tool="tree" onclick="selectTool('tree')">🌳 Tree</button>
            <button class="sim-tool" data-tool="bench" onclick="selectTool('bench')">🪑 Bench</button>
            <button class="sim-tool" data-tool="flower" onclick="selectTool('flower')">🌸 Flowers</button>
            <button class="sim-tool" data-tool="lamp" onclick="selectTool('lamp')">💡 Lamp</button>
            <button class="sim-tool" data-tool="erase" onclick="selectTool('erase')">🗑️ Erase</button>
          </div>

          <div id="sim-grid-wrap" style="overflow-x:auto;">
            <!-- Grid rendered by JS -->
          </div>

          <div id="sim-status" style="margin-top:10px;font-family:var(--font-mono);font-size:0.75rem;color:rgba(79,195,247,0.6);min-height:20px;"></div>
        </div>

        <!-- Sidebar -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- Stats -->
          <div class="card">
            <div class="card-title"><span class="dot" style="background:var(--bega-gold)"></span>My Plot Stats</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div style="background:rgba(79,195,247,0.05);border-radius:8px;padding:12px;border:1px solid var(--bega-border);">
                <div class="card-label" style="font-size:0.62rem;">Trees</div>
                <div style="font-size:1.5rem;font-family:var(--font-mono);color:#e8f4fd;" id="stat-trees">0</div>
              </div>
              <div style="background:rgba(79,195,247,0.05);border-radius:8px;padding:12px;border:1px solid var(--bega-border);">
                <div class="card-label" style="font-size:0.62rem;">Objects</div>
                <div style="font-size:1.5rem;font-family:var(--font-mono);color:#e8f4fd;" id="stat-objects">0</div>
              </div>
              <div style="background:rgba(79,195,247,0.05);border-radius:8px;padding:12px;border:1px solid var(--bega-border);">
                <div class="card-label" style="font-size:0.62rem;">CO₂ Saved</div>
                <div style="font-size:1.2rem;font-family:var(--font-mono);color:var(--bega-green);" id="stat-co2">0 kg</div>
              </div>
              <div style="background:rgba(79,195,247,0.05);border-radius:8px;padding:12px;border:1px solid var(--bega-border);">
                <div class="card-label" style="font-size:0.62rem;">Green Score</div>
                <div style="font-size:1.2rem;font-family:var(--font-mono);color:var(--bega-cyan);" id="stat-score">0</div>
              </div>
            </div>
          </div>

          <!-- Available parcels -->
          <div class="card">
            <div class="card-title"><span class="dot"></span>Available Parcels</div>
            ${MOCK_DATA.parcels.map(p => `
              <div style="padding:10px 0;border-bottom:1px solid var(--bega-border);display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:0.85rem;font-weight:500;color:#e8f4fd;">${p.name}</div>
                  <div style="font-size:0.72rem;color:rgba(232,244,253,0.4);font-family:var(--font-mono);">${p.size}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--bega-gold);">${p.price}</div>
                  <div class="badge ${p.status === 'available' ? 'badge-online' : p.status === 'owned' ? 'badge-warning' : 'badge-offline'}" style="font-size:0.6rem;margin-top:3px;">${p.status}</div>
                </div>
              </div>
            `).join('')}
            <div style="margin-top:12px;">
              <div class="alert alert-info" style="font-size:0.78rem;">
                <div>🔗 Parcel ownership will be stored on Ethereum blockchain when DB is connected.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  },

  // ——— AR SCANNER PAGE ———
  ar() {
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · FIELD AR UNIT</div>
        <h1 class="page-title">Field<br><em>AR</em></h1>
        <p class="page-subtitle">Mobile augmented reality system — scan, identify, report</p>
      </div>

      <div class="grid-2" style="margin-bottom:24px;">
        <!-- Phone mockup -->
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;">
          <div class="ar-phone-frame">
            <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);width:40px;height:4px;background:rgba(79,195,247,0.3);border-radius:2px;"></div>
            <div class="ar-phone-screen">
              <!-- Fake AR viewfinder -->
              <div style="position:relative;width:140px;height:200px;">
                <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(79,195,247,0.04),rgba(38,198,218,0.08));border-radius:8px;overflow:hidden;">
                  <!-- Fake river scene -->
                  <div style="position:absolute;bottom:0;left:0;right:0;height:60%;background:rgba(79,195,247,0.08);border-radius:0 0 8px 8px;"></div>
                  <div style="position:absolute;bottom:55%;left:0;right:0;height:8px;background:rgba(38,198,218,0.2);"></div>
                </div>
                <!-- AR crosshair -->
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
                  <div class="ar-crosshair"></div>
                </div>
                <!-- AR overlay text -->
                <div style="position:absolute;top:12px;left:8px;right:8px;">
                  <div style="background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border-radius:4px;padding:4px 7px;font-size:7px;font-family:var(--font-mono);color:var(--bega-cyan);">BEGA · LIVE AR</div>
                </div>
                <!-- Overlay tag example -->
                <div style="position:absolute;bottom:20px;left:8px;right:8px;background:rgba(0,0,0,0.65);border-radius:6px;padding:6px 8px;border:1px solid rgba(79,195,247,0.3);">
                  <div style="font-size:7px;font-family:var(--font-mono);color:var(--bega-cyan);">pH 7.2 · 18°C</div>
                  <div style="font-size:6px;color:rgba(232,244,253,0.6);margin-top:2px;">Sensor S001 · Live</div>
                </div>
              </div>
            </div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:rgba(79,195,247,0.5);margin-bottom:4px;">MOBILE APP (Expo Go)</div>
            <div style="font-size:0.85rem;color:rgba(232,244,253,0.7);">Point at the canal to see live data overlaid in AR</div>
          </div>
        </div>

        <!-- Features list -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${[
            { icon:'📍', title:'QR Code Scan', desc:'Scan physical QR codes placed at 7 locations along the Bega to unlock historical eras, stories, and data.', ready:true },
            { icon:'🌊', title:'Live Sensor Overlay', desc:'See real-time pH, temperature and turbidity data floating above the water surface as you look through your camera.', ready:true },
            { icon:'🏛️', title:'Time Travel Layers', desc:'Switch between 1900–2050 visual layers — see how the canal looked in each era overlaid on the real world.', ready:true },
            { icon:'🗑️', title:'Pollution Reporting', desc:'Spot trash or discoloration? Tap to report directly in AR. Your photo goes to AI pollution detection (YOLOv8).', ready:true },
            { icon:'🐟', title:'Underwater View', desc:'Swim beneath the surface — see fish species, sediment layers, and underwater infrastructure in 3D.', ready:false },
            { icon:'🎮', title:'Quest System', desc:'Complete civic quests like "Visit 3 bridges" or "Plant 5 trees" to earn points on the leaderboard.', ready:true },
          ].map(f => `
            <div class="card" style="display:flex;gap:14px;align-items:flex-start;padding:14px 16px;">
              <div style="font-size:1.6rem;flex-shrink:0;margin-top:2px;">${f.icon}</div>
              <div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="font-weight:500;color:#e8f4fd;">${f.title}</div>
                  <div class="badge ${f.ready ? 'badge-online' : 'badge-offline'}" style="font-size:0.6rem;">${f.ready ? 'MVP' : 'Planned'}</div>
                </div>
                <div style="font-size:0.8rem;color:rgba(232,244,253,0.5);line-height:1.5;">${f.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tech stack AR -->
      <div class="section-title">AR Tech Stack</div>
      <div class="grid-4">
        ${[
          {name:'React Native', role:'Mobile shell', color:'#61dafb'},
          {name:'AR.js', role:'AR rendering', color:'#FF6B6B'},
          {name:'Three.js', role:'3D overlay', color:'#049ef4'},
          {name:'YOLOv8', role:'Pollution AI', color:'#66BB6A'},
        ].map(t => `
          <div class="card" style="text-align:center;padding:16px;">
            <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:${t.color};margin-bottom:4px;">${t.name}</div>
            <div style="font-size:0.75rem;color:rgba(232,244,253,0.5);">${t.role}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  },

  // ——— IOT SENSORS DASHBOARD ———
  sensors() {
    var sensors = MOCK_DATA.sensors;
    var online  = 0, warning = 0, offline = 0, phSum = 0, o2Sum = 0, activeCount = 0;
    for (var i = 0; i < sensors.length; i++) {
      var s = sensors[i];
      if (s.status === 'online')  online++;
      if (s.status === 'warning') warning++;
      if (s.status === 'offline') offline++;
      if (s.status !== 'offline') { phSum += s.ph; o2Sum += s.oxygen; activeCount++; }
    }
    var avgPh  = activeCount ? (phSum  / activeCount).toFixed(1) : '7.0';
    var avgO2  = activeCount ? (o2Sum  / activeCount).toFixed(1) : '8.0';
    var phTrend  = parseFloat(avgPh) >= 7 ? 'Slightly alkaline' : parseFloat(avgPh) >= 6.5 ? 'Slightly acidic' : 'Acidic';
    var o2Trend  = parseFloat(avgO2) >= 7 ? 'Good for aquatic life' : 'Below optimal';
    var phTrendCls = parseFloat(avgPh) >= 6.5 ? 'up' : 'down';
    var o2TrendCls = parseFloat(avgO2) >= 7 ? 'up' : 'down';
    var warnColor  = warning > 0 ? 'var(--bega-amber)' : 'rgba(232,244,253,0.35)';
    var warnTrend  = warning > 0 ? 'down' : 'neutral';

    // Pre-build sensor cards
    var cardsHtml = '';
    for (var i = 0; i < sensors.length; i++) {
      cardsHtml += renderSensorCard(sensors[i]);
    }

    // Pre-build comparison charts
    var phChart   = Charts.metricBars(sensors, 'ph',          'pH Level',            14, '',        'ph');
    var turbChart = Charts.metricBars(sensors, 'turbidity',   'Turbidity (NTU)',     80, ' NTU',    'turbidity');
    var tempChart = Charts.metricBars(sensors, 'temperature', 'Temperature (C)',     35, 'C',       'temperature');
    var o2Chart   = Charts.metricBars(sensors, 'oxygen',      'Dissolved O2 (mg/L)', 12, ' mg/L',  'oxygen');

    // Pre-build table rows
    var rowsHtml = '';
    for (var i = 0; i < sensors.length; i++) {
      var s = sensors[i];
      var sc = s.status === 'online' ? 'badge-online' : s.status === 'warning' ? 'badge-warning' : 'badge-offline';
      var phC  = s.ph        ? sensorColor('ph',          s.ph)        : 'inherit';
      var tbC  = s.turbidity ? sensorColor('turbidity',   s.turbidity) : 'inherit';
      var o2C  = s.oxygen    ? sensorColor('oxygen',      s.oxygen)    : 'inherit';
      var trnd = s.history.length ? Charts.sparkline(s.history, 80, 28) : '&mdash;';
      rowsHtml += '<tr onclick="document.getElementById(\'sensor-' + s.id + '\').scrollIntoView({behavior:\'smooth\',block:\'center\'})" style="cursor:pointer;">' +
        '<td class="hash-cell">' + s.id + '</td>' +
        '<td style="font-weight:500;color:#e8f4fd;">' + s.name + '</td>' +
        '<td><div class="badge ' + sc + '">' + s.status + '</div></td>' +
        '<td style="font-family:var(--font-mono);color:' + phC  + ';">' + (s.ph        || '&mdash;') + '</td>' +
        '<td style="font-family:var(--font-mono);color:' + tbC  + ';">' + (s.turbidity ? s.turbidity + ' NTU' : '&mdash;') + '</td>' +
        '<td style="font-family:var(--font-mono);">'                     + (s.temperature ? s.temperature + '&#8451;' : '&mdash;') + '</td>' +
        '<td style="font-family:var(--font-mono);color:' + o2C  + ';">' + (s.oxygen    ? s.oxygen    + ' mg/L' : '&mdash;') + '</td>' +
        '<td style="font-family:var(--font-mono);font-size:0.68rem;color:rgba(79,195,247,0.4);">' + s.lat + 'N ' + s.lon + 'E</td>' +
        '<td>' + trnd + '</td>' +
        '</tr>';
    }

    var mapHtml  = Charts.canalMap(sensors);
    var sparkBar = Charts.sparkline([3,3,4,3,4,4,4,4,4,4,4,online], 120, 32, '#66BB6A');

    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · SENSOR NETWORK · SURVEILLANCE</div>
        <h1 class="page-title">Sensor<br><em>Net</em></h1>
        <p class="page-subtitle">Live telemetry from ${sensors.length} ESP32 nodes deployed along the Bega &middot; MQTT uplink &middot; 10-min interval</p>
      </div>

      <div class="grid-4" style="margin-bottom:24px;">
        <div class="card card-glow-green">
          <div class="card-label">Online</div>
          <div class="card-value" style="color:var(--bega-green);">${online}</div>
          <div class="card-trend neutral">of ${sensors.length} sensors</div>
          ${sparkBar}
        </div>
        <div class="card">
          <div class="card-label">Warning / Offline</div>
          <div class="card-value" style="color:${warnColor};">${warning + offline}</div>
          <div class="card-trend ${warnTrend}">${warning} warning &middot; ${offline} offline</div>
        </div>
        <div class="card card-glow-cyan">
          <div class="card-label">Avg pH</div>
          <div class="card-value">${avgPh}</div>
          <div class="card-trend ${phTrendCls}">${phTrend}</div>
        </div>
        <div class="card card-glow-cyan">
          <div class="card-label">Avg Dissolved O&#8322;</div>
          <div class="card-value">${avgO2}<span class="card-unit">mg/L</span></div>
          <div class="card-trend ${o2TrendCls}">${o2Trend}</div>
        </div>
      </div>

      <div class="section-title">Sensor Network Map</div>
      <div class="card" style="padding:0;margin-bottom:8px;overflow:hidden;">
        <div style="position:relative;">
          ${mapHtml}
          <div id="map-click-overlay" onclick="handleMapClick(event)"
            style="position:absolute;inset:0;z-index:5;pointer-events:none;cursor:crosshair;"></div>
          <div id="map-add-hint"
            style="display:none;position:absolute;top:12px;left:50%;transform:translateX(-50%);
            background:rgba(7,18,32,0.88);border:1px solid rgba(79,195,247,0.5);border-radius:8px;
            padding:6px 16px;font-family:var(--font-mono);font-size:0.68rem;color:var(--bega-cyan);
            z-index:6;pointer-events:none;white-space:nowrap;backdrop-filter:blur(4px);">
            &#9654; Click anywhere on the canal to place a sensor
          </div>
        </div>
        <div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--bega-border);flex-wrap:wrap;gap:8px;">
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="map-badge"><span style="color:#66BB6A;">&#9679;</span> ${online} online</div>
            <div class="map-badge"><span style="color:#FFA726;">&#9679;</span> ${warning} warning</div>
            <div class="map-badge"><span style="color:#EF5350;">&#9679;</span> ${offline} offline</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-family:var(--font-mono);font-size:0.65rem;color:rgba(79,195,247,0.45);display:flex;align-items:center;gap:6px;">
              <span class="pulse-dot" style="width:5px;height:5px;"></span>
              <span id="last-updated-ts">Live feed active</span>
            </div>
            <button id="btn-add-sensor" class="btn btn-ghost" onclick="toggleAddSensorMode()"
              style="font-size:0.72rem;padding:6px 14px;display:flex;align-items:center;gap:6px;">
              + Add Sensor
            </button>
          </div>
        </div>
      </div>
      <div id="sensor-placement-form" style="display:none;margin-bottom:24px;"></div>

      <div class="section-title">Live Readings &mdash; All Sensors</div>
      <div class="grid-2" id="sensor-cards-grid" style="margin-bottom:28px;">
        ${cardsHtml}
      </div>

      <div class="section-title">Cross-Sensor Comparison</div>
      <div class="grid-2" style="margin-bottom:28px;">
        ${phChart}
        ${turbChart}
        ${tempChart}
        ${o2Chart}
      </div>

      <div class="section-title">Raw Data Table</div>
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Sensor</th><th>Location</th><th>Status</th>
              <th>pH</th><th>Turbidity</th><th>Temp</th><th>O&#8322;</th>
              <th>Coordinates</th><th>Trend</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>

      <div class="alert alert-info">
        <div class="alert-icon">&#128225;</div>
        <div style="line-height:1.6;">
          Sensors publish every <strong>10 minutes</strong> via <strong>MQTT</strong> &rarr; Node.js backend &rarr; PostgreSQL + PostGIS.
          Critical readings committed to <strong>Ethereum Sepolia</strong> testnet for public auditability.
          <span style="opacity:0.6;"> &middot; 50 sensors planned &middot; 4 active in MVP</span><br>
          <a href="#" onclick="navigate('blockchain');return false;" style="color:var(--bega-cyan);text-decoration:none;font-size:0.9em;">View on-chain log &rarr;</a>
        </div>
      </div>
    </div>`;
  },

  // ——— REPORTS ———
  reports() {
    const severity = { high:'badge-offline', medium:'badge-warning', low:'badge-online' };
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · INCIDENT LOG</div>
        <h1 class="page-title">Incident<br><em>Log</em></h1>
        <p class="page-subtitle">Field-submitted via AR unit · AI-classified · Command-reviewed</p>
      </div>

      <div class="grid-3" style="margin-bottom:24px;">
        <div class="card">
          <div class="card-label">Total Reports</div>
          <div class="card-value">47</div>
          <div class="card-trend up">↑ 3 today</div>
        </div>
        <div class="card">
          <div class="card-label">Resolved</div>
          <div class="card-value" style="color:var(--bega-green);">38</div>
          <div class="card-trend neutral">81% resolution rate</div>
        </div>
        <div class="card">
          <div class="card-label">Avg Response</div>
          <div class="card-value">47<span class="card-unit">min</span></div>
          <div class="card-trend neutral">Target: 60 min</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Type</th><th>Location</th><th>Severity</th><th>Reported by</th><th>Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${MOCK_DATA.reports.map(r => `
              <tr>
                <td class="hash-cell">${r.id}</td>
                <td>${r.type}</td>
                <td>${r.location}</td>
                <td><div class="badge ${severity[r.severity]}">${r.severity}</div></td>
                <td style="color:rgba(232,244,253,0.5);">${r.reporter}</td>
                <td style="color:rgba(232,244,253,0.4);font-family:var(--font-mono);font-size:0.72rem;">${r.time}</td>
                <td><div class="badge ${r.status === 'resolved' ? 'badge-online' : r.status === 'pending' ? 'badge-warning' : 'badge-offline'}">${r.status}</div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:20px;">
        ${Charts.barChart([
          { label: 'Trash', value: 28, color: '#FFA726' },
          { label: 'Oil/Spill', value: 9, color: '#EF5350' },
          { label: 'Foam', value: 6, color: '#4FC3F7' },
          { label: 'Other', value: 4, color: '#9E9E9E' },
        ], 500, 160)}
      </div>
    </div>`;
  },

  // ——— BLOCKCHAIN ———
  blockchain() {
    return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-breadcrumb">BV-01 · DATA LEDGER · INTEGRITY</div>
        <h1 class="page-title">Data<br><em>Ledger</em></h1>
        <p class="page-subtitle">Immutable sensor record — Ethereum Sepolia · tamper-proof public audit trail</p>
      </div>

      <div class="grid-3" style="margin-bottom:24px;">
        <div class="card">
          <div class="card-label">Total Commits</div>
          <div class="card-value">1,203</div>
          <div class="card-trend up">↑ 48 today</div>
        </div>
        <div class="card">
          <div class="card-label">Network</div>
          <div class="card-value" style="font-size:1.2rem;margin-top:6px;">Sepolia</div>
          <div class="badge badge-online" style="margin-top:6px;">Testnet</div>
        </div>
        <div class="card">
          <div class="card-label">Last Block</div>
          <div class="card-value" style="font-size:1.3rem;">#8,891,234</div>
          <div class="card-trend neutral">~12s ago</div>
        </div>
      </div>

      <div class="section-title">Recent Transactions</div>
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:24px;">
        <table class="data-table">
          <thead>
            <tr><th>Tx Hash</th><th>Sensor</th><th>Type</th><th>Value</th><th>Block</th><th>Time</th></tr>
          </thead>
          <tbody>
            ${MOCK_DATA.transactions.map(t => `
              <tr>
                <td class="hash-cell" style="cursor:pointer;" title="${t.hash}">${t.hash}</td>
                <td>${t.sensor}</td>
                <td><div class="badge ${t.type === 'Alert' ? 'badge-warning' : 'badge-online'}">${t.type}</div></td>
                <td style="font-family:var(--font-mono);font-size:0.78rem;">${t.value}</td>
                <td style="font-family:var(--font-mono);font-size:0.72rem;color:rgba(232,244,253,0.4);">#${t.block.toLocaleString()}</td>
                <td style="color:rgba(232,244,253,0.4);font-size:0.75rem;">${t.time}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Contract info -->
      <div class="card">
        <div class="card-title"><span class="dot"></span>Smart Contract</div>
        <div class="sensor-row" style="gap:12px;">
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
              <div class="card-label">Contract Address</div>
              <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--bega-cyan);">0x7f3e...4b9a (Sepolia)</div>
            </div>
            <div>
              <div class="card-label">Language</div>
              <div style="font-family:var(--font-mono);font-size:0.85rem;">Solidity · Ethers.js</div>
            </div>
            <div>
              <div class="card-label">Function</div>
              <div style="font-family:var(--font-mono);font-size:0.8rem;color:rgba(232,244,253,0.6);">commitReading(sensorId, ph, turbidity, temp, timestamp)</div>
            </div>
          </div>
        </div>
        <div class="alert alert-info" style="margin-top:14px;">
          <div class="alert-icon">🔗</div>
          <div>Each IoT reading is hashed and committed on-chain, making environmental data tamper-proof and publicly auditable. Municipality can't alter historical records.</div>
        </div>
      </div>
    </div>`;
  }
};
