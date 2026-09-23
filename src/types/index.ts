export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 'INVESTIGATING' | 'RESOLVED' | 'MONITORING' | 'MITIGATED';

export type ThreatCategory = 
  | 'Malware'
  | 'Phishing'
  | 'Brute Force'
  | 'Suspicious Login'
  | 'Unauthorized Access'
  | 'File Tampering'
  | 'Unknown Threat';

export interface IncidentTimelineStep {
  step: 'Detected' | 'Analyzed' | 'Investigating' | 'Mitigated' | 'Resolved';
  timestamp: string;
  note: string;
  actor: string;
}

export interface CyberIncident {
  id: string;
  incidentId?: string; // Firebase alias
  userId?: string;     // Firebase user ownership
  threatType: ThreatCategory;
  sourceIp: string;
  source?: string;     // Alias for sourceIp
  target: string;
  severity: ThreatSeverity;
  status: IncidentStatus;
  timestamp: string;
  description: string;
  detectionMethod: string;
  evidence?: string;
  evidenceUrl?: string; // Firebase Storage Evidence URL
  resolution?: string;
  cvssScore?: number;
  timeline: IncidentTimelineStep[];
  mitreTactic?: string;
}

export type FileIntegrityStatus = 'VERIFIED' | 'MODIFIED' | 'MISSING' | 'WARNING';

export interface IntegrityCheckLog {
  timestamp: string;
  result: 'MATCH' | 'MISMATCH' | 'ERROR';
  originalHash: string;
  calculatedHash: string;
  verifiedBy: string;
}

export interface ProtectedFile {
  id: string;
  fileId?: string; // Firebase alias
  userId?: string; // Firebase user ownership
  fileName: string;
  fileType: string;
  size: number;
  fileSize?: number; // Firebase alias
  formattedSize: string;
  originalHash: string;
  currentHash: string;
  sha256Hash?: string; // Firebase field
  storageUrl?: string; // Firebase Storage Download URL
  downloadUrl?: string; // Direct download link
  storagePath?: string; // Storage path in bucket
  status: FileIntegrityStatus;
  integrityStatus?: FileIntegrityStatus; // Firebase alias
  uploadDate: string;
  lastVerified: string;
  history: IntegrityCheckLog[];
  category?: 'System Config' | 'Credentials' | 'Audit Log' | 'Source Code' | 'Database Dump' | 'Certificate';
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  eventType: string;
  description: string;
  ip: string;
  ipAddress?: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  metadata?: Record<string, any>;
}

export interface SecurityScoreBreakdown {
  baseScore: number;
  integrityFactor: number;
  threatDeduction: number;
  criticalIncidentPenalty: number;
  protectionBonus: number;
  finalScore: number;
}

export interface DashboardStats {
  threatsDetected: number;
  criticalIncidents: number;
  protectedFiles: number;
  securityScore: number;
  scoreBreakdown: SecurityScoreBreakdown;
  fileIntegrity: {
    total: number;
    verified: number;
    modified: number;
    missing: number;
    warning: number;
  };
  recentEvents?: SecurityEvent[];
}

export interface ThreatActivityPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface NotificationItem {
  id: string;
  type: 'critical_threat' | 'file_modified' | 'new_incident' | 'verification_complete' | 'suspicious_activity';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'critical' | 'warning' | 'safe' | 'info';
  targetUrl?: string;
  entityId?: string;
}

export type SocNotification = NotificationItem;

export type NavigationTab = 
  | 'dashboard' 
  | 'cybertrace' 
  | 'minivault' 
  | 'threat-analysis' 
  | 'reports' 
  | 'gov-portal' 
  | 'ai-assistant' 
  | 'login' 
  | 'settings';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
  suggestedActions?: string[];
  incidentContextId?: string;
  fileContextId?: string;
}

export interface GovernmentReport {
  id: string;
  reportRef: string;
  incidentId: string;
  agencyTarget: 'CERT-In' | 'CISA' | 'NCIIPC' | 'Interpol Cyber' | 'State Cyber Cell';
  reportingAgency: string;
  criticalSector: 'Defense & Aerospace' | 'Banking & Finance' | 'Energy & Utilities' | 'Healthcare' | 'Telecommunications' | 'Government IT';
  incidentTitle: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  mandatedWindowHours: number;
  reportedAt: string;
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'DIRECTIVE_ISSUED' | 'CLOSED';
  executiveSummary: string;
  impactAssessment: string;
  indicatorsOfCompromise: string[];
  evidencePackageHash?: string;
  signOffOfficer: string;
}

export interface GovernmentAdvisory {
  id: string;
  advisoryId: string;
  issuingAgency: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  publishedDate: string;
  affectedSystems: string[];
  cveList: string[];
  summary: string;
  remediationSteps: string[];
  bulletinUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
  mfaEnabled: boolean;
}

export interface SystemArchitectureInfo {
  appVersion: string;
  pythonRuntime: string;
  databaseEngine: string;
  cryptoSuite: string;
  integrityAlgorithm: string;
  socCluster: string;
  academicAffiliation: string;
  lastDbSync: string;
}
