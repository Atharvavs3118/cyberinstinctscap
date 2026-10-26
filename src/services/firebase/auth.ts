import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from './config';
import { UserProfile, LoginLogEntry } from '../../types';
import firebaseConfigJson from '../../../firebase-applet-config.json';

// Pre-configured role personas for demonstration & SOC defense team
export const DEMO_USERS = [
  {
    id: 'demo-lead',
    fullName: 'Atharva Sankhe',
    email: 'atharva@cyberinstincts.soc',
    username: 'atharva.soc',
    role: 'Lead Cybersecurity Analyst',
    password: 'CyberInstincts2026!',
    department: 'SOC Operational Command',
    avatar: 'AS',
  },
  {
    id: 'demo-gov',
    fullName: 'Commander Priya Sharma',
    email: 'priya.sharma@cert-in.gov.in',
    username: 'priya.cert',
    role: 'Government Liaison Officer (CERT-In)',
    password: 'CyberInstincts2026!',
    department: 'National Cyber Coordination Centre (NCCC)',
    avatar: 'PS',
  },
  {
    id: 'demo-forensics',
    fullName: 'Dr. Rajesh Varma',
    email: 'rajesh.varma@cyberinstincts.soc',
    username: 'rajesh.forensics',
    role: 'Forensic Cryptographic Investigator',
    password: 'CyberInstincts2026!',
    department: 'MiniVault Cryptographic Laboratory',
    avatar: 'RV',
  },
  {
    id: 'demo-cadet',
    fullName: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@cyberinstincts.soc',
    username: 'rohan.soc',
    role: 'Junior Security Auditor',
    password: 'CyberInstincts2026!',
    department: 'Junior SOC Operations',
    avatar: 'RD',
  },
];

// Helper to extract client IP simulation for audit logging
function getClientIp(): string {
  const octets = [10, Math.floor(Math.random() * 5), Math.floor(Math.random() * 20), Math.floor(Math.random() * 250) + 1];
  return octets.join('.');
}

// Convert Firestore doc or FirebaseUser to UserProfile
export function formatUserProfile(fbUser: FirebaseUser, docData?: any): UserProfile {
  const fullName = docData?.fullName || fbUser.displayName || 'SOC Analyst';
  const username = docData?.username || fbUser.email?.split('@')[0] || 'analyst';
  const avatar = docData?.avatar || fullName.substring(0, 2).toUpperCase() || 'AV';

  return {
    id: fbUser.uid,
    fullName,
    username,
    email: fbUser.email || docData?.email || '',
    role: docData?.role || 'Lead Cybersecurity Analyst',
    department: docData?.department || 'Security Operations Center (SOC)',
    lastLogin: docData?.lastLogin || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    mfaEnabled: docData?.mfaEnabled ?? true,
    avatar,
    isAuthenticated: true,
    provider: docData?.provider || 'firebase',
    loginCount: docData?.loginCount || 1,
    lastLoginIp: docData?.lastLoginIp || '10.0.4.12',
    firestoreDocRef: `users/${fbUser.uid}`,
  };
}

/**
 * Record an audit log entry in Firestore collection `login_logs`
 */
export async function recordLoginAudit(entry: {
  userId?: string;
  email: string;
  fullName?: string;
  role?: string;
  status: 'SUCCESS' | 'FAILED' | 'LOGOUT';
  provider?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, 'login_logs', logId);
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    await setDoc(logRef, {
      id: logId,
      userId: entry.userId || 'anonymous',
      email: entry.email,
      fullName: entry.fullName || entry.email.split('@')[0],
      role: entry.role || 'Cybersecurity Analyst',
      status: entry.status,
      provider: entry.provider || 'email-password',
      ipAddress: entry.ipAddress || getClientIp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 120) : 'SOC Browser Client',
      timestamp: nowIso,
      createdAt: serverTimestamp(),
    });

    // Also append an entry to security_events if Firestore is reachable
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const eventRef = doc(db, 'security_events', eventId);
    await setDoc(eventRef, {
      id: eventId,
      eventType: entry.status === 'SUCCESS' ? 'AUTH_SUCCESS' : entry.status === 'FAILED' ? 'AUTH_FAILURE' : 'AUTH_LOGOUT',
      description: `${entry.status === 'SUCCESS' ? 'Officer' : 'Attempt'} ${entry.email} [${entry.provider || 'password'}] - ${entry.status}`,
      ip: entry.ipAddress || '10.0.4.12',
      timestamp: nowIso,
      severity: entry.status === 'FAILED' ? 'HIGH' : 'INFO',
      userId: entry.userId || '',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not write login log to Firestore:', err);
  }
}

/**
 * Fetch recent login log audit records from Firestore
 */
export async function getRecentLoginLogs(limitCount = 8): Promise<LoginLogEntry[]> {
  try {
    const logsCol = collection(db, 'login_logs');
    const q = query(logsCol, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Fallback query without orderBy in case index is pending
      const fallbackSnap = await getDocs(query(logsCol, firestoreLimit(limitCount)));
      return fallbackSnap.docs.map((d) => d.data() as LoginLogEntry);
    }

    return snap.docs.map((d) => d.data() as LoginLogEntry);
  } catch (err) {
    console.warn('Could not fetch login_logs from Firestore:', err);
    return [];
  }
}

