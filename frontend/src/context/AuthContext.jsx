import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

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

  // Parent login: ໃສ່ Student Code ເທົ່ານັ້ນ
  const parentLogin = async (studentCode) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/parent-login', { studentCode });
      // Save student info for parent dashboard
      if (data.student) localStorage.setItem('parentStudent', JSON.stringify(data.student));
      return _save(data);
    } finally {
      setLoading(false);
    }
  };

  // Staff login: username/classCode + password
  const staffLogin = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/staff-login', { username, password });
      return _save(data);
    } finally {
      setLoading(false);
    }
  };

  // Legacy login (backwards compat)
  const login = async (phone, password) => staffLogin(phone, password);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('parentStudent');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, parentLogin, staffLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
