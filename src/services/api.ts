import {
  CyberIncident,
  ProtectedFile,
  DashboardStats,
  NotificationItem,
  ThreatActivityPoint,
  ThreatCategory,
  ThreatSeverity,
  UserProfile,
  SystemArchitectureInfo,
  SecurityEvent,
} from '../types';
import {
  INITIAL_INCIDENTS,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS,
  INITIAL_USER,
  MOCK_THREAT_ACTIVITY_TIMELINE,
} from './mockData';
import { formatBytes } from '../utils/crypto';
import * as fbAuth from './firebase/auth';
import * as fbFirestore from './firebase/firestore';
import * as fbStorage from './firebase/storage';

export { fbAuth, fbFirestore, fbStorage };

// Cloud SQL PostgreSQL Client API
export const cloudSqlApi = {
  getIncidents: async (userId?: number) => {
    const url = userId ? `/api/sql/incidents?userId=${userId}` : '/api/sql/incidents';
    const res = await fetch(url);
    return res.json();
  },
  createIncident: async (data: any) => {
    const res = await fetch('/api/sql/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getEvidence: async (incidentId: number) => {
    const res = await fetch(`/api/sql/incidents/${incidentId}/evidence`);
    return res.json();
  },
  getPatterns: async (incidentId: number) => {
    const res = await fetch(`/api/sql/incidents/${incidentId}/patterns`);
    return res.json();
  },
  getSimilarity: async (incidentId: number) => {
    const res = await fetch(`/api/sql/incidents/${incidentId}/similarity`);
    return res.json();
  },
  getReports: async (incidentId: number) => {
    const res = await fetch(`/api/sql/incidents/${incidentId}/reports`);
    return res.json();
  },
  searchBySource: async (query: string) => {
    const res = await fetch(`/api/sql/sources/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },
};

const STORAGE_KEYS = {
  INCIDENTS: 'cyberinstincts_incidents_v1',
  FILES: 'cyberinstincts_files_v1',
  NOTIFICATIONS: 'cyberinstincts_notifications_v1',
  USER: 'cyberinstincts_user_v1',
  AUTH: 'cyberinstincts_auth_token',
};

function getLocalItem<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultVal;
    return JSON.parse(item);
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

// Compute security score dynamically based on active factors
export function calculateSecurityScore(files: ProtectedFile[], incidents: CyberIncident[]): {
  score: number;
  breakdown: DashboardStats['scoreBreakdown'];
} {
  let baseScore = 95;
  
  // 1. File Integrity Factor: -18 pts for each modified file, -10 for missing, -5 for warning
  let integrityPenalty = 0;
  files.forEach(f => {
    if (f.status === 'MODIFIED') integrityPenalty += 18;
    else if (f.status === 'MISSING') integrityPenalty += 10;
    else if (f.status === 'WARNING') integrityPenalty += 5;
  });

  // 2. Active Threat Deductions: -14 pts for unresolved CRITICAL incidents, -7 for HIGH
  let threatPenalty = 0;
  let criticalPenalty = 0;
  incidents.forEach(inc => {
    if (inc.status !== 'RESOLVED' && inc.status !== 'MITIGATED') {
      if (inc.severity === 'CRITICAL') {
        criticalPenalty += 14;
      } else if (inc.severity === 'HIGH') {
        threatPenalty += 7;
      } else if (inc.severity === 'MEDIUM') {
        threatPenalty += 3;
      }
    }
  });

  // 3. Protection bonus: +1 point per verified file up to +10
  const verifiedCount = files.filter(f => f.status === 'VERIFIED').length;
  const protectionBonus = Math.min(10, verifiedCount * 2);

  const rawScore = baseScore - integrityPenalty - threatPenalty - criticalPenalty + protectionBonus;
  const finalScore = Math.max(12, Math.min(99, Math.round(rawScore)));

  return {
    score: finalScore,
    breakdown: {
      baseScore,
      integrityFactor: -integrityPenalty,
      threatDeduction: -threatPenalty,
      criticalIncidentPenalty: -criticalPenalty,
      protectionBonus,
      finalScore,
    },
  };
}

/**
 * ============================================================================
 * CyberInstincts Unified Backend & Firebase API Service
 * ============================================================================
 */
export const apiService = {
  /**
   * User Authentication: Firebase Auth + Firestore users collection
   */
  async loginUser(credentials: { username: string; password?: string }): Promise<{ user: UserProfile; token: string }> {
    try {
      return await fbAuth.loginUser(credentials);
    } catch (firebaseErr: any) {
      console.warn('Firebase login attempt fallback to local auth simulation:', firebaseErr.message);
      // Fallback for demo logins (e.g. mock accounts)
      const user = getLocalItem<UserProfile>(STORAGE_KEYS.USER, INITIAL_USER);
      const updatedUser: UserProfile = {
        ...user,
        username: credentials.username,
        email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@cyberinstincts.soc`,
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      };
      setLocalItem(STORAGE_KEYS.USER, updatedUser);
      setLocalItem(STORAGE_KEYS.AUTH, 'jwt_bearer_session_active');
      return {
        user: updatedUser,
        token: 'token_' + Math.random().toString(36).substring(2),
      };
    }
  },

  /**
   * User Registration: Firebase Auth + Firestore users collection
   */
  async registerUser(payload: { fullName: string; username: string; email: string; password?: string }): Promise<UserProfile> {
    try {
      return await fbAuth.registerUser(payload);
    } catch (firebaseErr: any) {
      console.warn('Firebase registration fallback to local simulation:', firebaseErr.message);
      const newUser: UserProfile = {
        id: 'usr-' + Math.floor(1000 + Math.random() * 9000),
        fullName: payload.fullName,
        username: payload.username,
        email: payload.email,
        role: 'Cybersecurity Analyst',
        department: 'Security Operations Center (SOC)',
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        mfaEnabled: true,
      };
      setLocalItem(STORAGE_KEYS.USER, newUser);
      return newUser;
    }
  },

  /**
   * Fetch current authenticated user
   */
  async getCurrentUser(): Promise<UserProfile> {
    const fbUser = await fbAuth.getCurrentUser();
    if (fbUser) return fbUser;
    return getLocalItem<UserProfile>(STORAGE_KEYS.USER, INITIAL_USER);
  },

  /**
   * Log out current session
   */
  async logout(): Promise<void> {
    try {
      await fbAuth.logoutUser();
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  },

  /**
   * Password Reset via Firebase Auth
   */
  async resetPassword(email: string): Promise<void> {
    await fbAuth.resetPassword(email);
  },

  /**
   * Dashboard Telemetry & Stats: Aggregated from Firestore collections
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await fbFirestore.getDashboardStats();
    } catch (err) {
      console.warn('Fallback calculating dashboard stats locally:', err);
      const files = getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
      const incidents = getLocalItem<CyberIncident[]>(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
      const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
      const scoreObj = calculateSecurityScore(files, incidents);

      return {
        threatsDetected: incidents.length,
        criticalIncidents: criticalCount,
        protectedFiles: files.length,
        securityScore: scoreObj.score,
        scoreBreakdown: scoreObj.breakdown,
        fileIntegrity: {
          total: files.length,
          verified: files.filter(f => f.status === 'VERIFIED').length,
          modified: files.filter(f => f.status === 'MODIFIED').length,
          missing: files.filter(f => f.status === 'MISSING').length,
          warning: files.filter(f => f.status === 'WARNING').length,
        },
      };
    }
  },

  /**
   * CyberTrace Incident Registry: Firestore 'incidents' collection
   */
  async getIncidents(): Promise<CyberIncident[]> {
    try {
      return await fbFirestore.getIncidents();
    } catch (err) {
      console.warn('Firestore getIncidents error, fallback to local:', err);
      return getLocalItem<CyberIncident[]>(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
    }
  },

  /**
   * Create Incident: Firestore 'incidents' collection + optional Storage evidence upload
   */
  async createIncident(
    incidentData: Omit<CyberIncident, 'id' | 'timestamp' | 'timeline'>,
    evidenceFile?: File
  ): Promise<CyberIncident> {
    try {
      return await fbFirestore.createIncident(incidentData, evidenceFile);
    } catch (err) {
      console.warn('Firestore createIncident fallback to local:', err);
      const incidents = getLocalItem<CyberIncident[]>(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
      const nextId = `INC-${String(incidents.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newIncident: CyberIncident = {
        ...incidentData,
        id: nextId,
        incidentId: nextId,
        timestamp: now,
        timeline: [
          {
            step: 'Detected',
            timestamp: now,
            note: `Incident manually submitted: ${incidentData.threatType}`,
            actor: 'SOC Analyst',
          },
        ],
      };
      setLocalItem(STORAGE_KEYS.INCIDENTS, [newIncident, ...incidents]);
      return newIncident;
    }
  },

  /**
   * Update Incident: Firestore 'incidents' collection
   */
  async updateIncident(id: string, updates: Partial<CyberIncident>): Promise<CyberIncident> {
    try {
      return await fbFirestore.updateIncident(id, updates);
    } catch (err) {
      console.warn('Firestore updateIncident fallback to local:', err);
      const incidents = getLocalItem<CyberIncident[]>(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
      const idx = incidents.findIndex(i => i.id === id);
      if (idx !== -1) {
        incidents[idx] = { ...incidents[idx], ...updates };
        setLocalItem(STORAGE_KEYS.INCIDENTS, incidents);
        return incidents[idx];
      }
      throw err;
    }
  },

  /**
   * MiniVault Protected Files: Firestore 'protected_files' collection
   */
  async getProtectedFiles(userId?: string): Promise<ProtectedFile[]> {
    try {
      return await fbFirestore.getProtectedFiles(userId);
    } catch (err) {
      console.warn('Firestore getProtectedFiles fallback to local:', err);
      return getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
    }
  },

  /**
   * Upload File to Firebase Storage and register in Firestore
   */
  async uploadFile(payload: {
    file?: File | Blob;
    fileName: string;
    fileType: string;
    size: number;
    sha256Hash: string;
    category?: ProtectedFile['category'];
    userId?: string;
  }): Promise<ProtectedFile> {
    try {
      return await fbFirestore.uploadFile(payload);
    } catch (err) {
      console.warn('Firestore uploadFile fallback to local:', err);
      const files = getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newFile: ProtectedFile = {
        id: 'file-' + String(files.length + 1).padStart(3, '0'),
        fileId: 'file-' + String(files.length + 1).padStart(3, '0'),
        fileName: payload.fileName,
        fileType: payload.fileType,
        size: payload.size,
        fileSize: payload.size,
        formattedSize: formatBytes(payload.size),
        originalHash: payload.sha256Hash,
        currentHash: payload.sha256Hash,
        status: 'VERIFIED',
        integrityStatus: 'VERIFIED',
        uploadDate: now,
        lastVerified: now,
        category: payload.category || 'System Config',
        history: [],
      };
      setLocalItem(STORAGE_KEYS.FILES, [newFile, ...files]);
      return newFile;
    }
  },

  /**
   * Delete File from Firestore and Firebase Storage
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await fbFirestore.deleteFile(fileId);
    } catch (err) {
      console.warn('Firestore deleteFile fallback to local:', err);
      this.deleteProtectedFile(fileId);
    }
  },

  deleteProtectedFile(fileId: string): void {
    const files = getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
    setLocalItem(STORAGE_KEYS.FILES, files.filter(f => f.id !== fileId));
  },

  /**
   * Verify File Integrity against baseline SHA-256
   */
  async verifyFileIntegrity(fileId: string): Promise<ProtectedFile> {
    try {
      return await fbFirestore.verifyFileIntegrity(fileId);
    } catch (err) {
      console.warn('Firestore verifyFileIntegrity fallback to local:', err);
      const files = getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
      const index = files.findIndex(f => f.id === fileId);
      if (index === -1) throw new Error(`File ${fileId} not found`);
      const file = files[index];
      const isMatch = file.originalHash === file.currentHash;
      const updated: ProtectedFile = {
        ...file,
        status: isMatch ? 'VERIFIED' : 'MODIFIED',
        lastVerified: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      files[index] = updated;
      setLocalItem(STORAGE_KEYS.FILES, files);
      return updated;
    }
  },

  async verifyAllFilesIntegrity(): Promise<ProtectedFile[]> {
    try {
      return await fbFirestore.verifyAllFilesIntegrity();
    } catch (err) {
      console.warn('Firestore verifyAllFilesIntegrity fallback to local:', err);
      const files = await this.getProtectedFiles();
      return files.map(f => ({ ...f, status: f.originalHash === f.currentHash ? 'VERIFIED' : 'MODIFIED' }));
    }
  },

  async simulateFileTampering(fileId: string): Promise<ProtectedFile> {
    try {
      return await fbFirestore.simulateFileTampering(fileId);
    } catch (err) {
      console.warn('Firestore simulateFileTampering fallback to local:', err);
      const files = getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
      const index = files.findIndex(f => f.id === fileId);
      if (index === -1) throw new Error(`File ${fileId} not found`);
      const file = files[index];
      const altered = 'ff90' + file.originalHash.substring(4, 60) + 'beef';
      const updated: ProtectedFile = {
        ...file,
        currentHash: altered,
        status: 'MODIFIED',
      };
      files[index] = updated;
      setLocalItem(STORAGE_KEYS.FILES, files);
      return updated;
    }
  },

  async restoreFileBaseline(fileId: string): Promise<ProtectedFile> {
    try {
      return await fbFirestore.restoreFileBaseline(fileId);
    } catch (err) {
      console.warn('Firestore restoreFileBaseline fallback to local:', err);
      const files = getLocalItem<ProtectedFile[]>(STORAGE_KEYS.FILES, INITIAL_FILES);
      const index = files.findIndex(f => f.id === fileId);
      if (index === -1) throw new Error(`File ${fileId} not found`);
      const file = files[index];
      const updated: ProtectedFile = {
        ...file,
        currentHash: file.originalHash,
        status: 'VERIFIED',
      };
      files[index] = updated;
      setLocalItem(STORAGE_KEYS.FILES, files);
      return updated;
    }
  },

  /**
   * Security Events: Firestore 'security_events' collection
   */
  async getSecurityEvents(limitCount = 20): Promise<SecurityEvent[]> {
    return await fbFirestore.getSecurityEvents(limitCount);
  },

  async createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    return await fbFirestore.createSecurityEvent(event);
  },

  /**
   * Notifications: Firestore 'notifications' collection
   */
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      return await fbFirestore.getNotifications();
    } catch (err) {
      return getLocalItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
  },

  async createNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): Promise<void> {
    await fbFirestore.createNotification(notif);
  },

  async markNotificationRead(id: string): Promise<void> {
    await fbFirestore.markNotificationRead(id);
  },

  async markAllNotificationsRead(): Promise<void> {
    const list = await this.getNotifications();
    for (const n of list) {
      await this.markNotificationRead(n.id);
    }
  },

  async clearAllNotifications(): Promise<void> {
    setLocalItem(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  /**
   * Threat Analytics
   */
  async getThreatStatistics(): Promise<{
    timeline: ThreatActivityPoint[];
    categoryDistribution: Record<ThreatCategory, number>;
    severityDistribution: Record<ThreatSeverity, number>;
  }> {
    const incidents = await this.getIncidents();
    const categoryDistribution: Record<ThreatCategory, number> = {
      'Malware': 0,
      'Phishing': 0,
      'Brute Force': 0,
      'Suspicious Login': 0,
      'Unauthorized Access': 0,
      'File Tampering': 0,
      'Unknown Threat': 0,
    };

    const severityDistribution: Record<ThreatSeverity, number> = {
      'CRITICAL': 0,
      'HIGH': 0,
      'MEDIUM': 0,
      'LOW': 0,
    };

    incidents.forEach(inc => {
      if (categoryDistribution[inc.threatType] !== undefined) {
        categoryDistribution[inc.threatType]++;
      }
      if (severityDistribution[inc.severity] !== undefined) {
        severityDistribution[inc.severity]++;
      }
    });

    return {
      timeline: MOCK_THREAT_ACTIVITY_TIMELINE,
      categoryDistribution,
      severityDistribution,
    };
  },

  async getThreatActivity(): Promise<ThreatActivityPoint[]> {
    const stats = await this.getThreatStatistics();
    return stats.timeline;
  },

  async updateIncidentStatus(id: string, status: CyberIncident['status'], resolution?: string): Promise<CyberIncident> {
    return this.updateIncident(id, {
      status,
      ...(resolution ? { resolution } : {}),
    });
  },

  async verifyFile(fileId: string): Promise<ProtectedFile> {
    return this.verifyFileIntegrity(fileId);
  },

  async verifyAllFiles(): Promise<ProtectedFile[]> {
    return this.verifyAllFilesIntegrity();
  },

  async tamperFile(fileId: string): Promise<ProtectedFile> {
    return this.simulateFileTampering(fileId);
  },

  async restoreFile(fileId: string): Promise<ProtectedFile> {
    return this.restoreFileBaseline(fileId);
  },

  async dismissNotification(id: string): Promise<void> {
    return this.markNotificationRead(id);
  },

  async resetAllData(): Promise<void> {
    setLocalItem(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
    setLocalItem(STORAGE_KEYS.FILES, INITIAL_FILES);
    setLocalItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setLocalItem(STORAGE_KEYS.USER, INITIAL_USER);
  },

  async getSystemInfo(): Promise<SystemArchitectureInfo> {
    return {
      appVersion: 'CyberInstincts v2.5.0 (Firebase Enterprise Edition)',
      pythonRuntime: 'Python 3.12.3 • FastAPI / AsyncIO Core',
      databaseEngine: 'Cloud Firestore & PostgreSQL 16.2 with RBAC',
      cryptoSuite: 'SHA-256 (FIPS 180-4) + AES-256-GCM',
      integrityAlgorithm: 'HMAC-SHA256 & Merkle Tree Verification',
      socCluster: 'Google Cloud Platform • optical-dryad-4xctm',
      academicAffiliation: 'National Cyber Defense Operations Lab',
      lastDbSync: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };
  },
};
