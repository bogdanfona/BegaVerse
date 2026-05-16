# BegaVerse Dashboard — Web Frontend

City official dashboard for the BegaVerse digital twin of Timișoara's Bega Canal.

## Structure

```
begaverse-dashboard/
├── index.html              # Entry point
├── src/
│   ├── styles/
│   │   └── main.css        # All styles (dark theme, responsive)
│   ├── data/
│   │   └── mockData.js     # Mock data — replace with API calls when DB is ready
│   ├── components/
│   │   ├── charts.js       # Sparklines, maps, ring charts (pure SVG/canvas)
│   │   └── pages.js        # All page renderers (dashboard, canal, history, etc.)
│   └── main.js             # App logic: routing, SimCity grid, interactions
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `dashboard` | Live stats, canal map, alerts |
| Bega Canal | `canal` | Full map + all sensor details + underwater teaser |
| Time Travel | `history` | QR eras 1900–2050, timeline |
| Land & Build | `simcity` | Interactive grid, place trees/benches, parcel listing |
| AR Scanner | `ar` | Feature explainer + tech stack |
| IoT Sensors | `sensors` | Sensor table with sparklines |
| Reports | `reports` | Pollution reports from citizens |
| Blockchain | `blockchain` | Ethereum tx log, contract info |

## Running

No build tools needed — plain HTML/CSS/JS. Open `index.html` directly in a browser, or serve with:

```bash
npx serve .
# or
python3 -m http.server 3000
```

## Connecting to the real database

All data comes from `src/data/mockData.js`. When your teammate has the backend ready:

1. Replace `MOCK_DATA.sensors` with an API call to `/api/sensors`
2. Replace `MOCK_DATA.transactions` with `/api/blockchain/txs`
3. Replace `MOCK_DATA.reports` with `/api/reports`
4. The SimCity grid should persist to `/api/parcels/:id/objects`

## Mobile Compatibility

- Fully responsive (sidebar collapses, hamburger menu on mobile)
- Touch-friendly SimCity grid
- Works inside Expo Go WebView if needed
- No external JS dependencies — loads offline

## Design

- Dark water theme — deep navy, cyan accents
- DM Serif Display (titles) + Space Mono (data) + Sora (body)
- All charts are pure SVG inline — no Chart.js dependency
- Backdrop blur cards for glassmorphism effect

## Team

- **Bogdan Fona** — Mobile + Backend
- **Adrian Orașan** — This dashboard (you)
- **Alberto Codrin** — IoT Hardware
