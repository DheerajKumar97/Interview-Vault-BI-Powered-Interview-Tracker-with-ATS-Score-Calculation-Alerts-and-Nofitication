import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Admin Client
const adminSupabaseUrl = process.env.VITE_SUPABASE_URL;
const adminSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(adminSupabaseUrl, adminSupabaseKey);

// Helper to sign OTP
const signOtp = (email, otp, expiresAt) => {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const data = `${email}.${otp}.${expiresAt}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

export const handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, otp, newPassword, token } = JSON.parse(event.body || '{}');

        if (!email || !otp || !newPassword || !token) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email, OTP, new password, and token are required' })
            };
        }

        const { hash, expiresAt } = token;

        if (Date.now() > expiresAt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'OTP has expired' })
            };
        }

        const expectedHash = signOtp(email, otp, expiresAt);

        if (hash !== expectedHash) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid OTP' })
            };
        }

        console.log('✅ OTP Verified for:', email);

        // Get User ID by Email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        if (userError) throw userError;

        const user = userData.users.find(u => u.email === email);

        if (!user) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        // Update Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            throw updateError;
        }

        console.log('✅ Password reset successfully for:', email);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Password reset successfully' })
        };

    } catch (error) {
        console.error('❌ Error resetting password:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to reset password: ' + error.message })
        };
    }
};
