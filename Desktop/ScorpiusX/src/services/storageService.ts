/**
 * Scorpius Data Storage Service
 *
 * Handles all data persistence for the Scorpius platform.
 * Starts with clean data (no mocks) and persists user data across sessions.
 */

export interface StorageData {
  // User preferences and settings
  user: {
    profile: {
      username: string;
      email: string;
      role: string;
      preferences: {
        theme: "dark" | "cyberpunk";
        notifications: boolean;
        autoScan: boolean;
        soundEffects: boolean;
      };
    };
    lastLogin: string;
    sessionCount: number;
  };

  // Dashboard data
  dashboard: {
    stats: {
      threatsDetected: number;
      activeScans: number;
      activeBots: number;
      lastScanTime: string;
      systemUptime: number;
    };
    alerts: Array<{
      id: string;
      type: "critical" | "warning" | "info";
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
    }>;
    recentActivity: Array<{
      id: string;
      action: string;
      target: string;
      result: string;
      timestamp: string;
    }>;
    favoriteTools: string[];
  };

  // Scanner data
  scanner: {
    scanHistory: Array<{
      id: string;
      fileName: string;
      fileType: string;
      scanType: string;
      status: "completed" | "failed" | "in-progress";
      vulnerabilities: number;
      timestamp: string;
      results: any[];
    }>;
    savedTemplates: Array<{
      id: string;
      name: string;
      description: string;
      config: any;
      createdAt: string;
    }>;
    customRules: Array<{
      id: string;
      name: string;
      pattern: string;
      severity: "low" | "medium" | "high" | "critical";
      enabled: boolean;
    }>;
  };

  // MEV Operations data
  mev: {
    bots: Array<{
      id: string;
      name: string;
      status: "active" | "paused" | "stopped";
      strategy: string;
      profitEarned: number;
      lastActivity: string;
      config: any;
    }>;
    opportunities: Array<{
      id: string;
      type: string;
      profit: number;
      gasUsed: number;
      timestamp: string;
      executed: boolean;
    }>;
    strategies: Array<{
      id: string;
      name: string;
      description: string;
      config: any;
      performance: {
        totalTrades: number;
        successRate: number;
        totalProfit: number;
      };
    }>;
  };

  // Mempool Monitor data
  mempool: {
    transactions: Array<{
      id: string;
      hash: string;
      from: string;
      to: string;
      value: string;
      gasPrice: string;
      gasLimit: string;
      timestamp: string;
      status: "pending" | "confirmed" | "failed";
      threatLevel: "low" | "medium" | "high";
    }>;
    alerts: Array<{
      id: string;
      type: string;
      description: string;
      txHash: string;
      timestamp: string;
      severity: "low" | "medium" | "high" | "critical";
    }>;
    filters: {
      minValue: number;
      maxGasPrice: number;
      addressWatchlist: string[];
      alertTypes: string[];
    };
  };

  // TrapGrid data
  trapgrid: {
    traps: Array<{
      id: string;
      address: string;
      type: "honeypot" | "monitor" | "bait";
      status: "active" | "triggered" | "disabled";
      deployedAt: string;
      interactions: number;
      lastActivity: string;
    }>;
    detectedThreats: Array<{
      id: string;
      trapId: string;
      attackerAddress: string;
      attackType: string;
      timestamp: string;
      severity: "low" | "medium" | "high" | "critical";
      mitigated: boolean;
    }>;
    configurations: Array<{
      id: string;
      name: string;
      trapType: string;
      settings: any;
      isDefault: boolean;
    }>;
  };

  // Training data
  training: {
    courses: Array<{
      id: string;
      title: string;
      progress: number;
      completed: boolean;
      lastAccessed: string;
      timeSpent: number;
    }>;
    achievements: Array<{
      id: string;
      title: string;
      description: string;
      unlockedAt: string;
      category: string;
    }>;
    skillLevels: {
      blockchain: number;
      smartContracts: number;
      defi: number;
      security: number;
      mev: number;
    };
  };

  // Bug Bounty data
  bounty: {
    submissions: Array<{
      id: string;
      title: string;
      description: string;
      severity: "low" | "medium" | "high" | "critical";
      status: "draft" | "submitted" | "under-review" | "accepted" | "rejected";
      reward: number;
      submittedAt: string;
      attachments: string[];
    }>;
    earnings: {
      total: number;
      pending: number;
      paid: number;
      submissions: number;
    };
    favorites: string[];
  };

