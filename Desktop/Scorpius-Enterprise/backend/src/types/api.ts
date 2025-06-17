export interface ReplayJob {
  id: string;
  target: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt?: string;
  resultUrl?: string;
}

export interface MempoolSession {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt?: string;
  transactionCount?: number;
}

export interface MevBundle {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt?: string;
  profit?: number;
  gasUsed?: number;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  status: 'completed' | 'generating' | 'failed';
  downloadUrl?: string;
}

export interface ReportDetails extends Report {
  summary?: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  findings?: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
}

export interface SecurityReport {
  id: string;
  title: string;
  templateUsed?: string;
  generatedAt: string;
  status: 'Queued' | 'Completed' | 'Failed';
  period?: {
    start: string;
    end: string;
  };
  details?: any;
}
