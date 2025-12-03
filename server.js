import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import dns from 'dns';
import net from 'net';
import axios from 'axios';
import { checkEmail } from './email_validation.js';
import crypto from 'crypto';

const { promises: dnsPromises } = dns;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Create transporter with Gmail (using working credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'interviewvault2026@gmail.com',
    pass: process.env.SMTP_PASS
  }
});

// Sign In Email
app.post('/api/send-signin-email', async (req, res) => {
  try {
    const { email, fullName, browserInfo, ipAddress, loginTime } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Sending Sign In email to:', email);

    const mailOptions = {
      from: 'interviewvault2026@gmail.com',
      to: email,
      subject: '🔐 New Login to Interview Vault',
      html: `
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
                    <p>Hello ${fullName || 'User'},</p>
                    <p>We detected a new login to your Interview Vault account.</p>
                    
                    <div class="alert-box">
                        <strong>⚠️ Security Alert:</strong> If this wasn't you, please change your password immediately.
                    </div>
                    
                    <h3>Login Details</h3>
                    <table class="info-table">
                        <tr>
                            <td class="info-label">Email:</td>
                            <td>${email}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Time:</td>
                            <td>${loginTime || new Date().toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Browser:</td>
                            <td>${browserInfo || 'Unknown'}</td>
                        </tr>
                        <tr>
                            <td class="info-label">IP Address:</td>
                            <td>${ipAddress || 'Not Available'}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 35px; text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'https://dheerajkumar-k-interview-vault.netlify.app'}/auth/forgot-password" class="btn">Reset Password</a>
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
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Sign In email sent:', info.messageId);
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Sign in email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending sign in email:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Sign Up Email
app.post('/api/send-signup-email', async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Sending Sign Up email to:', email);

    const mailOptions = {
      from: 'interviewvault2026@gmail.com',
      to: email,
      subject: '🎉 Welcome to Interview Vault!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 20px; text-align: center; position: relative; }
                .logo { width: 300px; height: auto; margin-bottom: 25px; }
                .content { padding: 40px 30px; }
                .welcome-text { font-size: 18px; color: #333; line-height: 1.6; text-align: center; margin-bottom: 30px; }
                .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
                .feature-card { background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #eee; }
                .feature-icon { font-size: 24px; margin-bottom: 10px; display: block; }
                .feature-title { font-weight: 700; color: #444; display: block; margin-bottom: 5px; font-size: 14px; }
                .feature-desc { font-size: 12px; color: #666; }
                .btn { display: block; width: 200px; margin: 30px auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 0; border-radius: 50px; text-decoration: none; font-weight: 700; text-align: center; box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4); transition: transform 0.2s; }
                .btn:hover { transform: translateY(-2px); }
                .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eee; }
                h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
                h2 { color: #333; font-size: 20px; margin-top: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://raw.githubusercontent.com/DheerajKumar97/Interview-Vault-BI-Powered-Interview-Tracker-with-ATS-Score-Calculation-Alerts-and-Nofitication/main/public/logo.png" alt="Interview Vault" class="logo">
                    <h1>Welcome Aboard! 🚀</h1>
                    <p style="margin-top: 10px; opacity: 0.9;">Your dream job is just around the corner</p>
                </div>
                <div class="content">
                    <p class="welcome-text">Hi ${fullName || 'Future Achiever'},<br>Thank you for joining <strong>Interview Vault</strong>. We've built the ultimate tool to help you organize, track, and ace your job search.</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${process.env.VITE_APP_URL || 'http://localhost:8080'}" class="btn">Start Tracking Now</a>
                    </div>

                    <h3 style="text-align: center; color: #555;">Everything you need to succeed:</h3>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <span class="feature-icon">📊</span>
                            <span class="feature-title">Track Applications</span>
                            <span class="feature-desc">All your applications in one organized dashboard</span>
                        </div>
                        <div class="feature-card">
                            <span class="feature-icon">📅</span>
                            <span class="feature-title">Schedule Interviews</span>
                            <span class="feature-desc">Never miss a meeting with built-in calendar</span>
                        </div>
                        <div class="feature-card">
                            <span class="feature-icon">📈</span>
                            <span class="feature-title">View Analytics</span>
                            <span class="feature-desc">Visualize your progress and success rate</span>
                        </div>
                        <div class="feature-card">
                            <span class="feature-icon">📝</span>
                            <span class="feature-title">Manage Notes</span>
                            <span class="feature-desc">Keep track of important details and feedback</span>
                        </div>
                    </div>
                    
                    <p style="text-align: center; margin-top: 40px; color: #666;">
                        Need help getting started? <br>
                        Contact us at <a href="mailto:interviewvault.2026@gmail.com" style="color: #667eea; text-decoration: none; font-weight: 600;">interviewvault.2026@gmail.com</a>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Interview Vault. All rights reserved.</p>
                    <p>Made by <strong>Dheeraj Kumar K</strong> for Job Seekers</p>
                    <div style="margin-top: 15px;">
                        <a href="#" style="color: #888; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                        <a href="#" style="color: #888; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Sign Up email sent:', info.messageId);
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending sign up email:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});



// Email Digest Endpoint
app.post('/api/send-digest-email', async (req, res) => {
  try {
    const { email, userId, frequency, dashboardStats, recentApplications } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
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
      from: '"Interview Vault" <interviewvault2026@gmail.com>',
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
                <a href="${process.env.VITE_APP_URL || 'http://localhost:8080'}/dashboard" class="btn">View Full Dashboard</a>
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

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email Digest sent:', info.messageId);
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email digest sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending email digest:', error.message);
    res.status(500).json({
      error: 'Failed to send email digest',
      message: error.message
    });
  }
});

// Initialize Supabase Admin Client
const adminSupabaseUrl = process.env.VITE_SUPABASE_URL;
const adminSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(adminSupabaseUrl, adminSupabaseKey);

// Helper to sign OTP
const signOtp = (email, otp, expiresAt) => {
  const data = `${email}.${otp}.${expiresAt}`;
  return crypto
    .createHmac('sha256', adminSupabaseKey)
    .update(data)
    .digest('hex');
};

// Send OTP Email Endpoint
app.post('/api/send-otp-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const hash = signOtp(email, otp, expiresAt);

    console.log('📧 Sending OTP to:', email);

    const mailOptions = {
      from: '"Interview Vault Security" <interviewvault2026@gmail.com>',
      to: email,
      subject: '🔐 Your Password Reset OTP',
      html: `
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
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);

    // Return token to client
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      token: { hash, expiresAt }
    });
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// Verify OTP Endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp, token } = req.body;

    if (!email || !otp || !token) {
      return res.status(400).json({ error: 'Email, OTP, and token are required' });
    }

    const { hash, expiresAt } = token;

    if (Date.now() > expiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    const expectedHash = signOtp(email, otp, expiresAt);

    if (hash !== expectedHash) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, token } = req.body;

    if (!email || !otp || !newPassword || !token) {
      return res.status(400).json({ error: 'Email, OTP, new password, and token are required' });
    }

    const { hash, expiresAt } = token;

    if (Date.now() > expiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    const expectedHash = signOtp(email, otp, expiresAt);

    if (hash !== expectedHash) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    console.log('✅ OTP Verified for:', email);

    // Get User ID by Email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) throw userError;

    const user = userData.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    res.status(200).json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password: ' + error.message });
  }
});



