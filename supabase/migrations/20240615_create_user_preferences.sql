-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- This will store the Clerk user ID
  dashboard_visibility JSONB NOT NULL DEFAULT '{"liveMetrics": true, "networkStats": true, "lightningNetwork": true, "whaleAndSentiment": true, "aiAndNews": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies but make them more permissive for Clerk integration
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access via the anon key (since we're using Clerk for auth)
CREATE POLICY "Allow read access for anon" 
  ON public.user_preferences 
  FOR SELECT 
  TO anon 
  USING (true);

-- Policy to allow insert access via the anon key
CREATE POLICY "Allow insert access for anon" 
  ON public.user_preferences 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Policy to allow update access via the anon key
CREATE POLICY "Allow update access for anon" 
  ON public.user_preferences 
  FOR UPDATE 
  TO anon 
  USING (true);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences (user_id);

-- Execute this in Supabase SQL Editor or use migrations for managed environments
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences for the application, linked to Clerk user IDs'; 