import nodemailer from 'nodemailer';

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

// Signin email HTML template
const getSignInEmailHTML = (variables) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .logo { width: 240px; height: auto; margin-bottom: 20px; }
            .content { padding: 40px 30px; }
            .alert-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .info-table td { padding: 12px 0; border-bottom: 1px solid #eee; color: #333; }
            .info-label { font-weight: 600; color: #666; width: 100px; }
            .footer { background-color: #f8f9fa; padding: 25px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eee; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25); }
            h1 { margin: 0; font-size: 24px; font-weight: 700; }
            p { line-height: 1.6; color: #444; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://raw.githubusercontent.com/DheerajKumar97/Interview-Vault-BI-Powered-Interview-Tracker-with-ATS-Score-Calculation-Alerts-and-Nofitication/main/public/logo.png" alt="Interview Vault" class="logo">
                <h1>New Login Detected</h1>
            </div>
            <div class="content">
                <p>Hello ${variables.fullName || 'User'},</p>
                <p>We detected a new login to your Interview Vault account.</p>
                
                <div class="alert-box">
                    <strong>⚠️ Security Alert:</strong> If this wasn't you, please change your password immediately.
                </div>
                
                <h3>Login Details</h3>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Email:</td>
                        <td>${variables.email}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Time:</td>
                        <td>${variables.loginTime}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Browser:</td>
                        <td>${variables.browserInfo}</td>
                    </tr>
                    <tr>
                        <td class="info-label">IP Address:</td>
                        <td>${variables.ipAddress}</td>
                    </tr>
                </table>
                
                <p style="margin-top: 35px; text-align: center;">
                    <a href="${variables.resetPasswordURL}" class="btn">Reset Password</a>
                </p>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666;">Questions? Contact us at <a href="mailto:interviewvault.2026@gmail.com" style="color: #667eea; text-decoration: none;">interviewvault.2026@gmail.com</a></p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Interview Vault. All rights reserved.</p>
                <p>Made by <strong>Dheeraj Kumar K</strong> for Job Seekers</p>
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
    const { email, loginTime, browserInfo, ipAddress, fullName } = JSON.parse(event.body || '{}');

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

    console.log('📧 Sending Sign In email to:', email);

    const variables = {
      email: email,
      fullName: fullName || 'User',
      loginTime: loginTime || new Date().toLocaleString(),
      browserInfo: browserInfo || 'Unknown',
      ipAddress: ipAddress || 'Not Available',
      resetPasswordURL: `${process.env.VITE_APP_URL || 'https://dheerajkumar-k-interview-vault.netlify.app'}/auth/forgot-password`,
    };

    const htmlContent = getSignInEmailHTML(variables);

    // Send email
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL || 'interviewvault.2026@gmail.com',
      to: email,
      subject: '🔐 New Login to Interview Vault',
      html: htmlContent,
    });

    console.log('✅ Sign In email sent:', info.messageId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId: info.messageId,
        message: 'Sign in email sent successfully',
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
