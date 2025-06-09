#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Configuration
const CONFIG = {
  SCANNER_PORT: 8001,
  MEMPOOL_PORT: 8002,
  MEV_PORT: 8003,
  FRONTEND_PORT: 8080,
  BACKEND_DIR: "./backend",
  FRONTEND_DIR: "./",
  STARTUP_DELAY: 2000, // 2 seconds between service starts
  HEALTH_CHECK_TIMEOUT: 30000, // 30 seconds timeout for health checks
  ELECTRON_DELAY: 5000, // 5 seconds delay before starting Electron
};

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Logging utilities
const log = {
  info: (service, message) =>
    console.log(`${colors.cyan}[${service}]${colors.reset} ${message}`),
  success: (service, message) =>
    console.log(`${colors.green}[${service}]${colors.reset} ${message}`),
  warning: (service, message) =>
    console.log(`${colors.yellow}[${service}]${colors.reset} ${message}`),
  error: (service, message) =>
    console.log(`${colors.red}[${service}]${colors.reset} ${message}`),
  header: (message) =>
    console.log(`${colors.bright}${colors.magenta}${message}${colors.reset}`),
};

// Process tracking
const processes = {
  scanner: null,
  mempool: null,
  mev: null,
  frontend: null,
  electron: null,
};

// Cleanup function
function cleanup() {
  log.header("\n🛑 Shutting down services...");
  
  Object.entries(processes).forEach(([name, process]) => {
    if (process && !process.killed) {
      log.info("CLEANUP", `Stopping ${name}...`);
      process.kill("SIGTERM");
    }
  });
  
  log.success("CLEANUP", "All services stopped");
  process.exit(0);
}

// Handle Ctrl+C and other signals
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

// Health check utilities
async function checkPort(port, timeout = 5000) {
  return new Promise((resolve) => {
    const net = require("net");
    const socket = new net.Socket();

    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);

    socket.on("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });

    socket.connect(port, "localhost");
  });
}

async function waitForService(serviceName, port, maxAttempts = 30) {
  log.info(serviceName, `Waiting for service to be ready on port ${port}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isReady = await checkPort(port, 1000);

    if (isReady) {
      log.success(
        serviceName,
        `Service is ready! (attempt ${attempt}/${maxAttempts})`,
      );
      return true;
    }

    log.info(
      serviceName,
      `Health check ${attempt}/${maxAttempts} - waiting...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  log.error(
    serviceName,
    `Service failed to start after ${maxAttempts} attempts`,
  );
  return false;
}

// Service starters
async function startScanner() {
  return new Promise((resolve, reject) => {
    log.info("SCANNER", "Starting Scanner API Server...");

    // Determine Python command
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    // Start the Scanner API Server
    const scanner = spawn(pythonCmd, ["scanner.py"], {
      cwd: CONFIG.BACKEND_DIR,
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: CONFIG.SCANNER_PORT.toString(),
        NODE_ENV: "development",
      },
    });

    processes.scanner = scanner;

    scanner.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        log.info("SCANNER", output);
      }
    });

    scanner.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output && !output.includes("WARNING")) {
        log.warning("SCANNER", output);
      }
    });

    scanner.on("close", (code) => {
      if (code !== 0) {
        log.error("SCANNER", `Process exited with code ${code}`);
      }
    });

    // Wait for scanner to be ready
    setTimeout(async () => {
      const isReady = await waitForService("SCANNER", CONFIG.SCANNER_PORT);
      if (isReady) {
        resolve();
      } else {
        reject(new Error("Scanner failed to start"));
      }
    }, CONFIG.STARTUP_DELAY);
  });
}

async function startMempool() {
  return new Promise((resolve, reject) => {
    log.info("MEMPOOL", "Starting Mempool API Server...");

    // Determine Python command
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    // Start the Mempool API Server
    const mempool = spawn(pythonCmd, ["mempool.py"], {
      cwd: CONFIG.BACKEND_DIR,
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: CONFIG.MEMPOOL_PORT.toString(),
        NODE_ENV: "development",
      },
    });

    processes.mempool = mempool;

    mempool.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        log.info("MEMPOOL", output);
      }
    });

    mempool.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output && !output.includes("WARNING")) {
        log.warning("MEMPOOL", output);
      }
    });

    mempool.on("close", (code) => {
      if (code !== 0) {
        log.error("MEMPOOL", `Process exited with code ${code}`);
      }
    });

    // Wait for mempool to be ready
    setTimeout(async () => {
      const isReady = await waitForService("MEMPOOL", CONFIG.MEMPOOL_PORT);
      if (isReady) {
        resolve();
      } else {
        reject(new Error("Mempool failed to start"));
      }
    }, CONFIG.STARTUP_DELAY);
  });
}

async function startMev() {
  return new Promise((resolve, reject) => {
    log.info("MEV", "Starting MEV API Server...");

    // Determine Python command
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    // Start the MEV API Server
    const mev = spawn(pythonCmd, ["mev.py"], {
      cwd: CONFIG.BACKEND_DIR,
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: CONFIG.MEV_PORT.toString(),
        NODE_ENV: "development",
      },
    });

    processes.mev = mev;

    mev.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        log.info("MEV", output);
      }
    });

    mev.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output && !output.includes("WARNING")) {
        log.warning("MEV", output);
      }
    });

    mev.on("close", (code) => {
      if (code !== 0) {
        log.error("MEV", `Process exited with code ${code}`);
      }
    });

    // Wait for mev to be ready
    setTimeout(async () => {
      const isReady = await waitForService("MEV", CONFIG.MEV_PORT);
      if (isReady) {
        resolve();
      } else {
        reject(new Error("MEV failed to start"));
      }
    }, CONFIG.STARTUP_DELAY);
  });
}

