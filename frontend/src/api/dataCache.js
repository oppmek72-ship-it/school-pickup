/**
 * Persistent localStorage cache with TTL.
 * Used to make dashboards render instantly from last-known-good data
 * while a background refresh fetches fresh data.
 */

const PREFIX = 'cache:';

export function setCache(key, value, ttlMs = 24 * 60 * 60 * 1000) {
  try {
    const entry = { v: value, t: Date.now(), ttl: ttlMs };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch (_) {
    // Quota exceeded — best effort, ignore
  }
}

export function getCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry !== 'object') return null;
    return entry.v ?? null;
  } catch (_) {
    return null;
  }
}

export function getCacheAge(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return Infinity;
    const entry = JSON.parse(raw);
    return Date.now() - (entry.t || 0);
  } catch (_) {
    return Infinity;
  }
}

export function clearCache(key) {
  try { localStorage.removeItem(PREFIX + key); } catch (_) {}
}

export function clearAllCache() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  } catch (_) {}
}
