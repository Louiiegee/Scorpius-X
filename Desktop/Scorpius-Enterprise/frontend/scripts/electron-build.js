const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

async function buildElectronApp() {
  try {
    console.log("🚀 Building Scorpius Electron App...\n");

    // Step 1: Build the web app
    console.log("📦 Building web application...");
    await runCommand("npm", ["run", "build"], path.join(__dirname, ".."));
    console.log("✅ Web build completed!\n");

    // Step 2: Copy web build to electron directory
    console.log("📁 Copying web build to electron directory...");
    const webDistPath = path.join(__dirname, "../dist");
    const electronDistPath = path.join(__dirname, "../electron/dist");

    await fs.remove(electronDistPath);
    await fs.copy(webDistPath, electronDistPath);
    console.log("✅ Files copied!\n");

    // Step 3: Install electron dependencies
    console.log("📦 Installing Electron dependencies...");
    await runCommand("npm", ["install"], path.join(__dirname, "../electron"));
    console.log("✅ Electron dependencies installed!\n");

    // Step 4: Build Electron app
    console.log("⚡ Building Electron application...");
    await runCommand(
      "npm",
      ["run", "dist"],
      path.join(__dirname, "../electron"),
    );
    console.log("✅ Electron build completed!\n");

    console.log("🎉 Scorpius Electron app built successfully!");
    console.log("📂 Check the electron/dist folder for the built application.");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      cwd,
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

// Run the build process
buildElectronApp();
