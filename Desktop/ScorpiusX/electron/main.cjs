const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  screen,
  Menu,
  MenuItem,
} = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window optimized for Windows
  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.9), // 90% of screen width
    height: Math.floor(height * 0.9), // 90% of screen height
    minWidth: 1200,
    minHeight: 800,
    show: false, // Don't show until ready-to-show
    icon: path.join(
      __dirname,
      "assets",
      process.platform === "win32" ? "icon.ico" : "icon.png",
    ),
    titleBarStyle: process.platform === "win32" ? "hidden" : "hiddenInset", // Windows-optimized title bar
    frame: false, // Frameless window for modern aesthetic
    backgroundColor: "#000000", // Match Scorpius black background
    transparent: false, // Disable transparency for better Windows performance
    webPreferences: {
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      enableRemoteModule: false, // Security: disable remote module
      preload: path.join(__dirname, "preload.cjs"), // Preload script
      webSecurity: true, // Keep web security enabled
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  // Load the app - either dev server or built files
  const startUrl = isDev
    ? "http://localhost:8080" // Vite dev server URL (ScorpiusX frontend)
    : `file://${path.join(__dirname, "../dist/index.html")}`; // Built files

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Focus on the window
    mainWindow.focus();

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
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

  // Prevent navigation away from the app
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow same-origin navigation
    if (parsedUrl.origin !== startUrl.split("/").slice(0, 3).join("/")) {
      event.preventDefault();
    }
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

// Windows-specific app setup
if (process.platform === "win32") {
  // Set Windows app user model ID for proper taskbar grouping
  app.setAppUserModelId("com.scorpius.cybersecurity.dashboard");

  // Handle Windows notifications
  app.setAsDefaultProtocolClient("scorpius");

  // Windows file association handling
  if (process.argv.length >= 2) {
    // Handle file associations or protocol calls
    console.log("Windows launch args:", process.argv);
  }
}

// Handle app updates (future implementation)
ipcMain.handle("check-for-updates", () => {
  // TODO: Implement auto-updater for Windows
  return { updateAvailable: false };
});

// Windows-specific IPC handlers
ipcMain.handle("get-windows-info", () => {
  if (process.platform !== "win32") return null;

  return {
    isWindows: true,
    version: require("os").release(),
    arch: process.arch,
    userInfo: require("os").userInfo(),
  };
});

// Handle Windows sleep/wake events
if (process.platform === "win32") {
  const { powerMonitor } = require("electron");

  powerMonitor.on("suspend", () => {
    console.log("System is going to sleep");
    // Handle sleep event
  });

  powerMonitor.on("resume", () => {
    console.log("System is waking up");
    // Handle wake event
  });
}

// Export for testing
module.exports = { createWindow };
