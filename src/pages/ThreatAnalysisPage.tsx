import React, { useState, useEffect } from 'react';
import { CyberIncident, ThreatCategory, ThreatSeverity, ThreatActivityPoint } from '../types';
import { ThreatActivityChart } from '../components/ThreatActivityChart';
import { cloudSqlApi } from '../services/api';
import {
  PieChart,
  BarChart3,
  Crosshair,
  ShieldAlert,
  AlertTriangle,
  Globe,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldX,
  Database,
  Search,
  FileText,
  Share2,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface ThreatAnalysisPageProps {
  incidents: CyberIncident[];
  activityData: ThreatActivityPoint[];
  onInspectIncident: (incident: CyberIncident) => void;
  onFilterSourceIp?: (ip: string) => void;
}

export const ThreatAnalysisPage: React.FC<ThreatAnalysisPageProps> = ({
  incidents,
  activityData,
  onInspectIncident,
  onFilterSourceIp,
}) => {
  const [quarantinedIps, setQuarantinedIps] = useState<string[]>([]);

  // Cloud SQL Relational Telemetry State
  const [sqlIncidents, setSqlIncidents] = useState<any[]>([]);
  const [loadingSql, setLoadingSql] = useState(false);
  const [selectedSqlIncidentId, setSelectedSqlIncidentId] = useState<number | null>(null);
  const [sqlDetails, setSqlDetails] = useState<{
    evidence: any[];
    patterns: any[];
    similarity: any[];
    reports: any[];
  }>({ evidence: [], patterns: [], similarity: [], reports: [] });
  const [sourceSearchInput, setSourceSearchInput] = useState('');
  const [sourceSearchResults, setSourceSearchResults] = useState<any[] | null>(null);

  const fetchCloudSqlData = async () => {
    setLoadingSql(true);
    try {
      const data = await cloudSqlApi.getIncidents();
      if (data.success && data.incidents) {
        setSqlIncidents(data.incidents);
        if (data.incidents.length > 0 && selectedSqlIncidentId === null) {
          loadIncidentDetails(data.incidents[0].incidentId);
        }
      }
    } catch (e) {
      console.error('Failed to load Cloud SQL data:', e);
    } finally {
      setLoadingSql(false);
    }
  };

  const loadIncidentDetails = async (id: number) => {
    setSelectedSqlIncidentId(id);
    try {
      const [ev, pat, sim, rep] = await Promise.all([
        cloudSqlApi.getEvidence(id),
        cloudSqlApi.getPatterns(id),
        cloudSqlApi.getSimilarity(id),
        cloudSqlApi.getReports(id),
      ]);
      setSqlDetails({
        evidence: ev.evidence || [],
        patterns: pat.patterns || [],
        similarity: sim.similarIncidents || [],
        reports: rep.reports || [],
      });
    } catch (e) {
      console.error('Failed to load incident relational details:', e);
    }
  };

  const handleSearchSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceSearchInput.trim()) {
      setSourceSearchResults(null);
      return;
    }
    try {
      const res = await cloudSqlApi.searchBySource(sourceSearchInput.trim());
      setSourceSearchResults(res.results || []);
    } catch (e) {
      console.error('Search failed:', e);
    }
  };

  useEffect(() => {
    fetchCloudSqlData();
  }, []);

  // 1. Calculate Threat Types Distribution
  const categoryCounts: Record<ThreatCategory, number> = {
    Malware: 0,
    Phishing: 0,
    'Brute Force': 0,
    'Suspicious Login': 0,
    'Unauthorized Access': 0,
    'File Tampering': 0,
    'Unknown Threat': 0,
  };

  incidents.forEach((i) => {
    if (categoryCounts[i.threatType] !== undefined) {
      categoryCounts[i.threatType]++;
    }
  });

  const totalIncidents = incidents.length || 1;

  // 2. Calculate Severity Distribution
  const severityCounts: Record<ThreatSeverity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  incidents.forEach((i) => {
    severityCounts[i.severity]++;
  });

  // 3. Calculate Top Threat Sources (IP addresses)
  const sourceIpMap: Record<string, { count: number; targets: Set<string>; threats: Set<string> }> = {};
  incidents.forEach((i) => {
    if (!sourceIpMap[i.sourceIp]) {
      sourceIpMap[i.sourceIp] = { count: 0, targets: new Set(), threats: new Set() };
    }
    sourceIpMap[i.sourceIp].count++;
    sourceIpMap[i.sourceIp].targets.add(i.target);
    sourceIpMap[i.sourceIp].threats.add(i.threatType);
  });

  const topSources = Object.entries(sourceIpMap)
    .map(([ip, data]) => ({
      ip,
      count: data.count,
      targetCount: data.targets.size,
      threatTypes: Array.from(data.threats),
    }))
    .sort((a, b) => b.count - a.count);

  const toggleQuarantine = (ip: string) => {
    if (quarantinedIps.includes(ip)) {
      setQuarantinedIps(quarantinedIps.filter((x) => x !== ip));
    } else {
      setQuarantinedIps([...quarantinedIps, ip]);
    }
  };

  // Color palette for threat types
  const categoryColors: Record<ThreatCategory, string> = {
    Malware: '#f43f5e',
    Phishing: '#38bdf8',
    'Brute Force': '#fbbf24',
    'Suspicious Login': '#a855f7',
    'Unauthorized Access': '#ec4899',
    'File Tampering': '#ef4444',
    'Unknown Threat': '#94a3b8',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
            <PieChart className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Threat Intelligence & Attack Analytics
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                MITRE ATT&CK Matrix
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Statistical breakdown of attack vectors, adversary origin IP distribution, and temporal incident density.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs font-medium">
            <Globe className="w-3.5 h-3.5 text-cyan-600" />
            <span>{topSources.length} Active Adversary Origins</span>
          </span>
        </div>
      </div>

      {/* Grid: Category Distribution Donut & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Threat Type Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              Attack Vector Classification
            </h2>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">{incidents.length} Events Total</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              if (count === 0) return null;
              const percentage = Math.round((count / totalIncidents) * 100);
              const color = categoryColors[cat as ThreatCategory];

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-700 flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span>{cat}</span>
                    </span>
                    <span className="text-slate-500 font-medium">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Box 2: Threat Severity Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-600" />
              Threat Severity Distribution
            </h2>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">CVSS Alignment</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Critical */}
            <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-800">CRITICAL</span>
                <span className="text-[10px] font-mono text-rose-700/80">CVSS 9.0-10</span>
              </div>
              <p className="text-2xl font-extrabold font-mono text-rose-700 my-1">
                {severityCounts.CRITICAL}
              </p>
              <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-600 h-full"
                  style={{ width: `${(severityCounts.CRITICAL / totalIncidents) * 100}%` }}
                />
              </div>
            </div>

            {/* High */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-800">HIGH</span>
                <span className="text-[10px] font-mono text-amber-700/80">CVSS 7.0-8.9</span>
              </div>
              <p className="text-2xl font-extrabold font-mono text-amber-700 my-1">
                {severityCounts.HIGH}
              </p>
              <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-full"
                  style={{ width: `${(severityCounts.HIGH / totalIncidents) * 100}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-800">MEDIUM</span>
                <span className="text-[10px] font-mono text-blue-700/80">CVSS 4.0-6.9</span>
              </div>
              <p className="text-2xl font-extrabold font-mono text-blue-700 my-1">
                {severityCounts.MEDIUM}
              </p>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full"
                  style={{ width: `${(severityCounts.MEDIUM / totalIncidents) * 100}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="p-3.5 rounded-xl bg-cyan-50/80 border border-cyan-200 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-800">LOW</span>
                <span className="text-[10px] font-mono text-cyan-700/80">CVSS 0.1-3.9</span>
              </div>
              <p className="text-2xl font-extrabold font-mono text-cyan-700 my-1">
                {severityCounts.LOW}
              </p>
              <div className="w-full bg-cyan-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-600 h-full"
                  style={{ width: `${(severityCounts.LOW / totalIncidents) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Timeline Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              Incident Velocity & Attack Trends
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative and severity-stratified event rate across 10 temporal checkpoints
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 font-bold">Sensor Mesh Synchronized</span>
        </div>

        <ThreatActivityChart data={activityData} />
      </div>

      {/* Top Attack Sources (IP addresses) Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-600" />
              Most Frequent Adversary Origin IPs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Correlated external and rogue internal sources initiating unauthorized telemetry
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {quarantinedIps.length} IPs Enforced in IPTables
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3.5 font-semibold">Attacker IP</th>
                <th className="p-3.5 font-semibold">Events Intercepted</th>
                <th className="p-3.5 font-semibold">Targets Probed</th>
                <th className="p-3.5 font-semibold">Observed Vectors</th>
                <th className="p-3.5 font-semibold">Firewall Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {topSources.map((source) => {
                const isQuarantined = quarantinedIps.includes(source.ip);
                return (
                  <tr key={source.ip} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-cyan-800 flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5 text-slate-400" />
                      <span>{source.ip}</span>
                      {isQuarantined && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                          BLOCKED
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                        {source.count} hits
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-500">
                      {source.targetCount} internal asset(s)
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {source.threatTypes.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => toggleQuarantine(source.ip)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-all shadow-xs ${
                          isQuarantined
                            ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <ShieldX className="w-3 h-3" />
                        <span>{isQuarantined ? 'Unblock IP' : 'Quarantine IP'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Cloud SQL Relational Telemetry Console */}
      <div className="glass-panel p-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cloud SQL Relational Telemetry (PostgreSQL)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                asia-southeast1 · 9 Relational Tables
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live normalized PostgreSQL backend managing incidents, evidence, behavioral patterns, sources & statutory reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCloudSqlData}
              disabled={loadingSql}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSql ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>Refresh PostgreSQL</span>
            </button>
          </div>
        </div>

        {/* Source Search Bar */}
        <form onSubmit={handleSearchSource} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={sourceSearchInput}
              onChange={(e) => setSourceSearchInput(e.target.value)}
              placeholder="Search incidents by correlated source (e.g. 198.51.100.42, 203.0.113.195, c2-beacon)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-mono text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Search Source
          </button>
          {sourceSearchResults !== null && (
            <button
              type="button"
              onClick={() => {
                setSourceSearchInput('');
                setSourceSearchResults(null);
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        {/* Source Search Results Banner if active */}
        {sourceSearchResults !== null && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
            <div className="font-bold text-indigo-900 flex items-center justify-between">
              <span>Source Query Results ({sourceSearchResults.length} matches):</span>
            </div>
            {sourceSearchResults.length === 0 ? (
              <p className="text-slate-600">No correlated incidents linked to this source value.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sourceSearchResults.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-2xs space-y-1">
                    <p className="font-semibold text-slate-900">{r.title}</p>
                    <p className="text-[11px] text-slate-600">
                      Type: <span className="font-mono">{r.incidentType}</span> · Risk: <span className="font-bold text-rose-600">{r.riskLevel} ({r.riskScore})</span>
                    </p>
                    <p className="text-[10px] font-mono text-indigo-700 truncate">
                      Source: {r.sourceType} = {r.sourceValue}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Grid: Incidents List & Relational Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: PostgreSQL Incidents Table (7 cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 font-mono">incidents (PostgreSQL)</span>
              <span className="text-[11px] text-slate-500 font-mono">{sqlIncidents.length} Records</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {sqlIncidents.map((inc) => {
                const isSelected = selectedSqlIncidentId === inc.incidentId;
                return (
                  <div
                    key={inc.incidentId}
                    onClick={() => loadIncidentDetails(inc.incidentId)}
                    className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.2 rounded">
                          #{inc.incidentId}
                        </span>
                        <span className="font-bold text-slate-900 truncate">{inc.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{inc.description}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span>{inc.incidentType}</span>
                        <span>·</span>
                        <span>Status: {inc.status}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          inc.riskLevel === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : inc.riskLevel === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {inc.riskLevel} {inc.riskScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Relational Dossier (Evidence, Patterns, Similarity, Reports) (5 cols) */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Relational Dossier #{selectedSqlIncidentId}
              </span>
              <span className="text-[10px] font-mono text-slate-500">Drizzle Relations</span>
            </div>

            {/* Evidence items */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-cyan-600" /> evidence
                </span>
                <span className="text-[10px] font-mono text-slate-400">({sqlDetails.evidence.length})</span>
              </div>
              {sqlDetails.evidence.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No forensic evidence files linked.</p>
              ) : (
                sqlDetails.evidence.map((ev: any) => (
                  <div key={ev.evidenceId} className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-800 font-mono truncate">{ev.fileName}</p>
                    <p className="text-[10px] text-slate-500">{ev.evidenceType} · {ev.filePath}</p>
                  </div>
                ))
              )}
            </div>

            {/* Behavioral patterns */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" /> patterns
                </span>
                <span className="text-[10px] font-mono text-slate-400">({sqlDetails.patterns.length})</span>
              </div>
              {sqlDetails.patterns.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No attack pattern signatures recorded.</p>
              ) : (
                sqlDetails.patterns.map((pat: any) => (
                  <div key={pat.patternId} className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">{pat.patternType}</span>
                      <span className="font-mono text-[10px] font-semibold text-purple-700">{pat.confidence}% Conf</span>
                    </div>
                    <p className="text-[10px] text-slate-600">{pat.description}</p>
                  </div>
                ))
              )}
            </div>

            {/* Similarity links */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" /> incident_similarity
                </span>
                <span className="text-[10px] font-mono text-slate-400">({sqlDetails.similarity.length})</span>
              </div>
              {sqlDetails.similarity.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No correlated similar incidents.</p>
              ) : (
                sqlDetails.similarity.map((sim: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-indigo-50/50 border border-indigo-100 text-[11px] flex items-center justify-between">
                    <span className="font-mono text-indigo-900 font-semibold">Incident #{sim.similarIncidentId}</span>
                    <span className="font-mono text-[10px] font-bold text-indigo-700">{sim.similarityScore}% Match</span>
                  </div>
                ))
              )}
            </div>

            {/* Statutory Reports */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> reports & history
                </span>
                <span className="text-[10px] font-mono text-slate-400">({sqlDetails.reports.length})</span>
              </div>
              {sqlDetails.reports.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No reports filed for this incident.</p>
              ) : (
                sqlDetails.reports.map((rep: any) => (
                  <div key={rep.reportId} className="p-2 rounded bg-emerald-50/40 border border-emerald-100 text-[11px] space-y-1">
                    <p className="font-bold text-emerald-950">{rep.reportTitle}</p>
                    <p className="text-[10px] text-slate-600 line-clamp-2">{rep.reportContent}</p>
                    {rep.history && rep.history.length > 0 && (
                      <div className="pt-1 border-t border-emerald-100 text-[9px] font-mono text-emerald-800">
                        Latest Audit: {rep.history[0].action}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
