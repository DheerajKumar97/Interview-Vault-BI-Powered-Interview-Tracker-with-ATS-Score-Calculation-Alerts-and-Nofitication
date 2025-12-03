import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('=== DEBUGGING MANUAL INSERT ===');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.length : 'MISSING');

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ FATAL: VITE_SUPABASE_SERVICE_ROLE_KEY is missing from .env');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testInsert() {
    console.log('\n1. Fetching a real user from auth.users...');
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError || !users || users.length === 0) {
        console.error('❌ Could not fetch users:', userError);
        return;
    }

    const realUser = users[0];
    console.log(`   Found user: ${realUser.email} (${realUser.id})`);

    const testEmail = realUser.email; // Use their actual email
    const testUserId = realUser.id;

    console.log(`\n2. Attempting to insert into user_emails for this user...`);

    const { data, error } = await supabaseAdmin
        .from('user_emails')
        .insert({
            user_id: testUserId,
            email: testEmail
        })
        .select();

    if (error) {
        console.error('❌ INSERT FAILED:', error);
        if (error.code === '23505') {
            console.log('   -> Duplicate key error. This means the record ALREADY EXISTS.');
            console.log('   -> This is GOOD! It means inserts are working (or worked previously).');
        } else if (error.code === '42501') {
            console.error('   -> Permission denied. Check RLS policies.');
        }
    } else {
        console.log('✅ INSERT SUCCESS:', data);
    }
}

testInsert();
