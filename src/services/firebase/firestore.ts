import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import {
  CyberIncident,
  ProtectedFile,
  SecurityEvent,
  DashboardStats,
  NotificationItem,
} from '../../types';
import {
  INITIAL_INCIDENTS,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS,
} from '../mockData';
import { formatBytes } from '../../utils/crypto';
import { uploadVaultFile, uploadIncidentEvidence, deleteStorageFile } from './storage';
import { calculateSecurityScore } from '../api';

// Initial security audit events to seed if security_events collection is empty
const INITIAL_SECURITY_EVENTS: Omit<SecurityEvent, 'id'>[] = [
  {
    eventType: 'TAMPER_CHECK_PASS',
    description: 'System-wide cryptographic integrity sweep completed. 6 files validated.',
    ip: '10.0.4.12',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  },
  {
    eventType: 'INCIDENT_DETECTED',
    description: 'Brute force credential stuffing detected against SSH gateway.',
    ip: '185.220.101.5',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString().replace('T', ' ').substring(0, 19),
    severity: 'CRITICAL',
  },
  {
    eventType: 'AUTH_SUCCESS',
    description: 'Lead Analyst session authenticated via PostgreSQL & Firebase RBAC.',
    ip: '192.168.1.105',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  },
  {
    eventType: 'VAULT_ENROLLMENT',
    description: 'New baseline SHA-256 certificate registered into MiniVault.',
    ip: '10.0.2.80',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString().replace('T', ' ').substring(0, 19),
    severity: 'LOW',
  },
];

// Helper to protect against unreachable / slow Firestore connections in sandbox preview
const FS_TIMEOUT_MS = 6000;

async function runWithTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = FS_TIMEOUT_MS): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback);
    }, timeoutMs);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    return fallback;
  }
}

/**
 * ============================================================================
 * 1. CYBERTRACE INCIDENTS (Firestore collection: 'incidents')
 * ============================================================================
 */

export async function getIncidents(): Promise<CyberIncident[]> {
  return runWithTimeout(
    (async () => {
      try {
        const incCol = collection(db, 'incidents');
        const q = query(incCol, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);

        if (snap.empty) {
          // Seed initial incidents into Firestore for instant functionality
          console.log('Seeding initial incidents to Firestore...');
          const seeded: CyberIncident[] = [];
          try {
            for (const item of INITIAL_INCIDENTS) {
              const docRef = doc(db, 'incidents', item.id);
              const incidentData = {
                ...item,
                incidentId: item.id,
                userId: 'system-demo',
                source: item.sourceIp,
                evidenceUrl: item.evidence || '',
              };
              await setDoc(docRef, incidentData);
              seeded.push(incidentData);
            }
            return seeded;
          } catch (seedErr) {
            console.warn('Seeding initial incidents note:', seedErr);
            return INITIAL_INCIDENTS;
          }
        }

        return snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: data.id || data.incidentId || docSnap.id,
            incidentId: data.incidentId || docSnap.id,
            userId: data.userId || 'system-demo',
            threatType: data.threatType || 'Unknown Threat',
            sourceIp: data.sourceIp || data.source || '0.0.0.0',
            source: data.source || data.sourceIp || '0.0.0.0',
            target: data.target || 'Internal System',
            severity: data.severity || 'MEDIUM',
            status: data.status || 'INVESTIGATING',
            timestamp: data.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            description: data.description || '',
            detectionMethod: data.detectionMethod || 'Automated Monitor',
            evidence: data.evidence || data.evidenceUrl || '',
            evidenceUrl: data.evidenceUrl || data.evidence || '',
            resolution: data.resolution || '',
            cvssScore: data.cvssScore || 5.0,
            timeline: data.timeline || [],
            mitreTactic: data.mitreTactic || '',
          };
        });
      } catch (err) {
        console.warn('Firestore getIncidents offline/error:', err);
        return INITIAL_INCIDENTS;
      }
    })(),
    INITIAL_INCIDENTS
  );
}

