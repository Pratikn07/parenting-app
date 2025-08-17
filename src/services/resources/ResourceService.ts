// Resource Service for managing parenting resources and content
export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'video' | 'checklist' | 'guide';
  category: 'sleep' | 'feeding' | 'development' | 'health' | 'behavior' | 'safety';
  ageRangeStart: number; // months
  ageRangeEnd: number; // months
  tags: string[];
  authorName?: string;
  readingTime?: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isSaved?: boolean;
  savedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedResource {
  id: string;
  resourceId: string;
  savedAt: Date;
  notes?: string;
  resource: Resource;
}

export interface ResourceFilters {
  category?: string;
  type?: string;
  ageRange?: [number, number];
  difficulty?: string;
  tags?: string[];
  search?: string;
}

class ResourceServiceClass {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getStoredToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async getStoredToken(): Promise<string | null> {
    // TODO: Implement token retrieval from secure storage
    return null;
  }

  async getResources(filters?: ResourceFilters): Promise<Resource[]> {
    try {
      let url = `${this.baseUrl}/api/resources`;
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.category) params.append('category', filters.category);
        if (filters.type) params.append('type', filters.type);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.search) params.append('search', filters.search);
        if (filters.ageRange) {
          params.append('age_start', filters.ageRange[0].toString());
          params.append('age_end', filters.ageRange[1].toString());
        }
        if (filters.tags) {
          filters.tags.forEach(tag => params.append('tags', tag));
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get resources');
      }

      const data = await response.json();
      return data.map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        content: resource.content,
        type: resource.type,
        category: resource.category,
        ageRangeStart: resource.age_range_start,
        ageRangeEnd: resource.age_range_end,
        tags: resource.tags,
        authorName: resource.author_name,
        readingTime: resource.reading_time,
        difficulty: resource.difficulty,
        isSaved: resource.is_saved,
        savedAt: resource.saved_at ? new Date(resource.saved_at) : undefined,
        createdAt: new Date(resource.created_at),
        updatedAt: new Date(resource.updated_at),
      }));
    } catch (error) {
      console.error('Resources error:', error);
      throw error;
    }
  }

  async getResource(id: string): Promise<Resource> {
    try {
      const response = await fetch(`${this.baseUrl}/api/resources/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get resource');
      }

      const resource = await response.json();
      return {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        content: resource.content,
        type: resource.type,
        category: resource.category,
        ageRangeStart: resource.age_range_start,
        ageRangeEnd: resource.age_range_end,
        tags: resource.tags,
        authorName: resource.author_name,
        readingTime: resource.reading_time,
        difficulty: resource.difficulty,
        isSaved: resource.is_saved,
        savedAt: resource.saved_at ? new Date(resource.saved_at) : undefined,
        createdAt: new Date(resource.created_at),
        updatedAt: new Date(resource.updated_at),
      };
    } catch (error) {
      console.error('Resource error:', error);
      throw error;
    }
  }

  async saveResource(resourceId: string, notes?: string): Promise<SavedResource> {
    try {
      const response = await fetch(`${this.baseUrl}/api/resources/${resourceId}/save`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save resource');
      }

      const data = await response.json();
      return {
        id: data.id,
        resourceId: data.resource_id,
        savedAt: new Date(data.saved_at),
        notes: data.notes,
        resource: data.resource,
      };
    } catch (error) {
      console.error('Save resource error:', error);
      throw error;
    }
  }

  async unsaveResource(resourceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/resources/${resourceId}/unsave`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to unsave resource');
      }
    } catch (error) {
      console.error('Unsave resource error:', error);
      throw error;
    }
  }

  async getSavedResources(): Promise<SavedResource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/resources/saved`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get saved resources');
      }

      const data = await response.json();
      return data.map((saved: any) => ({
        id: saved.id,
        resourceId: saved.resource_id,
        savedAt: new Date(saved.saved_at),
        notes: saved.notes,
        resource: saved.resource,
      }));
    } catch (error) {
      console.error('Saved resources error:', error);
      throw error;
    }
  }

  async getPersonalizedResources(): Promise<Resource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/resources/personalized`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get personalized resources');
      }

      const data = await response.json();
      return data.map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        content: resource.content,
        type: resource.type,
        category: resource.category,
        ageRangeStart: resource.age_range_start,
        ageRangeEnd: resource.age_range_end,
        tags: resource.tags,
        authorName: resource.author_name,
        readingTime: resource.reading_time,
        difficulty: resource.difficulty,
        createdAt: new Date(resource.created_at),
        updatedAt: new Date(resource.updated_at),
      }));
    } catch (error) {
      console.error('Personalized resources error:', error);
      throw error;
    }
  }
}

export const ResourceService = new ResourceServiceClass();
