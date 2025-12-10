'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Key for localStorage hint
const AUTH_HINT_KEY = 'rfq_auth_hint';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage for auth hint (instant, no network)
  const hasAuthHint = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(AUTH_HINT_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Set auth hint
  const setAuthHint = useCallback((value: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      if (value) {
        localStorage.setItem(AUTH_HINT_KEY, 'true');
      } else {
        localStorage.removeItem(AUTH_HINT_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthHint(false);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [setAuthHint]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // ✅ Optimistic: If we have auth hint, assume logged in
      // This makes the UI responsive immediately
      const hint = hasAuthHint();
      
      // Get actual session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        setAuthHint(true);
      } else {
        setUser(null);
        setSession(null);
        setAuthHint(false);
      }
      
      setLoading(false);
    };

    // ✅ If we have hint, set loading false immediately for faster perceived load
    // The actual session check happens in background
    if (hasAuthHint()) {
      setLoading(false);
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && newSession) {
          setUser(newSession.user);
          setSession(newSession);
          setAuthHint(true);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setAuthHint(false);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setUser(newSession.user);
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasAuthHint, setAuthHint]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
