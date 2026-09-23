import React, { useState, useEffect } from 'react';
import { UserProfile, SystemArchitectureInfo } from '../types';
import { apiService } from '../services/api';
import {
  Settings,
  User,
  Shield,
  Bell,
  Cpu,
  KeyRound,
  CheckCircle2,
  Lock,
  Smartphone,
  Save,
  RotateCcw,
  Sparkles,
  Download,
} from 'lucide-react';

interface SettingsPageProps {
  user?: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onShowToast: (message: string, type?: 'info' | 'warning' | 'alert' | 'success') => void;
  onResetData: () => Promise<void>;
  onOpenArchitecture: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateUser,
  onShowToast,
  onResetData,
  onOpenArchitecture,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || 'Atharva Sankhe');
  const [email, setEmail] = useState(user?.email || 'atharva@cyberinstincts.soc');
  const [role, setRole] = useState(user?.role || 'Lead Cybersecurity Analyst');

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
    if (user?.email) setEmail(user.email);
    if (user?.role) setRole(user.role);
  }, [user?.fullName, user?.email, user?.role]);

  // Security preferences
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalIncidentAlerts, setCriticalIncidentAlerts] = useState(true);
  const [fileTamperAlerts, setFileTamperAlerts] = useState(true);
  const [digestReports, setDigestReports] = useState(false);

  // System info
  const [sysInfo, setSysInfo] = useState<SystemArchitectureInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    apiService.getSystemInfo().then(setSysInfo);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    onUpdateUser({
      fullName,
      email,
      role,
    });
    setTimeout(() => {
      setIsSaving(false);
      onShowToast('User profile settings saved successfully', 'success');
    }, 400);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      onShowToast('New passwords do not match', 'warning');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast('Security credentials updated across active SOC session', 'success');
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset demo dataset to default initial state? This resets incidents and files.')) {
      setIsResetting(true);
      await onResetData();
      setIsResetting(false);
      onShowToast('Demo database reset to factory baseline', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
            <Settings className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                SOC Console Settings & Security Preferences
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                User Profile
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your SOC analyst identity, authentication controls, event alerting thresholds, and system architecture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/download-project"
            download="cyberinstincts-project.zip"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Download full project source code archive as .zip"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project (.ZIP)</span>
          </a>

          <button
            onClick={handleResetDefaults}
            disabled={isResetting}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: User Profile */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                User Profile
              </h2>
              <span className="text-[11px] font-mono text-cyan-800 font-bold">SOC Badge #0042</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-800 font-mono font-bold text-xl shadow-xs">
                  {(fullName || 'AS').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{role}</p>
                  <span className="text-[10px] font-mono text-emerald-700 font-medium">Authenticated via PostgreSQL RBAC</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Security Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none font-mono"
                >
                  <option value="Lead Cybersecurity Analyst">Lead Cybersecurity Analyst</option>
                  <option value="SOC Tier 2 Investigator">SOC Tier 2 Investigator</option>
                  <option value="Incident Responder">Incident Responder</option>
                  <option value="External Security Auditor">External Security Auditor</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: Security Settings */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-600" />
              Authentication & Security Settings
            </h2>

            {/* 2FA Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">Hardware Two-Factor Authentication (2FA)</h3>
                  <p className="text-[11px] text-slate-500">Require TOTP hardware token on sign in</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => {
                    setTwoFactorEnabled(e.target.checked);
                    onShowToast(
                      e.target.checked ? '2FA Token Enforcement Activated' : '2FA Token Enforcement Suspended',
                      'info'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-xs after:transition-all peer-checked:after:translate-x-[18px]"></div>
              </label>
            </div>

            {/* Session Timeout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">SOC Session Inactivity Timeout</h3>
                <p className="text-[11px] text-slate-500">Auto-lock console upon prolonged idle detection</p>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none shadow-xs"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
                <option value="240">4 Hours</option>
              </select>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold font-mono text-slate-700 uppercase">Change Access Key</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="New security key"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm new key"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 transition-colors shadow-xs font-semibold"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: Notification Preferences */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-600" />
              Notification & Alert Dispatch Preferences
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/50 transition-colors">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">Critical Incident Immediate Alarm</h3>
                  <p className="text-[11px] text-slate-500">Push high-priority alert and sound alarm on CVSS &ge; 9.0</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={criticalIncidentAlerts}
                    onChange={(e) => setCriticalIncidentAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-xs after:transition-all peer-checked:after:translate-x-[18px]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/50 transition-colors">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">File Modification / Tamper Alarm</h3>
                  <p className="text-[11px] text-slate-500">Instant notification when any enrolled SHA-256 hash deviates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={fileTamperAlerts}
                    onChange={(e) => setFileTamperAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-xs after:transition-all peer-checked:after:translate-x-[18px]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/50 transition-colors">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">Daily Security Audit Digest</h3>
                  <p className="text-[11px] text-slate-500">Dispatch 24-hour summary of resolved incidents and vault health</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={digestReports}
                    onChange={(e) => setDigestReports(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-xs after:transition-all peer-checked:after:translate-x-[18px]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: System Architecture Overview */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-600" />
                System Information
              </h2>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Online</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Platform Version</span>
                <span className="text-slate-900 font-bold">{sysInfo?.version || 'CyberInstincts v2.4.0-SOC'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Python Runtime</span>
                <span className="text-cyan-800 font-bold">{sysInfo?.pythonRuntime || 'Python 3.12 • FastAPI Core'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Database Engine</span>
                <span className="text-emerald-700 font-bold">{sysInfo?.databaseEngine || 'PostgreSQL 16.2 (pgcrypto)'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Hashing Algorithm</span>
                <span className="text-blue-700 font-bold">{sysInfo?.cryptoSuite || 'SHA-256 (NIST FIPS 180-4)'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Operations Suite</span>
                <span className="text-slate-700">Enterprise Security Platform</span>
              </div>
            </div>

            <button
              onClick={onOpenArchitecture}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span>Inspect Full Architecture DDL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
