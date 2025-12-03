// Test script to verify user_emails insert functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing user_emails insert functionality...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- VITE_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testUserEmailsTable() {
    try {
        console.log('1️⃣ Testing connection to user_emails table...');

        // Check if table exists and we can read from it
        const { data: existingRecords, error: selectError } = await supabaseAdmin
            .from('user_emails')
            .select('*')
            .limit(5);

        if (selectError) {
            console.error('❌ Error reading from user_emails table:', selectError.message);
            console.error('   Details:', selectError);
            return;
        }

        console.log('✅ Successfully connected to user_emails table');
        console.log(`   Found ${existingRecords?.length || 0} existing records\n`);

        // Try to insert a test record
        console.log('2️⃣ Testing insert into user_emails table...');

        const testEmail = `test_${Date.now()}@example.com`;
        const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID for testing

        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('user_emails')
            .insert({
                user_id: testUserId,
                email: testEmail
            })
            .select();

        if (insertError) {
            console.error('❌ Error inserting into user_emails table:', insertError.message);
            console.error('   Code:', insertError.code);
            console.error('   Details:', insertError.details);
            console.error('   Hint:', insertError.hint);

            // Check if it's a foreign key constraint error
            if (insertError.code === '23503') {
                console.log('\n⚠️  Foreign key constraint error detected!');
                console.log('   This means the user_id must exist in auth.users table');
                console.log('   During real signup, this should work because the user is created first\n');
            }

            return;
        }

        console.log('✅ Successfully inserted test record:', insertData);

        // Clean up test record
        console.log('\n3️⃣ Cleaning up test record...');
        const { error: deleteError } = await supabaseAdmin
            .from('user_emails')
            .delete()
            .eq('email', testEmail);

        if (deleteError) {
            console.error('⚠️  Could not delete test record:', deleteError.message);
        } else {
            console.log('✅ Test record cleaned up');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

async function checkTrigger() {
    console.log('\n4️⃣ Checking database trigger...');

    try {
        const { data, error } = await supabaseAdmin
            .rpc('pg_get_triggerdef', { trigger_oid: 'on_auth_user_created' })
            .single();

        if (error) {
            console.log('⚠️  Could not verify trigger (this is normal, requires special permissions)');
        } else {
            console.log('✅ Trigger exists:', data);
        }
    } catch (error) {
        console.log('⚠️  Could not verify trigger (this is normal, requires special permissions)');
    }
}

async function checkRLSPolicies() {
    console.log('\n5️⃣ Checking RLS policies...');

    try {
        const { data, error } = await supabaseAdmin
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'user_emails');

        if (error) {
            console.log('⚠️  Could not verify RLS policies:', error.message);
        } else {
            console.log('✅ Found', data?.length || 0, 'RLS policies');
            if (data && data.length > 0) {
                data.forEach(policy => {
                    console.log(`   - ${policy.policyname}`);
                });
            }
        }
    } catch (error) {
        console.log('⚠️  Could not verify RLS policies');
    }
}

// Run all tests
(async () => {
    await testUserEmailsTable();
    await checkTrigger();
    await checkRLSPolicies();

    console.log('\n✅ Test complete!\n');
    process.exit(0);
})();