// ... (existing imports)

// Email Validation Endpoint with DNS and SMTP checks
app.post('/api/validate-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Validating email:', email);

    // Use the centralized validation logic
    const result = await checkEmail(email);

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error validating email:', error.message);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message,
      valid: false,
      mailboxExists: false
    });
  }
});

// Generate Interview Questions Endpoint
app.post('/api/generate-interview-questions', async (req, res) => {
  try {
    const { resumeText, jobDescription, companyName, jobTitle, apiKey, apiType } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Resume text and job description are required' });
    }

    console.log('🤖 Generating interview questions for:', companyName, '-', jobTitle);

    // Parse API keys from environment
    let perplexityKeys = [];
    let geminiKeys = [];
    let huggingfaceKeys = [];

    // If user provided custom keys, use them
    if (apiKey && apiType) {
      if (apiType === 'perplexity') {
        perplexityKeys = [apiKey];
      } else if (apiType === 'gemini') {
        geminiKeys = [apiKey];
      } else if (apiType === 'huggingface') {
        huggingfaceKeys = [apiKey];
      }
    } else {
      // Load Perplexity keys
      if (process.env.PERPLEXITY_API_KEY) {
        try {
          const parsed = JSON.parse(process.env.PERPLEXITY_API_KEY);
          perplexityKeys = Array.isArray(parsed) ? parsed : [process.env.PERPLEXITY_API_KEY];
        } catch (e) {
          perplexityKeys = [process.env.PERPLEXITY_API_KEY];
        }
      }

      // Load Gemini keys
      if (process.env.GEMINI_API_KEY) {
        try {
          const parsed = JSON.parse(process.env.GEMINI_API_KEY);
          geminiKeys = Array.isArray(parsed) ? parsed : [process.env.GEMINI_API_KEY];
        } catch (e) {
          geminiKeys = [process.env.GEMINI_API_KEY];
        }
      }

      // Load HuggingFace keys
      if (process.env.HUGGINGFACE_API_KEY) {
        try {
          const parsed = JSON.parse(process.env.HUGGINGFACE_API_KEY);
          huggingfaceKeys = Array.isArray(parsed) ? parsed : [process.env.HUGGINGFACE_API_KEY];
        } catch (e) {
          huggingfaceKeys = [process.env.HUGGINGFACE_API_KEY];
        }
      }
    }

    if (perplexityKeys.length === 0 && geminiKeys.length === 0 && huggingfaceKeys.length === 0) {
      console.error('❌ No API keys found');
      return res.status(401).json({
        error: 'API keys not configured',
        requiresKey: true
      });
    }

    console.log(`📋 Found ${perplexityKeys.length} Perplexity key(s), ${geminiKeys.length} Gemini key(s), and ${huggingfaceKeys.length} HuggingFace key(s)`);

    const prompt = `You are an expert technical interviewer. Generate 15 highly relevant interview questions with VERY DETAILED answers based on the candidate's resume and job description.

**Candidate's Resume:**
${resumeText}

**Job Description for ${jobTitle} at ${companyName}:**
${jobDescription}

REQUIREMENTS:
- Generate EXACTLY 15 questions
- 80% MUST be practical/technical questions with EXTENSIVE code examples
- 20% can be behavioral questions
- Focus on skills mentioned in resume and job description
- Every technical question MUST include working code examples

ANSWER FORMAT - EACH ANSWER MUST HAVE:
1. Detailed explanation paragraph (5-6 lines)
2. Complete working code example in triple backticks
3. Additional explanation of the code (3-4 lines)
4. Real-world application or best practices (2-3 lines)

QUESTION FORMAT:

1. [Write a specific, practical question here]
Answer:
[Paragraph 1: Detailed explanation of the concept, approach, methodology, and key considerations - 5-6 lines of comprehensive explanation]

[Paragraph 2: Complete working code example with proper formatting]
\`\`\`language
[Complete, executable code here - well-formatted and production-ready]
\`\`\`

[Paragraph 3: Explain what the code does, how it works, and why this approach is used - 3-4 lines]

[Paragraph 4: Real-world applications, best practices, performance considerations, or common pitfalls - 2-3 lines]

CODE FORMATTING RULES - CRITICAL:
- ALWAYS use triple backticks: \`\`\`language
- Specify language: \`\`\`sql, \`\`\`python, \`\`\`javascript, \`\`\`java, etc.
- Write COMPLETE, WORKING code - not snippets
- Include proper indentation and formatting
- Add comments in code where helpful
- Make code production-ready and realistic

EXAMPLE OF PERFECT ANSWER:

1. Write a Python function to find duplicate values in a list and return them with their counts.
Answer:
This problem requires iterating through the list and tracking the frequency of each element. The most efficient approach uses a dictionary (hash map) to store element counts, which provides O(1) lookup time. We can use Python's Counter class from the collections module for a clean implementation, or build our own dictionary solution. The function should handle edge cases like empty lists and return results in a useful format.

\`\`\`python
from collections import Counter

def find_duplicates(input_list):
    # Count occurrences of each element
    element_counts = Counter(input_list)
    
    # Filter elements that appear more than once
    duplicates = {element: count for element, count in element_counts.items() if count > 1}
    
    return duplicates

# Example usage
numbers = [1, 2, 3, 2, 4, 5, 3, 2, 6]
result = find_duplicates(numbers)
print(result)  # Output: {2: 3, 3: 2}
\`\`\`

This code uses Counter to efficiently count all elements in O(n) time complexity. The dictionary comprehension filters only duplicates (count > 1) and returns them with their frequencies. The function is clean, readable, and handles any hashable data type, not just numbers.

In real-world applications, this is useful for data validation, detecting duplicate records in databases, or identifying repeated entries in log files. For very large datasets, consider using pandas or numpy for better performance.

CRITICAL INSTRUCTIONS FOR ALL 15 QUESTIONS:
- Each answer must be 12-15 lines minimum
- EVERY technical question MUST include code in triple backticks
- Code must be complete and executable
- Explain the code thoroughly
- Include real-world context
- For SQL: Write complete queries with JOINs, WHERE clauses, etc.
- For Python: Write complete functions with docstrings
- For JavaScript: Write complete functions with error handling
- For behavioral questions: Use STAR method with specific metrics

Generate all 15 questions now following this exact format. Make answers VERY detailed and comprehensive.`;

    let questions = null;
    let usedProvider = null;
    let usedModel = null;
    let usedApiKey = null;
    let lastError = null;

    // ============================================
    // PHASE 1: TRY ALL PERPLEXITY KEYS
    // ============================================
    if (perplexityKeys.length > 0) {
      console.log('\n🔵 PHASE 1: Trying Perplexity API Keys\n');

      for (let i = 0; i < perplexityKeys.length; i++) {
        const currentKey = perplexityKeys[i].trim();
        const maskedKey = currentKey.substring(0, 8) + '...' + currentKey.substring(currentKey.length - 4);
        console.log(`🔑 [PERPLEXITY ${i + 1}/${perplexityKeys.length}] Trying: ${maskedKey}`);

        try {
          const response = await axios.post('https://api.perplexity.ai/chat/completions', {
            model: 'sonar',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 3072
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentKey}`
            },
            timeout: 80000
          });

          questions = response.data.choices?.[0]?.message?.content;

          if (questions) {
            usedProvider = 'perplexity';
            usedModel = 'sonar';
            usedApiKey = maskedKey;
            console.log(`✅ [PERPLEXITY ${i + 1}/${perplexityKeys.length}] SUCCESS!`);
            console.log(`   🔑 API Key: ${maskedKey}`);
            console.log(`   🤖 Model: sonar`);
            console.log(`   📊 Response length: ${questions.length} chars`);
            console.log(`   🎯 Stopping iteration - Delivering response\n`);
            break;
          } else {
            console.log(`⚠️  [PERPLEXITY ${i + 1}/${perplexityKeys.length}] Empty response\n`);
          }
        } catch (error) {
          lastError = error;
          const status = error.response?.status || 'N/A';
          const errorMsg = error.response?.data?.error || error.message;

          console.error(`❌ [PERPLEXITY ${i + 1}/${perplexityKeys.length}] FAILED`);
          console.error(`   Status: ${status}`);
          console.error(`   Error: ${errorMsg}`);

          if (i < perplexityKeys.length - 1) {
            console.log(`   ⏭️  Trying next Perplexity key...\n`);
          } else {
            console.log(`   ⏭️  All Perplexity keys exhausted\n`);
          }
        }
      }

      if (questions) {
        console.log(`✅ PERPLEXITY PHASE SUCCESS: Delivering response\n`);
      } else {
        console.log(`❌ PERPLEXITY PHASE FAILED: All ${perplexityKeys.length} keys exhausted\n`);
      }
    }

    // ============================================
    // PHASE 2: IF PERPLEXITY FAILED, TRY GEMINI
    // ============================================
    if (!questions && geminiKeys.length > 0) {
      console.log('🟢 PHASE 2: Switching to Gemini API Keys\n');
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

      for (let i = 0; i < geminiKeys.length; i++) {
        const currentKey = geminiKeys[i].trim();
        const maskedKey = currentKey.substring(0, 8) + '...' + currentKey.substring(currentKey.length - 4);
        console.log(`🔑 [GEMINI ${i + 1}/${geminiKeys.length}] Trying: ${maskedKey}`);

        try {
          const response = await axios.post(`${GEMINI_API_URL}?key=${currentKey}`, {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 3072,
            }
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 80000
          });

          questions = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (questions) {
            usedProvider = 'gemini';
            usedModel = 'gemini-2.0-flash-lite';
            usedApiKey = maskedKey;
            console.log(`✅ [GEMINI ${i + 1}/${geminiKeys.length}] SUCCESS!`);
            console.log(`   🔑 API Key: ${maskedKey}`);
            console.log(`   🤖 Model: gemini-2.0-flash-lite`);
            console.log(`   📊 Response length: ${questions.length} chars`);
            console.log(`   🎯 Stopping iteration - Delivering response\n`);
            break;
          } else {
            console.log(`⚠️  [GEMINI ${i + 1}/${geminiKeys.length}] Empty response\n`);
          }
        } catch (error) {
          lastError = error;
          const status = error.response?.status || 'N/A';
          const errorMsg = error.response?.data?.error?.message || error.message;

          console.error(`❌ [GEMINI ${i + 1}/${geminiKeys.length}] FAILED`);
          console.error(`   Status: ${status}`);
          console.error(`   Error: ${errorMsg}`);

          if (i < geminiKeys.length - 1) {
            console.log(`   ⏭️  Trying next Gemini key...\n`);
          } else {
            console.log(`   ⏭️  All Gemini keys exhausted\n`);
          }
        }
      }

      if (questions) {
        console.log(`✅ GEMINI PHASE SUCCESS: Delivering response\n`);
      } else {
        console.log(`❌ GEMINI PHASE FAILED: All ${geminiKeys.length} keys exhausted\n`);
      }
    }

    // ============================================
    // PHASE 3: IF GEMINI FAILED, TRY HUGGINGFACE
    // ============================================
    if (!questions && huggingfaceKeys.length > 0) {
      console.log('🟡 PHASE 3: Switching to HuggingFace API Keys\n');

      const huggingfaceModels = [
        { name: "Qwen 2.5", id: "Qwen/Qwen2.5-72B-Instruct" },
        { name: "Llama 3.1", id: "meta-llama/Llama-3.1-70B-Instruct" }
      ];

      for (let i = 0; i < huggingfaceKeys.length; i++) {
        const currentKey = huggingfaceKeys[i].trim();
        const maskedKey = currentKey.substring(0, 5) + '...' + currentKey.substring(currentKey.length - 4);

        for (const model of huggingfaceModels) {
          console.log(`🔑 [HUGGINGFACE ${i + 1}/${huggingfaceKeys.length}] Key: ${maskedKey} | Model: ${model.name}`);

          try {
            const response = await axios.post(
              `https://api-inference.huggingface.co/models/${model.id}`,
              {
                inputs: prompt,
                parameters: {
                  max_new_tokens: 3072,
                  temperature: 0.7,
                  top_p: 0.95,
                  do_sample: true
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${currentKey}`
                },
                timeout: 60000 // HuggingFace can be slower
              }
            );

            // HuggingFace returns different response formats
            let generatedText = null;

            if (Array.isArray(response.data)) {
              generatedText = response.data[0]?.generated_text;
            } else if (response.data.generated_text) {
              generatedText = response.data.generated_text;
            } else if (typeof response.data === 'string') {
              generatedText = response.data;
            }

            // Remove the prompt from the response if it's included
            if (generatedText && generatedText.includes(prompt)) {
              generatedText = generatedText.replace(prompt, '').trim();
            }

            if (generatedText && generatedText.length > 100) {
              questions = generatedText;
              usedProvider = 'huggingface';
              usedModel = model.name;
              usedApiKey = maskedKey;
              console.log(`✅ [HUGGINGFACE ${i + 1}/${huggingfaceKeys.length}] SUCCESS!`);
              console.log(`   🔑 API Key: ${maskedKey}`);
              console.log(`   🤖 Model: ${model.name} (${model.id})`);
              console.log(`   📊 Response length: ${generatedText.length} chars`);
              console.log(`   🎯 Stopping iteration - Delivering response\n`);
              break;
            } else {
              console.log(`⚠️  [HUGGINGFACE ${i + 1}/${huggingfaceKeys.length}] Empty or short response for ${model.name}\n`);
            }
          } catch (error) {
            lastError = error;
            const status = error.response?.status || 'N/A';
            const errorMsg = error.response?.data?.error || error.message;

            console.error(`❌ [HUGGINGFACE ${i + 1}/${huggingfaceKeys.length}] FAILED - ${model.name}`);
            console.error(`   Status: ${status}`);
            console.error(`   Error: ${errorMsg}`);

            // Check if model is loading
            if (error.response?.data?.error?.includes('loading')) {
              console.log(`   ⏳ Model is loading, trying next model...\n`);
            }
          }
        }

        // Break outer loop if we got questions
        if (questions) break;

        if (i < huggingfaceKeys.length - 1) {
          console.log(`   ⏭️  Trying next HuggingFace key...\n`);
        } else {
          console.log(`   ⏭️  All HuggingFace keys exhausted\n`);
        }
      }

      if (questions) {
        console.log(`✅ HUGGINGFACE PHASE SUCCESS: Delivering response\n`);
      } else {
        console.log(`❌ HUGGINGFACE PHASE FAILED: All ${huggingfaceKeys.length} keys exhausted\n`);
      }
    }

    // ============================================
    // RETURN RESULT OR ERROR
    // ============================================
    if (questions) {
      console.log(`\n✅ ====================================`);
      console.log(`✅ INTERVIEW QUESTIONS GENERATED!`);
      console.log(`✅ ====================================`);
      console.log(`   Provider: ${usedProvider.toUpperCase()}`);
      console.log(`   Model: ${usedModel}`);
      console.log(`   API Key: ${usedApiKey}`);
      console.log(`✅ ====================================\n`);

      return res.status(200).json({
        success: true,
        questions: questions,
        provider: usedProvider,
        model: usedModel,
        apiKey: usedApiKey
      });
    }

    // All keys failed
    const totalKeys = perplexityKeys.length + geminiKeys.length + huggingfaceKeys.length;
    console.error(`\n❌ ====================================`);
    console.error(`❌ ALL ${totalKeys} API KEYS FAILED`);
    console.error(`❌ ====================================`);
    console.error(`   Perplexity: ${perplexityKeys.length} keys tried`);
    console.error(`   Gemini: ${geminiKeys.length} keys tried`);
    console.error(`   HuggingFace: ${huggingfaceKeys.length} keys tried`);
    console.error(`   Last error: ${lastError?.message}`);
    console.error(`❌ ====================================\n`);

    return res.status(500).json({
      error: 'All API keys exhausted. Please provide your own API key.',
      message: lastError?.message || 'Failed to generate interview questions',
      requiresKey: true,
      details: {
        perplexityKeysTried: perplexityKeys.length,
        geminiKeysTried: geminiKeys.length,
        huggingfaceKeysTried: huggingfaceKeys.length,
        totalKeysTried: totalKeys
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in generate-interview-questions:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      requiresKey: false
    });
  }
});


// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔑 Using service role key:', supabaseKey ? 'YES (length: ' + supabaseKey.length + ')' : 'NO');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// TEST: Simple cron job to verify cron is working
cron.schedule('* * * * *', () => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] Cron is working! Current time: ${new Date().toLocaleTimeString()}\n`;

  console.log('🧪 TEST CRON:', logMessage.trim());

  // Write to file
  fs.appendFileSync(path.join(__dirname, 'cron-test.log'), logMessage);
});

// Scheduled Digest Job (Runs every minute to check for due digests)
cron.schedule('* * * * *', async () => {
  console.log('⏰ Checking for scheduled email digests...');
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Format current time as HH:MM:00
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
    console.log(`   Current server time: ${currentTimeString}`);

    // 1. Fetch all active digest preferences
    const { data: preferences, error: prefError } = await supabase
      .from('email_digest_preferences')
      .select('*')
      .eq('is_active', true);

    if (prefError) {
      console.error('❌ Error fetching preferences:', prefError);
      console.error('   Error details:', JSON.stringify(prefError, null, 2));
      return;
    }

    console.log(`   Fetched ${preferences?.length || 0} active preferences.`);
    if (preferences && preferences.length > 0) {
      console.log('   Preferences data:', JSON.stringify(preferences, null, 2));
    } else {
      console.log('   ⚠️  No preferences found. Checking if table has any data...');
      // Try fetching without the is_active filter to see if there's any data at all
      const { data: allPrefs, error: allError } = await supabase
        .from('email_digest_preferences')
        .select('*');
      console.log(`   Total preferences in table: ${allPrefs?.length || 0}`);
      if (allPrefs && allPrefs.length > 0) {
        console.log('   Sample data:', JSON.stringify(allPrefs[0], null, 2));
      }
    }

    if (!preferences || preferences.length === 0) return;

    // 2. Filter for those scheduled NOW
    const duePreferences = preferences.filter(pref => {
      const prefTime = pref.scheduled_time;
      if (!prefTime) return false;

      // Handle potential time formats (HH:MM:00 or HH:MM)
      const [prefHourStr, prefMinuteStr] = prefTime.split(':');
      const prefHour = parseInt(prefHourStr);
      const prefMinute = parseInt(prefMinuteStr);

      const isMatch = prefHour === currentHour && prefMinute === currentMinute;

      // Log match attempts for debugging (only if hour matches to reduce noise)
      if (prefHour === currentHour) {
        console.log(`   Checking match: Pref ${prefTime} vs Current ${currentHour}:${currentMinute} -> ${isMatch}`);
      }

      return isMatch;
    });

    if (duePreferences.length === 0) return;

    console.log(`   Found ${duePreferences.length} digests due for sending.`);

    // 3. Process each due preference
    for (const pref of duePreferences) {
      let email = null;

      // Get email from auth.admin
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(pref.user_id);
        if (!userError && userData?.user) {
          email = userData.user.email;
          console.log(`   ✅ Found email from auth.admin: ${email}`);
        } else {
          console.log(`   ⚠️  auth.admin.getUserById error:`, userError);
        }
      } catch (err) {
        console.log(`   ⚠️  auth.admin.getUserById exception:`, err.message);
      }

      if (!email) {
        console.error(`   ❌ Could not find email for user ${pref.user_id}`);
        continue;
      }

      // Fetch user stats
      const { count: totalApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', pref.user_id);

      console.log(`🚀 Sending scheduled digest to ${email}`);
      await sendDigestEmailInternal(email, pref.frequency, totalApps || 0, pref.user_id);
    }

  } catch (error) {
    console.error('❌ Error in scheduled digest job:', error);
  }
});

async function sendDigestEmailInternal(email, frequency, totalApps, userId) {
  const frequencyLabels = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'bi-weekly': 'Bi-Weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly'
  };

  // Fetch all applications with full details for dashboard stats
  const { data: applications, error: appsError } = await supabase
    .from('applications')
    .select(`
      id,
      current_status,
      job_title,
      applied_date,
      name,
      industry,
      company_size,
      hr_name,
      companies (
        name,
        industry,
        company_size,
        hr_name
      )
    `)
    .eq('user_id', userId)
    .order('applied_date', { ascending: false });

  // Build dashboard stats
  const dashboardStats = {
    totalApplications: applications?.length || 0,
    statusCounts: {},
    companyCounts: {},
    companyDetails: {}
  };

  const recentApplications = applications?.slice(0, 10) || [];

  // Calculate status counts
  applications?.forEach(app => {
    const status = app.current_status;
    dashboardStats.statusCounts[status] = (dashboardStats.statusCounts[status] || 0) + 1;

    // Calculate company counts
    const companyName = app.companies?.name || app.name;
    if (companyName) {
      dashboardStats.companyCounts[companyName] = (dashboardStats.companyCounts[companyName] || 0) + 1;
      if (!dashboardStats.companyDetails[companyName]) {
        dashboardStats.companyDetails[companyName] = {
          industry: app.companies?.industry || app.industry,
          company_size: app.companies?.company_size || app.company_size,
          hr_name: app.companies?.hr_name || app.hr_name
        };
      }
    }
  });

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
    from: '"Interview Vault" <interviewvault2026@gmail.com>',
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
              <a href="${process.env.VITE_APP_URL || 'http://localhost:8080'}/dashboard" class="btn">View Full Dashboard</a>
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

  console.log(`   📧 Sending email to ${email}...`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`   ✅ Email sent successfully! Message ID: ${info.messageId}`);
}

// Gemini Project Suggestions Endpoint
app.post('/api/generate-projects', async (req, res) => {
  try {
    const { jobDescription, companyName, jobTitle, apiKey } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    console.log('🤖 Generating project suggestions for:', companyName, '-', jobTitle);

    // Parse GEMINI_API_KEY from .env - it can be a JSON array or a single string
    let apiKeys = [];

    if (apiKey) {
      // If user provided a custom key, use it first
      apiKeys = [apiKey];
    } else if (process.env.GEMINI_API_KEY) {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(process.env.GEMINI_API_KEY);
        if (Array.isArray(parsed)) {
          apiKeys = parsed;
        } else {
          apiKeys = [process.env.GEMINI_API_KEY];
        }
      } catch (e) {
        // If not JSON, treat as single key
        apiKeys = [process.env.GEMINI_API_KEY];
      }
    }

    if (apiKeys.length === 0) {
      console.error('❌ No GEMINI_API_KEY found');
      return res.status(401).json({
        error: 'Gemini API key not configured',
        requiresKey: true
      });
    }

    console.log(`📋 Found ${apiKeys.length} API key(s) to try`);

    const prompt = `Based on the following job description for ${jobTitle} at ${companyName}, generate 3-5 innovative project ideas that would be impressive for a portfolio and demonstrate the required skills.

For each project, use EXACTLY this format:

1. Project Title: [Full project name here]
Project Description: [2-3 sentence description of what this project does and its purpose]
Key Technologies/Skills Used: [List of technologies]
Why it's impressive for this role: [Explanation of relevance]

2. Project Title: [Full project name here]
Project Description: [2-3 sentence description of what this project does and its purpose]
Key Technologies/Skills Used: [List of technologies]
Why it's impressive for this role: [Explanation of relevance]

IMPORTANT: 
- Start each project with the number and "Project Title:" on one line
- The FIRST line after the title MUST be "Project Description:"
- Then "Key Technologies/Skills Used:"
- Then "Why it's impressive for this role:"
- Separate each project with a blank line
- Do NOT use asterisks, markdown, or special formatting

Job Description:
${jobDescription}`;

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

    // Try each API key in order until one works
    let lastError = null;
    let suggestions = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i].trim();
      console.log(`🔑 Trying API key ${i + 1}/${apiKeys.length}...`);

      try {
        const response = await axios.post(
          `${API_URL}?key=${currentKey}`,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 80000 // 1:20 second timeout
          }
        );

        suggestions = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestions generated';
        console.log(`✅ Success with API key ${i + 1}/${apiKeys.length}`);
        break; // Success! Exit the loop
      } catch (error) {
        lastError = error;
        const status = error.response?.status || 500;
        const errorMsg = error.response?.data?.error?.message || error.message;

        console.log(`❌ API key ${i + 1}/${apiKeys.length} failed (${status}): ${errorMsg}`);

        // If this is the last key, we'll handle the error below
        if (i === apiKeys.length - 1) {
          console.error('❌ All API keys exhausted');
        } else {
          console.log(`⏭️  Trying next API key...`);
        }
      }
    }

    // If we got suggestions, return them
    if (suggestions) {
      console.log('✅ Project suggestions generated successfully');
      return res.status(200).json({
        success: true,
        suggestions: suggestions
      });
    }

    // All keys failed - return error and ask for custom key
    const status = lastError?.response?.status || 500;
    const errorData = lastError?.response?.data || {};

    console.error(`❌ All API keys failed. Last error (${status}):`, JSON.stringify(errorData));

    res.status(status).json({
      error: 'All API keys exhausted. Please provide your own API key.',
      message: lastError?.message || 'Failed to generate project suggestions',
      details: errorData,
      requiresKey: true // Tell frontend to ask for custom key
    });

  } catch (error) {
    console.error('❌ Unexpected error in generate-projects:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      requiresKey: false
    });
  }
});

