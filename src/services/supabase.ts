import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = 'https://ccrgvammglkvdlaojgzv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcmd2YW1tZ2xrdmRsYW9qZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDI0MTMsImV4cCI6MjA3MTAxODQxM30.qEHX8779s2mtGzc_q1dOxnKFH8Ry2_9iDLyqH25nPzk';

// Create Supabase client with React Native configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (will be generated from Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          locale: string;
          timezone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          locale?: string;
          timezone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          locale?: string;
          timezone?: string | null;
          created_at?: string;
        };
      };
      babies: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          date_of_birth: string;
          sex: string | null;
          gestational_age_weeks: number | null;
          allergies: string[] | null;
          diet_notes: string | null;
          pediatrician_contact: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          date_of_birth: string;
          sex?: string | null;
          gestational_age_weeks?: number | null;
          allergies?: string[] | null;
          diet_notes?: string | null;
          pediatrician_contact?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          date_of_birth?: string;
          sex?: string | null;
          gestational_age_weeks?: number | null;
          allergies?: string[] | null;
          diet_notes?: string | null;
          pediatrician_contact?: any | null;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          baby_id: string | null;
          topic: string | null;
          started_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          baby_id?: string | null;
          topic?: string | null;
          started_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          baby_id?: string | null;
          topic?: string | null;
          started_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          session_id: string;
          role: string;
          content: string;
          tokens: number | null;
          safety_flags: any | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          role: string;
          content: string;
          tokens?: number | null;
          safety_flags?: any | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          role?: string;
          content?: string;
          tokens?: number | null;
          safety_flags?: any | null;
          created_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          slug: string | null;
          title: string;
          body_md: string;
          age_min_days: number | null;
          age_max_days: number | null;
          locale: string;
          tags: string[] | null;
          last_reviewed_at: string | null;
          reviewer: string | null;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          title: string;
          body_md: string;
          age_min_days?: number | null;
          age_max_days?: number | null;
          locale?: string;
          tags?: string[] | null;
          last_reviewed_at?: string | null;
          reviewer?: string | null;
        };
        Update: {
          id?: string;
          slug?: string | null;
          title?: string;
          body_md?: string;
          age_min_days?: number | null;
          age_max_days?: number | null;
          locale?: string;
          tags?: string[] | null;
          last_reviewed_at?: string | null;
          reviewer?: string | null;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          due_at: string | null;
          rrule: string | null;
          payload: any | null;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          due_at?: string | null;
          rrule?: string | null;
          payload?: any | null;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          due_at?: string | null;
          rrule?: string | null;
          payload?: any | null;
          status?: string;
        };
      };
      growth_measurements: {
        Row: {
          id: string;
          baby_id: string;
          measured_at: string;
          weight_g: number | null;
          length_cm: number | null;
          head_circum_cm: number | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          baby_id: string;
          measured_at: string;
          weight_g?: number | null;
          length_cm?: number | null;
          head_circum_cm?: number | null;
          source?: string | null;
        };
        Update: {
          id?: string;
          baby_id?: string;
          measured_at?: string;
          weight_g?: number | null;
          length_cm?: number | null;
          head_circum_cm?: number | null;
          source?: string | null;
        };
      };
    };
    Functions: {
      search_articles: {
        Args: {
          age_days: number;
          locale: string;
          tags: string[];
        };
        Returns: Database['public']['Tables']['articles']['Row'][];
      };
      search_embeddings: {
        Args: {
          query_embedding: number[];
          match_count: number;
          filter?: any;
        };
        Returns: {
          id: string;
          source_table: string;
          source_id: string;
          chunk_index: number;
          locale: string;
          tags: string[];
          age_min_days: number;
          age_max_days: number;
          similarity: number;
        }[];
      };
      get_personalized_articles: {
        Args: {
          baby_id: string;
          locale?: string;
          limit_count?: number;
        };
        Returns: Database['public']['Tables']['articles']['Row'][];
      };
      get_upcoming_reminders: {
        Args: {
          user_id: string;
          days_ahead?: number;
        };
        Returns: Database['public']['Tables']['reminders']['Row'][];
      };
    };
  };
}

// Helper functions for common operations
export const createUserProfile = async (userId: string, email: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        id: userId,
        email,
        locale: 'en-US',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Real-time subscriptions helper
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
