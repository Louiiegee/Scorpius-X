#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ANSI colors for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}🚀 ${msg}${colors.reset}`),
};

// Test configuration
const tests = [
  {
    name: "Package.json Scripts",
    check: () => {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const requiredScripts = ["electron", "electron-dev", "start-all"];
      return requiredScripts.every((script) => pkg.scripts[script]);
    },
  },
  {
    name: "Electron Files",
    check: () => {
      const requiredFiles = [
        "electron/main.js",
        "electron/preload.js",
        "electron-builder.json",
      ];
      return requiredFiles.every((file) => fs.existsSync(file));
    },
  },
  {
    name: "Backend Directory",
    check: () => {
      return fs.existsSync("backend") && fs.existsSync("backend/main.py");
    },
  },
  {
    name: "Frontend Files",
    check: () => {
      const requiredFiles = [
        "src/App.tsx",
        "src/components/ElectronEnhancedWidget.tsx",
        "vite.config.ts",
      ];
      return requiredFiles.every((file) => fs.existsSync(file));
    },
  },
  {
    name: "Startup Script",
    check: () => {
      return fs.existsSync("start-all.js");
    },
  },
  {
    name: "Dependencies",
    check: () => {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const required = [
        "electron",
        "electron-builder",
        "concurrently",
        "wait-on",
      ];
      return required.every(
        (dep) => pkg.dependencies[dep] || pkg.devDependencies[dep],
      );
    },
  },
];

async function runTests() {
  log.header("Scorpius Electron Setup Verification");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      if (test.check()) {
        log.success(`${test.name}`);
        passed++;
      } else {
        log.error(`${test.name}`);
        failed++;
      }
    } catch (error) {
      log.error(`${test.name} - ${error.message}`);
      failed++;
    }
  }

  console.log("\n==========================================");

  if (failed === 0) {
    log.success(`All ${passed} tests passed! 🎉`);
    log.info("Your Electron setup is complete and ready to use.");
    console.log("\n📚 Next steps:");
    console.log("1. Run: npm run start-all");
    console.log("2. Check the Electron Enhanced Widget in the top-right");
    console.log("3. Test desktop notifications");
    console.log("4. Build installers with: npm run electron-dist");
    console.log("\n📖 See ELECTRON_README.md for detailed instructions");
  } else {
    log.error(`${failed} test(s) failed out of ${passed + failed}`);
    log.warning("Please check the failing components and retry.");
  }
}

// Check for Node.js and npm
function checkPrerequisites() {
  log.header("Checking Prerequisites...");

  try {
    const nodeVersion = process.version;
    log.success(`Node.js ${nodeVersion}`);

    // Check if npm exists
    const npm = spawn("npm", ["--version"], { stdio: "pipe" });
    npm.on("close", (code) => {
      if (code === 0) {
        log.success("npm is available");
        runTests();
      } else {
        log.error("npm is not available");
      }
    });

    npm.on("error", () => {
      log.error("npm is not available");
    });
  } catch (error) {
    log.error(`Prerequisites check failed: ${error.message}`);
  }
}

if (require.main === module) {
  checkPrerequisites();
}

module.exports = { runTests };
