import { supabase } from '../../lib/supabase';
import { 
  MilestoneTemplate,
  MilestoneTemplateInsert,
  UserMilestoneProgress,
  UserMilestoneProgressInsert,
  UserMilestoneProgressUpdate,
  Child,
  MilestoneType,
  ParentingStage,
  UserActivityLogInsert
} from '../../lib/database.types';

export interface MilestonesServiceInterface {
  // Milestone templates
  getMilestoneTemplates(filters?: MilestoneTemplateFilters): Promise<MilestoneTemplate[]>;
  getMilestoneTemplatesByAge(ageInMonths: number, parentingStage: ParentingStage): Promise<MilestoneTemplate[]>;
  getMilestoneTemplateById(id: string): Promise<MilestoneTemplate | null>;
  
  // User milestone progress
  getUserMilestoneProgress(userId: string, childId?: string): Promise<UserMilestoneProgressWithTemplate[]>;
  getChildMilestoneProgress(childId: string): Promise<UserMilestoneProgressWithTemplate[]>;
  updateMilestoneProgress(userId: string, childId: string, milestoneTemplateId: string, updates: UserMilestoneProgressUpdate): Promise<UserMilestoneProgress>;
  completeMilestone(userId: string, childId: string, milestoneTemplateId: string, notes?: string): Promise<UserMilestoneProgress>;
  uncompleteMilestone(userId: string, childId: string, milestoneTemplateId: string): Promise<UserMilestoneProgress>;
  
  // Progress tracking
  getMilestoneStats(userId: string, childId?: string): Promise<MilestoneStats>;
  getCompletionRate(userId: string, childId: string, milestoneType?: MilestoneType): Promise<number>;
  
  // Utility functions
  calculateChildAgeInMonths(birthDate: string): number;
  getRelevantMilestones(child: Child): Promise<MilestoneTemplate[]>;
  initializeMilestonesForChild(userId: string, childId: string): Promise<void>;
}

export interface MilestoneTemplateFilters {
  milestoneType?: MilestoneType;
  parentingStage?: ParentingStage;
  minAge?: number;
  maxAge?: number;
  isActive?: boolean;
}

export interface UserMilestoneProgressWithTemplate extends UserMilestoneProgress {
  milestone_template: MilestoneTemplate;
}

export interface MilestoneStats {
  totalMilestones: number;
  completedMilestones: number;
  completionRate: number;
  byType: {
    physical: { total: number; completed: number; rate: number };
    cognitive: { total: number; completed: number; rate: number };
    social: { total: number; completed: number; rate: number };
    emotional: { total: number; completed: number; rate: number };
  };
  recentCompletions: UserMilestoneProgressWithTemplate[];
}

export class MilestonesService implements MilestonesServiceInterface {
  
