#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

// Security configuration
const SECURITY_CONFIG = {
  OBFUSCATION_LEVEL: "high",
  MINIFICATION: true,
  SOURCE_MAP_REMOVAL: true,
  DEBUG_REMOVAL: true,
  ENCRYPTION_ENABLED: true,
};

const log = {
  info: (msg) => console.log(`🔒 [SECURE] ${msg}`),
  success: (msg) => console.log(`✅ [SECURE] ${msg}`),
  warning: (msg) => console.log(`⚠️ [SECURE] ${msg}`),
  error: (msg) => console.log(`❌ [SECURE] ${msg}`),
};

class SecureBuildPrep {
  constructor() {
    this.buildHash = crypto.randomBytes(32).toString("hex");
    this.encryptionKey =
      process.env.SCORPIUS_ENCRYPTION_KEY ||
      crypto.randomBytes(32).toString("hex");
    this.appSalt =
      process.env.SCORPIUS_APP_SALT || crypto.randomBytes(16).toString("hex");
  }

  async prepareBuild() {
    log.info("Starting secure build preparation...");

    try {
      // Step 1: Clean and prepare directories
      await this.cleanBuildDirectories();

      // Step 2: Obfuscate source code
      await this.obfuscateSourceCode();

      // Step 3: Remove debug information
      await this.removeDebugInfo();

      // Step 4: Encrypt sensitive files
      await this.encryptSensitiveFiles();

      // Step 5: Generate integrity hashes
      await this.generateIntegrityHashes();

      // Step 6: Create secure configuration
      await this.createSecureConfig();

      // Step 7: Minify and optimize
      await this.minifyAndOptimize();

      log.success("Secure build preparation completed successfully");
    } catch (error) {
      log.error(`Build preparation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async cleanBuildDirectories() {
    log.info("Cleaning build directories...");

    const dirsToClean = [
      "dist-electron-secure",
      "electron/secure",
      "build-temp",
    ];

    dirsToClean.forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }
      fs.mkdirSync(dir, { recursive: true });
    });

    log.success("Build directories cleaned");
  }

  async obfuscateSourceCode() {
    log.info("Obfuscating source code...");

    try {
      // Install obfuscation tools if not present
      try {
        require.resolve("javascript-obfuscator");
      } catch {
        log.info("Installing javascript-obfuscator...");
        execSync("npm install --no-save javascript-obfuscator", {
          stdio: "inherit",
        });
      }

      const JavaScriptObfuscator = require("javascript-obfuscator");

      // Obfuscation configuration
      const obfuscationOptions = {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: true,
        domainLock: ["localhost", "127.0.0.1"],
        identifierNamesGenerator: "hexadecimal",
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        shuffleStringArray: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ["base64"],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: "function",
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      };

      // Obfuscate main and preload scripts
      const filesToObfuscate = [
        { src: "electron/main-secure.js", dest: "electron/main-secure.js" },
        {
          src: "electron/preload-secure.js",
          dest: "electron/preload-secure.js",
        },
      ];

      for (const file of filesToObfuscate) {
        if (fs.existsSync(file.src)) {
          const sourceCode = fs.readFileSync(file.src, "utf8");
          const obfuscatedCode = JavaScriptObfuscator.obfuscate(
            sourceCode,
            obfuscationOptions,
          );

          // Add additional security layers
          const secureCode = this.addSecurityLayers(
            obfuscatedCode.getObfuscatedCode(),
          );

          fs.writeFileSync(file.dest, secureCode);
          log.success(`Obfuscated: ${file.src}`);
        }
      }
    } catch (error) {
      log.warning(`Code obfuscation failed: ${error.message}, continuing...`);
    }
  }

  addSecurityLayers(code) {
    // Add anti-debugging and tamper detection
    const securityWrapper = `
(function() {
  'use strict';
  
  // Anti-debugging
  setInterval(function() {
    const start = Date.now();
    debugger;
    if (Date.now() - start > 100) {
      window.close ? window.close() : process.exit(1);
    }
  }, 1000);
  
  // Environment validation
  if (typeof window !== 'undefined' && window.location) {
    const allowed = ['localhost', '127.0.0.1', 'file:'];
    if (!allowed.some(host => window.location.href.includes(host))) {
      throw new Error('Invalid environment');
    }
  }
  
  // Original code
  ${code}
})();
`;

    return securityWrapper;
  }

  async removeDebugInfo() {
    log.info("Removing debug information...");

    // Remove source maps
    const removeSourceMaps = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { recursive: true });
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (file.endsWith(".map") || file.includes("sourcemap")) {
          fs.unlinkSync(fullPath);
          log.info(`Removed source map: ${file}`);
        }
      });
    };

    removeSourceMaps("dist");
    removeSourceMaps("electron");

    // Remove debug statements from built files
    const removeDebugStatements = (filePath) => {
      if (!fs.existsSync(filePath)) return;

      let content = fs.readFileSync(filePath, "utf8");

      // Remove console statements
      content = content.replace(
        /console\.(log|debug|info|warn|error)\([^)]*\);?/g,
        "",
      );

      // Remove debugger statements
      content = content.replace(/debugger;?/g, "");

      // Remove development comments
      content = content.replace(/\/\*[\s\S]*?\*\//g, "");
      content = content.replace(/\/\/.*$/gm, "");

      fs.writeFileSync(filePath, content);
    };

    // Process all JS files in dist
    const processJSFiles = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { recursive: true });
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (file.endsWith(".js") && fs.statSync(fullPath).isFile()) {
          removeDebugStatements(fullPath);
        }
      });
    };

    processJSFiles("dist");

    log.success("Debug information removed");
  }

  async encryptSensitiveFiles() {
    log.info("Encrypting sensitive files...");

    const sensitiveFiles = ["package.json", "electron/preload-secure.js"];

    const encryptFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, "utf8");
      const cipher = crypto.createCipher("aes-256-cbc", this.encryptionKey);

      let encrypted = cipher.update(content, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Store encrypted version
      const encryptedPath = `${filePath}.encrypted`;
      fs.writeFileSync(encryptedPath, encrypted);

      log.success(`Encrypted: ${filePath}`);
    };

    sensitiveFiles.forEach(encryptFile);
  }

  async generateIntegrityHashes() {
    log.info("Generating integrity hashes...");

    const generateFileHash = (filePath) => {
      if (!fs.existsSync(filePath)) return null;

      const content = fs.readFileSync(filePath);
      return crypto.createHash("sha256").update(content).digest("hex");
    };

    const integrityMap = {};

    // Hash critical files
    const criticalFiles = [
      "electron/main-secure.js",
      "electron/preload-secure.js",
      "dist/index.html",
    ];

    criticalFiles.forEach((file) => {
      const hash = generateFileHash(file);
      if (hash) {
        integrityMap[file] = hash;
      }
    });

    // Store integrity information
    fs.writeFileSync(
      "electron/secure/integrity.json",
      JSON.stringify(
        {
          buildHash: this.buildHash,
          timestamp: Date.now(),
          files: integrityMap,
        },
        null,
        2,
      ),
    );

    log.success("Integrity hashes generated");
  }

  async createSecureConfig() {
    log.info("Creating secure configuration...");

    const secureConfig = {
      security: {
        buildHash: this.buildHash,
        appSalt: this.appSalt,
        encryptionEnabled: SECURITY_CONFIG.ENCRYPTION_ENABLED,
        obfuscationLevel: SECURITY_CONFIG.OBFUSCATION_LEVEL,
        timestamp: Date.now(),
      },
      features: {
        debugProtection: true,
        antiTampering: true,
        codeObfuscation: true,
        integrityChecking: true,
      },
    };

    // Store in secure directory
    fs.writeFileSync(
      "electron/secure/config.json",
      JSON.stringify(secureConfig, null, 2),
    );

    // Create environment file for build
    const envContent = `
SCORPIUS_BUILD_HASH=${this.buildHash}
SCORPIUS_APP_SALT=${this.appSalt}
SCORPIUS_ENCRYPTION_KEY=${this.encryptionKey}
SCORPIUS_SECURE_MODE=true
NODE_ENV=production
`;

    fs.writeFileSync(".env.secure", envContent);

    log.success("Secure configuration created");
  }

  async minifyAndOptimize() {
    log.info("Minifying and optimizing files...");

    try {
      // Install terser if not present
      try {
        require.resolve("terser");
      } catch {
        log.info("Installing terser...");
        execSync("npm install --no-save terser", { stdio: "inherit" });
      }

      const { minify } = require("terser");

      // Minify JavaScript files
      const minifyOptions = {
        compress: {
          drop_console: true,
          drop_debugger: true,
          dead_code: true,
          unused: true,
          collapse_vars: true,
          reduce_vars: true,
          inline: true,
        },
        mangle: {
          toplevel: true,
          eval: true,
        },
        output: {
          comments: false,
          beautify: false,
        },
      };

      const minifyFile = async (filePath) => {
        if (!fs.existsSync(filePath) || !filePath.endsWith(".js")) return;

        const code = fs.readFileSync(filePath, "utf8");
        const result = await minify(code, minifyOptions);

        if (result.code) {
          fs.writeFileSync(filePath, result.code);
          log.success(`Minified: ${filePath}`);
        }
      };

      // Process distribution files
      const processDirectory = async (dir) => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir, { recursive: true });
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isFile()) {
            await minifyFile(fullPath);
          }
        }
      };

      await processDirectory("dist");
    } catch (error) {
      log.warning(`Minification failed: ${error.message}, continuing...`);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const securePrep = new SecureBuildPrep();
  securePrep.prepareBuild();
}

module.exports = SecureBuildPrep;
