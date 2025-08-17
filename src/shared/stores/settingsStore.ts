import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  dailyTipsEnabled: boolean;
  dailyTipsTime: string;
  milestoneReminders: boolean;
  weeklyDigest: boolean;
  safetyAlerts: boolean;
}

export interface AppSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}

interface SettingsState {
  // State
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateLanguage: (language: string) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  resetSettings: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultSettings: AppSettings = {
  language: 'English',
  theme: 'light',
  notifications: {
    dailyTipsEnabled: true,
    dailyTipsTime: '9:00 AM',
    milestoneReminders: true,
    weeklyDigest: true,
    safetyAlerts: true,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      isLoading: false,
      error: null,

      // Actions
      updateNotificationSettings: (updates: Partial<NotificationSettings>) => {
        const currentSettings = get().settings;
        set({
          settings: {
            ...currentSettings,
            notifications: {
              ...currentSettings.notifications,
              ...updates,
            },
          },
        });
      },

      updateLanguage: (language: string) => {
        const currentSettings = get().settings;
        set({
          settings: {
            ...currentSettings,
            language,
          },
        });
      },

      updateTheme: (theme: 'light' | 'dark' | 'system') => {
        const currentSettings = get().settings;
        set({
          settings: {
            ...currentSettings,
            theme,
          },
        });
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
