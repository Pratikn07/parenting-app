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
          ai_generated: boolean | null;
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
          ai_generated?: boolean | null;
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
          ai_generated?: boolean | null;
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
          milestone_type: MilestoneType;
          created_at: string | null;
          updated_at: string | null;
          template_id: string | null;
          is_custom: boolean;
          notes: string | null;
        };
        Insert: {
          id?: string;
          child_id?: string | null;
          title: string;
          description?: string | null;
          achieved_at?: string | null;
          milestone_type: MilestoneType;
          created_at?: string | null;
          updated_at?: string | null;
          template_id?: string | null;
          is_custom?: boolean;
          notes?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          achieved_at?: string | null;
          milestone_type?: MilestoneType;
          updated_at?: string | null;
          template_id?: string | null;
          is_custom?: boolean;
          notes?: string | null;
        };
      };
      milestone_templates: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          milestone_type: string;
          min_age_months: number;
          max_age_months: number;
          parenting_stage: string;
          is_active: boolean;
          sort_order: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          milestone_type: string;
          min_age_months: number;
          max_age_months: number;
          parenting_stage: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          milestone_type?: string;
          min_age_months?: number;
          max_age_months?: number;
          parenting_stage?: string;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      saved_articles: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id: string;
          created_at?: string;
        };
        Update: {
          // saved_articles are immutable - no update fields
        };
      };
      tip_categories: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          icon: string;
          color: string;
          parenting_stages: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          icon?: string;
          color?: string;
          parenting_stages?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          display_name?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          parenting_stages?: string[];
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          response: string | null;
          is_from_user: boolean;
          created_at: string;
          session_id: string | null;
          child_id: string | null;
          topic: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          response?: string | null;
          is_from_user?: boolean;
          created_at?: string;
          session_id?: string | null;
          child_id?: string | null;
          topic?: string | null;
          image_url?: string | null;
        };
        Update: {
          message?: string;
          response?: string | null;
          is_from_user?: boolean;
          session_id?: string | null;
          child_id?: string | null;
          topic?: string | null;
          image_url?: string | null;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          child_id: string | null;
          title: string | null;
          topic: string | null;
          started_at: string;
          last_message_at: string | null;
          message_count: number;
          is_archived: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          child_id?: string | null;
          title?: string | null;
          topic?: string | null;
          started_at?: string;
          last_message_at?: string | null;
          message_count?: number;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          child_id?: string | null;
          title?: string | null;
          topic?: string | null;
          last_message_at?: string | null;
          message_count?: number;
          is_archived?: boolean;
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
      parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler' | 'preschool';
      feeding_preference: 'breastfeeding' | 'formula' | 'mixed';
      milestone_type: 'physical' | 'cognitive' | 'social' | 'emotional';
      gender: 'male' | 'female' | 'other';
      activity_type: 'resource_viewed' | 'resource_saved' | 'resource_shared' | 'milestone_completed' | 'milestone_uncompleted' | 'question_asked' | 'tip_viewed' | 'search_performed' | 'category_filtered';
      tip_category: 'sleep' | 'feeding' | 'development' | 'health' | 'behavior' | 'activities' | 'safety' | 'bonding';
    };
  };
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type MilestoneTemplate = Database['public']['Tables']['milestone_templates']['Row'];
export type Article = Database['public']['Tables']['articles']['Row'];
export type DailyTip = Database['public']['Tables']['daily_tips']['Row'];
export type UserActivityLog = Database['public']['Tables']['user_activity_log']['Row'];
export type SavedArticle = Database['public']['Tables']['saved_articles']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ChildInsert = Database['public']['Tables']['children']['Insert'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type MilestoneTemplateInsert = Database['public']['Tables']['milestone_templates']['Insert'];
export type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
export type DailyTipInsert = Database['public']['Tables']['daily_tips']['Insert'];
export type UserActivityLogInsert = Database['public']['Tables']['user_activity_log']['Insert'];
export type SavedArticleInsert = Database['public']['Tables']['saved_articles']['Insert'];

// Update types  
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ChildUpdate = Database['public']['Tables']['children']['Update'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];
export type MilestoneTemplateUpdate = Database['public']['Tables']['milestone_templates']['Update'];
export type ArticleUpdate = Database['public']['Tables']['articles']['Update'];
export type DailyTipUpdate = Database['public']['Tables']['daily_tips']['Update'];
export type UserActivityLogUpdate = Database['public']['Tables']['user_activity_log']['Update'];
export type SavedArticleUpdate = Database['public']['Tables']['saved_articles']['Update'];

// Enum types
export type ParentingStage = Database['public']['Enums']['parenting_stage'];
export type FeedingPreference = Database['public']['Enums']['feeding_preference'];
export type MilestoneType = Database['public']['Enums']['milestone_type'];
export type Gender = Database['public']['Enums']['gender'];
export type ActivityType = Database['public']['Enums']['activity_type'];
export type TipCategoryType = Database['public']['Enums']['tip_category'];

// Table row types for new tables
export type TipCategory = Database['public']['Tables']['tip_categories']['Row'];
export type TipCategoryInsert = Database['public']['Tables']['tip_categories']['Insert'];
export type TipCategoryUpdate = Database['public']['Tables']['tip_categories']['Update'];

// Chat message types
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update'];

// Chat session types
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert'];
export type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update'];
