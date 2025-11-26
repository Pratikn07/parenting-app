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
    let dailyTip: DailyTip | null = null;
    let recommendedArticles: RecommendedArticle[] = [];
    let actionItems: ActionItem[] = [];
    let progressStats = {
      tipsCompleted: 0,
      articlesRead: 0,
      milestonesAchieved: 0
    };

    // Fetch data in parallel where possible, but tip is needed for articles
    try {
      try {
        // Get user's daily tip
        dailyTip = await this.getTodaysTip(userId);
      } catch (error) {
        console.error('Error getting daily tip:', error);
        // Continue without tip
      }

      try {
        // Get recommended articles based on daily tip and user profile
        recommendedArticles = await this.getRecommendedArticles(userId, dailyTip);
      } catch (error) {
        console.error('Error getting recommended articles:', error);
        // Continue without articles
      }

      try {
        // Generate personalized action items
        actionItems = await this.generateActionItems(userId);
      } catch (error) {
        console.error('Error getting action items:', error);
        // Continue without action items
      }

      try {
        // Get user progress stats
        progressStats = await this.getUserProgressStats(userId);
      } catch (error) {
        console.error('Error getting progress stats:', error);
        // Continue with default stats
      }

      return {
        dailyTip,
        recommendedArticles,
        actionItems,
        progressStats
      };
    } catch (error) {
      console.error('Critical error getting personalized content:', error);
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

    // Generate new tip using AI Edge Function
    return this.generateDailyTipWithAI(userId);
  }

  /**
   * Generate a daily tip using DeepSeek AI via Edge Function
   */
  async generateDailyTipWithAI(userId: string): Promise<DailyTip> {
    try {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('generate-tip', {
        body: { userId }
      });

      if (error) {
        console.error('Edge Function error:', error);
        // Fall back to static template
        return this.generateFallbackTip(userId);
      }

      if (data?.tip) {
        return data.tip;
      }

      throw new Error('No tip returned from Edge Function');
    } catch (error) {
      console.error('Error calling generate-tip Edge Function:', error);
      // Fall back to static template generation
      return this.generateFallbackTip(userId);
    }
  }

  /**
   * Fallback tip generation when AI is unavailable
   */
  private async generateFallbackTip(userId: string): Promise<DailyTip> {
    const today = new Date().toISOString().split('T')[0];

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

    // Select appropriate fallback template
    const template = this.selectFallbackTemplate(user.parenting_stage || 'expecting');

    const tipData = {
      user_id: userId,
      tip_date: today,
      title: template.title,
      description: template.description,
      category: template.category,
      parenting_stage: user.parenting_stage || 'expecting',
      child_age_months: this.getYoungestChildAge(children || []),
      quick_tips: template.quickTips,
      is_viewed: false,
      ai_generated: false
    };

    const { data, error } = await supabase
      .from('daily_tips')
      .insert(tipData)
      .select()
      .single();

    if (error) {
      console.error('Error saving fallback tip:', error);
      throw new Error(`Failed to generate daily tip: ${error.message}`);
    }

    return data;
  }

  /**
   * Fallback templates for when AI is unavailable
   */
  private selectFallbackTemplate(parentingStage: string) {
    const templates: Record<string, { title: string; description: string; category: string; quickTips: string[] }[]> = {
      expecting: [
        {
          category: 'health',
          title: 'Prenatal Nutrition',
          description: 'Focus on nutrient-rich foods during pregnancy. Folate, iron, and calcium are especially important for your baby\'s development.',
          quickTips: [
            'Take your prenatal vitamins daily',
            'Eat leafy greens for folate',
            'Include iron-rich foods like lean meats',
            'Stay hydrated with 8-10 glasses of water'
          ]
        }
      ],
      newborn: [
        {
          category: 'sleep',
          title: 'Safe Sleep Basics',
          description: 'Create a safe sleep environment for your newborn. Always place baby on their back on a firm, flat surface.',
          quickTips: [
            'Always place baby on their back to sleep',
            'Use a firm, flat mattress',
            'Keep the crib clear of blankets and toys',
            'Room-share for the first 6 months'
          ]
        }
      ],
      infant: [
        {
          category: 'development',
          title: 'Tummy Time Fun',
          description: 'Tummy time helps strengthen your baby\'s neck and shoulder muscles. Start with short sessions and gradually increase.',
          quickTips: [
            'Start with 3-5 minutes at a time',
            'Place colorful toys within reach',
            'Get down on their level to encourage engagement',
            'Try after diaper changes when baby is alert'
          ]
        }
      ],
      toddler: [
        {
          category: 'behavior',
          title: 'Managing Big Emotions',
          description: 'Toddlers are learning to navigate big feelings. Help them by naming emotions and staying calm during outbursts.',
          quickTips: [
            'Name the emotion: "You seem frustrated"',
            'Stay calm - your energy is contagious',
            'Offer comfort and validation',
            'Teach simple coping strategies like deep breaths'
          ]
        }
      ],
      preschool: [
        {
          category: 'activities',
          title: 'Learning Through Play',
          description: 'Preschoolers learn best through play. Encourage imaginative play and hands-on activities to build key skills.',
          quickTips: [
            'Set up open-ended play activities',
            'Ask open questions during play',
            'Rotate toys to keep things fresh',
            'Join in their imaginative scenarios'
          ]
        }
      ]
    };

    const stageTemplates = templates[parentingStage] || templates.expecting;
    return stageTemplates[Math.floor(Math.random() * stageTemplates.length)];
  }

  /**
   * Get smart article recommendations based on user context
   * Enhanced with child age matching and activity history
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

    // Get recently viewed articles to avoid repetition
    const { data: recentActivity } = await supabase
      .from('user_activity_log')
      .select('resource_id')
      .eq('user_id', userId)
      .eq('activity_type', 'resource_viewed')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentlyViewedIds = recentActivity?.map(a => a.resource_id).filter(Boolean) || [];

    // Get articles
    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .eq('locale', user.locale || 'en-US')
      .limit(20);

    if (!articles) return [];

    // Calculate youngest child age in days for age-based matching
    const youngestChildAgeDays = this.getYoungestChildAgeInDays(children || []);

    // Score and rank articles
    const scoredArticles = articles.map(article => {
      let score = 0;
      let reasons: string[] = [];

      // Penalize recently viewed articles
      if (recentlyViewedIds.includes(article.id)) {
        score -= 200;
      }

      // High priority: Match daily tip category (100 points)
      if (dailyTip && article.tags?.includes(dailyTip.category)) {
        score += 100;
        reasons.push(`Related to today's ${dailyTip.category} tip`);
      }

      // High priority: Match child age range (90 points)
      if (youngestChildAgeDays !== null && article.age_min_days !== null && article.age_max_days !== null) {
        if (youngestChildAgeDays >= article.age_min_days && youngestChildAgeDays <= article.age_max_days) {
          score += 90;
          reasons.push('Perfect for your child\'s age');
        } else if (youngestChildAgeDays >= article.age_min_days - 30 && youngestChildAgeDays <= article.age_max_days + 30) {
          // Within 1 month of range - still relevant
          score += 40;
        }
      }

      // Medium priority: Match parenting stage (50 points)
      if (article.tags?.includes(user.parenting_stage || '')) {
        score += 50;
        if (reasons.length === 0) reasons.push(`Perfect for ${user.parenting_stage} stage`);
      }

      // Low priority: Match feeding preference if relevant (20 points)
      if (user.feeding_preference && article.tags?.includes(user.feeding_preference)) {
        score += 20;
      }

      // Determine primary recommendation reason
      const reason = reasons.length > 0 ? reasons[0] : 'Recommended for you';

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

    // Get upcoming milestones from templates
    if (children && children.length > 0) {
      for (const child of children) {
        if (child.date_of_birth) {
          const ageInMonths = this.calculateAgeInMonths(child.date_of_birth);

          // Get milestone templates for this age
          const { data: upcomingMilestones } = await supabase
            .from('milestone_templates')
            .select('*')
            .lte('min_age_months', ageInMonths + 1)
            .gte('max_age_months', ageInMonths)
            .eq('is_active', true)
            .limit(2);

          // Get already achieved milestones
          const { data: achievedMilestones } = await supabase
            .from('milestones')
            .select('template_id')
            .eq('child_id', child.id)
            .not('achieved_at', 'is', null);

          const achievedTemplateIds = achievedMilestones?.map(m => m.template_id) || [];

          // Add milestone reminders for unachieved milestones
          upcomingMilestones?.forEach(milestone => {
            if (!achievedTemplateIds.includes(milestone.id)) {
              actionItems.push({
                id: `milestone-${child.id}-${milestone.id}`,
                type: 'milestone',
                title: `Track: ${milestone.title}`,
                subtitle: `${milestone.milestone_type} development`,
                priority: 'medium',
                icon: 'TrendingUp',
                color: '#8BA888',
                actionText: 'Track',
                metadata: { childId: child.id, milestoneId: milestone.id }
              });
            }
          });

          // Add appointment reminders based on child age
          const checkupMonths = [1, 2, 4, 6, 9, 12, 15, 18, 24, 30, 36];
          const upcomingCheckup = checkupMonths.find(m => m >= ageInMonths && m <= ageInMonths + 1);
          
          if (upcomingCheckup) {
            actionItems.push({
              id: `checkup-${child.id}-${upcomingCheckup}`,
              type: 'appointment',
              title: 'Schedule pediatrician visit',
              subtitle: `${upcomingCheckup}-month checkup • Health`,
              priority: 'high',
              icon: 'Calendar',
              color: '#D4635A',
              actionText: 'Schedule',
              metadata: { childId: child.id, checkupType: `${upcomingCheckup}-month` }
            });
          }
        }
      }
    }

    return actionItems.slice(0, 3); // Return top 3 action items
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

  /**
   * Get real user progress statistics
   */
  private async getUserProgressStats(userId: string): Promise<{
    tipsCompleted: number;
    articlesRead: number;
    milestonesAchieved: number;
  }> {
    // Count viewed tips
    const { count: tipsCompleted } = await supabase
      .from('daily_tips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_viewed', true);

    // Count articles read (from activity log)
    const { count: articlesRead } = await supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'resource_viewed');

    // Count milestones achieved
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('user_id', userId);

    let milestonesAchieved = 0;
    if (children && children.length > 0) {
      const childIds = children.map(c => c.id);
      const { count } = await supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })
        .in('child_id', childIds)
        .not('achieved_at', 'is', null);
      
      milestonesAchieved = count || 0;
    }

    return {
      tipsCompleted: tipsCompleted || 0,
      articlesRead: articlesRead || 0,
      milestonesAchieved
    };
  }

  // Helper methods
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

  private getYoungestChildAgeInDays(children: any[]): number | null {
    if (children.length === 0) return null;
    const youngestChild = children[0];
    if (!youngestChild.date_of_birth) return null;
    
    const birth = new Date(youngestChild.date_of_birth);
    const now = new Date();
    const diffTime = now.getTime() - birth.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private extractCategoryFromTags(tags: string[] | null): string {
    if (!tags || tags.length === 0) return 'general';
    const categoryTags = ['sleep', 'feeding', 'health', 'development', 'behavior', 'activities', 'safety', 'bonding'];
    const foundCategory = tags.find(tag => categoryTags.includes(tag.toLowerCase()));
    return foundCategory || tags[0] || 'general';
  }

  private estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
}

// Export singleton instance
export const recommendationsService = new RecommendationsService();
