import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateReport } from "@/services/reportsService";
import type { Report } from "@/types/api";

export default function HoneypotPage() {
  const [contractAddress, setContractAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleAnalyze = async () => {
    if (!contractAddress.startsWith("0x") || contractAddress.length !== 42) {
      toast.error("Invalid Contract Address", { description: "Address must start with '0x' and be 42 characters long." });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    toast.info("Honeypot Analysis Initiated", { description: `Analyzing contract: ${contractAddress}` });

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysisComplete(true);
      toast.success("Analysis Complete", { description: "Honeypot analysis finished successfully." });
    } catch (error: any) {
      toast.error("Analysis Failed", { description: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      toast.info("Generating Report", { description: "Creating PDF honeypot analysis report..." });
      
      const report = await generateReport(
        `Honeypot Analysis - ${contractAddress.slice(0, 10)}...`,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield /> Honeypot Detector</CardTitle>
          <CardDescription>Detect honeypot contracts and assess risks associated with suspicious tokens or contracts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="0x..."
              aria-label="Contract Address"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isAnalyzing}
            />
            <Button type="submit" onClick={handleAnalyze} disabled={isAnalyzing || !contractAddress}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">Honeypot detection analysis for smart contract security assessment.</p>
          {analysisComplete && (
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

      {analysisComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              Honeypot analysis results for {contractAddress} would be displayed here.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
