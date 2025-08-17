-- Example: Adding a new "appointments" table
-- This file shows how to add new tables using the Python script

-- Create appointments table (user-scoped)
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    baby_id uuid NULL REFERENCES public.babies(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    appointment_type text NOT NULL CHECK (appointment_type IN ('checkup', 'vaccination', 'specialist', 'emergency')),
    scheduled_at timestamptz NOT NULL,
    duration_minutes int DEFAULT 30,
    location text,
    provider_name text,
    provider_contact jsonb,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    notes text,
    reminder_sent boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_scheduled ON public.appointments (user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_baby_scheduled ON public.appointments (baby_id, scheduled_at) WHERE baby_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled ON public.appointments (status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments (appointment_type);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "own rows - appointments" ON public.appointments;
CREATE POLICY "own rows - appointments" ON public.appointments 
FOR ALL USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "service role all - appointments" ON public.appointments 
FOR ALL USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Create RPC function to get upcoming appointments
CREATE OR REPLACE FUNCTION public.get_upcoming_appointments(
    user_id uuid,
    days_ahead int DEFAULT 30
)
RETURNS SETOF public.appointments
LANGUAGE sql
STABLE
AS $$
SELECT a.*
FROM public.appointments a
WHERE a.user_id = user_id
AND a.status IN ('scheduled', 'confirmed')
AND a.scheduled_at BETWEEN now() AND (now() + INTERVAL '1 day' * days_ahead)
ORDER BY a.scheduled_at ASC;
$$;

COMMENT ON FUNCTION public.get_upcoming_appointments IS 'Get upcoming appointments for a user within specified days';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
