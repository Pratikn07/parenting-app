import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  babyName?: string;
  birthDate?: string;
  parentingStage: 'expecting' | 'newborn' | 'infant' | 'toddler' | 'preschool' | 'school';
  feedingPreference: 'breastfeeding' | 'formula' | 'mixed';
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  error: string | null;
  guestData?: any;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthState: (url?: string) => Promise<void>;
  // Guest Actions
  setGuestData: (data: any) => void;
  continueWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isLoading: false,
      error: null,
      guestData: null,

      setGuestData: (data: any) => {
        set({ guestData: data, hasCompletedOnboarding: true });
      },

      continueWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const { AuthService } = await import('../../services/auth/AuthService');
          await AuthService.signInWithGoogle();
          // Note: OAuth redirects away, so loading state is handled by checkAuthState
          // But we reset it here in case the browser is dismissed without completing
          set({ isLoading: false });
        } catch (error) {
          console.log('Google auth error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Google Sign In failed',
          });
        }
      },

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('Login attempt:', { email });

          // Call actual Supabase authentication
          const { AuthService } = await import('../../services/auth/AuthService');
          const response = await AuthService.signInWithEmail({ email, password });

          if (!response.user) {
            throw new Error('Authentication failed - no user data returned');
          }

          // Map the response to our User type
          const user: User = {
            id: response.user.id,
            name: response.user.name || 'User',
            email: response.user.email,
            parentingStage: response.user.parenting_stage || 'expecting',
            feedingPreference: response.user.feeding_preference || 'breastfeeding',
            createdAt: response.user.created_at,
            updatedAt: response.user.updated_at,
          };

          set({
            user,
            isAuthenticated: true,
            hasCompletedOnboarding: response.user.has_completed_onboarding || false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.log('Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed. Please check your email and password.',
          });
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('Signup attempt:', { name, email });

          // Call actual Supabase authentication
          const { AuthService } = await import('../../services/auth/AuthService');
          const response = await AuthService.signUpWithEmail({ name, email, password });

          if (!response.user) {
            throw new Error('Registration failed - no user data returned');
          }

          // Map the response to our User type
          const user: User = {
            id: response.user.id,
            name: response.user.name || name,
            email: response.user.email,
            parentingStage: response.user.parenting_stage || 'expecting',
            feedingPreference: response.user.feeding_preference || 'breastfeeding',
            createdAt: response.user.created_at,
            updatedAt: response.user.updated_at,
          };

          set({
            user,
            isAuthenticated: true,
            hasCompletedOnboarding: response.user.has_completed_onboarding || false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.log('Signup error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Signup failed. Please try again.',
          });
        }
      },

      logout: async () => {
        try {
          console.log('Logout');

          // Actually sign out from Supabase to clear session
          const { AuthService } = await import('../../services/auth/AuthService');
          await AuthService.signOut();

          // Clear local state completely
          set({
            user: null,
            isAuthenticated: false,
            hasCompletedOnboarding: false,
            isLoading: false,
            error: null,
            guestData: null,
          });
        } catch (error) {
          console.log('Logout error:', error);
          // Still clear local state even if logout fails
          set({
            user: null,
            isAuthenticated: false,
            hasCompletedOnboarding: false,
            isLoading: false,
            error: null,
            guestData: null,
          });
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          set({ user: updatedUser });
        }
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuthState: async (url?: string) => {
        try {
          const { AuthService } = await import('../../services/auth/AuthService');

          console.log('🔍 Auth state check started...');

          // Handle OAuth callback if URL is provided
          if (url) {
            console.log('🔗 Processing OAuth callback URL:', url);
            await AuthService.handleOAuthCallback(url);
          }

          // Check current session
          console.log('🔑 Getting current session...');
          const session = await AuthService.getSession();
          console.log('📋 Session result:', session ? 'Found session' : 'No session');

          if (!session) {
            set({
              user: null,
              isAuthenticated: false,
              hasCompletedOnboarding: false,
            });
            return;
          }

          console.log('👤 Getting current user...');
          const currentUser = await AuthService.getCurrentUser();
          console.log('📋 User result:', currentUser ? `Found user: ${currentUser.email}` : 'No user');

          if (currentUser) {
            set({
              user: {
                id: currentUser.id,
                name: currentUser.name || 'Unknown',
                email: currentUser.email || '',
                parentingStage: currentUser.parenting_stage || 'expecting',
                feedingPreference: currentUser.feeding_preference || 'breastfeeding',
                createdAt: currentUser.created_at,
                updatedAt: currentUser.updated_at,
              },
              isAuthenticated: true,
              hasCompletedOnboarding: currentUser.has_completed_onboarding,
              error: null,
            });
          } else {
            // User has a session but no profile - sign them out to clear stale session
            console.log('⚠️ Session exists but no user profile found, signing out...');
            await AuthService.signOut();
            set({
              user: null,
              isAuthenticated: false,
              hasCompletedOnboarding: false,
            });
          }
        } catch (error) {
          console.log('Check auth state error:', error);
          // If there's an error (like user deleted), clear the session
          try {
            const { AuthService } = await import('../../services/auth/AuthService');
            await AuthService.signOut();
          } catch (signOutError) {
            console.log('Failed to sign out after error:', signOutError);
          }
          set({
            user: null,
            isAuthenticated: false,
            hasCompletedOnboarding: false,
            error: null, // Don't show error for deleted user scenario
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);