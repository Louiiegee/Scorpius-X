
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlayCircle, StopCircle, AlertTriangle, BarChart3, TrendingUp, Zap, ServerCrash, DatabaseZap } from "lucide-react";
import { toast } from "sonner";
import {
  fetchMempoolConfig,
  startMempoolMonitoring,
  stopMempoolMonitoring,
  fetchLiveTransactions,
  fetchMevOpportunities,
  fetchGasPrices
} from "@/services/mempoolService";
import type { MempoolTransaction, MEVOpportunity, GasPrice, MempoolConfig } from "@/types/apiSpec";

export default function MempoolPage() {
  const [config, setConfig] = useState<MempoolConfig | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [transactions, setTransactions] = useState<MempoolTransaction[]>([]);
  const [mevOpportunities, setMevOpportunities] = useState<MEVOpportunity[]>([]);
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([]);
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false); // For data refresh
  const [isTogglingMonitor, setIsTogglingMonitor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    setError(null);
    try {
      const fetchedConfig = await fetchMempoolConfig();
      setConfig(fetchedConfig);
      setIsMonitoring(fetchedConfig.monitoringEnabled); // Set initial monitoring state from config
    } catch (err: any) {
      setError(err.message || "Failed to load mempool configuration.");
      toast.error("Config Error", { description: err.message || "Failed to load mempool configuration." });
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadInitialConfig();
  }, [loadInitialConfig]);

  const fetchData = useCallback(async () => {
    if (!isMonitoring) return; // Only fetch if monitoring

    setIsLoadingData(true);
    // setError(null); // Don't clear global error on refresh, only specific data errors
    try {
      // Parallel fetching
      const [newTransactions, newMevOps, newGasPrices] = await Promise.all([
        fetchLiveTransactions(),
        fetchMevOpportunities(),
        fetchGasPrices()
      ]);
      // Prepend new transactions to show latest first, up to a limit
      setTransactions(prev => [...newTransactions, ...prev].slice(0, 50));
      setMevOpportunities(newMevOps); // Replace MEV ops
      setGasPrices(newGasPrices);      // Replace gas prices
      if (newTransactions.length === 0 && newMevOps.length === 0 && newGasPrices.length === 0) {
        // toast.info("No new mempool activity detected in this cycle.");
      }
    } catch (err: any) {
      toast.error("Data Fetch Error", { description: err.message || "Failed to fetch latest mempool data." });
      // Don't clear existing data on partial fetch error, allow user to see stale data
    } finally {
      setIsLoadingData(false);
    }
  }, [isMonitoring]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isMonitoring) {
      fetchData(); // Fetch immediately when monitoring starts
      intervalId = setInterval(fetchData, 5000); // Refresh data every 5 seconds
    }
    return () => clearInterval(intervalId); // Cleanup on unmount or when monitoring stops
  }, [isMonitoring, fetchData]);

  const toggleMonitoring = async () => {
    setIsTogglingMonitor(true);
    setError(null);
    try {
      if (isMonitoring) {
        await stopMempoolMonitoring();
        toast.success("Mempool monitoring stopped.");
        setIsMonitoring(false);
        // Optionally clear data when stopped, or keep last state:
        // setTransactions([]); 
        // setMevOpportunities([]);
        // setGasPrices([]);
      } else {
        await startMempoolMonitoring();
        toast.success("Mempool monitoring started.");
        setIsMonitoring(true); // fetchData effect will trigger
      }
      // Update config if necessary (or assume backend handles this)
      if (config) setConfig({...config, monitoringEnabled: !isMonitoring });

    } catch (err: any) {
      setError(err.message || `Failed to ${isMonitoring ? 'stop' : 'start'} monitoring.`);
      toast.error("Action Failed", { description: err.message || `Failed to ${isMonitoring ? 'stop' : 'start'} monitoring.` });
    } finally {
      setIsTogglingMonitor(false);
    }
  };
  
  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Mempool Configuration...</p>
      </div>
    );
  }

  if (error && !config) { // Critical error if config fails to load
    return (
      <div className="text-center text-destructive py-8">
        <ServerCrash size={48} className="mx-auto mb-4" />
        <p className="text-lg font-semibold">Configuration Error</p>
        <p>{error}</p>
        <Button onClick={loadInitialConfig} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><BarChart3 /> Mempool Monitor</CardTitle>
            <CardDescription>Real-time mempool activity, transactions, MEV, and gas prices.</CardDescription>
          </div>
          <Button onClick={toggleMonitoring} disabled={isTogglingMonitor || isLoadingConfig} variant={isMonitoring ? "destructive" : "default"}>
            {isTogglingMonitor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isMonitoring ? <StopCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />)}
            {isTogglingMonitor ? 'Processing...' : (isMonitoring ? 'Stop Monitoring' : 'Start Monitoring')}
          </Button>
        </CardHeader>
        {isMonitoring && isLoadingData && (
          <CardContent><p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching latest data...</p></CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp /> Live Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hash</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((tx) => ( // Show top 5
                    <TableRow key={tx.hash}>
                      <TableCell className="truncate max-w-[80px] text-xs" title={tx.hash}>{tx.hash.substring(0,10)}...</TableCell>
                      <TableCell className="truncate max-w-[80px] text-xs" title={tx.from}>{tx.from.substring(0,10)}...</TableCell>
                      <TableCell className="truncate max-w-[80px] text-xs" title={tx.to}>{tx.to.substring(0,10)}...</TableCell>
                      <TableCell className="text-xs">{tx.value.toFixed(4)} ETH</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{isMonitoring ? 'No new transactions.' : 'Start monitoring to see transactions.'}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap /> MEV Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {mevOpportunities.length > 0 ? (
               <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Type</TableHead>
                   <TableHead>Profit</TableHead>
                   <TableHead>Probability</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {mevOpportunities.slice(0,5).map((op, idx) => (
                   <TableRow key={`${op.type}-${idx}`}>
                     <TableCell className="text-xs">{op.type}</TableCell>
                     <TableCell className="text-xs">{op.profit.toFixed(4)} ETH</TableCell>
                     <TableCell className="text-xs">{(op.probability * 100).toFixed(1)}%</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{isMonitoring ? 'No MEV opportunities detected.' : 'Start monitoring for MEV.'}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DatabaseZap /> Gas Prices (Gwei)</CardTitle>
          </CardHeader>
          <CardContent>
            {gasPrices.length > 0 ? (
              <div className="space-y-2">
                {gasPrices.map(gp => (
                    <div key={gp.type} className="flex justify-between items-center text-sm">
                        <span className="capitalize text-muted-foreground">{gp.type}:</span>
                        <span className="font-semibold">{gp.price > 0 ? gp.price.toFixed(2) : "N/A"} Gwei</span>
                    </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{isMonitoring ? 'Gas price data unavailable.' : 'Start monitoring for gas prices.'}</p>
            )}
          </CardContent>
        </Card>
      </div>
      {!isMonitoring && transactions.length === 0 && (
         <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <PlayCircle size={48} className="mx-auto mb-2" />
                <p>Mempool monitoring is currently stopped.</p>
                <p>Click "Start Monitoring" to begin fetching live data.</p>
              </div>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
