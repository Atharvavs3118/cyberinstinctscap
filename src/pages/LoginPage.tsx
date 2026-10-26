import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  AlertCircle,
  HelpCircle,
  X,
  LogIn,
  Database,
  RefreshCw,
  Clock,
  History,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, LoginLogEntry } from '../types';
import {
  loginUser,
  registerUser,
  signInWithGoogle,
  getRecentLoginLogs,
  getFirestoreConnectionInfo,
  DEMO_USERS,
} from '../services/firebase/auth';

interface LoginPageProps {
  currentUser?: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onNavigateToTab: (tab: any) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onNavigateToTab,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Lead Cybersecurity Analyst');
  const [department, setDepartment] = useState('SOC Operational Command');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Firestore live logs & database state
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(true);
  const dbInfo = getFirestoreConnectionInfo();

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await getRecentLoginLogs(6);
      setLoginLogs(logs);
    } catch (err) {
      console.warn('Failed to load login logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Handle standard login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ username: email, password });
      onLoginSuccess(res.user);
      onShowToast(`Authentication verified in Firestore. Welcome, ${res.user.fullName}!`, 'success');
      loadLogs();
      onNavigateToTab('dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      onShowToast(msg, 'error');
      loadLogs();
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      onLoginSuccess(res.user);
      onShowToast(`Google authenticated. Profile synced in Firestore: ${res.user.fullName}`, 'success');
      loadLogs();
      onNavigateToTab('dashboard');
    } catch (err: any) {
      // Don't show scary error if user closed the popup
      if (err?.code === 'auth/popup-closed-by-user') {
        onShowToast('Google sign-in window was cancelled.', 'info');
      } else {
        const msg = err?.message || 'Google authentication failed.';
        setError(msg);
        onShowToast(msg, 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const username = email.split('@')[0] || 'analyst';
      const user = await registerUser({
        fullName,
        username,
        email,
        password,
        role,
        department,
      });
      onLoginSuccess(user);
      onShowToast(`Officer profile created and stored in Firestore for ${user.fullName}!`, 'success');
      loadLogs();
      onNavigateToTab('dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Check password requirements.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Officer Persona Sign-In
  const handleSelectPreset = async (presetUser: (typeof DEMO_USERS)[0]) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser({
        username: presetUser.email,
        password: presetUser.password,
      });
      onLoginSuccess(res.user);
      onShowToast(`Authenticated as ${res.user.fullName} (${res.user.role}) - Firestore session active`, 'success');
      loadLogs();
      onNavigateToTab('dashboard');
    } catch (err: any) {
      onShowToast('Could not load preset persona: ' + (err?.message || 'Error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotSuccess(false);
      onShowToast(`Password recovery link dispatched to ${forgotEmail}`, 'info');
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      {/* Active Session Notification if already authenticated */}
      {currentUser && currentUser.isAuthenticated && currentUser.id !== 'usr-guest' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.avatar || currentUser.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-950">
                  {currentUser.fullName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ACTIVE SESSION
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                {currentUser.role} • {currentUser.email}
              </p>
              {currentUser.firestoreDocRef && (
                <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                  Firestore Ref: {currentUser.firestoreDocRef}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('dashboard')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Branding & Firestore Indicator */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 mb-1">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            CyberInstincts Security Console
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Authorized Officer Sign In • Firebase Authentication & Firestore Database
          </p>

          {/* Live Firestore DB Badge */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-slate-700">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>DB: <strong className="text-slate-900">{dbInfo.databaseId.substring(0, 24)}...</strong></span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Firestore Live
            </span>
          </div>
        </div>

        {/* Google One-Click Login Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Sign In with Google Account'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400">
              <span className="bg-white px-2 font-mono">or continue with official officer ID</span>
            </div>
          </div>
        </div>

        {/* Moderate Segmented Tabs: Sign In / Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
            className={`py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Officer Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Officer Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. atharva@cyberinstincts.soc"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter security key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Syncs to Firestore</span>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Verifying Credentials...' : 'Sign In to Console'}</span>
            </button>
          </form>
        )}

        {/* REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Atharva Sankhe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Security Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="officer@cyberinstincts.soc"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Duty Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                >
                  <option value="Lead Cybersecurity Analyst">Lead Cybersecurity Analyst</option>
                  <option value="Government Liaison Officer (CERT-In)">Government Liaison Officer (CERT-In)</option>
                  <option value="Forensic Cryptographic Investigator">Forensic Cryptographic Investigator</option>
                  <option value="Junior Security Auditor">Junior Security Auditor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Unit
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. SOC Threat Intel"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create strong passphrase (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? 'Creating in Firestore...' : 'Store & Register Officer in Firestore'}</span>
            </button>
          </form>
        )}

        {/* Quick 1-Click Indian Officer Personas */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>1-Click Authorized Officer Login:</span>
            </span>
            <span className="text-[11px] text-blue-700 font-semibold font-mono">Auto-Synced</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_USERS.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleSelectPreset(persona)}
                disabled={loading || googleLoading}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-200 text-left transition-all cursor-pointer group"
                title={`Sign in immediately as ${persona.fullName}`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {persona.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                    {persona.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {persona.role}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Badge Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium font-mono">
          <span>NIST FIPS 180-4 SHA-256</span>
          <span>Firestore: {dbInfo.databaseId.substring(0, 16)}...</span>
        </div>
      </div>

      {/* Live Firestore Stored Login Information & Audit Trail Card */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                Firestore Stored Authentication Logs
              </h2>
              <p className="text-[10px] text-slate-500">
                Live stream from collection: <code className="text-blue-600 font-mono">login_logs</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loadingLogs}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh Firestore Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {showAuditLogs ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {showAuditLogs && (
          <div className="space-y-2">
            {loginLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                {loadingLogs ? 'Reading authentication records from Firestore...' : 'No external logins stored yet. Log in to record first session.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {loginLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  const isLogout = log.status === 'LOGOUT';
                  return (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : isLogout
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isSuccess ? 'OK' : isLogout ? 'OUT' : 'ERR'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-[11px]">
                            {log.fullName || log.email}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-mono">{log.email}</span>
                            <span>•</span>
                            <span className="capitalize">{log.provider || 'email'}</span>
                            {log.ipAddress && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-400">{log.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : isLogout
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{log.timestamp ? log.timestamp.split(' ')[1] || log.timestamp : 'Recent'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Password Recovery
              </h3>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recovery instructions dispatched!</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your official email address to receive an authorized security reset link via Firebase Auth.
                </p>
                <input
                  type="email"
                  required
                  placeholder="officer@cyberinstincts.soc"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
