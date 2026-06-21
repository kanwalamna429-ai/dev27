// dev27 CMS - Theme Manager
// Handles: CSS variables, dark/light mode, Google Fonts, customizer settings

const DEV27_THEME = (() => {
  const STORAGE_KEY = 'dev27_theme_mode';
  const SETTINGS_KEY = 'dev27_settings_cache';

  const defaults = {
    primary_color: '#4F46E5',
    bg_color: '#FFFFFF',
    text_color: '#0F172A',
    link_color: '#4F46E5',
    accent_color: '#06B6D4',
    font_family: 'Inter',
    dark_primary_color: '#6366F1',
    dark_bg_color: '#0F172A',
    dark_text_color: '#F1F5F9',
    dark_link_color: '#818CF8',
    dark_accent_color: '#22D3EE',
    site_name: 'dev27',
    tagline: 'Templates, Themes & Dev Resources'
  };

  let settings = { ...defaults };
  let isDark = false;

  // Apply CSS custom properties
  const applyVars = (vars, dark = false) => {
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty('--primary', vars.dark_primary_color || defaults.dark_primary_color);
      root.style.setProperty('--bg', vars.dark_bg_color || defaults.dark_bg_color);
      root.style.setProperty('--text', vars.dark_text_color || defaults.dark_text_color);
      root.style.setProperty('--link', vars.dark_link_color || defaults.dark_link_color);
      root.style.setProperty('--accent', vars.dark_accent_color || defaults.dark_accent_color);
    } else {
      root.style.setProperty('--primary', vars.primary_color || defaults.primary_color);
      root.style.setProperty('--bg', vars.bg_color || defaults.bg_color);
      root.style.setProperty('--text', vars.text_color || defaults.text_color);
      root.style.setProperty('--link', vars.link_color || defaults.link_color);
      root.style.setProperty('--accent', vars.accent_color || defaults.accent_color);
    }

    // Computed vars (always based on primary)
    const primary = dark
      ? (vars.dark_primary_color || defaults.dark_primary_color)
      : (vars.primary_color || defaults.primary_color);
    root.style.setProperty('--primary-rgb', hexToRgb(primary));
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const loadGoogleFont = (fontName) => {
    if (!fontName || fontName === 'System UI') return;
    const existing = document.getElementById('dev27-google-font');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = 'dev27-google-font';
    link.rel = 'stylesheet';
    const encoded = fontName.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
    document.documentElement.style.setProperty('--font-body', `'${fontName}', sans-serif`);
  };

  const setMode = (dark) => {
    isDark = dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    applyVars(settings, dark);
    // Update toggle icons
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      const icon = btn.querySelector('.theme-icon');
      if (icon) icon.textContent = dark ? '☀️' : '🌙';
    });
  };

  const toggleMode = () => setMode(!isDark);

  const applySettings = (s) => {
    settings = { ...defaults, ...s };
    isDark = document.documentElement.classList.contains('dark');
    applyVars(settings, isDark);
    if (settings.font_family) loadGoogleFont(settings.font_family);

    // Update site name/tagline in DOM
    document.querySelectorAll('[data-site-name]').forEach(el => {
      el.textContent = settings.site_name || defaults.site_name;
    });
    document.querySelectorAll('[data-site-tagline]').forEach(el => {
      el.textContent = settings.tagline || defaults.tagline;
    });
    document.title = document.title.includes('|')
      ? document.title.split('|')[0].trim() + ' | ' + (settings.site_name || defaults.site_name)
      : document.title;
  };

  const init = async () => {
    // Check saved mode preference
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
    applyVars(defaults, isDark);

    // Load settings from cache first (instant render)
    const cached = localStorage.getItem(SETTINGS_KEY);
    if (cached) {
      try {
        applySettings(JSON.parse(cached));
      } catch (e) { /* ignore */ }
    }

    // Then fetch from Supabase
    const sb = getSupabase();
    if (!sb) return;

    try {
      const { data } = await sb.from('settings').select('key, value');
      if (data && data.length) {
        const settingsObj = {};
        data.forEach(row => { settingsObj[row.key] = row.value; });
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsObj));
        applySettings(settingsObj);
      }
    } catch (e) {
      console.warn('dev27: Could not load settings', e);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORAGE_KEY)) setMode(e.matches);
    });

    // Wire up all toggle buttons
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggleMode);
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      const icon = btn.querySelector('.theme-icon');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    });
  };

  return { init, toggleMode, setMode, applySettings, loadGoogleFont, get isDark() { return isDark; }, get settings() { return settings; } };
})();

document.addEventListener('DOMContentLoaded', DEV27_THEME.init);
