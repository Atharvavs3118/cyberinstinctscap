import React, { useState, useMemo } from 'react';
import { CyberIncident, ThreatCategory, ThreatSeverity, IncidentStatus } from '../types';
import {
  ShieldAlert,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Crosshair,
  Server,
  ArrowUpDown,
  Download,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

interface CyberTracePageProps {
  incidents: CyberIncident[];
  onInspectIncident: (incident: CyberIncident) => void;
  onOpenReportModal: () => void;
}

export const CyberTracePage: React.FC<CyberTracePageProps> = ({
  incidents,
  onInspectIncident,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedThreatType, setSelectedThreatType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'id'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const threatCategories: ThreatCategory[] = [
    'Malware',
    'Phishing',
    'Brute Force',
    'Suspicious Login',
    'Unauthorized Access',
    'File Tampering',
    'Unknown Threat',
  ];

  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            inc.id.toLowerCase().includes(q) ||
            inc.threatType.toLowerCase().includes(q) ||
            inc.sourceIp.toLowerCase().includes(q) ||
            inc.target.toLowerCase().includes(q) ||
            inc.description.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Severity filter
        if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) {
          return false;
        }

        // Threat type filter
        if (selectedThreatType !== 'ALL' && inc.threatType !== selectedThreatType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'timestamp') {
          return sortOrder === 'desc'
            ? b.timestamp.localeCompare(a.timestamp)
            : a.timestamp.localeCompare(b.timestamp);
        }
        if (sortBy === 'id') {
          return sortOrder === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
        }
        if (sortBy === 'severity') {
          const weights: Record<ThreatSeverity, number> = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
          };
          return sortOrder === 'desc'
            ? weights[b.severity] - weights[a.severity]
            : weights[a.severity] - weights[b.severity];
        }
        return 0;
      });
  }, [incidents, searchQuery, selectedSeverity, selectedStatus, selectedThreatType, sortBy, sortOrder]);

  const getSeverityBadge = (sev: ThreatSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      case 'LOW':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-bold';
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case 'MITIGATED':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-bold';
      case 'INVESTIGATING':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      case 'MONITORING':
        return 'bg-slate-100 text-slate-700 border-slate-200 font-bold';
    }
  };

  const exportFilteredCsv = () => {
    const headers = ['IncidentID,ThreatType,Severity,Status,SourceIp,Target,Timestamp,CVSS,MitreTactic,Description'];
    const rows = filteredIncidents.map(
      (i) =>
        `"${i.id}","${i.threatType}","${i.severity}","${i.status}","${i.sourceIp}","${i.target}","${i.timestamp}","${i.cvssScore || ''}","${i.mitreTactic || ''}","${i.description.replace(/"/g, '""')}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CyberTrace_Incidents_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = incidents.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = incidents.filter((i) => i.severity === 'LOW').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
              <ShieldAlert className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  CyberTrace Incident Surveillance
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  SIEM STREAM
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Log, analyze, and investigate anomalous cyber events across the threat horizon.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={exportFilteredCsv}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors shadow-xs"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Severity Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedSeverity('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            selectedSeverity === 'ALL'
              ? 'bg-slate-100 text-slate-900 border-slate-300/80 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <span>All Severities</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 text-slate-700 font-semibold">
            {incidents.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedSeverity('CRITICAL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-rose-700 hover:bg-rose-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Critical</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-100 text-rose-800 font-semibold">
            {criticalCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedSeverity('HIGH')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            selectedSeverity === 'HIGH'
              ? 'bg-amber-50 text-amber-900 border-amber-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-amber-700 hover:bg-amber-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>High</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-semibold">
            {highCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedSeverity('MEDIUM')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            selectedSeverity === 'MEDIUM'
              ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Medium</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 text-blue-800 font-semibold">
            {mediumCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedSeverity('LOW')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            selectedSeverity === 'LOW'
              ? 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-cyan-700 hover:bg-cyan-50/40 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
          <span>Low</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-100 text-cyan-800 font-semibold">
            {lowCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, IP, target host, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none"
            />
          </div>

          {/* Filter by Severity */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none font-mono"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="MONITORING">Monitoring</option>
            </select>
          </div>

          {/* Filter by Threat Type */}
          <div>
            <select
              value={selectedThreatType}
              onChange={(e) => setSelectedThreatType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none font-mono"
            >
              <option value="ALL">All Categories</option>
              {threatCategories.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pills and Quick Counters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{filteredIncidents.length}</strong> of{' '}
              {incidents.length} total incidents
            </span>
            {(searchQuery || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedThreatType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('ALL');
                  setSelectedStatus('ALL');
                  setSelectedThreatType('ALL');
                }}
                className="text-cyan-700 hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Sort by:</span>
            <button
              onClick={() => {
                if (sortBy === 'timestamp') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else setSortBy('timestamp');
              }}
              className={`px-2 py-0.5 rounded border transition-colors font-medium ${
                sortBy === 'timestamp'
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Date {sortBy === 'timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'severity') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else setSortBy('severity');
              }}
              className={`px-2 py-0.5 rounded border transition-colors font-medium ${
                sortBy === 'severity'
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Severity {sortBy === 'severity' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Incident Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No Incidents Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No cyber incidents match your search query or filter criteria. Try resetting filters or log a new incident.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 font-semibold">Incident ID</th>
                  <th className="p-3.5 font-semibold">Threat Type</th>
                  <th className="p-3.5 font-semibold">Source IP</th>
                  <th className="p-3.5 font-semibold">Target Asset</th>
                  <th className="p-3.5 font-semibold">Severity</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold">Date & Time</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onInspectIncident(inc)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="p-3.5 font-mono font-bold text-cyan-700 flex items-center gap-1.5">
                      <span>{inc.id}</span>
                      {inc.severity === 'CRITICAL' && inc.status !== 'RESOLVED' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{inc.threatType}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-cyan-600" />
                        <span>{inc.sourceIp}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-[160px] truncate">
                      <div className="flex items-center gap-1">
                        <Server className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{inc.target}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(
                          inc.severity
                        )}`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(
                          inc.status
                        )}`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {inc.timestamp}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectIncident(inc);
                        }}
                        className="px-2.5 py-1 rounded bg-white group-hover:bg-cyan-50 group-hover:text-cyan-800 group-hover:border-cyan-300 border border-slate-200 text-[11px] font-mono text-slate-700 transition-all inline-flex items-center gap-1 shadow-xs"
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
        )}
      </div>
    </div>
  );
};
