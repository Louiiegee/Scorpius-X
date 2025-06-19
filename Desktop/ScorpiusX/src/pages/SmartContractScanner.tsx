import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Shield,
  Search,
  FileCode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Play,
  Pause,
  Clock,
  Zap,
  Target,
  Loader2,
  RefreshCw,
  Hash,
  Cpu,
  Activity,
  BarChart3,
  TrendingUp,
  Upload,
  FolderOpen,
  File,
  Trash2,
  Archive,
  Code,
  X,
  Plus,
  FileText,
  Package,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { useToastActions } from "@/components/ui/enhanced-toast";
import { ScrollReveal, StaggeredReveal } from "@/components/ui/scroll-reveal";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  lastModified: number;
  path?: string;
  isContract?: boolean;
}

interface ProjectStructure {
  id: string;
  name: string;
  files: UploadedFile[];
  contracts: UploadedFile[];
  totalSize: number;
  uploadTime: Date;
}

const SmartContractScanner = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [contractAddress, setContractAddress] = useState("");
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 15247,
    vulnerabilitiesFound: 892,
    contractsAnalyzed: 3456,
    averageScore: 87.3,
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projects, setProjects] = useState<ProjectStructure[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [scanMode, setScanMode] = useState<"address" | "files">("address");

  // Enhanced toast notifications
  const toast = useToastActions();

  // Tab system state
  const [activeTab, setActiveTab] = useState<"scanner" | "simulations">("scanner");

  // Simulation state
  const [simulations, setSimulations] = useState<any[]>([]);
  const [activeSimulations, setActiveSimulations] = useState<any[]>([]);
  const [simulationEnvironments, setSimulationEnvironments] = useState<any[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null);
  const [isCreatingSimulation, setIsCreatingSimulation] = useState(false);
  const [simulationStats, setSimulationStats] = useState({
    totalSimulations: 234,
    activeEnvironments: 12,
    completedTests: 1847,
    aiAnalysisRuns: 456,
  });

  // Security analysis tools state with enhanced UX
  const [securityTools, setSecurityTools] = useState({
    slither: true,
    mythril: true,
    echidna: false,
  });

  // Motion values for advanced animations
  const progressValue = useMotionValue(0);
  const springProgress = useSpring(progressValue, {
    stiffness: 100,
    damping: 30,
  });

  // Mock scan results with enhanced data
  const mockResults = [
    {
      id: 1,
      severity: "Critical",
      title: "Reentrancy Vulnerability",
      description:
        "Potential reentrancy attack vector detected in withdraw function",
      line: 42,
      function: "withdraw()",
      impact: "High",
      confidence: "95%",
      gasImpact: "High",
      exploitability: "Easy",
      references: ["SWC-107", "CVE-2016-1000298"],
      fileName: "Contract.sol",
    },
    {
      id: 2,
      severity: "Warning",
      title: "Unchecked Return Value",
      description: "External call return value not verified",
      line: 78,
      function: "transfer()",
      impact: "Medium",
      confidence: "87%",
      gasImpact: "Low",
      exploitability: "Medium",
      references: ["SWC-104"],
      fileName: "Token.sol",
    },
    {
      id: 3,
      severity: "Info",
      title: "Gas Optimization",
      description: "Loop can be optimized to reduce gas consumption",
      line: 156,
      function: "updateBalances()",
      impact: "Low",
      confidence: "72%",
      gasImpact: "Medium",
      exploitability: "None",
      references: ["Gas-001"],
      fileName: "Storage.sol",
    },
  ];

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      processFiles(files);
    },
    [],
  );

  const isValidContractFile = (fileName: string): boolean => {
    const contractExtensions = [
      ".sol",
      ".vy",
      ".cairo",
      ".move",
      ".js",
      ".ts",
      ".rs",
    ];
    return contractExtensions.some((ext) =>
      fileName.toLowerCase().endsWith(ext),
    );
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}-${Math.random()}`;

      // Handle zip files as projects
      if (file.name.toLowerCase().endsWith(".zip")) {
        await processZipFile(file, fileId);
        continue;
      }

      // Process individual files
      try {
        const content = await readFileContent(file);
        const uploadedFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          content,
          lastModified: file.lastModified,
          isContract: isValidContractFile(file.name),
        };

        setUploadedFiles((prev) => [...prev, uploadedFile]);

        // Simulate upload progress
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
        simulateUploadProgress(fileId);

        toast.success(`File "${file.name}" uploaded successfully!`);
      } catch (error) {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }
  };

  const processZipFile = async (file: File, projectId: string) => {
    try {
      // In a real implementation, you would use a library like JSZip
      // For now, we'll simulate project extraction
      const mockProjectFiles: UploadedFile[] = [
        {
          id: `${projectId}-contract1`,
          name: "Token.sol",
          size: 2500,
          type: "text/plain",
          content:
            "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Token {\n    // Token implementation\n}",
          lastModified: Date.now(),
          path: "contracts/Token.sol",
          isContract: true,
        },
        {
          id: `${projectId}-contract2`,
          name: "Storage.sol",
          size: 1800,
          type: "text/plain",
          content:
            "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Storage {\n    // Storage implementation\n}",
          lastModified: Date.now(),
          path: "contracts/Storage.sol",
          isContract: true,
        },
        {
          id: `${projectId}-config`,
          name: "package.json",
          size: 450,
          type: "application/json",
          content:
            '{\n  "name": "smart-contract-project",\n  "version": "1.0.0"\n}',
          lastModified: Date.now(),
          path: "package.json",
          isContract: false,
        },
      ];

      const project: ProjectStructure = {
        id: projectId,
        name: file.name.replace(".zip", ""),
        files: mockProjectFiles,
        contracts: mockProjectFiles.filter((f) => f.isContract),
        totalSize: mockProjectFiles.reduce((sum, f) => sum + f.size, 0),
        uploadTime: new Date(),
      };

      setProjects((prev) => [...prev, project]);
      setUploadedFiles((prev) => [...prev, ...mockProjectFiles]);

      toast.success(
        `Project "${project.name}" extracted successfully! Found ${project.contracts.length} contracts.`,
      );
    } catch (error) {
      toast.error(`Failed to extract project from "${file.name}"`);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const simulateUploadProgress = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      } else {
        setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
    toast.info("File removed");
  };

  const removeProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const projectFileIds = project.files.map((f) => f.id);
      setUploadedFiles((prev) =>
        prev.filter((f) => !projectFileIds.includes(f.id)),
      );
      setSelectedFiles((prev) =>
        prev.filter((id) => !projectFileIds.includes(id)),
      );
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.info(`Project "${project.name}" removed`);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const selectAllContracts = () => {
    const contractIds = uploadedFiles
      .filter((f) => f.isContract)
      .map((f) => f.id);
    setSelectedFiles(contractIds);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  // Enhanced scanning simulation with file support
  const startScan = async () => {
    if (scanMode === "address" && !contractAddress.trim()) {
      toast.error("Please enter a contract address");
      return;
    }

    if (scanMode === "files" && selectedFiles.length === 0) {
      toast.error("Please select files to scan");
      return;
    }

    const enabledTools = Object.entries(securityTools)
      .filter(([_, enabled]) => enabled)
      .map(([tool, _]) => tool);

    if (enabledTools.length === 0) {
      toast.error("Please enable at least one security analysis tool");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);
    setIsLoading(true);

    // Enhanced progress simulation with file-specific stages
    const scanStages =
      scanMode === "files"
        ? [
            { name: "Parsing uploaded files", progress: 15 },
            { name: "Running syntax analysis", progress: 30 },
            { name: "Executing Slither scan", progress: 50 },
            { name: "Running Mythril analysis", progress: 70 },
            { name: "AI vulnerability detection", progress: 85 },
            { name: "Generating comprehensive report", progress: 100 },
          ]
        : [
            { name: "Fetching bytecode", progress: 15 },
            { name: "Decompiling contract", progress: 30 },
            { name: "Running Slither analysis", progress: 50 },
            { name: "Executing Mythril scan", progress: 70 },
            { name: "Running Scorpius AI analysis", progress: 85 },
            { name: "Generating report", progress: 100 },
          ];

    for (const stage of scanStages) {
      if (
        !enabledTools.includes(stage.name.toLowerCase().split(" ")[1]) &&
        stage.progress > 30
      ) {
        continue;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 400),
      );
      setScanProgress(stage.progress);
      progressValue.set(stage.progress);

      toast.info(`${stage.name}...`, { duration: 1000 });
    }

    // Complete scan
    setIsScanning(false);
    setIsLoading(false);

    // Generate results based on scan mode
    const results =
      scanMode === "files"
        ? mockResults.filter((_, index) => index < selectedFiles.length)
        : mockResults;

    setScanResults(results);

    const scanTarget =
      scanMode === "files"
        ? `${selectedFiles.length} file(s)`
        : contractAddress;

    toast.success(
      `Scan completed! Found ${results.length} issues in ${scanTarget}`,
    );

    // Add to history
    setScanHistory((prev) =>
      [
        ...prev,
        {
          id: Date.now(),
          target: scanTarget,
          mode: scanMode,
          timestamp: new Date().toISOString(),
          results: results.length,
          critical: results.filter((r) => r.severity === "Critical").length,
          warnings: results.filter((r) => r.severity === "Warning").length,
          tools: enabledTools,
          score: Math.floor(Math.random() * 40) + 60,
        },
      ].slice(0, 10),
    );

    // Update stats
    setStats((prev) => ({
      ...prev,
      totalScans: prev.totalScans + 1,
      contractsAnalyzed:
        prev.contractsAnalyzed +
        (scanMode === "files" ? selectedFiles.length : 1),
      vulnerabilitiesFound: prev.vulnerabilitiesFound + results.length,
    }));
  };

  const stopScan = () => {
    setIsScanning(false);
    setIsLoading(false);
    setScanProgress(0);
    progressValue.set(0);
    toast.warning("Scan stopped");
  };

  const exportResults = () => {
    const exportData = {
      scanMode,
      target: scanMode === "files" ? selectedFiles : contractAddress,
      timestamp: new Date().toISOString(),
      tools: Object.entries(securityTools)
        .filter(([_, enabled]) => enabled)
        .map(([tool, _]) => tool),
      results: scanResults,
      summary: {
        total: scanResults.length,
        critical: scanResults.filter((r) => r.severity === "Critical").length,
        warnings: scanResults.filter((r) => r.severity === "Warning").length,
        info: scanResults.filter((r) => r.severity === "Info").length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorpius-scan-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Scan results exported successfully!");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "#ff0040";
      case "Warning":
        return "#ffaa00";
      case "Info":
        return "#00ffff";
      default:
        return "#999999";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "#ff4444";
      case "Medium":
        return "#ffaa00";
      case "Low":
        return "#00ff88";
      default:
        return "#999999";
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".sol")) return FileCode;
    if (fileName.endsWith(".vy")) return Code;
    if (fileName.endsWith(".json")) return FileText;
    if (fileName.endsWith(".zip")) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .scanner-container {
            font-family: 'JetBrains Mono', 'Space Mono', monospace;
          }

          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }

          .pulse-dot {
            animation: pulse-glow 2s ease-in-out infinite alternate;
          }

          @keyframes pulse-glow {
            from {
              box-shadow: 0 0 5px currentColor;
              opacity: 0.8;
            }
            to {
              box-shadow: 0 0 20px currentColor;
              opacity: 1;
            }
          }

          .scanning-beam {
            animation: scan-beam 2s ease-in-out infinite;
          }

          @keyframes scan-beam {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }

          .data-grid::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .data-grid::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
          }
          .data-grid::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #00ff88, #00ffff);
            border-radius: 4px;
          }

          .drag-over {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 255, 0.1)) !important;
            border-color: #00ff88 !important;
          }

          .file-list::-webkit-scrollbar {
            width: 6px;
          }
          .file-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }
          .file-list::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #00ff88, #00ffff);
            border-radius: 3px;
          }
        `}
      </style>

      <motion.div
        className="scanner-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        style={{
          minHeight: "100vh",
          backgroundColor: "#000000",
          color: "#e5e5e5",
          padding: "24px",
          position: "relative",
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 255, 136, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 255, 255, 0.03) 0%, transparent 50%)
          `,
        }}
      >
        {/* Scanning Overlay Effect */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                background:
                  "linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.1), transparent)",
                pointerEvents: "none",
                zIndex: 10,
              }}
              className="scanning-beam"
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <ScrollReveal>
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-green-600"
                  style={{
                    boxShadow: "0 0 30px rgba(0, 255, 136, 0.5)",
                  }}
                >
                  <Search size={24} />
                </motion.div>
                <div>
                  <h1
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: "#00ff88",
                      margin: "0",
                      letterSpacing: "2px",
                      textShadow: "0 0 20px rgba(0, 255, 136, 0.6)",
                    }}
                  >
                    VULNERABILITY SCANNER
                  </h1>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#999999",
                      margin: "0",
                      letterSpacing: "1px",
                    }}
                  >
                    Scan & Strike - Advanced Smart Contract Security Analysis
                  </p>
                </div>
              </div>

              {/* Live Status */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <motion.div
                  className="pulse-dot"
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: isScanning ? "#ffaa00" : "#00ff88",
                    color: isScanning ? "#ffaa00" : "#00ff88",
                  }}
                />
                <span
                  style={{
                    color: "#cccccc",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {isScanning ? "SCANNING..." : "READY"}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats Dashboard */}
        <ScrollReveal delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {[
              {
                label: "Total Scans",
                value: stats.totalScans,
                icon: Activity,
                color: "#00ff88",
              },
              {
                label: "Vulnerabilities",
                value: stats.vulnerabilitiesFound,
                icon: AlertTriangle,
                color: "#ff4444",
              },
              {
                label: "Contracts Analyzed",
                value: stats.contractsAnalyzed,
                icon: FileCode,
                color: "#00ffff",
              },
              {
                label: "Average Score",
                value: stats.averageScore,
                icon: BarChart3,
                color: "#ffaa00",
                suffix: "%",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${stat.color}30`,
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: `0 0 20px ${stat.color}20`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    background: `linear-gradient(135deg, ${stat.color}05, transparent)`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: `${stat.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${stat.color}60`,
                    }}
                  >
                    <stat.icon size={18} color={stat.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: stat.color,
                        lineHeight: 1,
                      }}
                    >
                      <LiveCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        decimals={stat.suffix === "%" ? 1 : 0}
                        duration={2000}
                      />
                    </motion.div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginTop: "4px",
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* Tab Navigation */}
        <ScrollReveal delay={0.15}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                borderRadius: "16px",
                padding: "6px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 0 30px rgba(0, 255, 136, 0.2)",
              }}
            >
              {[
                {
                  id: "scanner",
                  label: "Security Scanner",
                  icon: Shield,
                  color: "#00ff88",
                },
                {
                  id: "simulations",
                  label: "Simulation Engine",
                  icon: Activity,
                  color: "#00ffff",
                },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as "scanner" | "simulations")}
                  style={{
                    padding: "14px 28px",
                    borderRadius: "12px",
                    border: "none",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    backgroundColor:
                      activeTab === tab.id
                        ? `${tab.color}20`
                        : "transparent",
                    color: activeTab === tab.id ? tab.color : "#cccccc",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.3s ease",
                    boxShadow: activeTab === tab.id ? `0 0 20px ${tab.color}30` : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(135deg, ${tab.color}15, ${tab.color}05)`,
                        borderRadius: "12px",
                      }}
                    />
                  )}
                  <tab.icon size={18} />
                  <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "scanner" && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Scan Mode Toggle */}
              <ScrollReveal delay={0.2}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                borderRadius: "12px",
                padding: "4px",
                backdropFilter: "blur(10px)",
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScanMode("address")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  backgroundColor:
                    scanMode === "address"
                      ? "rgba(0, 255, 136, 0.2)"
                      : "transparent",
                  color: scanMode === "address" ? "#00ff88" : "#cccccc",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Hash size={16} />
                Contract Address
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScanMode("files")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  backgroundColor:
                    scanMode === "files"
                      ? "rgba(0, 255, 136, 0.2)"
                      : "transparent",
                  color: scanMode === "files" ? "#00ff88" : "#cccccc",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Upload size={16} />
                File Upload
              </motion.button>
            </div>
          </div>
        </ScrollReveal>

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: scanMode === "files" ? "1fr 1fr" : "1fr",
            gap: "32px",
            marginBottom: "32px",
          }}
        >
          {/* Scanner Configuration */}
          <ScrollReveal delay={0.3}>
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#00ffff",
                  margin: "0 0 24px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Target size={20} />
                {scanMode === "address"
                  ? "Target Configuration"
                  : "File Upload"}
              </h2>

              {scanMode === "address" ? (
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      color: "#cccccc",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Contract Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x742d35Cc6431C8BF3240C39B6969E3C77e1345eF"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(0, 255, 255, 0.3)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      outline: "none",
                    }}
                  />
                </div>
              ) : (
                <div>
                  {/* File Upload Area */}
                  <motion.div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      border: isDragOver
                        ? "2px dashed #00ff88"
                        : "2px dashed rgba(0, 255, 136, 0.3)",
                      borderRadius: "12px",
                      padding: "32px",
                      textAlign: "center",
                      backgroundColor: isDragOver
                        ? "rgba(0, 255, 136, 0.1)"
                        : "rgba(0, 0, 0, 0.4)",
                      cursor: "pointer",
                      marginBottom: "16px",
                    }}
                    className={isDragOver ? "drag-over" : ""}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload
                      size={48}
                      color={isDragOver ? "#00ff88" : "#666666"}
                      style={{ marginBottom: "16px" }}
                    />
                    <h3
                      style={{
                        fontSize: "18px",
                        color: isDragOver ? "#00ff88" : "#cccccc",
                        margin: "0 0 8px 0",
                        fontWeight: "600",
                      }}
                    >
                      Drop files here or click to browse
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#999999",
                        margin: "0 0 8px 0",
                      }}
                    >
                      Supports .sol, .vy, .cairo, .move, .js, .ts files and .zip
                      projects
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#666666",
                        margin: "0",
                      }}
                    >
                      Maximum file size: 10MB
                    </p>
                  </motion.div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".sol,.vy,.cairo,.move,.js,.ts,.rs,.zip,.json"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  {/* Upload Progress */}
                  <AnimatePresence>
                    {Object.entries(uploadProgress).map(
                      ([fileId, progress]) => (
                        <motion.div
                          key={fileId}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            padding: "12px",
                            backgroundColor: "rgba(0, 255, 136, 0.1)",
                            borderRadius: "8px",
                            marginBottom: "8px",
                            border: "1px solid rgba(0, 255, 136, 0.3)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <span
                              style={{ fontSize: "14px", color: "#cccccc" }}
                            >
                              Uploading...
                            </span>
                            <span
                              style={{ fontSize: "12px", color: "#00ff88" }}
                            >
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "4px",
                              backgroundColor: "rgba(0, 0, 0, 0.3)",
                              borderRadius: "2px",
                              overflow: "hidden",
                            }}
                          >
                            <motion.div
                              style={{
                                height: "100%",
                                backgroundColor: "#00ff88",
                                borderRadius: "2px",
                              }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </motion.div>
                      ),
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Security Tools */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    color: "#cccccc",
                    margin: "0 0 16px 0",
                    fontWeight: "500",
                  }}
                >
                  Security Analysis Tools
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      key: "slither",
                      name: "Slither",
                      description: "Static analysis framework",
                    },
                    {
                      key: "mythril",
                      name: "Mythril",
                      description: "Security analysis tool",
                    },
                    {
                      key: "echidna",
                      name: "Scorpius AI",
                      description: "AI-powered vulnerability detection",
                    },
                  ].map((tool) => (
                    <div
                      key={tool.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "8px",
                        border: `1px solid rgba(0, 255, 255, 0.2)`,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#ffffff",
                            fontWeight: "500",
                            marginBottom: "2px",
                          }}
                        >
                          {tool.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999999",
                          }}
                        >
                          {tool.description}
                        </div>
                      </div>
                      <Switch
                        checked={
                          securityTools[tool.key as keyof typeof securityTools]
                        }
                        onCheckedChange={(checked) =>
                          setSecurityTools((prev) => ({
                            ...prev,
                            [tool.key]: checked,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* File Selection for Files Mode */}
              {scanMode === "files" && uploadedFiles.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        color: "#cccccc",
                        margin: "0",
                        fontWeight: "500",
                      }}
                    >
                      Select Files to Scan
                    </h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={selectAllContracts}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "rgba(0, 255, 136, 0.2)",
                          border: "1px solid rgba(0, 255, 136, 0.4)",
                          borderRadius: "6px",
                          color: "#00ff88",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Select All
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearSelection}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "rgba(255, 68, 68, 0.2)",
                          border: "1px solid rgba(255, 68, 68, 0.4)",
                          borderRadius: "6px",
                          color: "#ff4444",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Clear
                      </motion.button>
                    </div>
                  </div>
                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid rgba(0, 255, 255, 0.2)",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                    }}
                    className="file-list"
                  >
                    {uploadedFiles
                      .filter((f) => f.isContract)
                      .map((file) => {
                        const IconComponent = getFileIcon(file.name);
                        return (
                          <motion.div
                            key={file.id}
                            whileHover={{
                              backgroundColor: "rgba(0, 255, 255, 0.1)",
                            }}
                            onClick={() => toggleFileSelection(file.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(0, 255, 255, 0.1)",
                              backgroundColor: selectedFiles.includes(file.id)
                                ? "rgba(0, 255, 136, 0.1)"
                                : "transparent",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => {}}
                              style={{
                                marginRight: "12px",
                                accentColor: "#00ff88",
                              }}
                            />
                            <IconComponent
                              size={16}
                              color="#00ffff"
                              style={{ marginRight: "8px" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#ffffff",
                                  fontWeight: "500",
                                }}
                              >
                                {file.name}
                              </div>
                              {file.path && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#999999",
                                  }}
                                >
                                  {file.path}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#999999",
                              }}
                            >
                              {formatFileSize(file.size)}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Scan Controls */}
              <div style={{ display: "flex", gap: "12px" }}>
                {!isScanning ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startScan}
                    style={{
                      flex: 1,
                      padding: "12px 24px",
                      backgroundColor: "rgba(0, 255, 136, 0.2)",
                      border: "1px solid rgba(0, 255, 136, 0.5)",
                      borderRadius: "8px",
                      color: "#00ff88",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Play size={16} />
                    Start Scan
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopScan}
                    style={{
                      flex: 1,
                      padding: "12px 24px",
                      backgroundColor: "rgba(255, 68, 68, 0.2)",
                      border: "1px solid rgba(255, 68, 68, 0.5)",
                      borderRadius: "8px",
                      color: "#ff4444",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Pause size={16} />
                    Stop Scan
                  </motion.button>
                )}

                {scanResults.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportResults}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "rgba(0, 255, 255, 0.2)",
                      border: "1px solid rgba(0, 255, 255, 0.5)",
                      borderRadius: "8px",
                      color: "#00ffff",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Download size={16} />
                    Export
                  </motion.button>
                )}
              </div>

              {/* Scan Progress */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: "16px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#cccccc" }}>
                        Scanning Progress
                      </span>
                      <span style={{ fontSize: "14px", color: "#00ff88" }}>
                        {scanProgress}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        style={{
                          height: "100%",
                          background:
                            "linear-gradient(90deg, #00ff88, #00ffff)",
                          borderRadius: "4px",
                          boxShadow: "0 0 10px rgba(0, 255, 136, 0.5)",
                        }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>

          {/* File Management Panel (only in files mode) */}
          {scanMode === "files" && (
            <ScrollReveal delay={0.4}>
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 170, 0, 0.3)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 0 20px rgba(255, 170, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#ffaa00",
                      margin: "0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FolderOpen size={20} />
                    File Manager
                  </h2>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <span>{uploadedFiles.length} files</span>
                    <span>{projects.length} projects</span>
                  </div>
                </div>

                {/* Projects Section */}
                {projects.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        color: "#cccccc",
                        margin: "0 0 12px 0",
                        fontWeight: "500",
                      }}
                    >
                      Projects
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {projects.map((project) => (
                        <motion.div
                          key={project.id}
                          whileHover={{ scale: 1.02 }}
                          style={{
                            padding: "16px",
                            backgroundColor: "rgba(0, 0, 0, 0.4)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 170, 0, 0.3)",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Package size={16} color="#ffaa00" />
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "#ffffff",
                                  fontWeight: "600",
                                }}
                              >
                                {project.name}
                              </span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1, color: "#ff4444" }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeProject(project.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#999999",
                                cursor: "pointer",
                                padding: "4px",
                              }}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              color: "#999999",
                            }}
                          >
                            <span>{project.contracts.length} contracts</span>
                            <span>{formatFileSize(project.totalSize)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Files Section */}
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: "#cccccc",
                      margin: "0 0 12px 0",
                      fontWeight: "500",
                    }}
                  >
                    Individual Files
                  </h3>

                  {uploadedFiles.filter(
                    (f) =>
                      !projects.some((p) =>
                        p.files.some((pf) => pf.id === f.id),
                      ),
                  ).length === 0 ? (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "#666666",
                        fontSize: "14px",
                        fontStyle: "italic",
                      }}
                    >
                      No files uploaded yet. Use the upload area to add files.
                    </div>
                  ) : (
                    <div
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        border: "1px solid rgba(255, 170, 0, 0.2)",
                        borderRadius: "8px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                      }}
                      className="file-list"
                    >
                      {uploadedFiles
                        .filter(
                          (f) =>
                            !projects.some((p) =>
                              p.files.some((pf) => pf.id === f.id),
                            ),
                        )
                        .map((file) => {
                          const IconComponent = getFileIcon(file.name);
                          return (
                            <motion.div
                              key={file.id}
                              whileHover={{
                                backgroundColor: "rgba(255, 170, 0, 0.1)",
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                borderBottom:
                                  "1px solid rgba(255, 170, 0, 0.1)",
                              }}
                            >
                              <IconComponent
                                size={16}
                                color={file.isContract ? "#00ff88" : "#ffaa00"}
                                style={{ marginRight: "12px" }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#ffffff",
                                    fontWeight: "500",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {file.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: file.isContract
                                      ? "#00ff88"
                                      : "#999999",
                                  }}
                                >
                                  {file.isContract
                                    ? "Contract file"
                                    : "Supporting file"}{" "}
                                  • {formatFileSize(file.size)}
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1, color: "#ff4444" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeFile(file.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#999999",
                                  cursor: "pointer",
                                  padding: "4px",
                                }}
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Scan Results */}
        <AnimatePresence>
          {scanResults.length > 0 && (
            <ScrollReveal delay={0.5}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 68, 68, 0.3)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 0 20px rgba(255, 68, 68, 0.1)",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#ff4444",
                      margin: "0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertTriangle size={20} />
                    Scan Results
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "14px",
                      color: "#cccccc",
                    }}
                  >
                    <span>
                      <strong style={{ color: "#ff4444" }}>
                        {
                          scanResults.filter((r) => r.severity === "Critical")
                            .length
                        }
                      </strong>{" "}
                      Critical
                    </span>
                    <span>
                      <strong style={{ color: "#ffaa00" }}>
                        {
                          scanResults.filter((r) => r.severity === "Warning")
                            .length
                        }
                      </strong>{" "}
                      Warning
                    </span>
                    <span>
                      <strong style={{ color: "#00ffff" }}>
                        {
                          scanResults.filter((r) => r.severity === "Info")
                            .length
                        }
                      </strong>{" "}
                      Info
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {scanResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedVulnerability(result)}
                      style={{
                        padding: "20px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "12px",
                        border: `1px solid ${getSeverityColor(result.severity)}30`,
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: "0",
                          top: "0",
                          bottom: "0",
                          width: "4px",
                          backgroundColor: getSeverityColor(result.severity),
                        }}
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "16px",
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                backgroundColor: `${getSeverityColor(result.severity)}20`,
                                color: getSeverityColor(result.severity),
                                border: `1px solid ${getSeverityColor(result.severity)}40`,
                              }}
                            >
                              {result.severity}
                            </span>
                            <h3
                              style={{
                                fontSize: "16px",
                                color: "#ffffff",
                                margin: "0",
                                fontWeight: "600",
                              }}
                            >
                              {result.title}
                            </h3>
                            {result.fileName && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#999999",
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {result.fileName}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#cccccc",
                              margin: "0 0 12px 0",
                              lineHeight: "1.5",
                            }}
                          >
                            {result.description}
                          </p>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(120px, 1fr))",
                              gap: "12px",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <span style={{ color: "#999999" }}>
                                Function:{" "}
                              </span>
                              <span
                                style={{
                                  color: "#00ffff",
                                  fontFamily: "monospace",
                                }}
                              >
                                {result.function}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: "#999999" }}>Line: </span>
                              <span style={{ color: "#ffaa00" }}>
                                {result.line}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: "#999999" }}>Impact: </span>
                              <span
                                style={{ color: getImpactColor(result.impact) }}
                              >
                                {result.impact}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: "#999999" }}>
                                Confidence:{" "}
                              </span>
                              <span style={{ color: "#00ff88" }}>
                                {result.confidence}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(0, 255, 255, 0.2)",
                            border: "1px solid rgba(0, 255, 255, 0.4)",
                            color: "#00ffff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Eye size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </ScrollReveal>
          )}
        </AnimatePresence>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <ScrollReveal delay={0.6}>
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 0 20px rgba(0, 255, 136, 0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#00ff88",
                  margin: "0 0 20px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Clock size={20} />
                Scan History
              </h2>
              <div style={{ overflowX: "auto" }} className="data-grid">
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(0, 255, 136, 0.3)",
                      }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          color: "#00ff88",
                          fontWeight: "600",
                        }}
                      >
                        Target
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          color: "#00ff88",
                          fontWeight: "600",
                        }}
                      >
                        Mode
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          color: "#00ff88",
                          fontWeight: "600",
                        }}
                      >
                        Results
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          color: "#00ff88",
                          fontWeight: "600",
                        }}
                      >
                        Score
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          color: "#00ff88",
                          fontWeight: "600",
                        }}
                      >
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanHistory.map((scan, index) => (
                      <motion.tr
                        key={scan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{
                          backgroundColor: "rgba(0, 255, 136, 0.05)",
                        }}
                        style={{
                          borderBottom: "1px solid rgba(0, 255, 136, 0.1)",
                        }}
                      >
                        <td style={{ padding: "12px", color: "#ffffff" }}>
                          <div
                            style={{
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontFamily: "monospace",
                            }}
                          >
                            {scan.target}
                          </div>
                        </td>
                        <td style={{ padding: "12px", color: "#cccccc" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              backgroundColor:
                                scan.mode === "files"
                                  ? "rgba(0, 255, 136, 0.2)"
                                  : "rgba(0, 255, 255, 0.2)",
                              color:
                                scan.mode === "files" ? "#00ff88" : "#00ffff",
                            }}
                          >
                            {scan.mode}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <span style={{ color: "#ff4444" }}>
                              {scan.critical}C
                            </span>
                            <span style={{ color: "#ffaa00" }}>
                              {scan.warnings}W
                            </span>
                            <span style={{ color: "#cccccc" }}>
                              {scan.results - scan.critical - scan.warnings}I
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              color:
                                scan.score >= 80
                                  ? "#00ff88"
                                  : scan.score >= 60
                                    ? "#ffaa00"
                                    : "#ff4444",
                              fontWeight: "600",
                            }}
                          >
                            {scan.score}%
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "#999999" }}>
                          {new Date(scan.timestamp).toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
          )}

          {activeTab === "simulations" && (
            <motion.div
              key="simulations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Simulation Engine Content */}
              <ScrollReveal delay={0.2}>
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    borderRadius: "16px",
                    padding: "24px",
                    marginBottom: "24px",
                    boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "24px",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#00ffff",
                          margin: "0 0 8px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <Activity size={24} />
                        Simulation Engine
                      </h2>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#999999",
                          margin: "0",
                        }}
                      >
                        Advanced blockchain simulation and testing environment
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCreatingSimulation(true)}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "rgba(0, 255, 255, 0.2)",
                        border: "1px solid rgba(0, 255, 255, 0.3)",
                        borderRadius: "12px",
                        color: "#00ffff",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Plus size={16} />
                      New Simulation
                    </motion.button>
                  </div>

                  {/* Simulation Stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                      marginBottom: "32px",
                    }}
                  >
                    {[
                      {
                        label: "Total Simulations",
                        value: simulationStats.totalSimulations,
                        icon: Activity,
                        color: "#00ffff",
                      },
                      {
                        label: "Active Environments",
                        value: simulationStats.activeEnvironments,
                        icon: Cpu,
                        color: "#00ff88",
                      },
                      {
                        label: "Tests Completed",
                        value: simulationStats.completedTests,
                        icon: CheckCircle,
                        color: "#ffaa00",
                      },
                      {
                        label: "AI Analysis Runs",
                        value: simulationStats.aiAnalysisRuns,
                        icon: TrendingUp,
                        color: "#ff4444",
                      },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.4)",
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${stat.color}30`,
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: `0 0 20px ${stat.color}20`,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            background: `linear-gradient(135deg, ${stat.color}05, transparent)`,
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              backgroundColor: `${stat.color}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${stat.color}60`,
                            }}
                          >
                            <stat.icon size={16} color={stat.color} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                color: stat.color,
                                lineHeight: 1,
                              }}
                            >
                              <LiveCounter
                                value={stat.value}
                                duration={2000}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#999999",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginTop: "4px",
                              }}
                            >
                              {stat.label}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Simulation Environment Control */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                      marginBottom: "24px",
                    }}
                  >
                    {/* Environment Management */}
                    <div
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#00ff88",
                          margin: "0 0 16px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Cpu size={16} />
                        Environment Control
                      </h3>

                      {/* Environment Types */}
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#cccccc",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Environment Type
                        </label>
                        <select
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid rgba(0, 255, 136, 0.3)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "13px",
                            outline: "none",
                          }}
                        >
                          <option value="mainnet_fork">Mainnet Fork</option>
                          <option value="custom_network">Custom Network</option>
                          <option value="historical">Historical Recreation</option>
                          <option value="testnet">Testnet Environment</option>
                        </select>
                      </div>

                      {/* Network Configuration */}
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#cccccc",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Network
                        </label>
                        <select
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid rgba(0, 255, 136, 0.3)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "13px",
                            outline: "none",
                          }}
                        >
                          <option value="ethereum">Ethereum</option>
                          <option value="polygon">Polygon</option>
                          <option value="bsc">Binance Smart Chain</option>
                          <option value="avalanche">Avalanche</option>
                          <option value="arbitrum">Arbitrum</option>
                        </select>
                      </div>

                      {/* Fork Block */}
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#cccccc",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Fork Block Number
                        </label>
                        <input
                          type="number"
                          placeholder="18500000"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid rgba(0, 255, 136, 0.3)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            outline: "none",
                          }}
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "rgba(0, 255, 136, 0.2)",
                          border: "1px solid rgba(0, 255, 136, 0.3)",
                          borderRadius: "8px",
                          color: "#00ff88",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Play size={16} />
                        Create Environment
                      </motion.button>
                    </div>

                    {/* Simulation Scenarios */}
                    <div
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 170, 0, 0.3)",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#ffaa00",
                          margin: "0 0 16px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Target size={16} />
                        Scenario Builder
                      </h3>

                      {/* Scenario Types */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        {[
                          { name: "Flash Loan Attack", color: "#ff4444" },
                          { name: "Reentrancy Test", color: "#ff6600" },
                          { name: "Oracle Manipulation", color: "#ffaa00" },
                          { name: "Governance Attack", color: "#00ffff" },
                          { name: "MEV Simulation", color: "#9966ff" },
                          { name: "Custom Scenario", color: "#00ff88" },
                        ].map((scenario, index) => (
                          <motion.button
                            key={scenario.name}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: `${scenario.color}20`,
                              border: `1px solid ${scenario.color}30`,
                              borderRadius: "6px",
                              color: scenario.color,
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            {scenario.name}
                          </motion.button>
                        ))}
                      </div>

                      {/* Custom Parameters */}
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#cccccc",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Target Contract
                        </label>
                        <input
                          type="text"
                          placeholder="0x... or contract name"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid rgba(255, 170, 0, 0.3)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            outline: "none",
                          }}
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "rgba(255, 170, 0, 0.2)",
                          border: "1px solid rgba(255, 170, 0, 0.3)",
                          borderRadius: "8px",
                          color: "#ffaa00",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Zap size={16} />
                        Start Simulation
                      </motion.button>
                    </div>
                  </div>

                  {/* Active Simulations */}
                  <div
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 68, 68, 0.3)",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#ff4444",
                        margin: "0 0 16px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Activity size={16} />
                      Active Simulations
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      {[
                        {
                          id: "sim_001",
                          name: "Flash Loan Attack on Uniswap V3",
                          status: "running",
                          progress: 67,
                          startTime: "2 minutes ago",
                          type: "Security Test",
                          environment: "Ethereum Mainnet Fork",
                        },
                        {
                          id: "sim_002",
                          name: "Reentrancy Vulnerability Analysis",
                          status: "completed",
                          progress: 100,
                          startTime: "15 minutes ago",
                          type: "Vulnerability Test",
                          environment: "Custom Network",
                        },
                        {
                          id: "sim_003",
                          name: "Oracle Price Manipulation",
                          status: "queued",
                          progress: 0,
                          startTime: "Pending",
                          type: "Economic Test",
                          environment: "Polygon Fork",
                        },
                      ].map((sim, index) => (
                        <motion.div
                          key={sim.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          style={{
                            padding: "16px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: "16px",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "8px",
                              }}
                            >
                              <h4
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#ffffff",
                                  margin: "0",
                                }}
                              >
                                {sim.name}
                              </h4>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "600",
                                  textTransform: "uppercase",
                                  backgroundColor:
                                    sim.status === "running"
                                      ? "rgba(255, 170, 0, 0.2)"
                                      : sim.status === "completed"
                                      ? "rgba(0, 255, 136, 0.2)"
                                      : "rgba(100, 100, 100, 0.2)",
                                  color:
                                    sim.status === "running"
                                      ? "#ffaa00"
                                      : sim.status === "completed"
                                      ? "#00ff88"
                                      : "#999999",
                                }}
                              >
                                {sim.status}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "16px",
                                fontSize: "12px",
                                color: "#999999",
                              }}
                            >
                              <span>Type: {sim.type}</span>
                              <span>Environment: {sim.environment}</span>
                              <span>Started: {sim.startTime}</span>
                            </div>
                            {sim.status === "running" && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  width: "100%",
                                  height: "4px",
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: "2px",
                                  overflow: "hidden",
                                }}
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${sim.progress}%` }}
                                  style={{
                                    height: "100%",
                                    backgroundColor: "#ffaa00",
                                    borderRadius: "2px",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                            }}
                          >
                            {sim.status === "running" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                  padding: "6px",
                                  backgroundColor: "rgba(255, 68, 68, 0.2)",
                                  border: "1px solid rgba(255, 68, 68, 0.3)",
                                  borderRadius: "6px",
                                  color: "#ff4444",
                                  cursor: "pointer",
                                }}
                              >
                                <Pause size={12} />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              style={{
                                padding: "6px",
                                backgroundColor: "rgba(0, 255, 255, 0.2)",
                                border: "1px solid rgba(0, 255, 255, 0.3)",
                                borderRadius: "6px",
                                color: "#00ffff",
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={12} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* AI Analysis Results */}
                  <div
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(153, 102, 255, 0.3)",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#9966ff",
                        margin: "0 0 16px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <TrendingUp size={16} />
                      AI Analysis & Insights
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      {/* ML Model Performance */}
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "rgba(153, 102, 255, 0.1)",
                          border: "1px solid rgba(153, 102, 255, 0.2)",
                          borderRadius: "8px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#9966ff",
                            margin: "0 0 12px 0",
                          }}
                        >
                          Model Performance
                        </h4>
                        <div style={{ fontSize: "12px", color: "#cccccc" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span>Exploit Detection Accuracy:</span>
                            <span style={{ color: "#00ff88" }}>94.7%</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span>False Positive Rate:</span>
                            <span style={{ color: "#ffaa00" }}>2.1%</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Pattern Recognition:</span>
                            <span style={{ color: "#00ffff" }}>87.3%</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Discoveries */}
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "rgba(0, 255, 136, 0.1)",
                          border: "1px solid rgba(0, 255, 136, 0.2)",
                          borderRadius: "8px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#00ff88",
                            margin: "0 0 12px 0",
                          }}
                        >
                          Recent Discoveries
                        </h4>
                        <div style={{ fontSize: "12px", color: "#cccccc" }}>
                          <div style={{ marginBottom: "6px" }}>
                            • Novel reentrancy pattern detected
                          </div>
                          <div style={{ marginBottom: "6px" }}>
                            • Flash loan vulnerability in DeFi protocol
                          </div>
                          <div>
                            • Oracle manipulation attack vector
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default SmartContractScanner;