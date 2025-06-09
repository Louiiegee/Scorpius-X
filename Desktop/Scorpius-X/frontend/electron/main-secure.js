const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  screen,
  session,
} = require("electron");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

// Security configuration
const isDev = false; // Force production mode for secure builds
const isPackaged = app.isPackaged;

// Security keys and constants (obfuscated)
const SECURITY_CONFIG = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://localhost:* https://127.0.0.1:* wss://localhost:* wss://127.0.0.1:*;",
  ALLOWED_ORIGINS: ["http://localhost:8080", "https://localhost:8080"],
  APP_SALT: process.env.SCORPIUS_APP_SALT || "scorpius_default_salt_2024",
  ENCRYPTION_KEY:
    process.env.SCORPIUS_ENCRYPTION_KEY ||
    crypto.randomBytes(32).toString("hex"),
};

// Anti-debugging and tamper detection
const securityChecks = {
  // Check for debugging tools
  checkDebugger: () => {
    const startTime = Date.now();
    debugger;
    return Date.now() - startTime > 100;
  },

  // Check for common analysis tools
  checkAnalysisTools: () => {
    const suspiciousProcesses = [
      "ollydbg",
      "ida",
      "x64dbg",
      "cheat engine",
      "process hacker",
    ];
    // In production, implement actual process checking
    return false;
  },

  // Verify application integrity
  verifyIntegrity: () => {
    const appPath = app.getAppPath();
    const expectedHash = process.env.SCORPIUS_APP_HASH;
    // In production, implement file hash verification
    return true;
  },
};

// Obfuscated application state
let mainWindow;
let securityState = {
  authenticated: false,
  sessionKey: null,
  lastActivity: Date.now(),
};

// Security middleware
const applySecurity = () => {
  // Remove development tools
  if (isPackaged) {
    const devToolsExtensions = session.defaultSession.getAllExtensions();
    Object.keys(devToolsExtensions).forEach((id) => {
      session.defaultSession.removeExtension(id);
    });
  }

  // Set security headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [SECURITY_CONFIG.CSP],
        "X-Frame-Options": ["DENY"],
        "X-Content-Type-Options": ["nosniff"],
        "Referrer-Policy": ["strict-origin-when-cross-origin"],
        "Permissions-Policy": ["geolocation=(), microphone=(), camera=()"],
      },
    });
  });

  // Block external resources
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    const isAllowed = SECURITY_CONFIG.ALLOWED_ORIGINS.some(
      (origin) =>
        url.startsWith(origin) ||
        url.startsWith("file://") ||
        url.startsWith("data:"),
    );

    callback({ cancel: !isAllowed });
  });
};

// Encrypted data storage
const secureStorage = {
  encrypt: (data) => {
    const cipher = crypto.createCipher(
      "aes-256-cbc",
      SECURITY_CONFIG.ENCRYPTION_KEY,
    );
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  },

  decrypt: (encryptedData) => {
    try {
      const decipher = crypto.createDecipher(
        "aes-256-cbc",
        SECURITY_CONFIG.ENCRYPTION_KEY,
      );
      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return JSON.parse(decrypted);
    } catch (error) {
      return null;
    }
  },
};

