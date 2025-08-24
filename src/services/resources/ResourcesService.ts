import { supabase } from '../../lib/supabase';
import { 
  Resource, 
  ResourceInsert, 
  ResourceUpdate,
  UserSavedResource,
  UserSavedResourceInsert,
  UserActivityLog,
  UserActivityLogInsert,
  ParentingStage,
  ActivityType
} from '../../lib/database.types';

export interface ResourcesServiceInterface {
  // Resource operations
  getResources(filters?: ResourceFilters): Promise<Resource[]>;
  getFeaturedResources(parentingStage?: ParentingStage): Promise<Resource[]>;
  getResourceById(id: string): Promise<Resource | null>;
  searchResources(query: string, filters?: ResourceFilters): Promise<Resource[]>;
  
  // User saved resources
  getSavedResources(userId: string): Promise<(UserSavedResource & { resource: Resource })[]>;
  saveResource(userId: string, resourceId: string, notes?: string): Promise<UserSavedResource>;
  unsaveResource(userId: string, resourceId: string): Promise<void>;
  isResourceSaved(userId: string, resourceId: string): Promise<boolean>;
  
  // Activity logging
  logActivity(activity: UserActivityLogInsert): Promise<UserActivityLog>;
  logResourceViewed(userId: string, resourceId: string, metadata?: any): Promise<void>;
  logResourceSaved(userId: string, resourceId: string): Promise<void>;
  logResourceShared(userId: string, resourceId: string): Promise<void>;
  logSearch(userId: string, query: string, resultsCount: number): Promise<void>;
  logCategoryFilter(userId: string, category: string): Promise<void>;
}

export interface ResourceFilters {
  category?: string;
  parentingStages?: ParentingStage[];
  tags?: string[];
  isFeatured?: boolean;
}

export class ResourcesService implements ResourcesServiceInterface {
  
  /**
   * Get resources with optional filters
   */
  async getResources(filters?: ResourceFilters): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.parentingStages && filters.parentingStages.length > 0) {
      query = query.overlaps('parenting_stages', filters.parentingStages);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching resources:', error);
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get featured resources for a specific parenting stage
   */
  async getFeaturedResources(parentingStage?: ParentingStage): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (parentingStage) {
      query = query.contains('parenting_stages', [parentingStage]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching featured resources:', error);
      throw new Error(`Failed to fetch featured resources: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific resource by ID
   */
  async getResourceById(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Resource not found
      }
      console.error('Error fetching resource:', error);
      throw new Error(`Failed to fetch resource: ${error.message}`);
    }

    return data;
  }

  /**
   * Search resources by query string
   */
  async searchResources(query: string, filters?: ResourceFilters): Promise<Resource[]> {
    let supabaseQuery = supabase
      .from('resources')
      .select('*')
      .or(`title.ilike.%${query}%, description.ilike.%${query}%, content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    // Apply additional filters
    if (filters?.category) {
      supabaseQuery = supabaseQuery.eq('category', filters.category);
    }

    if (filters?.parentingStages && filters.parentingStages.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('parenting_stages', filters.parentingStages);
    }

    if (filters?.tags && filters.tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('tags', filters.tags);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Error searching resources:', error);
      throw new Error(`Failed to search resources: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's saved resources with resource details
   */
  async getSavedResources(userId: string): Promise<(UserSavedResource & { resource: Resource })[]> {
    const { data, error } = await supabase
      .from('user_saved_resources')
      .select(`
        *,
        resource:resources(*)
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved resources:', error);
      throw new Error(`Failed to fetch saved resources: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Save a resource for a user
   */
  async saveResource(userId: string, resourceId: string, notes?: string): Promise<UserSavedResource> {
    const insertData: UserSavedResourceInsert = {
      user_id: userId,
      resource_id: resourceId,
      notes
    };

    const { data, error } = await supabase
      .from('user_saved_resources')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error saving resource:', error);
      throw new Error(`Failed to save resource: ${error.message}`);
    }

    // Log the activity
    await this.logResourceSaved(userId, resourceId);

    return data;
  }

  /**
   * Remove a saved resource for a user
   */
  async unsaveResource(userId: string, resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_saved_resources')
      .delete()
      .eq('user_id', userId)
      .eq('resource_id', resourceId);

    if (error) {
      console.error('Error unsaving resource:', error);
      throw new Error(`Failed to unsave resource: ${error.message}`);
    }
  }

  /**
   * Check if a resource is saved by a user
   */
  async isResourceSaved(userId: string, resourceId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_saved_resources')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Not found
      }
      console.error('Error checking if resource is saved:', error);
      throw new Error(`Failed to check if resource is saved: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Log user activity
   */
  async logActivity(activity: UserActivityLogInsert): Promise<UserActivityLog> {
    const { data, error } = await supabase
      .from('user_activity_log')
      .insert(activity)
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      throw new Error(`Failed to log activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Log that a user viewed a resource
   */
  async logResourceViewed(userId: string, resourceId: string, metadata?: any): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: 'resource_viewed',
      resource_id: resourceId,
      metadata
    });
  }

  /**
   * Log that a user saved a resource
   */
  async logResourceSaved(userId: string, resourceId: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: 'resource_saved',
      resource_id: resourceId
    });
  }

  /**
   * Log that a user shared a resource
   */
  async logResourceShared(userId: string, resourceId: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: 'resource_shared',
      resource_id: resourceId
    });
  }

  /**
   * Log a search query
   */
  async logSearch(userId: string, query: string, resultsCount: number): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: 'search_performed',
      metadata: {
        query,
        results_count: resultsCount
      }
    });
  }

  /**
   * Log category filtering
   */
  async logCategoryFilter(userId: string, category: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      activity_type: 'category_filtered',
      metadata: {
        category
      }
    });
  }
}

// Export singleton instance
export const resourcesService = new ResourcesService();
