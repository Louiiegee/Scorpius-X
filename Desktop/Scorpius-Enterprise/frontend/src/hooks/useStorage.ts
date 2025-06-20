import { useState, useEffect, useCallback } from "react";
import { storageService, StorageData } from "@/services/storageService";

/**
 * React hook for managing Scorpius data storage
 * Provides reactive access to stored data with automatic updates
 */

export function useStorage() {
  const [data, setData] = useState<StorageData>(storageService.getData());
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(() => {
    setData(storageService.getData());
  }, []);

  const updateSection = useCallback(
    <K extends keyof StorageData>(
      section: K,
      updates: Partial<StorageData[K]>,
    ) => {
      setIsLoading(true);
      try {
        storageService.updateSection(section, updates);
        refreshData();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData],
  );

  const addItem = useCallback(
    <K extends keyof StorageData, T>(section: K, arrayKey: string, item: T) => {
      setIsLoading(true);
      try {
        storageService.addItem(section, arrayKey, item);
        refreshData();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData],
  );

  const removeItem = useCallback(
    <K extends keyof StorageData>(
      section: K,
      arrayKey: string,
      itemId: string,
    ) => {
      setIsLoading(true);
      try {
        storageService.removeItem(section, arrayKey, itemId);
        refreshData();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData],
  );

  const updateItem = useCallback(
    <K extends keyof StorageData>(
      section: K,
      arrayKey: string,
      itemId: string,
      updates: any,
    ) => {
      setIsLoading(true);
      try {
        storageService.updateItem(section, arrayKey, itemId, updates);
        refreshData();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData],
  );

  const clearAllData = useCallback(() => {
    setIsLoading(true);
    try {
      storageService.clearAllData();
      refreshData();
    } finally {
      setIsLoading(false);
    }
  }, [refreshData]);

  const exportData = useCallback(() => {
    return storageService.exportData();
  }, []);

  const importData = useCallback(
    (jsonData: string) => {
      setIsLoading(true);
      try {
        const success = storageService.importData(jsonData);
        if (success) {
          refreshData();
        }
        return success;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData],
  );

  const downloadBackup = useCallback(() => {
    storageService.downloadBackup();
    refreshData();
  }, [refreshData]);

  const getStorageStats = useCallback(() => {
    return storageService.getStorageStats();
  }, []);

  return {
    data,
    isLoading,
    refreshData,
    updateSection,
    addItem,
    removeItem,
    updateItem,
    clearAllData,
    exportData,
    importData,
    downloadBackup,
    getStorageStats,
  };
}

/**
 * Hook for accessing a specific section of storage
 */
export function useStorageSection<K extends keyof StorageData>(section: K) {
  const { data, updateSection, addItem, removeItem, updateItem, isLoading } =
    useStorage();

  const sectionData = data[section];

  const update = useCallback(
    (updates: Partial<StorageData[K]>) => {
      updateSection(section, updates);
    },
    [section, updateSection],
  );

  const add = useCallback(
    <T>(arrayKey: string, item: T) => {
      addItem(section, arrayKey, item);
    },
    [section, addItem],
  );

  const remove = useCallback(
    (arrayKey: string, itemId: string) => {
      removeItem(section, arrayKey, itemId);
    },
    [section, removeItem],
  );

  const updateItemInSection = useCallback(
    (arrayKey: string, itemId: string, updates: any) => {
      updateItem(section, arrayKey, itemId, updates);
    },
    [section, updateItem],
  );

  return {
    data: sectionData,
    isLoading,
    update,
    add,
    remove,
    updateItem: updateItemInSection,
  };
}

/**
 * Hook for managing dashboard data specifically
 */
export function useDashboardData() {
  const { data, update, add, remove, updateItem, isLoading } =
    useStorageSection("dashboard");

  const addAlert = useCallback(
    (alert: {
      type: "critical" | "warning" | "info";
      title: string;
      message: string;
    }) => {
      const newAlert = {
        id: Date.now().toString(),
        ...alert,
        timestamp: new Date().toISOString(),
        read: false,
      };
      add("alerts", newAlert);
    },
    [add],
  );

  const markAlertRead = useCallback(
    (alertId: string) => {
      updateItem("alerts", alertId, { read: true });
    },
    [updateItem],
  );

  const addActivity = useCallback(
    (activity: { action: string; target: string; result: string }) => {
      const newActivity = {
        id: Date.now().toString(),
        ...activity,
        timestamp: new Date().toISOString(),
      };
      add("recentActivity", newActivity);
    },
    [add],
  );

  const updateStats = useCallback(
    (stats: Partial<typeof data.stats>) => {
      update({ stats: { ...data.stats, ...stats } });
    },
    [update, data.stats],
  );

  return {
    data,
    isLoading,
    addAlert,
    markAlertRead,
    addActivity,
    updateStats,
    removeAlert: (id: string) => remove("alerts", id),
    removeActivity: (id: string) => remove("recentActivity", id),
  };
}

/**
 * Hook for managing scanner data
 */
export function useScannerData() {
  const { data, add, remove, updateItem, isLoading } =
    useStorageSection("scanner");

  const addScan = useCallback(
    (scan: {
      fileName: string;
      fileType: string;
      scanType: string;
      status: "completed" | "failed" | "in-progress";
      vulnerabilities: number;
      results: any[];
    }) => {
      const newScan = {
        id: Date.now().toString(),
        ...scan,
        timestamp: new Date().toISOString(),
      };
      add("scanHistory", newScan);
    },
    [add],
  );

  const updateScanStatus = useCallback(
    (
      scanId: string,
      status: "completed" | "failed" | "in-progress",
      results?: any[],
    ) => {
      const updates: any = { status };
      if (results) {
        updates.results = results;
        updates.vulnerabilities = results.length;
      }
      updateItem("scanHistory", scanId, updates);
    },
    [updateItem],
  );

  const saveTemplate = useCallback(
    (template: { name: string; description: string; config: any }) => {
      const newTemplate = {
        id: Date.now().toString(),
        ...template,
        createdAt: new Date().toISOString(),
      };
      add("savedTemplates", newTemplate);
    },
    [add],
  );

  return {
    data,
    isLoading,
    addScan,
    updateScanStatus,
    saveTemplate,
    removeScan: (id: string) => remove("scanHistory", id),
    removeTemplate: (id: string) => remove("savedTemplates", id),
  };
}

/**
 * Hook for managing user preferences
 */
export function useUserData() {
  const { data, update, isLoading } = useStorageSection("user");

  const updateProfile = useCallback(
    (profile: Partial<typeof data.profile>) => {
      update({ profile: { ...data.profile, ...profile } });
    },
    [update, data.profile],
  );

  const updatePreferences = useCallback(
    (preferences: Partial<typeof data.profile.preferences>) => {
      update({
        profile: {
          ...data.profile,
          preferences: { ...data.profile.preferences, ...preferences },
        },
      });
    },
    [update, data.profile],
  );

  const recordLogin = useCallback(() => {
    update({
      lastLogin: new Date().toISOString(),
      sessionCount: data.sessionCount + 1,
    });
  }, [update, data.sessionCount]);

  return {
    data,
    isLoading,
    updateProfile,
    updatePreferences,
    recordLogin,
  };
}
