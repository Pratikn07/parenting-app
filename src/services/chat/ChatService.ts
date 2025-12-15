import { supabase } from '../../lib/supabase';
import { Child } from '../../lib/database.types';

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_from_user: boolean;
  created_at: string;
  session_id: string | null;
  child_id: string | null;
  image_url: string | null;
  message_type?: 'general' | 'recipe';
}

export interface ChatSession {
  id: string;
  user_id: string;
  child_id: string | null;
  title: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
  is_archived: boolean;
}

export interface ChatResponse {
  id: string;
  message: string;
  response: string;
  createdAt: string;
  sessionId?: string;
  sessionTitle?: string;
  imageUrl?: string;
  memories?: string[];
}

export interface SendMessageResult {
  success: boolean;
  data?: ChatResponse;
  error?: string;
  fallbackResponse?: string;
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

      const sessions = (data || []) as ChatSession[];
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
   * Get messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .or('message_type.is.null,message_type.eq.general') // Only get general messages or null (old messages)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session messages:', error);
        return [];
      }

      return (data || []) as ChatMessage[];
    } catch (err) {
      console.error('Error in getSessionMessages:', err);
      return [];
    }
  }

  /**
   * Delete a session and its messages
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // First delete messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      // Then delete session
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

  // =====================================================
  // CHILD MANAGEMENT
  // =====================================================

  /**
   * Get all children for a user
   */
  async getChildren(userId: string): Promise<Child[]> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .order('birth_date', { ascending: true });

      if (error) {
        console.error('Error fetching children:', error);
        return [];
      }

      return (data || []) as Child[];
    } catch (err) {
      console.error('Error in getChildren:', err);
      return [];
    }
  }

  // =====================================================
  // MESSAGING
  // =====================================================

  /**
   * Send a message to the AI chat
   */
  async sendMessage(
    userId: string,
    message: string,
    childId?: string,
    sessionId?: string,
    imageUrl?: string,
    messageType?: 'general' | 'recipe',
    recipeMode?: 'ingredient' | 'progress'
  ): Promise<SendMessageResult> {
    try {
      const { data, error } = await supabase.functions.invoke(ChatService.EDGE_FUNCTION_URL, {
        body: {
          userId,
          message,
          childId,
          sessionId,
          imageUrl,
          messageType: messageType || 'general',
          recipeMode,  // NEW: Pass recipe mode to backend
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send message',
          fallbackResponse: "I'm having trouble connecting right now. Please try again.",
        };
      }

      if (data?.error) {
        return {
          success: false,
          error: data.error,
          fallbackResponse: data.fallbackResponse || "Something went wrong. Please try again.",
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
   * Get recent chat history for a user
   */
  async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return ((data || []) as ChatMessage[]).reverse();
    } catch (err) {
      console.error('Error in getChatHistory:', err);
      return [];
    }
  }

  /**
   * Clear all chat history for a user
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing history:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in clearHistory:', err);
      return false;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