  // Reports data
  reports: {
    saved: Array<{
      id: string;
      title: string;
      type: string;
      data: any;
      createdAt: string;
      lastModified: string;
    }>;
    scheduled: Array<{
      id: string;
      title: string;
      frequency: "daily" | "weekly" | "monthly";
      recipients: string[];
      enabled: boolean;
      lastSent: string;
    }>;
    templates: Array<{
      id: string;
      name: string;
      description: string;
      config: any;
      isDefault: boolean;
    }>;
  };

  // Scheduler data
  scheduler: {
    jobs: Array<{
      id: string;
      name: string;
      type: string;
      schedule: string;
      enabled: boolean;
      lastRun: string;
      nextRun: string;
      status: "running" | "completed" | "failed" | "scheduled";
      config: any;
    }>;
    history: Array<{
      id: string;
      jobId: string;
      startTime: string;
      endTime: string;
      status: "success" | "failed";
      output: string;
    }>;
  };

  // Monitoring data
  monitoring: {
    services: Array<{
      id: string;
      name: string;
      status: "online" | "offline" | "degraded";
      uptime: number;
      lastCheck: string;
      responseTime: number;
      endpoint: string;
    }>;
    metrics: {
      cpu: number[];
      memory: number[];
      disk: number[];
      network: number[];
      timestamps: string[];
    };
    alerts: Array<{
      id: string;
      service: string;
      type: "outage" | "performance" | "security";
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
  };

  // App metadata
  metadata: {
    version: string;
    dataVersion: string;
    createdAt: string;
    lastBackup: string;
    totalStorageUsed: number;
  };
}

class StorageService {
  private readonly STORAGE_KEY = "scorpius_data";
  private readonly VERSION = "1.0.0";
  private data: StorageData;

  constructor() {
    this.data = this.loadData();
  }

  /**
   * Get initial clean data structure
   */
  private getInitialData(): StorageData {
    const now = new Date().toISOString();

    return {
      user: {
        profile: {
          username: "",
          email: "",
          role: "user",
          preferences: {
            theme: "cyberpunk",
            notifications: true,
            autoScan: false,
            soundEffects: true,
          },
        },
        lastLogin: now,
        sessionCount: 0,
      },
      dashboard: {
        stats: {
          threatsDetected: 0,
          activeScans: 0,
          activeBots: 0,
          lastScanTime: "",
          systemUptime: 0,
        },
        alerts: [],
        recentActivity: [],
        favoriteTools: [],
      },
      scanner: {
        scanHistory: [],
        savedTemplates: [],
        customRules: [],
      },
      mev: {
        bots: [],
        opportunities: [],
        strategies: [],
      },
      mempool: {
        transactions: [],
        alerts: [],
        filters: {
          minValue: 0,
          maxGasPrice: 1000,
          addressWatchlist: [],
          alertTypes: [],
        },
      },
      trapgrid: {
        traps: [],
        detectedThreats: [],
        configurations: [],
      },
      training: {
        courses: [],
        achievements: [],
        skillLevels: {
          blockchain: 0,
          smartContracts: 0,
          defi: 0,
          security: 0,
          mev: 0,
        },
      },
      bounty: {
        submissions: [],
        earnings: {
          total: 0,
          pending: 0,
          paid: 0,
          submissions: 0,
        },
        favorites: [],
      },
      reports: {
        saved: [],
        scheduled: [],
        templates: [],
      },
      scheduler: {
        jobs: [],
        history: [],
      },
      monitoring: {
        services: [],
        metrics: {
          cpu: [],
          memory: [],
          disk: [],
          network: [],
          timestamps: [],
        },
        alerts: [],
      },
      metadata: {
        version: this.VERSION,
        dataVersion: "1.0.0",
        createdAt: now,
        lastBackup: "",
        totalStorageUsed: 0,
      },
    };
  }

