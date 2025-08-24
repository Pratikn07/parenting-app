import { supabase } from '../../lib/supabase';
import { 
  DailyTip,
  Child,
  ParentingStage,
  UserActivityLog
} from '../../lib/database.types';

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
    try {
      // Get user's daily tip
      const dailyTip = await this.getTodaysTip(userId);
      
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
    } catch (error) {
      console.error('Error getting personalized content:', error);
      throw error;
    }
  }

  /**
   * Get today's tip for a user
   */
  async getTodaysTip(userId: string): Promise<DailyTip | null> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if tip already exists for today
    const { data: existingTip } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('user_id', userId)
      .eq('tip_date', today)
      .single();

    if (existingTip) {
      return existingTip;
    }

    // Generate new tip if none exists
    return this.generateDailyTip(userId, today);
  }

  /**
   * Generate a daily tip for a user
   */
  async generateDailyTip(userId: string, date: string): Promise<DailyTip> {
    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('date_of_birth', { ascending: false });

    // Select appropriate tip template
    const template = this.selectTipTemplate(user, children || []);

    // Create the tip
    const tipData = {
      user_id: userId,
      tip_date: date,
      title: template.title,
      description: template.description,
      category: template.category,
      parenting_stage: template.parentingStage,
      child_age_months: this.getYoungestChildAge(children || []),
      quick_tips: template.quickTips,
      is_viewed: false
    };

    const { data, error } = await supabase
      .from('daily_tips')
      .insert(tipData)
      .select()
      .single();

    if (error) {
      console.error('Error generating daily tip:', error);
      throw new Error(`Failed to generate daily tip: ${error.message}`);
    }

    return data;
  }

  /**
   * Get smart article recommendations based on user context
   */
  async getRecommendedArticles(userId: string, dailyTip: DailyTip | null): Promise<RecommendedArticle[]> {
    // Get user profile and children for context
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('date_of_birth', { ascending: false });

    if (!user) return [];

    // Get articles
    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .eq('locale', user.locale || 'en-US')
      .limit(10);

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

    // Sort by relevance score and return top 3
    return scoredArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
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
        if (child.date_of_birth) {
          const ageInMonths = this.calculateAgeInMonths(child.date_of_birth);
          
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

          // Add milestone reminders
          actionItems.push({
            id: `milestone-${child.id}`,
            type: 'milestone',
            title: 'Check milestone: Rolling over',
            subtitle: 'Due this week • Physical development',
            priority: 'medium',
            icon: 'TrendingUp',
            color: '#8BA888',
            actionText: 'Track',
            metadata: { childId: child.id }
          });
        }
      }
    }

    return actionItems.slice(0, 2); // Return top 2 action items
  }

  /**
   * Mark a daily tip as completed
   */
  async completeTip(userId: string, tipId: string): Promise<void> {
    const { error } = await supabase
      .from('daily_tips')
      .update({ 
        is_viewed: true, 
        viewed_at: new Date().toISOString() 
      })
      .eq('id', tipId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to complete tip: ${error.message}`);
    }

    // Log activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: userId,
        activity_type: 'tip_viewed',
        metadata: { completed: true }
      });
  }

  /**
   * Skip a daily tip
   */
  async skipTip(userId: string, tipId: string): Promise<void> {
    // Log skip activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: userId,
        activity_type: 'tip_viewed',
        metadata: { skipped: true }
      });
  }

  // Helper methods
  private selectTipTemplate(user: any, children: any[]) {
    const templates = [
      {
        category: 'sleep',
        title: 'Gentle Sleep Routine',
        description: 'At this stage, your baby is starting to develop more predictable sleep patterns. Try establishing a simple bedtime routine: dim the lights, give a warm bath, and feed in a quiet environment.',
        quickTips: [
          'Start the routine 30 minutes before desired bedtime',
          'Keep the room temperature comfortable (68-70°F)',
          'Use soft, soothing sounds or white noise',
          'Be consistent with timing each night'
        ],
        parentingStage: 'newborn'
      },
      {
        category: 'feeding',
        title: 'Breastfeeding Success',
        description: 'Establishing a good breastfeeding routine takes time and patience. Focus on proper latch and feeding cues to build a strong foundation.',
        quickTips: [
          'Feed on demand, typically every 2-3 hours',
          'Ensure proper latch to prevent soreness',
          'Stay hydrated and eat nutritious meals',
          'Rest when baby rests to maintain energy'
        ],
        parentingStage: 'newborn'
      }
    ];

    // Return appropriate template based on user's parenting stage
    const stageTemplates = templates.filter(t => t.parentingStage === user.parenting_stage);
    return stageTemplates.length > 0 
      ? stageTemplates[Math.floor(Math.random() * stageTemplates.length)]
      : templates[0];
  }

  private calculateAgeInMonths(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    const yearsDiff = now.getFullYear() - birth.getFullYear();
    const monthsDiff = now.getMonth() - birth.getMonth();
    return yearsDiff * 12 + monthsDiff;
  }

  private getYoungestChildAge(children: any[]): number | undefined {
    if (children.length === 0) return undefined;
    const youngestChild = children[0];
    if (!youngestChild.date_of_birth) return undefined;
    return this.calculateAgeInMonths(youngestChild.date_of_birth);
  }

  private extractCategoryFromTags(tags: string[] | null): string {
    if (!tags || tags.length === 0) return 'general';
    const categoryTags = ['sleep', 'feeding', 'health', 'development', 'behavior', 'activities'];
    const foundCategory = tags.find(tag => categoryTags.includes(tag.toLowerCase()));
    return foundCategory || tags[0] || 'general';
  }

  private estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private async getUserProgressStats(userId: string) {
    return {
      tipsCompleted: 0,
      articlesRead: 0,
      milestonesAchieved: 0
    };
  }
}

// Export singleton instance
export const recommendationsService = new RecommendationsService();
