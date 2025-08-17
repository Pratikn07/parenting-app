// Main services export file - import all services here for easy access
export { AuthService } from './auth/AuthService';
export { ChatService } from './chat/ChatService';
export { MilestoneService } from './milestones/MilestoneService';
export { ResourceService } from './resources/ResourceService';
export { AnalyticsService } from './analytics/NewAnalyticsService';

// Export types for easy access
export type { AuthResponse, SignInCredentials, SignUpCredentials, User } from '../shared/types/auth.types';
export type { ChatMessage, ChatResponse } from './chat/ChatService';
export type { Milestone, UserMilestone, MilestoneProgress } from './milestones/MilestoneService';
export type { Resource, SavedResource, ResourceFilters } from './resources/ResourceService';
export type { AnalyticsEvent, UserInsight, EngagementStats, WeeklyReport } from './analytics/NewAnalyticsService';

// Re-export common interfaces
export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
