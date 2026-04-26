const BACKEND_URL = 'https://school-pickup-sg.onrender.com';

function isCapacitorApp() {
  if (typeof window === 'undefined') return false;
  // Capacitor injects window.Capacitor; also check protocol (capacitor:// or file://)
  if (window.Capacitor) return true;
  const proto = window.location.protocol;
  return proto === 'capacitor:' || proto === 'file:';
}

function isSameOriginBackend() {
  if (typeof window === 'undefined') return false;
  // APK (Capacitor) — never same-origin, always go to remote backend
  if (isCapacitorApp()) return false;
  const host = window.location.hostname;
  // Only treat localhost as same-origin during dev (http:// from vite dev server)
  if (host === 'localhost' || host === '127.0.0.1') {
    return window.location.protocol === 'http:';
  }
  return host.endsWith('.onrender.com');
}

export const API_BASE = isSameOriginBackend() ? '/api' : `${BACKEND_URL}/api`;
export const SOCKET_URL = isSameOriginBackend() ? window.location.origin : BACKEND_URL;
