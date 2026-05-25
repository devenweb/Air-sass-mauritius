import React, { createContext, useContext } from 'react';

// Authentication has been removed as per guest-only requirement
type AuthContextType = {
  session: { user: { id: string, email?: string } } | null;
  loading: boolean;
  login: () => Promise<any>;
  register: () => Promise<any>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  userId: string | undefined;
  userEmail: string | undefined;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // We keep the hook functionality but with no data
    return {
      session: null,
      loading: false,
      login: async () => ({ success: true }),
      register: async () => ({ success: true }),
      logout: async () => {},
      signOut: async () => {},
      userId: undefined,
      userEmail: undefined
    };
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // No-op AuthProvider - returns no user or session
  const value = {
    session: null,
    loading: false,
    login: async () => ({ success: true }),
    register: async () => ({ success: true }),
    logout: async () => {},
    signOut: async () => {},
    userId: undefined,
    userEmail: undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
