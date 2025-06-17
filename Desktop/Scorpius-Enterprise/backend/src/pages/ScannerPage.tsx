
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ScanSearch, AlertTriangle, CheckCircle, ServerCrash, Files, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { initiateAndFetchScanResults } from "@/services/scannerService";
import { generateReport } from "@/services/reportsService";
import type { Report } from "@/types/api";
import type { ScanResult } from "@/types/apiSpec";

export default function ScannerPage() {
  const [contractAddress, setContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleValidation = (): boolean => {
    if (!contractAddress.startsWith("0x")) {
      toast.error("Invalid Contract Address", { description: "Address must start with '0x'." });
      return false;
    }
    if (contractAddress.length !== 42) { // Basic length check for Ethereum addresses
      toast.error("Invalid Contract Address", { description: "Address must be 42 characters long." });
      return false;
    }
    return true;
  };

  const handleSubmitScan = async () => {
    if (!handleValidation()) {
      return;
    }

    setIsLoading(true);
    setScanResults(null); 
    setError(null);
    toast.info("Scan Initiated", { description: `Scanning contract: ${contractAddress}` });

    try {
      const results = await initiateAndFetchScanResults(contractAddress);
      setScanResults(results);
      if (results.length > 0) {
        toast.success("Scan Complete", { description: `Found ${results.length} potential issues.` });
      } else {
        toast.success("Scan Complete", { description: "No vulnerabilities found for the scanned contract." });
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred during the scan.";
      setError(errorMessage);
      toast.error("Scan Failed", { description: errorMessage });
      setScanResults([]); // Ensure results area shows error/empty state
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      toast.info("Generating Report", { description: "Creating PDF audit report..." });
      
      const report = await generateReport(
        `Security Audit - ${contractAddress.slice(0, 10)}...`,
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

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary" />
          <p className="text-lg">Scanning in progress...</p>
          <p>Please wait while we analyze the contract.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-destructive py-8">
          <ServerCrash size={48} className="mx-auto mb-4" />
          <p className="text-lg font-semibold">Scan Error</p>
          <p>{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Please check the contract address or try again later.</p>
        </div>
      );
    }

    if (scanResults === null) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <ScanSearch size={48} className="mx-auto mb-4" />
          <p className="text-lg">Ready to Scan</p>
          <p>Enter a contract address above and click "Scan" to see results.</p>
        </div>
      );
    }

    if (scanResults.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <p className="text-lg">No Vulnerabilities Found</p>
          <p>The scan completed successfully and found no issues for contract {contractAddress}.</p>
        </div>
      );
    }

    return (
      <>
        <CardHeader className="pt-0"> {/* Adjusted padding */}
          <CardTitle className="flex items-center gap-2"><Files /> Scan Results</CardTitle>
          <CardDescription>Found {scanResults.length} potential issues for contract {contractAddress}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Plugin</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden lg:table-cell">Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", {
                      "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100": result.severity === "Critical",
                      "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100": result.severity === "High",
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100": result.severity === "Medium",
                      "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100": result.severity === "Low",
                      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100": result.severity === "Info",
                    })}>
                      {result.severity}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{result.title}</TableCell>
                  <TableCell>{result.plugin}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{result.description}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{result.recommendation || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScanSearch /> Smart Contract Scanner</CardTitle>
          <CardDescription>Enter a contract address to begin scanning for vulnerabilities. Try "0xErrorContractAddress" or "0xNoResultsContractAddress" for different simulated responses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="0x..."
              aria-label="Contract Address"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" onClick={handleSubmitScan} disabled={isLoading || !contractAddress} aria-live="polite">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">This tool simulates backend analysis. No actual blockchain interaction occurs.</p>
          {scanResults && scanResults.length > 0 && (
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

      <Card>
        {/* Render loading, error, empty or results state here */}
        {renderResults()}
      </Card>
    </div>
  );
}
