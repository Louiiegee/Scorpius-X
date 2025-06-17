/**
 * Notification Service
 * Multi-channel notification system supporting Slack, Telegram, Email, etc.
 */

import { toast } from "sonner";

// Notification types
export type NotificationType =
  | "vulnerability_found"
  | "scan_completed"
  | "mev_opportunity"
  | "threshold_breach"
  | "system_alert"
  | "team_message"
  | "user_action"
  | "security_warning";

// Notification channels
export type NotificationChannel =
  | "in_app"
  | "email"
  | "slack"
  | "telegram"
  | "discord"
  | "webhook"
  | "sms"
  | "push";

// Notification priority levels
export type NotificationPriority = "low" | "normal" | "high" | "critical";

// Notification payload
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  userId?: string;
  teamId?: string;
  timestamp: number;
  expiresAt?: number;
  metadata?: {
    scanId?: string;
    contractAddress?: string;
    transactionHash?: string;
    alertId?: string;
    source?: string;
  };
}

// Channel configuration
export interface ChannelConfig {
  enabled: boolean;
  webhook?: string;
  token?: string;
  chatId?: string;
  email?: string;
  template?: string;
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

// Notification preferences
export interface NotificationPreferences {
  channels: Record<NotificationChannel, ChannelConfig>;
  types: Record<NotificationType, NotificationChannel[]>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  filters: {
    minPriority: NotificationPriority;
    keywords: string[];
    excludeKeywords: string[];
  };
}

// Default notification templates
const DEFAULT_TEMPLATES = {
  vulnerability_found: {
    title: "🚨 Vulnerability Detected",
    email: `
      <h2>Security Vulnerability Found</h2>
      <p>A vulnerability has been detected in your smart contract scan.</p>
      <p><strong>Severity:</strong> {{severity}}</p>
      <p><strong>Contract:</strong> {{contractAddress}}</p>
      <p><strong>Description:</strong> {{description}}</p>
      <a href="{{dashboardUrl}}">View Details</a>
    `,
    slack: `🚨 *Vulnerability Detected*\n\n*Severity:* {{severity}}\n*Contract:* {{contractAddress}}\n*Description:* {{description}}\n\n<{{dashboardUrl}}|View Details>`,
    telegram: `🚨 *Vulnerability Detected*\n\n*Severity:* {{severity}}\n*Contract:* \`{{contractAddress}}\`\n*Description:* {{description}}\n\n[View Details]({{dashboardUrl}})`,
  },
  scan_completed: {
    title: "✅ Scan Completed",
    email: `
      <h2>Scan Completed Successfully</h2>
      <p>Your smart contract scan has been completed.</p>
      <p><strong>Scan ID:</strong> {{scanId}}</p>
      <p><strong>Duration:</strong> {{duration}}</p>
      <p><strong>Issues Found:</strong> {{issuesCount}}</p>
      <a href="{{dashboardUrl}}">View Results</a>
    `,
    slack: `✅ *Scan Completed*\n\n*Scan ID:* {{scanId}}\n*Duration:* {{duration}}\n*Issues Found:* {{issuesCount}}\n\n<{{dashboardUrl}}|View Results>`,
    telegram: `✅ *Scan Completed*\n\n*Scan ID:* \`{{scanId}}\`\n*Duration:* {{duration}}\n*Issues Found:* {{issuesCount}}\n\n[View Results]({{dashboardUrl}})`,
  },
  mev_opportunity: {
    title: "💰 MEV Opportunity",
    email: `
      <h2>MEV Opportunity Detected</h2>
      <p>A potential MEV opportunity has been identified.</p>
      <p><strong>Type:</strong> {{mevType}}</p>
      <p><strong>Estimated Profit:</strong> {{estimatedProfit}} ETH</p>
      <p><strong>Transaction:</strong> {{transactionHash}}</p>
      <a href="{{dashboardUrl}}">View Details</a>
    `,
    slack: `💰 *MEV Opportunity*\n\n*Type:* {{mevType}}\n*Estimated Profit:* {{estimatedProfit}} ETH\n*Transaction:* {{transactionHash}}\n\n<{{dashboardUrl}}|View Details>`,
    telegram: `💰 *MEV Opportunity*\n\n*Type:* {{mevType}}\n*Estimated Profit:* {{estimatedProfit}} ETH\n*Transaction:* \`{{transactionHash}}\`\n\n[View Details]({{dashboardUrl}})`,
  },
  system_alert: {
    title: "⚠️ System Alert",
    email: `
      <h2>System Alert</h2>
      <p>A system alert has been triggered.</p>
      <p><strong>Alert Type:</strong> {{alertType}}</p>
      <p><strong>Description:</strong> {{description}}</p>
      <p><strong>Time:</strong> {{timestamp}}</p>
    `,
    slack: `⚠️ *System Alert*\n\n*Type:* {{alertType}}\n*Description:* {{description}}\n*Time:* {{timestamp}}`,
    telegram: `⚠️ *System Alert*\n\n*Type:* {{alertType}}\n*Description:* {{description}}\n*Time:* {{timestamp}}`,
  },
};

// Template engine for replacing variables
function processTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

// Rate limiting utility
class RateLimiter {
  private counts: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.counts.get(key);

