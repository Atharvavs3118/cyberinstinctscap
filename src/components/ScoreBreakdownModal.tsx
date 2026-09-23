import React from 'react';
import { SecurityScoreBreakdown, ProtectedFile, CyberIncident } from '../types';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FolderLock,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  breakdown: SecurityScoreBreakdown;
  files: ProtectedFile[];
  incidents: CyberIncident[];
  onNavigateToTab?: (tab: 'cybertrace' | 'minivault') => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  score,
  breakdown,
  files,
  incidents,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  const modifiedFiles = files.filter((f) => f.status === 'MODIFIED');
  const unresolvedCritical = incidents.filter(
    (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED'
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Security Score Analytics</h2>
              <p className="text-xs text-slate-500">Application-Level Defensive Health Formulation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Top Score Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-slate-500 block uppercase font-semibold">Current Posture Score</span>
              <p className="text-3xl font-extrabold font-mono text-cyan-700 mt-0.5">
                {score} <span className="text-xs text-slate-500 font-normal">/ 100 maximum</span>
              </p>
            </div>

            <div className="text-right text-xs font-mono text-slate-600">
              <span className="block text-[11px] text-slate-500">Base Score: 95 pts</span>
              <span className="block text-[11px] text-emerald-700 font-bold">
                Protection Bonus: +{breakdown.protectionBonus} pts
              </span>
            </div>
          </div>

          {/* Mathematical Factors Breakdown */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase">
              Scoring Factors Breakdown
            </h3>

            {/* Factor 1: File Integrity */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <FolderLock className="w-4 h-4 text-cyan-700 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">File Integrity Baseline</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deducts 18 pts per altered file hash, 10 pts per missing target.
                  </p>
                  {modifiedFiles.length > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-mono text-rose-700 font-medium">
                      Alert: {modifiedFiles.length} file currently modified ({modifiedFiles.map((f) => f.fileName).join(', ')})
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold shrink-0 ${
                  breakdown.integrityFactor < 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {breakdown.integrityFactor > 0 ? `+${breakdown.integrityFactor}` : breakdown.integrityFactor} pts
              </span>
            </div>

            {/* Factor 2: Unresolved Critical Incidents */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-4 h-4 text-rose-600 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Active Critical Incidents</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deducts 14 pts per active unmitigated CRITICAL threat.
                  </p>
                  {unresolvedCritical.length > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-mono text-rose-700 font-medium">
                      Pending: {unresolvedCritical.length} critical incident requiring investigation
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold shrink-0 ${
                  breakdown.criticalIncidentPenalty < 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {breakdown.criticalIncidentPenalty} pts
              </span>
            </div>

            {/* Factor 3: High/Medium Threat Deductions */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Active High & Medium Threats</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deducts 7 pts per High threat, 3 pts per Medium threat.
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold shrink-0 ${
                  breakdown.threatDeduction < 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {breakdown.threatDeduction} pts
              </span>
            </div>

            {/* Factor 4: Coverage Bonus */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Vault Coverage Bonus</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    +2 bonus points per verified protected file (capped at +10).
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                +{breakdown.protectionBonus} pts
              </span>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 space-y-2">
            <h4 className="text-xs font-bold font-mono text-cyan-900 uppercase">
              Actionable Recommendations to Improve Score
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              {modifiedFiles.length > 0 && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-cyan-200/80 shadow-2xs">
                  <span>Re-baseline or restore modified file ({modifiedFiles[0].fileName})</span>
                  {onNavigateToTab && (
                    <button
                      onClick={() => {
                        onNavigateToTab('minivault');
                        onClose();
                      }}
                      className="text-cyan-700 hover:text-cyan-900 font-mono text-[11px] font-bold flex items-center gap-0.5"
                    >
                      <span>Open Vault</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {unresolvedCritical.length > 0 && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-cyan-200/80 shadow-2xs">
                  <span>Triage and mitigate incident {unresolvedCritical[0].id}</span>
                  {onNavigateToTab && (
                    <button
                      onClick={() => {
                        onNavigateToTab('cybertrace');
                        onClose();
                      }}
                      className="text-cyan-700 hover:text-cyan-900 font-mono text-[11px] font-bold flex items-center gap-0.5"
                    >
                      <span>CyberTrace</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500 italic pt-1">
                Notice: This score serves as an application-level academic indicator for demonstration purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Formulation: Base - ∑Penalties + ∑Bonuses
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
