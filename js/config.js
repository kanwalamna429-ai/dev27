// dev27 CMS - Supabase Configuration
// Replace these values with your actual Supabase project credentials
// Go to: https://app.supabase.com → Your Project → Settings → API

const DEV27_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_URL',       // e.g. https://xxxx.supabase.co
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY', // Your project anon/public key
  siteName: 'dev27',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
  adminPath: '/admin/',
  version: '1.0.0'
};

// Detect if config is set
const isConfigured = () => {
  return DEV27_CONFIG.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
    DEV27_CONFIG.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';
};
