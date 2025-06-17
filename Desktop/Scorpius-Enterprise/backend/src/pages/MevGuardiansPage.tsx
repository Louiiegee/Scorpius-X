// src/pages/MevGuardiansPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, ListChecks, BellRing, ServerCrash, Eye, Cog } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchGuardians, fetchProtectionStrategies, fetchGuardianAlerts, acknowledgeGuardianAlert } from '@/services/mevGuardiansService';
import { connectWebSocket, disconnectWebSocket } from '@/services/websocketService';
import type { Guardian, ProtectionStrategy, GuardianAlert, WebSocketMessageBase } from '@/types/apiSpec';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";


export default function MevGuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [strategies, setStrategies] = useState<ProtectionStrategy[]>([]);
  const [alerts, setAlerts] = useState<GuardianAlert[]>([]);

  const [isLoading, setIsLoading] = useState({ guardians: false, strategies: false, alerts: false });
  const [error, setError] = useState<string | null>(null);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<GuardianAlert | null>(null);


  const loadAllData = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, guardians: true, strategies: true, alerts: true }));
    setError(null);
    try {
      const [fetchedGuardians, fetchedStrategies, fetchedAlerts] = await Promise.all([
        fetchGuardians(), fetchProtectionStrategies(), fetchGuardianAlerts()
      ]);
      setGuardians(fetchedGuardians);
      setStrategies(fetchedStrategies);
      setAlerts(fetchedAlerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); // Sort newest first
    } catch (err: any) {
      setError(err.message || "Failed to load MEV Guardians data.");
      toast.error("Data Load Error", { description: err.message || "Failed to load MEV Guardians data." });
    } finally {
      setIsLoading(prev => ({ ...prev, guardians: false, strategies: false, alerts: false }));
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // WebSocket Integration for Guardians
   const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    const message = JSON.parse(event.data) as WebSocketMessageBase;
    switch (message.type) {
      case 'GUARDIAN_STATUS':
        const updatedGuardian = message.payload as Guardian;
        setGuardians(prev => prev.map(g => g.id === updatedGuardian.id ? updatedGuardian : g));
        break;
      case 'GUARDIAN_ALERTS':
        const newAlert = message.payload as GuardianAlert;
        setAlerts(prev => [newAlert, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        toast.warning(`New Guardian Alert: ${newAlert.message}`, { duration: 10000 });
        break;
      default:
        console.log("MEV Guardians WS - Unhandled message type:", message.type);
    }
  }, []);

  useEffect(() => {
    const wsEndpoints = [ `ws/guardians/status`, `ws/guardians/alerts` ];
    wsEndpoints.forEach(url => connectWebSocket(url, handleWebSocketMessage,
        () => console.log(`MEV Guardians WS connected to ${url}`),
        (err) => console.error(`MEV Guardians WS error ${url}:`, err)
    ));
    return () => {
        wsEndpoints.forEach(url => disconnectWebSocket(url));
    };
  }, [handleWebSocketMessage]);


  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const updatedAlert = await acknowledgeGuardianAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
      toast.success(`Alert ${alertId} acknowledged.`);
    } catch (err: any) {
      toast.error("Acknowledge Failed", { description: err.message });
    }
  };
  
  const handleViewAlertDetails = (alert: GuardianAlert) => {
    setSelectedAlertDetails(alert);
  };


  if (isLoading.guardians && isLoading.strategies && isLoading.alerts && !error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading MEV Guardians Dashboard...</p>
      </div>
    );
  }

  if (error && guardians.length === 0 && strategies.length === 0 && alerts.length === 0) {
     return (
      <div className="text-center text-destructive py-8">
        <ServerCrash size={48} className="mx-auto mb-4" />
        <p className="text-lg font-semibold">Error Loading MEV Guardians Module</p>
        <p>{error}</p>
        <Button onClick={loadAllData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck /> MEV Guardians</h2>
      
      {/* Guardians Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks /> Configured Guardians</CardTitle>
          <CardDescription>Monitor the status and configuration of your MEV protection guardians.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading.guardians ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : guardians.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Protected Contracts</TableHead></TableRow></TableHeader>
              <TableBody>
                {guardians.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="capitalize">{g.type.replace('_', ' ')}</TableCell>
                    <TableCell>
                       <span className={cn("px-2 py-1 text-xs rounded-full", {
                            "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100": g.status === 'active',
                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100": g.status === 'inactive',
                            "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100": g.status === 'error',
                        })}>
                           {g.status}
                        </span>
                    </TableCell>
                    <TableCell>{g.protectedContracts.length > 0 ? g.protectedContracts.join(', ') : 'All (Default)'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No guardians configured.</p>}
        </CardContent>
      </Card>

      {/* Protection Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cog className="h-5 w-5"/> Protection Strategies</CardTitle>
          <CardDescription>Manage automated strategies to defend against MEV attacks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading.strategies ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : strategies.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Enabled</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {strategies.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="capitalize">{s.type.replace('_', ' ')}</TableCell>
                    <TableCell>{s.enabled ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No protection strategies available.</p>}
        </CardContent>
      </Card>

      {/* Live Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing /> Live Guardian Alerts</CardTitle>
          <CardDescription>Real-time alerts from your MEV protection system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading.alerts && alerts.length === 0 ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : alerts.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Severity</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {alerts.slice(0, 15).map(alert => ( // Show latest 15 alerts
                  <TableRow key={alert.id}>
                    <TableCell className="text-xs">{format(new Date(alert.timestamp), "PPpp")}</TableCell>
                    <TableCell>
                         <span className={cn("px-2 py-1 text-xs rounded-full", {
                            "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100": alert.severity === 'critical',
                            "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100": alert.severity === 'warning',
                            "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100": alert.severity === 'info',
                        })}>
                           {alert.severity}
                        </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-md truncate" title={alert.message}>{alert.message}</TableCell>
                    <TableCell className="capitalize">{alert.status}</TableCell>
                    <TableCell className="space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="xs" onClick={() => handleViewAlertDetails(alert)}><Eye className="h-3 w-3"/></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Alert Details</DialogTitle></DialogHeader>
                          {selectedAlertDetails ? (
                            <div className="text-sm space-y-2 py-2">
                              <p><strong>ID:</strong> {selectedAlertDetails.id}</p>
                              <p><strong>Timestamp:</strong> {format(new Date(selectedAlertDetails.timestamp), "PPpp")}</p>
                              <p><strong>Severity:</strong> <span className="capitalize">{selectedAlertDetails.severity}</span></p>
                              <p><strong>Message:</strong> {selectedAlertDetails.message}</p>
                              {selectedAlertDetails.transactionHash && <p><strong>Transaction:</strong> {selectedAlertDetails.transactionHash}</p>}
                              {selectedAlertDetails.details && <pre className="mt-2 w-full rounded-md bg-muted p-2 overflow-auto max-h-[40vh] text-xs">{JSON.stringify(selectedAlertDetails.details, null, 2)}</pre>}
                            </div>
                          ) : <Loader2 className="h-5 w-5 animate-spin"/>}
                           <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose></DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {alert.status === 'new' && 
                        <Button variant="default" size="xs" onClick={() => handleAcknowledgeAlert(alert.id)}>Ack</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No active alerts.</p>}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">Guardian data and alerts are simulated. Real-time updates via WebSockets.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
