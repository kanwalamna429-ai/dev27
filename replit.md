# dev27 CMS

A complete blogging and digital download CMS built with HTML, CSS, Vanilla JS, and Supabase.

## Project Structure

```
/
├── index.html              # Blog homepage
├── post.html               # Single blog post
├── download.html           # Download page with timer
├── downloads.html          # Downloads listing
├── category.html           # Category/archive page
├── search.html             # Search results
├── css/
│   ├── main.css            # Main frontend styles
│   └── admin.css           # Admin panel styles
├── js/
│   ├── config.js           # ← EDIT THIS: Supabase credentials
│   ├── supabase-client.js  # Supabase client init
│   ├── theme.js            # Theme system (dark/light mode, CSS vars)
│   ├── auth.js             # Admin authentication
│   ├── seo.js              # Dynamic SEO meta tags
│   ├── share.js            # Social sharing buttons
│   ├── ads.js              # Ad injection manager
│   ├── menu.js             # Navigation renderer
│   ├── blog.js             # Blog frontend logic
│   ├── download.js         # Download timer logic
│   └── admin-common.js     # Admin utility functions
├── admin/
│   ├── login.html          # Admin login
│   ├── index.html          # Dashboard
│   ├── posts.html          # Posts list
│   ├── post-editor.html    # Create/edit posts (Quill WYSIWYG)
│   ├── downloads.html      # Downloads list
│   ├── download-editor.html # Create/edit downloads
│   ├── ads.html            # Ads + code injection manager
│   ├── settings.html       # Site settings + theme customizer
│   └── menus.html          # Navigation menu builder
├── supabase-schema.sql     # Database setup SQL
├── _headers                # Cloudflare Pages headers
└── _redirects              # Cloudflare Pages redirects
```

## Setup Instructions

### 1. Supabase Setup
1. Create a project at https://app.supabase.com
2. Run `supabase-schema.sql` in the SQL Editor
3. Go to Authentication → Settings → disable email confirmation
4. Create your admin user: Authentication → Users → Add User
5. Create storage buckets: `images` (public) and `downloads` (public)

### 2. Configure Credentials
Edit `js/config.js`:
```js
const DEV27_CONFIG = {
  supabaseUrl: 'https://yourproject.supabase.co',
  supabaseAnonKey: 'your-anon-key-here',
  ...
};
```

### 3. Deploy to Cloudflare Pages
1. Push to GitHub
2. Connect repo in Cloudflare Pages
3. Build settings: no build command, output directory = `/` (root)
4. Deploy!

## Admin Access
- URL: `/admin/login.html`
- Login with the Supabase user you created

## Features
- Blog with WYSIWYG editor (Quill.js)
- Digital downloads with 2-step timer (configurable)
- Ads manager (any ad network code)
- Header/footer code injections
- Theme customizer (colors, fonts, dark mode)
- Menu builder (header, footer)
- SEO: meta tags, OG, Twitter Card, JSON-LD schema
- Social sharing: X, Facebook, Pinterest, LinkedIn, Reddit, WhatsApp, Email, Copy Link
- Mobile-first responsive design
- Dark/light mode toggle

## User Preferences
- Clean, modular code — one feature per file
- No build tools required — pure HTML/CSS/JS
- All admin pages require authentication
