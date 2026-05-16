// ===========================
// BegaVerse — Mock Data
// Will be replaced by real DB
// ===========================

const MOCK_DATA = {

  // IoT Sensor readings (50 sensors planned, 1 live for MVP)
  sensors: [
    { id: 'S001', name: 'Podul Decebal', lat: 45.7489, lon: 21.2087, status: 'online',
      ph: 7.2, turbidity: 12, temperature: 18.4, oxygen: 8.6, waterLevel: 142,
      history: [7.1, 7.2, 7.0, 7.3, 7.2, 7.1, 7.2, 7.3, 7.2, 7.1, 7.2, 7.4],
      waterLevelHistory: [138, 140, 141, 143, 142, 140, 141, 143, 144, 142, 141, 142] },
    { id: 'S002', name: 'Podul Michelangelo', lat: 45.7501, lon: 21.2150, status: 'online',
      ph: 6.9, turbidity: 18, temperature: 17.8, oxygen: 7.9, waterLevel: 138,
      history: [6.8, 6.9, 7.0, 6.9, 6.8, 6.9, 7.0, 6.9, 6.8, 7.0, 6.9, 6.9],
      waterLevelHistory: [135, 136, 137, 138, 137, 136, 138, 139, 138, 137, 138, 138] },
    { id: 'S003', name: 'Podul Eroilor', lat: 45.7521, lon: 21.2210, status: 'warning',
      ph: 6.5, turbidity: 34, temperature: 19.1, oxygen: 6.2, waterLevel: 189,
      history: [7.0, 6.9, 6.8, 6.6, 6.5, 6.5, 6.6, 6.5, 6.4, 6.5, 6.5, 6.5],
      waterLevelHistory: [155, 160, 165, 170, 175, 178, 180, 183, 185, 187, 188, 189] },
    { id: 'S004', name: 'Parcul Rozelor', lat: 45.7535, lon: 21.2270, status: 'online',
      ph: 7.4, turbidity: 8, temperature: 17.2, oxygen: 9.1, waterLevel: 129,
      history: [7.4, 7.3, 7.4, 7.5, 7.4, 7.4, 7.3, 7.4, 7.5, 7.4, 7.4, 7.5],
      waterLevelHistory: [128, 129, 128, 130, 129, 128, 129, 130, 129, 128, 129, 129] },
    { id: 'S005', name: 'Zona Industrială', lat: 45.7475, lon: 21.2020, status: 'offline',
      ph: 0, turbidity: 0, temperature: 0, oxygen: 0, waterLevel: 0,
      history: [], waterLevelHistory: [] }
  ],

  // QR-linked historical eras
  eras: [
    {
      year: '1900',
      label: 'Belle Époque Timișoara',
      icon: '🏛️',
      desc: 'Austro-Hungarian grandeur — gas lanterns, horse-drawn carriages, textile mills.',
      color: '#D4A96A',
      facts: ['Canal used for textile industry', 'Population: 50,000', 'First electric trams'],
      qr: 'QR-1900-BEGA'
    },
    {
      year: '1920',
      label: 'Postwar Romania',
      icon: '🌉',
      desc: 'Integration into Romania — bridge expansions, new riverside promenades.',
      color: '#8FB5D4',
      facts: ['8 bridges across Bega', 'First modern waterworks', 'River sports clubs'],
      qr: 'QR-1920-BEGA'
    },
    {
      year: '1945',
      label: 'Wartime & Reconstruction',
      icon: '🏗️',
      desc: 'WWII aftermath — the city rebuilds, Bega serves as industrial lifeline.',
      color: '#9E9E9E',
      facts: ['Industrial expansion', 'Canal banks reinforced', 'Soviet-era planning begins'],
      qr: 'QR-1945-BEGA'
    },
    {
      year: '1970',
      label: 'Communist Urbanization',
      icon: '🏢',
      desc: 'Bloc construction era — the Bega becomes less accessible as industry expands.',
      color: '#78909C',
      facts: ['Bega canalization project', 'Industrial pollution rises', '200,000 inhabitants'],
      qr: 'QR-1970-BEGA'
    },
    {
      year: '1989',
      label: 'Revolution Era',
      icon: '✊',
      desc: 'Timișoara leads Romania\'s revolution — the Bega witnesses history.',
      color: '#EF5350',
      facts: ['First free city in Romania', 'Bega as gathering point', '325,000 inhabitants'],
      qr: 'QR-1989-BEGA'
    },
    {
      year: '2024',
      label: 'Digital Present',
      icon: '📡',
      desc: 'EU funds revitalize the riverfront — smart city infrastructure being deployed.',
      color: '#4FC3F7',
      facts: ['IoT sensor network', 'Cycling paths 8km', 'Startup ecosystem grows'],
      qr: 'QR-2024-BEGA'
    },
    {
      year: '2050',
      label: 'Future Bega',
      icon: '🌿',
      desc: 'Vision 2050: rewilded banks, zero-emission boats, AI-managed water quality.',
      color: '#66BB6A',
      facts: ['Fully rewilded south bank', 'Solar-powered waterway', 'Climate-resilient city'],
      qr: 'QR-2050-BEGA'
    }
  ],

  // Land parcels for SimCity mode
  parcels: [
    { id: 'P001', name: 'Parcel A — Fabric', size: '1200 m²', price: '€24,000', status: 'available', type: 'park' },
    { id: 'P002', name: 'Parcel B — Cetate', size: '800 m²', price: '€32,000', status: 'owned', type: 'building' },
    { id: 'P003', name: 'Parcel C — Elisabetin', size: '600 m²', price: '€18,000', status: 'available', type: 'park' },
    { id: 'P004', name: 'Parcel D — Mehala', size: '2000 m²', price: '€28,000', status: 'pending', type: 'mixed' },
  ],

  // Blockchain transaction log
  transactions: [
    { hash: '0x4a2b...f91c', sensor: 'S001', type: 'Reading', value: 'pH 7.2', time: '2 min ago', block: 8891234 },
    { hash: '0x78cd...a33f', sensor: 'S002', type: 'Reading', value: 'Turb 18NTU', time: '8 min ago', block: 8891198 },
    { hash: '0x12ea...6b7d', sensor: 'S001', type: 'Alert', value: 'pH spike', time: '23 min ago', block: 8891102 },
    { hash: '0x9f0e...c821', sensor: 'S004', type: 'Reading', value: 'O₂ 9.1mg/L', time: '32 min ago', block: 8891055 },
    { hash: '0xc44d...2af0', sensor: 'S003', type: 'Reading', value: 'Temp 19.1°C', time: '41 min ago', block: 8891010 },
    { hash: '0x31bb...9e12', sensor: 'S002', type: 'Reading', value: 'pH 6.9', time: '55 min ago', block: 8890977 },
  ],

  // Pollution reports
  reports: [
    { id: 'R047', location: 'Podul Eroilor', type: 'Trash', severity: 'medium', status: 'pending', time: '1h ago', reporter: 'Anonymous' },
    { id: 'R046', location: 'Parcul Rozelor', type: 'Oil Spill', severity: 'high', status: 'resolved', time: '3h ago', reporter: 'Citizen' },
    { id: 'R045', location: 'Zona Fabric', type: 'Foam', severity: 'low', status: 'reviewing', time: '6h ago', reporter: 'Sensor S003' },
    { id: 'R044', location: 'Podul Decebal', type: 'Trash', severity: 'low', status: 'resolved', time: '1d ago', reporter: 'Anonymous' },
  ],

  // Dashboard summary stats
  stats: {
    activeUsers: 1847,
    arScans: 342,
    treesPlanted: 67,
    sensorsOnline: 4,
    totalSensors: 50,
    waterQuality: 76,
    reportsToday: 3,
    tokensOnChain: 1203
  }
};
