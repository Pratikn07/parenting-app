-- Create onboarding_responses table
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    answer JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Add policies
DO $$ BEGIN
    CREATE POLICY "Users can insert their own onboarding responses" 
        ON public.onboarding_responses FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view their own onboarding responses" 
        ON public.onboarding_responses FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id ON public.onboarding_responses(user_id);
