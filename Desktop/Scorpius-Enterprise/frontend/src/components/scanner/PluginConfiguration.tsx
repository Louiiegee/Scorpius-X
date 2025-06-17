import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  CheckCircle,
  Code,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import apiMiddleware from "@/lib/apiMiddleware";

interface PluginConfig {
  [key: string]: any;
}

interface PluginConfigSchema {
  type: "string" | "number" | "boolean" | "array" | "object" | "select";
  label: string;
  description?: string;
  default: any;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  validation?: {
    pattern?: string;
    message?: string;
  };
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  enabled: boolean;
  config: PluginConfig;
  configSchema: Record<string, PluginConfigSchema>;
  documentation?: string;
  examples?: PluginExample[];
  performance: {
    avgExecutionTime: number;
    successRate: number;
    lastBenchmark: string;
  };
}

interface PluginExample {
  name: string;
  description: string;
  input: string;
  expectedOutput: string;
}

interface PluginConfigurationProps {
  plugin: Plugin;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pluginId: string, config: PluginConfig) => void;
}

export function PluginConfiguration({
  plugin,
  isOpen,
  onClose,
  onSave,
}: PluginConfigurationProps) {
  const [config, setConfig] = useState<PluginConfig>(plugin.config || {});
  const [originalConfig, setOriginalConfig] = useState<PluginConfig>(
    plugin.config || {},
  );
  const [isModified, setIsModified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTestingPlugin, setIsTestingPlugin] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    setConfig(plugin.config || {});
    setOriginalConfig(plugin.config || {});
    setIsModified(false);
    setValidationErrors({});
  }, [plugin]);

  useEffect(() => {
    const modified = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setIsModified(modified);
  }, [config, originalConfig]);

  const validateConfig = (): boolean => {
    const errors: Record<string, string> = {};

    Object.entries(plugin.configSchema || {}).forEach(([key, schema]) => {
      const value = config[key];

      if (schema.required && (value === undefined || value === "")) {
        errors[key] = `${schema.label} is required`;
        return;
      }

      if (value !== undefined && value !== "") {
        switch (schema.type) {
          case "number":
            if (isNaN(Number(value))) {
              errors[key] = `${schema.label} must be a number`;
            } else {
              const num = Number(value);
              if (schema.min !== undefined && num < schema.min) {
                errors[key] = `${schema.label} must be at least ${schema.min}`;
              }
              if (schema.max !== undefined && num > schema.max) {
                errors[key] = `${schema.label} must be at most ${schema.max}`;
              }
            }
            break;

          case "string":
            if (schema.validation?.pattern) {
              const regex = new RegExp(schema.validation.pattern);
              if (!regex.test(value)) {
                errors[key] =
                  schema.validation.message ||
                  `${schema.label} format is invalid`;
              }
            }
            break;

          case "array":
            if (!Array.isArray(value)) {
              errors[key] = `${schema.label} must be an array`;
            }
            break;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    try {
      const response = await apiMiddleware.put(
        `/api/scanner/plugins/${plugin.id}/config`,
        { config },
        { feature: "basic_scanning" },
      );

      if (response.success) {
        onSave(plugin.id, config);
        setOriginalConfig(config);
        setIsModified(false);
        onClose();
      }
    } catch (error) {
      console.error("Failed to save plugin configuration:", error);
    }
  };

  const handleReset = () => {
    setConfig(originalConfig);
    setValidationErrors({});
  };

  const testPlugin = async () => {
    setIsTestingPlugin(true);
    try {
      const response = await apiMiddleware.post(
        `/api/scanner/plugins/${plugin.id}/test`,
        { config },
        { feature: "basic_scanning" },
      );

      if (response.success) {
        setTestResults(response.data);
      }
    } catch (error) {
      console.error("Failed to test plugin:", error);
      setTestResults({ error: "Test failed" });
    } finally {
      setIsTestingPlugin(false);
    }
  };

  const renderConfigField = (key: string, schema: PluginConfigSchema) => {
    const value = config[key] ?? schema.default;
    const error = validationErrors[key];

    switch (schema.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-black">{schema.label}</Label>
              {schema.description && (
                <p className="text-sm text-gray-600">{schema.description}</p>
              )}
            </div>
            <Switch
              checked={value}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Label className="text-black">{schema.label}</Label>
            {schema.description && (
              <p className="text-sm text-gray-600">{schema.description}</p>
            )}
            <Select
              value={value}
              onValueChange={(newValue) => handleConfigChange(key, newValue)}
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder={`Select ${schema.label}`} />
              </SelectTrigger>
              <SelectContent>
                {schema.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "number":
        if (schema.min !== undefined && schema.max !== undefined) {
          // Render as slider for numeric ranges
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-black">{schema.label}</Label>
                <span className="text-sm text-gray-600">{value}</span>
              </div>
              {schema.description && (
                <p className="text-sm text-gray-600">{schema.description}</p>
              )}
              <Slider
                value={[Number(value)]}
                onValueChange={([newValue]) =>
                  handleConfigChange(key, newValue)
                }
                min={schema.min}
                max={schema.max}
                step={1}
                className="w-full"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          );
        }
      // Fall through to regular input for numbers without ranges

      case "string":
      default:
        return (
          <div className="space-y-2">
            <Label className="text-black">{schema.label}</Label>
            {schema.description && (
              <p className="text-sm text-gray-600">{schema.description}</p>
            )}
            {schema.type === "string" &&
            schema.description?.includes("multiline") ? (
              <Textarea
                value={value}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={`Enter ${schema.label.toLowerCase()}`}
                className={error ? "border-red-500" : ""}
                rows={4}
              />
            ) : (
              <Input
                type={schema.type === "number" ? "number" : "text"}
                value={value}
                onChange={(e) =>
                  handleConfigChange(
                    key,
                    schema.type === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
                placeholder={`Enter ${schema.label.toLowerCase()}`}
                className={error ? "border-red-500" : ""}
                min={schema.min}
                max={schema.max}
              />
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {plugin.name}
          </DialogTitle>
          <DialogDescription>
            Customize plugin settings and behavior for optimal security analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plugin Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Plugin Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Version</Label>
                  <p className="font-mono">{plugin.version}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Author</Label>
                  <p>{plugin.author}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <Badge variant="outline">{plugin.category}</Badge>
                </div>
                <div>
                  <Label className="text-gray-600">Avg Execution Time</Label>
                  <p>{plugin.performance.avgExecutionTime}s</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">{plugin.description}</p>
              </div>
              {plugin.documentation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(plugin.documentation, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Configuration</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {showAdvanced ? "Hide" : "Show"} Advanced
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(plugin.configSchema || {}).map(
                ([key, schema]) => {
                  const isAdvanced =
                    key.includes("advanced") || key.includes("_");
                  if (isAdvanced && !showAdvanced) return null;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {renderConfigField(key, schema)}
                    </motion.div>
                  );
                },
              )}

              {Object.keys(plugin.configSchema || {}).length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This plugin doesn't have configurable options.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Plugin Examples */}
          {plugin.examples && plugin.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plugin.examples.map((example, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-black">{example.name}</h4>
                    <p className="text-sm text-gray-600">
                      {example.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Input</Label>
                        <pre className="text-xs bg-gray-100 p-2 rounded border overflow-x-auto">
                          {example.input}
                        </pre>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">
                          Expected Output
                        </Label>
                        <pre className="text-xs bg-gray-100 p-2 rounded border overflow-x-auto">
                          {example.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Test Plugin */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testPlugin}
                disabled={
                  isTestingPlugin || Object.keys(validationErrors).length > 0
                }
                className="w-full"
              >
                {isTestingPlugin ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Testing Plugin...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Test Plugin with Current Config
                  </>
                )}
              </Button>

              {testResults && (
                <div className="space-y-2">
                  <Label className="text-sm">Test Results</Label>
                  {testResults.error ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{testResults.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Plugin test completed successfully!
                        <br />
                        Execution time: {testResults.executionTime}ms
                        <br />
                        Memory usage: {testResults.memoryUsage}MB
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {isModified && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved changes
                </Badge>
              )}
              {Object.keys(validationErrors).length > 0 && (
                <Badge variant="outline" className="text-red-600">
                  {Object.keys(validationErrors).length} validation error(s)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isModified}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !isModified || Object.keys(validationErrors).length > 0
                }
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
