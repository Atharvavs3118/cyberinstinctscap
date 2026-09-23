import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile } from '../../types';

// Pre-configured role personas for demonstration & grading
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
  };
}

/**
 * Register a new user in Firebase Auth and Firestore users collection
 */
export async function registerUser(payload: {
  fullName: string;
  username: string;
  email: string;
  password?: string;
}): Promise<UserProfile> {
  const email = payload.email.trim();
  const password = payload.password || 'CyberInstincts2026!';
  const fullName = payload.fullName.trim() || 'SOC Analyst';
  const username = payload.username.trim() || email.split('@')[0];

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;

  // Update Auth Profile
  await updateProfile(fbUser, {
    displayName: fullName,
  });

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const userData = {
    uid: fbUser.uid,
    fullName,
    username,
    email,
    role: 'Cybersecurity SOC Analyst',
    department: 'Security Operations Center (SOC)',
    avatar: fullName.substring(0, 2).toUpperCase(),
    mfaEnabled: true,
    lastLogin: now,
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

  return formatUserProfile(fbUser, userData);
}

/**
 * Log in user via email/username and password
 */
export async function loginUser(credentials: {
  username: string;
  password?: string;
}): Promise<{ user: UserProfile; token: string }> {
  let email = credentials.username.trim();
  const password = credentials.password || 'CyberInstincts2026!';

  // If user entered a username instead of email, look up their email in Firestore users
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
      console.warn('Username resolution failed, continuing with direct email:', err);
    }
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;
  const token = await fbUser.getIdToken();

  // Fetch or update user profile in Firestore
  let docData: any = null;
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    if (snap.exists()) {
      docData = snap.data();
      await updateDoc(userDocRef, {
        lastLogin: now,
        updatedAt: serverTimestamp(),
      });
      docData.lastLogin = now;
    } else {
      // Initialize profile doc if missing
      docData = {
        uid: fbUser.uid,
        fullName: fbUser.displayName || 'Atharva Sankhe',
        username: fbUser.email?.split('@')[0] || 'analyst',
        email: fbUser.email,
        role: 'Lead Cybersecurity Analyst',
        department: 'Security Operations Center (SOC)',
        avatar: (fbUser.displayName || 'Atharva Sankhe').substring(0, 2).toUpperCase(),
        mfaEnabled: true,
        lastLogin: now,
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, docData);
    }
  } catch (err) {
    console.warn('Could not read/update user doc in Firestore:', err);
  }

  const userProfile = formatUserProfile(fbUser, docData);
  return { user: userProfile, token };
}

/**
 * Log out current Firebase user
 */
export async function logoutUser(): Promise<void> {
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
