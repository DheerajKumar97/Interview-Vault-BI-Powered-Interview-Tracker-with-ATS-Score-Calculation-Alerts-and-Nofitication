import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'interviewvault2026@gmail.com',
        pass: process.env.SMTP_PASS
    }
});

async function verify() {
    console.log('Testing SMTP Connection...');
    console.log('User:', process.env.SMTP_USER || 'interviewvault2026@gmail.com');
    console.log('Pass:', process.env.SMTP_PASS ? '****' : 'MISSING');

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error.message);
    }
}

verify();
