// Analytics Service for tracking user behavior and insights using Supabase
import { supabase } from '../supabase';

export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface UserInsight {
  id: string;
  type: 'milestone_progress' | 'engagement' | 'content_preference' | 'weekly_summary';
  title: string;
  description: string;
  data: Record<string, any>;
  createdAt: Date;
}

export interface EngagementStats {
  totalSessions: number;
  averageSessionDuration: number; // minutes
  totalChatMessages: number;
  milestonesCompleted: number;
  resourcesViewed: number;
  lastActiveDate: Date;
}

export interface WeeklyReport {
  weekStartDate: Date;
  weekEndDate: Date;
  milestonesCompleted: number;
  chatSessions: number;
  topCategories: string[];
  insights: string[];
  recommendations: string[];
}

class AnalyticsServiceClass {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Analytics: User not authenticated, skipping event tracking');
        return;
      }

      // For now, we'll store analytics events in a simple format
      // In the future, you could create an analytics table in Supabase
      console.log('Analytics Event:', {
        userId: user.id,
        sessionId: this.sessionId,
        eventName: event.eventName,
        properties: event.properties,
        timestamp: event.timestamp || new Date(),
      });

      // Store locally for now (could be sent to Supabase analytics table later)
      this.events.push({
        ...event,
        timestamp: event.timestamp || new Date(),
      });

    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw error for analytics to avoid breaking user experience
    }
  }

  async getEngagementStats(): Promise<EngagementStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get chat sessions count
      const { count: sessionCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get chat message count for user's sessions
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id);

      let chatCount = 0;
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);
        chatCount = count || 0;
      }

      // Mock data for other stats (would be calculated from actual usage data)
      return {
        totalSessions: sessionCount || 0,
        averageSessionDuration: 5.2, // Mock value
        totalChatMessages: chatCount || 0,
        milestonesCompleted: 0, // Would be calculated from user_milestones table
        resourcesViewed: 0, // Would be calculated from analytics events
        lastActiveDate: new Date(),
      };
    } catch (error) {
      console.error('Engagement stats error:', error);
      // Return mock data to prevent app crashes
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalChatMessages: 0,
        milestonesCompleted: 0,
        resourcesViewed: 0,
        lastActiveDate: new Date(),
      };
    }
  }

  async getUserInsights(): Promise<UserInsight[]> {
    try {
      // Mock insights for now - would be generated from user data analysis
      return [
        {
          id: '1',
          type: 'engagement',
          title: 'Great Progress!',
          description: 'You\'ve been actively engaging with the app this week.',
          data: { engagement_score: 85 },
          createdAt: new Date(),
        },
        {
          id: '2',
          type: 'content_preference',
          title: 'Sleep Content Popular',
          description: 'You frequently access sleep-related resources.',
          data: { category: 'sleep', frequency: 12 },
          createdAt: new Date(),
        },
      ];
    } catch (error) {
      console.error('User insights error:', error);
      return [];
    }
  }

  async getWeeklyReport(): Promise<WeeklyReport> {
    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Mock weekly report - would be generated from actual user data
      return {
        weekStartDate: weekStart,
        weekEndDate: now,
        milestonesCompleted: 2,
        chatSessions: 5,
        topCategories: ['sleep', 'feeding', 'development'],
        insights: [
          'You\'ve been most active in the evenings',
          'Sleep-related questions are your top concern',
          'You\'re making great progress with milestone tracking'
        ],
        recommendations: [
          'Try the new feeding schedule tracker',
          'Check out our latest sleep tips',
          'Consider setting up growth measurement reminders'
        ],
      };
    } catch (error) {
      console.error('Weekly report error:', error);
      throw error;
    }
  }

  // Legacy support + convenience methods
  track(eventName: string, properties?: Record<string, any>): void {
    if (this.isEnabled) {
      this.trackEvent({ eventName, properties });
    }
  }

  // Convenience methods for common events
  async trackScreenView(screenName: string): Promise<void> {
    await this.trackEvent({
      eventName: 'screen_view',
      properties: { screen_name: screenName },
    });
  }

  async trackChatMessage(conversationId: string, messageLength: number): Promise<void> {
    await this.trackEvent({
      eventName: 'chat_message_sent',
      properties: { 
        conversation_id: conversationId,
        message_length: messageLength 
      },
    });
  }

  async trackMilestoneCompleted(milestoneId: string, category: string): Promise<void> {
    await this.trackEvent({
      eventName: 'milestone_completed',
      properties: { 
        milestone_id: milestoneId,
        category 
      },
    });
  }

  async trackResourceViewed(resourceId: string, type: string, category: string): Promise<void> {
    await this.trackEvent({
      eventName: 'resource_viewed',
      properties: { 
        resource_id: resourceId,
        type,
        category 
      },
    });
  }

  async trackResourceSaved(resourceId: string, type: string, category: string): Promise<void> {
    await this.trackEvent({
      eventName: 'resource_saved',
      properties: { 
        resource_id: resourceId,
        type,
        category 
      },
    });
  }

  async trackAppOpened(): Promise<void> {
    await this.trackEvent({
      eventName: 'app_opened',
    });
  }

  async trackAppClosed(sessionDuration: number): Promise<void> {
    await this.trackEvent({
      eventName: 'app_closed',
      properties: { session_duration: sessionDuration },
    });
  }

  // Legacy methods for backward compatibility
  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