/**
 * Fetch all registered officer profiles from Firestore `users` collection
 */
export async function getStoredFirestoreUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.uid || d.id,
        fullName: data.fullName || 'SOC Officer',
        username: data.username || data.email?.split('@')[0] || 'analyst',
        email: data.email || '',
        role: data.role || 'Cybersecurity Analyst',
        department: data.department || 'Security Operations Center',
        lastLogin: data.lastLogin || 'Recent',
        mfaEnabled: data.mfaEnabled ?? true,
        avatar: data.avatar || (data.fullName || 'SO').substring(0, 2).toUpperCase(),
        isAuthenticated: false,
        provider: data.provider || 'firebase',
        loginCount: data.loginCount || 1,
        lastLoginIp: data.lastLoginIp || '10.0.4.12',
        firestoreDocRef: `users/${d.id}`,
      };
    });
  } catch (err) {
    console.warn('Could not fetch users from Firestore:', err);
    return [];
  }
}

/**
 * Sign in using Google OAuth via Firebase Auth popup
 * Stores user profile in Firestore `users/{uid}` and records login log in `login_logs`
 */
export async function signInWithGoogle(): Promise<{ user: UserProfile; token: string }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;
  const token = await fbUser.getIdToken();

  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const clientIp = getClientIp();

  // Fetch or upsert in Firestore `users` collection
  let docData: any = null;
  const userDocRef = doc(db, 'users', fbUser.uid);
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      docData = snap.data();
      const newCount = (docData.loginCount || 1) + 1;
      await updateDoc(userDocRef, {
        lastLogin: nowIso,
        lastLoginIp: clientIp,
        loginCount: newCount,
        updatedAt: serverTimestamp(),
      });
      docData.lastLogin = nowIso;
      docData.loginCount = newCount;
    } else {
      const fullName = fbUser.displayName || 'Authorized Google Officer';
      const username = fbUser.email?.split('@')[0] || 'analyst';
      docData = {
        uid: fbUser.uid,
        fullName,
        username,
        email: fbUser.email || '',
        role: 'Lead Cybersecurity Analyst',
        department: 'Google Workspace SOC Command',
        avatar: fullName.substring(0, 2).toUpperCase(),
        mfaEnabled: true,
        provider: 'google.com',
        loginCount: 1,
        lastLoginIp: clientIp,
        lastLogin: nowIso,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, docData);
    }
  } catch (err) {
    console.warn('Firestore user profile sync warning (Google):', err);
  }

  // Record audit trail in Firestore `login_logs`
  await recordLoginAudit({
    userId: fbUser.uid,
    email: fbUser.email || 'google.user@gmail.com',
    fullName: docData?.fullName || fbUser.displayName || 'Google Officer',
    role: docData?.role || 'Lead Cybersecurity Analyst',
    status: 'SUCCESS',
    provider: 'google.com',
    ipAddress: clientIp,
  });

  const userProfile = formatUserProfile(fbUser, docData);
  return { user: userProfile, token };
}

/**
 * Register a new user in Firebase Auth and persist profile in Firestore `users/{uid}`
 */
export async function registerUser(payload: {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role?: string;
  department?: string;
}): Promise<UserProfile> {
  const email = payload.email.trim();
  const password = payload.password || 'CyberInstincts2026!';
  const fullName = payload.fullName.trim() || 'SOC Analyst';
  const username = payload.username.trim() || email.split('@')[0];
  const role = payload.role || 'Lead Cybersecurity Analyst';
  const department = payload.department || 'Security Operations Center (SOC)';

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;

  // Update Auth Profile
  await updateProfile(fbUser, {
    displayName: fullName,
  });

  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const clientIp = getClientIp();

  const userData = {
    uid: fbUser.uid,
    fullName,
    username,
    email,
    role,
    department,
    avatar: fullName.substring(0, 2).toUpperCase(),
    mfaEnabled: true,
    provider: 'password',
    loginCount: 1,
    lastLoginIp: clientIp,
    lastLogin: nowIso,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Write to Firestore users collection
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, userData);
  } catch (err) {
    console.warn('Could not write to Firestore users collection:', err);
  }

  // Record audit trail in Firestore `login_logs`
  await recordLoginAudit({
    userId: fbUser.uid,
    email,
    fullName,
    role,
    status: 'SUCCESS',
    provider: 'registration',
    ipAddress: clientIp,
  });

  return formatUserProfile(fbUser, userData);
}

/**
 * Log in user via email/username and password.
 * Syncs user profile in Firestore `users/{uid}` and stores login event in `login_logs`
 */
