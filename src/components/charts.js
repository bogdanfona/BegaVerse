// ===========================
// BegaVerse — Chart Utilities
// ===========================

const Charts = {

  // Render a sparkline SVG path from array of values
  sparkline(values, width, height, color = '#4FC3F7') {
    if (!values || values.length < 2) return '';
    const svgW = typeof width === 'number' ? width : 300;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * svgW;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });
    const area = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(' ') +
      ` L ${svgW},${height} L 0,${height} Z`;
    const line = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(' ');
    const wAttr = typeof width === 'number' ? `width="${width}"` : `width="100%"`;
    return `
      <svg class="sparkline" ${wAttr} height="${height}" viewBox="0 0 ${svgW} ${height}">
        <path d="${area}" fill="${color}" opacity="0.08"/>
        <path d="${line}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${pts[pts.length-1].split(',')[0]}" cy="${pts[pts.length-1].split(',')[1]}" r="2.5" fill="${color}"/>
      </svg>
    `;
  },

  // Render a horizontal bar chart for water quality breakdown
  barChart(data, width = 300, height = 160) {
    const maxVal = Math.max(...data.map(d => d.value));
    const barH = 18;
    const gap = 10;
    const labelW = 90;
    const chartW = width - labelW - 50;
    const totalH = data.length * (barH + gap) + 20;

    let bars = data.map((d, i) => {
      const bw = (d.value / maxVal) * chartW;
      const y = 10 + i * (barH + gap);
      const color = d.color || '#4FC3F7';
      return `
        <text x="0" y="${y + barH - 4}" font-size="11" fill="rgba(232,244,253,0.6)" font-family="Space Mono, monospace">${d.label}</text>
        <rect x="${labelW}" y="${y}" width="${bw}" height="${barH}" rx="3" fill="${color}" opacity="0.7"/>
        <text x="${labelW + bw + 6}" y="${y + barH - 4}" font-size="11" fill="${color}" font-family="Space Mono, monospace">${d.value}</text>
      `;
    }).join('');

    return `<svg width="100%" height="${totalH}" viewBox="0 0 ${width} ${totalH}">${bars}</svg>`;
  },

  // Donut / ring for water quality score
  qualityRing(score, size = 100) {
    const r = (size / 2) - 10;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const color = score >= 70 ? '#66BB6A' : score >= 40 ? '#FFA726' : '#EF5350';
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(79,195,247,0.1)" stroke-width="8"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="8"
          stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ * 0.25}"
          stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
        <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" font-size="18" font-weight="600"
          fill="${color}" font-family="Space Mono, monospace">${score}</text>
        <text x="${size/2}" y="${size/2 + 18}" text-anchor="middle" font-size="9"
          fill="rgba(232,244,253,0.4)" font-family="Sora, sans-serif">/ 100</text>
      </svg>
    `;
  },

  // Canal map SVG
  canalMap(sensors) {
    const width = 800;
    const height = 260;

    // Position sensors by longitude so user-placed sensors appear at the right location
    const lonMin = 21.195, lonMax = 21.237;
    const xFromLon = lon => Math.max(25, Math.min(775, 40 + (lon - lonMin) / (lonMax - lonMin) * 720));

    const sensorMarkers = sensors.map((s, i) => {
      const x = xFromLon(s.lon);
      const y = 100 + (i % 2 === 0 ? -15 : 15);
      const color = s.status === 'online' ? '#66BB6A' : s.status === 'warning' ? '#FFA726' : '#EF5350';
      return `
        <g class="sensor-marker" style="cursor:pointer" onclick="showSensorDetail('${s.id}')">
          <circle cx="${x}" cy="${y}" r="10" fill="${color}" opacity="0.2"/>
          <circle cx="${x}" cy="${y}" r="5" fill="${color}"/>
          <circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"
            style="animation: sensorPulse 2s ease-in-out infinite; animation-delay: ${i*0.4}s"/>
          <text x="${x}" y="${y + 22}" text-anchor="middle" font-size="9" fill="rgba(232,244,253,0.6)"
            font-family="Space Mono, monospace">${s.id}</text>
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="map-svg">
        <defs>
          <style>
            @keyframes sensorPulse {
              0%,100% { r: 8; opacity: 0.5; }
              50% { r: 14; opacity: 0; }
            }
            .sensor-marker circle:last-of-type { /* pulse ring */ }
          </style>
          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0a2040" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#0d3060" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#0a2040" stop-opacity="0.8"/>
          </linearGradient>
          <linearGradient id="waterShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(79,195,247,0.15)"/>
            <stop offset="100%" stop-color="rgba(38,198,218,0.08)"/>
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#071220"/>

        <!-- City grid suggestion -->
        ${Array.from({length:12},(_,i)=>`<line x1="${i*70}" y1="0" x2="${i*70}" y2="${height}" stroke="rgba(79,195,247,0.04)" stroke-width="0.5"/>`).join('')}
        ${Array.from({length:6},(_,i)=>`<line x1="0" y1="${i*45}" x2="${width}" y2="${i*45}" stroke="rgba(79,195,247,0.04)" stroke-width="0.5"/>`).join('')}

        <!-- Bega river body -->
        <path d="M -10 95 Q 80 80 160 105 Q 280 130 400 100 Q 520 70 640 105 Q 720 125 810 95"
          stroke="none" fill="url(#waterShimmer)"/>

        <!-- River main channel -->
        <path d="M -10 95 Q 80 80 160 105 Q 280 130 400 100 Q 520 70 640 105 Q 720 125 810 95
                 L 810 125 Q 720 155 640 135 Q 520 100 400 130 Q 280 160 160 135 Q 80 110 -10 125 Z"
          fill="url(#riverGrad)" stroke="rgba(79,195,247,0.25)" stroke-width="1"/>

        <!-- Water ripple lines -->
        <path d="M 100 108 Q 150 103 200 108" stroke="rgba(79,195,247,0.2)" stroke-width="0.8" fill="none"/>
        <path d="M 300 112 Q 360 107 420 112" stroke="rgba(79,195,247,0.15)" stroke-width="0.8" fill="none"/>
        <path d="M 500 103 Q 560 98 620 103" stroke="rgba(79,195,247,0.2)" stroke-width="0.8" fill="none"/>

        <!-- North bank label -->
        <text x="20" y="70" font-size="9" fill="rgba(79,195,247,0.3)" font-family="Space Mono, monospace">← TIMIȘOARA NORD</text>
        <!-- South bank label -->
        <text x="20" y="160" font-size="9" fill="rgba(79,195,247,0.3)" font-family="Space Mono, monospace">← TIMIȘOARA SUD</text>

        <!-- Bridges -->
        <line x1="200" y1="80" x2="200" y2="145" stroke="rgba(232,244,253,0.25)" stroke-width="3" stroke-linecap="round"/>
        <text x="200" y="72" text-anchor="middle" font-size="8" fill="rgba(232,244,253,0.4)" font-family="Sora, sans-serif">Decebal</text>

        <line x1="400" y1="78" x2="400" y2="148" stroke="rgba(232,244,253,0.25)" stroke-width="3" stroke-linecap="round"/>
        <text x="400" y="70" text-anchor="middle" font-size="8" fill="rgba(232,244,253,0.4)" font-family="Sora, sans-serif">Michelangelo</text>

        <line x1="600" y1="82" x2="600" y2="148" stroke="rgba(232,244,253,0.25)" stroke-width="3" stroke-linecap="round"/>
        <text x="600" y="74" text-anchor="middle" font-size="8" fill="rgba(232,244,253,0.4)" font-family="Sora, sans-serif">Eroilor</text>

        <!-- Sensor markers -->
        ${sensorMarkers}

        <!-- Direction arrows -->
        <text x="${width - 80}" y="${height - 10}" font-size="9" fill="rgba(79,195,247,0.3)" font-family="Space Mono, monospace">FLOW →</text>
      </svg>
    `;
  },

  // Horizontal bar chart comparing one metric across all non-offline sensors
  metricBars(sensors, metric, label, maxVal, unit, metricKey) {
    const active = sensors.filter(s => s.status !== 'offline');
    const W = 400;
    const barH = 22;
    const gap = 10;
    const labelW = 112;
    const chartW = 200;
    const totalH = 20 + active.length * (barH + gap);

    const bars = active.map((s, i) => {
      const val = s[metric];
      const pct = Math.min(val / maxVal, 1);
      const bw = pct * chartW;
      const y = 20 + i * (barH + gap);
      const color = sensorColor(metricKey, val);
      const name = s.name.replace('Podul ', '').replace('Parcul ', '').replace('Zona ', '');
      return `
        <text x="0" y="${y + 15}" font-size="9" fill="rgba(232,244,253,0.5)" font-family="Space Mono, monospace">${name}</text>
        <rect x="${labelW}" y="${y}" width="${chartW}" height="${barH}" rx="4" fill="rgba(79,195,247,0.05)"/>
        <rect x="${labelW}" y="${y}" width="${Math.max(bw, 3)}" height="${barH}" rx="4" fill="${color}" opacity="0.8"/>
        <text x="${labelW + chartW + 8}" y="${y + 15}" font-size="10" fill="${color}" font-family="Space Mono, monospace">${val}${unit}</text>
      `;
    }).join('');

    return `
      <div class="card">
        <div style="font-family:var(--font-mono);font-size:0.62rem;color:rgba(79,195,247,0.5);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">${label}</div>
        <svg width="100%" height="${totalH}" viewBox="0 0 ${W} ${totalH}" style="overflow:visible;">
          ${bars}
        </svg>
      </div>
    `;
  }
};
