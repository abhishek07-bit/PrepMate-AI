import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onIdTokenChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import type { User } from '../types';
import { safeStorage } from '../utils/safeStorage';
import { authAPI } from '../api/client';
import { useResumeStore } from './resumeStore';
import { useInterviewStore } from './interviewStore';
import { useUIStore } from './uiStore';

const REDIRECT_PENDING_KEY = 'prepmate_google_redirect_pending';
let authListenersBound = false;
let lastSyncedUid: string | null = null;

// Helper to translate Firebase technical errors to user-friendly messages
const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred.';

  const code = error.code || '';
  const message = error.message || String(error);

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Invalid email or password.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. It must be at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in window was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/web-storage-unsupported') {
    return 'Third-party storage or cookies are blocked in your browser. Allow cookies/storage for Google Sign-In or sign in with email/password.';
  }

  // Fallback for non-Firebase or unmapped errors
  if (message.includes('Firebase: Error')) {
    return 'Authentication failed. Please try again.';
  }

  return message;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (v: boolean) => void;
  signInWithGoogle: () => Promise<{ error?: string; redirecting?: boolean }>;
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
        if (isFirebaseConfigured() && auth) {
          try {
            await signOut(auth);
          } catch {
            // Ignore sign-out errors
          }
        }
        lastSyncedUid = null;
        useResumeStore.getState().clearResume();
        useInterviewStore.getState().reset();
        useInterviewStore.setState({ sessions: [] });
        set({ user: null, token: null, isAuthenticated: false, loading: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setLoading: (loading) => set({ loading }),

      sendPasswordReset: async (email: string) => {
        if (!isFirebaseConfigured() || !auth) return { error: 'Auth service not configured.' };
        try {
          await sendPasswordResetEmail(auth, email);
          return {};
        } catch (error: any) {
          return { error: getAuthErrorMessage(error) };
        }
      },

      signInWithGoogle: async () => {
        if (!isFirebaseConfigured() || !auth || !googleProvider) {
          console.warn('[PrepMate] Firebase not configured. Cannot sign in with Google.');
          return { error: 'Auth service not configured.' };
        }
        set({ loading: true });
        try {
          const isMobileWebView = /FBAN|FBAV|Instagram|Twitter|LinkedIn|WebView/i.test(
            typeof navigator !== 'undefined' ? navigator.userAgent : ''
          );
          const triggerRedirect = async () => {
            try {
              window.sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
            } catch {
              // Ignore storage write restriction
            }
            await signInWithRedirect(auth, googleProvider);
            return { redirecting: true };
          };

          let result;
          if (isMobileWebView) {
            return await triggerRedirect();
          }
          try {
            result = await signInWithPopup(auth, googleProvider);
          } catch (popupError: any) {
            console.warn('[PrepMate] Google popup failed:', popupError?.code || 'unknown', popupError?.message || '');
            if (popupError?.code === 'auth/popup-blocked') {
              console.warn('[PrepMate] Popup blocked by browser. Falling back to redirect.');
              return await triggerRedirect();
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
        } catch (error: any) {
          console.error('Google sign-in error:', error);
          return { error: getAuthErrorMessage(error) };
        } finally {
          set({ loading: false });
        }
      },

      signInWithEmail: async (email, password) => {
        if (isFirebaseConfigured() && auth) {
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
          } catch (error: any) {
            set({ loading: false });
            return { error: getAuthErrorMessage(error) };
          }
        }

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
        if (isFirebaseConfigured() && auth) {
          set({ loading: true });
          try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, {
              displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
            });
            const token = await result.user.getIdToken(true);
            const user = result.user;
            get().login({
              id: user.uid,
              email: user.email || '',
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              createdAt: user.metadata.creationTime || new Date().toISOString(),
            }, token);
            // Persist chosen profile names to backend DB cleanly
            authAPI.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }).catch(() => {});
            return {};
          } catch (error: any) {
            set({ loading: false });
            return { error: getAuthErrorMessage(error) };
          }
        }

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
        if (authListenersBound) return;
        authListenersBound = true;

        if (typeof window !== 'undefined') {
          window.addEventListener('auth-unauthorized', () => {
            if (!auth?.currentUser) {
              lastSyncedUid = null;
              useResumeStore.getState().clearResume();
              useInterviewStore.getState().reset();
              useInterviewStore.setState({ sessions: [] });
              set({ user: null, token: null, isAuthenticated: false, loading: false });
            }
          });
        }

        if (!isFirebaseConfigured() || !auth) return;

        getRedirectResult(auth)
          .then((redirectResult) => {
            let wasPending = false;
            try {
              wasPending = window.sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1';
              window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
            } catch {
              // Ignore storage errors
            }
            if (wasPending && !redirectResult && !auth.currentUser) {
              useUIStore.getState().addToast(
                'Google redirect login did not complete because cross-origin browser storage was blocked. Allow popups for this site and try Continue with Google again.',
                'error'
              );
            }
          })
          .catch((error: any) => {
            try {
              window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
            } catch {
              // Ignore storage errors
            }
            useUIStore.getState().addToast(getAuthErrorMessage(error), 'error');
          });

        onIdTokenChanged(auth, async (user) => {
          if (user) {
            const token = await user.getIdToken();
            const currentUser = get().user;
            const fbFirst = user.displayName?.split(' ')[0] || '';
            const fbLast = user.displayName?.split(' ').slice(1).join(' ') || '';

            set({
              user: {
                id: user.uid,
                email: user.email || '',
                firstName: fbFirst || currentUser?.firstName || user.email?.split('@')[0] || '',
                lastName: fbLast || currentUser?.lastName || '',
                avatarUrl: user.photoURL || undefined,
                createdAt: user.metadata.creationTime || new Date().toISOString(),
              },
              token,
              isAuthenticated: true,
              loading: false,
            });

            if (lastSyncedUid !== user.uid) {
              lastSyncedUid = user.uid;
              authAPI.me()
                .then(({ data }) => {
                  if (data?.firstName) {
                    get().updateUser({
                      firstName: data.firstName,
                      lastName: data.lastName || '',
                    });
                  }
                })
                .catch(() => {
                  // Ignore background sync failure
                });
            }
          } else {
            lastSyncedUid = null;
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
      storage: safeStorage,
    }
  )
);
