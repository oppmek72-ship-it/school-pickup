import { createContext, useContext, useState } from 'react';
import api from '../api/axios';
import { setCache } from '../api/dataCache';

const AuthContext = createContext(null);

// Preload lazy bundles so navigation is instant after login
function preloadParentBundle() {
  return import('../pages/parent/ParentHome').catch(() => {});
}
function preloadTeacherBundle() {
  return import('../pages/teacher/TeacherDashboard').catch(() => {});
}
function preloadAdminBundle() {
  return import('../pages/admin/AdminPanel').catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const _save = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  };

  // Parent login — fetches token + warms /students cache + preloads UI bundle
  const parentLogin = async (studentCode) => {
    setLoading(true);
    try {
      // Kick off bundle preload in parallel — does not delay anything
      const bundlePromise = preloadParentBundle();

      const { data } = await api.post('/auth/parent-login', { studentCode });

      // Save token first so subsequent api calls have auth
      _save(data);

      // Save the student returned by login as the initial cache entry
      if (data.student) {
        localStorage.setItem('parentStudent', JSON.stringify(data.student));
        // Also seed students cache so ParentHome renders instantly
        setCache('students', [data.student]);
      }

      // Pre-fetch full /students list (in case parent has multiple kids)
      // and wait for the lazy bundle so first paint is instant — but
      // bound the wait so a flaky network never blocks login.
      const fetchStudents = api.get('/students')
        .then((r) => {
          setCache('students', r.data);
          return r.data;
        })
        .catch(() => null);

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 8000));
      await Promise.race([
        Promise.all([bundlePromise, fetchStudents]),
        timeoutPromise,
      ]);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Staff login — same pattern: warm queue cache + preload bundle
  const staffLogin = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/staff-login', { username, password });
      _save(data);

      const role = data.user.role;
      const bundlePromise = role === 'admin' ? preloadAdminBundle() : preloadTeacherBundle();

      // Pre-fetch the data the dashboard will need
      const fetchData = role === 'admin'
        ? api.get('/students').then((r) => setCache('students', r.data)).catch(() => null)
        : api.get('/pickup/queue').then((r) => setCache('pickupQueue', r.data)).catch(() => null);

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 8000));
      await Promise.race([
        Promise.all([bundlePromise, fetchData]),
        timeoutPromise,
      ]);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => staffLogin(phone, password);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('parentStudent');
    // Note: keep dataCache so next login is fast; clearAllCache() if you want a hard reset
  };

  return (
    <AuthContext.Provider value={{ user, token, login, parentLogin, staffLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
