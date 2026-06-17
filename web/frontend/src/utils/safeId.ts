/**
 * Generates a unique ID string.
 * Uses crypto.randomUUID() when available (HTTPS + modern browsers),
 * falls back to a manual implementation for HTTP localhost and older browsers.
 */
export function safeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Ignored — fall through to manual implementation
  }

  // Manual UUID v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