  /**
   * Get milestone templates with optional filters
   */
  async getMilestoneTemplates(filters?: MilestoneTemplateFilters): Promise<MilestoneTemplate[]> {
    let query = supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', filters?.isActive ?? true)
      .order('min_age_months', { ascending: true });

    if (filters?.milestoneType) {
      query = query.eq('milestone_type', filters.milestoneType);
    }

    if (filters?.parentingStage) {
      query = query.eq('parenting_stage', filters.parentingStage);
    }

    if (filters?.minAge !== undefined) {
      query = query.gte('min_age_months', filters.minAge);
    }

    if (filters?.maxAge !== undefined) {
      query = query.lte('max_age_months', filters.maxAge);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching milestone templates:', error);
      throw new Error(`Failed to fetch milestone templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get milestone templates appropriate for a child's age
   */
  async getMilestoneTemplatesByAge(ageInMonths: number, parentingStage: ParentingStage): Promise<MilestoneTemplate[]> {
    const { data, error } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', true)
      .eq('parenting_stage', parentingStage)
      .lte('min_age_months', ageInMonths)
      .gte('max_age_months', ageInMonths)
      .order('milestone_type', { ascending: true });

    if (error) {
      console.error('Error fetching milestone templates by age:', error);
      throw new Error(`Failed to fetch milestone templates by age: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific milestone template by ID
   */
  async getMilestoneTemplateById(id: string): Promise<MilestoneTemplate | null> {
    const { data, error } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Template not found
      }
      console.error('Error fetching milestone template:', error);
      throw new Error(`Failed to fetch milestone template: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's milestone progress with template details
   */
  async getUserMilestoneProgress(userId: string, childId?: string): Promise<UserMilestoneProgressWithTemplate[]> {
    let query = supabase
      .from('user_milestone_progress')
      .select(`
        *,
        milestone_template:milestone_templates(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user milestone progress:', error);
      throw new Error(`Failed to fetch user milestone progress: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get milestone progress for a specific child
   */
  async getChildMilestoneProgress(childId: string): Promise<UserMilestoneProgressWithTemplate[]> {
    const { data, error } = await supabase
      .from('user_milestone_progress')
      .select(`
        *,
        milestone_template:milestone_templates(*)
      `)
      .eq('child_id', childId)
      .order('milestone_template.min_age_months', { ascending: true });

    if (error) {
      console.error('Error fetching child milestone progress:', error);
      throw new Error(`Failed to fetch child milestone progress: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update milestone progress
   */
  async updateMilestoneProgress(
    userId: string, 
    childId: string, 
    milestoneTemplateId: string, 
    updates: UserMilestoneProgressUpdate
  ): Promise<UserMilestoneProgress> {
    const { data, error } = await supabase
      .from('user_milestone_progress')
      .update(updates)
      .eq('user_id', userId)
      .eq('child_id', childId)
      .eq('milestone_template_id', milestoneTemplateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone progress:', error);
      throw new Error(`Failed to update milestone progress: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark a milestone as completed
   */
  async completeMilestone(
    userId: string, 
    childId: string, 
    milestoneTemplateId: string, 
    notes?: string
  ): Promise<UserMilestoneProgress> {
    const updates: UserMilestoneProgressUpdate = {
      is_completed: true,
      completed_at: new Date().toISOString(),
      notes
    };

    // Check if progress record exists
    const { data: existing } = await supabase
      .from('user_milestone_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .eq('milestone_template_id', milestoneTemplateId)
      .single();

    if (existing) {
      // Update existing record
      const result = await this.updateMilestoneProgress(userId, childId, milestoneTemplateId, updates);
      
      // Log the activity
      await this.logMilestoneActivity(userId, milestoneTemplateId, 'milestone_completed');
      
      return result;
    } else {
      // Create new record
      const insertData: UserMilestoneProgressInsert = {
        user_id: userId,
        child_id: childId,
        milestone_template_id: milestoneTemplateId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        notes
      };

      const { data, error } = await supabase
        .from('user_milestone_progress')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating milestone progress:', error);
        throw new Error(`Failed to create milestone progress: ${error.message}`);
      }

      // Log the activity
      await this.logMilestoneActivity(userId, milestoneTemplateId, 'milestone_completed');

      return data;
    }
  }

  /**
   * Mark a milestone as not completed
   */
  async uncompleteMilestone(
    userId: string, 
    childId: string, 
    milestoneTemplateId: string
  ): Promise<UserMilestoneProgress> {
    const updates: UserMilestoneProgressUpdate = {
      is_completed: false,
      completed_at: undefined
    };

    const result = await this.updateMilestoneProgress(userId, childId, milestoneTemplateId, updates);
    
    // Log the activity
    await this.logMilestoneActivity(userId, milestoneTemplateId, 'milestone_uncompleted');
    
    return result;
  }

  /**
   * Get milestone statistics for a user or specific child
   */
  async getMilestoneStats(userId: string, childId?: string): Promise<MilestoneStats> {
    // Get all milestone progress for the user/child
    const progress = await this.getUserMilestoneProgress(userId, childId);
    
    // Calculate overall stats
    const totalMilestones = progress.length;
    const completedMilestones = progress.filter(p => p.is_completed).length;
    const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Calculate stats by type
    const byType = {
      physical: this.calculateTypeStats(progress, 'physical'),
      cognitive: this.calculateTypeStats(progress, 'cognitive'),
      social: this.calculateTypeStats(progress, 'social'),
      emotional: this.calculateTypeStats(progress, 'emotional'),
    };

    // Get recent completions (last 10)
    const recentCompletions = progress
      .filter(p => p.is_completed && p.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 10);

    return {
      totalMilestones,
      completedMilestones,
      completionRate,
      byType,
      recentCompletions
    };
  }

  /**
   * Get completion rate for a specific child and milestone type
   */
  async getCompletionRate(userId: string, childId: string, milestoneType?: MilestoneType): Promise<number> {
    let query = supabase
      .from('user_milestone_progress')
      .select(`
        *,
        milestone_template:milestone_templates(*)
      `)
      .eq('user_id', userId)
      .eq('child_id', childId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching completion rate:', error);
      throw new Error(`Failed to fetch completion rate: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Filter by milestone type if specified
    const filteredData = milestoneType 
      ? data.filter(p => p.milestone_template.milestone_type === milestoneType)
      : data;

    const total = filteredData.length;
    const completed = filteredData.filter(p => p.is_completed).length;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  /**
   * Calculate child's age in months from birth date
   */
  calculateChildAgeInMonths(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    
    const yearsDiff = now.getFullYear() - birth.getFullYear();
    const monthsDiff = now.getMonth() - birth.getMonth();
    
    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Get relevant milestones for a child based on their age and stage
   */
  async getRelevantMilestones(child: Child): Promise<MilestoneTemplate[]> {
    if (!child.birth_date) {
      // If no birth date, return milestones for newborn stage
      return this.getMilestoneTemplates({ parentingStage: 'newborn' });
    }

    const ageInMonths = this.calculateChildAgeInMonths(child.birth_date);
    
    // Determine parenting stage based on age
    let parentingStage: ParentingStage;
    if (ageInMonths <= 3) {
      parentingStage = 'newborn';
    } else if (ageInMonths <= 12) {
      parentingStage = 'infant';
    } else {
      parentingStage = 'toddler';
    }

    return this.getMilestoneTemplatesByAge(ageInMonths, parentingStage);
  }

  /**
   * Initialize milestone progress records for a new child
   */
  async initializeMilestonesForChild(userId: string, childId: string): Promise<void> {
    // Get child details
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      console.error('Error fetching child for milestone initialization:', childError);
      throw new Error('Failed to fetch child details');
    }

    // Get relevant milestones for this child
    const relevantMilestones = await this.getRelevantMilestones(child);

    // Create progress records for each relevant milestone
    const progressRecords: UserMilestoneProgressInsert[] = relevantMilestones.map(milestone => ({
      user_id: userId,
      child_id: childId,
      milestone_template_id: milestone.id,
      is_completed: false
    }));

    if (progressRecords.length > 0) {
      const { error } = await supabase
        .from('user_milestone_progress')
        .insert(progressRecords);

      if (error) {
        console.error('Error initializing milestones for child:', error);
        throw new Error(`Failed to initialize milestones: ${error.message}`);
      }
    }
  }

  /**
   * Calculate statistics for a specific milestone type
   */
  private calculateTypeStats(progress: UserMilestoneProgressWithTemplate[], type: MilestoneType) {
    const typeProgress = progress.filter(p => p.milestone_template.milestone_type === type);
    const total = typeProgress.length;
    const completed = typeProgress.filter(p => p.is_completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, rate };
  }

  /**
   * Log milestone activity
   */
  private async logMilestoneActivity(userId: string, milestoneId: string, activityType: 'milestone_completed' | 'milestone_uncompleted'): Promise<void> {
    const activity: UserActivityLogInsert = {
      user_id: userId,
      activity_type: activityType,
      milestone_id: milestoneId
    };

    const { error } = await supabase
      .from('user_activity_log')
      .insert(activity);

    if (error) {
      console.error('Error logging milestone activity:', error);
      // Don't throw error here as it's not critical to the main operation
    }
  }
}

// Export singleton instance
export const milestonesService = new MilestonesService();
