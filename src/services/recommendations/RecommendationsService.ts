import { supabase } from '../../lib/supabase';
import {
  DailyTip,
  Child,
  ParentingStage,
  UserActivityLog
} from '../../lib/database.types';
import { resourcesService } from '../resources/ResourcesService';
import { dailyTipsService } from '../tips/DailyTipsService';

export interface RecommendedArticle {
  id: string;
  title: string;
  body_md: string;
  tags: string[] | null;
  age_min_days: number | null;
  age_max_days: number | null;
  locale: string;
  last_reviewed_at: string | null;
  reviewer: string | null;
  slug: string | null;
  category: string;
  readTime: number;
  relevanceScore: number;
  recommendationReason: string;
}

export interface ActionItem {
  id: string;
  type: 'milestone' | 'appointment' | 'reminder' | 'tip_followup';
  title: string;
  subtitle: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  actionText: string;
  metadata?: any;
}

export interface PersonalizedContent {
  dailyTip: DailyTip | null;
  recommendedArticles: RecommendedArticle[];
  actionItems: ActionItem[];
  progressStats: {
    tipsCompleted: number;
    articlesRead: number;
    milestonesAchieved: number;
  };
}

export class RecommendationsService {

  /**
   * Get personalized content for a user's Next Steps tab
   */
  async getPersonalizedContent(userId: string): Promise<PersonalizedContent> {
    // Get user's daily tip
    const dailyTip = await dailyTipsService.getTodaysTip(userId);

    // Get recommended articles based on daily tip and user profile
    const recommendedArticles = await this.getRecommendedArticles(userId, dailyTip);

    // Generate personalized action items
    const actionItems = await this.generateActionItems(userId);

    // Get user progress stats
    const progressStats = await this.getUserProgressStats(userId);

    return {
      dailyTip,
      recommendedArticles,
      actionItems,
      progressStats
    };
  }

  /**
   * Get smart article recommendations based on user context
   */
  async getRecommendedArticles(userId: string, dailyTip: DailyTip | null): Promise<RecommendedArticle[]> {
    // Get user profile and children for context
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('birth_date', { ascending: false });

    if (!user) return [];

    const youngestChild = children?.[0];
    const childAgeInDays = youngestChild?.birth_date
      ? this.calculateAgeInDays(youngestChild.birth_date)
      : null;

    // Build recommendation query
    let query = supabase
      .from('articles')
      .select('*')
      .eq('locale', user.locale || 'en-US')
      .limit(10);

    // Filter by child age if available
    if (childAgeInDays !== null) {
      query = query.or(`age_min_days.is.null,age_min_days.lte.${childAgeInDays}`)
        .or(`age_max_days.is.null,age_max_days.gte.${childAgeInDays}`);
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error('Error fetching articles for recommendations:', error);
      return [];
    }

    if (!articles) return [];

    // Score and rank articles
    const scoredArticles = articles.map(article => {
      let score = 0;
      let reason = '';

      // High priority: Match daily tip category
      if (dailyTip && article.tags?.includes(dailyTip.category)) {
        score += 100;
        reason = `Related to today's ${dailyTip.category} tip`;
      }

      // Medium priority: Match parenting stage
      if (article.tags?.includes(user.parenting_stage)) {
        score += 50;
        if (!reason) reason = `Perfect for ${user.parenting_stage} stage`;
      }

      // Medium priority: Match feeding preference
      if (user.feeding_preference && article.tags?.includes(user.feeding_preference)) {
        score += 40;
        if (!reason) reason = `Matches your ${user.feeding_preference} preference`;
      }

      // Age appropriateness bonus
      if (childAgeInDays !== null) {
        const isAgeAppropriate =
          (article.age_min_days === null || childAgeInDays >= article.age_min_days) &&
          (article.age_max_days === null || childAgeInDays <= article.age_max_days);

        if (isAgeAppropriate) {
          score += 30;
          if (!reason) reason = `Age-appropriate for your child`;
        }
      }

      // Default reason
      if (!reason) reason = 'Recommended for you';

      return {
        ...article,
        category: this.extractCategoryFromTags(article.tags),
        readTime: this.estimateReadTime(article.body_md),
        relevanceScore: score,
        recommendationReason: reason
      };
    });

    // Sort by relevance score and return top 5
    return scoredArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  /**
   * Generate personalized action items for a user
   */
  async generateActionItems(userId: string): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];

