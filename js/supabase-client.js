// dev27 CMS - Supabase Client
// Requires: config.js loaded before this file

let supabaseClient = null;

const initSupabase = () => {
  if (supabaseClient) return supabaseClient;
  if (!isConfigured()) {
    console.warn('dev27: Supabase not configured. Edit js/config.js');
    return null;
  }
  supabaseClient = supabase.createClient(
    DEV27_CONFIG.supabaseUrl,
    DEV27_CONFIG.supabaseAnonKey
  );
  return supabaseClient;
};

const getSupabase = () => {
  if (!supabaseClient) initSupabase();
  return supabaseClient;
};

// Helper: upload file to Supabase Storage
const uploadFile = async (bucket, path, file) => {
  const sb = getSupabase();
  if (!sb) return { error: 'Not configured' };
  const { data, error } = await sb.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true
  });
  if (error) return { error };
  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
  return { url: urlData.publicUrl };
};

// Helper: get public URL for storage file
const getPublicUrl = (bucket, path) => {
  const sb = getSupabase();
  if (!sb || !path) return '';
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof supabase !== 'undefined') {
    initSupabase();
  } else {
    console.warn('dev27: Supabase JS library not loaded');
  }
});
