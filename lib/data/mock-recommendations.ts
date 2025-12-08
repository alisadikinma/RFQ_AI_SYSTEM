export const mockRecommendations = [
  {
    id: '1',
    model_id: 'poco-x6-pro',
    model_code: 'POCO-X6-PRO-MAIN',
    model_name: 'POCO X6 Pro Main Board',
    customer: 'XIAOMI',
    similarity_score: 92,
    matched_stations: ['MBT', 'CAL', 'RFT1', 'FQC', 'BLMMI', 'T_GREASE', 'SHIELD'],
    missing_stations: ['VISUAL'],
    total_investment_usd: 125000,
    total_manpower: 12,
    estimated_uph: 90,
    bottleneck_station: 'RFT1',
    board_matches: {
      'Main Board': { matched: 5, total: 5 },
      'Sub Board': { matched: 2, total: 3 }
    },
    status: 'Active',
    last_run: 'Oct 2024'
  },
  {
    id: '2',
    model_id: 'redmi-note12',
    model_code: 'REDMI-NOTE12-MAIN',
    model_name: 'Redmi Note 12 Main Board',
    customer: 'XIAOMI',
    similarity_score: 78,
    matched_stations: ['MBT', 'CAL', 'RFT1', 'FQC', 'T_GREASE', 'SHIELD'],
    missing_stations: ['BLMMI', 'VISUAL'],
    total_investment_usd: 98000,
    total_manpower: 10,
    estimated_uph: 180,
    bottleneck_station: 'CAL',
    board_matches: {
      'Main Board': { matched: 4, total: 5 },
      'Sub Board': { matched: 2, total: 3 }
    },
    status: 'Active',
    last_run: 'Nov 2024'
  },
  {
    id: '3',
    model_id: 'tcl-40se',
    model_code: 'TCL-40SE-MAIN',
    model_name: 'TCL 40SE Main Board',
    customer: 'TCL',
    similarity_score: 65,
    matched_stations: ['MBT', 'CAL', 'FQC', 'T_GREASE', 'SHIELD', 'VISUAL'],
    missing_stations: ['RFT1', 'BLMMI'],
    total_investment_usd: 85000,
    total_manpower: 8,
    estimated_uph: 220,
    bottleneck_station: 'MBT',
    board_matches: {
      'Main Board': { matched: 3, total: 5 },
      'Sub Board': { matched: 3, total: 3 }
    },
    status: 'Active',
    last_run: 'Dec 2024'
  }
];

export const mockInvestmentBreakdown = [
  { station: 'MBT', qty: 2, unit_price: 8000, subtotal: 16000, vendor: 'Local' },
  { station: 'CAL', qty: 1, unit_price: 15000, subtotal: 15000, vendor: 'Keysight' },
  { station: 'RFT1', qty: 2, unit_price: 25000, subtotal: 50000, vendor: 'R&S' },
  { station: 'FQC', qty: 1, unit_price: 12000, subtotal: 12000, vendor: 'Local' },
  { station: 'BLMMI', qty: 1, unit_price: 10000, subtotal: 10000, vendor: 'Local' },
  { station: 'T_GREASE', qty: 1, unit_price: 5000, subtotal: 5000, vendor: 'Local' },
  { station: 'SHIELD', qty: 1, unit_price: 4000, subtotal: 4000, vendor: 'Local' },
  { station: 'VISUAL', qty: 1, unit_price: 5000, subtotal: 5000, vendor: 'Local' },
];

export const mockCapacityData = [
  { station: 'MBT', utilization: 60, uph: 150, isBottleneck: false },
  { station: 'CAL', utilization: 45, uph: 200, isBottleneck: false },
  { station: 'RFT1', utilization: 100, uph: 90, isBottleneck: true },
  { station: 'FQC', utilization: 75, uph: 120, isBottleneck: false },
  { station: 'BLMMI', utilization: 62, uph: 144, isBottleneck: false },
  { station: 'T_GREASE', utilization: 37, uph: 240, isBottleneck: false },
  { station: 'SHIELD', utilization: 50, uph: 180, isBottleneck: false },
];

export const mockStationDetails = [
  {
    boardType: 'Main Board',
    stations: [
      { yourStation: 'MBT', match: true, historical: 'MBT', mp: 2, uph: 150, cycle: '24s' },
      { yourStation: 'CAL', match: true, historical: 'CAL', mp: 1, uph: 200, cycle: '18s' },
      { yourStation: 'RFT1', match: true, historical: 'RFT1', mp: 2, uph: 90, cycle: '40s' },
      { yourStation: 'FQC', match: true, historical: 'FQC', mp: 1, uph: 120, cycle: '30s' },
      { yourStation: 'BLMMI', match: true, historical: 'BLMMI', mp: 1, uph: 144, cycle: '25s' },
    ]
  },
  {
    boardType: 'Sub Board',
    stations: [
      { yourStation: 'T_GREASE', match: true, historical: 'T_GREASE', mp: 1, uph: 240, cycle: '15s' },
      { yourStation: 'SHIELD', match: true, historical: 'SHIELD', mp: 1, uph: 180, cycle: '20s' },
      { yourStation: 'VISUAL', match: false, historical: '-', mp: '-', uph: '-', cycle: '-', isNew: true },
    ]
  }
];