export async function loginUser(credentials: {
  username: string;
  password?: string;
}): Promise<{ user: UserProfile; token: string }> {
  let email = credentials.username.trim();
  const password = credentials.password || 'CyberInstincts2026!';
  const clientIp = getClientIp();

  // If user entered a username instead of email, check Firestore `users`
  if (!email.includes('@')) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', email));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const foundData = querySnap.docs[0].data();
        if (foundData?.email) {
          email = foundData.email;
        }
      }
    } catch (err) {
      console.warn('Username resolution failed:', err);
    }
  }

  // Check if target is a known preset persona
  const presetPersona = DEMO_USERS.find(
    (p) => p.email.toLowerCase() === email.toLowerCase() || p.username.toLowerCase() === email.toLowerCase()
  );

  let fbUser: FirebaseUser | null = null;
  let token = '';

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    fbUser = userCredential.user;
    token = await fbUser.getIdToken();
  } catch (err: any) {
    // If account doesn't exist yet in Firebase Auth and matches a Preset Persona, auto-provision it!
    const isNotFound =
      err?.code === 'auth/user-not-found' ||
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/wrong-password';

    if (presetPersona && isNotFound) {
      try {
        const regRes = await createUserWithEmailAndPassword(auth, presetPersona.email, presetPersona.password);
        fbUser = regRes.user;
        await updateProfile(fbUser, { displayName: presetPersona.fullName });
        token = await fbUser.getIdToken();
      } catch (autoErr) {
        console.warn('Auto-provisioning demo account threw error:', autoErr);
        throw err;
      }
    } else {
      // Record failed login audit log in Firestore
      await recordLoginAudit({
        email,
        status: 'FAILED',
        provider: 'password',
        ipAddress: clientIp,
      });
      throw err;
    }
  }

  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Fetch or update user profile in Firestore
  let docData: any = null;
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      docData = snap.data();
      const newCount = (docData.loginCount || 1) + 1;
      await updateDoc(userDocRef, {
        lastLogin: nowIso,
        lastLoginIp: clientIp,
        loginCount: newCount,
        updatedAt: serverTimestamp(),
      });
      docData.lastLogin = nowIso;
      docData.loginCount = newCount;
    } else {
      // Initialize profile doc if missing
      docData = {
        uid: fbUser.uid,
        fullName: presetPersona ? presetPersona.fullName : fbUser.displayName || 'Authorized Officer',
        username: presetPersona ? presetPersona.username : fbUser.email?.split('@')[0] || 'analyst',
        email: fbUser.email || email,
        role: presetPersona ? presetPersona.role : 'Lead Cybersecurity Analyst',
        department: presetPersona ? presetPersona.department : 'Security Operations Center (SOC)',
        avatar: (presetPersona ? presetPersona.fullName : fbUser.displayName || 'Officer').substring(0, 2).toUpperCase(),
        mfaEnabled: true,
        provider: 'password',
        loginCount: 1,
        lastLoginIp: clientIp,
        lastLogin: nowIso,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, docData);
    }
  } catch (err) {
    console.warn('Could not read/update user doc in Firestore:', err);
  }

  // Record SUCCESS audit in Firestore `login_logs`
  await recordLoginAudit({
    userId: fbUser.uid,
    email: fbUser.email || email,
    fullName: docData?.fullName || fbUser.displayName || 'Officer',
    role: docData?.role || 'Cybersecurity Analyst',
    status: 'SUCCESS',
    provider: presetPersona ? 'preset-persona' : 'password',
    ipAddress: clientIp,
  });

  const userProfile = formatUserProfile(fbUser, docData);
  return { user: userProfile, token };
}

/**
 * Log out current Firebase user and record logout in Firestore
 */
export async function logoutUser(): Promise<void> {
  const current = auth.currentUser;
  if (current) {
    await recordLoginAudit({
      userId: current.uid,
      email: current.email || 'officer',
      fullName: current.displayName || 'Officer',
      status: 'LOGOUT',
      provider: 'session-end',
    });
  }
  await signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  if (!email || !email.includes('@')) {
    throw new Error('Please provide a valid registered email address.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Fetch current authenticated user
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const fbUser = auth.currentUser;
  if (!fbUser) return null;

  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return formatUserProfile(fbUser, snap.data());
    }
  } catch (err) {
    console.warn('Error reading currentUser from Firestore:', err);
  }

  return formatUserProfile(fbUser);
}

/**
 * Subscribe to auth state changes for persistent user sessions
 */
export function onAuthChange(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        callback(formatUserProfile(fbUser, snap.data()));
        return;
      }
    } catch (e) {
      console.warn('onAuthStateChanged profile fetch error:', e);
    }
    callback(formatUserProfile(fbUser));
  });
}

/**
 * Get Firestore configuration and connection metadata
 */
export function getFirestoreConnectionInfo() {
  return {
    projectId: firebaseConfig.projectId || firebaseConfigJson.projectId,
    databaseId: firebaseConfigJson.firestoreDatabaseId,
    authDomain: firebaseConfig.authDomain || firebaseConfigJson.authDomain,
    isConfigured: Boolean(firebaseConfig.apiKey && firebaseConfig.projectId),
  };
}
