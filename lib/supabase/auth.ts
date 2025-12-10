import { supabase } from './client';

// Key must match auth-provider
const AUTH_HINT_KEY = 'rfq_auth_hint';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const signUp = async ({ email, password, fullName }: SignUpData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
};

export const signIn = async ({ email, password }: SignInData) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  // ✅ Set auth hint for faster subsequent loads
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUTH_HINT_KEY, 'true');
    } catch {}
  }
  
  return data;
};

export const signOut = async () => {
  // ✅ Clear auth hint first
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_HINT_KEY);
    } catch {}
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
