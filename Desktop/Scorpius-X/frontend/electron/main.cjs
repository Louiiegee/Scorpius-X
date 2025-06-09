const electron = require("electron");
const path = require("path");
const url = require("url");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const shell = electron.shell;
const screen = electron.screen;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window with cyberpunk-inspired settings
  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.9), // 90% of screen width
    height: Math.floor(height * 0.9), // 90% of screen height
    minWidth: 1200,
    minHeight: 800,
    show: false, // Don't show until ready
    icon: path.join(__dirname, "../src/assets/logo.png"), // App icon
    titleBarStyle: "default", // Keep default title bar for better UX
    backgroundColor: "#000000", // Match Scorpius black background
    webPreferences: {
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      enableRemoteModule: false, // Security: disable remote module
      preload: path.join(__dirname, "preload.cjs"), // Preload script
      webSecurity: true, // Keep web security enabled
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      devTools: isDev, // Only enable devtools in development
    },
  });

  // Load the app - either dev server or built files
  const startUrl = isDev
    ? "http://localhost:3001" // Vite dev server URL (actual running port)
    : url.format({
        pathname: path.join(__dirname, "../dist/index.html"),
        protocol: "file:",
        slashes: true,
      }); // Built files

  console.log(`Loading Electron app from: ${startUrl}`);
  
  // Load the URL with error handling
  mainWindow.loadURL(startUrl).catch((err) => {
    console.error("Failed to load URL:", err);
    
    // Try fallback URLs if main URL fails
    const fallbackUrls = [
      "http://localhost:3001", // Actual running port
      "http://localhost:3002", // Our configured port
      "http://localhost:5173", // Default Vite port
      "http://localhost:3000", // Alternative React port
      "http://localhost:8080"  // Alternative port
    ];
    
    console.log("Trying fallback URLs...");
    tryFallbackUrls(fallbackUrls, 0);
  });

  // Function to try fallback URLs
  function tryFallbackUrls(urls, index) {
    if (index >= urls.length) {
      console.error("All fallback URLs failed");
      // Load a simple HTML page as last resort
      mainWindow.loadURL('data:text/html,<html><body style="background:#000;color:#0f0;font-family:monospace;padding:20px;"><h1>ScorpiusX Electron</h1><p>Cannot connect to dev server.</p><p>Please ensure the frontend server is running on port 3001 or 5173.</p><p>Try running: npm run dev</p></body></html>');
      return;
    }
    
    console.log(`Trying fallback URL: ${urls[index]}`);
    mainWindow.loadURL(urls[index]).catch(() => {
      tryFallbackUrls(urls, index + 1);
    });
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    console.log("Window ready to show");
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle page load completion
  mainWindow.webContents.once("did-finish-load", () => {
    console.log("Page loaded successfully");
    // Small delay to ensure everything is rendered
    setTimeout(() => {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
    }, 500);
  });

  // Handle load failures
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load page:", errorDescription);
  });

  // Don't auto-open DevTools - user can open manually with F12

  // Prevent navigation to external URLs for security
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== "http://localhost:3001" && parsedUrl.origin !== "file://") {
      event.preventDefault();
    }
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Handle certificate errors (for dev server)
  mainWindow.webContents.on(
    "certificate-error",
    (event, url, error, certificate, callback) => {
      if (isDev && url.startsWith("http://localhost")) {
        // In development, ignore certificate errors for localhost
        event.preventDefault();
        callback(true);
      } else {
        // In production, use default behavior
        callback(false);
      }
    },
  );
}

// Handle window controls from renderer
ipcMain.handle("window-minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle("window-is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Get system information
ipcMain.handle("get-system-info", () => {
  const os = require("os");
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.getSystemVersion(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
  };
});

// Get real-time performance data
ipcMain.handle("get-performance-data", () => {
  const os = require("os");
  const process = require("process");

  return {
    cpuUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage(),
    systemMemory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    },
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
  };
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  // macOS specific behavior
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle protocol for deep linking (future use)
app.setAsDefaultProtocolClient("scorpius");

// Handle deep link (Windows/Linux)
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle app updates (future implementation)
ipcMain.handle("check-for-updates", () => {
  // TODO: Implement auto-updater
  return { updateAvailable: false };
});

// Export for testing
module.exports = { createWindow };
