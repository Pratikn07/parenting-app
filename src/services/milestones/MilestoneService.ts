// Milestone Service for tracking child development milestones
export interface Milestone {
  id: string;
  category: 'physical' | 'cognitive' | 'social' | 'language';
  title: string;
  description: string;
  ageRangeStart: number; // months
  ageRangeEnd: number; // months
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted?: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface UserMilestone {
  id: string;
  milestoneId: string;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  milestone: Milestone;
}

export interface MilestoneProgress {
  totalMilestones: number;
  completedMilestones: number;
  progressPercentage: number;
  recentCompletions: UserMilestone[];
  upcomingMilestones: Milestone[];
}

class MilestoneServiceClass {
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

  async getMilestones(category?: string, ageRange?: [number, number]): Promise<Milestone[]> {
    try {
      let url = `${this.baseUrl}/api/milestones`;
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (ageRange) {
        params.append('age_start', ageRange[0].toString());
        params.append('age_end', ageRange[1].toString());
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
        throw new Error(errorData.detail || 'Failed to get milestones');
      }

      const data = await response.json();
      return data.map((milestone: any) => ({
        id: milestone.id,
        category: milestone.category,
        title: milestone.title,
        description: milestone.description,
        ageRangeStart: milestone.age_range_start,
        ageRangeEnd: milestone.age_range_end,
        difficulty: milestone.difficulty,
        isCompleted: milestone.is_completed,
        completedAt: milestone.completed_at ? new Date(milestone.completed_at) : undefined,
        notes: milestone.notes,
      }));
    } catch (error) {
      console.error('Milestones error:', error);
      throw error;
    }
  }

  async getUserMilestones(): Promise<UserMilestone[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milestones/user`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get user milestones');
      }

      const data = await response.json();
      return data.map((userMilestone: any) => ({
        id: userMilestone.id,
        milestoneId: userMilestone.milestone_id,
        isCompleted: userMilestone.is_completed,
        completedAt: userMilestone.completed_at ? new Date(userMilestone.completed_at) : undefined,
        notes: userMilestone.notes,
        milestone: {
          id: userMilestone.milestone.id,
          category: userMilestone.milestone.category,
          title: userMilestone.milestone.title,
          description: userMilestone.milestone.description,
          ageRangeStart: userMilestone.milestone.age_range_start,
          ageRangeEnd: userMilestone.milestone.age_range_end,
          difficulty: userMilestone.milestone.difficulty,
        },
      }));
    } catch (error) {
      console.error('User milestones error:', error);
      throw error;
    }
  }

  async completeMilestone(milestoneId: string, notes?: string): Promise<UserMilestone> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milestones/${milestoneId}/complete`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete milestone');
      }

      const data = await response.json();
      return {
        id: data.id,
        milestoneId: data.milestone_id,
        isCompleted: data.is_completed,
        completedAt: new Date(data.completed_at),
        notes: data.notes,
        milestone: data.milestone,
      };
    } catch (error) {
      console.error('Complete milestone error:', error);
      throw error;
    }
  }

  async getMilestoneProgress(): Promise<MilestoneProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milestones/progress`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get milestone progress');
      }

      const data = await response.json();
      return {
        totalMilestones: data.total_milestones,
        completedMilestones: data.completed_milestones,
        progressPercentage: data.progress_percentage,
        recentCompletions: data.recent_completions,
        upcomingMilestones: data.upcoming_milestones,
      };
    } catch (error) {
      console.error('Milestone progress error:', error);
      throw error;
    }
  }
}

export const MilestoneService = new MilestoneServiceClass();
