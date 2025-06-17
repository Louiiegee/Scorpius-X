const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Check if dist folder exists for web build
const distPath = path.join(__dirname, "../dist");
if (!fs.existsSync(distPath)) {
  console.log("Building web app first...");
  const buildProcess = spawn("npm", ["run", "build"], {
    stdio: "inherit",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  buildProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("Web build failed");
      process.exit(1);
    }
    startElectron();
  });
} else {
  startElectron();
}

function startElectron() {
  console.log("Starting Electron in development mode...");

  // Start Vite dev server first
  const viteProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  // Wait a bit for Vite to start, then start Electron
  setTimeout(() => {
    const electronProcess = spawn("npm", ["run", "electron-dev"], {
      stdio: "inherit",
      shell: true,
      cwd: path.join(__dirname, "../electron"),
      env: { ...process.env, ELECTRON_IS_DEV: "true" },
    });

    // Handle process cleanup
    process.on("SIGINT", () => {
      console.log("\nShutting down...");
      viteProcess.kill();
      electronProcess.kill();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      viteProcess.kill();
      electronProcess.kill();
      process.exit(0);
    });
  }, 3000);
}
