import { supabase } from '../../lib/supabase';
import { 
  UserProgressStats,
  UserProgressStatsInsert,
  UserProgressStatsUpdate,
  UserActivityLog,
  ActivityType
} from '../../lib/database.types';

export interface ProgressServiceInterface {
  // Progress stats operations
  getCurrentWeekStats(userId: string): Promise<UserProgressStats | null>;
  getWeekStats(userId: string, weekStartDate: string): Promise<UserProgressStats | null>;
  updateProgressStats(userId: string, updates: Partial<UserProgressStatsUpdate>): Promise<UserProgressStats>;
  incrementStat(userId: string, statType: keyof UserProgressStatsUpdate, amount?: number): Promise<UserProgressStats>;
  
  // Activity aggregation
  calculateWeeklyStats(userId: string, weekStartDate: string): Promise<UserProgressStats>;
  getRecentActivity(userId: string, limit?: number): Promise<UserActivityLog[]>;
  getActivityByType(userId: string, activityType: ActivityType, limit?: number): Promise<UserActivityLog[]>;
  
  // Utility functions
  getWeekStartDate(date?: Date): string;
  ensureWeekStatsExist(userId: string, weekStartDate?: string): Promise<UserProgressStats>;
}

export interface WeeklyProgressSummary {
  currentWeek: UserProgressStats;
  previousWeek: UserProgressStats | null;
  percentageChanges: {
    questions_asked: number;
    tips_received: number;
    content_saved: number;
    milestones_completed: number;
    resources_viewed: number;
    search_queries: number;
  };
  totalEngagement: number;
}

export class ProgressService implements ProgressServiceInterface {
  
  /**
   * Get current week's progress stats for a user
   */
  async getCurrentWeekStats(userId: string): Promise<UserProgressStats | null> {
    const weekStartDate = this.getWeekStartDate();
    return this.getWeekStats(userId, weekStartDate);
  }

  /**
   * Get progress stats for a specific week
   */
  async getWeekStats(userId: string, weekStartDate: string): Promise<UserProgressStats | null> {
    const { data, error } = await supabase
      .from('user_progress_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Stats not found
      }
      console.error('Error fetching week stats:', error);
      throw new Error(`Failed to fetch week stats: ${error.message}`);
    }

