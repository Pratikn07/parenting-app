import { supabase } from '../../lib/supabase';
import { 
  DailyTip,
  DailyTipInsert,
  DailyTipUpdate,
  Profile,
  Child,
  ParentingStage,
  UserActivityLogInsert
} from '../../lib/database.types';

export interface DailyTipsServiceInterface {
  // Daily tips operations
  getTodaysTip(userId: string): Promise<DailyTip | null>;
  getTipForDate(userId: string, date: string): Promise<DailyTip | null>;
  getUserTips(userId: string, limit?: number): Promise<DailyTip[]>;
  markTipAsViewed(userId: string, tipId: string): Promise<DailyTip>;
  
  // Tip generation
  generateDailyTip(userId: string, date?: string): Promise<DailyTip>;
  generateTipsForWeek(userId: string, startDate?: string): Promise<DailyTip[]>;
  
  // Utility functions
  getTodaysDate(): string;
  shouldGenerateNewTip(userId: string): Promise<boolean>;
}

export interface TipTemplate {
  category: string;
  title: string;
  description: string;
  quickTips: string[];
  parentingStage: ParentingStage;
  minAgeMonths?: number;
  maxAgeMonths?: number;
}

export class DailyTipsService implements DailyTipsServiceInterface {
  
  // Predefined tip templates organized by category and parenting stage
  private tipTemplates: TipTemplate[] = [
    // Newborn tips (0-3 months)
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
      parentingStage: 'newborn',
      minAgeMonths: 0,
      maxAgeMonths: 3
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
      parentingStage: 'newborn',
      minAgeMonths: 0,
      maxAgeMonths: 3
    },
    {
      category: 'development',
      title: 'Tummy Time Benefits',
      description: 'Tummy time is crucial for your baby\'s physical development. Start with short sessions and gradually increase as your baby gets stronger.',
      quickTips: [
        'Start with 3-5 minutes, 2-3 times daily',
        'Use colorful toys to encourage lifting head',
        'Get down on baby\'s level for interaction',
        'Stop if baby becomes fussy and try again later'
      ],
      parentingStage: 'newborn',
      minAgeMonths: 0,
      maxAgeMonths: 3
    },
    // Infant tips (3-12 months)
    {
      category: 'feeding',
      title: 'Starting Solid Foods',
      description: 'Around 6 months, your baby is ready to explore solid foods. Start with single-ingredient purees and watch for allergic reactions.',
      quickTips: [
        'Start with iron-rich foods like baby cereal',
        'Introduce one new food every 3-5 days',
        'Let baby explore and make a mess',
        'Continue breastfeeding or formula feeding'
      ],
      parentingStage: 'infant',
      minAgeMonths: 4,
      maxAgeMonths: 8
    },
    {
      category: 'development',
      title: 'Encouraging Crawling',
      description: 'Most babies start crawling between 6-10 months. Create a safe, encouraging environment for your baby to explore movement.',
      quickTips: [
        'Place toys just out of reach to motivate movement',
        'Ensure floors are clean and safe for exploration',
        'Get on the floor and crawl with your baby',
        'Celebrate small movements and attempts'
      ],
      parentingStage: 'infant',
      minAgeMonths: 6,
      maxAgeMonths: 10
    },
    {
      category: 'sleep',
      title: 'Sleep Training Basics',
      description: 'Around 4-6 months, many babies can learn to sleep through the night. Choose a gentle method that works for your family.',
      quickTips: [
        'Establish a consistent bedtime routine',
        'Put baby down awake but drowsy',
        'Be patient - it can take several weeks',
        'Stay consistent with your chosen method'
      ],
      parentingStage: 'infant',
      minAgeMonths: 4,
      maxAgeMonths: 12
    },
    // Toddler tips (12+ months)
    {
      category: 'behavior',
      title: 'Managing Toddler Tantrums',
      description: 'Tantrums are a normal part of toddler development. Stay calm and consistent in your response to help your child learn emotional regulation.',
      quickTips: [
        'Stay calm and don\'t take it personally',
        'Acknowledge their feelings: "You\'re frustrated"',
        'Offer comfort when they\'re ready',
        'Set clear, consistent boundaries'
      ],
      parentingStage: 'toddler',
      minAgeMonths: 12,
      maxAgeMonths: 36
    },
    {
      category: 'development',
      title: 'Language Development',
      description: 'Toddlers are language sponges! Encourage communication through reading, singing, and lots of conversation.',
      quickTips: [
        'Read together daily, even if just for 5 minutes',
        'Narrate your daily activities',
        'Sing songs and nursery rhymes',
        'Give them time to respond in conversations'
      ],
      parentingStage: 'toddler',
      minAgeMonths: 12,
      maxAgeMonths: 36
    },
    {
      category: 'activities',
      title: 'Creative Play Ideas',
      description: 'Toddlers learn through play. Provide opportunities for creative, hands-on activities that stimulate their imagination.',
      quickTips: [
        'Set up simple art activities with washable materials',
        'Create obstacle courses with pillows and furniture',
        'Play pretend games together',
        'Explore nature during walks and outdoor time'
      ],
      parentingStage: 'toddler',
      minAgeMonths: 18,
      maxAgeMonths: 36
    }
  ];

  /**
   * Get today's tip for a user
   */
  async getTodaysTip(userId: string): Promise<DailyTip | null> {
    const today = this.getTodaysDate();
    return this.getTipForDate(userId, today);
  }

  /**
   * Get tip for a specific date
   */
  async getTipForDate(userId: string, date: string): Promise<DailyTip | null> {
    const { data, error } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('user_id', userId)
      .eq('tip_date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No tip found for this date, generate one
        return this.generateDailyTip(userId, date);
      }
      console.error('Error fetching daily tip:', error);
      throw new Error(`Failed to fetch daily tip: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's tips with optional limit
   */
  async getUserTips(userId: string, limit: number = 30): Promise<DailyTip[]> {
    const { data, error } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('user_id', userId)
      .order('tip_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user tips:', error);
      throw new Error(`Failed to fetch user tips: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark a tip as viewed
   */
  async markTipAsViewed(userId: string, tipId: string): Promise<DailyTip> {
    const updates: DailyTipUpdate = {
      is_viewed: true,
      viewed_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('daily_tips')
      .update(updates)
      .eq('id', tipId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking tip as viewed:', error);
      throw new Error(`Failed to mark tip as viewed: ${error.message}`);
    }

    // Log the activity
    await this.logTipActivity(userId, 'tip_viewed');

    return data;
  }

  /**
   * Generate a daily tip for a user
   */
  async generateDailyTip(userId: string, date?: string): Promise<DailyTip> {
    const tipDate = date || this.getTodaysDate();

    // Get user profile and children to personalize the tip
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile for tip generation:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Get user's children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('date_of_birth', { ascending: false });

    // Select appropriate tip template
    const template = this.selectTipTemplate(profile, children || []);

    // Create the tip
    const tipData: DailyTipInsert = {
      user_id: userId,
      tip_date: tipDate,
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
   * Generate tips for a week
   */
  async generateTipsForWeek(userId: string, startDate?: string): Promise<DailyTip[]> {
    const start = startDate ? new Date(startDate) : new Date();
    const tips: DailyTip[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      // Check if tip already exists for this date
      const existingTip = await this.getTipForDate(userId, dateString);
      if (existingTip) {
        tips.push(existingTip);
      } else {
        const newTip = await this.generateDailyTip(userId, dateString);
        tips.push(newTip);
      }
    }

    return tips;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodaysDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Check if a new tip should be generated for the user
   */
  async shouldGenerateNewTip(userId: string): Promise<boolean> {
    const today = this.getTodaysDate();
    
    const { data, error } = await supabase
      .from('daily_tips')
      .select('id')
      .eq('user_id', userId)
      .eq('tip_date', today)
      .single();

    if (error && error.code === 'PGRST116') {
      return true; // No tip exists for today
    }

    return false; // Tip already exists
  }

  /**
   * Select appropriate tip template based on user profile and children
   */
  private selectTipTemplate(profile: Profile, children: Child[]): TipTemplate {
    // If user has children, use the youngest child's age to determine appropriate tips
    if (children.length > 0) {
      const youngestChild = children[0]; // Already sorted by birth_date desc
      if (youngestChild.birth_date) {
        const ageInMonths = this.calculateAgeInMonths(youngestChild.birth_date);
        
        // Filter templates by age appropriateness
        const ageAppropriateTemplates = this.tipTemplates.filter(template => {
          if (template.minAgeMonths !== undefined && template.maxAgeMonths !== undefined) {
            return ageInMonths >= template.minAgeMonths && ageInMonths <= template.maxAgeMonths;
          }
          return true;
        });

        if (ageAppropriateTemplates.length > 0) {
          // Randomly select from age-appropriate templates
          return ageAppropriateTemplates[Math.floor(Math.random() * ageAppropriateTemplates.length)];
        }
      }
    }

    // Fallback to parenting stage from profile
    const stageTemplates = this.tipTemplates.filter(template => 
      template.parentingStage === profile.parenting_stage
    );

    if (stageTemplates.length > 0) {
      return stageTemplates[Math.floor(Math.random() * stageTemplates.length)];
    }

    // Final fallback - return a random template
    return this.tipTemplates[Math.floor(Math.random() * this.tipTemplates.length)];
  }

  /**
   * Calculate age in months from birth date
   */
  private calculateAgeInMonths(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    
    const yearsDiff = now.getFullYear() - birth.getFullYear();
    const monthsDiff = now.getMonth() - birth.getMonth();
    
    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Get the age of the youngest child in months
   */
  private getYoungestChildAge(children: Child[]): number | undefined {
    if (children.length === 0) return undefined;
    
    const youngestChild = children[0]; // Already sorted by birth_date desc
    if (!youngestChild.birth_date) return undefined;
    
    return this.calculateAgeInMonths(youngestChild.birth_date);
  }

  /**
   * Log tip activity
   */
  private async logTipActivity(userId: string, activityType: 'tip_viewed'): Promise<void> {
    const activity: UserActivityLogInsert = {
      user_id: userId,
      activity_type: activityType
    };

    const { error } = await supabase
      .from('user_activity_log')
      .insert(activity);

    if (error) {
      console.error('Error logging tip activity:', error);
      // Don't throw error here as it's not critical to the main operation
    }
  }
}

// Export singleton instance
export const dailyTipsService = new DailyTipsService();
