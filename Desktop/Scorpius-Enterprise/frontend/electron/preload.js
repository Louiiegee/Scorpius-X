const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // App information
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),

  // File system operations
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),
  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),

  // Menu events (from main to renderer)
  onMenuNewScan: (callback) => ipcRenderer.on("menu-new-scan", callback),
  onMenuOpenFile: (callback) => ipcRenderer.on("menu-open-file", callback),
  onMenuExportReport: (callback) =>
    ipcRenderer.on("menu-export-report", callback),
  onMenuNavigate: (callback) => ipcRenderer.on("menu-navigate", callback),
  onMenuStartMonitoring: (callback) =>
    ipcRenderer.on("menu-start-monitoring", callback),
  onMenuStopScans: (callback) => ipcRenderer.on("menu-stop-scans", callback),
  onMenuResetSettings: (callback) =>
    ipcRenderer.on("menu-reset-settings", callback),

  // App lifecycle events
  onAppBeforeQuit: (callback) => ipcRenderer.on("app-before-quit", callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Utility functions
  openExternal: (url) => {
    // This will be handled by the main process
    ipcRenderer.send("open-external", url);
  },
});

// Security: Remove any Node.js access
delete window.require;
delete window.exports;
delete window.module;

// Prevent access to Node.js globals
Object.defineProperty(window, "process", {
  get() {
    throw new Error("Access to process is not allowed");
  },
});
