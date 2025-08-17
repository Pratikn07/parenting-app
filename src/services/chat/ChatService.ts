// Chat Service for AI-powered conversations
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  suggestions?: string[];
}

class ChatServiceClass {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Get token from AuthService or storage
    const token = await this.getStoredToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async getStoredToken(): Promise<string | null> {
    // TODO: Implement token retrieval from secure storage
    // For now, get from AuthService if available
    return null;
  }

  async sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/message`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const data = await response.json();
      return {
        response: data.response,
        conversationId: data.conversation_id,
        suggestions: data.suggestions,
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  async getChatHistory(conversationId?: string): Promise<ChatMessage[]> {
    try {
      const url = conversationId 
        ? `${this.baseUrl}/api/chat/history?conversation_id=${conversationId}`
        : `${this.baseUrl}/api/chat/history`;

      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get chat history');
      }

      const data = await response.json();
      return data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.timestamp),
        conversationId: msg.conversation_id,
      }));
    } catch (error) {
      console.error('Chat history error:', error);
      throw error;
    }
  }

  async getConversations(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/conversations`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Conversations error:', error);
      throw error;
    }
  }
}

export const ChatService = new ChatServiceClass();
