#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Secure Environment Manager
 * Protects sensitive configuration data in production builds
 */
class SecureEnvManager {
  constructor() {
    this.masterKey = this.generateMasterKey();
    this.encryptedVars = new Map();
  }

  generateMasterKey() {
    // Use multiple sources for key generation
    const sources = [
      process.env.SCORPIUS_MASTER_KEY,
      crypto.randomBytes(32).toString("hex"),
      Date.now().toString(),
      process.platform,
      process.arch,
    ];

    const combined = sources.filter(Boolean).join("");
    return crypto.createHash("sha256").update(combined).digest();
  }

  encrypt(value) {
    if (!value) return "";

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM("aes-256-gcm", this.masterKey, iv);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== "object") return "";

    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipherGCM(
        "aes-256-gcm",
        this.masterKey,
        Buffer.from(iv, "hex"),
      );
      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error.message);
      return "";
    }
  }

  createSecureEnvFile() {
    const originalEnv = this.loadOriginalEnv();
    const secureEnv = this.processEnvironmentVariables(originalEnv);

    // Create secure environment configuration
    const secureConfig = {
      metadata: {
        created: Date.now(),
        version: "1.0.0",
        secure: true,
      },
      variables: secureEnv,
    };

    // Write encrypted configuration
    fs.writeFileSync(".env.secure.json", JSON.stringify(secureConfig, null, 2));

    // Create runtime loader
    this.createRuntimeLoader();

    console.log("✅ Secure environment configuration created");
  }

  loadOriginalEnv() {
    const envVars = {};

    // Load from .env file if exists
    if (fs.existsSync(".env")) {
      const envContent = fs.readFileSync(".env", "utf8");
      const lines = envContent.split("\n");

      lines.forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
        }
      });
    }

    // Add runtime environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("SCORPIUS_") || this.isSensitiveKey(key)) {
        envVars[key] = process.env[key];
      }
    });

    return envVars;
  }

  isSensitiveKey(key) {
    const sensitivePatterns = [
      /API_KEY/i,
      /SECRET/i,
      /PASSWORD/i,
      /TOKEN/i,
      /PRIVATE/i,
      /ENCRYPTION/i,
      /DATABASE_URL/i,
      /REDIS_URL/i,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(key));
  }

  processEnvironmentVariables(envVars) {
    const secureVars = {};

    Object.entries(envVars).forEach(([key, value]) => {
      if (this.isSensitiveKey(key)) {
        // Encrypt sensitive variables
        secureVars[key] = {
          encrypted: true,
          data: this.encrypt(value),
        };
      } else {
        // Keep non-sensitive variables as-is (but obfuscated)
        secureVars[key] = {
          encrypted: false,
          data: this.obfuscateValue(value),
        };
      }
    });

    return secureVars;
  }

  obfuscateValue(value) {
    if (!value || value.length < 4) return value;

    // Simple obfuscation for non-sensitive data
    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = "*".repeat(Math.max(0, value.length - 4));

    return start + middle + end;
  }

  createRuntimeLoader() {
    const loaderCode = `
// Secure Environment Loader
// This module provides secure access to environment variables in production

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecureEnvLoader {
  constructor() {
    this.masterKey = this.generateMasterKey();
    this.config = null;
    this.loaded = false;
  }

  generateMasterKey() {
    const sources = [
      process.env.SCORPIUS_MASTER_KEY,
      '${crypto.randomBytes(16).toString("hex")}', // Static component
      Date.now().toString(),
      process.platform,
      process.arch
    ];

    const combined = sources.filter(Boolean).join('');
    return crypto.createHash('sha256').update(combined).digest();
  }

  load() {
    if (this.loaded) return;

    try {
      const configPath = path.join(__dirname, '.env.secure.json');
      if (!fs.existsSync(configPath)) {
        console.warn('Secure environment config not found, using defaults');
        this.loaded = true;
        return;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configContent);
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load secure environment:', error.message);
      this.loaded = true;
    }
  }

  get(key, defaultValue = '') {
    this.load();

    if (!this.config || !this.config.variables || !this.config.variables[key]) {
      return process.env[key] || defaultValue;
    }

    const variable = this.config.variables[key];

    if (variable.encrypted) {
      return this.decrypt(variable.data) || defaultValue;
    } else {
      // For obfuscated values, return original from process.env if available
      return process.env[key] || defaultValue;
    }
  }

  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'object') return '';

    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.masterKey, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      return '';
    }
  }

  getAll() {
    this.load();
    
    if (!this.config || !this.config.variables) {
      return {};
    }

    const result = {};
    Object.keys(this.config.variables).forEach(key => {
      result[key] = this.get(key);
    });

    return result;
  }
}

// Export singleton instance
const secureEnv = new SecureEnvLoader();
module.exports = secureEnv;
`;

    fs.writeFileSync("secure-env-loader.js", loaderCode);
    console.log("✅ Runtime environment loader created");
  }

  validateSecureSetup() {
    const requiredFiles = [".env.secure.json", "secure-env-loader.js"];

    const missing = requiredFiles.filter((file) => !fs.existsSync(file));

    if (missing.length > 0) {
      console.error("❌ Missing secure environment files:", missing);
      return false;
    }

    console.log("✅ Secure environment setup validated");
    return true;
  }

  clean() {
    // Remove temporary files
    const tempFiles = [".env.secure", ".env.backup"];

    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log("✅ Temporary files cleaned");
  }
}

// CLI interface
if (require.main === module) {
  const manager = new SecureEnvManager();
  const command = process.argv[2];

  switch (command) {
    case "create":
      manager.createSecureEnvFile();
      break;
    case "validate":
      manager.validateSecureSetup();
      break;
    case "clean":
      manager.clean();
      break;
    default:
      console.log("Usage: node secure-env-manager.js [create|validate|clean]");
      console.log("  create   - Create secure environment configuration");
      console.log("  validate - Validate secure setup");
      console.log("  clean    - Clean temporary files");
  }
}

module.exports = SecureEnvManager;
