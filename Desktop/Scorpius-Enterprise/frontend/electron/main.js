const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
} = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { autoUpdater } = require("electron-updater");

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: !isDev,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, "../public/favicon.ico"),
    title: "Scorpius - Blockchain Security Analysis",
    titleBarStyle: "default",
    show: false, // Don't show until ready
    backgroundColor: "#181a1b",
  });  // Load the app
  const startUrl = isDev
    ? "http://localhost:8080"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Focus on the window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const currentUrl = new URL(mainWindow.webContents.getURL());

    if (parsedUrl.origin !== currentUrl.origin) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Auto updater (only in production)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", (event) => {
  // Cleanup tasks before quitting
  if (mainWindow) {
    mainWindow.webContents.send("app-before-quit");
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Scan",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-scan");
          },
        },
        {
          label: "Open Contract",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                { name: "Solidity Files", extensions: ["sol"] },
                { name: "Bytecode Files", extensions: ["bin", "hex"] },
                { name: "All Files", extensions: ["*"] },
              ],
            });

            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send(
                "menu-open-file",
                result.filePaths[0],
              );
            }
          },
        },
        { type: "separator" },
        {
          label: "Export Report",
          accelerator: "CmdOrCtrl+E",
          click: () => {
            mainWindow.webContents.send("menu-export-report");
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Modules",
      submenu: [
        {
          label: "Scanner",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "scanner");
          },
        },
        {
          label: "Mempool Monitor",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "mempool");
          },
        },
        {
          label: "Bytecode Analysis",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "bytecode");
          },
        },
        {
          label: "Time Machine",
          accelerator: "CmdOrCtrl+4",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "timemachine");
          },
        },
        {
          label: "Simulation Engine",
          accelerator: "CmdOrCtrl+5",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "simulation");
          },
        },
        {
          label: "Reports",
          accelerator: "CmdOrCtrl+6",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "reports");
          },
        },
        {
          label: "MEV Operations",
          accelerator: "CmdOrCtrl+7",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "mev");
          },
        },
        {
          label: "Honeypot Detector",
          accelerator: "CmdOrCtrl+8",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "honeypot");
          },
        },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+9",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "settings");
          },
        },
      ],
    },
    {
      label: "Tools",
      submenu: [
        {
          label: "Start Monitoring",
          accelerator: "CmdOrCtrl+Shift+M",
          click: () => {
            mainWindow.webContents.send("menu-start-monitoring");
          },
        },
        {
          label: "Stop All Scans",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            mainWindow.webContents.send("menu-stop-scans");
          },
        },
        { type: "separator" },
        {
          label: "Clear Cache",
          click: () => {
            mainWindow.webContents.session.clearCache().then(() => {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Cache Cleared",
                message: "Application cache has been cleared successfully.",
              });
            });
          },
        },
        {
          label: "Reset Settings",
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: "warning",
              title: "Reset Settings",
              message:
                "Are you sure you want to reset all settings to default?",
              buttons: ["Cancel", "Reset"],
              defaultId: 0,
              cancelId: 0,
            });

            if (result.response === 1) {
              mainWindow.webContents.send("menu-reset-settings");
            }
          },
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
        ...(process.platform === "darwin"
          ? [{ type: "separator" }, { role: "front" }]
          : []),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => {
            shell.openExternal("https://docs.scorpius.security");
          },
        },
        {
          label: "API Reference",
          click: () => {
            shell.openExternal("https://api.scorpius.security");
          },
        },
        {
          label: "Report Issue",
          click: () => {
            shell.openExternal("https://github.com/scorpius/issues");
          },
        },
        { type: "separator" },
        {
          label: "About Scorpius",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Scorpius",
              message: "Scorpius - Blockchain Security Analysis Platform",
              detail:
                "Version: 1.0.0\nBuilt with Electron and React\n\nAnalyze. Simulate. Exploit.",
            });
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle("show-open-dialog", async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle("show-message-box", async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Auto updater events (production only)
if (!isDev) {
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available.");
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message:
        "A new version is available. It will be downloaded in the background.",
      buttons: ["OK"],
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("Update not available.");
  });

  autoUpdater.on("error", (err) => {
    console.log("Error in auto-updater. " + err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + " - Downloaded " + progressObj.percent + "%";
    log_message =
      log_message +
      " (" +
      progressObj.transferred +
      "/" +
      progressObj.total +
      ")";
    console.log(log_message);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded");
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Ready",
        message:
          "Update downloaded. Application will restart to apply the update.",
        buttons: ["Restart Now", "Later"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });
}

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});

// Handle certificate errors
app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
      // In development, ignore certificate errors
      event.preventDefault();
      callback(true);
    } else {
      // In production, use default behavior
      callback(false);
    }
  },
);