async function startFrontend() {
  return new Promise((resolve, reject) => {
    log.info("FRONTEND", "Starting Vite development server...");

    // Determine npm command
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

    // Start the Vite dev server
    const frontend = spawn(npmCmd, ["run", "dev"], {
      cwd: CONFIG.FRONTEND_DIR,
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: CONFIG.FRONTEND_PORT.toString(),
        NODE_ENV: "development",
      },
    });

    processes.frontend = frontend;

    frontend.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        log.info("FRONTEND", output);

        // Check for ready message
        if (output.includes("Local:") || output.includes("localhost:")) {
          resolve();
        }
      }
    });

    frontend.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        log.warning("FRONTEND", output);
      }
    });

    frontend.on("close", (code) => {
      if (code !== 0) {
        log.error("FRONTEND", `Process exited with code ${code}`);
      }
    });

    // Backup timeout resolution
    setTimeout(() => {
      resolve();
    }, 15000);
  });
}

async function startElectron() {
  return new Promise((resolve) => {
    log.info("ELECTRON", "Starting Electron desktop app...");

    // Determine npm command
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

    // Start Electron
    const electron = spawn(npmCmd, ["run", "electron"], {
      cwd: CONFIG.FRONTEND_DIR,
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    });

    processes.electron = electron;

    electron.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        log.info("ELECTRON", output);
      }
    });

    electron.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output && !output.includes("WARNING")) {
        log.warning("ELECTRON", output);
      }
    });

    electron.on("close", (code) => {
      log.info("ELECTRON", `Electron app closed with code ${code}`);
    });

    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

// Main startup sequence
async function startAll() {
  try {
    // Print startup banner
    log.header("🚀 SCORPIUS CYBERSECURITY PLATFORM");
    log.header("=====================================");
    log.header("Starting all services...\n");

    // Print system information
    log.info("SYSTEM", `Platform: ${os.platform()} ${os.arch()}`);
    log.info("SYSTEM", `Node.js: ${process.version}`);
    log.info("SYSTEM", `Working Directory: ${process.cwd()}`);
    log.info("SYSTEM", "");

    // Start scanner
    log.header("📡 Starting Scanner API Server...");
    await startScanner();
    log.success(
      "SCANNER",
      `Scanner API Server running on http://localhost:${CONFIG.SCANNER_PORT}`,
    );

    // Wait a moment between services
    await new Promise((resolve) => setTimeout(resolve, CONFIG.STARTUP_DELAY));

    // Start mempool
    log.header("📡 Starting Mempool API Server...");
    await startMempool();
    log.success(
      "MEMPOOL",
      `Mempool API Server running on http://localhost:${CONFIG.MEMPOOL_PORT}`,
    );

    // Wait a moment between services
    await new Promise((resolve) => setTimeout(resolve, CONFIG.STARTUP_DELAY));

    // Start mev
    log.header("📡 Starting MEV API Server...");
    await startMev();
    log.success(
      "MEV",
      `MEV API Server running on http://localhost:${CONFIG.MEV_PORT}`,
    );

    // Wait a moment between services
    await new Promise((resolve) => setTimeout(resolve, CONFIG.STARTUP_DELAY));

    // Start frontend
    log.header("🌐 Starting Frontend Services...");
    await startFrontend();
    log.success(
      "FRONTEND",
      `Vite dev server running on http://localhost:${CONFIG.FRONTEND_PORT}`,
    );

    // Wait before starting Electron
    log.info(
      "ELECTRON",
      `Waiting ${CONFIG.ELECTRON_DELAY / 1000} seconds before starting desktop app...`,
    );
    await new Promise((resolve) => setTimeout(resolve, CONFIG.ELECTRON_DELAY));

    // Start Electron
    log.header("🖥️ Starting Desktop Application...");
    await startElectron();
    log.success("ELECTRON", "Desktop application launched successfully!");

    // Print final status
    log.header("\n✅ ALL SERVICES RUNNING SUCCESSFULLY!");
    log.header("=====================================");
    log.success("PLATFORM", "🔒 Scanner API: http://localhost:8001");
    log.success("PLATFORM", "🔒 Mempool API: http://localhost:8002");
    log.success("PLATFORM", "🔒 MEV API: http://localhost:8003");
    log.success("PLATFORM", "🌐 Web Interface: http://localhost:8080");
    log.success("PLATFORM", "🖥️ Desktop App: Running in Electron");
    log.header("");
    log.info("SYSTEM", "💡 Press Ctrl+C to stop all services");
    log.info("SYSTEM", "📱 Access your dashboard from any of the URLs above");
    log.header("");
  } catch (error) {
    log.error("STARTUP", `Failed to start services: ${error.message}`);
    log.error("STARTUP", "Cleaning up and exiting...");
    cleanup();
  }
}

// Script entry point
if (require.main === module) {
  startAll();
}

module.exports = {
  startAll,
  cleanup,
  processes,
  CONFIG,
};