    // Get user's children for milestone-based actions
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId);

    if (children && children.length > 0) {
      for (const child of children) {
        if (child.birth_date) {
          const ageInMonths = this.calculateAgeInMonths(child.birth_date);

          // Get upcoming milestones for this child
          const upcomingMilestones = await this.getUpcomingMilestones(userId, child.id, ageInMonths);

          upcomingMilestones.forEach(milestone => {
            actionItems.push({
              id: `milestone-${milestone.id}`,
              type: 'milestone',
              title: `Check milestone: ${milestone.title}`,
              subtitle: `Due this week • ${milestone.milestone_type} development`,
              priority: 'medium',
              icon: 'TrendingUp',
              color: '#8BA888',
              actionText: 'Track',
              metadata: { milestoneId: milestone.id, childId: child.id }
            });
          });

          // Add appointment reminders based on child age
          if (ageInMonths === 2 || ageInMonths === 4 || ageInMonths === 6) {
            actionItems.push({
              id: `checkup-${child.id}-${ageInMonths}`,
              type: 'appointment',
              title: 'Schedule pediatrician visit',
              subtitle: `${ageInMonths}-month checkup • Health`,
              priority: 'high',
              icon: 'Calendar',
              color: '#D4635A',
              actionText: 'Schedule',
              metadata: { childId: child.id, checkupType: `${ageInMonths}-month` }
            });
          }
        }
      }
    }

    // Get incomplete daily tips as action items
    const incompleteTips = await this.getIncompleteTips(userId);
    incompleteTips.forEach(tip => {
      actionItems.push({
        id: `tip-${tip.id}`,
        type: 'tip_followup',
        title: `Complete tip: ${tip.title}`,
        subtitle: `From ${tip.tip_date} • ${tip.category}`,
        priority: 'low',
        icon: 'CheckCircle',
        color: '#6B7280',
        actionText: 'Complete',
        metadata: { tipId: tip.id }
      });
    });

    // Sort by priority and return top 5
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return actionItems
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 5);
  }

  /**
   * Get upcoming milestones for a child
   */
  private async getUpcomingMilestones(userId: string, childId: string, ageInMonths: number) {
    const { data: milestoneTemplates } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', true)
      .lte('min_age_months', ageInMonths + 1) // Due within next month
      .gte('max_age_months', ageInMonths - 1) // Not too old
      .limit(3);

    // Check which ones user hasn't completed yet
    if (!milestoneTemplates) return [];

    const { data: completedMilestones } = await supabase
      .from('user_milestone_progress')
      .select('milestone_template_id')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .eq('is_completed', true);

    const completedIds = completedMilestones?.map(m => m.milestone_template_id) || [];

    return milestoneTemplates.filter(template => !completedIds.includes(template.id));
  }

  /**
   * Get incomplete daily tips for action items
   */
  private async getIncompleteTips(userId: string): Promise<DailyTip[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: tips } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('user_id', userId)
      .eq('is_viewed', false)
      .gte('tip_date', oneWeekAgo.toISOString().split('T')[0])
      .order('tip_date', { ascending: false })
      .limit(3);

    return tips || [];
  }

  /**
   * Get user progress stats for the current week
   */
  private async getUserProgressStats(userId: string) {
    const weekStart = this.getWeekStartDate();

    const { data: stats } = await supabase
      .from('user_progress_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
      .single();

    return {
      tipsCompleted: stats?.tips_received || 0,
      articlesRead: stats?.resources_viewed || 0,
      milestonesAchieved: stats?.milestones_completed || 0
    };
  }

  /**
   * Mark a daily tip as completed
   */
  async completeTip(userId: string, tipId: string): Promise<void> {
    // Mark tip as viewed and completed
    await dailyTipsService.markTipAsViewed(userId, tipId);

    // Log completion activity
    await resourcesService.logActivity({
      user_id: userId,
      activity_type: 'tip_viewed',
      metadata: { completed: true }
    });

    // Update progress stats
    await this.incrementProgressStat(userId, 'tips_received');
  }

  /**
   * Skip a daily tip
   */
  async skipTip(userId: string, tipId: string): Promise<void> {
    // Log skip activity
    await resourcesService.logActivity({
      user_id: userId,
      activity_type: 'tip_viewed',
      metadata: { skipped: true }
    });
  }

  /**
   * Increment a progress stat for the user
   */
  private async incrementProgressStat(userId: string, statType: string): Promise<void> {
    const weekStart = this.getWeekStartDate();

    // Upsert progress stats
    const { error } = await supabase
      .from('user_progress_stats')
      .upsert({
        user_id: userId,
        week_start_date: weekStart,
        [statType]: 1
      }, {
        onConflict: 'user_id,week_start_date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error updating progress stats:', error);
    }
  }

  /**
   * Calculate child age in days
   */
  private calculateAgeInDays(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate child age in months
   */
  private calculateAgeInMonths(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();

    const yearsDiff = now.getFullYear() - birth.getFullYear();
    const monthsDiff = now.getMonth() - birth.getMonth();

    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Extract primary category from article tags
   */
  private extractCategoryFromTags(tags: string[] | null): string {
    if (!tags || tags.length === 0) return 'general';

    const categoryTags = ['sleep', 'feeding', 'health', 'development', 'behavior', 'activities'];
    const foundCategory = tags.find(tag => categoryTags.includes(tag.toLowerCase()));

    return foundCategory || tags[0] || 'general';
  }

  /**
   * Estimate reading time based on content length
   */
  private estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Get the start date of the current week (Monday)
   */
  private getWeekStartDate(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }
}

// Export singleton instance
export const recommendationsService = new RecommendationsService();