// Endpoint to update .env file
app.post('/api/update-env', async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // 1. Update process.env immediately for current session
    process.env[key] = value;

    // 2. Update .env file for persistence
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if key exists and replace/append
    const regex = new RegExp(`^${key}\\s*=.*`, 'gm');

    if (regex.test(envContent)) {
      // Replace all occurrences to avoid duplicates
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      // Append if not found
      envContent = envContent.trim() + `\n${key}="${value}"`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(`✅ Updated .env file: ${key}="${value.substring(0, 5)}..."`);

    res.json({ success: true, message: 'Environment variable updated' });

  } catch (error) {
    console.error('❌ Error updating .env:', error);
    res.status(500).json({ error: 'Failed to update environment variable' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/send-signin-email`);
  console.log(`POST http://localhost:${PORT}/api/send-signup-email`);
  console.log(`POST http://localhost:${PORT}/api/send-digest-email`);
  console.log(`⏰ Scheduled digest job initialized`);

  // Test Supabase connection
  console.log('\n🧪 Testing Supabase connection...');
  try {
    const { data, error, count } = await supabase
      .from('email_digest_preferences')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Supabase test query failed:', error);
    } else {
      console.log(`✅ Supabase connection OK. Found ${count} total rows in email_digest_preferences`);
      if (data && data.length > 0) {
        console.log('   Sample row:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Supabase test error:', err);
  }
  console.log('');
});
