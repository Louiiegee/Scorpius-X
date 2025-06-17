
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Loader2, History, AlertTriangle, ServerCrash, GitFork, CalendarDays, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchHistoricalData, fetchActiveForks, createFork, analyzeTimeline } from '@/services/timeMachineService';
import type { HistoricalData, ForkConfig, TimelineEvent } from '@/types/apiSpec';

type QueryType = 'block' | 'transaction' | 'contract_history';

export default function TimeMachinePage() {
  // Historical Data States
  const [queryInput, setQueryInput] = useState("");
  const [queryType, setQueryType] = useState<QueryType>("transaction");
  const [historicalDataResult, setHistoricalDataResult] = useState<HistoricalData | null>(null);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // Forking States
  const [forkName, setForkName] = useState("");
  const [forkBlockNumber, setForkBlockNumber] = useState("");
  const [activeForks, setActiveForks] = useState<ForkConfig[]>([]);
  const [isLoadingForks, setIsLoadingForks] = useState(false);
  const [isCreatingFork, setIsCreatingFork] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  // Timeline Analysis States
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  
  // Initial fetch for active forks
  React.useEffect(() => {
    const loadActiveForks = async () => {
      setIsLoadingForks(true);
      setForkError(null);
      try {
        const forks = await fetchActiveForks();
        setActiveForks(forks);
      } catch (err: any) {
        setForkError(err.message || "Failed to load active forks.");
        toast.error("Fork Error", { description: err.message || "Failed to load active forks."});
      } finally {
        setIsLoadingForks(false);
      }
    };
    loadActiveForks();
  }, []);


  const handleFetchHistoricalData = async () => {
    if (!queryInput) {
      toast.error("Query input cannot be empty.");
      return;
    }
    setIsLoadingHistorical(true);
    setHistoricalDataResult(null);
    setHistoricalError(null);
    toast.info(`Fetching historical data for ${queryType}: ${queryInput}`);
    try {
      const result = await fetchHistoricalData(queryInput, queryType);
      setHistoricalDataResult(result);
      toast.success("Historical data fetched.");
    } catch (err: any) {
      setHistoricalError(err.message || "Failed to fetch historical data.");
      toast.error("Fetch Error", { description: err.message || "Failed to fetch historical data."});
    } finally {
      setIsLoadingHistorical(false);
    }
  };

  const handleCreateFork = async () => {
    if (!forkName || !forkBlockNumber) {
        toast.error("Fork name and block number are required.");
        return;
    }
    const blockNum = parseInt(forkBlockNumber, 10);
    if (isNaN(blockNum) || blockNum <= 0) {
        toast.error("Invalid block number.");
        return;
    }
    setIsCreatingFork(true);
    setForkError(null);
    toast.info(`Creating fork "${forkName}" from block ${blockNum}`);
    try {
      const newFork = await createFork(forkName, blockNum);
      setActiveForks(prev => [...prev, newFork]);
      toast.success(`Fork "${newFork.name}" created successfully.`);
      setForkName("");
      setForkBlockNumber("");
    } catch (err: any) {
      setForkError(err.message || "Failed to create fork.");
      toast.error("Fork Creation Error", { description: err.message || "Failed to create fork."});
    } finally {
      setIsCreatingFork(false);
    }
  };
  
  const handleAnalyzeTimeline = async () => {
    if (!startDate || !endDate) {
        toast.error("Start date and end date are required for timeline analysis.");
        return;
    }
    if (endDate < startDate) {
        toast.error("End date cannot be earlier than start date.");
        return;
    }
    setIsLoadingTimeline(true);
    setTimelineEvents([]);
    setTimelineError(null);
    toast.info(`Analyzing timeline from ${format(startDate, "PPP")} to ${format(endDate, "PPP")}`);
    try {
      const events = await analyzeTimeline(startDate, endDate);
      setTimelineEvents(events);
      if (events.length === 0) {
        toast.success("Timeline analysis complete. No specific events found in this period.");
      } else {
        toast.success(`Timeline analysis complete. Found ${events.length} events.`);
      }
    } catch (err: any) {
      setTimelineError(err.message || "Failed to analyze timeline.");
      toast.error("Timeline Analysis Error", { description: err.message || "Failed to analyze timeline."});
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search /> Query Historical Data</CardTitle>
          <CardDescription>Fetch details about past blocks, transactions, or contract history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={queryType} onValueChange={(value: QueryType) => setQueryType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transaction">Transaction Hash</SelectItem>
                <SelectItem value="block">Block Number</SelectItem>
                <SelectItem value="contract_history">Contract Address</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={queryType === 'block' ? "Enter block number..." : (queryType === 'transaction' ? "Enter transaction hash..." : "Enter contract address...")}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              disabled={isLoadingHistorical}
              className="flex-grow"
            />
            <Button onClick={handleFetchHistoricalData} disabled={isLoadingHistorical || !queryInput} className="w-full sm:w-auto">
              {isLoadingHistorical ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Fetch Data
            </Button>
          </div>
          {isLoadingHistorical && <p className="text-sm text-muted-foreground">Fetching data from the archives...</p>}
          {historicalError && <p className="text-sm text-destructive">{historicalError}</p>}
          {historicalDataResult && (
            <div className="mt-4 p-4 border rounded-md bg-muted/20">
              <h4 className="font-semibold">{`Results for ${historicalDataResult.type}: ${historicalDataResult.query}`}</h4>
              {Object.keys(historicalDataResult.details).length > 0 ? (
                <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(historicalDataResult.details, null, 2)}</pre>
              ): (
                <p className="text-sm text-muted-foreground">No specific details returned from backend for this query.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitFork /> Blockchain Forking</CardTitle>
            <CardDescription>Create and manage blockchain forks for isolated simulations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Fork Name (e.g., MyTestFork)" value={forkName} onChange={(e) => setForkName(e.target.value)} disabled={isCreatingFork} />
              <Input type="number" placeholder="Block Number to Fork From" value={forkBlockNumber} onChange={(e) => setForkBlockNumber(e.target.value)} disabled={isCreatingFork} />
              <Button onClick={handleCreateFork} disabled={isCreatingFork || !forkName || !forkBlockNumber} className="w-full">
                {isCreatingFork ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitFork className="mr-2 h-4 w-4" />}
                Create Fork
              </Button>
            </div>
            {forkError && <p className="text-sm text-destructive">{forkError}</p>}
             <h4 className="text-md font-semibold pt-4">Active Forks</h4>
            {isLoadingForks && <p className="text-sm text-muted-foreground">Loading active forks...</p>}
            {activeForks.length > 0 ? (
              <ul className="space-y-1 text-sm list-disc list-inside">
                {activeForks.map(fork => <li key={fork.id}>{fork.name || `Fork@${fork.blockNumber}`} ({fork.status})</li>)}
              </ul>
            ) : (
              !isLoadingForks && <p className="text-sm text-muted-foreground">No active forks. Create one to begin.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays /> Timeline Analysis</CardTitle>
            <CardDescription>Analyze security events over a specific period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                type="date" 
                placeholder="Start Date" 
                onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                disabled={isLoadingTimeline} 
              />
              <Input 
                type="date" 
                placeholder="End Date" 
                onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                disabled={isLoadingTimeline} 
              />
            </div>
            <Button onClick={handleAnalyzeTimeline} disabled={isLoadingTimeline || !startDate || !endDate} className="w-full">
              {isLoadingTimeline ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
              Analyze Timeline
            </Button>
            {timelineError && <p className="text-sm text-destructive">{timelineError}</p>}
            {isLoadingTimeline && <p className="text-sm text-muted-foreground">Analyzing historical events...</p>}
            {timelineEvents.length > 0 ? (
                <div className="mt-4 max-h-60 overflow-y-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Event</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {timelineEvents.map(event => (
                        <TableRow key={event.transactionHash || event.timestamp}>
                        <TableCell className="text-xs">{format(new Date(event.timestamp), "PPpp")}</TableCell>
                        <TableCell className="text-xs">{event.event}</TableCell>
                        <TableCell className="text-xs capitalize">{event.severity}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            ) : (
                !isLoadingTimeline && !timelineError && startDate && endDate && <p className="text-sm text-muted-foreground">No specific events found for the selected period.</p>
            )}
          </CardContent>
        </Card>
      </div>
       <CardFooter className="mt-4">
        <p className="text-xs text-muted-foreground">Time Machine operations are processed by the backend API.</p>
      </CardFooter>
    </div>
  );
}
