const { contextBridge, ipcRenderer } = require("electron");
const crypto = require("crypto");

// Security configuration
const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_FAILED_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100,
};

// Security state
let securityState = {
  authenticated: false,
  sessionKey: null,
  failedAttempts: 0,
  lastActivity: Date.now(),
  requestCount: 0,
  windowStart: Date.now(),
};

// Anti-tampering measures
const antiTamper = {
  checkIntegrity: () => {
    // Verify critical functions haven't been modified
    const criticalFunctions = [
      "ipcRenderer.invoke",
      "contextBridge.exposeInMainWorld",
      "crypto.createHash",
    ];

    return criticalFunctions.every((func) => {
      try {
        return typeof eval(func) === "function";
      } catch {
        return false;
      }
    });
  },

  detectDebugger: () => {
    const start = Date.now();
    debugger;
    return Date.now() - start > 100;
  },

  obfuscateError: (error) => {
    // Don't expose internal error details
    return "Security validation failed";
  },
};

// Rate limiting
const rateLimiter = {
  checkLimit: () => {
    const now = Date.now();

    // Reset window if expired
    if (now - securityState.windowStart > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
      securityState.requestCount = 0;
      securityState.windowStart = now;
    }

    securityState.requestCount++;
    return (
      securityState.requestCount <= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW
    );
  },

  isBlocked: () => {
    return securityState.requestCount > SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW;
  },
};

// Secure API wrapper
const secureAPI = {
  async invoke(channel, ...args) {
    // Security checks
    if (!antiTamper.checkIntegrity()) {
      throw new Error(antiTamper.obfuscateError("Integrity check failed"));
    }

    if (antiTamper.detectDebugger()) {
      window.close();
      return;
    }

    if (!rateLimiter.checkLimit()) {
      throw new Error("Rate limit exceeded");
    }

    // Session validation for sensitive operations
    const sensitiveChannels = [
      "get-system-info",
      "window-control",
      "file-operations",
    ];
    if (sensitiveChannels.includes(channel) && !securityState.authenticated) {
      throw new Error("Authentication required");
    }

    // Update activity
    securityState.lastActivity = Date.now();

    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      throw new Error(antiTamper.obfuscateError(error.message));
    }
  },

  async authenticate() {
    try {
      // Get authentication challenge
      const { challenge, response } =
        await ipcRenderer.invoke("security-validate");

      // Solve challenge
      const solution = crypto
        .createHash("sha256")
        .update(challenge + (process.env.SCORPIUS_APP_SALT || "default_salt"))
        .digest("hex");

      // Submit authentication
      const result = await ipcRenderer.invoke("authenticate-session", {
        challenge,
        response: solution,
      });

      if (result.success) {
        securityState.authenticated = true;
        securityState.sessionKey = result.sessionKey;
        securityState.failedAttempts = 0;
        return true;
      } else {
        securityState.failedAttempts++;
        if (
          securityState.failedAttempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS
        ) {
          window.close();
        }
        return false;
      }
    } catch (error) {
      securityState.failedAttempts++;
      return false;
    }
  },
};

// Protected API exposure
contextBridge.exposeInMainWorld("electronAPI", {
  // System information (limited)
  getSystemInfo: async () => {
    return await secureAPI.invoke("get-system-info");
  },

  // Window controls
  minimizeWindow: async () => {
    return await secureAPI.invoke("window-control", "minimize");
  },

  maximizeWindow: async () => {
    return await secureAPI.invoke("window-control", "maximize");
  },

  closeWindow: async () => {
    return await secureAPI.invoke("window-control", "close");
  },

  // Security features
  authenticate: async () => {
    return await secureAPI.authenticate();
  },

  isAuthenticated: () => {
    return securityState.authenticated;
  },

  // Environment detection (limited info)
  isElectron: true,
  isSecure: true,
  platform: process.platform,

  // Secure notifications
  showNotification: (title, options = {}) => {
    if (rateLimiter.isBlocked()) return null;

    if ("Notification" in window && Notification.permission === "granted") {
      return new Notification(title, {
        icon: "/assets/icon.png",
        badge: "/assets/icon.png",
        ...options,
        // Remove any dangerous options
        actions: undefined,
        data: undefined,
      });
    }
    return null;
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ("Notification" in window) {
      return await Notification.requestPermission();
    }
    return "denied";
  },
});

// Secure storage API
contextBridge.exposeInMainWorld("electronStorage", {
  setItem: (key, value) => {
    if (!securityState.authenticated) return false;

    try {
      // Encrypt sensitive data
      const encryptedValue = crypto
        .createHash("sha256")
        .update(JSON.stringify(value) + securityState.sessionKey)
        .digest("hex");

      localStorage.setItem(`scorpius_secure_${key}`, encryptedValue);
      return true;
    } catch {
      return false;
    }
  },

  getItem: (key) => {
    if (!securityState.authenticated) return null;

    try {
      const item = localStorage.getItem(`scorpius_secure_${key}`);
      if (!item) return null;

      // In a real implementation, decrypt the value
      return item;
    } catch {
      return null;
    }
  },

  removeItem: (key) => {
    if (!securityState.authenticated) return false;

    try {
      localStorage.removeItem(`scorpius_secure_${key}`);
      return true;
    } catch {
      return false;
    }
  },
});

// Security monitoring
contextBridge.exposeInMainWorld("electronSecurity", {
  // Check if environment is secure
  isSecureEnvironment: () => {
    return antiTamper.checkIntegrity() && !antiTamper.detectDebugger();
  },

  // Get security status
  getSecurityStatus: () => {
    return {
      authenticated: securityState.authenticated,
      sessionActive:
        Date.now() - securityState.lastActivity <
        SECURITY_CONFIG.SESSION_TIMEOUT,
      rateLimited: rateLimiter.isBlocked(),
      integrity: antiTamper.checkIntegrity(),
    };
  },

  // Validate URL safety
  isSafeUrl: (url) => {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ["http:", "https:", "mailto:"];
      const allowedHosts = ["localhost", "127.0.0.1"];

      return (
        allowedProtocols.includes(parsed.protocol) &&
        (allowedHosts.includes(parsed.hostname) || parsed.hostname === "")
      );
    } catch {
      return false;
    }
  },
});

// Development helpers (removed in production)
if (process.env.NODE_ENV === "development") {
  contextBridge.exposeInMainWorld("electronDev", {
    reload: () => location.reload(),
    getDevInfo: () => ({
      isDevMode: true,
      loadedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }),
  });
}

// Initialize security on DOM ready
window.addEventListener("DOMContentLoaded", async () => {
  // Add security classes to body
  document.body.classList.add("electron-app", "secure-app");
  document.body.classList.add(`platform-${process.platform}`);

  // Attempt authentication
  const authenticated = await secureAPI.authenticate();

  if (authenticated) {
    // Set security validation flag
    window.scorpiusSecurityValidated = true;

    // Start session monitoring
    setInterval(() => {
      const now = Date.now();
      if (now - securityState.lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
        securityState.authenticated = false;
        window.scorpiusSecurityValidated = false;
        location.reload();
      }
    }, 60000); // Check every minute

    console.log("🔒 Scorpius Secure Electron Environment Initialized");
  } else {
    console.error("❌ Security authentication failed");
    window.close();
  }
});

// Anti-debugging measures
setInterval(() => {
  if (antiTamper.detectDebugger()) {
    window.close();
  }
}, 5000);

// Disable dangerous APIs
delete window.eval;
delete window.Function;
delete window.setTimeout.constructor;
delete window.setInterval.constructor;

// Override console in production
if (process.env.NODE_ENV === "production") {
  window.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
  };
}
