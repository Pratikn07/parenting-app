import { supabase } from '../../lib/supabase';
import {
  Milestone,
  MilestoneTemplate,
  MilestoneInsert,
  MilestoneType,
  Child,
} from '../../lib/database.types';

// =====================================================
// Types for Milestone Service
// =====================================================

export interface MilestoneWithTemplate extends Milestone {
  template?: MilestoneTemplate | null;
}

export interface MilestonesBySection {
  past: MilestoneTemplateWithStatus[];
  current: MilestoneTemplateWithStatus[];
  upcoming: MilestoneTemplateWithStatus[];
  custom: MilestoneWithTemplate[];
}

export interface MilestoneTemplateWithStatus extends MilestoneTemplate {
  isCompleted: boolean;
  completedAt?: string | null;
  milestoneId?: string | null;
  notes?: string | null;
  // Mapped fields for easier access
  category: MilestoneType;
  age_min_months: number;
  age_max_months: number;
}

export interface MilestoneProgress {
  total: number;
  completed: number;
  percentage: number;
  byCategory: {
    physical: { total: number; completed: number };
    cognitive: { total: number; completed: number };
    social: { total: number; completed: number };
    emotional: { total: number; completed: number };
  };
}

export interface CustomMilestoneData {
  title: string;
  description?: string;
  milestone_type: MilestoneType;
  achieved_at?: string;
  notes?: string;
}

// =====================================================
// Milestone Service Class
// =====================================================

class MilestoneServiceClass {
  /**
   * Calculate child's age in months from birth date
   */
  private calculateAgeInMonths(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    const yearsDiff = now.getFullYear() - birth.getFullYear();
    const monthsDiff = now.getMonth() - birth.getMonth();
    let ageInMonths = yearsDiff * 12 + monthsDiff;
    
    // Adjust if birthday hasn't occurred this month yet
    if (now.getDate() < birth.getDate()) {
      ageInMonths--;
    }
    
    return Math.max(0, ageInMonths);
  }

