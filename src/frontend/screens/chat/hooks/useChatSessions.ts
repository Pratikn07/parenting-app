import { useCallback, useEffect, useState } from 'react';
import { CHAT_CONFIG } from '@/src/lib/constants';
import { chatService, GroupedSessions } from '@/src/services';
import type { ChatMessage, ChatSession } from '@/src/lib/database.types';
import { isOlderThanHours } from '@/src/lib/dateUtils';
import type { Message } from '../types';

interface UseChatSessionsParams {
  userId: string | undefined;
  hasGuestData: boolean;
  childCount: number;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  createWelcomeMessage: () => Message;
  setMessages: (messages: Message[]) => void;
  clearSelectedImage: () => void;
}

interface UseChatSessionsResult {
  sessions: GroupedSessions;
  isLoadingSessions: boolean;
  loadSessions: () => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleSelectSession: (session: ChatSession) => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
}

const EMPTY_SESSIONS: GroupedSessions = {
  today: [],
  yesterday: [],
  lastWeek: [],
  older: [],
};

export function useChatSessions({
  userId,
  hasGuestData,
  childCount,
  currentSessionId,
  setCurrentSessionId,
  setIsLoadingHistory,
  createWelcomeMessage,
  setMessages,
  clearSelectedImage,
}: UseChatSessionsParams): UseChatSessionsResult {
  const [sessions, setSessions] = useState<GroupedSessions>(EMPTY_SESSIONS);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      setIsLoadingHistory(true);
      try {
        const sessionMessages = await chatService.getSessionMessages(sessionId);
        setCurrentSessionId(sessionId);

        if (sessionMessages.length === 0) {
          if (childCount === 0) {
            setMessages([createWelcomeMessage()]);
          }
        } else {
          const uiMessages: Message[] = sessionMessages.map((msg: ChatMessage) => ({
            id: msg.id,
            text: msg.message,
            isUser: msg.is_from_user,
            timestamp: new Date(msg.created_at),
            imageUrl: msg.image_url || undefined,
          }));
          setMessages(uiMessages);
        }
      } catch (error) {
        console.error('Error loading session messages:', error);
        setMessages([createWelcomeMessage()]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [childCount, createWelcomeMessage, setMessages]
  );

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setIsLoadingSessions(true);
    try {
      const userSessions = await chatService.getSessions(userId);
      setSessions(userSessions);

      const allSessions = [
        ...userSessions.today,
        ...userSessions.yesterday,
        ...userSessions.lastWeek,
        ...userSessions.older,
      ];

      if (allSessions.length > 0) {
        const lastSession = allSessions[0];
        const lastActivity = lastSession.last_message_at || lastSession.started_at;

        // Stale session (>24h) — start fresh; effect will set personalized welcome if a child is selected
        if (isOlderThanHours(lastActivity, CHAT_CONFIG.sessionTimeoutHours)) {
          setMessages([]);
          setIsLoadingHistory(false);
        } else {
          await loadSessionMessages(lastSession.id);
        }
      } else {
        setMessages([]);
        setIsLoadingHistory(false);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessages([createWelcomeMessage()]);
      setIsLoadingHistory(false);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [userId, createWelcomeMessage, setMessages, loadSessionMessages]);

  const handleNewChat = useCallback(async () => {
    if (!userId) return;
    setCurrentSessionId(null);
    setMessages([]);
    clearSelectedImage();

    // If no children, show generic welcome; otherwise the child-aware effect handles it
    if (childCount === 0) {
      setMessages([createWelcomeMessage()]);
    }
  }, [userId, childCount, createWelcomeMessage, setMessages, clearSelectedImage]);

  const handleSelectSession = useCallback(
    async (session: ChatSession) => {
      await loadSessionMessages(session.id);
    },
    [loadSessionMessages]
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return;
      const success = await chatService.deleteSession(sessionId);
      if (success) {
        await loadSessions();
        if (currentSessionId === sessionId) {
          await handleNewChat();
        }
      }
    },
    [userId, currentSessionId, loadSessions, handleNewChat]
  );

  // Auto-load sessions on sign-in; non-guest signed-out users get a generic welcome
  useEffect(() => {
    if (userId) {
      loadSessions();
    } else if (!hasGuestData) {
      setMessages([createWelcomeMessage()]);
      setIsLoadingHistory(false);
    }
  }, [userId, hasGuestData]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessions,
    isLoadingSessions,
    loadSessions,
    loadSessionMessages,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
  };
}
