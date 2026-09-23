import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardStats,
  CyberIncident,
  ProtectedFile,
  ThreatActivityPoint,
  SocNotification,
  UserProfile,
  NavigationTab,
  SecurityEvent,
} from './types';
import { apiService } from './services/api';
import { onAuthChange } from './services/firebase/auth';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { IncidentDetailsModal } from './components/IncidentDetailsModal';
import { FileDetailsModal } from './components/FileDetailsModal';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { UploadFileModal } from './components/UploadFileModal';
import { AuthModal } from './components/AuthModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal';
import { Toast, ToastItem } from './components/Toast';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CyberTracePage } from './pages/CyberTracePage';
import { MiniVaultPage } from './pages/MiniVaultPage';
import { ThreatAnalysisPage } from './pages/ThreatAnalysisPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { GovernmentPortalPage } from './pages/GovernmentPortalPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Application Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<CyberIncident[]>([]);
  const [files, setFiles] = useState<ProtectedFile[]>([]);
  const [activityData, setActivityData] = useState<ThreatActivityPoint[]>([]);
  const [notifications, setNotifications] = useState<SocNotification[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [user, setUser] = useState<UserProfile>({
    id: 'usr-001',
    username: 'atharva.soc',
    fullName: 'Atharva Sankhe',
    email: 'atharva@cyberinstincts.soc',
    role: 'Lead Cybersecurity Analyst',
    avatar: 'AS',
    isAuthenticated: true,
  });

  // Listen for persistent Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.id,
          username: firebaseUser.username || firebaseUser.email.split('@')[0],
          fullName: firebaseUser.fullName || (firebaseUser as any).displayName || 'SOC Analyst',
          email: firebaseUser.email,
          role: firebaseUser.role || 'Cybersecurity Analyst',
          avatar: (firebaseUser.fullName || firebaseUser.email).substring(0, 2).toUpperCase(),
          isAuthenticated: true,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Modal / Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<CyberIncident | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProtectedFile | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [scoreBreakdownOpen, setScoreBreakdownOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Data Loading
  const refreshAllData = useCallback(async () => {
    try {
      const [s, inc, f, act, notifs, evts] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getIncidents(),
        apiService.getProtectedFiles(),
        apiService.getThreatActivity(),
        apiService.getNotifications(),
        apiService.getSecurityEvents(10),
      ]);
      setStats(s);
      setIncidents(inc);
      setFiles(f);
      setActivityData(act);
      setNotifications(notifs);
      setSecurityEvents(evts);
    } catch (err) {
      console.error('Failed to load CyberInstincts telemetry:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handler: Update Incident Status / Resolution
  const handleUpdateIncidentStatus = async (
    id: string,
    status: CyberIncident['status'],
    resolution?: string
  ) => {
    try {
      const updated = await apiService.updateIncidentStatus(id, status, resolution);
      if (updated) {
        setSelectedIncident(updated);
        addToast(`Incident ${id} updated to ${status}`, 'success');
        refreshAllData();
      }
    } catch (err) {
      addToast('Failed to update incident', 'alert');
    }
  };

  // Handler: Verify Single File
  const handleVerifyFile = async (id: string) => {
    try {
      const result = await apiService.verifyFile(id);
      if (result) {
        if (selectedFile && selectedFile.id === id) {
          setSelectedFile(result);
        }
        if (result.status === 'VERIFIED') {
          addToast(`Integrity check PASSED for ${result.fileName}`, 'success');
        } else {
          addToast(`Integrity check MISMATCH for ${result.fileName}!`, 'alert');
        }
        refreshAllData();
      }
    } catch (err) {
      addToast('Failed to verify file hash', 'alert');
    }
  };

  // Handler: Verify All Files
  const handleVerifyAllFiles = async () => {
    try {
      const results = await apiService.verifyAllFiles();
      const modifiedCount = results.filter((r) => r.status === 'MODIFIED').length;
      if (modifiedCount > 0) {
        addToast(
          `Verification complete: ${results.length - modifiedCount} verified, ${modifiedCount} hash deviations detected!`,
          'warning'
        );
      } else {
        addToast(`Integrity sweep complete: All ${results.length} protected files verified intact`, 'success');
      }
      refreshAllData();
    } catch (err) {
      addToast('Integrity sweep failed', 'alert');
    }
  };

  // Handler: Tamper File (Academic Simulation)
  const handleTamperFile = async (id: string) => {
    try {
      const result = await apiService.tamperFile(id);
      if (result) {
        if (selectedFile && selectedFile.id === id) {
          setSelectedFile(result);
        }
        addToast(
          `[SIMULATION] Modified 1 byte in ${result.fileName}. Cryptographic hash altered!`,
          'alert'
        );
        refreshAllData();
      }
    } catch (err) {
      addToast('Tamper simulation failed', 'alert');
    }
  };

  // Handler: Restore File Baseline
  const handleRestoreFile = async (id: string) => {
    try {
      const result = await apiService.restoreFile(id);
      if (result) {
        if (selectedFile && selectedFile.id === id) {
          setSelectedFile(result);
        }
        addToast(`Restored baseline SHA-256 for ${result.fileName}`, 'success');
        refreshAllData();
      }
    } catch (err) {
      addToast('Restore baseline failed', 'alert');
    }
  };

  // Handler: Submit Incident
  const handleCreateIncident = async (data: Parameters<typeof apiService.createIncident>[0]) => {
    try {
      const newInc = await apiService.createIncident(data);
      addToast(`Incident ${newInc.id} logged and prioritized in triage queue`, 'warning');
      refreshAllData();
    } catch (err) {
      addToast('Failed to submit incident', 'alert');
    }
  };

  // Handler: Upload Protected File
  const handleUploadFile = async (data: Parameters<typeof apiService.uploadFile>[0]) => {
    try {
      const newFile = await apiService.uploadFile(data);
      addToast(`File ${newFile.fileName} enrolled with baseline SHA-256`, 'success');
      refreshAllData();
    } catch (err) {
      addToast('Failed to enroll file', 'alert');
    }
  };

  // Handler: Notification Dismissal
  const handleDismissNotification = async (id: string) => {
    await apiService.dismissNotification(id);
    refreshAllData();
  };

  // Handler: Notification Clear All
  const handleClearAllNotifications = async () => {
    await apiService.clearAllNotifications();
    refreshAllData();
  };

  // Handler: Delete Protected File
  const handleDeleteFile = async (id: string) => {
    try {
      await apiService.deleteFile(id);
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
      addToast('File removed from MiniVault', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Failed to delete file', 'alert');
    }
  };

  // Handler: User Login
  const handleUserLogin = async (credentials: { username: string; password?: string }) => {
    try {
      const res = await apiService.loginUser(credentials);
      setUser({
        ...res.user,
        isAuthenticated: true,
      });
      addToast(`Authenticated as ${res.user.fullName || res.user.username}`, 'success');
      refreshAllData();
    } catch (err: any) {
      addToast(err?.message || 'Authentication failed', 'alert');
    }
  };

  // Handler: User Register
  const handleUserRegister = async (payload: { fullName: string; username: string; email: string; password?: string }) => {
    try {
      const newUser = await apiService.registerUser(payload);
      setUser({
        ...newUser,
        isAuthenticated: true,
      });
      addToast(`Account created for ${newUser.fullName || newUser.username}. Welcome to SOC console.`, 'success');
      refreshAllData();
    } catch (err: any) {
      addToast(err?.message || 'Registration failed', 'alert');
    }
  };

  // Handler: User Logout
  const handleUserLogout = async () => {
    await apiService.logout();
    setUser({
      id: 'usr-guest',
      username: 'guest.evaluator',
      fullName: 'Guest Evaluator',
      email: 'guest@cyberinstincts.soc',
      role: 'Observing Analyst',
      avatar: 'GE',
      isAuthenticated: false,
    });
    addToast('Signed out of SOC console', 'info');
  };

  // Handler: Forgot Password Reset
  const handleResetPassword = async (email: string) => {
    try {
      await apiService.resetPassword(email);
      addToast(`Password reset link dispatched to ${email}`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to send reset link', 'alert');
    }
  };

  // Reset Demo DB
  const handleResetData = async () => {
    await apiService.resetAllData();
    refreshAllData();
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-cyan-600 font-mono text-sm">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="tracking-widest uppercase text-xs text-slate-600 font-semibold">Booting CyberInstincts SOC Mesh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* Toast Notification Stack */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Main Global Header */}
      <Header
        activeTab={currentTab}
        onTabChange={setCurrentTab}
        unreadNotificationCount={notifications.filter((n) => !n.read).length}
        unreadCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setDrawerOpen(true)}
        securityScore={stats.securityScore}
        onOpenScoreBreakdown={() => setScoreBreakdownOpen(true)}
        user={user}
        currentUser={user}
        onLogout={handleUserLogout}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenArchitecture={() => setArchitectureOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardPage
            stats={stats}
            incidents={incidents}
            files={files}
            activityData={activityData}
            securityEvents={securityEvents}
            onInspectIncident={(inc) => setSelectedIncident(inc)}
            onInspectFile={(f) => setSelectedFile(f)}
            onOpenReportIncident={() => setReportModalOpen(true)}
            onOpenUploadFile={() => setUploadModalOpen(true)}
            onVerifyAllFiles={handleVerifyAllFiles}
            onOpenScoreDetails={() => setScoreBreakdownOpen(true)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'cybertrace' && (
          <CyberTracePage
            incidents={incidents}
            onInspectIncident={(inc) => setSelectedIncident(inc)}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}

        {currentTab === 'minivault' && (
          <MiniVaultPage
            files={files}
            onInspectFile={(f) => setSelectedFile(f)}
            onOpenUploadModal={() => setUploadModalOpen(true)}
            onVerifyFile={handleVerifyFile}
            onVerifyAllFiles={handleVerifyAllFiles}
            onTamperFile={handleTamperFile}
            onRestoreFile={handleRestoreFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {currentTab === 'threat-analysis' && (
          <ThreatAnalysisPage
            incidents={incidents}
            activityData={activityData}
            onInspectIncident={(inc) => setSelectedIncident(inc)}
            onFilterSourceIp={(ip) => {
              setCurrentTab('cybertrace');
            }}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsPage
            stats={stats}
            incidents={incidents}
            files={files}
            onInspectIncident={(inc) => setSelectedIncident(inc)}
            onInspectFile={(f) => setSelectedFile(f)}
          />
        )}

        {currentTab === 'gov-portal' && (
          <GovernmentPortalPage
            incidents={incidents}
            files={files}
            onShowToast={addToast}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <AIAssistantPage
            incidents={incidents}
            files={files}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage
            currentUser={user}
            onLoginSuccess={(loggedUser) => setUser(loggedUser)}
            onLogout={handleUserLogout}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onShowToast={addToast}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            user={user}
            onUpdateUser={(updated) => {
              setUser((prev) => ({ ...prev, ...updated }));
            }}
            onShowToast={addToast}
            onResetData={handleResetData}
            onOpenArchitecture={() => setArchitectureOpen(true)}
          />
        )}
      </main>

      {/* Global Modals */}

      {/* 1. Incident Details Modal */}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          isOpen={Boolean(selectedIncident)}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateIncidentStatus}
          onOpenGovPortal={() => {
            setSelectedIncident(null);
            setCurrentTab('gov-portal');
          }}
        />
      )}

      {/* 2. File Details Modal */}
      {selectedFile && (
        <FileDetailsModal
          file={selectedFile}
          isOpen={Boolean(selectedFile)}
          onClose={() => setSelectedFile(null)}
          onVerify={handleVerifyFile}
          onTamper={handleTamperFile}
          onRestore={handleRestoreFile}
          onDelete={handleDeleteFile}
        />
      )}

      {/* 3. Report Incident Modal */}
      {reportModalOpen && (
        <ReportIncidentModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleCreateIncident}
        />
      )}

      {/* 4. Upload File Modal */}
      {uploadModalOpen && (
        <UploadFileModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onFileUploaded={handleUploadFile}
        />
      )}

      {/* 5. Auth Modal (Login / Register) */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onLogin={handleUserLogin}
          onRegister={handleUserRegister}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* 6. Architecture Inspector Modal */}
      {architectureOpen && (
        <ArchitectureModal
          isOpen={architectureOpen}
          onClose={() => setArchitectureOpen(false)}
        />
      )}

      {/* 7. Score Breakdown Modal */}
      {scoreBreakdownOpen && (
        <ScoreBreakdownModal
          isOpen={scoreBreakdownOpen}
          onClose={() => setScoreBreakdownOpen(false)}
          score={stats.securityScore}
          breakdown={stats.scoreBreakdown}
          files={files}
          incidents={incidents}
          onNavigateToTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* 8. Notification Drawer */}
      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onDismissNotification={handleDismissNotification}
        onClearAll={handleClearAllNotifications}
        onSelectIncident={(incId) => {
          const found = incidents.find((i) => i.id === incId);
          if (found) {
            setSelectedIncident(found);
            setDrawerOpen(false);
          }
        }}
        onSelectFile={(fileId) => {
          const found = files.find((f) => f.id === fileId);
          if (found) {
            setSelectedFile(found);
            setDrawerOpen(false);
          }
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-8 text-[11px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">CYBERINSTINCTS SOC CONSOLE</span>
          <span className="text-slate-300">•</span>
          <span>NIST FIPS 180-4 SHA-256</span>
          <span className="text-slate-300">•</span>
          <span>PostgreSQL 16.2</span>
        </div>

        <div>
          <span className="text-slate-500">Cyber Threat & File Protection Operations Platform</span>
        </div>
      </footer>
    </div>
  );
}
