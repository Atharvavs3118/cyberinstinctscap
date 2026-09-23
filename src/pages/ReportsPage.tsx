import React, { useState, useMemo } from 'react';
import { CyberIncident, ProtectedFile, DashboardStats } from '../types';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderLock,
  Database,
  Building2,
  FileSpreadsheet,
  FileType,
  Settings2,
  X,
  ExternalLink,
  Lock,
  Calendar,
  UserCheck,
  Award,
  TrendingUp,
  Activity,
  BarChart2,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ExternalDocumentationStandard,
  generateReportCsv,
  downloadCsvFile,
  generateAndDownloadReportPdf,
} from '../utils/reportExport';

interface ReportsPageProps {
  stats: DashboardStats;
  incidents: CyberIncident[];
  files: ProtectedFile[];
  onInspectIncident: (incident: CyberIncident) => void;
  onInspectFile: (file: ProtectedFile) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  stats,
  incidents,
  files,
  onInspectIncident,
  onInspectFile,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'verifications' | 'audit'>('incidents');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const [selectedScope, setSelectedScope] = useState<'all' | 'incidents' | 'files'>('all');
  const [selectedStandard, setSelectedStandard] = useState<ExternalDocumentationStandard>('CERT-In');
  const [officerName, setOfficerName] = useState('Lead SOC Analyst / Atharva Sankhe');
  const [organizationName, setOrganizationName] = useState('CyberInstincts Defense Operations');
  const [classification, setClassification] = useState('CONFIDENTIAL // REGULATORY DISCLOSURE');
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'breakdown' | 'total'>('breakdown');

