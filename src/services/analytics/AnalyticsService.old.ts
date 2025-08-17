// Analytics Service for tracking user behavior and insights
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

interface AnalyticsEventOld {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

interface UserProperties {
  userId: string;
  name?: string;
  email?: string;
  parentingStage?: string;
  childrenCount?: number;
  signupDate?: Date;
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

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  identify(userProperties: UserProperties): void {
    if (!this.isEnabled) return;

    this.userId = userProperties.userId;
    this.track('user_identified', userProperties);
  }

  screen(screenName: string, properties?: Record<string, any>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  // Parenting-specific analytics
  trackParentingMilestone(milestone: string, childAge: string): void {
    this.track('parenting_milestone', {
      milestone,
      child_age: childAge,
      category: 'development',
    });
  }

  trackChatInteraction(messageType: 'question' | 'response', topic?: string): void {
    this.track('chat_interaction', {
      message_type: messageType,
      topic,
      category: 'engagement',
    });
  }

  trackResourceAccess(resourceType: string, resourceId: string): void {
    this.track('resource_accessed', {
      resource_type: resourceType,
      resource_id: resourceId,
      category: 'learning',
    });
  }

  trackOnboardingStep(step: number, completed: boolean): void {
    this.track('onboarding_step', {
      step_number: step,
      completed,
      category: 'onboarding',
    });
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // In production, send to analytics service (Mixpanel, Amplitude, etc.)
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.warn('Failed to send analytics event:', event.name);
      }
    } catch (error) {
      console.warn('Analytics error:', error);
      // Store locally for retry
      this.storeEventLocally(event);
    }
  }

  private storeEventLocally(event: AnalyticsEvent): void {
    // Store in AsyncStorage for retry later
    console.log('Storing event locally:', event.name);
  }

  async flush(): Promise<void> {
    // Send any pending events
    const pendingEvents = [...this.events];
    this.events = [];

    for (const event of pendingEvents) {
      await this.sendEvent(event);
    }
  }

  disable(): void {
    this.isEnabled = false;
  }

  enable(): void {
    this.isEnabled = true;
  }

  reset(): void {
    this.events = [];
    this.userId = undefined;
    this.sessionId = this.generateSessionId();
  }
}

const AnalyticsService = new AnalyticsServiceClass();
export { AnalyticsService };
export default AnalyticsService;
