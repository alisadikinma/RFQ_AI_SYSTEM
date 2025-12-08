export const mockDashboardData = {
  stats: {
    models: { value: 156, trend: 'up' as const, change: '+5 new' },
    machines: { value: 24, trend: 'up' as const, change: '+2' },
    thisMonth: { value: 12, trend: 'up' as const, change: '+33%' },
    avgMatch: { value: 89, trend: 'up' as const, change: '+2.5%' }
  },
  trends: [
    { month: 'Jul', total: 8, completed: 7, pending: 1 },
    { month: 'Aug', total: 12, completed: 11, pending: 1 },
    { month: 'Sep', total: 10, completed: 9, pending: 1 },
    { month: 'Oct', total: 15, completed: 14, pending: 1 },
    { month: 'Nov', total: 18, completed: 16, pending: 2 },
    { month: 'Dec', total: 22, completed: 18, pending: 4 }
  ],
  topModels: [
    { id: '1', name: 'POCO-X6-PRO', count: 23 },
    { id: '2', name: 'REDMI-NOTE12', count: 18 },
    { id: '3', name: 'TCL-40SE', count: 15 },
    { id: '4', name: 'REALME-C51', count: 12 },
    { id: '5', name: 'OPPO-A57', count: 8 }
  ],
  topCustomers: [
    { id: '1', name: 'XIAOMI', count: 45 },
    { id: '2', name: 'TCL', count: 28 },
    { id: '3', name: 'REALME', count: 12 },
    { id: '4', name: 'OPPO', count: 8 },
    { id: '5', name: 'VIVO', count: 5 }
  ],
  recentRFQs: [
    { id: 'RFQ-001234', customer: 'XIAOMI', model: 'POCO-X7', status: 'completed' as const, match: 92 },
    { id: 'RFQ-001233', customer: 'TCL', model: 'TCL-50XE', status: 'processing' as const, match: null },
    { id: 'RFQ-001232', customer: 'REALME', model: 'REALME-C55', status: 'completed' as const, match: 87 },
    { id: 'RFQ-001231', customer: 'XIAOMI', model: 'REDMI-13', status: 'completed' as const, match: 78 },
    { id: 'RFQ-001230', customer: 'OPPO', model: 'OPPO-A79', status: 'draft' as const, match: null }
  ]
};
