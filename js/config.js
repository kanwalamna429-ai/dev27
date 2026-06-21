// dev27 CMS - Supabase Configuration
// Replace these values with your actual Supabase project credentials
// Go to: https://app.supabase.com → Your Project → Settings → API

const DEV27_CONFIG = {
  supabaseUrl: 'https://gykzewkfdlquyldioxch.supabase.co',       // e.g. https://xxxx.supabase.co
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3pld2tmZGxxdXlsZGlveGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjg4NzgsImV4cCI6MjA5NzY0NDg3OH0.ORWcpgESAQ3C19pHHiotDOzvyjDghkX6WTir77v6cGo', // Your project anon/public key
  siteName: 'dev27',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
  adminPath: '/admin/',
  version: '1.0.0'
};

// Detect if config is set
const isConfigured = () => {
  return DEV27_CONFIG.supabaseUrl !== 'https://gykzewkfdlquyldioxch.supabase.co' &&
    DEV27_CONFIG.supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3pld2tmZGxxdXlsZGlveGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjg4NzgsImV4cCI6MjA5NzY0NDg3OH0.ORWcpgESAQ3C19pHHiotDOzvyjDghkX6WTir77v6cGo';
};
