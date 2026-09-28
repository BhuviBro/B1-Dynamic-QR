import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  subscribeToAuth,
  signInUser,
  signUpUser,
  signOutUser,
  mockQuickSignIn,
} from '../firebase/authService';
import { isConfigured, configSource } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuth((data) => {
      setAuthState(data);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    return await signInUser(email, password);
  };

  const signup = async (email, password, displayName) => {
    return await signUpUser(email, password, displayName);
  };

  const logout = async () => {
    return await signOutUser();
  };

  const switchMockUser = (email) => {
    return mockQuickSignIn(email);
  };

  const { user, profile, loading } = authState;
  const isAuthenticated = Boolean(user);
  const status = profile?.status || 'pending';
  const role = profile?.role || 'user';
  const isApproved = status === 'approved';
  const isAdmin = role === 'admin' && isApproved;
  const isPending = status === 'pending';
  const isRevoked = status === 'revoked';

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    isApproved,
    isAdmin,
    isPending,
    isRevoked,
    role,
    status,
    isConfigured,
    configSource,
    login,
    signup,
    logout,
    switchMockUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