    return data;
  }

  /**
   * Update progress stats for a user
   */
  async updateProgressStats(userId: string, updates: Partial<UserProgressStatsUpdate>): Promise<UserProgressStats> {
    const weekStartDate = this.getWeekStartDate();
    
    // Ensure stats record exists
    await this.ensureWeekStatsExist(userId, weekStartDate);

    const { data, error } = await supabase
      .from('user_progress_stats')
      .update(updates)
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .select()
      .single();

    if (error) {
      console.error('Error updating progress stats:', error);
      throw new Error(`Failed to update progress stats: ${error.message}`);
    }

    return data;
  }

  /**
   * Increment a specific stat by a given amount
   */
  async incrementStat(userId: string, statType: keyof UserProgressStatsUpdate, amount: number = 1): Promise<UserProgressStats> {
    const weekStartDate = this.getWeekStartDate();
    
    // Get current stats or create if doesn't exist
    let currentStats = await this.getWeekStats(userId, weekStartDate);
    if (!currentStats) {
      currentStats = await this.ensureWeekStatsExist(userId, weekStartDate);
    }

    // Calculate new value
    const currentValue = currentStats[statType as keyof UserProgressStats] as number || 0;
    const newValue = currentValue + amount;

    // Update the specific stat
    const updates = { [statType]: newValue } as Partial<UserProgressStatsUpdate>;
    return this.updateProgressStats(userId, updates);
  }

  /**
   * Calculate weekly stats from activity log
   */
  async calculateWeeklyStats(userId: string, weekStartDate: string): Promise<UserProgressStats> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    // Get all activities for the week
    const { data: activities, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStartDate)
      .lt('created_at', weekEndDate.toISOString());

    if (error) {
      console.error('Error fetching activities for stats calculation:', error);
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }

    // Calculate stats from activities
    const stats = {
      questions_asked: activities?.filter(a => a.activity_type === 'question_asked').length || 0,
      tips_received: activities?.filter(a => a.activity_type === 'tip_viewed').length || 0,
      content_saved: activities?.filter(a => a.activity_type === 'resource_saved').length || 0,
      milestones_completed: activities?.filter(a => a.activity_type === 'milestone_completed').length || 0,
      resources_viewed: activities?.filter(a => a.activity_type === 'resource_viewed').length || 0,
      search_queries: activities?.filter(a => a.activity_type === 'search_performed').length || 0,
    };

    // Update or create the stats record
    const { data: existingStats } = await supabase
      .from('user_progress_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .single();

    if (existingStats) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('user_progress_stats')
        .update(stats)
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating calculated stats:', updateError);
        throw new Error(`Failed to update calculated stats: ${updateError.message}`);
      }

      return data;
    } else {
      // Create new record
      const insertData: UserProgressStatsInsert = {
        user_id: userId,
        week_start_date: weekStartDate,
        ...stats
      };

      const { data, error: insertError } = await supabase
        .from('user_progress_stats')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting calculated stats:', insertError);
        throw new Error(`Failed to insert calculated stats: ${insertError.message}`);
      }

      return data;
    }
  }

  /**
   * Get recent activity for a user
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<UserActivityLog[]> {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      throw new Error(`Failed to fetch recent activity: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get activity by specific type
   */
  async getActivityByType(userId: string, activityType: ActivityType, limit: number = 10): Promise<UserActivityLog[]> {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity by type:', error);
      throw new Error(`Failed to fetch activity by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get the start date of the week (Monday) for a given date
   */
  getWeekStartDate(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  /**
   * Ensure a week stats record exists for the user
   */
  async ensureWeekStatsExist(userId: string, weekStartDate?: string): Promise<UserProgressStats> {
    const weekStart = weekStartDate || this.getWeekStartDate();
    
    // Check if record exists
    const existing = await this.getWeekStats(userId, weekStart);
    if (existing) {
      return existing;
    }

    // Create new record with default values
    const insertData: UserProgressStatsInsert = {
      user_id: userId,
      week_start_date: weekStart,
      questions_asked: 0,
      tips_received: 0,
      content_saved: 0,
      milestones_completed: 0,
      resources_viewed: 0,
      search_queries: 0
    };

    const { data, error } = await supabase
      .from('user_progress_stats')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating week stats:', error);
      throw new Error(`Failed to create week stats: ${error.message}`);
    }

    return data;
  }

  /**
   * Get weekly progress summary with comparisons
   */
  async getWeeklyProgressSummary(userId: string): Promise<WeeklyProgressSummary> {
    const currentWeekStart = this.getWeekStartDate();
    const previousWeekStart = this.getWeekStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    // Ensure current week stats exist, get previous week stats if available
    const currentWeek = await this.getWeekStats(userId, currentWeekStart) || await this.ensureWeekStatsExist(userId, currentWeekStart);
    const previousWeek = await this.getWeekStats(userId, previousWeekStart);

    // Calculate percentage changes
    const percentageChanges = {
      questions_asked: this.calculatePercentageChange(previousWeek?.questions_asked || 0, currentWeek.questions_asked),
      tips_received: this.calculatePercentageChange(previousWeek?.tips_received || 0, currentWeek.tips_received),
      content_saved: this.calculatePercentageChange(previousWeek?.content_saved || 0, currentWeek.content_saved),
      milestones_completed: this.calculatePercentageChange(previousWeek?.milestones_completed || 0, currentWeek.milestones_completed),
      resources_viewed: this.calculatePercentageChange(previousWeek?.resources_viewed || 0, currentWeek.resources_viewed),
      search_queries: this.calculatePercentageChange(previousWeek?.search_queries || 0, currentWeek.search_queries),
    };

    // Calculate total engagement score
    const totalEngagement = currentWeek.questions_asked + 
                           currentWeek.tips_received + 
                           currentWeek.content_saved + 
                           currentWeek.milestones_completed + 
                           currentWeek.resources_viewed + 
                           currentWeek.search_queries;

    return {
      currentWeek,
      previousWeek,
      percentageChanges,
      totalEngagement
    };
  }

  /**
   * Calculate percentage change between two values
   */
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }
}

// Export singleton instance
export const progressService = new ProgressService();