    if (!record || now > record.resetTime) {
      this.counts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count < limit) {
      record.count++;
      return true;
    }

    return false;
  }

  reset(key: string): void {
    this.counts.delete(key);
  }
}

// Main notification service class
export class NotificationService {
  private preferences: NotificationPreferences;
  private rateLimiter = new RateLimiter();
  private queue: NotificationPayload[] = [];
  private isProcessing = false;

  constructor(preferences: NotificationPreferences) {
    this.preferences = preferences;
  }

  // Send notification to all configured channels
  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      // Check if notification should be sent during quiet hours
      if (this.isQuietHour()) {
        if (payload.priority !== "critical") {
          console.log("Skipping notification during quiet hours:", payload.id);
          return false;
        }
      }

      // Check priority filter
      if (!this.meetsPriorityFilter(payload.priority)) {
        console.log("Notification filtered by priority:", payload.id);
        return false;
      }

      // Check keyword filters
      if (!this.meetsKeywordFilter(payload.message)) {
        console.log("Notification filtered by keywords:", payload.id);
        return false;
      }

      // Add to processing queue
      this.queue.push(payload);

      if (!this.isProcessing) {
        this.processQueue();
      }

      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  // Process notification queue
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const payload = this.queue.shift()!;
      await this.processNotification(payload);
    }

    this.isProcessing = false;
  }

  // Process individual notification
  private async processNotification(
    payload: NotificationPayload,
  ): Promise<void> {
    const enabledChannels = payload.channels.filter(
      (channel) => this.preferences.channels[channel]?.enabled,
    );

    const promises = enabledChannels.map((channel) =>
      this.sendToChannel(channel, payload),
    );

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error("Error processing notification:", error);
    }
  }

  // Send to specific channel
  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
  ): Promise<boolean> {
    const config = this.preferences.channels[channel];
    if (!config?.enabled) return false;

    // Check rate limits
    const rateLimitKey = `${channel}_${payload.userId || "global"}`;
    if (config.rateLimit) {
      const hourlyAllowed = this.rateLimiter.isAllowed(
        `${rateLimitKey}_hour`,
        config.rateLimit.maxPerHour,
        60 * 60 * 1000,
      );

      const dailyAllowed = this.rateLimiter.isAllowed(
        `${rateLimitKey}_day`,
        config.rateLimit.maxPerDay,
        24 * 60 * 60 * 1000,
      );

      if (!hourlyAllowed || !dailyAllowed) {
        console.log(`Rate limit exceeded for ${channel}:`, payload.id);
        return false;
      }
    }

    try {
      switch (channel) {
        case "in_app":
          return await this.sendInAppNotification(payload);

        case "email":
          return await this.sendEmailNotification(config, payload);

        case "slack":
          return await this.sendSlackNotification(config, payload);

        case "telegram":
          return await this.sendTelegramNotification(config, payload);

        case "discord":
          return await this.sendDiscordNotification(config, payload);

        case "webhook":
          return await this.sendWebhookNotification(config, payload);

        case "sms":
          return await this.sendSMSNotification(config, payload);

        case "push":
          return await this.sendPushNotification(config, payload);

        default:
          console.warn(`Unknown notification channel: ${channel}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error);
      return false;
    }
  }

  // In-app notification
  private async sendInAppNotification(
    payload: NotificationPayload,
  ): Promise<boolean> {
    // Use toast for in-app notifications
    const toastConfig = {
      duration: payload.priority === "critical" ? 10000 : 5000,
    };

    switch (payload.priority) {
      case "critical":
        toast.error(payload.message, toastConfig);
        break;
      case "high":
        toast.warning(payload.message, toastConfig);
        break;
      case "normal":
        toast.success(payload.message, toastConfig);
        break;
      case "low":
        toast.info(payload.message, toastConfig);
        break;
    }

    // Also trigger browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(payload.title, {
        body: payload.message,
        icon: "/favicon.ico",
        tag: payload.id,
      });
    }

    return true;
  }

  // Email notification
  private async sendEmailNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!config.email) return false;

    const template = DEFAULT_TEMPLATES[payload.type]?.email || payload.message;
    const processedContent = processTemplate(template, {
      ...payload.data,
      title: payload.title,
      message: payload.message,
      timestamp: new Date(payload.timestamp).toLocaleString(),
      dashboardUrl: `${window.location.origin}/dashboard`,
    });

    // In real implementation, this would call your email service
    console.log("📧 Email notification:", {
      to: config.email,
      subject: payload.title,
      html: processedContent,
    });

    return true;
  }

  // Slack notification
  private async sendSlackNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!config.webhook) return false;

    const template = DEFAULT_TEMPLATES[payload.type]?.slack || payload.message;
    const processedMessage = processTemplate(template, {
      ...payload.data,
      title: payload.title,
      message: payload.message,
      timestamp: new Date(payload.timestamp).toLocaleString(),
      dashboardUrl: `${window.location.origin}/dashboard`,
    });

    const slackPayload = {
      text: payload.title,
      attachments: [
        {
          color: this.getPriorityColor(payload.priority),
          text: processedMessage,
          ts: Math.floor(payload.timestamp / 1000),
        },
      ],
    };

    try {
      const response = await fetch(config.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      });

      return response.ok;
    } catch (error) {
      console.error("Slack notification failed:", error);
      return false;
    }
  }

  // Telegram notification
  private async sendTelegramNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!config.token || !config.chatId) return false;

    const template =
      DEFAULT_TEMPLATES[payload.type]?.telegram || payload.message;
    const processedMessage = processTemplate(template, {
      ...payload.data,
      title: payload.title,
      message: payload.message,
      timestamp: new Date(payload.timestamp).toLocaleString(),
      dashboardUrl: `${window.location.origin}/dashboard`,
    });

    const telegramPayload = {
      chat_id: config.chatId,
      text: processedMessage,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    };

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${config.token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telegramPayload),
        },
      );

      return response.ok;
    } catch (error) {
      console.error("Telegram notification failed:", error);
      return false;
    }
  }

  // Discord notification
  private async sendDiscordNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!config.webhook) return false;

    const discordPayload = {
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color: parseInt(
            this.getPriorityColor(payload.priority).replace("#", ""),
            16,
          ),
          timestamp: new Date(payload.timestamp).toISOString(),
          fields: payload.data
            ? Object.entries(payload.data).map(([key, value]) => ({
                name: key,
                value: String(value),
                inline: true,
              }))
            : [],
        },
      ],
    };

    try {
      const response = await fetch(config.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      return response.ok;
    } catch (error) {
      console.error("Discord notification failed:", error);
      return false;
    }
  }

  // Generic webhook notification
  private async sendWebhookNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!config.webhook) return false;

    try {
      const response = await fetch(config.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error("Webhook notification failed:", error);
      return false;
    }
  }

  // SMS notification (placeholder)
  private async sendSMSNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    // In real implementation, integrate with SMS service like Twilio
    console.log("📱 SMS notification:", {
      to: config.chatId, // Phone number
      message: `${payload.title}\n${payload.message}`,
    });

    return true;
  }

  // Push notification (placeholder)
  private async sendPushNotification(
    config: ChannelConfig,
    payload: NotificationPayload,
  ): Promise<boolean> {
    // In real implementation, integrate with push notification service
    console.log("📲 Push notification:", payload);
    return true;
  }

  // Helper methods
  private isQuietHour(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

    return (
      currentTime >= this.preferences.quietHours.start &&
      currentTime <= this.preferences.quietHours.end
    );
  }

  private meetsPriorityFilter(priority: NotificationPriority): boolean {
    const priorities = ["low", "normal", "high", "critical"];
    const currentIndex = priorities.indexOf(priority);
    const minIndex = priorities.indexOf(this.preferences.filters.minPriority);

    return currentIndex >= minIndex;
  }

  private meetsKeywordFilter(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Check exclude keywords
    if (
      this.preferences.filters.excludeKeywords.some((keyword) =>
        lowerMessage.includes(keyword.toLowerCase()),
      )
    ) {
      return false;
    }

    // Check include keywords (if any specified)
    if (this.preferences.filters.keywords.length > 0) {
      return this.preferences.filters.keywords.some((keyword) =>
        lowerMessage.includes(keyword.toLowerCase()),
      );
    }

    return true;
  }

  private getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
      case "critical":
        return "#dc2626"; // red-600
      case "high":
        return "#ea580c"; // orange-600
      case "normal":
        return "#2563eb"; // blue-600
      case "low":
        return "#16a34a"; // green-600
    }
  }

  // Configuration methods
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Test notification
  async test(channel: NotificationChannel): Promise<boolean> {
    const testPayload: NotificationPayload = {
      id: `test_${Date.now()}`,
      type: "system_alert",
      title: "Test Notification",
      message: "This is a test notification from Scorpius.",
      priority: "normal",
      channels: [channel],
      timestamp: Date.now(),
    };

    return await this.send(testPayload);
  }
}

// Create default notification preferences
export function createDefaultPreferences(): NotificationPreferences {
  return {
    channels: {
      in_app: { enabled: true },
      email: { enabled: false, email: "" },
      slack: { enabled: false, webhook: "" },
      telegram: { enabled: false, token: "", chatId: "" },
      discord: { enabled: false, webhook: "" },
      webhook: { enabled: false, webhook: "" },
      sms: { enabled: false, chatId: "" },
      push: { enabled: false },
    },
    types: {
      vulnerability_found: ["in_app", "email", "slack"],
      scan_completed: ["in_app"],
      mev_opportunity: ["in_app", "telegram"],
      threshold_breach: ["in_app", "email"],
      system_alert: ["in_app", "email"],
      team_message: ["in_app"],
      user_action: ["in_app"],
      security_warning: ["in_app", "email", "slack"],
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    filters: {
      minPriority: "low",
      keywords: [],
      excludeKeywords: [],
    },
  };
}
