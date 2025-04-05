# Setting Up Clerk with Supabase Integration

This guide explains how to set up the integration between Clerk (authentication) and Supabase (database) to store user preferences.

## Overview

- Clerk handles user authentication and identity
- Supabase stores user-specific data (preferences, settings, etc.)
- The Clerk user ID is used as a foreign key in Supabase tables

## Setup Steps

### 1. Install Required Packages

The required packages are already in the project:

- `@clerk/clerk-react` for authentication
- `@supabase/supabase-js` for database operations

### 2. Create the User Preferences Table in Supabase

Run the SQL script in `supabase/migrations/20240615_create_user_preferences.sql` in your Supabase SQL Editor:

```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- This will store the Clerk user ID
  dashboard_visibility JSONB NOT NULL DEFAULT '{"liveMetrics": true, "networkStats": true, "lightningNetwork": true, "whaleAndSentiment": true, "aiAndNews": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own preferences
CREATE POLICY "Users can read their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy to allow users to insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy to allow users to update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences (user_id);
```

### 3. Configure Token Synchronization (Optional for Enhanced Security)

For enhanced security, set up Clerk webhook to synchronize user IDs with Supabase authentication:

1. Create a Clerk webhook that triggers on user creation
2. In the webhook, make an API call to your backend
3. Your backend then creates a Supabase user with the same ID as the Clerk user

This step is optional if you're using the Clerk ID as a foreign key in Supabase tables without leveraging Supabase Auth.

### 4. Environment Variables

Ensure these environment variables are set in your `.env` file:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_SECRET_KEY=your_clerk_secret_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

1. When a user authenticates with Clerk, we get their unique user ID
2. This ID is used to:

   - Fetch user preferences from Supabase
   - Save user preferences to Supabase
   - Query any user-specific data

3. The code in `src/lib/userPreferences.ts` handles:
   - Fetching preferences with `getUserPreferences(userId)`
   - Saving preferences with `saveUserPreferences(userId, preferences)`

## Troubleshooting

- **RLS Policy Issues**: Make sure RLS policies are correctly set up to allow access to only the user's own data
- **Clerk User ID**: Ensure you're correctly accessing the Clerk user ID with `user.id`
- **Cross-Origin Issues**: Verify CORS is properly configured in your Supabase project settings

## Extending the Integration

To store additional user data:

1. Add more fields to the `user_preferences` table or create additional tables
2. Update the `UserPreferences` interface in `src/lib/userPreferences.ts`
3. Add fetch/save functions for the new data structures

## Security Considerations

- Never expose Supabase service role key in client-side code
- Use RLS policies to restrict data access
- Consider implementing JWTs or webhook integration for a more robust security model
