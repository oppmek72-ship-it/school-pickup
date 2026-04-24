const BACKEND_URL = 'https://school-pickup-sg.onrender.com';

function isSameOriginBackend() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.endsWith('.onrender.com') || host === 'localhost' || host === '127.0.0.1';
}

export const API_BASE = isSameOriginBackend() ? '/api' : `${BACKEND_URL}/api`;
export const SOCKET_URL = isSameOriginBackend() ? window.location.origin : BACKEND_URL;
