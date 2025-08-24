import { create } from 'zustand';
import { 
  Resource, 
  UserSavedResource, 
  UserProgressStats, 
  DailyTip, 
  UserMilestoneProgress,
  MilestoneTemplate,
  ParentingStage 
} from '../../lib/database.types';
import { resourcesService, ResourceFilters } from '../../services/resources/ResourcesService';
import { progressService, WeeklyProgressSummary } from '../../services/progress/ProgressService';
import { milestonesService, MilestoneStats, UserMilestoneProgressWithTemplate } from '../../services/milestones/MilestonesService';
import { dailyTipsService } from '../../services/tips/DailyTipsService';

export interface ResourcesState {
  // Loading states
  isLoading: boolean;
  isLoadingResources: boolean;
  isLoadingProgress: boolean;
  isLoadingMilestones: boolean;
  isLoadingTips: boolean;
  
  // Error states
  error: string | null;
  
  // Resources data
  resources: Resource[];
  featuredResources: Resource[];
  savedResources: (UserSavedResource & { resource: Resource })[];
  searchResults: Resource[];
  searchQuery: string;
  selectedCategory: string;
  
  // Progress data
  weeklyProgress: WeeklyProgressSummary | null;
  progressStats: UserProgressStats | null;
  
  // Milestones data
  milestoneStats: MilestoneStats | null;
  userMilestones: UserMilestoneProgressWithTemplate[];
  milestoneTemplates: MilestoneTemplate[];
  selectedMilestoneCategory: string;
  
  // Daily tips data
  todaysTip: DailyTip | null;
  recentTips: DailyTip[];
  
  // Actions
  // Resources actions
  loadResources: (filters?: ResourceFilters) => Promise<void>;
  loadFeaturedResources: (parentingStage?: ParentingStage) => Promise<void>;
  loadSavedResources: (userId: string) => Promise<void>;
  searchResources: (query: string, filters?: ResourceFilters) => Promise<void>;
  saveResource: (userId: string, resourceId: string, notes?: string) => Promise<void>;
  unsaveResource: (userId: string, resourceId: string) => Promise<void>;
  setSelectedCategory: (category: string) => void;
  clearSearch: () => void;
  
  // Progress actions
  loadWeeklyProgress: (userId: string) => Promise<void>;
  loadProgressStats: (userId: string) => Promise<void>;
  incrementProgressStat: (userId: string, statType: keyof UserProgressStats, amount?: number) => Promise<void>;
  
  // Milestones actions
  loadMilestoneStats: (userId: string, childId?: string) => Promise<void>;
  loadUserMilestones: (userId: string, childId?: string) => Promise<void>;
  loadMilestoneTemplates: () => Promise<void>;
  completeMilestone: (userId: string, childId: string, milestoneTemplateId: string, notes?: string) => Promise<void>;
  uncompleteMilestone: (userId: string, childId: string, milestoneTemplateId: string) => Promise<void>;
  setSelectedMilestoneCategory: (category: string) => void;
  
  // Tips actions
  loadTodaysTip: (userId: string) => Promise<void>;
  loadRecentTips: (userId: string, limit?: number) => Promise<void>;
  markTipAsViewed: (userId: string, tipId: string) => Promise<void>;
  generateDailyTip: (userId: string) => Promise<void>;
  
  // Utility actions
  reset: () => void;
  setError: (error: string | null) => void;
}

const initialState = {
  // Loading states
  isLoading: false,
  isLoadingResources: false,
  isLoadingProgress: false,
  isLoadingMilestones: false,
  isLoadingTips: false,
  
  // Error states
  error: null,
  
  // Resources data
  resources: [],
  featuredResources: [],
  savedResources: [],
  searchResults: [],
  searchQuery: '',
  selectedCategory: 'All',
  
  // Progress data
  weeklyProgress: null,
  progressStats: null,
  
  // Milestones data
  milestoneStats: null,
  userMilestones: [],
  milestoneTemplates: [],
  selectedMilestoneCategory: 'All',
  
  // Daily tips data
  todaysTip: null,
  recentTips: [],
};

