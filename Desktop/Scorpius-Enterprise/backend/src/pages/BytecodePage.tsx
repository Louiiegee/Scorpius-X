
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Code2, AlertTriangle, CheckCircle, ServerCrash, FileJson, Cpu, FileText } from "lucide-react";
import { toast } from "sonner";
import { analyzeBytecode } from '@/services/bytecodeService';
import { generateReport } from "@/services/reportsService";
import type { Report } from "@/types/api";
import type { BytecodeAnalysis, FunctionAnalysis, VulnerabilityReport } from '@/types/apiSpec'; // Assuming VulnerabilityReport is added for this page's needs
import { cn } from '@/lib/utils';


export default function BytecodePage() {
  const [contractAddress, setContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BytecodeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleValidation = (): boolean => {
    if (!contractAddress.startsWith("0x")) {
      toast.error("Invalid Contract Address", { description: "Address must start with '0x'." });
      return false;
    }
    if (contractAddress.length !== 42) {
      toast.error("Invalid Contract Address", { description: "Address must be 42 characters long." });
      return false;
    }
    return true;
  };

  const handleSubmitAnalysis = async () => {
    if (!handleValidation()) {
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    toast.info("Bytecode Analysis Initiated", { description: `Analyzing contract: ${contractAddress}` });

    try {
      const result = await analyzeBytecode(contractAddress);
      setAnalysisResult(result);
      toast.success("Analysis Complete", { description: `Bytecode analysis for ${contractAddress} finished.` });
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred during analysis.";
      setError(errorMessage);
      toast.error("Analysis Failed", { description: errorMessage });
      setAnalysisResult({ id: 'error-state', contract: contractAddress, functions: [], summary: {overallComplexity:0, functionsIdentified:0} }); // Ensure results area shows error/empty
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      toast.info("Generating Report", { description: "Creating PDF bytecode analysis report..." });
      
      const report = await generateReport(
        `Bytecode Analysis - ${contractAddress.slice(0, 10)}...`,
        contractAddress,
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );
      
      toast.success("Report Generated", { description: "PDF report is ready for download." });
    } catch (error: any) {
      toast.error("Report Generation Failed", { description: error.message });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary" />
          <p className="text-lg">Analyzing Bytecode...</p>
          <p>This may take a few moments for complex contracts.</p>
        </div>
      );
    }

    if (error && (!analysisResult || analysisResult.functions.length === 0)) { // Prioritize showing error if no results
      return (
        <div className="text-center text-destructive py-12">
          <ServerCrash size={48} className="mx-auto mb-4" />
          <p className="text-lg font-semibold">Analysis Error</p>
          <p>{error}</p>
           <p className="mt-2 text-sm text-muted-foreground">Please verify the contract address or try "0xErrorContractAddress" / "0xEmptyBytecodeContract".</p>
        </div>
      );
    }
    
    if (!analysisResult) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <Code2 size={48} className="mx-auto mb-4" />
          <p className="text-lg">Ready for Analysis</p>
          <p>Enter a contract address to analyze its bytecode.</p>
        </div>
      );
    }
    
    // Extracted for clarity, even if it's currently empty
    const vulnerabilities: VulnerabilityReport[] = (analysisResult as any).vulnerabilities || [];


    return (
      <div className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileJson /> Analysis Summary for <span className="truncate max-w-xs block font-mono text-sm">{analysisResult.contract}</span></CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Functions Identified</p>
              <p className="text-2xl font-bold">{analysisResult.summary?.functionsIdentified ?? analysisResult.functions.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Overall Complexity Score</p>
              <p className="text-2xl font-bold">{analysisResult.summary?.overallComplexity ?? 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {analysisResult.functions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu /> Functions Identified</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function Name</TableHead>
                    <TableHead>Selector</TableHead>
                    <TableHead>Complexity</TableHead>
                    <TableHead>Gas Usage (Est.)</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisResult.functions.map((func, index) => (
                    <TableRow key={`${func.selector}-${index}`}>
                      <TableCell className="font-medium">{func.name || `unknown_${func.selector}`}</TableCell>
                      <TableCell className="font-mono text-xs">{func.selector}</TableCell>
                      <TableCell>{func.complexity}</TableCell>
                      <TableCell>{func.gasUsage}</TableCell>
                      <TableCell>{func.vulnerabilities > 0 ? <span className="text-red-500">{func.vulnerabilities}</span> : func.vulnerabilities}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {vulnerabilities.length > 0 && (
           <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Vulnerabilities Detected</CardTitle>
           </CardHeader>
           <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vulnerabilities.map((vuln, index) => (
                    <TableRow key={`${vuln.title}-${index}`}>
                      <TableCell>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", {
                          "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100": vuln.severity === "Critical",
                          "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100": vuln.severity === "High",
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100": vuln.severity === "Medium",
                          "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100": vuln.severity === "Low",
                        })}>
                          {vuln.severity}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{vuln.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vuln.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </CardContent>
         </Card>
        )}

        {analysisResult.functions.length === 0 && vulnerabilities.length === 0 && !error && (
             <div className="text-center text-muted-foreground py-12">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p className="text-lg">Analysis Complete</p>
                <p>No functions or specific vulnerabilities were itemized for {contractAddress} based on current analysis parameters from the backend.</p>
              </div>
        )}

      </div>
    );
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code2 /> Bytecode Analyzer</CardTitle>
          <CardDescription>
            Enter a contract address to decompile, analyze functions, and detect vulnerabilities.
            Try "0xErrorContractAddress", "0xEmptyBytecodeContract".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="0x..."
              aria-label="Contract Address"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" onClick={handleSubmitAnalysis} disabled={isLoading || !contractAddress}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Bytecode"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <p className="text-xs text-muted-foreground">Analysis is simulated. For actual results, connect to a Scorpius backend.</p>
            {analysisResult && analysisResult.functions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            )}
        </CardFooter>
      </Card>

      {renderContent()}
    </div>
  );
}
