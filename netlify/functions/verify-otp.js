import crypto from 'crypto';

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
        const { email, otp, token } = JSON.parse(event.body || '{}');

        if (!email || !otp || !token) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email, OTP, and token are required' })
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'OTP verified successfully' })
        };
    } catch (error) {
        console.error('❌ Error verifying OTP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to verify OTP' })
        };
    }
};
