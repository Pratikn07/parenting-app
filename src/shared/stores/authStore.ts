import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../../services/auth/AuthService';
import { supabase } from '../../services/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  babyName?: string;
  birthDate?: string;
  parentingStage: 'expecting' | 'newborn' | 'infant' | 'toddler';
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
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthState: () => Promise<void>;
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

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.signIn(email, password);
          
          const user: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            parentingStage: 'newborn', // Default, can be updated in onboarding
            feedingPreference: 'breastfeeding', // Default, can be updated in onboarding
            createdAt: response.user.createdAt.toISOString(),
            updatedAt: response.user.updatedAt.toISOString(),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.signUp(name, email, password);
          
          const user: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            parentingStage: 'expecting', // Default for new users
            feedingPreference: 'breastfeeding', // Default
            createdAt: response.user.createdAt.toISOString(),
            updatedAt: response.user.updatedAt.toISOString(),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Signup error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Signup failed',
          });
        }
      },

      logout: async () => {
        try {
          await AuthService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            hasCompletedOnboarding: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state even if logout fails
          set({
            user: null,
            isAuthenticated: false,
            hasCompletedOnboarding: false,
            error: null,
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

      checkAuthState: async () => {
        set({ isLoading: true });
        
        try {
          const currentUser = await AuthService.getCurrentUser();
          
          if (currentUser) {
            const user: User = {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              parentingStage: 'newborn', // Would be loaded from user profile
              feedingPreference: 'breastfeeding', // Would be loaded from user profile
              createdAt: currentUser.createdAt.toISOString(),
              updatedAt: currentUser.updatedAt.toISOString(),
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              hasCompletedOnboarding: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth state check error:', error);
          set({
            user: null,
            isAuthenticated: false,
            hasCompletedOnboarding: false,
            isLoading: false,
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

// Initialize auth state check on app start
export const initializeAuth = async () => {
  const store = useAuthStore.getState();
  await store.checkAuthState();
};
