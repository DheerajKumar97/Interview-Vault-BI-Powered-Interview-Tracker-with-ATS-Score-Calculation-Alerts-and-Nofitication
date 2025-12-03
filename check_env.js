import dotenv from 'dotenv';
dotenv.config();

console.log('Checking Environment Variables...');
console.log('SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing');