export async function createIncident(
  incidentData: Omit<CyberIncident, 'id' | 'timestamp' | 'timeline'>,
  evidenceFile?: File
): Promise<CyberIncident> {
  const currentUserId = auth.currentUser?.uid || 'analyst-anonymous';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const nextId = `INC-${Date.now().toString().slice(-4)}`;

  let evidenceUrl = incidentData.evidence || '';
  if (evidenceFile) {
    const uploadRes = await uploadIncidentEvidence(evidenceFile, evidenceFile.name, nextId);
    evidenceUrl = uploadRes.downloadUrl;
  }

  const newIncident: CyberIncident = {
    ...incidentData,
    id: nextId,
    incidentId: nextId,
    userId: currentUserId,
    timestamp: now,
    sourceIp: incidentData.sourceIp || incidentData.source || '192.168.1.1',
    source: incidentData.source || incidentData.sourceIp || '192.168.1.1',
    evidence: evidenceUrl,
    evidenceUrl: evidenceUrl,
    timeline: [
      {
        step: 'Detected',
        timestamp: now,
        note: `Incident manually submitted: ${incidentData.threatType}`,
        actor: auth.currentUser?.displayName || 'SOC Analyst',
      },
      {
        step: 'Analyzed',
        timestamp: now,
        note: `Automated CVSS rating assigned (${incidentData.severity})`,
        actor: 'CyberInstincts Engine',
      },
    ],
  };

  try {
    const docRef = doc(db, 'incidents', nextId);
    await setDoc(docRef, newIncident);

    // Log to security_events
    await createSecurityEvent({
      userId: currentUserId,
      eventType: 'INCIDENT_CREATED',
      description: `New incident ${nextId} created: ${incidentData.threatType} (${incidentData.severity})`,
      ip: incidentData.sourceIp || '127.0.0.1',
      severity: incidentData.severity,
    });

    // Create Notification
    await createNotification({
      type: 'new_incident',
      title: `New Incident Logged (${nextId})`,
      message: `${newIncident.threatType} targeting ${newIncident.target} flagged as ${newIncident.severity}.`,
      severity: newIncident.severity === 'CRITICAL' ? 'critical' : newIncident.severity === 'HIGH' ? 'warning' : 'info',
      entityId: nextId,
      userId: currentUserId,
    });
  } catch (err) {
    console.error('Firestore createIncident error:', err);
  }

  return newIncident;
}

export async function updateIncident(
  id: string,
  updates: Partial<CyberIncident>
): Promise<CyberIncident> {
  const incDocRef = doc(db, 'incidents', id);
  const snap = await getDoc(incDocRef);
  if (!snap.exists()) {
    throw new Error(`Incident ${id} not found in Firestore`);
  }

  const existing = snap.data() as CyberIncident;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updatedTimeline = existing.timeline || [];
  if (updates.status && updates.status !== existing.status) {
    const stepMap: Record<string, 'Detected' | 'Analyzed' | 'Investigating' | 'Mitigated' | 'Resolved'> = {
      INVESTIGATING: 'Investigating',
      MITIGATED: 'Mitigated',
      RESOLVED: 'Resolved',
      MONITORING: 'Investigating',
    };
    updatedTimeline = [
      ...updatedTimeline,
      {
        step: stepMap[updates.status] || 'Investigating',
        timestamp: now,
        note: `Status updated to ${updates.status}`,
        actor: auth.currentUser?.displayName || 'Lead Analyst',
      },
    ];
  }

  const updatedData: CyberIncident = {
    ...existing,
    ...updates,
    timeline: updatedTimeline,
  };

  await updateDoc(incDocRef, updatedData as any);

  // Log Security Event
  if (updates.status && updates.status !== existing.status) {
    await createSecurityEvent({
      userId: auth.currentUser?.uid || 'analyst',
      eventType: 'INCIDENT_STATUS_CHANGE',
      description: `Incident ${id} status moved from ${existing.status} to ${updates.status}`,
      ip: '127.0.0.1',
      severity: updates.status === 'RESOLVED' ? 'INFO' : 'MEDIUM',
    });
  }

  return updatedData;
}

