
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Temporarily disabled
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DateRangePicker } from "@/components/ui/date-range-picker"; // Temporarily disabled
// import type { DateRange } from "react-day-picker"; // Temporarily disabled
import { Loader2, FileText, AlertTriangle, ServerCrash, PlusCircle, Trash2, Download, Eye, ListFilter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  fetchReportTemplates,
  fetchRecentReports,
  generateReport,
  fetchReportDetails,
  deleteReport,
  downloadReportFile
} from '@/services/reportsService';
import type { SecurityReport, ReportTemplate } from '@/types/apiSpec';

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<SecurityReport[]>([]);
  
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Form states for generating report
  const [reportTitle, setReportTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date} | undefined>();

  // View Details Dialog
  const [selectedReportDetails, setSelectedReportDetails] = useState<SecurityReport | null>(null);
  const [isLoadingReportDetails, setIsLoadingReportDetails] = useState(false);

  const loadInitialData = useCallback(async () => {
    setIsLoadingTemplates(true);
    setIsLoadingReports(true);
    setError(null);
    try {
      const [fetchedTemplates, fetchedReports] = await Promise.all([
        fetchReportTemplates(),
        fetchRecentReports()
      ]);
      setTemplates(fetchedTemplates);
      setReports(fetchedReports);
      if (fetchedTemplates.length === 0) {
        toast.info("No report templates available from backend.");
      }
      if (fetchedReports.length === 0) {
        toast.info("No recent reports found.");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to load reports data.";
      setError(msg);
      toast.error("Data Load Error", { description: msg });
    } finally {
      setIsLoadingTemplates(false);
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  



  const handleGenerateReport = async () => {
    if (!reportTitle || !selectedTemplateId) {
      toast.error("Report title and template are required.");
      return;
    }
    setIsGeneratingReport(true);
    setError(null);
    try {
      const newReport = await generateReport(reportTitle, selectedTemplateId, dateRange?.from, dateRange?.to);
      setReports(prev => [newReport, ...prev]);
      toast.success(`Report "${newReport.title}" generation started.`);
      // Reset form
      setReportTitle(""); setSelectedTemplateId(""); setDateRange(undefined);
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
      toast.error("Report Generation Error", { description: err.message || "Failed to generate report." });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleViewDetails = async (reportId: string) => {
    setIsLoadingReportDetails(true);
    setSelectedReportDetails(null);
    try {
        const details = await fetchReportDetails(reportId);
        setSelectedReportDetails(details);
    } catch (err: any) {
        toast.error("Fetch Details Error", { description: err.message || "Failed to fetch report details." });
    } finally {
        setIsLoadingReportDetails(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    toast.info(`Deleting report ${reportId}...`);
    try {
      await deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success(`Report ${reportId} deleted.`);
    } catch (err: any) {
      toast.error("Delete Failed", { description: err.message || "Failed to delete report." });
    }
  };

  const handleDownload = async (report: SecurityReport) => {
    toast.info(`Preparing download for "${report.title}"...`);
    try {
        const blob = await downloadReportFile(report.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}_${report.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`Report "${report.title}" downloaded.`);
    } catch (err: any) {
        toast.error("Download Failed", { description: err.message || "Could not download the report file." });
    }
  };

  if (isLoadingTemplates && isLoadingReports && !error) { // Initial full load
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Reports Dashboard...</p>
      </div>
    );
  }
  
  if (error && templates.length === 0 && reports.length === 0) {
     return (
      <div className="text-center text-destructive py-8">
        <ServerCrash size={48} className="mx-auto mb-4" />
        <p className="text-lg font-semibold">Error Loading Reports Module</p>
        <p>{error}</p>
        <Button onClick={loadInitialData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle /> Generate New Report</CardTitle>
          <CardDescription>Create a custom report based on selected templates and date ranges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Report Title" value={reportTitle} onChange={e => setReportTitle(e.target.value)} disabled={isGeneratingReport} />
          <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId} disabled={isGeneratingReport || isLoadingTemplates}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select Report Template"} />
            </SelectTrigger>
            <SelectContent>
              {templates.length > 0 ? templates.map(template => (
                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
              )) : <SelectItem value="no-templates" disabled>No templates available</SelectItem>}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input 
              type="date" 
              placeholder="Start Date" 
              onChange={e => {
                if (e.target.value) {
                  const date = new Date(e.target.value);
                  setDateRange(prev => ({...prev, from: date}));
                } else {
                  setDateRange(prev => ({...prev, from: undefined}));
                }
              }}
              disabled={isGeneratingReport} 
            />
            <Input 
              type="date" 
              placeholder="End Date" 
              onChange={e => {
                if (e.target.value) {
                  const date = new Date(e.target.value);
                  setDateRange(prev => ({...prev, to: date}));
                } else {
                  setDateRange(prev => ({...prev, to: undefined}));
                }
              }}
              disabled={isGeneratingReport} 
            />
          </div>
          <Button onClick={handleGenerateReport} disabled={isGeneratingReport || !reportTitle || !selectedTemplateId} className="w-full">
            {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} Generate Report
          </Button>
          {error && !isGeneratingReport && <p className="text-sm text-destructive pt-2">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListFilter /> Recent Reports</CardTitle>
          <CardDescription>View and manage your generated reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReports && !reports.length ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> : (
            reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Date Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{templates.find(t => t.id === report.templateUsed)?.name || report.templateUsed || 'N/A'}</TableCell>
                      <TableCell>{report.generatedAt ? format(new Date(report.generatedAt), "PPpp") : 'N/A'}</TableCell>
                      <TableCell>
                         <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                            report.status === 'Generating' || report.status === 'Queued' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100' :
                            report.status === 'Failed' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}>
                            {report.status} { (report.status === 'Generating' || report.status === 'Queued') && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
                        </span>
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(report.id)} disabled={report.status !== 'Completed'}><Eye className="h-4 w-4"/></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(report)} disabled={report.status !== 'Completed'}><Download className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No reports generated yet. Create one above.</p>
          )}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">Report generation and content are processed by the backend API.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
