import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { fetchApi } from './api.js';

interface AuthContextType {
  user: User | null;
  admin: { id: string; email: string; name: string; role: string } | null;
  token: string | null;
  adminToken: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithToken: (token: string, userData: User) => void;
  loginAdmin: (token: string, adminData: { id: string; email: string; name: string; role: string }) => void;
  logout: () => void;
  logoutAdmin: () => void;
  refreshUser: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('bawal_user_token'));
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('bawal_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('bawal_user_token');
      if (storedToken) {
        const res = await fetchApi<{ user: User | null }>('/api/auth/me');
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAdmin = async () => {
    const storedAdminToken = localStorage.getItem('bawal_admin_token');
    if (!storedAdminToken) {
      setAdmin(null);
      setAdminToken(null);
      return;
    }
    try {
      const res = await fetchApi<{ success: boolean; admin: any }>('/api/auth/admin-me');
      if (res.success && res.admin) {
        setAdmin(res.admin);
        localStorage.setItem('bawal_admin_user', JSON.stringify(res.admin));
      } else {
        setAdmin(null);
        setAdminToken(null);
        localStorage.removeItem('bawal_admin_token');
        localStorage.removeItem('bawal_admin_user');
      }
    } catch {
      setAdmin(null);
      setAdminToken(null);
      localStorage.removeItem('bawal_admin_token');
      localStorage.removeItem('bawal_admin_user');
    }
  };

  useEffect(() => {
    // Check saved admin session
    const savedAdmin = localStorage.getItem('bawal_admin_user');
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        // ignore
      }
    }

    refreshUser();
    refreshAdmin();

    const handleUnauthorizedAdmin = () => {
      setAdmin(null);
      setAdminToken(null);
    };
    window.addEventListener('bawal:admin-unauthorized', handleUnauthorizedAdmin);
    return () => window.removeEventListener('bawal:admin-unauthorized', handleUnauthorizedAdmin);
  }, []);

  const loginWithToken = (newToken: string, userData: User) => {
    localStorage.setItem('bawal_user_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const loginAdmin = (newAdminToken: string, adminData: { id: string; email: string; name: string; role: string }) => {
    localStorage.setItem('bawal_admin_token', newAdminToken);
    localStorage.setItem('bawal_admin_user', JSON.stringify(adminData));
    setAdminToken(newAdminToken);
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('bawal_admin_token');
    localStorage.removeItem('bawal_admin_user');
    setAdminToken(null);
    setAdmin(null);
  };

  const logout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('bawal_user_token');
    localStorage.removeItem('bawal_admin_token');
    localStorage.removeItem('bawal_admin_user');
    setToken(null);
    setAdminToken(null);
    setUser(null);
    setAdmin(null);
  };

  const isAdmin = Boolean(
    admin && (admin.role === 'ADMIN' || admin.role === 'SUPER_ADMIN' || admin.role === 'STAFF')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        token,
        adminToken,
        isAdmin,
        isLoading,
        loginWithToken,
        loginAdmin,
        logout,
        logoutAdmin,
        refreshUser,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};