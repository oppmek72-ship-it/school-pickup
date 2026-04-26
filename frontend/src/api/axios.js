import axios from 'axios';
import { API_BASE } from './config';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000, // 90s — Render cold start + slow Lao mobile network
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Tag retry count
  if (config.__retryCount === undefined) config.__retryCount = 0;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Auto-retry on network/timeout errors (max 3 retries with exponential backoff)
    const cfg = error.config;
    const isNetwork = !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error';
    const isRetryable = isNetwork || (error.response?.status >= 500 && error.response?.status !== 501);
    // Don't retry write operations on network error (could double-submit)
    const isSafeMethod = !cfg?.method || ['get', 'head', 'options'].includes(cfg.method.toLowerCase());

    if (cfg && isRetryable && cfg.__retryCount < 3 && (isSafeMethod || cfg.__retryCount < 1)) {
      cfg.__retryCount += 1;
      const delay = 800 * Math.pow(1.6, cfg.__retryCount - 1); // 800ms, 1.3s, 2s
      await new Promise((r) => setTimeout(r, delay));
      return api(cfg);
    }

    return Promise.reject(error);
  }
);

export default api;
