-- EMERGENCY FIX FOR 500 ERROR
-- The database trigger is causing the signup to fail.
-- We will remove the trigger and rely on the frontend fallback (Safety Layer 1) 
-- which we verified works correctly.

-- 1. Drop the trigger that is causing the crash
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Ensure user_emails table permissions are correct for the frontend fallback
GRANT ALL ON public.user_emails TO service_role;
GRANT SELECT ON public.user_emails TO anon, authenticated;