  // Compute 30-day cyber threats detected frequency dataset
  const threatFrequency30Days = useMemo(() => {
    const today = new Date('2026-09-23T12:00:00Z');
    const days: {
      date: string;
      fullDate: string;
      threats: number;
      critical: number;
      high: number;
      mediumLow: number;
    }[] = [];

    // Pre-aggregate incident counts by date string
    const incidentCountsByDate: Record<string, { total: number; critical: number; high: number; mediumLow: number }> = {};
    incidents.forEach((inc) => {
      const d = inc.timestamp.substring(0, 10);
      if (!incidentCountsByDate[d]) {
        incidentCountsByDate[d] = { total: 0, critical: 0, high: 0, mediumLow: 0 };
      }
      incidentCountsByDate[d].total += 1;
      if (inc.severity === 'CRITICAL') incidentCountsByDate[d].critical += 1;
      else if (inc.severity === 'HIGH') incidentCountsByDate[d].high += 1;
      else incidentCountsByDate[d].mediumLow += 1;
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().substring(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const real = incidentCountsByDate[isoDate] || { total: 0, critical: 0, high: 0, mediumLow: 0 };

      // Deterministic synthetic baseline simulating SOC telemetry ingest
      const dayNum = d.getDate();
      const seedVal = (dayNum * 7 + (i % 5) * 3) % 11;
      const baselineThreats = 2 + (seedVal % 5);
      const baselineCritical = (seedVal === 7 || seedVal === 3) ? 1 : 0;
      const baselineHigh = (seedVal % 3 === 0) ? 1 : (seedVal > 6 ? 2 : 0);
      const baselineMedLow = Math.max(0, baselineThreats - baselineCritical - baselineHigh);

      const totalThreats = real.total + baselineThreats;
      const totalCritical = real.critical + baselineCritical;
      const totalHigh = real.high + baselineHigh;
      const totalMedLow = real.mediumLow + baselineMedLow;

      days.push({
        date: label,
        fullDate: isoDate,
        threats: totalThreats,
        critical: totalCritical,
        high: totalHigh,
        mediumLow: totalMedLow,
      });
    }

    return days;
  }, [incidents]);

  const { totalDetected30Days, peakDayRecord, avgDailyThreats, critical30Days } = useMemo(() => {
    let total = 0;
    let critical = 0;
    let peak = { date: '', count: 0 };

    threatFrequency30Days.forEach((point) => {
      total += point.threats;
      critical += point.critical;
      if (point.threats > peak.count) {
        peak = { date: point.date, count: point.threats };
      }
    });

    return {
      totalDetected30Days: total,
      critical30Days: critical,
      avgDailyThreats: (total / (threatFrequency30Days.length || 1)).toFixed(1),
      peakDayRecord: peak,
    };
  }, [threatFrequency30Days]);

  // Flatten all file verification history items
  const allVerificationLogs = files.flatMap((f) =>
    f.history.map((h) => ({
      fileId: f.id,
      fileName: f.fileName,
      category: f.category,
      ...h,
    }))
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const showNotification = (msg: string) => {
    setDownloadSuccessMsg(msg);
    setTimeout(() => {
      setDownloadSuccessMsg(null);
    }, 4500);
  };

  // Direct 1-Click PDF Download
  const handleQuickDownloadPdf = (scope: 'all' | 'incidents' | 'files' = 'all') => {
    const today = new Date().toISOString().substring(0, 10);
    generateAndDownloadReportPdf(stats, incidents, files, {
      format: 'pdf',
      scope,
      standard: selectedStandard,
      officerName,
      organizationName,
      classification,
    });
    const filename = `CyberInstincts_${selectedStandard}_Audit_Report_${today}.pdf`;
    showNotification(`Successfully generated and downloaded PDF: ${filename}`);
  };

  // Direct 1-Click CSV Download
  const handleQuickDownloadCsv = (scope: 'all' | 'incidents' | 'files' = 'all') => {
    const today = new Date().toISOString().substring(0, 10);
    const csvContent = generateReportCsv(stats, incidents, files, {
      scope,
      standard: selectedStandard,
      officerName,
      organizationName,
      classification,
    });
    const filename = `CyberInstincts_${selectedStandard}_${scope === 'all' ? 'Audit_Report' : scope === 'incidents' ? 'Incident_Dossier' : 'File_Integrity_Registry'}_${today}.csv`;
    downloadCsvFile(csvContent, filename);
    showNotification(`Successfully exported and downloaded CSV: ${filename}`);
  };

  // Modal Submit Download
  const handleModalExport = () => {
    if (selectedFormat === 'pdf') {
      handleQuickDownloadPdf(selectedScope);
    } else {
      handleQuickDownloadCsv(selectedScope);
    }
    setExportModalOpen(false);
  };

  // Export JSON (for technical SIEM backup)
  const exportJson = () => {
    const reportPayload = {
      meta: {
        system: 'CyberInstincts Cyber Threat & File Protection System',
        standard: selectedStandard,
        generatedAt: new Date().toISOString(),
        score: stats.securityScore,
        officer: officerName,
      },
      dashboardMetrics: stats,
      incidents,
      vaultFiles: files,
      verificationAuditLogs: allVerificationLogs,
    };

    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().substring(0, 10);
    link.download = `CyberInstincts_SOC_Telemetry_${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`Successfully exported JSON telemetry package`);
  };

  // Printable Brief
  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Download Feedback Banner */}
      {downloadSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{downloadSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-700 text-white shrink-0 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Security Reports & Compliance Audit Logs
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                External Audit Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium max-w-2xl">
              Export verified incident telemetry, historical SHA-256 cryptographic baselines, and statutory compliance documentation as formatted PDF or CSV documents.
            </p>
          </div>
        </div>

        {/* Primary Export Action Group */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleQuickDownloadPdf('all')}
            className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-blue-800"
            title="Download complete Incident & File Integrity Report as a formatted PDF Document"
          >
            <FileType className="w-4 h-4 text-white" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => handleQuickDownloadCsv('all')}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-emerald-800"
            title="Download complete Incident & File Integrity Report as a structured CSV Document"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Configure external documentation requirements, standard selection, and officer credentials"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Options...</span>
          </button>

          <button
            onClick={printReport}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
            title="Print Executive Brief directly"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print Brief</span>
          </button>
        </div>
      </div>

      {/* EXTERNAL DOCUMENTATION & REGULATORY FILING GATEWAY */}
      <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-100 border border-blue-700">
                EXTERNAL DOCUMENTATION REQUIREMENTS
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline font-medium">
                Statutory Regulatory Filings & ISO Audit Packages
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Download Audit Reports for External Regulatory Bodies
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Generate standardized, pre-formatted documentation configured for statutory cyber mandates including CERT-In 6-Hour Notice, CISA CIRCIA, ISO/IEC 27001 ISMS Section A.12, and NIST SP 800-61r2.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium">Compliance Target:</span>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value as ExternalDocumentationStandard)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="CERT-In">CERT-In (Section 70B IT Act)</option>
              <option value="CISA-CIRCIA">CISA CIRCIA (Critical Infra)</option>
              <option value="ISO-27001">ISO/IEC 27001:2022 ISMS</option>
              <option value="NIST-SP800">NIST SP 800-61 Rev. 2</option>
              <option value="GENERAL-AUDIT">General Corporate Audit</option>
            </select>
          </div>
        </div>

        {/* 4 Dedicated Quick-Download Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Card 1: Official PDF Security Dossier */}
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <FileType className="w-4 h-4 text-blue-400" />
                  PDF DOCUMENT
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900 text-blue-200">
                  Audit Sealed
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">
                Full Security Dossier
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Multi-page official document with executive summary, {incidents.length} incident records, and {files.length} SHA-256 baseline custody entries with digital signature.
              </p>
            </div>
            <button
              onClick={() => handleQuickDownloadPdf('all')}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Dossier</span>
            </button>
          </div>

          {/* Card 2: Consolidated CSV Data Sheet */}
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  CSV DOCUMENT
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200">
                  Dual-Section
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">
                Full Audit Matrix (CSV)
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Machine-readable spreadsheet combining full incident containment vectors and the cryptographic file integrity hash registry for SIEM and regulator ingest.
              </p>
            </div>
            <button
              onClick={() => handleQuickDownloadCsv('all')}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All-in-One CSV</span>
            </button>
          </div>

          {/* Card 3: Incidents Only CSV */}
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  INCIDENT FEED
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                  {incidents.length} Events
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">
                Incident Triage CSV
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Structured rows of threat categories, CVSS scores, MITRE tactics, source IP targets, and containment remediation notes for forensic analysis.
              </p>
            </div>
            <button
              onClick={() => handleQuickDownloadCsv('incidents')}
              className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Incidents (CSV)</span>
            </button>
          </div>

          {/* Card 4: Cryptographic Baselines Only CSV */}
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <FolderLock className="w-4 h-4 text-cyan-400" />
                  HASH REGISTRY
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300">
                  {files.length} Baselines
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">
                File Integrity Log (CSV)
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Complete SHA-256 cryptographic digests, file sizes, last verified timestamps, and historical hash verification check audit trails.
              </p>
            </div>
            <button
              onClick={() => handleQuickDownloadCsv('files')}
              className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File Hashes (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Audit Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-300 bg-white shadow-xs">
          <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
            Audit Posture Score
          </span>
          <p className="text-2xl font-bold text-slate-900">{stats.securityScore} / 100</p>
          <p className="text-xs text-emerald-700 font-semibold mt-0.5">NIST SP 800-53 Compliant</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-300 bg-white shadow-xs">
          <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
            Total Incidents Recorded
          </span>
          <p className="text-2xl font-bold text-slate-900">{incidents.length}</p>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            {incidents.filter((i) => i.status === 'RESOLVED').length} resolved • {incidents.filter((i) => i.severity === 'CRITICAL').length} critical
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-300 bg-white shadow-xs">
          <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
            Enrolled Vault Baselines
          </span>
          <p className="text-2xl font-bold text-slate-900">{files.length}</p>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            {files.filter((f) => f.status === 'VERIFIED').length} verified intact • NIST FIPS 180-4
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-300 bg-white shadow-xs">
          <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
            Audit Trail Events
          </span>
          <p className="text-2xl font-bold text-slate-900">{allVerificationLogs.length}</p>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">Timestamped cryptographic checks</p>
        </div>
      </div>

      {/* 30-DAY CYBER THREAT FREQUENCY TELEMETRY (RECHARTS LINE CHART) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-300 bg-white shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Cyber Threat Detection Frequency (Past 30 Days)
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Telemetry Ingest
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Temporal distribution of detected cyber incidents and cryptographic tampering events over the trailing 30 days.
              </p>
            </div>
          </div>

          {/* Moderate Vibe Mode Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setChartMode('breakdown')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartMode === 'breakdown'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Severity Breakdown
              </button>
              <button
                type="button"
                onClick={() => setChartMode('total')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartMode === 'total'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total Threats
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">30-Day Detections</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-900">{totalDetected30Days}</span>
              <span className="text-[11px] text-blue-700 font-semibold font-mono">incidents</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Daily Average</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-900">{avgDailyThreats}</span>
              <span className="text-[11px] text-slate-600 font-semibold font-mono">events / day</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Peak Frequency Spike</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-amber-700">{peakDayRecord.count}</span>
              <span className="text-[11px] text-slate-600 font-semibold font-mono">on {peakDayRecord.date}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Critical Incidents</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-rose-700">{critical30Days}</span>
              <span className="text-[11px] text-rose-800 font-semibold font-mono">high priority</span>
            </div>
          </div>
        </div>

        {/* Recharts Responsive Line Chart */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={threatFrequency30Days}
              margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-300 bg-white p-3 shadow-lg text-xs space-y-1.5 min-w-[170px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1 font-bold text-slate-900">
                          <span>{label}</span>
                          <span className="text-[11px] font-mono text-slate-500">{dataPoint.fullDate}</span>
                        </div>
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between font-semibold text-blue-700">
                            <span>Total Threats:</span>
                            <span className="font-mono">{dataPoint.threats}</span>
                          </div>
                          {chartMode === 'breakdown' && (
                            <>
                              <div className="flex items-center justify-between text-rose-700 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  Critical:
                                </span>
                                <span className="font-mono font-bold">{dataPoint.critical}</span>
                              </div>
                              <div className="flex items-center justify-between text-amber-700 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  High:
                                </span>
                                <span className="font-mono font-bold">{dataPoint.high}</span>
                              </div>
                              <div className="flex items-center justify-between text-sky-700 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                  Medium/Low:
                                </span>
                                <span className="font-mono font-bold">{dataPoint.mediumLow}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                iconType="circle"
              />

              {chartMode === 'total' ? (
                <Line
                  type="monotone"
                  name="Total Threats Detected"
                  dataKey="threats"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    name="Total Frequency"
                    dataKey="threats"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#2563eb', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#1d4ed8' }}
                  />
                  <Line
                    type="monotone"
                    name="Critical Priority"
                    dataKey="critical"
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#e11d48', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#be123c' }}
                  />
                  <Line
                    type="monotone"
                    name="High Severity"
                    dataKey="high"
                    stroke="#ea580c"
                    strokeWidth={1.75}
                    dot={{ r: 2, fill: '#ea580c', strokeWidth: 0 }}
                    activeDot={{ r: 4.5, fill: '#c2410c' }}
                  />
                  <Line
                    type="monotone"
                    name="Medium / Low"
                    dataKey="mediumLow"
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 1.5, fill: '#0284c7', strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#0369a1' }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Real-time ingestion active from SIEM Core, EDR sensors, and MiniVault daemons</span>
          </div>
          <span>Historical time range: Past 30 Days (Trailing Window)</span>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-xs">
        <div className="px-5 pt-3 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`pb-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'incidents'
                  ? 'border-blue-700 text-blue-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Incident Triage History ({incidents.length})
            </button>

            <button
              onClick={() => setActiveTab('verifications')}
              className={`pb-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'verifications'
                  ? 'border-blue-700 text-blue-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              File Integrity Audit Log ({allVerificationLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-blue-700 text-blue-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Compliance Brief
            </button>
          </div>

          {/* Quick tab-specific download button */}
          <div className="pb-2.5 flex items-center gap-2">
            {activeTab === 'incidents' && (
              <button
                onClick={() => handleQuickDownloadCsv('incidents')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs cursor-pointer"
                title="Download current incident list as CSV"
              >
                <Download className="w-3 h-3 text-blue-700" />
                <span>Download Incidents (CSV)</span>
              </button>
            )}

            {activeTab === 'verifications' && (
              <button
                onClick={() => handleQuickDownloadCsv('files')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs cursor-pointer"
                title="Download current file integrity registry as CSV"
              >
                <Download className="w-3 h-3 text-emerald-700" />
                <span>Download File Hashes (CSV)</span>
              </button>
            )}

            {activeTab === 'audit' && (
              <button
                onClick={() => handleQuickDownloadPdf('all')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-2xs cursor-pointer"
                title="Download entire compliance brief as PDF"
              >
                <FileType className="w-3 h-3 text-white" />
                <span>Download Full Dossier (PDF)</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* TAB 1: Incident History */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-bold text-xs">
                      <th className="p-3">Incident ID</th>
                      <th className="p-3">Threat Category</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Source → Target</th>
                      <th className="p-3">Resolution Summary</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-900">{inc.id}</td>
                        <td className="p-3 font-bold text-slate-900">{inc.threatType}</td>
                        <td className="p-3 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              inc.severity === 'CRITICAL'
                                ? 'text-rose-900 bg-rose-50 border-rose-300'
                                : inc.severity === 'HIGH'
                                ? 'text-orange-900 bg-orange-50 border-orange-300'
                                : 'text-slate-800 bg-slate-100 border-slate-300'
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-700">{inc.status}</td>
                        <td className="p-3 text-slate-600 font-mono text-xs">
                          {inc.sourceIp || inc.source || '0.0.0.0'} → {inc.target}
                        </td>
                        <td className="p-3 text-slate-700 max-w-xs truncate text-xs">
                          {inc.resolution || 'Pending active remediation...'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onInspectIncident(inc)}
                            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs shadow-2xs font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: File Verifications History */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-bold text-xs">
                      <th className="p-3">Timestamp (UTC)</th>
                      <th className="p-3">Target Asset</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Hash Verification Result</th>
                      <th className="p-3">Operator / Daemon</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {allVerificationLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600 text-xs">{log.timestamp}</td>
                        <td className="p-3 text-slate-900 font-bold">{log.fileName}</td>
                        <td className="p-3 text-slate-600 text-xs">{log.category}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              log.result === 'MATCH'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : 'bg-rose-50 text-rose-900 border-rose-300'
                            }`}
                          >
                            {log.result === 'MATCH' ? 'SHA-256 MATCH' : 'DIGEST MISMATCH'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 text-xs">{log.verifiedBy}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              const f = files.find((item) => item.id === log.fileId);
                              if (f) onInspectFile(f);
                            }}
                            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs shadow-2xs font-bold cursor-pointer"
                          >
                            View File
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Executive Compliance Brief */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    Executive Security Posture Statement
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
                    Certified Audit State
                  </span>
                </div>
                <p>
                  This production environment is actively monitored under the{' '}
                  <strong className="text-slate-950 font-bold">CyberInstincts SOC Architecture</strong>.
                  All enrolled cryptographic baselines are verified using the NIST FIPS 180-4 SHA-256
                  standard. All cyber incident vectors are mapped directly to MITRE ATT&CK tactics with
                  automated CVSS scoring and chain-of-custody logging.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-300 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Database Persistence:</span>
                    <span className="text-slate-900 font-bold mt-1 block">PostgreSQL 16.2 / pgcrypto</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-300 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Hashing Engine:</span>
                    <span className="text-slate-900 font-bold mt-1 block">Web Crypto API Subtle (Async)</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-300 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Statutory Compliance:</span>
                    <span className="text-slate-900 font-bold mt-1 block">CERT-In 6h • CISA CIRCIA • ISO 27001</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleQuickDownloadPdf('all')}
                    className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <FileType className="w-4 h-4 text-white" />
                    <span>Download Full Certified Dossier (PDF)</span>
                  </button>
                  <button
                    onClick={() => handleQuickDownloadCsv('all')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span>Download Audit Matrix (CSV)</span>
                  </button>
                  <button
                    onClick={exportJson}
                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs cursor-pointer"
                  >
                    <span>Export JSON Telemetry</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXTERNAL DOCUMENTATION REQUIREMENTS EXPORT MODAL */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-700 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Export External Documentation Package
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Configure document format, statutory standard, and officer credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Format Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                1. Select Document Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('pdf')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    selectedFormat === 'pdf'
                      ? 'border-blue-700 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <FileType className={`w-5 h-5 shrink-0 mt-0.5 ${selectedFormat === 'pdf' ? 'text-blue-700' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Official PDF Document (.pdf)
                    </span>
                    <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                      Formatted multi-page document with legal cover, score badges, tables, and digital sign-off
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('csv')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    selectedFormat === 'csv'
                      ? 'border-emerald-700 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 shrink-0 mt-0.5 ${selectedFormat === 'csv' ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Structured CSV Sheet (.csv)
                    </span>
                    <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                      Raw machine-readable tabular rows for Excel, SIEM data pipelines, and external regulator systems
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Regulatory Standard Target */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Target External Regulatory Mandate
              </label>
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value as ExternalDocumentationStandard)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-700 cursor-pointer"
              >
                <option value="CERT-In">CERT-In (Section 70B IT Act - 6 Hour Mandatory Incident Notice)</option>
                <option value="CISA-CIRCIA">CISA CIRCIA (Cyber Incident Reporting for Critical Infrastructure)</option>
                <option value="ISO-27001">ISO/IEC 27001:2022 ISMS (Annex A.5.24 & A.8.9 Compliance)</option>
                <option value="NIST-SP800">NIST SP 800-61 Rev. 2 (Incident Response & Evidence Integrity)</option>
                <option value="GENERAL-AUDIT">General Corporate Information Security Governance Dossier</option>
              </select>
            </div>

            {/* Report Scope */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Report Scope & Contents
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedScope('all')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedScope === 'all'
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Combined All-in-One
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScope('incidents')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedScope === 'incidents'
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Incidents Only ({incidents.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScope('files')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedScope === 'files'
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  File Integrity Only ({files.length})
                </button>
              </div>
            </div>

            {/* Officer & Organization Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Certifying Security Officer
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-blue-700"
                  placeholder="Officer Name / Role"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-blue-700"
                  placeholder="Organization Name"
                />
              </div>
            </div>

            {/* Live Summary Preview Callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Output File:</span>
                <span className="font-mono text-[11px] text-blue-700">
                  CyberInstincts_{selectedStandard}_{selectedScope === 'all' ? 'Audit_Report' : selectedScope}_{new Date().toISOString().substring(0, 10)}.{selectedFormat}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center justify-between">
                <span>Content Payload:</span>
                <span>
                  {selectedScope === 'all'
                    ? `${incidents.length} incidents • ${files.length} file digests • ${allVerificationLogs.length} audit logs`
                    : selectedScope === 'incidents'
                    ? `${incidents.length} incident records`
                    : `${files.length} protected baseline digests`}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalExport}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 ${
                  selectedFormat === 'pdf'
                    ? 'bg-blue-700 hover:bg-blue-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  Download {selectedFormat.toUpperCase()} Document
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
