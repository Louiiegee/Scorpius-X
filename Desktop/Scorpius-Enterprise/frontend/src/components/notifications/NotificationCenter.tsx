/**
 * Notification Center Component
 * Manages notification preferences and displays notification history
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Settings,
  Mail,
  MessageSquare,
  Webhook,
  Smartphone,
  Volume2,
  VolumeX,
  Clock,
  Filter,
  TestTube,
  Check,
  X,
  AlertTriangle,
  Info,
  Trash2,
  Archive,
  MarkAsUnread,
  ExternalLink,
  Copy,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

// Channel configuration components
function ChannelConfig({ channel, config, onUpdate, onTest }: any) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "slack":
        return <MessageSquare className="h-4 w-4" />;
      case "telegram":
        return <MessageSquare className="h-4 w-4" />;
      case "discord":
        return <MessageSquare className="h-4 w-4" />;
      case "webhook":
        return <Webhook className="h-4 w-4" />;
      case "sms":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelFields = (channel: string) => {
    switch (channel) {
      case "email":
        return (
          <Input
            placeholder="your.email@example.com"
            value={config.email || ""}
            onChange={(e) => onUpdate({ ...config, email: e.target.value })}
          />
        );

      case "slack":
        return (
          <Input
            placeholder="https://hooks.slack.com/services/..."
            value={config.webhook || ""}
            onChange={(e) => onUpdate({ ...config, webhook: e.target.value })}
          />
        );

      case "telegram":
        return (
          <div className="space-y-2">
            <Input
              placeholder="Bot Token"
              value={config.token || ""}
              onChange={(e) => onUpdate({ ...config, token: e.target.value })}
            />
            <Input
              placeholder="Chat ID"
              value={config.chatId || ""}
              onChange={(e) => onUpdate({ ...config, chatId: e.target.value })}
            />
          </div>
        );

      case "discord":
        return (
          <Input
            placeholder="Discord Webhook URL"
            value={config.webhook || ""}
            onChange={(e) => onUpdate({ ...config, webhook: e.target.value })}
          />
        );

      case "webhook":
        return (
          <Input
            placeholder="https://your-webhook-url.com/endpoint"
            value={config.webhook || ""}
            onChange={(e) => onUpdate({ ...config, webhook: e.target.value })}
          />
        );

      case "sms":
        return (
          <Input
            placeholder="+1234567890"
            value={config.chatId || ""}
            onChange={(e) => onUpdate({ ...config, chatId: e.target.value })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getChannelIcon(channel)}
            <CardTitle className="text-base capitalize">{channel}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onUpdate({ ...config, enabled })}
            />
            {config.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTest(channel)}
              >
                <TestTube className="h-3 w-3 mr-1" />
                Test
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {config.enabled && (
        <CardContent className="space-y-4">
          {getChannelFields(channel)}

          {/* Rate Limiting */}
          <div className="space-y-2">
            <Label className="text-sm">Rate Limits</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Per Hour
                </Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={config.rateLimit?.maxPerHour || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...config,
                      rateLimit: {
                        ...config.rateLimit,
                        maxPerHour: parseInt(e.target.value) || 100,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Per Day</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={config.rateLimit?.maxPerDay || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...config,
                      rateLimit: {
                        ...config.rateLimit,
                        maxPerDay: parseInt(e.target.value) || 1000,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Notification type configuration
function NotificationTypes() {
  const {
    preferences,
    updateTypeChannels,
    availableChannels,
    notificationTypes,
  } = useNotifications();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Types</h3>
        <p className="text-sm text-muted-foreground">
          Configure which channels to use for each type of notification
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(notificationTypes).map(([type, info]) => (
          <Card key={type}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{info.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {info.description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {info.priority}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableChannels.map((channel) => (
                  <Button
                    key={channel}
                    variant={
                      preferences.types[type]?.includes(channel)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      const currentChannels = preferences.types[type] || [];
                      const newChannels = currentChannels.includes(channel)
                        ? currentChannels.filter((c) => c !== channel)
                        : [...currentChannels, channel];
                      updateTypeChannels(type, newChannels);
                    }}
                    className="text-xs"
                  >
                    {channel}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Quiet hours configuration
function QuietHours() {
  const { preferences, updateQuietHours } = useNotifications();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <CardTitle className="text-base">Quiet Hours</CardTitle>
          </div>
          <Switch
            checked={preferences.quietHours.enabled}
            onCheckedChange={(enabled) =>
              updateQuietHours({ ...preferences.quietHours, enabled })
            }
          />
        </div>
      </CardHeader>

      {preferences.quietHours.enabled && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Start Time</Label>
              <Input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) =>
                  updateQuietHours({
                    ...preferences.quietHours,
                    start: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="text-sm">End Time</Label>
              <Input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) =>
                  updateQuietHours({
                    ...preferences.quietHours,
                    end: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Timezone</Label>
            <Select
              value={preferences.quietHours.timezone}
              onValueChange={(timezone) =>
                updateQuietHours({ ...preferences.quietHours, timezone })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">
                  Eastern Time (US)
                </SelectItem>
                <SelectItem value="America/Chicago">
                  Central Time (US)
                </SelectItem>
                <SelectItem value="America/Denver">
                  Mountain Time (US)
                </SelectItem>
                <SelectItem value="America/Los_Angeles">
                  Pacific Time (US)
                </SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
            ℹ️ Critical notifications will still be delivered during quiet hours
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Notification filters
function NotificationFilters() {
  const { preferences, updateFilters } = useNotifications();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <CardTitle className="text-base">Filters</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Minimum Priority</Label>
          <Select
            value={preferences.filters.minPriority}
            onValueChange={(priority) =>
              updateFilters({
                ...preferences.filters,
                minPriority: priority as any,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Include Keywords</Label>
          <Input
            placeholder="vulnerability, critical, error (comma separated)"
            value={preferences.filters.keywords.join(", ")}
            onChange={(e) =>
              updateFilters({
                ...preferences.filters,
                keywords: e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <div>
          <Label className="text-sm">Exclude Keywords</Label>
          <Input
            placeholder="debug, info, test (comma separated)"
            value={preferences.filters.excludeKeywords.join(", ")}
            onChange={(e) =>
              updateFilters({
                ...preferences.filters,
                excludeKeywords: e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Notification history
function NotificationHistory() {
  const { history, markAsRead, deleteNotification, archiveNotification } =
    useNotifications();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "normal":
        return <Info className="h-4 w-4 text-blue-600" />;
      case "low":
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notification History</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archive All
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-2">
          {history.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 border rounded-lg ${
                notification.read ? "bg-gray-50" : "bg-white border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getPriorityIcon(notification.priority)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">
                        {notification.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {notification.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatTime(notification.timestamp)}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {notification.priority}
                      </span>
                      {notification.channels && (
                        <>
                          <span>•</span>
                          <span>{notification.channels.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.read && (
                      <DropdownMenuItem
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => archiveNotification(notification.id)}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigator.clipboard.writeText(notification.message)
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}

          {history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Main Notification Center component
export function NotificationCenter() {
  const {
    preferences,
    updateChannelConfig,
    testChannel,
    isEnabled,
    toggleEnabled,
    exportPreferences,
    importPreferences,
  } = useNotifications();

  const [importData, setImportData] = useState("");

  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorpius-notifications-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Notification preferences exported");
  };

  const handleImport = () => {
    if (importData.trim()) {
      const success = importPreferences(importData);
      if (success) {
        setImportData("");
        toast.success("Notification preferences imported");
      }
    }
  };

  const handleTestChannel = async (channel: string) => {
    const success = await testChannel(channel);
    if (success) {
      toast.success(`Test notification sent to ${channel}`);
    } else {
      toast.error(`Failed to send test notification to ${channel}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notification Center</h1>
            <p className="text-muted-foreground">
              Configure alerts and notification channels
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={isEnabled} onCheckedChange={toggleEnabled} />
          <span className="text-sm">{isEnabled ? "Enabled" : "Disabled"}</span>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Notification Channels
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure where you want to receive notifications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(preferences.channels)
              .filter(([channel]) => channel !== "in_app")
              .map(([channel, config]) => (
                <ChannelConfig
                  key={channel}
                  channel={channel}
                  config={config}
                  onUpdate={(newConfig: any) =>
                    updateChannelConfig(channel, newConfig)
                  }
                  onTest={handleTestChannel}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <NotificationTypes />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <QuietHours />
              <NotificationFilters />
            </div>

            <div className="space-y-4">
              {/* Export/Import */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Backup & Restore</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Settings
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Import Settings</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Paste exported settings JSON..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                      />
                      <Button
                        onClick={handleImport}
                        disabled={!importData.trim()}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Active Channels:
                      </span>
                      <span className="ml-2 font-medium">
                        {
                          Object.values(preferences.channels).filter(
                            (c) => c.enabled,
                          ).length
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Configured Types:
                      </span>
                      <span className="ml-2 font-medium">
                        {Object.keys(preferences.types).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
