// Auto-generated database types (will be generated from Supabase CLI later)
// For now, manually defining based on our current User interface

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // UUID, references auth.users(id)
          name: string;
          email: string;
          parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler';
          feeding_preference: 'breastfeeding' | 'formula' | 'mixed';
          has_completed_onboarding: boolean;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          parenting_stage?: 'expecting' | 'newborn' | 'infant' | 'toddler';
          feeding_preference?: 'breastfeeding' | 'formula' | 'mixed';
          has_completed_onboarding?: boolean;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          parenting_stage?: 'expecting' | 'newborn' | 'infant' | 'toddler';
          feeding_preference?: 'breastfeeding' | 'formula' | 'mixed';
          has_completed_onboarding?: boolean;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      children: {
        Row: {
          id: string; // UUID
          parent_id: string; // references profiles(id)
          name: string;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string; // UUID
          child_id: string; // references children(id)
          title: string;
          description?: string;
          achieved_at?: string;
          milestone_type: 'physical' | 'cognitive' | 'social' | 'emotional';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          title: string;
          description?: string;
          achieved_at?: string;
          milestone_type: 'physical' | 'cognitive' | 'social' | 'emotional';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          achieved_at?: string;
          milestone_type?: 'physical' | 'cognitive' | 'social' | 'emotional';
          updated_at?: string;
        };
      };
      resources: {
        Row: {
          id: string;
          title: string;
          description?: string;
          content?: string;
          category?: string;
          parenting_stages?: ('expecting' | 'newborn' | 'infant' | 'toddler')[];
          tags?: string[];
          image_url?: string;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          content?: string;
          category?: string;
          parenting_stages?: ('expecting' | 'newborn' | 'infant' | 'toddler')[];
          tags?: string[];
          image_url?: string;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          content?: string;
          category?: string;
          parenting_stages?: ('expecting' | 'newborn' | 'infant' | 'toddler')[];
          tags?: string[];
          image_url?: string;
          is_featured?: boolean;
          updated_at?: string;
        };
      };
      user_saved_resources: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string;
          saved_at: string;
          notes?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_id: string;
          saved_at?: string;
          notes?: string;
        };
        Update: {
          notes?: string;
        };
      };
      user_activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
          resource_id?: string;
          milestone_id?: string;
          metadata?: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
          resource_id?: string;
          milestone_id?: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          metadata?: any;
        };
      };
      user_progress_stats: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          questions_asked: number;
          tips_received: number;
          content_saved: number;
          milestones_completed: number;
          resources_viewed: number;
          search_queries: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          questions_asked?: number;
          tips_received?: number;
          content_saved?: number;
          milestones_completed?: number;
          resources_viewed?: number;
          search_queries?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          questions_asked?: number;
          tips_received?: number;
          content_saved?: number;
          milestones_completed?: number;
          resources_viewed?: number;
          search_queries?: number;
          updated_at?: string;
        };
      };
      daily_tips: {
        Row: {
          id: string;
          user_id: string;
          tip_date: string;
          title: string;
          description: string;
          category: string;
          parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler';
          child_age_months?: number;
          quick_tips?: string[];
          is_viewed: boolean;
          viewed_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tip_date: string;
          title: string;
          description: string;
          category: string;
          parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler';
          child_age_months?: number;
          quick_tips?: string[];
          is_viewed?: boolean;
          viewed_at?: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          parenting_stage?: 'expecting' | 'newborn' | 'infant' | 'toddler';
          child_age_months?: number;
          quick_tips?: string[];
          is_viewed?: boolean;
          viewed_at?: string;
        };
      };
      milestone_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: 'physical' | 'cognitive' | 'social' | 'emotional';
          age_min_months: number;
          age_max_months: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: 'physical' | 'cognitive' | 'social' | 'emotional';
          age_min_months: number;
          age_max_months: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: 'physical' | 'cognitive' | 'social' | 'emotional';
          age_min_months?: number;
          age_max_months?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      user_milestone_progress: {
        Row: {
          id: string;
          user_id: string;
          child_id: string;
          milestone_template_id: string;
          is_completed: boolean;
          completed_at?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          child_id: string;
          milestone_template_id: string;
          is_completed?: boolean;
          completed_at?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          is_completed?: boolean;
          completed_at?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          is_from_user: boolean;
          created_at: string;
          session_id: string | null;
          child_id: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          is_from_user?: boolean;
          created_at?: string;
          session_id?: string | null;
          child_id?: string | null;
          image_url?: string | null;
        };
        Update: {
          message?: string;
          is_from_user?: boolean;
          session_id?: string | null;
          child_id?: string | null;
          image_url?: string | null;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          child_id: string | null;
          title: string | null;
          started_at: string;
          last_message_at: string | null;
          message_count: number;
          is_archived: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          child_id?: string | null;
          title?: string | null;
          started_at?: string;
          last_message_at?: string | null;
          message_count?: number;
          is_archived?: boolean;
        };
        Update: {
          child_id?: string | null;
          title?: string | null;
          last_message_at?: string | null;
          message_count?: number;
          is_archived?: boolean;
        };
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          body_md: string;
          age_min_days: number | null;
          age_max_days: number | null;
          tags: string[] | null;
          locale: string;
          last_reviewed_at: string | null;
          reviewer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          body_md: string;
          age_min_days?: number | null;
          age_max_days?: number | null;
          tags?: string[] | null;
          locale?: string;
          last_reviewed_at?: string | null;
          reviewer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          body_md?: string;
          age_min_days?: number | null;
          age_max_days?: number | null;
          tags?: string[] | null;
          locale?: string;
          last_reviewed_at?: string | null;
          reviewer?: string | null;
          updated_at?: string;
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
      parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler' | 'preschool' | 'school';
      feeding_preference: 'breastfeeding' | 'formula' | 'mixed';
      milestone_type: 'physical' | 'cognitive' | 'social' | 'emotional';
      gender: 'male' | 'female' | 'other';
      activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
    };
  };
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type Resource = Database['public']['Tables']['resources']['Row'];
export type UserSavedResource = Database['public']['Tables']['user_saved_resources']['Row'];
export type UserActivityLog = Database['public']['Tables']['user_activity_log']['Row'];
export type UserProgressStats = Database['public']['Tables']['user_progress_stats']['Row'];
export type DailyTip = Database['public']['Tables']['daily_tips']['Row'];
export type MilestoneTemplate = Database['public']['Tables']['milestone_templates']['Row'];
export type UserMilestoneProgress = Database['public']['Tables']['user_milestone_progress']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ChildInsert = Database['public']['Tables']['children']['Insert'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type ResourceInsert = Database['public']['Tables']['resources']['Insert'];
export type UserSavedResourceInsert = Database['public']['Tables']['user_saved_resources']['Insert'];
export type UserActivityLogInsert = Database['public']['Tables']['user_activity_log']['Insert'];
export type UserProgressStatsInsert = Database['public']['Tables']['user_progress_stats']['Insert'];
export type DailyTipInsert = Database['public']['Tables']['daily_tips']['Insert'];
export type MilestoneTemplateInsert = Database['public']['Tables']['milestone_templates']['Insert'];
export type UserMilestoneProgressInsert = Database['public']['Tables']['user_milestone_progress']['Insert'];

// Update types  
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ChildUpdate = Database['public']['Tables']['children']['Update'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];
export type ResourceUpdate = Database['public']['Tables']['resources']['Update'];
export type UserSavedResourceUpdate = Database['public']['Tables']['user_saved_resources']['Update'];
export type UserActivityLogUpdate = Database['public']['Tables']['user_activity_log']['Update'];
export type UserProgressStatsUpdate = Database['public']['Tables']['user_progress_stats']['Update'];
export type DailyTipUpdate = Database['public']['Tables']['daily_tips']['Update'];
export type MilestoneTemplateUpdate = Database['public']['Tables']['milestone_templates']['Update'];
export type UserMilestoneProgressUpdate = Database['public']['Tables']['user_milestone_progress']['Update'];

// Article types
export type Article = Database['public']['Tables']['articles']['Row'];
export type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
export type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

// Enum types
export type ParentingStage = 'expecting' | 'newborn' | 'infant' | 'toddler' | 'preschool' | 'school';
export type FeedingPreference = Database['public']['Enums']['feeding_preference'];
export type MilestoneType = Database['public']['Enums']['milestone_type'];
export type Gender = Database['public']['Enums']['gender'];
export type ActivityType = Database['public']['Enums']['activity_type'];
