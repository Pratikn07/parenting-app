// Auto-generated database types (will be generated from Supabase CLI later)
// For now, manually defining based on our current User interface

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
          name: string | null;
          parenting_stage: string | null;
          feeding_preference: string | null;
          has_completed_onboarding: boolean | null;
          avatar_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          locale?: string;
          timezone?: string | null;
          created_at?: string;
          name?: string | null;
          parenting_stage?: string | null;
          feeding_preference?: string | null;
          has_completed_onboarding?: boolean | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string | null;
          locale?: string;
          timezone?: string | null;
          name?: string | null;
          parenting_stage?: string | null;
          feeding_preference?: string | null;
          has_completed_onboarding?: boolean | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
      };
      children: {
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
          updated_at: string | null;
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
          updated_at?: string | null;
        };
        Update: {
          name?: string | null;
          date_of_birth?: string;
          sex?: string | null;
          gestational_age_weeks?: number | null;
          allergies?: string[] | null;
          diet_notes?: string | null;
          pediatrician_contact?: any | null;
          updated_at?: string | null;
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
      daily_tips: {
        Row: {
          id: string;
          user_id: string | null;
          tip_date: string;
          title: string;
          description: string;
          category: string;
          parenting_stage: string;
          child_age_months: number | null;
          quick_tips: string[] | null;
          is_viewed: boolean | null;
          viewed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tip_date: string;
          title: string;
          description: string;
          category: string;
          parenting_stage: string;
          child_age_months?: number | null;
          quick_tips?: string[] | null;
          is_viewed?: boolean | null;
          viewed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          parenting_stage?: string;
          child_age_months?: number | null;
          quick_tips?: string[] | null;
          is_viewed?: boolean | null;
          viewed_at?: string | null;
        };
      };
      user_activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
          resource_id: string | null;
          milestone_id: string | null;
          metadata: any | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
          resource_id?: string | null;
          milestone_id?: string | null;
          metadata?: any | null;
          created_at?: string | null;
        };
        Update: {
          metadata?: any | null;
        };
      };
      milestones: {
        Row: {
          id: string;
          child_id: string | null;
          title: string;
          description: string | null;
          achieved_at: string | null;
          milestone_type: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          child_id?: string | null;
          title: string;
          description?: string | null;
          achieved_at?: string | null;
          milestone_type: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          achieved_at?: string | null;
          milestone_type?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      // Add views if needed later
    };
    Functions: {
      // Add stored procedures if needed later
    };
    Enums: {
      parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler';
      feeding_preference: 'breastfeeding' | 'formula' | 'mixed';
      milestone_type: 'physical' | 'cognitive' | 'social' | 'emotional';
      gender: 'male' | 'female' | 'other';
      activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
    };
  };
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type Article = Database['public']['Tables']['articles']['Row'];
export type DailyTip = Database['public']['Tables']['daily_tips']['Row'];
export type UserActivityLog = Database['public']['Tables']['user_activity_log']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ChildInsert = Database['public']['Tables']['children']['Insert'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
export type DailyTipInsert = Database['public']['Tables']['daily_tips']['Insert'];
export type UserActivityLogInsert = Database['public']['Tables']['user_activity_log']['Insert'];

// Update types  
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ChildUpdate = Database['public']['Tables']['children']['Update'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];
export type ArticleUpdate = Database['public']['Tables']['articles']['Update'];
export type DailyTipUpdate = Database['public']['Tables']['daily_tips']['Update'];
export type UserActivityLogUpdate = Database['public']['Tables']['user_activity_log']['Update'];

// Enum types
export type ParentingStage = Database['public']['Enums']['parenting_stage'];
export type FeedingPreference = Database['public']['Enums']['feeding_preference'];
export type MilestoneType = Database['public']['Enums']['milestone_type'];
export type Gender = Database['public']['Enums']['gender'];
export type ActivityType = Database['public']['Enums']['activity_type'];