/**
 * ============================================================================
 * 2. MINIVAULT PROTECTED FILES (Firestore collection: 'protected_files')
 * ============================================================================
 */

export async function getProtectedFiles(userId?: string): Promise<ProtectedFile[]> {
  return runWithTimeout(
    (async () => {
      try {
        const filesCol = collection(db, 'protected_files');
        const snap = await getDocs(filesCol);

        if (snap.empty) {
          console.log('Seeding initial protected files to Firestore...');
          const seeded: ProtectedFile[] = [];
          try {
            for (const item of INITIAL_FILES) {
              const docRef = doc(db, 'protected_files', item.id);
              const fileData = {
                ...item,
                fileId: item.id,
                fileSize: item.size,
                sha256Hash: item.originalHash,
                integrityStatus: item.status,
                userId: 'system-demo',
                storageUrl: '',
                downloadUrl: '',
                storagePath: '',
              };
              await setDoc(docRef, fileData);
              seeded.push(fileData);
            }
            return seeded;
          } catch (seedErr) {
            console.warn('Seeding protected files note:', seedErr);
            return INITIAL_FILES;
          }
        }

        const currentUid = userId || auth.currentUser?.uid;
        const allFiles = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const originalHash = data.originalHash || data.sha256Hash || '';
          const currentHash = data.currentHash || data.sha256Hash || originalHash;
          const status = data.status || data.integrityStatus || (originalHash === currentHash ? 'VERIFIED' : 'MODIFIED');

          return {
            id: data.id || data.fileId || docSnap.id,
            fileId: data.fileId || data.id || docSnap.id,
            userId: data.userId || 'system-demo',
            fileName: data.fileName || 'unnamed-file',
            fileType: data.fileType || 'application/octet-stream',
            size: data.size || data.fileSize || 0,
            fileSize: data.fileSize || data.size || 0,
            formattedSize: data.formattedSize || formatBytes(data.size || data.fileSize || 0),
            originalHash,
            currentHash,
            sha256Hash: originalHash,
            storageUrl: data.storageUrl || '',
            downloadUrl: data.downloadUrl || data.storageUrl || '',
            storagePath: data.storagePath || '',
            status,
            integrityStatus: status,
            uploadDate: data.uploadDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
            lastVerified: data.lastVerified || new Date().toISOString().replace('T', ' ').substring(0, 19),
            history: data.history || [],
            category: data.category || 'System Config',
          } as ProtectedFile;
        });

        // If user is authenticated, include user files + system-demo files
        if (currentUid) {
          return allFiles.filter(f => f.userId === currentUid || f.userId === 'system-demo');
        }
        return allFiles;
      } catch (err) {
        console.warn('Firestore getProtectedFiles offline/error:', err);
        return INITIAL_FILES;
      }
    })(),
    INITIAL_FILES
  );
}

