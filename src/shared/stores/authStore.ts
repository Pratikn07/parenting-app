import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
          // TODO: Implement actual authentication
          console.log('Login attempt:', { email });
          
          // Mock successful login for demo
          const mockUser: User = {
            id: 'demo-user-' + Date.now(),
            name: email.split('@')[0],
            email,
            parentingStage: 'newborn',
            feedingPreference: 'breastfeeding',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          set({
            user: mockUser,
            isAuthenticated: true,
            hasCompletedOnboarding: true, // Auto-complete onboarding for demo login
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
          // TODO: Implement actual registration
          console.log('Signup attempt:', { name, email });
          
          // Mock successful signup for demo
          const mockUser: User = {
            id: 'demo-user-' + Date.now(),
            name,
            email,
            parentingStage: 'expecting',
            feedingPreference: 'breastfeeding',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1500));

          set({
            user: mockUser,
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
          // TODO: Implement actual logout
          console.log('Logout');
          
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