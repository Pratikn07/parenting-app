-- =====================================================
-- CHAT SESSIONS TABLE
-- Groups messages into conversations
-- =====================================================

-- Add missing columns to chat_sessions
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add session_id to chat_messages if not exists
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON public.chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

