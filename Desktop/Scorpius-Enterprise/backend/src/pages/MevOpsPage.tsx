// src/pages/MevOpsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Cog, History, PlusCircle, Edit3, Trash2, Play, AlertTriangle, ListFilter, ServerCrash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  fetchMEVStrategies, createMEVStrategy, updateMEVStrategy, deleteMEVStrategy, toggleMEVStrategy,
  fetchMEVOpportunities, executeMEVStrategy, fetchMEVExecutions,
  fetchMEVConfig, updateMEVConfig, fetchMEVWallets, addMEVWallet
} from '@/services/mevOpsService';
import { connectWebSocket, disconnectWebSocket } from '@/services/websocketService';
import type { MEVStrategy, MEVOpportunity, MEVExecution, MEVConfig, MEVWallet, WebSocketMessageBase } from '@/types/apiSpec';
import { cn } from '@/lib/utils';


const MEVStrategyTypes = ["arbitrage", "sandwich", "liquidation", "frontrun"] as const;

export default function MevOpsPage() {
  const [strategies, setStrategies] = useState<MEVStrategy[]>([]);
  const [opportunities, setOpportunities] = useState<MEVOpportunity[]>([]);
  const [executions, setExecutions] = useState<MEVExecution[]>([]);
  const [config, setConfig] = useState<MEVConfig | null>(null);
  const [wallets, setWallets] = useState<MEVWallet[]>([]);

  const [isLoading, setIsLoading] = useState({ strategies: false, opportunities: false, executions: false, config: false, wallets: false });
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<Partial<MEVStrategy> | null>(null);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<MEVOpportunity | null>(null);
  const [strategyForExecution, setStrategyForExecution] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState<MEVConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [isAddingWallet, setIsAddingWallet] = useState(false);


  const loadAllData = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, strategies: true, opportunities: true, executions: true, config: true, wallets: true }));
    setError(null);
    try {
      const [fetchedStrategies, fetchedOpportunities, fetchedExecutions, fetchedConfig, fetchedWallets] = await Promise.all([
        fetchMEVStrategies(), fetchMEVOpportunities(), fetchMEVExecutions(), fetchMEVConfig(), fetchMEVWallets()
      ]);
      setStrategies(fetchedStrategies);
      setOpportunities(fetchedOpportunities);
      setExecutions(fetchedExecutions);
      setConfig(fetchedConfig);
      setTempConfig(fetchedConfig); // For config dialog
      setWallets(fetchedWallets);
    } catch (err: any) {
      setError(err.message || "Failed to load MEV Ops data.");
      toast.error("Data Load Error", { description: err.message || "Failed to load MEV Ops data." });
    } finally {
      setIsLoading(prev => ({ ...prev, strategies: false, opportunities: false, executions: false, config: false, wallets: false }));
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // WebSocket Integration
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    const message = JSON.parse(event.data) as WebSocketMessageBase;
    switch (message.type) {
      case 'MEV_OPS_OPPORTUNITIES':
        setOpportunities(prev => [(message.payload as MEVOpportunity), ...prev].slice(0, 20)); // Prepend new opportunity
        break;
      case 'MEV_OPS_EXECUTIONS':
        const newExecution = message.payload as MEVExecution;
        setExecutions(prev => {
          const existingIndex = prev.findIndex(ex => ex.id === newExecution.id);
          if (existingIndex > -1) {
            return prev.map((ex, i) => i === existingIndex ? newExecution : ex);
          }
          return [newExecution, ...prev];
        });
        break;
      // case 'MEV_OPS_STRATEGY_PERFORMANCE': // TODO: Handle performance updates
      //   console.log("Strategy performance update:", message.payload);
      //   break;
      default:
        console.log("MEV Ops WS - Unhandled message type:", message.type);
    }
  }, []);

  useEffect(() => {
    const wsEndpoints = [
        `ws/mev/opportunities`,
        `ws/mev/executions`,
        // `ws/mev/strategies/performance` // Uncomment when ready to handle
    ];
    wsEndpoints.forEach(url => connectWebSocket(url, handleWebSocketMessage, 
        () => console.log(`MEV Ops WS connected to ${url}`),
        (err) => console.error(`MEV Ops WS error ${url}:`, err)
    ));
    return () => {
        wsEndpoints.forEach(url => disconnectWebSocket(url));
    };
  }, [handleWebSocketMessage]);


  const handleOpenStrategyDialog = (strategy?: MEVStrategy) => {
    setCurrentStrategy(strategy || { name: "", type: "arbitrage", parameters: {}, description: "" });
    setShowStrategyDialog(true);
  };

  const handleSaveStrategy = async () => {
    if (!currentStrategy || !currentStrategy.name || !currentStrategy.type) {
      toast.error("Strategy name and type are required.");
      return;
    }
    setIsSavingStrategy(true);
    try {
      if (currentStrategy.id) {
        const updated = await updateMEVStrategy(currentStrategy.id, currentStrategy);
        setStrategies(prev => prev.map(s => s.id === updated.id ? updated : s));
        toast.success(`Strategy "${updated.name}" updated.`);
      } else {
        const created = await createMEVStrategy(currentStrategy as Omit<MEVStrategy, 'id'>);
        setStrategies(prev => [created, ...prev]);
        toast.success(`Strategy "${created.name}" created.`);
      }
      setShowStrategyDialog(false);
      setCurrentStrategy(null);
    } catch (err: any) {
      toast.error("Save Strategy Failed", { description: err.message });
    } finally {
      setIsSavingStrategy(false);
    }
  };
  
  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;
    try {
      await deleteMEVStrategy(strategyId);
      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      toast.success("Strategy deleted.");
    } catch (err: any) {
      toast.error("Delete Strategy Failed", { description: err.message });
    }
  };

  const handleToggleStrategy = async (strategy: MEVStrategy) => {
    try {
      const updated = await toggleMEVStrategy(strategy.id, !strategy.enabled);
      setStrategies(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success(`Strategy "${updated.name}" ${updated.enabled ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      toast.error("Toggle Strategy Failed", { description: err.message });
    }
  };

  const handleOpenExecuteDialog = (opportunity: MEVOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExecuteDialog(true);
  };

  const handleExecute = async () => {
    if (!selectedOpportunity || !strategyForExecution) {
      toast.error("Opportunity and strategy are required for execution.");
      return;
    }
    setIsExecuting(true);
    try {
      const execution = await executeMEVStrategy(selectedOpportunity.id || `opp-${Date.now()}`, strategyForExecution);
      setExecutions(prev => [execution, ...prev]);
      toast.success(`Execution for opportunity started with strategy ${strategies.find(s=>s.id === strategyForExecution)?.name}.`);
      setShowExecuteDialog(false);
      setSelectedOpportunity(null);
      setStrategyForExecution("");
    } catch (err: any) {
      toast.error("Execution Failed", { description: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!tempConfig) return;
    setIsSavingConfig(true);
    try {
        const savedConfig = await updateMEVConfig(tempConfig);
        setConfig(savedConfig);
        toast.success("MEV configuration saved.");
        setShowConfigDialog(false);
    } catch (err: any) {
        toast.error("Save Config Failed", { description: err.message });
    } finally {
        setIsSavingConfig(false);
    }
  };
  
  const handleAddWallet = async () => {
    if (!newWalletName || !newWalletAddress) {
      toast.error("Wallet name and address are required.");
      return;
    }
    // Basic address validation
    if (!newWalletAddress.startsWith('0x') || newWalletAddress.length !== 42) {
        toast.error("Invalid wallet address format.");
        return;
    }
    setIsAddingWallet(true);
    try {
        const newWallet = await addMEVWallet({ name: newWalletName, address: newWalletAddress });
        setWallets(prev => [...prev, newWallet]);
        toast.success(`Wallet "${newWallet.name}" added.`);
        setNewWalletName("");
        setNewWalletAddress("");
        setShowWalletDialog(false);
    } catch (err: any) {
        toast.error("Add Wallet Failed", { description: err.message });
    } finally {
        setIsAddingWallet(false);
    }
  };


  if (isLoading.config && isLoading.strategies && isLoading.opportunities && isLoading.executions && !error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading MEV Operations Dashboard...</p>
      </div>
    );
  }

  if (error && !config && strategies.length === 0) {
     return (
      <div className="text-center text-destructive py-8">
        <ServerCrash size={48} className="mx-auto mb-4" />
        <p className="text-lg font-semibold">Error Loading MEV Operations Module</p>
        <p>{error}</p>
        <Button onClick={loadAllData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Zap /> MEV Operations</h2>
            <div>
                <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Cog className="mr-2 h-4 w-4" />Configure</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>MEV Configuration</DialogTitle></DialogHeader>
                        {tempConfig ? (
                            <div className="space-y-4 py-4">
                                <div className="flex items-center space-x-2">
                                    <Switch id="autoExec" checked={tempConfig.autoExecutionEnabled} onCheckedChange={checked => setTempConfig(c => c ? {...c, autoExecutionEnabled: checked} : null)} />
                                    <Label htmlFor="autoExec">Enable Auto Execution</Label>
                                </div>
                                <div>
                                    <Label htmlFor="minProfit">Min Profit Threshold (ETH)</Label>
                                    <Input id="minProfit" type="number" value={tempConfig.minProfitThreshold} onChange={e => setTempConfig(c => c ? {...c, minProfitThreshold: parseFloat(e.target.value) || 0} : null)} />
                                </div>
                                <div>
                                    <Label htmlFor="maxGas">Max Gas Price (Gwei)</Label>
                                    <Input id="maxGas" type="number" value={tempConfig.maxGasPrice} onChange={e => setTempConfig(c => c ? {...c, maxGasPrice: parseInt(e.target.value) || 0} : null)} />
                                </div>
                            </div>
                        ) : <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                                {isSavingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Config
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                 <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="ml-2"><PlusCircle className="mr-2 h-4 w-4" />Manage Wallets</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Manage MEV Wallets</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <h3 className="text-sm font-medium">Add New Wallet</h3>
                            <Input placeholder="Wallet Name" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} />
                            <Input placeholder="Wallet Address (0x...)" value={newWalletAddress} onChange={e => setNewWalletAddress(e.target.value)} />
                            <Button onClick={handleAddWallet} disabled={isAddingWallet} className="w-full">
                                {isAddingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Wallet
                            </Button>
                            <h3 className="text-sm font-medium pt-4">Existing Wallets</h3>
                            {isLoading.wallets ? <Loader2 className="h-5 w-5 animate-spin"/> :
                             wallets.length > 0 ? (
                                <ul className="list-disc list-inside text-xs max-h-40 overflow-y-auto">
                                    {wallets.map(w => <li key={w.id}>{w.name}: {w.address} ({w.isActive ? "Active" : "Inactive"})</li>)}
                                </ul>
                            ) : <p className="text-xs text-muted-foreground">No wallets configured.</p>}
                        </div>
                         <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                         </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>


      {/* MEV Strategy Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2"><ListFilter /> MEV Strategies</CardTitle>
            <Button onClick={() => handleOpenStrategyDialog()}><PlusCircle className="mr-2 h-4 w-4" />Add Strategy</Button>
          </div>
          <CardDescription>Configure and manage your MEV extraction strategies.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading.strategies ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : strategies.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {strategies.map(strat => (
                  <TableRow key={strat.id}>
                    <TableCell className="font-medium">{strat.name}</TableCell>
                    <TableCell className="capitalize">{strat.type}</TableCell>
                    <TableCell><Switch checked={strat.enabled} onCheckedChange={() => handleToggleStrategy(strat)} /></TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleOpenStrategyDialog(strat)}><Edit3 className="h-3 w-3" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteStrategy(strat.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No strategies configured. Add one to get started.</p>}
        </CardContent>
      </Card>

      {/* Live MEV Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap /> Live MEV Opportunities</CardTitle>
          <CardDescription>Monitor detected MEV opportunities in real-time.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading.opportunities && opportunities.length === 0 ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : opportunities.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Profit (Est.)</TableHead><TableHead>Probability</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {opportunities.slice(0,10).map((opp, idx) => ( // Show top 10
                  <TableRow key={opp.id || `${opp.type}-${idx}`}>
                    <TableCell className="capitalize">{opp.type}</TableCell>
                    <TableCell>{opp.profit.toFixed(4)} ETH</TableCell>
                    <TableCell>{(opp.probability * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleOpenExecuteDialog(opp)} disabled={strategies.filter(s=>s.enabled).length === 0}>
                        <Play className="mr-1 h-3 w-3" /> Execute
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No active MEV opportunities detected. Ensure monitoring is active.</p>}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History /> Execution History</CardTitle>
          <CardDescription>Track past MEV strategy executions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading.executions && executions.length === 0 ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : executions.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Strategy</TableHead><TableHead>Status</TableHead><TableHead>Profit</TableHead></TableRow></TableHeader>
              <TableBody>
                {executions.slice(0,10).map(exec => ( // Show top 10
                  <TableRow key={exec.id}>
                    <TableCell>{format(new Date(exec.timestamp), "PPpp")}</TableCell>
                    <TableCell>{strategies.find(s => s.id === exec.strategyId)?.name || exec.strategyId.substring(0,8)}</TableCell>
                    <TableCell>
                        <span className={cn("px-2 py-1 text-xs rounded-full", {
                            "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100": exec.status === 'executed',
                            "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100": exec.status === 'pending',
                            "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100": exec.status === 'failed',
                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100": exec.status === 'cancelled',
                        })}>
                           {exec.status}
                        </span>
                    </TableCell>
                    <TableCell>{exec.profit !== undefined ? `${exec.profit.toFixed(4)} ETH` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No execution history available.</p>}
        </CardContent>
      </Card>

      {/* Strategy Creation/Editing Dialog */}
      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStrategy?.id ? "Edit" : "Create"} MEV Strategy</DialogTitle>
            <DialogDescription>Define the parameters for your MEV strategy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="stratName">Strategy Name</Label>
              <Input id="stratName" value={currentStrategy?.name || ""} onChange={e => setCurrentStrategy(s => s ? {...s, name: e.target.value} : null)} />
            </div>
            <div>
              <Label htmlFor="stratType">Strategy Type</Label>
              <Select value={currentStrategy?.type || "arbitrage"} onValueChange={(value: typeof MEVStrategyTypes[number]) => setCurrentStrategy(s => s ? {...s, type: value} : null)}>
                <SelectTrigger id="stratType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEVStrategyTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="stratDesc">Description (Optional)</Label>
              <Textarea id="stratDesc" value={currentStrategy?.description || ""} onChange={e => setCurrentStrategy(s => s ? {...s, description: e.target.value} : null)} placeholder="Briefly describe the strategy" />
            </div>
            <div>
              <Label htmlFor="stratParams">Parameters (JSON)</Label>
              <Textarea id="stratParams" value={currentStrategy?.parameters ? JSON.stringify(currentStrategy.parameters, null, 2) : "{}"} 
                onChange={e => {
                    try {
                        const parsed = JSON.parse(e.target.value);
                        setCurrentStrategy(s => s ? {...s, parameters: parsed} : null);
                    } catch { /* Ignore parse error until save */ }
                }} 
                placeholder='{ "slippage": 0.01, "minProfit": 0.005 }'
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStrategyDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveStrategy} disabled={isSavingStrategy}>
              {isSavingStrategy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opportunity Execution Dialog */}
        <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Execute MEV Opportunity</DialogTitle>
                    <DialogDescription>
                        Select a strategy to execute for opportunity: {selectedOpportunity?.type} (Profit: {selectedOpportunity?.profit.toFixed(4)} ETH)
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="execStrategy">Select Strategy</Label>
                    <Select value={strategyForExecution} onValueChange={setStrategyForExecution}>
                        <SelectTrigger id="execStrategy"><SelectValue placeholder="Choose an enabled strategy" /></SelectTrigger>
                        <SelectContent>
                            {strategies.filter(s => s.enabled).map(strat => (
                                <SelectItem key={strat.id} value={strat.id}>{strat.name} ({strat.type})</SelectItem>
                            ))}
                            {strategies.filter(s=>s.enabled).length === 0 && <SelectItem value="" disabled>No enabled strategies</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>Cancel</Button>
                    <Button onClick={handleExecute} disabled={isExecuting || !strategyForExecution || strategies.filter(s=>s.enabled).length === 0}>
                        {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Execute
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
         <CardFooter>
            <p className="text-xs text-muted-foreground">MEV Operations data is simulated. Real-time updates via WebSockets.</p>
        </CardFooter>
    </div>
  );
}
