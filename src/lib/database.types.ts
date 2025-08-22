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
    };
  };
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ChildInsert = Database['public']['Tables']['children']['Insert'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];

// Update types  
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ChildUpdate = Database['public']['Tables']['children']['Update'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];