import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from 'firebase/auth';
import type { User } from '../types';
import { safeId } from '../utils/safeId';
import { safeStorage } from '../utils/safeStorage';
import { authAPI } from '../api/client';


interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (v: boolean) => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
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
        if (isFirebaseConfigured()) {
          try {
            await signOut(auth);
          } catch {
            // Ignore sign-out errors
          }
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setLoading: (loading) => set({ loading }),

      sendPasswordReset: async (email: string) => {
        if (!isFirebaseConfigured()) return { error: 'Auth service not configured.' };
        try {
          const { sendPasswordResetEmail } = await import('firebase/auth');
          await sendPasswordResetEmail(auth, email);
          return {};
        } catch (error: any) {
          return { error: error.message || 'Failed to send reset email.' };
        }
      },

      signInWithGoogle: async () => {
        if (!isFirebaseConfigured()) {
          console.warn('[PrepMate] Firebase not configured. Cannot sign in with Google.');
          return { error: 'Auth service not configured.' };
        }
        set({ loading: true });
        try {
          const isMobileWebView = /FBAN|FBAV|Instagram|Twitter|LinkedIn|WebView/i.test(
            typeof navigator !== 'undefined' ? navigator.userAgent : ''
          );
          let result;
          if (isMobileWebView) {
            const { signInWithRedirect } = await import('firebase/auth');
            await signInWithRedirect(auth, googleProvider);
            return {};
          }
          try {
            result = await signInWithPopup(auth, googleProvider);
          } catch (popupError: any) {
            if (
              popupError.code === 'auth/popup-blocked' ||
              popupError.code === 'auth/popup-closed-by-user' ||
              /popup/i.test(popupError.message || '')
            ) {
              console.warn('[PrepMate] Popup blocked or failed. Falling back to redirect.');
              const { signInWithRedirect } = await import('firebase/auth');
              await signInWithRedirect(auth, googleProvider);
              return {};
            }
            throw popupError;
          }
          const token = await result.user.getIdToken();
          const user = result.user;
          get().login({
            id: user.uid,
            email: user.email || '',
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            avatarUrl: user.photoURL || undefined,
            createdAt: user.metadata.creationTime || new Date().toISOString(),
          }, token);
          return {};
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Google sign-in error:', message);
          return { error: message };
        } finally {
          set({ loading: false });
        }
      },

      signInWithEmail: async (email, password) => {
        // When Firebase is configured, use Firebase Auth
        if (isFirebaseConfigured()) {
          set({ loading: true });
          try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const token = await result.user.getIdToken();
            const user = result.user;
            get().login({
              id: user.uid,
              email: user.email || '',
              firstName: user.displayName?.split(' ')[0] || email.split('@')[0],
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              createdAt: user.metadata.creationTime || new Date().toISOString(),
            }, token);
            return {};
          } catch (error: unknown) {
            set({ loading: false });
            return { error: error instanceof Error ? error.message : 'Failed to sign in' };
          }
        }
        
        // When Firebase is NOT configured, use the backend API directly
        set({ loading: true });
        try {
          const { data } = await authAPI.login(email, password);
          get().login({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            createdAt: data.user.createdAt,
          }, data.access_token);
          return {};
        } catch (error: any) {
          set({ loading: false });
          const message = error.response?.data?.detail || error.message || 'Failed to sign in';
          return { error: message };
        }
      },

      signUpWithEmail: async (email, password, firstName, lastName) => {
        // When Firebase is configured, use Firebase Auth
        if (isFirebaseConfigured()) {
          set({ loading: true });
          try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, {
              displayName: `${firstName} ${lastName}`,
            });
            const token = await result.user.getIdToken();
            const user = result.user;
            get().login({
              id: user.uid,
              email: user.email || '',
              firstName,
              lastName,
              createdAt: user.metadata.creationTime || new Date().toISOString(),
            }, token);
            return {};
          } catch (error: unknown) {
            set({ loading: false });
            return { error: error instanceof Error ? error.message : 'Failed to sign up' };
          }
        }

        // When Firebase is NOT configured, use the backend API directly
        set({ loading: true });
        try {
          const { data } = await authAPI.register({ email, password, firstName, lastName });
          get().login({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            createdAt: data.user.createdAt,
          }, data.access_token);
          return {};
        } catch (error: any) {
          set({ loading: false });
          const message = error.response?.data?.detail || error.message || 'Failed to sign up';
          return { error: message };
        }
      },

      initAuth: () => {
        if (!isFirebaseConfigured()) return;
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const token = await user.getIdToken();
            set({
              user: {
                id: user.uid,
                email: user.email || '',
                firstName: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                avatarUrl: user.photoURL || undefined,
                createdAt: user.metadata.creationTime || new Date().toISOString(),
              },
              token,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            set({ user: null, token: null, isAuthenticated: false, loading: false });
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
      // Custom storage handler to prevent crashes on QuotaExceededError (Incognito/Private modes)
      storage: safeStorage,
    }
  )
);
