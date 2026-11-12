import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '../types';
import { api, getStoredToken, setStoredToken } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; department?: string; graduation_year?: number; roll_number?: string }) => Promise<void>;
  logout: () => Promise<void>;
  initiateGoogleLogin: () => Promise<void>;
  loginWithGoogle: (code: string, state?: string) => Promise<void>;
  initiateGoogleDriveConnect: () => Promise<void>;
  connectGoogleDrive: (code: string, state?: string) => Promise<void>;
  disconnectGoogleDrive: () => Promise<void>;
  toggleGoogleDrive: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUserProfile = (payload: any): UserProfile => ({
  id: payload.id,
  email: payload.email,
  fullName: payload.full_name ?? payload.fullName ?? payload.email?.split('@')[0] ?? 'User',
  avatarUrl: payload.avatar_url ?? payload.avatarUrl ?? '',
  department: payload.department,
  graduationYear: payload.graduation_year ?? payload.graduationYear,
  isGoogleDriveConnected: Boolean(payload.is_google_drive_connected ?? payload.isGoogleDriveConnected),
  googleDriveEmail: payload.google_drive_email ?? payload.googleDriveEmail,
  googleDriveAllocatedBytes: payload.google_drive_allocated_bytes ?? payload.googleDriveAllocatedBytes ?? 0,
  googleDriveTotalBytes: payload.google_drive_total_bytes ?? payload.googleDriveTotalBytes ?? 0,
  publicKeyFingerprint: payload.public_key_fingerprint ?? payload.publicKeyFingerprint,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('agni_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('agni_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agni_user');
      setStoredToken(null);
    }
  }, [user]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const restoreSession = async () => {
      try {
        const profile = await api.getMyProfile();
        setUser(toUserProfile(profile));
      } catch {
        setUser(null);
        setStoredToken(null);
      }
    };

    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await api.login({ email, password });
      setStoredToken(res.access_token);
      const profile = await api.getMyProfile();
      setUser(toUserProfile(profile));
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; full_name: string; department?: string; graduation_year?: number; roll_number?: string }) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await api.register(payload);
      setStoredToken(res.access_token);
      const profile = await api.getMyProfile();
      setUser(toUserProfile(profile));
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account.');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('agni_refresh_token');
    try {
      if (refreshToken) {
        await api.logout(refreshToken);
      }
    } catch {
      // ignore and clear local session regardless
    } finally {
      setUser(null);
      setStoredToken(null);
      localStorage.removeItem('agni_refresh_token');
    }
  }, []);

  const initiateGoogleLogin = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { auth_url } = await api.getGoogleAuthUrl();
      window.location.href = auth_url;
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initiate Google Authentication');
      setIsAuthenticating(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (code: string, state = '') => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await api.postGoogleAuthCallback(code, state);
      setStoredToken(res.access_token);
      localStorage.setItem('agni_refresh_token', res.refresh_token);
      const profile = await api.getMyProfile();
      setUser(toUserProfile(profile));
    } catch (err: any) {
      setAuthError(err.message || 'Google Authentication verification failed');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const initiateGoogleDriveConnect = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { auth_url } = await api.getGoogleDriveConnectUrl();
      window.location.href = auth_url;
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initiate Google Drive authorization');
      setIsAuthenticating(false);
    }
  }, []);

  const connectGoogleDrive = useCallback(async (code: string, state = '') => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await api.postGoogleDriveCallback(code, state);
      const profile = await api.getMyProfile();
      setUser(toUserProfile(profile));
      if (res.account_email) {
        setUser((current) => current ? { ...current, isGoogleDriveConnected: true, googleDriveEmail: res.account_email } : current);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to connect Google Drive repository');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const disconnectGoogleDrive = useCallback(async () => {
    try {
      await api.postGoogleDriveDisconnect();
      setUser((current) => current ? { ...current, isGoogleDriveConnected: false } : current);
    } catch {
      setUser((current) => current ? { ...current, isGoogleDriveConnected: false } : current);
    }
  }, []);

  const toggleGoogleDrive = useCallback(() => {
    if (!user) return;
    setUser({
      ...user,
      isGoogleDriveConnected: !user.isGoogleDriveConnected,
    });
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isAuthenticating,
    authError,
    login,
    register,
    logout,
    initiateGoogleLogin,
    loginWithGoogle,
    initiateGoogleDriveConnect,
    connectGoogleDrive,
    disconnectGoogleDrive,
    toggleGoogleDrive,
  }), [user, isAuthenticating, authError, login, register, logout, initiateGoogleLogin, loginWithGoogle, initiateGoogleDriveConnect, connectGoogleDrive, disconnectGoogleDrive, toggleGoogleDrive]);

  return (
    <AuthContext.Provider value={value}>
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
