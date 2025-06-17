// src/services/timeMachineService.ts
import { API_BASE_URL } from '@/config/api';
import type { HistoricalData, ForkConfig, TimelineEvent } from '@/types/apiSpec';

export async function fetchHistoricalData(query: string, type: 'block' | 'transaction' | 'contract_history'): Promise<HistoricalData> {
  const response = await fetch(`${API_BASE_URL}/time-machine/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      type
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch historical data: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    type,
    query,
    details: data.details || {}
  };
}

export async function fetchActiveForks(): Promise<ForkConfig[]> {
  const response = await fetch(`${API_BASE_URL}/time-machine/forks`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch active forks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.forks || [];
}

export async function createFork(forkName: string, blockNumber: number): Promise<ForkConfig> {
  const response = await fetch(`${API_BASE_URL}/time-machine/fork`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: forkName,
      block_number: blockNumber
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create fork: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.fork_id,
    name: data.name,
    blockNumber: data.block_number,
    status: data.status || 'active',
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export async function analyzeTimeline(startDate: Date, endDate: Date): Promise<TimelineEvent[]> {
  const response = await fetch(`${API_BASE_URL}/time-machine/timeline/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze timeline: ${response.statusText}`);
  }

  const data = await response.json();
  return data.events || [];
}
