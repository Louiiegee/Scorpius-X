// src/services/reportsService.ts
import { API_BASE_URL } from '@/config/api';
import type { SecurityReport, ReportTemplate, Report, ReportDetails } from '@/types/api';

// Fetch Report Templates
export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/reports/templates`);
  if (!response.ok) {
    throw new Error(`Failed to fetch report templates: ${response.statusText}`);
  }
  return response.json();
}

// Fetch Recent Reports
export async function fetchRecentReports(): Promise<SecurityReport[]> {
  const response = await fetch(`${API_BASE_URL}/reports/list`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent reports: ${response.statusText}`);
  }
  const data = await response.json();
  return data.reports || [];
}

// Generate a new Report
export async function generateReport(title: string, templateId: string, startDate?: Date, endDate?: Date): Promise<SecurityReport> {
  const response = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      template_id: templateId,
      date_from: startDate?.toISOString(),
      date_to: endDate?.toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate report: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.scan_id || data.id,
    title,
    templateUsed: 'security_audit',
    generatedAt: new Date().toISOString(),
    status: data.status === 'generating' ? 'Queued' : 'Completed',
    period: startDate && endDate ? { start: startDate.toISOString(), end: endDate.toISOString() } : undefined,
    details: { message: data.message || 'Report generated successfully' }
  };
}

// Fetch Report Details
export async function fetchReportDetails(reportId: string): Promise<SecurityReport> {
    const response = await fetch(`${API_BASE_URL}/reports/view/${reportId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch report details: ${response.statusText}`);
    }
    const data = await response.json();
    return {
        id: data.scan_id,
        title: `Security Report - ${data.contract_address.slice(0, 10)}...`,
        generatedAt: data.created_at,
        status: data.status === 'completed' ? 'Completed' : 'Queued',
        details: data
    };
}

// Delete a Report
export async function deleteReport(reportId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/reports/delete/${reportId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(`Failed to delete report: ${response.statusText}`);
    }
    const data = await response.json();
    return { success: data.status === 'deleted', message: data.message };
}

// Download Report
export async function downloadReportFile(reportId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/reports/download/${reportId}?format=pdf`);
    if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
    }
    return response.blob();
}
