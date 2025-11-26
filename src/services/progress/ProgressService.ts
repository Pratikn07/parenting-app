import { supabase } from '../../lib/supabase';
import { Article, ActivityType } from '../../lib/database.types';

// =====================================================
// Types for Progress Service
// =====================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ProgressStats {
  questionsAsked: number;
  articlesRead: number;
  savedArticles: number;
  tipsViewed: number;
  milestonesCompleted: number;
}

export interface SavedArticle {
  id: string;
  article_id: string;
  created_at: string;
  article?: Article | null;
}

export type DatePreset = 'today' | 'week' | 'month' | 'all' | 'custom';

// =====================================================
// Progress Service Class
// =====================================================

class ProgressServiceClass {
  /**
   * Get progress stats for a user within a date range
   */
  async getProgressStats(userId: string, dateRange?: DateRange): Promise<ProgressStats> {
    const stats: ProgressStats = {
      questionsAsked: 0,
      articlesRead: 0,
      savedArticles: 0,
      tipsViewed: 0,
      milestonesCompleted: 0,
    };

    try {
      // Build base query for activity counts
      let query = supabase
        .from('user_activity_log')
        .select('activity_type', { count: 'exact' })
        .eq('user_id', userId);

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate.toISOString())
          .lte('created_at', dateRange.endDate.toISOString());
      }

      // Get all activities and count by type
      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching activity stats:', error);
        return stats;
      }

      // Count by activity type
      if (activities) {
        activities.forEach((activity: { activity_type: string }) => {
          switch (activity.activity_type) {
            case 'question_asked':
              stats.questionsAsked++;
              break;
            case 'resource_viewed':
              stats.articlesRead++;
              break;
            case 'tip_viewed':
              stats.tipsViewed++;
              break;
            case 'milestone_completed':
              stats.milestonesCompleted++;
              break;
          }
        });
      }

      // Get saved articles count (from saved_articles table, not activity log)
      // Saved articles are persistent state, so we count all saved articles
      // but can optionally filter by when they were saved
      let savedQuery = supabase
        .from('saved_articles')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (dateRange) {
        savedQuery = savedQuery
          .gte('created_at', dateRange.startDate.toISOString())
          .lte('created_at', dateRange.endDate.toISOString());
      }

      const { count: savedCount, error: savedError } = await savedQuery;

      if (!savedError && savedCount !== null) {
        stats.savedArticles = savedCount;
      }

      return stats;
    } catch (error) {
      console.error('Error in getProgressStats:', error);
      return stats;
    }
  }

  /**
   * Save an article for a user
   */
  async saveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_articles')
        .insert({
          user_id: userId,
          article_id: articleId,
        });

      if (error) {
        // If it's a unique constraint violation, article is already saved
        if (error.code === '23505') {
          console.log('Article already saved');
          return true;
        }
        console.error('Error saving article:', error);
        return false;
      }

      // Log the save activity
      await this.logActivity(userId, 'resource_saved', articleId);
      return true;
    } catch (error) {
      console.error('Error in saveArticle:', error);
      return false;
    }
  }

  /**
   * Unsave an article for a user
   */
  async unsaveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);

      if (error) {
        console.error('Error unsaving article:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unsaveArticle:', error);
      return false;
    }
  }

  /**
   * Toggle article save state
   */
  async toggleSaveArticle(userId: string, articleId: string): Promise<{ saved: boolean }> {
    const isSaved = await this.isArticleSaved(userId, articleId);
    
    if (isSaved) {
      await this.unsaveArticle(userId, articleId);
      return { saved: false };
    } else {
      await this.saveArticle(userId, articleId);
      return { saved: true };
    }
  }

  /**
   * Get all saved articles for a user
   */
  async getSavedArticles(userId: string): Promise<SavedArticle[]> {
    try {
      const { data, error } = await supabase
        .from('saved_articles')
        .select(`
          id,
          article_id,
          created_at,
          article:articles(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved articles:', error);
        return [];
      }

      return (data || []) as SavedArticle[];
    } catch (error) {
      console.error('Error in getSavedArticles:', error);
      return [];
    }
  }

  /**
   * Check if an article is saved by a user
   */
  async isArticleSaved(userId: string, articleId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .maybeSingle();

      if (error) {
        console.error('Error checking saved status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isArticleSaved:', error);
      return false;
    }
  }

  /**
   * Get multiple articles' saved status
   */
  async getArticlesSavedStatus(userId: string, articleIds: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    
    if (articleIds.length === 0) {
      return result;
    }

    try {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('article_id')
        .eq('user_id', userId)
        .in('article_id', articleIds);

      if (error) {
        console.error('Error fetching saved status:', error);
        return result;
      }

      // Initialize all as false
      articleIds.forEach(id => {
        result[id] = false;
      });

      // Set saved ones to true
      if (data) {
        data.forEach(item => {
          result[item.article_id] = true;
        });
      }

      return result;
    } catch (error) {
      console.error('Error in getArticlesSavedStatus:', error);
      return result;
    }
  }

  /**
   * Log a user activity
   */
  async logActivity(
    userId: string,
    activityType: ActivityType,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_activity_log').insert({
        user_id: userId,
        activity_type: activityType,
        resource_id: resourceId || null,
        metadata: metadata || null,
      });

      if (error) {
        console.error('Error logging activity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in logActivity:', error);
      return false;
    }
  }

  /**
   * Log a question asked in chat
   */
  async logQuestionAsked(userId: string, question: string): Promise<boolean> {
    return this.logActivity(userId, 'question_asked', undefined, {
      question_preview: question.substring(0, 100),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log an article view
   */
  async logArticleViewed(userId: string, articleId: string): Promise<boolean> {
    return this.logActivity(userId, 'resource_viewed', articleId);
  }

  /**
   * Log a tip view
   */
  async logTipViewed(userId: string, tipId: string): Promise<boolean> {
    return this.logActivity(userId, 'tip_viewed', tipId);
  }

  /**
   * Get date range from preset
   */
  getDateRangeFromPreset(preset: DatePreset): DateRange | undefined {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (preset) {
      case 'today': {
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
      case 'week': {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
      case 'month': {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
      case 'all':
        return undefined; // No date filter
      default:
        return undefined;
    }
  }

  /**
   * Format date range for display
   */
  formatDateRange(dateRange?: DateRange): string {
    if (!dateRange) {
      return 'All Time';
    }

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    };

    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  }

  /**
   * Get preset label
   */
  getPresetLabel(preset: DatePreset): string {
    const labels: Record<DatePreset, string> = {
      today: 'Today',
      week: 'Last 7 Days',
      month: 'Last 30 Days',
      all: 'All Time',
      custom: 'Custom',
    };
    return labels[preset];
  }
}

// Export singleton instance
export const ProgressService = new ProgressServiceClass();

