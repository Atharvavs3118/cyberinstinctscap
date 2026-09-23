import React, { useState } from 'react';
import { DashboardStats, CyberIncident, ProtectedFile, ThreatActivityPoint, SecurityEvent } from '../types';
import { SecurityScoreGauge } from '../components/SecurityScoreGauge';
import { ThreatActivityChart } from '../components/ThreatActivityChart';
import {
  ShieldAlert,
  AlertOctagon,
  FolderLock,
  CheckCircle2,
  FileWarning,
  Eye,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Shield,
  Activity,
  Terminal,
  ExternalLink,
  Radio,
  Building2,
  Scale,
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats;
  incidents: CyberIncident[];
  files: ProtectedFile[];
  activityData: ThreatActivityPoint[];
  securityEvents?: SecurityEvent[];
  onInspectIncident: (incident: CyberIncident) => void;
  onInspectFile: (file: ProtectedFile) => void;
  onOpenReportIncident: () => void;
  onOpenUploadFile: () => void;
  onVerifyAllFiles: () => Promise<void>;
  onOpenScoreDetails: () => void;
  onNavigateToTab: (tab: 'cybertrace' | 'minivault' | 'threat-analysis' | 'reports' | 'gov-portal' | 'login') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  incidents,
  files,
  activityData,
  securityEvents = [],
  onInspectIncident,
  onInspectFile,
  onOpenReportIncident,
  onOpenUploadFile,
  onVerifyAllFiles,
  onOpenScoreDetails,
  onNavigateToTab,
}) => {
  const [verifyingAll, setVerifyingAll] = useState(false);

  const handleVerifyAll = async () => {
    setVerifyingAll(true);
    await onVerifyAllFiles();
    setVerifyingAll(false);
  };

  const recentIncidents = incidents.slice(0, 5);

  const getSeverityBadge = (sev: CyberIncident['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
      case 'LOW':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-bold';
    }
  };

  const getStatusBadge = (status: CyberIncident['status']) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
      case 'MITIGATED':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold';
      case 'INVESTIGATING':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
      case 'MONITORING':
        return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
    }
  };

  const integrityTotal = stats.fileIntegrity.total || 1;
  const verifiedPercentage = Math.round((stats.fileIntegrity.verified / integrityTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner / Operational Callout */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-700 text-white shrink-0 shadow-xs">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Security Operations Center (SOC) Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                DEFCON 3 • ACTIVE DEFENSE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Enterprise real-time threat detection and cryptographic SHA-256 baseline evidence custody.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenReportIncident}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer border border-rose-800"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </button>

          <button
            onClick={onOpenUploadFile}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer border border-blue-800"
          >
            <FolderLock className="w-4 h-4 text-white" />
            <span>Protect File</span>
          </button>
        </div>
      </div>

      {/* NATIONAL LAW ENFORCEMENT & JUSTICE PORTALS (CCTNS & ICJS) */}
      <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-700 text-white shrink-0 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-100 border border-blue-700">
                GOVERNMENT OF INDIA OFFICIAL PORTALS
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline font-medium">Ministry of Home Affairs & Supreme Court e-Committee</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              CCTNS & ICJS Official Portal Gateway
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mt-0.5 leading-relaxed">
              Direct access to Crime and Criminal Tracking Network & Systems (16,500+ Police Stations) and the Inter-Operable Criminal Justice System (ICJS Phase-II).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="https://digitalpolice.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Open Digital Police Citizen & Police Services Portal (NCRB)"
          >
            <Building2 className="w-4 h-4 text-white" />
            <span>CCTNS Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-white/80" />
          </a>

          <a
            href="https://icjs.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Open Inter-Operable Criminal Justice System (Supreme Court)"
          >
            <Scale className="w-4 h-4 text-white" />
            <span>ICJS Gateway</span>
            <ExternalLink className="w-3.5 h-3.5 text-white/80" />
          </a>

          <button
            onClick={() => onNavigateToTab('gov-portal')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            title="Open in-app CCTNS / ICJS FIR generator"
          >
            <span>Justice Hub</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* SECTION 1: Security Overview 5-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Threats Detected */}
        <div className="glass-panel-interactive p-4 rounded-2xl border-t-2 border-t-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-slate-600">
              Threats Detected
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black font-mono text-slate-900 tracking-tight">
              {stats.threatsDetected}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Logged in SIEM registry
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('cybertrace')}
            className="text-[11px] font-mono text-cyan-700 hover:text-cyan-800 font-semibold flex items-center justify-between pt-2.5 border-t border-slate-100 transition-colors"
          >
            <span>View all threats</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Critical Incidents */}
        <div className="glass-panel-interactive p-4 rounded-2xl border-t-2 border-t-rose-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-slate-600">
              Critical Alerts
            </span>
            <div
              className={`p-2 rounded-xl border shadow-xs ${
                stats.criticalIncidents > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <p
              className={`text-3xl font-black font-mono tracking-tight ${
                stats.criticalIncidents > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {stats.criticalIncidents}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  stats.criticalIncidents > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              {stats.criticalIncidents > 0 ? 'Immediate triage required' : 'Clean threat posture'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('cybertrace')}
            className="text-[11px] font-mono text-rose-700 hover:text-rose-800 font-semibold flex items-center justify-between pt-2.5 border-t border-slate-100 transition-colors"
          >
            <span>Triage queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Protected Files */}
        <div className="glass-panel-interactive p-4 rounded-2xl border-t-2 border-t-cyan-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-slate-600">
              Protected Files
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-xs">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black font-mono text-slate-900 tracking-tight">
              {stats.protectedFiles}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              MiniVault SHA-256 watched
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('minivault')}
            className="text-[11px] font-mono text-cyan-700 hover:text-cyan-800 font-semibold flex items-center justify-between pt-2.5 border-t border-slate-100 transition-colors"
          >
            <span>Manage vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: File Integrity Status */}
        <div className="glass-panel-interactive p-4 rounded-2xl border-t-2 border-t-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-slate-600">
              Integrity Status
            </span>
            <div
              className={`p-2 rounded-xl border shadow-xs ${
                stats.fileIntegrity.modified > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {stats.fileIntegrity.modified > 0 ? (
                <FileWarning className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="my-3">
            <p
              className={`text-3xl font-black font-mono tracking-tight ${
                stats.fileIntegrity.modified > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {stats.fileIntegrity.modified > 0 ? `${stats.fileIntegrity.modified} Modified` : 'Verified'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  stats.fileIntegrity.modified > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              {stats.fileIntegrity.verified} / {stats.fileIntegrity.total} baseline matched
            </p>
          </div>
          <button
            onClick={handleVerifyAll}
            disabled={verifyingAll}
            className="text-[11px] font-mono text-cyan-700 hover:text-cyan-800 font-semibold flex items-center justify-between pt-2.5 border-t border-slate-100 transition-colors disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${verifyingAll ? 'animate-spin text-cyan-600' : ''}`} />
              {verifyingAll ? 'Verifying...' : 'Sweep integrity'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 5: Security Score Gauge */}
        <div className="sm:col-span-2 lg:col-span-1">
          <SecurityScoreGauge
            score={stats.securityScore}
            breakdown={stats.scoreBreakdown}
            onOpenScoreDetails={onOpenScoreDetails}
          />
        </div>
      </div>

      {/* SECTION 2: Threat Activity Chart & File Protection Health Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Threat Activity Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                Threat Activity Over Time
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-severity timeline correlation of intercepted cyber events
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('threat-analysis')}
              className="text-xs font-mono text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1"
            >
              <span>Advanced Analytics</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <ThreatActivityChart data={activityData} />
        </div>

        {/* Right 1 Col: File Protection Integrity Indicator & Metrics */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-cyan-600" />
                MiniVault Health
              </h2>
              <button
                onClick={handleVerifyAll}
                disabled={verifyingAll}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-700 text-xs font-mono font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                title="Verify All Files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingAll ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sweep</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Continuous cryptographic surveillance of critical system configs and certificates.
            </p>

            {/* Visual Integrity Progress Bar */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-700 font-semibold">Integrity Ratio</span>
                <span
                  className={
                    stats.fileIntegrity.modified > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'
                  }
                >
                  {verifiedPercentage}% Intact
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(stats.fileIntegrity.verified / integrityTotal) * 100}%` }}
                />
                {stats.fileIntegrity.modified > 0 && (
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${(stats.fileIntegrity.modified / integrityTotal) * 100}%` }}
                  />
                )}
                {stats.fileIntegrity.missing > 0 && (
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{ width: `${(stats.fileIntegrity.missing / integrityTotal) * 100}%` }}
                  />
                )}
              </div>
            </div>

            {/* Breakdown List */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Total Files</span>
                <span className="text-sm font-bold text-slate-900">{stats.fileIntegrity.total}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-emerald-700 text-[10px] uppercase block font-semibold">Verified Valid</span>
                <span className="text-sm font-bold text-emerald-700">{stats.fileIntegrity.verified}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-rose-700 text-[10px] uppercase block font-semibold">Modified Alert</span>
                <span className="text-sm font-bold text-rose-700">{stats.fileIntegrity.modified}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-amber-700 text-[10px] uppercase block font-semibold">Missing / Warnings</span>
                <span className="text-sm font-bold text-amber-700">
                  {stats.fileIntegrity.missing + stats.fileIntegrity.warning}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('minivault')}
              className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-cyan-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open MiniVault File Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Recent Cyber Incidents Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Recent Cyber Incidents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live incident triage log with automated CVSS rating and MITRE classification
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('cybertrace')}
            className="text-xs font-mono text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all ({incidents.length}) incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-2.5 font-semibold">Incident ID</th>
                <th className="pb-2.5 font-semibold">Threat Type</th>
                <th className="pb-2.5 font-semibold">Source</th>
                <th className="pb-2.5 font-semibold">Target</th>
                <th className="pb-2.5 font-semibold">Severity</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 font-semibold">Timestamp</th>
                <th className="pb-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentIncidents.map((inc) => (
                <tr
                  key={inc.id}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => onInspectIncident(inc)}
                >
                  <td className="py-3 font-mono font-bold text-cyan-700">{inc.id}</td>
                  <td className="py-3 font-semibold text-slate-900">{inc.threatType}</td>
                  <td className="py-3 font-mono text-slate-600">{inc.sourceIp}</td>
                  <td className="py-3 text-slate-600 max-w-[150px] truncate">{inc.target}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(
                        inc.severity
                      )}`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(
                        inc.status
                      )}`}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-500">
                    {inc.timestamp.split(' ')[0]}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectIncident(inc);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 group-hover:bg-cyan-50 group-hover:text-cyan-800 group-hover:border-cyan-300 border border-slate-200 text-[11px] font-mono font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Live Security Events (Firestore security_events Collection) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-600 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Security Events (Firestore: security_events)
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            Audit Trail
          </span>
        </div>

        {securityEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            No recent security audit events recorded.
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            {securityEvents.slice(0, 6).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : evt.severity === 'HIGH'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : evt.severity === 'MEDIUM'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {evt.eventType}
                  </span>
                  <span className="text-slate-800 font-medium">{evt.description}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
                  {evt.ipAddress && <span>IP: {evt.ipAddress}</span>}
                  <span>{evt.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
