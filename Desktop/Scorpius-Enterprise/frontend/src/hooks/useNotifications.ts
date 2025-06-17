/**
 * useNotifications Hook
 * Manages notification preferences and service integration
 */

import { useState, useEffect, useCallback } from "react";
import {
  NotificationService,
  NotificationPayload,
  NotificationPreferences,
  NotificationChannel,
  NotificationType,
  createDefaultPreferences,
} from "@/services/notificationService";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";

// Notification history item
export interface NotificationHistoryItem extends NotificationPayload {
  read: boolean;
  archived: boolean;
  deliveryStatus: Record<NotificationChannel, "pending" | "sent" | "failed">;
}

// Notification type information
export const NOTIFICATION_TYPE_INFO: Record<
  NotificationType,
  { title: string; description: string; priority: string }
> = {
  vulnerability_found: {
    title: "Vulnerability Found",
    description: "Security vulnerabilities detected in smart contracts",
    priority: "high",
  },
  scan_completed: {
    title: "Scan Completed",
    description: "Smart contract scan has finished processing",
    priority: "normal",
  },
  mev_opportunity: {
    title: "MEV Opportunity",
    description: "Potential MEV opportunities detected",
    priority: "high",
  },
  threshold_breach: {
    title: "Threshold Breach",
    description: "Monitoring thresholds have been exceeded",
    priority: "high",
  },
  system_alert: {
    title: "System Alert",
    description: "System-level alerts and warnings",
    priority: "normal",
  },
  team_message: {
    title: "Team Message",
    description: "Messages from team members",
    priority: "low",
  },
  user_action: {
    title: "User Action",
    description: "Actions performed by users",
    priority: "low",
  },
  security_warning: {
    title: "Security Warning",
    description: "Security-related warnings and advisories",
    priority: "critical",
  },
};

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    createDefaultPreferences(),
  );
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [service, setService] = useState<NotificationService | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  // Initialize notification service
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem("scorpius_notification_preferences");
        if (saved) {
          const parsed = JSON.parse(saved);
          setPreferences({ ...createDefaultPreferences(), ...parsed });
        }

        const savedHistory = localStorage.getItem(
          "scorpius_notification_history",
        );
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }

        const enabled = localStorage.getItem("scorpius_notifications_enabled");
        setIsEnabled(enabled !== "false");
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Create notification service when preferences change
  useEffect(() => {
    if (!isLoading) {
      const notificationService = new NotificationService(preferences);
      setService(notificationService);
    }
  }, [preferences, isLoading]);

  // Update API keys from settings
  useEffect(() => {
    const updatedPreferences = { ...preferences };

    // Update Slack webhook if available
    if (settings.customApiKeys?.slack) {
      updatedPreferences.channels.slack.webhook = settings.customApiKeys.slack;
    }

    // Update Telegram bot token if available
    if (settings.customApiKeys?.telegram) {
      updatedPreferences.channels.telegram.token =
        settings.customApiKeys.telegram;
    }

    // Update email if available
    if (settings.customApiKeys?.email) {
      updatedPreferences.channels.email.email = settings.customApiKeys.email;
    }

    setPreferences(updatedPreferences);
  }, [settings]);

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (newPreferences: NotificationPreferences) => {
      try {
        localStorage.setItem(
          "scorpius_notification_preferences",
          JSON.stringify(newPreferences),
        );
        setPreferences(newPreferences);
      } catch (error) {
        console.error("Failed to save notification preferences:", error);
        toast.error("Failed to save notification preferences");
      }
    },
    [],
  );

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: NotificationHistoryItem[]) => {
    try {
      // Keep only last 100 notifications
      const trimmedHistory = newHistory.slice(0, 100);
      localStorage.setItem(
        "scorpius_notification_history",
        JSON.stringify(trimmedHistory),
      );
      setHistory(trimmedHistory);
    } catch (error) {
      console.error("Failed to save notification history:", error);
    }
  }, []);

  // Toggle notifications enabled/disabled
  const toggleEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem("scorpius_notifications_enabled", enabled.toString());
    toast.success(`Notifications ${enabled ? "enabled" : "disabled"}`);
  }, []);

  // Send notification
  const sendNotification = useCallback(
    async (payload: Omit<NotificationPayload, "id" | "timestamp">) => {
      if (!service || !isEnabled) return false;

      const fullPayload: NotificationPayload = {
        ...payload,
        id: `notif_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
      };

      try {
        const success = await service.send(fullPayload);

        // Add to history
        const historyItem: NotificationHistoryItem = {
          ...fullPayload,
          read: false,
          archived: false,
          deliveryStatus: payload.channels.reduce(
            (acc, channel) => ({
              ...acc,
              [channel]: success ? "sent" : "failed",
            }),
            {} as Record<NotificationChannel, "pending" | "sent" | "failed">,
          ),
        };

        saveHistory([historyItem, ...history]);
        return success;
      } catch (error) {
        console.error("Failed to send notification:", error);
        return false;
      }
    },
    [service, isEnabled, history, saveHistory],
  );

  // Update channel configuration
  const updateChannelConfig = useCallback(
    (channel: NotificationChannel, config: any) => {
      const newPreferences = {
        ...preferences,
        channels: {
          ...preferences.channels,
          [channel]: config,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Update notification type channels
  const updateTypeChannels = useCallback(
    (type: NotificationType, channels: NotificationChannel[]) => {
      const newPreferences = {
        ...preferences,
        types: {
          ...preferences.types,
          [type]: channels,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Update quiet hours
  const updateQuietHours = useCallback(
    (quietHours: NotificationPreferences["quietHours"]) => {
      const newPreferences = {
        ...preferences,
        quietHours,
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Update filters
  const updateFilters = useCallback(
    (filters: NotificationPreferences["filters"]) => {
      const newPreferences = {
        ...preferences,
        filters,
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Test channel
  const testChannel = useCallback(
    async (channel: NotificationChannel) => {
      if (!service) return false;
      return await service.test(channel);
    },
    [service],
  );

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      const newHistory = history.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      );
      saveHistory(newHistory);
    },
    [history, saveHistory],
  );

  // Archive notification
  const archiveNotification = useCallback(
    (notificationId: string) => {
      const newHistory = history.map((item) =>
        item.id === notificationId ? { ...item, archived: true } : item,
      );
      saveHistory(newHistory);
    },
    [history, saveHistory],
  );

  // Delete notification
  const deleteNotification = useCallback(
    (notificationId: string) => {
      const newHistory = history.filter((item) => item.id !== notificationId);
      saveHistory(newHistory);
    },
    [history, saveHistory],
  );

  // Clear all notifications
  const clearHistory = useCallback(() => {
    saveHistory([]);
    toast.success("Notification history cleared");
  }, [saveHistory]);

  // Export preferences
  const exportPreferences = useCallback(() => {
    return JSON.stringify(preferences, null, 2);
  }, [preferences]);

  // Import preferences
  const importPreferences = useCallback(
    (data: string) => {
      try {
        const imported = JSON.parse(data);
        if (imported && typeof imported === "object") {
          const newPreferences = { ...createDefaultPreferences(), ...imported };
          savePreferences(newPreferences);
          toast.success("Notification preferences imported successfully");
          return true;
        }
        throw new Error("Invalid preferences data");
      } catch (error) {
        toast.error("Failed to import preferences: Invalid format");
        return false;
      }
    },
    [savePreferences],
  );

  // Get unread count
  const unreadCount = history.filter(
    (item) => !item.read && !item.archived,
  ).length;

  // Get available channels
  const availableChannels: NotificationChannel[] = [
    "in_app",
    "email",
    "slack",
    "telegram",
    "discord",
    "webhook",
    "sms",
  ];

  // Helper functions for quick notifications
  const notifyVulnerability = useCallback(
    (data: {
      severity: string;
      contractAddress: string;
      description: string;
      scanId: string;
    }) => {
      return sendNotification({
        type: "vulnerability_found",
        title: "Vulnerability Detected",
        message: `${data.severity} vulnerability found in ${data.contractAddress}`,
        priority: data.severity === "Critical" ? "critical" : "high",
        channels: preferences.types.vulnerability_found || ["in_app", "email"],
        data,
        metadata: {
          scanId: data.scanId,
          contractAddress: data.contractAddress,
        },
      });
    },
    [sendNotification, preferences],
  );

  const notifyScanComplete = useCallback(
    (data: { scanId: string; duration: string; issuesCount: number }) => {
      return sendNotification({
        type: "scan_completed",
        title: "Scan Completed",
        message: `Scan ${data.scanId} completed with ${data.issuesCount} issues found`,
        priority: "normal",
        channels: preferences.types.scan_completed || ["in_app"],
        data,
        metadata: {
          scanId: data.scanId,
        },
      });
    },
    [sendNotification, preferences],
  );

  const notifyMEVOpportunity = useCallback(
    (data: {
      mevType: string;
      estimatedProfit: string;
      transactionHash: string;
    }) => {
      return sendNotification({
        type: "mev_opportunity",
        title: "MEV Opportunity",
        message: `${data.mevType} opportunity: ${data.estimatedProfit} ETH potential profit`,
        priority: "high",
        channels: preferences.types.mev_opportunity || ["in_app", "telegram"],
        data,
        metadata: {
          transactionHash: data.transactionHash,
        },
      });
    },
    [sendNotification, preferences],
  );

  const notifySystemAlert = useCallback(
    (data: { alertType: string; description: string }) => {
      return sendNotification({
        type: "system_alert",
        title: "System Alert",
        message: `${data.alertType}: ${data.description}`,
        priority: "normal",
        channels: preferences.types.system_alert || ["in_app", "email"],
        data,
      });
    },
    [sendNotification, preferences],
  );

  return {
    // State
    preferences,
    history: history.filter((item) => !item.archived),
    isEnabled,
    isLoading,
    unreadCount,
    availableChannels,
    notificationTypes: NOTIFICATION_TYPE_INFO,

    // Actions
    sendNotification,
    updateChannelConfig,
    updateTypeChannels,
    updateQuietHours,
    updateFilters,
    testChannel,
    markAsRead,
    archiveNotification,
    deleteNotification,
    clearHistory,
    exportPreferences,
    importPreferences,
    toggleEnabled,

    // Quick notification helpers
    notifyVulnerability,
    notifyScanComplete,
    notifyMEVOpportunity,
    notifySystemAlert,
  };
}
