// DISABLED CLIENT INTEGRITY SERVICE
// This service was causing HMAC errors and has been completely disabled

class ClientIntegrityService {
  private isInitialized = false;

  constructor() {
    console.log('⚠️ Client Integrity Service is permanently disabled');
    this.isInitialized = true;
  }

  async initialize() {
    return Promise.resolve();
  }

  startIntegrityPings() {
    // No-op - disabled
  }

  stopIntegrityPings() {
    // No-op - disabled
  }

  async generateIntegrityReport() {
    return {};
  }

  async sendIntegrityPing() {
    // No-op - disabled
  }

  setupCSPReporting() {
    // No-op - disabled
  }

  setupSRIMonitoring() {
    // No-op - disabled
  }

  detectSuspiciousExtensions() {
    // No-op - disabled
  }

  registerModule() {
    // No-op - disabled
  }

  checkModuleIntegrity() {
    return true; // Always return true since service is disabled
  }

  getCanaryToken() {
    return null; // No tokens when disabled
  }

  embedReportCanary(reportContent: string) {
    return reportContent; // Return unchanged
  }

  getViolations() {
    return []; // No violations when disabled
  }

  clearViolations() {
    // No-op - disabled
  }
}

const clientIntegrityService = new ClientIntegrityService();
export default clientIntegrityService;

// Empty type exports to maintain compatibility
export interface IntegrityViolation {}
export interface IntegrityReport {}
export interface CanaryToken {}
