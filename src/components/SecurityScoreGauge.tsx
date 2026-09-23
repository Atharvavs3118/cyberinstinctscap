import React from 'react';
import { SecurityScoreBreakdown } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info } from 'lucide-react';

interface SecurityScoreGaugeProps {
  score: number;
  breakdown: SecurityScoreBreakdown;
  onOpenScoreDetails?: () => void;
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({
  score,
  breakdown,
  onOpenScoreDetails,
}) => {
  // Color styling based on score
  const getScoreColor = (val: number) => {
    if (val >= 85) return { stroke: '#059669', text: 'text-emerald-700', label: 'OPTIMAL DEFENSE' };
    if (val >= 70) return { stroke: '#0284c7', text: 'text-cyan-700', label: 'STABLE POSTURE' };
    if (val >= 50) return { stroke: '#d97706', text: 'text-amber-700', label: 'ATTENTION REQUIRED' };
    return { stroke: '#e11d48', text: 'text-rose-700', label: 'ELEVATED RISK' };
  };

  const status = getScoreColor(score);

  // SVG circle calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Security Score
            </h3>
            <span className="text-[10px] font-mono text-slate-500">App-Level Health Indicator</span>
          </div>
        </div>

        {onOpenScoreDetails && (
          <button
            onClick={onOpenScoreDetails}
            className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 font-mono hover:underline"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Breakdown</span>
          </button>
        )}
      </div>

      {/* Circular Gauge */}
      <div className="flex items-center justify-center my-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Subtle Glow */}
          <div
            className="absolute inset-4 rounded-full blur-xl opacity-10"
            style={{ backgroundColor: status.stroke }}
          />

          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
            {/* Background Track */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              className="stroke-slate-200"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Value Arc */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke={status.stroke}
              strokeWidth="9"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-black font-mono tracking-tight ${status.text}`}>
              {score}
            </span>
            <span className="text-[10px] font-mono text-slate-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Label and Factors preview */}
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-600 font-medium">Status:</span>
          <span className={`font-mono font-bold text-[11px] ${status.text}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 border border-slate-200">
            <span>Integrity:</span>
            <span className={breakdown.integrityFactor < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
              {breakdown.integrityFactor} pts
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 border border-slate-200">
            <span>Threats:</span>
            <span className={breakdown.criticalIncidentPenalty < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
              {breakdown.criticalIncidentPenalty + breakdown.threatDeduction} pts
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center italic pt-1 leading-relaxed">
          *Academic application-level health index. Does not evaluate physical or kernel host state.
        </p>
      </div>
    </div>
  );
};
