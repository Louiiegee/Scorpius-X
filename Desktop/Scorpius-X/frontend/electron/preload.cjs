const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // System information
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getPerformanceData: () => ipcRenderer.invoke("get-performance-data"),

  // App management
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),

  // Environment detection
  isElectron: true,
  platform: process.platform,

  // Notifications (using web notifications API, enhanced by Electron)
  showNotification: (title, options = {}) => {
    if ("Notification" in window && Notification.permission === "granted") {
      return new Notification(title, {
        icon: "/icon.png",
        badge: "/icon.png",
        ...options,
      });
    }
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ("Notification" in window) {
      return await Notification.requestPermission();
    }
    return "denied";
  },

  // Development helpers
  isDev: process.env.NODE_ENV === "development",
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Expose a limited console for debugging (development only)
if (process.env.NODE_ENV === "development") {
  contextBridge.exposeInMainWorld("electronConsole", {
    log: (...args) => console.log("[Electron]", ...args),
    error: (...args) => console.error("[Electron]", ...args),
    warn: (...args) => console.warn("[Electron]", ...args),
  });
}

// Listen for theme changes (for future implementation)
contextBridge.exposeInMainWorld("electronTheme", {
  // TODO: Implement theme detection and changes
  getSystemTheme: () => "dark", // Scorpius is always dark
  onThemeChange: (callback) => {
    // Future implementation for system theme changes
  },
});

// Performance monitoring utilities
contextBridge.exposeInMainWorld("electronPerformance", {
  // Monitor frame rate
  startPerformanceMonitoring: (callback) => {
    let lastTime = performance.now();
    let frameCount = 0;

    function tick(currentTime) {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Get system performance data
        ipcRenderer.invoke("get-performance-data").then((perfData) => {
          callback({
            fps,
            ...perfData,
            timestamp: currentTime,
          });
        });
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  },
});

// Security helpers
contextBridge.exposeInMainWorld("electronSecurity", {
  // Sanitize external URLs
  isSafeUrl: (url) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // Hash generation for security
  generateHash: async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },
});

// Storage helpers (secure local storage)
contextBridge.exposeInMainWorld("electronStorage", {
  // These use the standard web APIs but are enhanced by Electron's security
  setItem: (key, value) => {
    try {
      localStorage.setItem(`scorpius_${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  },

  getItem: (key) => {
    try {
      const item = localStorage.getItem(`scorpius_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(`scorpius_${key}`);
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  },

  clear: () => {
    try {
      // Only clear Scorpius-related items
      Object.keys(localStorage)
        .filter((key) => key.startsWith("scorpius_"))
        .forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  },
});

// Development reload helper
if (process.env.NODE_ENV === "development") {
  contextBridge.exposeInMainWorld("electronDev", {
    reload: () => location.reload(),
    openDevTools: () => ipcRenderer.invoke("open-dev-tools"),
    getDevInfo: () => ({
      isDevMode: true,
      loadedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }),
  });
}

// Initialize app-specific configurations
window.addEventListener("DOMContentLoaded", () => {
  // Add Electron-specific class to body for CSS targeting
  document.body.classList.add("electron-app");

  // Add platform-specific class
  document.body.classList.add(`platform-${process.platform}`);

  // Add development mode class if in dev
  if (process.env.NODE_ENV === "development") {
    document.body.classList.add("dev-mode");
  }

  // Set up initial notification permission request
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // Log successful load
  console.log("🚀 Scorpius Electron App Loaded Successfully!");
  console.log("Platform:", process.platform);
  console.log("Electron Version:", process.versions.electron);
  console.log("Chrome Version:", process.versions.chrome);
});