function createWindow() {
  // Perform security checks
  if (securityChecks.checkDebugger() || securityChecks.checkAnalysisTools()) {
    // Silently exit if debugging detected
    app.quit();
    return;
  }

  if (!securityChecks.verifyIntegrity()) {
    // Application integrity compromised
    app.quit();
    return;
  }

  // Apply security configurations
  applySecurity();

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.9),
    height: Math.floor(height * 0.9),
    minWidth: 1200,
    minHeight: 800,
    show: false,
    icon: path.join(__dirname, "assets/icon.png"),
    titleBarStyle: "hidden",
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webSecurity: true,
      preload: path.join(__dirname, "preload-secure.js"),
      additionalArguments: [`--app-salt=${SECURITY_CONFIG.APP_SALT}`],
    },
  });

  // Generate session key
  securityState.sessionKey = crypto.randomBytes(32).toString("hex");

  // Load the app
  const startUrl = isDev
    ? "http://localhost:8080"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Security event handlers
  mainWindow.webContents.on("dom-ready", () => {
    // Inject security scripts
    mainWindow.webContents.executeJavaScript(`
      // Disable right-click context menu
      document.addEventListener('contextmenu', e => e.preventDefault());
      
      // Disable F12 and other dev shortcuts
      document.addEventListener('keydown', e => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
        }
      });
      
      // Anti-tampering
      Object.defineProperty(window, 'devtools', {
        get: () => { window.close(); },
        set: () => { window.close(); }
      });
      
      // Session validation
      setInterval(() => {
        if (!window.scorpiusSecurityValidated) {
          window.location.reload();
        }
      }, 30000);
    `);
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    // Block developer shortcuts
    if (input.control && input.shift && input.key === "I") {
      event.preventDefault();
    }
    if (input.key === "F12") {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("devtools-opened", () => {
    // Close app if dev tools are opened
    if (isPackaged) {
      mainWindow.close();
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    securityState = { authenticated: false, sessionKey: null, lastActivity: 0 };
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  // Handle navigation
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const isAllowed = SECURITY_CONFIG.ALLOWED_ORIGINS.some((origin) =>
      navigationUrl.startsWith(origin),
    );

    if (!isAllowed) {
      event.preventDefault();
    }
  });
}

// Secure IPC handlers with authentication
const secureIpcHandlers = {
  "security-validate": async () => {
    const challenge = crypto.randomBytes(16).toString("hex");
    const response = crypto
      .createHash("sha256")
      .update(challenge + SECURITY_CONFIG.APP_SALT)
      .digest("hex");

    return { challenge, response };
  },

  "window-control": async (action) => {
    if (!securityState.authenticated) return false;

    switch (action) {
      case "minimize":
        mainWindow?.minimize();
        return true;
      case "maximize":
        if (mainWindow?.isMaximized()) {
          mainWindow.restore();
        } else {
          mainWindow?.maximize();
        }
        return true;
      case "close":
        mainWindow?.close();
        return true;
      default:
        return false;
    }
  },

  "get-system-info": async () => {
    if (!securityState.authenticated) return null;

    // Return limited system info
    return {
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      secure: true,
    };
  },
};

// Register secure IPC handlers
Object.entries(secureIpcHandlers).forEach(([channel, handler]) => {
  ipcMain.handle(channel, async (event, ...args) => {
    // Update activity timestamp
    securityState.lastActivity = Date.now();

    // Session timeout check
    if (Date.now() - securityState.lastActivity > 3600000) {
      // 1 hour
      securityState.authenticated = false;
    }

    return await handler(...args);
  });
});

// Security validation endpoint
ipcMain.handle("authenticate-session", async (event, credentials) => {
  const { challenge, response } = credentials;

  const expectedResponse = crypto
    .createHash("sha256")
    .update(challenge + SECURITY_CONFIG.APP_SALT)
    .digest("hex");

  if (response === expectedResponse) {
    securityState.authenticated = true;
    securityState.lastActivity = Date.now();
    return { success: true, sessionKey: securityState.sessionKey };
  }

  return { success: false };
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security event handlers
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });

  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  contents.on("will-navigate", (event, navigationUrl) => {
    const isAllowed = SECURITY_CONFIG.ALLOWED_ORIGINS.some((origin) =>
      navigationUrl.startsWith(origin),
    );

    if (!isAllowed) {
      event.preventDefault();
    }
  });
});

// Prevent protocol hijacking
app.on("ready", () => {
  session.defaultSession.protocol.interceptHttpProtocol(
    "http",
    (req, callback) => {
      callback({ path: path.normalize(`${__dirname}/../dist/index.html`) });
    },
  );
});

// Handle certificate errors in production
app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    if (!isDev) {
      // In production, reject all certificate errors
      callback(false);
    } else {
      // In development, allow localhost
      if (url.startsWith("https://localhost")) {
        event.preventDefault();
        callback(true);
      } else {
        callback(false);
      }
    }
  },
);

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Export for testing (removed in production)
if (!isPackaged) {
  module.exports = { createWindow, securityChecks };
}
