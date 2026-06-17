/**
 * Safe localStorage wrapper that handles:
 * - Safari Private Mode (QuotaExceededError on setItem)
 * - Embedded WebViews (SecurityError on any access)
 * - SSR environments (no window/localStorage)
 */

function isLocalStorageAvailable(): boolean {
  try {
    const key = '__prepmate_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = typeof window !== 'undefined' && isLocalStorageAvailable();

export function safeGetItem(key: string): string | null {
  if (!storageAvailable) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('[PrepMate] localStorage.setItem failed:', e);
  }
}

export function safeRemoveItem(key: string): void {
  if (!storageAvailable) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently ignore
  }
}

/**
 * Creates a Zustand-compatible storage adapter with full error handling.
 * Use this in any Zustand `persist` config to avoid crashes in private browsing.
 */
export const safeStorage = {
  getItem: (name: string) => {
    const val = safeGetItem(name);
    return val ? JSON.parse(val) : null;
  },
  setItem: (name: string, value: unknown) => {
    safeSetItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    safeRemoveItem(name);
  },
};
