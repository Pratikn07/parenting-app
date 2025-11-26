import { supabase } from '../../lib/supabase';
import { ChatMessage, Child, ChatSession } from '../../lib/database.types';

export interface ChatResponse {
  id: string;
  message: string;
  response: string;
  createdAt: string;
  sessionId?: string;
  sessionTitle?: string;
  imageUrl?: string;
  memories?: string[]; // New memories extracted from this conversation
}

export interface SendMessageResult {
  success: boolean;
  data?: ChatResponse;
  error?: string;
  fallbackResponse?: string;
}

export interface ChildMemory {
  id: string;
  child_id: string;
  memory_text: string;
  category: string | null;
  importance: number;
  created_at: string;
}

export interface GroupedSessions {
  today: ChatSession[];
  yesterday: ChatSession[];
  lastWeek: ChatSession[];
  older: ChatSession[];
}

/**
 * Service for handling AI chat interactions with child context
 */
export class ChatService {
  private static EDGE_FUNCTION_URL = 'chat';

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  /**
   * Get all sessions for a user, grouped by date
   */
  async getSessions(userId: string): Promise<GroupedSessions> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return { today: [], yesterday: [], lastWeek: [], older: [] };
      }

      const sessions = data || [];
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const weekAgoStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        today: sessions.filter(s => new Date(s.last_message_at || s.started_at) >= todayStart),
        yesterday: sessions.filter(s => {
          const date = new Date(s.last_message_at || s.started_at);
          return date >= yesterdayStart && date < todayStart;
        }),
        lastWeek: sessions.filter(s => {
          const date = new Date(s.last_message_at || s.started_at);
          return date >= weekAgoStart && date < yesterdayStart;
        }),
        older: sessions.filter(s => new Date(s.last_message_at || s.started_at) < weekAgoStart),
      };
    } catch (err) {
      console.error('Error in getSessions:', err);
      return { today: [], yesterday: [], lastWeek: [], older: [] };
    }
  }

  /**
   * Get or create an active session for a user/child
   */
  async getOrCreateSession(userId: string, childId?: string): Promise<ChatSession | null> {
    try {
      // Look for a recent session (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .gte('last_message_at', oneHourAgo)
        .order('last_message_at', { ascending: false })
        .limit(1);

      if (childId) {
        query = query.eq('child_id', childId);
      }

      const { data: existingSessions, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching session:', fetchError);
        return null;
      }

      if (existingSessions && existingSessions.length > 0) {
        return existingSessions[0];
      }

      // Create new session
      return await this.startNewSession(userId, childId);
    } catch (err) {
      console.error('Error in getOrCreateSession:', err);
      return null;
    }
  }

  /**
   * Start a new chat session
   */
  async startNewSession(userId: string, childId?: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          child_id: childId || null,
          started_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          message_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in startNewSession:', err);
      return null;
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getSession:', err);
      return null;
    }
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session messages:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getSessionMessages:', err);
      return [];
    }
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session title:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in updateSessionTitle:', err);
      return false;
    }
  }

  /**
   * Delete a session and its messages
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Messages will be cascade deleted due to FK constraint
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in deleteSession:', err);
      return false;
    }
  }

  /**
   * Archive a session instead of deleting
   */
  async archiveSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: true })
        .eq('id', sessionId);

      if (error) {
        console.error('Error archiving session:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in archiveSession:', err);
      return false;
    }
  }

  // =====================================================
  // MESSAGING
  // =====================================================

  /**
   * Send a message to the AI assistant with optional child context and session
   */
  async sendMessage(
    userId: string, 
    message: string, 
    childId?: string,
    sessionId?: string,
    imageUrl?: string
  ): Promise<SendMessageResult> {
    try {
      const { data, error } = await supabase.functions.invoke(ChatService.EDGE_FUNCTION_URL, {
        body: {
          userId,
          message,
          childId, // Pass selected child for context
          sessionId, // Pass session for conversation grouping
          imageUrl, // Pass image URL for vision analysis
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send message',
          fallbackResponse: "I'm having trouble connecting right now. Please try again in a moment.",
        };
      }

      // Check if response contains an error with fallback
      if (data.error) {
        return {
          success: false,
          error: data.error,
          fallbackResponse: data.fallbackResponse || "Something went wrong. Let me try that again.",
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          message: data.message,
          response: data.response,
          createdAt: data.createdAt,
          sessionId: data.sessionId,
          sessionTitle: data.sessionTitle,
          imageUrl: data.imageUrl,
          memories: data.memories,
        },
      };
    } catch (err) {
      console.error('Chat service error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        fallbackResponse: "I'm having trouble right now. Please try again shortly.",
      };
    }
  }

  /**
   * Get all children for a user
   */
  async getChildren(userId: string): Promise<Child[]> {
    try {
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
    } catch (err) {
      console.error('Error in getChildren:', err);
      return [];
    }
  }

  /**
   * Get memories for a specific child
   */
  async getChildMemories(childId: string, limit: number = 20): Promise<ChildMemory[]> {
    try {
      const { data, error } = await supabase
        .from('child_memories')
        .select('*')
        .eq('child_id', childId)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching child memories:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getChildMemories:', err);
      return [];
    }
  }

  /**
   * Add a memory for a child
   */
  async addChildMemory(
    childId: string,
    userId: string,
    memoryText: string,
    category?: string,
    importance: number = 1
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('child_memories')
        .insert({
          child_id: childId,
          user_id: userId,
          memory_text: memoryText,
          category,
          importance,
        });

      if (error) {
        console.error('Error adding child memory:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in addChildMemory:', err);
      return false;
    }
  }

  /**
   * Get chat history for a user, optionally filtered by child
   */
  async getChatHistory(userId: string, childId?: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (childId) {
        query = query.eq('child_id', childId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getChatHistory:', err);
      return [];
    }
  }

  /**
   * Get recent messages (for display on screen load)
   */
  async getRecentMessages(userId: string, limit: number = 20): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent messages:', error);
        return [];
      }

      // Reverse to get chronological order
      return (data || []).reverse();
    } catch (err) {
      console.error('Error in getRecentMessages:', err);
      return [];
    }
  }

  /**
   * Clear chat history for a user
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing chat history:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in clearHistory:', err);
      return false;
    }
  }

  /**
   * Get message count for a user
   */
  async getMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting message count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error in getMessageCount:', err);
      return 0;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