export async function uploadFile(payload: {
  file?: File | Blob;
  fileName: string;
  fileType: string;
  size: number;
  sha256Hash: string;
  category?: ProtectedFile['category'];
  userId?: string;
}): Promise<ProtectedFile> {
  const currentUid = payload.userId || auth.currentUser?.uid || 'analyst-user';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const nextId = `file-${Date.now().toString().slice(-4)}`;

  let storageUrl = '';
  let storagePath = '';

  if (payload.file) {
    const uploadRes = await uploadVaultFile(payload.file, payload.fileName, currentUid);
    storageUrl = uploadRes.downloadUrl;
    storagePath = uploadRes.storagePath;
  }

  const newFile: ProtectedFile = {
    id: nextId,
    fileId: nextId,
    userId: currentUid,
    fileName: payload.fileName,
    fileType: payload.fileType || 'application/octet-stream',
    size: payload.size,
    fileSize: payload.size,
    formattedSize: formatBytes(payload.size),
    originalHash: payload.sha256Hash,
    currentHash: payload.sha256Hash,
    sha256Hash: payload.sha256Hash,
    storageUrl,
    downloadUrl: storageUrl,
    storagePath,
    status: 'VERIFIED',
    integrityStatus: 'VERIFIED',
    uploadDate: now,
    lastVerified: now,
    category: payload.category || 'System Config',
    history: [
      {
        timestamp: now,
        result: 'MATCH',
        originalHash: payload.sha256Hash,
        calculatedHash: payload.sha256Hash,
        verifiedBy: 'MiniVault Ingestion Checksum (SHA-256)',
      },
    ],
  };

  try {
    const docRef = doc(db, 'protected_files', nextId);
    await setDoc(docRef, newFile);

    // Security event
    await createSecurityEvent({
      userId: currentUid,
      eventType: 'VAULT_FILE_UPLOADED',
      description: `File enrolled into MiniVault: ${newFile.fileName} [SHA-256: ${newFile.originalHash.substring(0, 12)}...]`,
      ip: '127.0.0.1',
      severity: 'LOW',
    });

    // Notification
    await createNotification({
      type: 'verification_complete',
      title: 'File Enrolled in MiniVault',
      message: `${newFile.fileName} protected with initial SHA-256 baseline in Firebase.`,
      severity: 'safe',
      entityId: nextId,
      userId: currentUid,
    });
  } catch (err) {
    console.error('Firestore uploadFile error:', err);
  }

  return newFile;
}

export async function deleteFile(fileId: string): Promise<void> {
  const fileDocRef = doc(db, 'protected_files', fileId);
  const snap = await getDoc(fileDocRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.storagePath) {
      await deleteStorageFile(data.storagePath);
    }
  }
  await deleteDoc(fileDocRef);

  await createSecurityEvent({
    userId: auth.currentUser?.uid || 'analyst',
    eventType: 'VAULT_FILE_DELETED',
    description: `Protected file ${fileId} removed from MiniVault storage and registry`,
    ip: '127.0.0.1',
    severity: 'MEDIUM',
  });
}

export async function verifyFileIntegrity(fileId: string): Promise<ProtectedFile> {
  const fileDocRef = doc(db, 'protected_files', fileId);
  const snap = await getDoc(fileDocRef);
  if (!snap.exists()) throw new Error(`File ${fileId} not found in Firestore`);

  const file = snap.data() as ProtectedFile;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const isMatch = file.originalHash === file.currentHash;

  const updated: ProtectedFile = {
    ...file,
    status: isMatch ? 'VERIFIED' : 'MODIFIED',
    integrityStatus: isMatch ? 'VERIFIED' : 'MODIFIED',
    lastVerified: now,
    history: [
      {
        timestamp: now,
        result: isMatch ? 'MATCH' : 'MISMATCH',
        originalHash: file.originalHash,
        calculatedHash: file.currentHash,
        verifiedBy: 'MiniVault Cryptographic SHA-256 Verification Check',
      },
      ...(file.history || []),
    ],
  };

  await updateDoc(fileDocRef, updated as any);

  if (!isMatch) {
    await createSecurityEvent({
      userId: auth.currentUser?.uid || 'analyst',
      eventType: 'TAMPER_ALERT',
      description: `Cryptographic mismatch detected on ${file.fileName}! Current hash differs from enrolled baseline.`,
      ip: '127.0.0.1',
      severity: 'CRITICAL',
    });

    await createNotification({
      type: 'file_modified',
      title: `Integrity Alert: ${file.fileName}`,
      message: `Cryptographic hash mismatch! Live hash differs from baseline.`,
      severity: 'critical',
      entityId: file.id,
      userId: file.userId,
    });
  } else {
    await createSecurityEvent({
      userId: auth.currentUser?.uid || 'analyst',
      eventType: 'TAMPER_CHECK_PASS',
      description: `Integrity check PASSED for ${file.fileName} against baseline SHA-256.`,
      ip: '127.0.0.1',
      severity: 'INFO',
    });
  }

  return updated;
}

