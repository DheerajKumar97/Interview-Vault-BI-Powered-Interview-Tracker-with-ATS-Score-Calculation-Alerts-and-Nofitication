-- ============================================================================
-- COMPREHENSIVE USER_EMAILS TABLE FIX
-- ============================================================================
-- This migration ensures the user_emails table is properly configured with
-- triggers, RLS policies, and permissions for duplicate email detection
-- ============================================================================

-- Step 1: Clean up existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Ensure the table exists with correct schema
CREATE TABLE IF NOT EXISTS public.user_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_emails_email_key UNIQUE (email)
);

-- Step 3: Add user_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_emails' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.user_emails 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Enable Row Level Security
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.user_emails;
DROP POLICY IF EXISTS "Allow service_role full access" ON public.user_emails;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.user_emails;

-- Step 6: Create RLS policies
-- Allow anyone to read (needed for duplicate email checking during signup)
CREATE POLICY "Allow public read access" 
ON public.user_emails 
FOR SELECT 
USING (true);

-- Allow service_role full access (for manual inserts from frontend)
CREATE POLICY "Allow service_role full access" 
ON public.user_emails 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to insert their own records
CREATE POLICY "Allow authenticated insert" 
ON public.user_emails 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Step 7: Create the trigger function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert into user_emails table
  -- Use ON CONFLICT to handle cases where manual insert already happened
  BEGIN
    INSERT INTO public.user_emails (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (email) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't block signup
    -- This ensures signup succeeds even if trigger fails
    RAISE WARNING 'Failed to insert into user_emails for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Always return NEW to allow the auth.users insert to succeed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 8: Set function ownership and permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;

-- Step 9: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Grant table permissions
GRANT ALL ON public.user_emails TO postgres, service_role;
GRANT SELECT ON public.user_emails TO anon, authenticated;
GRANT INSERT ON public.user_emails TO authenticated;

-- Step 11: Backfill existing users from auth.users
-- This ensures all existing users have entries in user_emails
INSERT INTO public.user_emails (user_id, email)
SELECT id, email 
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Step 12: Verification queries (run these to verify the setup)
-- Uncomment to run verification:

-- SELECT COUNT(*) as total_auth_users FROM auth.users;
-- SELECT COUNT(*) as total_user_emails FROM public.user_emails;
-- SELECT * FROM pg_policies WHERE tablename = 'user_emails';
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
