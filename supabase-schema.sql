-- ============================================================
-- dev27 CMS - Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com → Your Project → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  og_image TEXT,
  views INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts(category_id);

-- ============================================================
-- DOWNLOADS
-- ============================================================
CREATE TABLE IF NOT EXISTS downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  featured_image TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size TEXT,
  file_type TEXT,
  preview_images JSONB DEFAULT '[]',
  timer_enabled BOOLEAN DEFAULT true,
  timer_duration INTEGER DEFAULT 15,
  timer_steps INTEGER DEFAULT 2,
  download_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS downloads_slug_idx ON downloads(slug);
CREATE INDEX IF NOT EXISTS downloads_status_idx ON downloads(status);
CREATE INDEX IF NOT EXISTS downloads_created_at_idx ON downloads(created_at DESC);

-- ============================================================
-- ADS
-- ============================================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  code TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ads_location_idx ON ads(location);

-- ============================================================
-- SETTINGS (Key-Value Store)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('site_name', 'dev27'),
  ('tagline', 'Templates, Themes & Dev Resources'),
  ('site_description', 'Download free website templates, themes, and developer resources from dev27.'),
  ('primary_color', '#4F46E5'),
  ('accent_color', '#06B6D4'),
  ('bg_color', '#FFFFFF'),
  ('text_color', '#0F172A'),
  ('link_color', '#4F46E5'),
  ('dark_primary_color', '#6366F1'),
  ('dark_bg_color', '#0F172A'),
  ('dark_text_color', '#F1F5F9'),
  ('dark_link_color', '#818CF8'),
  ('dark_accent_color', '#22D3EE'),
  ('font_family', 'Inter')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- MENUS
-- ============================================================
CREATE TABLE IF NOT EXISTS menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS menus_location_idx ON menus(location);

-- Insert default menus
INSERT INTO menus (name, location, items) VALUES
  ('Header Menu', 'header', '[
    {"label": "Home", "url": "/"},
    {"label": "Blog", "url": "/category.html"},
    {"label": "Downloads", "url": "/downloads.html"}
  ]'),
  ('Footer Menu', 'footer', '[
    {"label": "Home", "url": "/"},
    {"label": "Blog", "url": "/category.html"},
    {"label": "Downloads", "url": "/downloads.html"},
    {"label": "Privacy Policy", "url": "/privacy.html"}
  ]')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CODE INJECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS code_injections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  name TEXT,
  code TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS code_injections_location_idx ON code_injections(location);

-- Insert placeholder injections
INSERT INTO code_injections (location, name, code, enabled) VALUES
  ('head', 'Head Code', '', true),
  ('body_start', 'Body Start Code', '', true),
  ('body_end', 'Body End Code', '', true),
  ('footer', 'Footer Code', '', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_injections ENABLE ROW LEVEL SECURITY;

-- POSTS: Public can read published posts
CREATE POLICY "Public read published posts" ON posts
  FOR SELECT USING (status = 'published');

-- POSTS: Authenticated users (admins) can do everything
CREATE POLICY "Authenticated users manage posts" ON posts
  FOR ALL USING (auth.role() = 'authenticated');

-- CATEGORIES: Public can read
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- DOWNLOADS: Public can read published
CREATE POLICY "Public read published downloads" ON downloads
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users manage downloads" ON downloads
  FOR ALL USING (auth.role() = 'authenticated');

-- ADS: Public can read enabled ads
CREATE POLICY "Public read enabled ads" ON ads
  FOR SELECT USING (enabled = true);

CREATE POLICY "Authenticated users manage ads" ON ads
  FOR ALL USING (auth.role() = 'authenticated');

-- SETTINGS: Public can read settings
CREATE POLICY "Public read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users manage settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- MENUS: Public can read
CREATE POLICY "Public read menus" ON menus
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users manage menus" ON menus
  FOR ALL USING (auth.role() = 'authenticated');

-- CODE INJECTIONS: Public can read enabled
CREATE POLICY "Public read enabled injections" ON code_injections
  FOR SELECT USING (enabled = true);

CREATE POLICY "Authenticated users manage injections" ON code_injections
  FOR ALL USING (auth.role() = 'authenticated');

-- VIEWS UPDATE: Allow anon to increment post views
CREATE POLICY "Allow anon update views" ON posts
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- DOWNLOADS COUNT: Allow anon to increment download count
CREATE POLICY "Allow anon update download count" ON downloads
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage)
-- ============================================================
-- Create these buckets manually in Supabase Dashboard:
-- 1. "images" bucket - for post & download images (public)
-- 2. "downloads" bucket - for downloadable files (public)
-- Or run the below in SQL editor:

INSERT INTO storage.buckets (id, name, public) VALUES
  ('images', 'images', true),
  ('downloads', 'downloads', true)
ON CONFLICT DO NOTHING;

-- Storage policies: allow public read
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'downloads');

CREATE POLICY "Authenticated upload downloads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'downloads' AND auth.role() = 'authenticated');

-- ============================================================
-- DONE! Next steps:
-- 1. Go to Authentication → Settings → Disable email confirmations (for admin login)
-- 2. Create your admin user in Authentication → Users → Add User
-- 3. Edit js/config.js with your Supabase URL and anon key
-- ============================================================
