// Export all services
export * from './auth/AuthService';
export * from './auth/SupabaseAuthService';
export * from './resources/ResourcesService';
export * from './progress/ProgressService';
export * from './milestones/MilestonesService';
export * from './tips/DailyTipsService';
export * from './recommendations/RecommendationsService';

// Legacy placeholder exports for backward compatibility
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api.com';

// Legacy placeholder service functions (deprecated - use individual services instead)
export const authService = {
  signIn: async (email: string, password: string) => {
    // TODO: Implement authentication
    console.log('Auth: Sign in', { email });
    throw new Error('Authentication not implemented');
  },
  
  signUp: async (email: string, password: string, name: string) => {
    // TODO: Implement registration
    console.log('Auth: Sign up', { email, name });
    throw new Error('Registration not implemented');
  },
  
  signOut: async () => {
    // TODO: Implement sign out
    console.log('Auth: Sign out');
  },
  
  getCurrentUser: async () => {
    // TODO: Get current user
    return null;
  }
};

export const chatService = {
  sendMessage: async (message: string) => {
    // TODO: Implement chat functionality
    console.log('Chat: Send message', { message });
    throw new Error('Chat not implemented');
  },
  
  getHistory: async () => {
    // TODO: Get chat history
    return [];
  }
};

export const resourceService = {
  getResources: async () => {
    // TODO: Fetch resources
    console.log('Resources: Get resources');
    return [];
  },
  
  searchResources: async (query: string) => {
    // TODO: Search resources
    console.log('Resources: Search', { query });
    return [];
  }
};

export const milestoneService = {
  getMilestones: async () => {
    // TODO: Fetch milestones
    console.log('Milestones: Get milestones');
    return [];
  },
  
  markComplete: async (milestoneId: string) => {
    // TODO: Mark milestone complete
    console.log('Milestones: Mark complete', { milestoneId });
  }
};