  /**
   * Load data from localStorage
   */
  private loadData(): StorageData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and migrate if necessary
        return this.validateAndMigrate(parsed);
      }
    } catch (error) {
      console.warn("Failed to load stored data, starting fresh:", error);
    }

    return this.getInitialData();
  }

  /**
   * Validate stored data and migrate if necessary
   */
  private validateAndMigrate(data: any): StorageData {
    const initial = this.getInitialData();

    // If data version doesn't match, migrate or reset
    if (!data.metadata || data.metadata.version !== this.VERSION) {
      console.log("Data version mismatch, starting fresh");
      return initial;
    }

    // Merge with initial data to ensure all properties exist
    return this.deepMerge(initial, data);
  }

  /**
   * Deep merge objects, preserving structure
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Save data to localStorage
   */
  private saveData(): void {
    try {
      this.data.metadata.totalStorageUsed = this.calculateStorageSize();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error("Failed to save data:", error);
      throw new Error("Storage quota exceeded or storage not available");
    }
  }

  /**
   * Calculate storage size in bytes
   */
  private calculateStorageSize(): number {
    return new Blob([JSON.stringify(this.data)]).size;
  }

  /**
   * Get all data
   */
  public getData(): StorageData {
    return { ...this.data };
  }

  /**
   * Get specific section of data
   */
  public getSection<K extends keyof StorageData>(section: K): StorageData[K] {
    return { ...this.data[section] };
  }

  /**
   * Update specific section of data
   */
  public updateSection<K extends keyof StorageData>(
    section: K,
    updates: Partial<StorageData[K]>,
  ): void {
    this.data[section] = { ...this.data[section], ...updates };
    this.saveData();
  }

  /**
   * Add item to array in a section
   */
  public addItem<K extends keyof StorageData, T>(
    section: K,
    arrayKey: string,
    item: T,
  ): void {
    const sectionData = this.data[section] as any;
    if (Array.isArray(sectionData[arrayKey])) {
      sectionData[arrayKey].push(item);
      this.saveData();
    }
  }

  /**
   * Remove item from array in a section
   */
  public removeItem<K extends keyof StorageData>(
    section: K,
    arrayKey: string,
    itemId: string,
  ): void {
    const sectionData = this.data[section] as any;
    if (Array.isArray(sectionData[arrayKey])) {
      sectionData[arrayKey] = sectionData[arrayKey].filter(
        (item: any) => item.id !== itemId,
      );
      this.saveData();
    }
  }

  /**
   * Update item in array
   */
  public updateItem<K extends keyof StorageData>(
    section: K,
    arrayKey: string,
    itemId: string,
    updates: any,
  ): void {
    const sectionData = this.data[section] as any;
    if (Array.isArray(sectionData[arrayKey])) {
      const index = sectionData[arrayKey].findIndex(
        (item: any) => item.id === itemId,
      );
      if (index !== -1) {
        sectionData[arrayKey][index] = {
          ...sectionData[arrayKey][index],
          ...updates,
        };
        this.saveData();
      }
    }
  }

  /**
   * Clear all data and reset to initial state
   */
  public clearAllData(): void {
    this.data = this.getInitialData();
    this.saveData();
  }

  /**
   * Export all data as JSON
   */
  public exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import data from JSON string
   */
  public importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      this.data = this.validateAndMigrate(imported);
      this.saveData();
      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): {
    totalSize: number;
    totalSizeFormatted: string;
    sectionSizes: Record<string, number>;
    quota: number;
    available: number;
  } {
    const data = JSON.stringify(this.data);
    const totalSize = new Blob([data]).size;

    // Calculate size per section
    const sectionSizes: Record<string, number> = {};
    Object.keys(this.data).forEach((key) => {
      const sectionData = JSON.stringify((this.data as any)[key]);
      sectionSizes[key] = new Blob([sectionData]).size;
    });

    // Estimate localStorage quota (usually 5-10MB)
    const quota = 10 * 1024 * 1024; // 10MB estimate
    const available = quota - totalSize;

    return {
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      sectionSizes,
      quota,
      available,
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Backup data to file download
   */
  public downloadBackup(): void {
    const dataStr = this.exportData();
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `scorpius-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    // Update last backup time
    this.data.metadata.lastBackup = new Date().toISOString();
    this.saveData();
  }

  /**
   * Initialize user session
   */
  public initializeSession(userProfile: {
    username: string;
    email: string;
    role: string;
  }): void {
    this.data.user.profile = { ...this.data.user.profile, ...userProfile };
    this.data.user.lastLogin = new Date().toISOString();
    this.data.user.sessionCount += 1;
    this.saveData();
  }
}

// Create singleton instance
export const storageService = new StorageService();

// Helper functions for components
export const useStorageData = () => storageService.getData();
export const useStorageSection = <K extends keyof StorageData>(section: K) =>
  storageService.getSection(section);
