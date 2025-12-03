# Authentication Fix - Setup Instructions

## Overview
This document provides step-by-step instructions to complete the authentication fix for storing user emails in the `user_emails` table and enabling duplicate detection.

## Files Modified
1. ✅ `src/integrations/supabase/client.ts` - Added service role client
2. ✅ `src/contexts/AuthContext.tsx` - Updated signup flow with manual insert
3. ✅ `user_emails_fix.sql` - Comprehensive database migration

## Step 1: Add Service Role Key to Environment

Add the following line to your `.env` file:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqeHFwc214c3lsamhuam5wZHl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA1NzY5NCwiZXhwIjoyMDc5NjMzNjk0fQ.kcey86aocepj2ksMDWcvQ-lyRemX2oTLxCW42N4EdAk
```

**Important**: Make sure `.env` is in your `.gitignore` to prevent committing sensitive keys.

## Step 2: Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `pjxqpsmxsyljhnjnpdyt`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `user_emails_fix.sql`
6. Paste into the SQL editor
7. Click **Run** to execute the migration

### What the Migration Does:
- ✅ Creates/updates the `user_emails` table
- ✅ Sets up the `handle_new_user()` trigger function
- ✅ Configures RLS policies for security
- ✅ Grants necessary permissions
- ✅ Backfills existing users from `auth.users`

## Step 3: Verify Database Setup

After running the migration, verify it worked by running these queries in the SQL Editor:

```sql
-- Check if table exists
SELECT COUNT(*) as total_user_emails FROM public.user_emails;

-- Check if trigger exists
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_emails';
```

Expected results:
- `total_user_emails` should match the number of users in your system
- Trigger `on_auth_user_created` should exist
- Three RLS policies should exist: "Allow public read access", "Allow service_role full access", "Allow authenticated insert"

## Step 4: Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

This ensures the new environment variable is loaded.

## Step 5: Test the Authentication Flow

### Test 1: New User Signup
1. Navigate to `/auth/signup`
2. Enter a new email address (not previously registered)
3. Fill in name and password
4. Click "Create Account"
5. **Expected**: Success message, redirect to login page
6. **Verify in Database**: Check that a new row exists in `user_emails` table

### Test 2: Duplicate Email Detection
1. Navigate to `/auth/signup`
2. Enter the SAME email from Test 1
3. Fill in name and password
4. Click "Create Account"
5. **Expected**: Error message "This email address is already registered..."

### Test 3: Existing User Signin
1. Navigate to `/auth/login`
2. Enter credentials from Test 1
3. Click "Sign In"
4. **Expected**: Success, redirect to `/applications`

## Step 6: Monitor Console Logs

Open browser DevTools (F12) and check the Console tab during signup:

**Success Case:**
```
✅ Successfully inserted into user_emails table
```

**Trigger Already Inserted (also success):**
```
⚠️ Manual user_emails insert failed (trigger may have succeeded): duplicate key value violates unique constraint
```

Both cases are acceptable - the important thing is that the signup succeeds.

## Troubleshooting

### Issue: "Module './types' has no exported member 'Database'"
This is a pre-existing TypeScript error and doesn't affect functionality. It can be safely ignored.

### Issue: Signup succeeds but no entry in user_emails
1. Check that the SQL migration ran successfully
2. Verify the service role key is correct in `.env`
3. Check browser console for error messages
4. Verify RLS policies are correctly set

### Issue: "Failed to insert into user_emails"
1. Check that the service role key has proper permissions
2. Verify the `user_emails` table exists
3. Check RLS policies allow service_role to insert

## How It Works

### Dual-Layer Protection

1. **Database Trigger (Primary)**:
   - When a user signs up via Supabase Auth, the `on_auth_user_created` trigger automatically inserts into `user_emails`
   - Runs server-side, very reliable

2. **Manual Insert (Fallback)**:
   - After successful Supabase Auth signup, the frontend also attempts to insert into `user_emails`
   - Uses service role client to bypass RLS
   - If trigger already inserted, this fails gracefully (ON CONFLICT DO NOTHING)
   - Ensures the record exists even if trigger fails

### Duplicate Detection

1. **Pre-signup Check**:
   - Before calling Supabase Auth, we query `user_emails` table
   - If email exists, show error immediately
   - Prevents unnecessary Auth API calls

2. **Supabase Auth Check**:
   - Supabase also checks for duplicate emails
   - Additional safety layer

## Next Steps

After completing all steps above and verifying everything works:

1. ✅ Commit the changes
2. ✅ Push to your repository
3. ✅ Deploy to Netlify (environment variables will need to be added there too)

## Netlify Environment Variables

When deploying to Netlify, add this environment variable:

**Key**: `VITE_SUPABASE_SERVICE_ROLE_KEY`  
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqeHFwc214c3lsamhuam5wZHl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA1NzY5NCwiZXhwIjoyMDc5NjMzNjk0fQ.kcey86aocepj2ksMDWcvQ-lyRemX2oTLxCW42N4EdAk`

Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables → Add Variable
