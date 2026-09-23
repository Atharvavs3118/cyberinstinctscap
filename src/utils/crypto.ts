/**
 * Cryptographic Utility for CyberInstincts
 * Uses standard W3C Web Cryptography API (SubtleCrypto) to calculate
 * authentic SHA-256 hashes of files and strings.
 */

export async function calculateSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function calculateStringSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function truncateHash(hash: string, lead = 8, tail = 8): string {
  if (!hash) return '';
  if (hash.length <= lead + tail) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-tail)}`;
}

/**
 * Compares two SHA-256 hashes and returns character-level match analysis
 */
export function compareHashes(original: string, current: string): {
  isMatch: boolean;
  matchPercentage: number;
  differencesCount: number;
} {
  if (!original || !current) {
    return { isMatch: false, matchPercentage: 0, differencesCount: 64 };
  }
  const isMatch = original.toLowerCase() === current.toLowerCase();
  let diffs = 0;
  const len = Math.max(original.length, current.length);
  for (let i = 0; i < len; i++) {
    if (original[i] !== current[i]) diffs++;
  }
  const matchPercentage = Math.round(((len - diffs) / len) * 100);
  return {
    isMatch,
    matchPercentage,
    differencesCount: diffs,
  };
}
