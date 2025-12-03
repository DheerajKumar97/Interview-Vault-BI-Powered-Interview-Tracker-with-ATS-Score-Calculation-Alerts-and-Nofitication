import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
    console.log('=== DIAGNOSTIC REPORT ===\n');

    // 1. Check environment
    console.log('1. Environment Variables:');
    console.log('   URL:', SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('   Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
    console.log('');

    // 2. Check table exists
    console.log('2. Checking user_emails table...');
    const { data: tableData, error: tableError } = await supabaseAdmin
        .from('user_emails')
        .select('count')
        .limit(1);

    if (tableError) {
        console.log('   ERROR:', tableError.message);
        console.log('   CODE:', tableError.code);
        console.log('   ** TABLE DOES NOT EXIST OR NO PERMISSIONS **');
        console.log('   ** YOU MUST RUN THE SQL MIGRATION FIRST **\n');
        return;
    }

    console.log('   Table exists: YES');

    // 3. Check current records
    const { data: records, error: recordsError } = await supabaseAdmin
        .from('user_emails')
        .select('*');

    if (!recordsError) {
        console.log('   Current records:', records.length);
        if (records.length > 0) {
            console.log('   Sample:', records.slice(0, 3).map(r => r.email));
        }
    }
    console.log('');

    // 4. Check auth.users
    console.log('3. Checking auth.users table...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (!usersError) {
        console.log('   Total users in auth.users:', users.users.length);
        console.log('   Sample emails:', users.users.slice(0, 3).map(u => u.email));
    } else {
        console.log('   ERROR:', usersError.message);
    }
    console.log('');

    // 5. Compare counts
    if (!recordsError && !usersError) {
        const userEmailsCount = records.length;
        const authUsersCount = users.users.length;

        console.log('4. Comparison:');
        console.log('   auth.users count:', authUsersCount);
        console.log('   user_emails count:', userEmailsCount);

        if (userEmailsCount < authUsersCount) {
            console.log('   ** MISMATCH DETECTED **');
            console.log('   ** Some users are missing from user_emails table **');
            console.log('   ** This means the trigger is NOT working **\n');
        } else if (userEmailsCount === authUsersCount) {
            console.log('   ** COUNTS MATCH - Trigger appears to be working **\n');
        }
    }

    console.log('=== END DIAGNOSTIC ===');
}

diagnose().catch(console.error);
