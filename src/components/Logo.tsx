import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const titleSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Cybersecurity Shield + Neural Fingerprint Icon */}
      <div className={`relative ${iconDimensions} flex items-center justify-center shrink-0`}>
        <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-lg pointer-events-none" />
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
        >
          {/* Shield Boundary */}
          <path
            d="M24 4L7 11V22C7 33.2 14.3 43.5 24 46C33.7 43.5 41 33.2 41 22V11L24 4Z"
            className="stroke-cyan-400"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#shield-grad)"
          />
          {/* Neural & Fingerprint Curves */}
          <path
            d="M24 13V17"
            className="stroke-cyan-300"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 19C18 15.6863 20.6863 13 24 13C27.3137 13 30 15.6863 30 19V26C30 29.3137 27.3137 32 24 32"
            className="stroke-cyan-300/80"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M14 23C14 17.4772 18.4772 13 24 13C29.5228 13 34 17.4772 34 23V27C34 32.5228 29.5228 37 24 37"
            className="stroke-cyan-400"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeDasharray="1 2.5"
          />
          <path
            d="M24 23V28"
            className="stroke-emerald-400"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="23" r="2.5" className="fill-cyan-300" />
          <circle cx="18" cy="27" r="1.5" className="fill-cyan-400" />
          <circle cx="30" cy="27" r="1.5" className="fill-cyan-400" />
          <circle cx="24" cy="33" r="1.5" className="fill-emerald-400" />

          <defs>
            <linearGradient id="shield-grad" x1="24" y1="4" x2="24" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0891b2" stopOpacity="0.15" />
              <stop stopColor="#0284c7" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-slate-900 ${titleSize}`}>
            Cyber<span className="text-cyan-600">Instincts</span>
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-300 rounded shadow-xs">
            SOC v2.4
          </span>
        </div>
        {showTagline && (
          <p className="text-[11px] text-slate-500 tracking-normal font-medium mt-0.5">
            Cyber Threat & File Protection System
          </p>
        )}
      </div>
    </div>
  );
};
