// Monitoring utilities for system health
export const monitoring = {
  // System metrics
  getSystemMetrics: () => ({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: Math.random() * 100
  }),
  
  // Performance data
  getPerformanceData: () => Array.from({ length: 10 }, (_, i) => ({
    time: Date.now() - (10 - i) * 60000,
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    network: Math.random() * 50
  })),
  
  // Health status
  getHealthStatus: () => ({
    status: 'healthy',
    uptime: Date.now() - Math.random() * 86400000,
    services: {
      api: 'online',
      database: 'online',
      cache: 'online'
    }
  })
};
