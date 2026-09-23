import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file to Firebase Storage for MiniVault
 * Path: users/{userId}/vault/{fileName}_{timestamp}
 */
export async function uploadVaultFile(
  file: File | Blob,
  fileName: string,
  userId: string
): Promise<{ downloadUrl: string; storagePath: string }> {
  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${userId}/vault/${Date.now()}_${cleanFileName}`;
    const fileRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: fileName,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    };

    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return { downloadUrl, storagePath };
  } catch (error: any) {
    console.warn('Firebase Storage upload warning (fallback URL generated):', error);
    // If storage has network or bucket rule issues, provide a usable blob/data URL fallback
    const fallbackUrl = file instanceof File ? URL.createObjectURL(file) : '';
    return {
      downloadUrl: fallbackUrl,
      storagePath: `local-vault/${Date.now()}_${fileName}`,
    };
  }
}

/**
 * Upload incident evidence to Firebase Storage
 * Path: incidents/{incidentId}/{fileName}_{timestamp}
 */
export async function uploadIncidentEvidence(
  file: File | Blob,
  fileName: string,
  incidentId: string
): Promise<{ downloadUrl: string; storagePath: string }> {
  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `incidents/${incidentId}/${Date.now()}_${cleanFileName}`;
    const fileRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        incidentId,
        uploadedAt: new Date().toISOString(),
      },
    };

    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return { downloadUrl, storagePath };
  } catch (error: any) {
    console.warn('Firebase Storage incident evidence upload warning:', error);
    const fallbackUrl = file instanceof File ? URL.createObjectURL(file) : '';
    return {
      downloadUrl: fallbackUrl,
      storagePath: `local-evidence/${incidentId}_${fileName}`,
    };
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.startsWith('local-')) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Could not delete file from Firebase Storage:', error);
  }
}