export async function verifyAllFilesIntegrity(): Promise<ProtectedFile[]> {
  const files = await getProtectedFiles();
  const updatedList: ProtectedFile[] = [];

  for (const file of files) {
    const verified = await verifyFileIntegrity(file.id);
    updatedList.push(verified);
  }

  const modifiedCount = updatedList.filter(f => f.status === 'MODIFIED').length;
  await createNotification({
    type: 'verification_complete',
    title: 'Batch Integrity Sweep Complete',
    message: `Verified ${updatedList.length} files. ${modifiedCount > 0 ? `${modifiedCount} modified file alerts!` : 'All files intact.'}`,
    severity: modifiedCount > 0 ? 'warning' : 'safe',
  });

  return updatedList;
}

export async function simulateFileTampering(fileId: string): Promise<ProtectedFile> {
  const fileDocRef = doc(db, 'protected_files', fileId);
  const snap = await getDoc(fileDocRef);
  if (!snap.exists()) throw new Error(`File ${fileId} not found`);

  const file = snap.data() as ProtectedFile;
  const altered = 'ff90' + file.originalHash.substring(4, 60) + 'beef';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const updated: ProtectedFile = {
    ...file,
    currentHash: altered,
    status: 'MODIFIED',
    integrityStatus: 'MODIFIED',
    lastVerified: now,
    history: [
      {
        timestamp: now,
        result: 'MISMATCH',
        originalHash: file.originalHash,
        calculatedHash: altered,
        verifiedBy: 'Simulated File Tampering Injection (Firestore Event)',
      },
      ...(file.history || []),
    ],
  };

  await updateDoc(fileDocRef, updated as any);

  await createSecurityEvent({
    userId: auth.currentUser?.uid || 'analyst',
    eventType: 'TAMPER_SIMULATION',
    description: `File tampering injected into ${file.fileName}. Live hash altered to test detection engine.`,
    ip: '127.0.0.1',
    severity: 'CRITICAL',
  });

  await createNotification({
    type: 'file_modified',
    title: `Tamper Alert: ${file.fileName}`,
    message: `File tampering simulated! Live hash altered; cryptographic match failed.`,
    severity: 'critical',
    entityId: file.id,
    userId: file.userId,
  });

  return updated;
}

export async function restoreFileBaseline(fileId: string): Promise<ProtectedFile> {
  const fileDocRef = doc(db, 'protected_files', fileId);
  const snap = await getDoc(fileDocRef);
  if (!snap.exists()) throw new Error(`File ${fileId} not found`);

  const file = snap.data() as ProtectedFile;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const updated: ProtectedFile = {
    ...file,
    currentHash: file.originalHash,
    status: 'VERIFIED',
    integrityStatus: 'VERIFIED',
    lastVerified: now,
    history: [
      {
        timestamp: now,
        result: 'MATCH',
        originalHash: file.originalHash,
        calculatedHash: file.originalHash,
        verifiedBy: 'Baseline Restored & Re-Enrolled',
      },
      ...(file.history || []),
    ],
  };

  await updateDoc(fileDocRef, updated as any);

  await createSecurityEvent({
    userId: auth.currentUser?.uid || 'analyst',
    eventType: 'BASELINE_RESTORED',
    description: `Cryptographic baseline restored for ${file.fileName}. Status reset to VERIFIED.`,
    ip: '127.0.0.1',
    severity: 'INFO',
  });

  return updated;
}

/**
 * ============================================================================
 * 3. SECURITY EVENTS (Firestore collection: 'security_events')
 * ============================================================================
 */

