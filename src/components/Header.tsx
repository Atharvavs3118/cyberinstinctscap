import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserProfile } from '../types';
import {
  LayoutDashboard,
  ShieldAlert,
  FolderLock,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Bell,
  User,
  LogOut,
  Terminal,
  Cpu,
  ChevronDown,
  Shield,
  Building2,
  Sparkles,
  LogIn,
  ExternalLink,
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'cybertrace' 
  | 'minivault' 
  | 'threat-analysis' 
  | 'gov-portal' 
  | 'ai-assistant' 
  | 'reports' 
  | 'login' 
  | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount?: number;
  unreadNotificationCount?: number;
  onOpenNotifications: () => void;
  currentUser?: UserProfile;
  user?: UserProfile;
  securityScore?: number;
  onOpenScoreBreakdown?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  unreadNotificationCount,
  onOpenNotifications,
  currentUser,
  user,
  securityScore,
  onOpenScoreBreakdown,
  onOpenAuth,
  onLogout,
  onOpenArchitecture,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const userProfile = currentUser || user || {
    id: 'usr-001',
    username: 'atharva.soc',
    fullName: 'Atharva Sankhe',
    email: 'atharva@cyberinstincts.soc',
    role: 'Lead Cybersecurity Analyst',
    avatar: 'AS',
    isAuthenticated: true,
  };

  const unread = unreadCount ?? unreadNotificationCount ?? 0;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'cybertrace', label: 'CyberTrace', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'minivault', label: 'MiniVault', icon: <FolderLock className="w-4 h-4" /> },
    { id: 'gov-portal', label: 'Gov Portal', icon: <Building2 className="w-4 h-4" />, badge: 'CERT-In' },
    { id: 'ai-assistant', label: 'AI Copilot', icon: <Sparkles className="w-4 h-4 text-cyan-600" />, badge: 'Gemini' },
    { id: 'threat-analysis', label: 'Threat Analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-300 bg-white shadow-xs">
      {/* Top Security Status Bar - Professional Institutional Metadata */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-200">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            SOC System Operational
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-medium">
            Directives: <strong className="text-white font-semibold">CERT-In (6-Hour Notice) • CISA</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-medium">
            Cryptography: <strong className="text-white font-semibold">SHA-256 (NIST FIPS 180-4)</strong>
          </span>
        </div>

        {/* CCTNS & ICJS National Portals Links */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold">
            National Portals:
          </span>
          <a
            href="https://digitalpolice.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            title="CCTNS - Crime and Criminal Tracking Network & Systems (digitalpolice.gov.in)"
          >
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span>CCTNS</span>
            <ExternalLink className="w-3 h-3 text-white/80" />
          </a>

          <a
            href="https://icjs.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            title="ICJS - Inter-Operable Criminal Justice System (icjs.gov.in)"
          >
            <Shield className="w-3.5 h-3.5 text-white" />
            <span>ICJS</span>
            <ExternalLink className="w-3 h-3 text-white/80" />
          </a>

          <span className="text-slate-600">|</span>

          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1 text-slate-200 hover:text-white font-medium transition-colors px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs"
            title="Inspect System Architecture"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-300" />
            <span>Architecture</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Left: Branding */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            onClick={() => onTabChange('dashboard')}
            className="focus:outline-none text-left transition-transform active:scale-95 shrink-0"
          >
            <Logo size="md" showTagline />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* CCTNS & ICJS Quick Launch Button */}
          <button
            onClick={() => onTabChange('gov-portal')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Open CCTNS & ICJS National Law Enforcement Integrations"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span>CCTNS & ICJS</span>
          </button>

          {/* AI Assistant Launcher */}
          <button
            onClick={() => onTabChange('ai-assistant')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ai-assistant'
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
            }`}
            title="Open CyberInstincts AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* HIGH CONTRAST LOGIN BUTTON - Always visible on all screens */}
          <button
            onClick={() => {
              if (onOpenAuth) {
                onOpenAuth('login');
              } else {
                onTabChange('login');
              }
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[36px] ${
              userProfile.isAuthenticated && userProfile.id !== 'usr-guest'
                ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800'
                : 'bg-blue-700 hover:bg-blue-800 text-white border border-blue-700 font-extrabold'
            }`}
            title={
              userProfile.isAuthenticated && userProfile.id !== 'usr-guest'
                ? `Logged in as ${userProfile.fullName || userProfile.username}. Click to open Auth / Switch User.`
                : 'Sign In / Login to CyberInstincts SOC'
            }
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>
              {userProfile.isAuthenticated && userProfile.id !== 'usr-guest'
                ? 'Logged In'
                : 'Login'}
            </span>
          </button>

          {/* Security Score Pill */}
          {typeof securityScore === 'number' && (
            <button
              onClick={onOpenScoreBreakdown}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all shadow-2xs"
              title="View Security Score Analysis"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  securityScore >= 80 ? 'bg-emerald-600' : securityScore >= 60 ? 'bg-amber-600' : 'bg-rose-600'
                }`}
              />
              <span className="text-slate-600">Score:</span>
              <span
                className={`font-bold ${
                  securityScore >= 80 ? 'text-emerald-700' : securityScore >= 60 ? 'text-amber-700' : 'text-rose-700'
                }`}
              >
                {securityScore}%
              </span>
            </button>
          )}

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs cursor-pointer min-h-[36px]"
            title="Security Notifications"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                {unread}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors focus:outline-none shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {userProfile.avatar || (userProfile.fullName ? userProfile.fullName.split(' ').map((n) => n[0]).join('') : 'AV')}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {userProfile.fullName || 'SOC Analyst'}
                </p>
                <p className="text-[10px] font-mono text-cyan-700 font-semibold leading-none">
                  {userProfile.role ? userProfile.role.split(' ')[0] : 'Analyst'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{userProfile.fullName || 'SOC Analyst'}</p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">{userProfile.email || 'soc@cyberinstincts.soc'}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono font-semibold text-emerald-700">Authenticated (MFA active)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onTabChange('login');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Login & Demo Personas</span>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Profile & Security</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenArchitecture();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                    <span>System Architecture</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      if (onLogout) {
                        onLogout();
                      } else {
                        onOpenAuth('login');
                      }
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Secondary Nav Bar for medium and smaller screens */}
      <div className="xl:hidden flex items-center gap-1.5 px-3 py-2 border-t border-slate-200 bg-white overflow-x-auto no-scrollbar">
        {/* Mobile Portal Quick Access */}
        <a
          href="https://digitalpolice.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0 min-h-[36px]"
          title="CCTNS - Crime and Criminal Tracking Network & Systems"
        >
          <Building2 className="w-3 h-3 text-blue-600" />
          <span>CCTNS</span>
          <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
        </a>

        <a
          href="https://icjs.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 min-h-[36px]"
          title="ICJS - Inter-Operable Criminal Justice System"
        >
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>ICJS</span>
          <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
        </a>

        <div className="w-[1px] h-5 bg-slate-200 shrink-0" />

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap shrink-0 min-h-[40px] transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-600'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
