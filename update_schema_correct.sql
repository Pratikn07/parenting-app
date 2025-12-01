-- Migration to fix schema mismatches based on actual database schema
-- Updated to use 'profiles' table (Supabase best practice)

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_focus TEXT,
ADD COLUMN IF NOT EXISTS primary_challenge TEXT;

-- 2. Create chat_sessions table for session management
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
    title TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add missing columns to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Enable RLS on new table
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies for chat_sessions
DO $$ BEGIN
    CREATE POLICY "Users can view their own chat sessions" 
        ON public.chat_sessions FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own chat sessions" 
        ON public.chat_sessions FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own chat sessions" 
        ON public.chat_sessions FOR UPDATE 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own chat sessions" 
        ON public.chat_sessions FOR DELETE 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_child_id ON public.chat_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON public.chat_sessions(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_child_id ON public.chat_messages(child_id);

-- 7. Add trigger for updated_at on chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 8. Verify conversation_summaries table has correct structure (for cross-session memory)
-- Already exists with: id, user_id, child_id, summary_period, topics, key_insights, period_start, period_end
-- This table is correctly set up for cross-session memory!

COMMENT ON TABLE public.chat_sessions IS 'Chat sessions for organizing conversations by time period and child context';
COMMENT ON TABLE public.conversation_summaries IS 'Summaries of conversations for cross-session memory and context';
