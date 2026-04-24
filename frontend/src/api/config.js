const BACKEND_URL = 'https://school-pickup-sg.onrender.com';

function isNative() {
  if (typeof window === 'undefined') return false;
  const proto = window.location.protocol;
  return proto === 'capacitor:' || proto === 'file:' || !!window.Capacitor?.isNativePlatform?.();
}

export const API_BASE = isNative() ? `${BACKEND_URL}/api` : '/api';
export const SOCKET_URL = isNative() ? BACKEND_URL : window.location.origin;
