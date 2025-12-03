import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function backfill() {
    console.log('🔄 Starting backfill process...');

    // 1. Get all users from auth.users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
        console.error('❌ Error fetching users:', usersError.message);
        return;
    }

    console.log(`found ${users.length} users in auth.users`);

    // 2. Get existing emails in user_emails
    const { data: existingRecords, error: recordsError } = await supabaseAdmin
        .from('user_emails')
        .select('email');

    if (recordsError) {
        console.error('❌ Error fetching user_emails:', recordsError.message);
        // If table doesn't exist, we can't do anything from here
        if (recordsError.code === '42P01') { // undefined_table
            console.error('🚨 Table user_emails does not exist! You MUST run the SQL migration.');
        }
        return;
    }

    const existingEmails = new Set(existingRecords.map(r => r.email));
    console.log(`found ${existingEmails.size} existing records in user_emails`);

    // 3. Insert missing users
    let insertedCount = 0;
    let errorCount = 0;

    for (const user of users) {
        if (user.email && !existingEmails.has(user.email)) {
            console.log(`   Processing ${user.email}...`);

            const { error: insertError } = await supabaseAdmin
                .from('user_emails')
                .insert({
                    user_id: user.id,
                    email: user.email,
                    created_at: user.created_at
                });

            if (insertError) {
                console.error(`   ❌ Failed to insert ${user.email}:`, insertError.message);
                errorCount++;
            } else {
                console.log(`   ✅ Inserted ${user.email}`);
                insertedCount++;
            }
        }
    }

    console.log('\n=== BACKFILL COMPLETE ===');
    console.log(`✅ Successfully inserted: ${insertedCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errorCount > 0) {
        console.log('\n⚠️ Some inserts failed. This might be due to RLS policies.');
        console.log('   Please make sure you have run the SQL migration script!');
    }
}

backfill().catch(console.error);
