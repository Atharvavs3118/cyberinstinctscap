import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserProfile } from '../types';
import {
  X,
  Lock,
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  Sparkles,
  Building2,
  Scale,
  ExternalLink,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onLogin: (credentials: { username: string; password?: string }) => Promise<void>;
  onRegister: (payload: { fullName: string; username: string; email: string; password?: string }) => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onLogin,
  onRegister,
  onResetPassword,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('avance.soc');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onLogin({ username, password });
    setSubmitting(false);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setSubmitting(true);
    await onRegister({
      fullName,
      username: regUsername,
      email: regEmail,
      password: regPassword,
    });
    setSubmitting(false);
    onClose();
  };

  const fillDemoAccount = (role: 'lead' | 'student') => {
    if (role === 'lead') {
      setUsername('avance@cyberinstincts.soc');
      setPassword('CyberInstincts2026!');
    } else {
      setUsername('cadet@cyberinstincts.soc');
      setPassword('CyberInstincts2026!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Auth Container */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-white/90 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Form Area */}
        <div className="p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <Logo size="md" showTagline />
            </div>

            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`text-sm font-bold tracking-wide transition-all pb-2 border-b-2 -mb-2.5 ${
                  mode === 'login'
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In to SOC
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`text-sm font-bold tracking-wide transition-all pb-2 border-b-2 -mb-2.5 ${
                  mode === 'register'
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' && !forgotPasswordOpen && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-600" /> Username or Security Email
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. avance.soc"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-600" /> Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-[11px] font-mono text-cyan-700 hover:text-cyan-800 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security key or passphrase"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Remember this SOC console</span>
                  </label>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 hover:from-slate-900 hover:to-indigo-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer border border-slate-700/80 group"
                  >
                    <LogIn className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>{submitting ? 'Authenticating Officer...' : 'Authenticate & Sign In'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      setUsername('avance@cyberinstincts.soc');
                      setPassword('CyberInstincts2026!');
                      setSubmitting(true);
                      await onLogin({ username: 'avance@cyberinstincts.soc', password: 'CyberInstincts2026!' });
                      setSubmitting(false);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-100" />
                    <span>1-Click Instant Demo Login (Lead Analyst)</span>
                  </button>
                </div>

                {/* Demo Quick-Fill Buttons */}
                <div className="pt-2.5 border-t border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-600" /> Or select preset persona credentials:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('lead')}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-cyan-800 font-medium text-left transition-colors cursor-pointer"
                    >
                      Lead SOC Analyst
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('student')}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 font-medium text-left transition-colors cursor-pointer"
                    >
                      Security Auditor
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="jhayes.soc"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jordan@lab.edu"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Password *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Creating Profile...' : 'Create Account'}</span>
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD SIMULATION */}
            {forgotPasswordOpen && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200">
                  <h4 className="text-xs font-bold text-cyan-900 mb-1">Reset Password Protocol</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provide your institutional security email. In a live deployment, an encrypted token will be dispatched.
                  </p>
                </div>

                {forgotSent ? (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password reset token dispatched!
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Check your inbox for cryptographic one-time authorization link.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordOpen(false);
                        setForgotSent(false);
                      }}
                      className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold underline font-mono"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-cyan-600 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(false)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 shadow-2xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!forgotEmail) return;
                          try {
                            if (onResetPassword) {
                              await onResetPassword(forgotEmail);
                            }
                            setForgotSent(true);
                          } catch (err: any) {
                            alert(err?.message || 'Failed to send password reset email');
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm"
                      >
                        Send Reset Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <span className="text-[10px] font-mono text-slate-500">
              CyberInstincts Security Operations Center • Auth Subsystem
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Cybersecurity-Themed Visual (Shield, Nodes, Threat Visualizer) */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-slate-50 via-cyan-50/40 to-slate-100 border-l border-slate-200 relative overflow-hidden">
          {/* Subtle Background Cyber Grid */}
          <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-800 flex items-center gap-1.5 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200 font-semibold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                THREAT SENSOR MESH ACTIVE
              </span>
              <span className="text-[10px] font-mono text-slate-500">FIPS 180-4 SHA-256</span>
            </div>

            {/* Central Graphic: Shield with Digital Nodes */}
            <div className="relative py-6 flex items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-200/40 blur-2xl animate-pulse" />

                {/* Animated Rotating Radar Rings */}
                <div className="absolute inset-2 rounded-full border border-cyan-300/40 animate-spin duration-1000" />
                <div className="absolute inset-6 rounded-full border border-dashed border-blue-300/50" />

                {/* Central Shield Graphic */}
                <div className="relative z-10 p-5 rounded-2xl bg-white border border-cyan-200 shadow-xl shadow-cyan-900/5">
                  <Shield className="w-16 h-16 text-cyan-600" />
                </div>
              </div>
            </div>

            {/* Live Telemetry Feed Simulation */}
            <div className="space-y-2 rounded-xl bg-white/90 border border-slate-200 p-3 font-mono text-[10px] shadow-xs">
              <div className="text-slate-700 font-bold border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>ACTIVE TELEMETRY STREAM</span>
                <span className="text-emerald-700 font-bold">STATUS: PROTECTED</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <p className="truncate">
                  <span className="text-cyan-700 font-semibold">[07:42:19]</span> SHA-256 integrity daemon: 5 files verified
                </p>
                <p className="truncate">
                  <span className="text-amber-700 font-semibold">[07:43:02]</span> SSH port 2222: Fail2ban rule engaged
                </p>
                <p className="truncate">
                  <span className="text-emerald-700 font-semibold">[07:44:11]</span> PostgreSQL DB session authenticated
                </p>
              </div>
            </div>

            {/* National Justice Portals Links */}
            <div className="space-y-1.5 rounded-xl bg-slate-900 text-white p-2.5 font-mono text-[10px] shadow-xs border border-slate-800">
              <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>GOVERNMENT JUSTICE PORTALS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-cyan-200 border border-blue-800">MHA • NCRB</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <a
                  href="https://digitalpolice.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 text-[10px]"
                  title="CCTNS - Crime and Criminal Tracking Network & Systems (digitalpolice.gov.in)"
                >
                  <span className="flex items-center gap-1 font-semibold">
                    <Building2 className="w-3 h-3 text-cyan-400" />
                    <span>CCTNS</span>
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>

                <a
                  href="https://icjs.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 text-[10px]"
                  title="ICJS - Inter-Operable Criminal Justice System (icjs.gov.in)"
                >
                  <span className="flex items-center gap-1 font-semibold">
                    <Scale className="w-3 h-3 text-emerald-400" />
                    <span>ICJS Gateway</span>
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
            <span>SOC Node Alpha</span>
            <span className="font-semibold text-slate-800">Security Index: 92/100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