  /**
   * Get child data by ID
   */
  async getChild(childId: string): Promise<Child | null> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (error) {
      console.error('Error fetching child:', error);
      return null;
    }
    return data;
  }

  /**
   * Get all children for a user
   */
  async getChildrenForUser(userId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('date_of_birth', { ascending: false });

    if (error) {
      console.error('Error fetching children:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Get all active milestone templates
   */
  async getAllTemplates(): Promise<MilestoneTemplate[]> {
    const { data, error } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', true)
      .order('min_age_months', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Get templates appropriate for a child's age
   */
  async getTemplatesForChild(childId: string): Promise<MilestoneTemplate[]> {
    const child = await this.getChild(childId);
    if (!child || !child.date_of_birth) {
      return this.getAllTemplates();
    }

    const ageInMonths = this.calculateAgeInMonths(child.date_of_birth);

    const { data, error } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', true)
      .lte('min_age_months', ageInMonths + 6) // Include upcoming milestones
      .order('min_age_months', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching templates for child:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Get all achieved/tracked milestones for a child
   */
  async getChildMilestones(childId: string): Promise<MilestoneWithTemplate[]> {
    const { data, error } = await supabase
      .from('milestones')
      .select(`
        *,
        template:milestone_templates(*)
      `)
      .eq('child_id', childId)
      .order('achieved_at', { ascending: false });

    if (error) {
      console.error('Error fetching child milestones:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Get milestones organized by section (past, current, upcoming)
   */
  async getMilestonesBySection(childId: string): Promise<MilestonesBySection> {
    const child = await this.getChild(childId);
    if (!child || !child.date_of_birth) {
      return {
        past: [],
        current: [],
        upcoming: [],
        custom: [],
      };
    }

    const ageInMonths = this.calculateAgeInMonths(child.date_of_birth);
    
    // Fetch all templates and achieved milestones in parallel
    const [templates, achievedMilestones] = await Promise.all([
      this.getAllTemplates(),
      this.getChildMilestones(childId),
    ]);

    // Create a map of template_id -> achieved milestone
    const achievedMap = new Map<string, Milestone>();
    const customMilestones: MilestoneWithTemplate[] = [];

    achievedMilestones.forEach(m => {
      if (m.is_custom) {
        customMilestones.push(m);
      } else if (m.template_id) {
        achievedMap.set(m.template_id, m);
      }
    });

    // Categorize templates into past, current, upcoming
    const past: MilestoneTemplateWithStatus[] = [];
    const current: MilestoneTemplateWithStatus[] = [];
    const upcoming: MilestoneTemplateWithStatus[] = [];

    // Define age ranges for categorization
    // Past: milestones where max age is less than current age
    // Current: milestones where age falls within min-max range
    // Upcoming: milestones where min age is greater than current age

    templates.forEach(template => {
      const achieved = achievedMap.get(template.id);
      const templateWithStatus: MilestoneTemplateWithStatus = {
        ...template,
        isCompleted: !!achieved,
        completedAt: achieved?.achieved_at || null,
        milestoneId: achieved?.id || null,
        notes: achieved?.notes || null,
        // Map to expected property names for UI
        category: template.milestone_type as MilestoneType,
        age_min_months: template.min_age_months,
        age_max_months: template.max_age_months,
      };

      if (template.max_age_months < ageInMonths) {
        // Past milestone
        past.push(templateWithStatus);
      } else if (template.min_age_months <= ageInMonths && template.max_age_months >= ageInMonths) {
        // Current milestone (age is within range)
        current.push(templateWithStatus);
      } else if (template.min_age_months > ageInMonths) {
        // Upcoming milestone
        upcoming.push(templateWithStatus);
      }
    });

    return {
      past,
      current,
      upcoming,
      custom: customMilestones,
    };
  }

  /**
   * Mark a milestone template as complete for a child
   */
  async markMilestoneComplete(
    childId: string,
    templateId: string,
    notes?: string
  ): Promise<Milestone | null> {
    // Get template details
    const { data: template, error: templateError } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Error fetching template:', templateError);
      return null;
    }

    const milestoneData: MilestoneInsert = {
      child_id: childId,
      template_id: templateId,
      title: template.title,
      description: template.description,
      milestone_type: template.milestone_type as MilestoneType,
      achieved_at: new Date().toISOString(),
      is_custom: false,
      notes: notes || null,
    };

    const { data, error } = await supabase
      .from('milestones')
      .insert(milestoneData)
      .select()
      .single();

    if (error) {
      console.error('Error marking milestone complete:', error);
      return null;
    }

    // Log activity
    await this.logMilestoneActivity(childId, data.id, 'milestone_completed');

    return data;
  }

  /**
   * Unmark a milestone (remove achievement)
   */
  async unmarkMilestone(milestoneId: string): Promise<boolean> {
    // Get milestone details before deletion for logging
    const { data: milestone } = await supabase
      .from('milestones')
      .select('child_id')
      .eq('id', milestoneId)
      .single();

    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      console.error('Error unmarking milestone:', error);
      return false;
    }

    // Log activity
    if (milestone?.child_id) {
      await this.logMilestoneActivity(milestone.child_id, milestoneId, 'milestone_uncompleted');
    }

    return true;
  }

  /**
   * Add a custom milestone for a child
   */
  async addCustomMilestone(
    childId: string,
    data: CustomMilestoneData
  ): Promise<Milestone | null> {
    const milestoneData: MilestoneInsert = {
      child_id: childId,
      template_id: null,
      title: data.title,
      description: data.description || null,
      milestone_type: data.milestone_type,
      achieved_at: data.achieved_at || new Date().toISOString(),
      is_custom: true,
      notes: data.notes || null,
    };

    const { data: milestone, error } = await supabase
      .from('milestones')
      .insert(milestoneData)
      .select()
      .single();

    if (error) {
      console.error('Error adding custom milestone:', error);
      return null;
    }

    // Log activity
    await this.logMilestoneActivity(childId, milestone.id, 'milestone_completed');

    return milestone;
  }

  /**
   * Update a milestone's notes
   */
  async updateMilestoneNotes(milestoneId: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('milestones')
      .update({ notes })
      .eq('id', milestoneId);

    if (error) {
      console.error('Error updating milestone notes:', error);
      return false;
    }
    return true;
  }

  /**
   * Get milestone progress stats for a child
   */
  async getMilestoneProgress(childId: string): Promise<MilestoneProgress> {
    const sections = await this.getMilestonesBySection(childId);
    
    // Calculate totals from past + current milestones (not upcoming)
    const relevantTemplates = [...sections.past, ...sections.current];
    const total = relevantTemplates.length;
    const completed = relevantTemplates.filter(t => t.isCompleted).length;

    // Calculate by category (use the mapped category field)
    const categories: MilestoneType[] = ['physical', 'cognitive', 'social', 'emotional'];
    const byCategory = {} as MilestoneProgress['byCategory'];

    categories.forEach(cat => {
      const catTemplates = relevantTemplates.filter(t => t.category === cat);
      byCategory[cat] = {
        total: catTemplates.length,
        completed: catTemplates.filter(t => t.isCompleted).length,
      };
    });

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
    };
  }

  /**
   * Get templates filtered by category
   */
  async getTemplatesByCategory(
    childId: string,
    category: MilestoneType | 'all'
  ): Promise<MilestoneTemplateWithStatus[]> {
    const sections = await this.getMilestonesBySection(childId);
    const allTemplates = [
      ...sections.past,
      ...sections.current,
      ...sections.upcoming,
    ];

    if (category === 'all') {
      return allTemplates;
    }

    return allTemplates.filter(t => t.category === category);
  }

  /**
   * Log milestone activity for analytics
   */
  private async logMilestoneActivity(
    childId: string,
    milestoneId: string,
    activityType: 'milestone_completed' | 'milestone_uncompleted'
  ): Promise<void> {
    // Get child's user_id
    const child = await this.getChild(childId);
    if (!child) return;

    await supabase.from('user_activity_log').insert({
      user_id: child.user_id,
      activity_type: activityType,
      milestone_id: milestoneId,
      metadata: { child_id: childId },
    });
  }

  /**
   * Get formatted age range string for display
   */
  getAgeRangeDisplay(ageMinMonths: number, ageMaxMonths: number): string {
    const formatAge = (months: number): string => {
      if (months < 12) {
        return `${months} mo`;
      } else if (months === 12) {
        return '1 year';
      } else if (months < 24) {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years} year`;
      } else {
        const years = Math.floor(months / 12);
        return `${years} years`;
      }
    };

    return `${formatAge(ageMinMonths)} - ${formatAge(ageMaxMonths)}`;
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: MilestoneType): string {
    const names: Record<MilestoneType, string> = {
      physical: 'Physical',
      cognitive: 'Cognitive',
      social: 'Social',
      emotional: 'Communication',
    };
    return names[category] || category;
  }

  /**
   * Get category color for UI
   */
  getCategoryColor(category: MilestoneType): string {
    const colors: Record<MilestoneType, string> = {
      physical: '#E07A5F',
      cognitive: '#81B29A',
      social: '#F2CC8F',
      emotional: '#3D405B',
    };
    return colors[category] || '#6B7280';
  }
}

// Export singleton instance
export const MilestoneService = new MilestoneServiceClass();

