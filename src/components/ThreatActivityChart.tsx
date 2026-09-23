import React, { useState } from 'react';
import { ThreatActivityPoint } from '../types';

interface ThreatActivityChartProps {
  data: ThreatActivityPoint[];
}

export const ThreatActivityChart: React.FC<ThreatActivityChartProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true,
  });

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...data.map((d) => {
      let sum = 0;
      if (activeLayers.critical) sum += d.critical;
      if (activeLayers.high) sum += d.high;
      if (activeLayers.medium) sum += d.medium;
      if (activeLayers.low) sum += d.low;
      return Math.max(sum, d.total);
    }),
    20
  );

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left;
    return padding.left + (index / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padding.top + chartH - (val / maxVal) * chartH;
  };

  // Generate SVG Path helper
  const createPath = (key: 'critical' | 'high' | 'medium' | 'low') => {
    if (!activeLayers[key]) return '';
    return data.reduce((acc, pt, i) => {
      const x = getX(i);
      const y = getY(pt[key]);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');
  };

  const createAreaPath = (key: 'critical' | 'high' | 'medium' | 'low') => {
    if (!activeLayers[key]) return '';
    const linePath = createPath(key);
    const bottomY = padding.top + chartH;
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="w-full">
      {/* Chart Controls & Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Metrics:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleLayer('critical')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                activeLayers.critical
                  ? 'bg-rose-50/70 border-rose-200 text-rose-700 font-semibold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLayers.critical ? 'bg-rose-500' : 'bg-slate-300'}`} />
              <span>Critical</span>
            </button>

            <button
              onClick={() => toggleLayer('high')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                activeLayers.high
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800 font-semibold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLayers.high ? 'bg-amber-500' : 'bg-slate-300'}`} />
              <span>High</span>
            </button>

            <button
              onClick={() => toggleLayer('medium')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                activeLayers.medium
                  ? 'bg-blue-50/70 border-blue-200 text-blue-700 font-semibold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLayers.medium ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <span>Medium</span>
            </button>

            <button
              onClick={() => toggleLayer('low')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                activeLayers.low
                  ? 'bg-cyan-50/70 border-cyan-200 text-cyan-700 font-semibold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLayers.low ? 'bg-cyan-600' : 'bg-slate-300'}`} />
              <span>Low</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Ingestion Active
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-xl border border-slate-200 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="grad-critical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-high" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-medium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-low" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(maxVal * ratio);
            const y = padding.top + chartH - ratio * chartH;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Areas */}
          {activeLayers.low && <path d={createAreaPath('low')} fill="url(#grad-low)" />}
          {activeLayers.medium && <path d={createAreaPath('medium')} fill="url(#grad-medium)" />}
          {activeLayers.high && <path d={createAreaPath('high')} fill="url(#grad-high)" />}
          {activeLayers.critical && <path d={createAreaPath('critical')} fill="url(#grad-critical)" />}

          {/* Stroke Lines */}
          {activeLayers.low && (
            <path
              d={createPath('low')}
              fill="none"
              stroke="#0891b2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeLayers.medium && (
            <path
              d={createPath('medium')}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeLayers.high && (
            <path
              d={createPath('high')}
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeLayers.critical && (
            <path
              d={createPath('critical')}
              fill="none"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Labels */}
          {data.map((pt, i) => {
            const x = getX(i);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={padding.top + chartH}
                  x2={x}
                  y2={padding.top + chartH + 5}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {pt.date.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Invisible hover capture rects */}
          {data.map((_, i) => {
            const x = getX(i);
            const sliceW = chartW / (data.length - 1);
            return (
              <rect
                key={i}
                x={x - sliceW / 2}
                y={padding.top}
                width={sliceW}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Hover Crosshair & Indicators */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartH}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              {activeLayers.critical && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].critical)}
                  r="4.5"
                  className="fill-rose-600 stroke-white stroke-2"
                />
              )}
              {activeLayers.high && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].high)}
                  r="4"
                  className="fill-amber-600 stroke-white stroke-2"
                />
              )}
              {activeLayers.medium && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].medium)}
                  r="4"
                  className="fill-blue-600 stroke-white stroke-2"
                />
              )}
              {activeLayers.low && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].low)}
                  r="4"
                  className="fill-cyan-600 stroke-white stroke-2"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && hoverIndex !== null && (
          <div
            className="absolute top-4 pointer-events-none rounded-lg bg-white border border-slate-200 p-3 shadow-xl text-xs font-mono transition-all z-20"
            style={{
              left: `${Math.min(
                Math.max(15, (getX(hoverIndex) / width) * 100 - 15),
                70
              )}%`,
            }}
          >
            <p className="font-bold text-slate-900 mb-1.5 border-b border-slate-100 pb-1">
              {activePoint.date}
            </p>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between gap-4 text-rose-700">
                <span>Critical:</span>
                <span className="font-bold">{activePoint.critical}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-amber-800">
                <span>High:</span>
                <span className="font-bold">{activePoint.high}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-blue-700">
                <span>Medium:</span>
                <span className="font-bold">{activePoint.medium}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-cyan-800">
                <span>Low:</span>
                <span className="font-bold">{activePoint.low}</span>
              </div>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4 text-slate-900 font-bold">
                <span>Total Detected:</span>
                <span>{activePoint.total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
