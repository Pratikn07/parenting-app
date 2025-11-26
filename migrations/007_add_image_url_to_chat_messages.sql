-- Add image_url column to chat_messages for vision support
-- This migration was applied via Supabase MCP

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.chat_messages.image_url IS 'URL to uploaded image for vision analysis (stored in chat-images bucket)';