export async function getSecurityEvents(limitCount = 20): Promise<SecurityEvent[]> {
  const fallback = INITIAL_SECURITY_EVENTS.map((e, idx) => ({ id: `evt-local-${idx}`, ...e }));
  return runWithTimeout(
    (async () => {
      try {
        const eventsCol = collection(db, 'security_events');
        const q = query(eventsCol, orderBy('timestamp', 'desc'), limit(limitCount));
        const snap = await getDocs(q);

        if (snap.empty) {
          console.log('Seeding initial security events to Firestore...');
          const seeded: SecurityEvent[] = [];
          try {
            for (const evt of INITIAL_SECURITY_EVENTS) {
              const id = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const fullEvt: SecurityEvent = { ...evt, id };
              await setDoc(doc(db, 'security_events', id), fullEvt);
              seeded.push(fullEvt);
            }
            return seeded;
          } catch (seedErr) {
            console.warn('Seeding security events note:', seedErr);
            return fallback;
          }
        }

        return snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SecurityEvent, 'id'>),
        }));
      } catch (err) {
        console.warn('Firestore getSecurityEvents offline/error:', err);
        return fallback;
      }
    })(),
    fallback
  );
}

export async function createSecurityEvent(
  eventData: Omit<SecurityEvent, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<SecurityEvent> {
  const id = `evt-${Date.now()}`;
  const now = eventData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newEvt: SecurityEvent = {
    ...eventData,
    id,
    timestamp: now,
  };

  try {
    await setDoc(doc(db, 'security_events', id), {
      ...newEvt,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not write security event to Firestore:', err);
  }

  return newEvt;
}

/**
 * ============================================================================
 * 4. NOTIFICATIONS (Firestore collection: 'notifications')
 * ============================================================================
 */

export async function getNotifications(): Promise<NotificationItem[]> {
  return runWithTimeout(
    (async () => {
      try {
        const notifCol = collection(db, 'notifications');
        const q = query(notifCol, orderBy('timestamp', 'desc'), limit(30));
        const snap = await getDocs(q);

        if (snap.empty) {
          console.log('Seeding initial notifications to Firestore...');
          const seeded: NotificationItem[] = [];
          try {
            for (const n of INITIAL_NOTIFICATIONS) {
              await setDoc(doc(db, 'notifications', n.id), n);
              seeded.push(n);
            }
            return seeded;
          } catch (seedErr) {
            console.warn('Seeding notifications note:', seedErr);
            return INITIAL_NOTIFICATIONS;
          }
        }

        return snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<NotificationItem, 'id'>),
        }));
      } catch (err) {
        console.warn('Firestore getNotifications offline/error:', err);
        return INITIAL_NOTIFICATIONS;
      }
    })(),
    INITIAL_NOTIFICATIONS
  );
}

export async function createNotification(
  notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & { userId?: string }
): Promise<NotificationItem> {
  const id = `notif-${Date.now()}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const newNotif: NotificationItem = {
    ...notif,
    id,
    timestamp: now,
    read: false,
  };

  try {
    await setDoc(doc(db, 'notifications', id), newNotif);
  } catch (err) {
    console.warn('Could not save notification to Firestore:', err);
  }

  return newNotif;
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { read: true });
  } catch (err) {
    console.warn('Could not mark notification read:', err);
  }
}

/**
 * ============================================================================
 * 5. DASHBOARD STATS AGGREGATOR
 * ============================================================================
 */

export async function getDashboardStats(): Promise<DashboardStats> {
  const [incidents, files, recentEvents] = await Promise.all([
    getIncidents(),
    getProtectedFiles(),
    getSecurityEvents(5),
  ]);

  const criticalCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED'
  ).length;
  const scoreObj = calculateSecurityScore(files, incidents);

  const integrityCounts = {
    total: files.length,
    verified: files.filter((f) => f.status === 'VERIFIED').length,
    modified: files.filter((f) => f.status === 'MODIFIED').length,
    missing: files.filter((f) => f.status === 'MISSING').length,
    warning: files.filter((f) => f.status === 'WARNING').length,
  };

  return {
    threatsDetected: incidents.length,
    criticalIncidents: criticalCount,
    protectedFiles: files.length,
    securityScore: scoreObj.score,
    scoreBreakdown: scoreObj.breakdown,
    fileIntegrity: integrityCounts,
    recentEvents,
  };
}
