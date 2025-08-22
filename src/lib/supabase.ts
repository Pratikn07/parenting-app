import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter for React Native
const supabaseStorage = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // We don't use URL-based sessions in React Native
  },
  // Optional: Add global headers
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

// Helper function to get current session
export const getCurrentSession = () => {
  return supabase.auth.getSession();
};

// Helper function to get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

// Helper function for auth state changes
export const onAuthStateChange = (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
  return supabase.auth.onAuthStateChange(callback);
};