export const useResourcesStore = create<ResourcesState>((set, get) => ({
  ...initialState,

  // Resources actions
  loadResources: async (filters?: ResourceFilters) => {
    set({ isLoadingResources: true, error: null });
    try {
      const resources = await resourcesService.getResources(filters);
      set({ resources, isLoadingResources: false });
    } catch (error) {
      console.error('Error loading resources:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load resources',
        isLoadingResources: false 
      });
    }
  },

  loadFeaturedResources: async (parentingStage?: ParentingStage) => {
    set({ isLoadingResources: true, error: null });
    try {
      const featuredResources = await resourcesService.getFeaturedResources(parentingStage);
      set({ featuredResources, isLoadingResources: false });
    } catch (error) {
      console.error('Error loading featured resources:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load featured resources',
        isLoadingResources: false 
      });
    }
  },

  loadSavedResources: async (userId: string) => {
    set({ isLoadingResources: true, error: null });
    try {
      const savedResources = await resourcesService.getSavedResources(userId);
      set({ savedResources, isLoadingResources: false });
    } catch (error) {
      console.error('Error loading saved resources:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load saved resources',
        isLoadingResources: false 
      });
    }
  },

  searchResources: async (query: string, filters?: ResourceFilters) => {
    set({ isLoadingResources: true, error: null, searchQuery: query });
    try {
      const searchResults = await resourcesService.searchResources(query, filters);
      set({ searchResults, isLoadingResources: false });
      
      // Log search activity if user is available
      // Note: This would need userId from auth context in real implementation
    } catch (error) {
      console.error('Error searching resources:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search resources',
        isLoadingResources: false 
      });
    }
  },

  saveResource: async (userId: string, resourceId: string, notes?: string) => {
    try {
      await resourcesService.saveResource(userId, resourceId, notes);
      
      // Reload saved resources to update the UI
      const savedResources = await resourcesService.getSavedResources(userId);
      set({ savedResources });
    } catch (error) {
      console.error('Error saving resource:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to save resource' });
    }
  },

  unsaveResource: async (userId: string, resourceId: string) => {
    try {
      await resourcesService.unsaveResource(userId, resourceId);
      
      // Reload saved resources to update the UI
      const savedResources = await resourcesService.getSavedResources(userId);
      set({ savedResources });
    } catch (error) {
      console.error('Error unsaving resource:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to unsave resource' });
    }
  },

  setSelectedCategory: (category: string) => {
    set({ selectedCategory: category });
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] });
  },

  // Progress actions
  loadWeeklyProgress: async (userId: string) => {
    set({ isLoadingProgress: true, error: null });
    try {
      const weeklyProgress = await progressService.getWeeklyProgressSummary(userId);
      set({ weeklyProgress, isLoadingProgress: false });
    } catch (error) {
      console.error('Error loading weekly progress:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load weekly progress',
        isLoadingProgress: false 
      });
    }
  },

  loadProgressStats: async (userId: string) => {
    set({ isLoadingProgress: true, error: null });
    try {
      const progressStats = await progressService.getCurrentWeekStats(userId);
      set({ progressStats, isLoadingProgress: false });
    } catch (error) {
      console.error('Error loading progress stats:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load progress stats',
        isLoadingProgress: false 
      });
    }
  },

  incrementProgressStat: async (userId: string, statType: keyof UserProgressStats, amount: number = 1) => {
    try {
      const updatedStats = await progressService.incrementStat(userId, statType as any, amount);
      set({ progressStats: updatedStats });
    } catch (error) {
      console.error('Error incrementing progress stat:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update progress' });
    }
  },

  // Milestones actions
  loadMilestoneStats: async (userId: string, childId?: string) => {
    set({ isLoadingMilestones: true, error: null });
    try {
      const milestoneStats = await milestonesService.getMilestoneStats(userId, childId);
      set({ milestoneStats, isLoadingMilestones: false });
    } catch (error) {
      console.error('Error loading milestone stats:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load milestone stats',
        isLoadingMilestones: false 
      });
    }
  },

  loadUserMilestones: async (userId: string, childId?: string) => {
    set({ isLoadingMilestones: true, error: null });
    try {
      const userMilestones = await milestonesService.getUserMilestoneProgress(userId, childId);
      set({ userMilestones, isLoadingMilestones: false });
    } catch (error) {
      console.error('Error loading user milestones:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load milestones',
        isLoadingMilestones: false 
      });
    }
  },

  loadMilestoneTemplates: async () => {
    set({ isLoadingMilestones: true, error: null });
    try {
      const milestoneTemplates = await milestonesService.getMilestoneTemplates();
      set({ milestoneTemplates, isLoadingMilestones: false });
    } catch (error) {
      console.error('Error loading milestone templates:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load milestone templates',
        isLoadingMilestones: false 
      });
    }
  },

  completeMilestone: async (userId: string, childId: string, milestoneTemplateId: string, notes?: string) => {
    try {
      await milestonesService.completeMilestone(userId, childId, milestoneTemplateId, notes);
      
      // Reload milestones and stats to update the UI
      const [userMilestones, milestoneStats] = await Promise.all([
        milestonesService.getUserMilestoneProgress(userId, childId),
        milestonesService.getMilestoneStats(userId, childId)
      ]);
      
      set({ userMilestones, milestoneStats });
    } catch (error) {
      console.error('Error completing milestone:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to complete milestone' });
    }
  },

  uncompleteMilestone: async (userId: string, childId: string, milestoneTemplateId: string) => {
    try {
      await milestonesService.uncompleteMilestone(userId, childId, milestoneTemplateId);
      
      // Reload milestones and stats to update the UI
      const [userMilestones, milestoneStats] = await Promise.all([
        milestonesService.getUserMilestoneProgress(userId, childId),
        milestonesService.getMilestoneStats(userId, childId)
      ]);
      
      set({ userMilestones, milestoneStats });
    } catch (error) {
      console.error('Error uncompleting milestone:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to uncomplete milestone' });
    }
  },

  setSelectedMilestoneCategory: (category: string) => {
    set({ selectedMilestoneCategory: category });
  },

  // Tips actions
  loadTodaysTip: async (userId: string) => {
    set({ isLoadingTips: true, error: null });
    try {
      const todaysTip = await dailyTipsService.getTodaysTip(userId);
      set({ todaysTip, isLoadingTips: false });
    } catch (error) {
      console.error('Error loading today\'s tip:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load today\'s tip',
        isLoadingTips: false 
      });
    }
  },

  loadRecentTips: async (userId: string, limit: number = 10) => {
    set({ isLoadingTips: true, error: null });
    try {
      const recentTips = await dailyTipsService.getUserTips(userId, limit);
      set({ recentTips, isLoadingTips: false });
    } catch (error) {
      console.error('Error loading recent tips:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load recent tips',
        isLoadingTips: false 
      });
    }
  },

  markTipAsViewed: async (userId: string, tipId: string) => {
    try {
      const updatedTip = await dailyTipsService.markTipAsViewed(userId, tipId);
      
      // Update the tip in state
      const state = get();
      if (state.todaysTip?.id === tipId) {
        set({ todaysTip: updatedTip });
      }
      
      // Update in recent tips if present
      const updatedRecentTips = state.recentTips.map(tip => 
        tip.id === tipId ? updatedTip : tip
      );
      set({ recentTips: updatedRecentTips });
    } catch (error) {
      console.error('Error marking tip as viewed:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark tip as viewed' });
    }
  },

  generateDailyTip: async (userId: string) => {
    set({ isLoadingTips: true, error: null });
    try {
      const newTip = await dailyTipsService.generateDailyTip(userId);
      set({ todaysTip: newTip, isLoadingTips: false });
    } catch (error) {
      console.error('Error generating daily tip:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate daily tip',
        isLoadingTips: false 
      });
    }
  },

  // Utility actions
  reset: () => {
    set(initialState);
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
