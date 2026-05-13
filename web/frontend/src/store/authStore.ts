import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (v: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error?: string }>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: (user, token) => set({ user, token, isAuthenticated: true, loading: false }),
      logout: async () => {
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut();
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setLoading: (loading) => set({ loading }),

      signInWithGoogle: async () => {
        if (!isSupabaseConfigured()) {
          console.warn('[PrepMate] Supabase not configured. Cannot sign in with Google.');
          return;
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) console.error('Google sign-in error:', error.message);
      },

      signInWithEmail: async (email, password) => {
        if (!isSupabaseConfigured()) {
          // Local fallback
          get().login(
            { id: crypto.randomUUID(), email, firstName: email.split('@')[0], lastName: '', createdAt: new Date().toISOString() },
            `local-${Date.now()}`
          );
          return {};
        }
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ loading: false });
          return { error: error.message };
        }
        if (data.user) {
          get().login(
            {
              id: data.user.id,
              email: data.user.email || email,
              firstName: data.user.user_metadata?.first_name || email.split('@')[0],
              lastName: data.user.user_metadata?.last_name || '',
              createdAt: data.user.created_at,
            },
            data.session?.access_token || ''
          );
        }
        return {};
      },

      signUpWithEmail: async (email, password, firstName, lastName) => {
        if (!isSupabaseConfigured()) {
          get().login(
            { id: crypto.randomUUID(), email, firstName, lastName, createdAt: new Date().toISOString() },
            `local-${Date.now()}`
          );
          return {};
        }
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) {
          set({ loading: false });
          return { error: error.message };
        }
        if (data.user) {
          get().login(
            {
              id: data.user.id,
              email: data.user.email || email,
              firstName,
              lastName,
              createdAt: data.user.created_at,
            },
            data.session?.access_token || ''
          );
        }
        return {};
      },

      initAuth: () => {
        if (!isSupabaseConfigured()) return;
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const u = session.user;
            set({
              user: {
                id: u.id,
                email: u.email || '',
                firstName: u.user_metadata?.first_name || u.email?.split('@')[0] || '',
                lastName: u.user_metadata?.last_name || '',
                createdAt: u.created_at,
              },
              token: session.access_token,
              isAuthenticated: true,
              loading: false,
            });
          }
        });
      },
    }),
    {
      name: 'prepmate-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
