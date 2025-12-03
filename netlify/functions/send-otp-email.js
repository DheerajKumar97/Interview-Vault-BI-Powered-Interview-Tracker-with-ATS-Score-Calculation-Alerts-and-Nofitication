import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter with Gmail (using App Password)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Helper to sign OTP
const signOtp = (email, otp, expiresAt) => {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const data = `${email}.${otp}.${expiresAt}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// OTP email HTML template
const getOtpEmailHTML = (otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 500px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 5px; color: #667eea; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px dashed #667eea; margin: 20px 0; display: inline-block; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You requested to reset your password. Use the code below to proceed:</p>
                
                <div class="otp-code">${otp}</div>
                
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Interview Vault Security</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Main handler
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
        const { email } = JSON.parse(event.body || '{}');

        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ Missing SMTP credentials');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server misconfiguration: Missing SMTP credentials' })
            };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        const hash = signOtp(email, otp, expiresAt);

        console.log('📧 Sending OTP email to:', email);

        const htmlContent = getOtpEmailHTML(otp);

        // Send email
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: process.env.SMTP_EMAIL || 'interviewvault.2026@gmail.com',
            to: email,
            subject: '🔐 Your Password Reset OTP',
            html: htmlContent,
        });

        console.log('✅ OTP email sent:', info.messageId);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                messageId: info.messageId,
                message: 'OTP email sent successfully',
                token: { hash, expiresAt }
            })
        };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to send email',
                message: error.message,
            })
        };
    }
};
