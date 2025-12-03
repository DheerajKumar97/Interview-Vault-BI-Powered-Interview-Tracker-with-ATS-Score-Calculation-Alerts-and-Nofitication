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
        const { email, userId, frequency, dashboardStats, recentApplications } = JSON.parse(event.body || '{}');

        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ Missing SMTP credentials');
            console.error('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
            console.error('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server misconfiguration: Missing SMTP credentials' })
            };
        }

        console.log('📧 Sending Email Digest to:', email);
        console.log('📋 Frequency:', frequency);
        console.log('📊 Dashboard Stats:', JSON.stringify(dashboardStats, null, 2));
        console.log('📝 Recent Applications:', JSON.stringify(recentApplications, null, 2));

        const frequencyLabels = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-Weekly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly'
        };

        // Helper function to get status badge color
        const getStatusBadgeStyle = (status) => {
            const styles = {
                'HR Screening Done': 'background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%); color: white;',
                'Shortlisted': 'background: linear-gradient(135deg, #A855F7 0%, #C084FC 100%); color: white;',
                'Interview Scheduled': 'background: linear-gradient(135deg, #A855F7 0%, #C084FC 100%); color: white;',
                'Interview Rescheduled': 'background: linear-gradient(135deg, #A855F7 0%, #C084FC 100%); color: white;',
                'Selected': 'background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: white;',
                'Offer Released': 'background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: white;',
                'Ghosted': 'background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); color: white;'
            };
            return styles[status] || 'background: #E5E7EB; color: #374151;';
        };

        // Generate KPI cards HTML
        const kpiCards = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 30px 0;">
                <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #A78BFA;">
                    <div style="font-size: 36px; font-weight: 800; color: #6D28D9; margin-bottom: 8px;">${dashboardStats?.totalApplications || 0}</div>
                    <div style="font-size: 12px; color: #7C3AED; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Applications</div>
                </div>
                <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #60A5FA;">
                    <div style="font-size: 36px; font-weight: 800; color: #1E40AF; margin-bottom: 8px;">${dashboardStats?.statusCounts?.['HR Screening Done'] || 0}</div>
                    <div style="font-size: 12px; color: #2563EB; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">HR Screening</div>
                </div>
                <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #A78BFA;">
                    <div style="font-size: 36px; font-weight: 800; color: #6D28D9; margin-bottom: 8px;">${dashboardStats?.statusCounts?.['Shortlisted'] || 0}</div>
                    <div style="font-size: 12px; color: #7C3AED; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Shortlisted</div>
                </div>
                <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #A78BFA;">
                    <div style="font-size: 36px; font-weight: 800; color: #6D28D9; margin-bottom: 8px;">${dashboardStats?.statusCounts?.['Interview Scheduled'] || 0}</div>
                    <div style="font-size: 12px; color: #7C3AED; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Interviews</div>
                </div>
                <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #34D399;">
                    <div style="font-size: 36px; font-weight: 800; color: #065F46; margin-bottom: 8px;">${dashboardStats?.statusCounts?.['Selected'] || 0}</div>
                    <div style="font-size: 12px; color: #047857; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Selected</div>
                </div>
                <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #34D399;">
                    <div style="font-size: 36px; font-weight: 800; color: #065F46; margin-bottom: 8px;">${dashboardStats?.statusCounts?.['Offer Released'] || 0}</div>
                    <div style="font-size: 12px; color: #047857; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Offers</div>
                </div>
            </div>
        `;

        // Generate status distribution table
        const statusRows = Object.entries(dashboardStats?.statusCounts || {})
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => `
                <tr style="border-bottom: 1px solid #E9D5FF;">
                    <td style="padding: 14px 16px; color: #1F2937; font-weight: 600; font-size: 14px;">${status}</td>
                    <td style="padding: 14px 16px; text-align: center;">
                        <span style="${getStatusBadgeStyle(status)} padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block;">
                            ${count}
                        </span>
                    </td>
                    <td style="padding: 14px 16px; text-align: right; color: #6B7280; font-size: 13px; font-weight: 600;">
                        ${((count / (dashboardStats?.totalApplications || 1)) * 100).toFixed(1)}%
                    </td>
                </tr>
            `).join('');

        const statusTable = `
            <div style="margin: 30px 0; overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                            <th style="padding: 16px; text-align: left; color: white; font-weight: 700; font-size: 14px; border-top-left-radius: 12px;">Status</th>
                            <th style="padding: 16px; text-align: center; color: white; font-weight: 700; font-size: 14px;">Count</th>
                            <th style="padding: 16px; text-align: right; color: white; font-weight: 700; font-size: 14px; border-top-right-radius: 12px;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${statusRows || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9CA3AF;">No status data available</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        // Generate company distribution table
        const companyRows = Object.entries(dashboardStats?.companyCounts || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([company, count]) => {
                const details = dashboardStats?.companyDetails?.[company];
                return `
                    <tr style="border-bottom: 1px solid #E9D5FF;">
                        <td style="padding: 14px 16px;">
                            <div style="font-weight: 700; color: #1F2937; font-size: 14px; margin-bottom: 4px;">${company}</div>
                            <div style="font-size: 11px; color: #6B7280;">
                                ${details?.industry || 'N/A'} • ${details?.company_size || 'N/A'}
                            </div>
                        </td>
                        <td style="padding: 14px 16px; text-align: center;">
                            <span style="background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block;">
                                ${count}
                            </span>
                        </td>
                        <td style="padding: 14px 16px; font-size: 12px; color: #6B7280;">
                            ${details?.hr_name || 'N/A'}
                        </td>
                    </tr>
                `;
            }).join('');

        const companyTable = `
            <div style="margin: 30px 0; overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                            <th style="padding: 16px; text-align: left; color: white; font-weight: 700; font-size: 14px; border-top-left-radius: 12px;">Company</th>
                            <th style="padding: 16px; text-align: center; color: white; font-weight: 700; font-size: 14px;">Applications</th>
                            <th style="padding: 16px; text-align: left; color: white; font-weight: 700; font-size: 14px; border-top-right-radius: 12px;">HR Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${companyRows || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9CA3AF;">No company data available</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        // Generate recent applications table
        const recentRows = (recentApplications || [])
            .slice(0, 10)
            .map(app => {
                const companyName = app.companies?.name || app.name || 'N/A';
                const appliedDate = new Date(app.applied_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                return `
                    <tr style="border-bottom: 1px solid #E9D5FF;">
                        <td style="padding: 14px 16px; font-weight: 600; color: #1F2937; font-size: 13px;">${companyName}</td>
                        <td style="padding: 14px 16px; color: #4B5563; font-size: 13px;">${app.job_title || 'N/A'}</td>
                        <td style="padding: 14px 16px; text-align: center;">
                            <span style="${getStatusBadgeStyle(app.current_status)} padding: 5px 12px; border-radius: 16px; font-size: 11px; font-weight: 600; display: inline-block;">
                                ${app.current_status}
                            </span>
                        </td>
                        <td style="padding: 14px 16px; text-align: right; color: #6B7280; font-size: 12px;">${appliedDate}</td>
                    </tr>
                `;
            }).join('');

        const recentTable = `
            <div style="margin: 30px 0; overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                            <th style="padding: 16px; text-align: left; color: white; font-weight: 700; font-size: 14px; border-top-left-radius: 12px;">Company</th>
                            <th style="padding: 16px; text-align: left; color: white; font-weight: 700; font-size: 14px;">Position</th>
                            <th style="padding: 16px; text-align: center; color: white; font-weight: 700; font-size: 14px;">Status</th>
                            <th style="padding: 16px; text-align: right; color: white; font-weight: 700; font-size: 14px; border-top-right-radius: 12px;">Applied Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentRows || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9CA3AF;">No recent applications</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        const mailOptions = {
            from: process.env.SMTP_EMAIL || 'interviewvault2026@gmail.com',
            to: email,
            subject: `📊 Your ${frequencyLabels[frequency] || 'Scheduled'} Interview Vault Digest`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 0; }
                .container { max-width: 700px; margin: 20px auto; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: white; padding: 40px 30px; text-align: center; }
                .logo { width: 280px; height: auto; margin-bottom: 20px; }
                .content { padding: 40px 30px; }
                .footer { background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 30px; text-align: center; font-size: 13px; color: #6B7280; border-top: 3px solid #8B5CF6; }
                .btn { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
                h1 { margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h2 { color: #6D28D9; font-size: 24px; margin-top: 40px; margin-bottom: 20px; font-weight: 800; }
                p { line-height: 1.7; color: #4B5563; font-size: 15px; }
                .highlight { background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%); padding: 20px; border-radius: 12px; border-left: 5px solid #8B5CF6; margin: 25px 0; }
                @media only screen and (max-width: 600px) {
                    .container { margin: 10px; border-radius: 12px; }
                    .content { padding: 20px 15px; }
                    h1 { font-size: 24px; }
                    h2 { font-size: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://raw.githubusercontent.com/DheerajKumar97/Interview-Vault-BI-Powered-Interview-Tracker-with-ATS-Score-Calculation-Alerts-and-Nofitication/main/public/logo.png" alt="Interview Vault" class="logo">
                    <h1>📊 Your ${frequencyLabels[frequency] || 'Scheduled'} Digest</h1>
                    <p style="margin-top: 10px; opacity: 0.95; font-size: 16px;">Application Tracking Summary</p>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Here's your ${frequencyLabels[frequency] ? frequencyLabels[frequency].toLowerCase() : 'scheduled'} summary of your interview applications in <strong>Interview Vault</strong>.</p>
                    
                    <div class="highlight">
                        <strong style="color: #6D28D9; font-size: 16px;">📈 Quick Overview:</strong><br>
                        Track your application progress and stay on top of your job search journey!
                    </div>

                    <h2>📊 Key Metrics</h2>
                    ${kpiCards}

                    <h2>📋 Status Distribution</h2>
                    ${statusTable}

                    <h2>🏢 Top Companies</h2>
                    ${companyTable}

                    <h2>🕒 Recent Applications</h2>
                    ${recentTable}

                    <p style="text-align: center; margin-top: 40px;">
                        <a href="${process.env.FRONTEND_URL || 'https://dheerajkumar-k-interview-vault.netlify.app'}/dashboard" class="btn">View Full Dashboard</a>
                    </p>
                    
                    <p style="margin-top: 35px; font-size: 14px; color: #6B7280; text-align: center;">
                        Questions? Contact us at <a href="mailto:interviewvault.2026@gmail.com" style="color: #8B5CF6; text-decoration: none; font-weight: 600;">interviewvault.2026@gmail.com</a>
                    </p>
                </div>
                <div class="footer">
                    <p><strong>Interview Vault</strong> - Your Job Application Companion</p>
                    <p>&copy; 2025 Interview Vault. All rights reserved.</p>
                    <p>Made by <strong>Dheeraj Kumar K</strong> for Job Seekers</p>
                    <p style="margin-top: 15px; font-size: 12px;">
                        <a href="#" style="color: #8B5CF6; text-decoration: none; margin: 0 10px;">Unsubscribe</a>
                        <a href="#" style="color: #8B5CF6; text-decoration: none; margin: 0 10px;">Preferences</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
        };

        // Send email
        console.log('🔧 Creating email transporter...');
        const transporter = createTransporter();

        console.log('📤 Sending email via nodemailer...');
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email Digest sent successfully!');
        console.log('📬 Message ID:', info.messageId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                messageId: info.messageId,
                message: 'Email digest sent successfully',
            })
        };
    } catch (error) {
        console.error('❌ Error sending email digest:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to send email digest',
                message: error.message,
                errorName: error.name,
                stack: error.stack,
                details: error.toString()
            })
        };
    }
};
