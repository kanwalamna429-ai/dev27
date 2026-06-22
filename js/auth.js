// dev27 CMS — Admin Authentication

const DEV27_AUTH = (() => {

  const LOOP_KEY = 'dev27_redirect_count';

  // ── Session ──────────────────────────────────────────────────────────────

  const getSession = async () => {
    const sb = getSupabase();
    if (!sb) return null;
    try {
      const { data, error } = await sb.auth.getSession();
      if (error || !data?.session) return null;
      return data.session;
    } catch (e) {
      return null;
    }
  };

  const getUser = async () => {
    const s = await getSession();
    return s ? s.user : null;
  };

  // ── Auth guard ───────────────────────────────────────────────────────────

  const requireAuth = async () => {
    // ── Hard loop-breaker ────────────────────────────────────────────────
    // Count how many times we've bounced between admin ↔ login this tab session.
    // After 3 bounces we stop redirecting and show a manual login link instead.
    const count = parseInt(sessionStorage.getItem(LOOP_KEY) || '0', 10);
    if (count >= 3) {
      sessionStorage.removeItem(LOOP_KEY);
      _showSessionError();
      return false;
    }

    // ── Session check (with one retry) ──────────────────────────────────
    let session = await getSession();
    if (!session) {
      await new Promise(r => setTimeout(r, 700));
      session = await getSession();
    }

    if (session) {
      // Authenticated — reset the bounce counter
      sessionStorage.removeItem(LOOP_KEY);
      return session;
    }

    // No session — record this bounce then go to login
    sessionStorage.setItem(LOOP_KEY, String(count + 1));
    window.location.replace('/admin/login.html');
    return false;
  };

  // Show an inline error so the page never keeps spinning
  const _showSessionError = () => {
    document.body.style.cssText =
      'margin:0;display:flex;align-items:center;justify-content:center;' +
      'min-height:100vh;font-family:Inter,sans-serif;background:#F8FAFC;text-align:center;padding:2rem';
    document.body.innerHTML =
      '<div>' +
        '<p style="font-size:2rem;margin-bottom:.5rem">🔒</p>' +
        '<h2 style="font-size:1.25rem;color:#1E293B;margin-bottom:.5rem">Session could not be verified</h2>' +
        '<p style="color:#64748B;margin-bottom:1.25rem;font-size:.9rem">Your Supabase session may have expired.</p>' +
        '<a href="/admin/login.html" ' +
           'style="display:inline-block;padding:.625rem 1.5rem;background:#6366F1;color:#fff;' +
                  'border-radius:8px;text-decoration:none;font-size:.9rem;font-weight:600">' +
          'Go to Login' +
        '</a>' +
      '</div>';
  };

  // ── Login / Logout ───────────────────────────────────────────────────────

  const login = async (email, password) => {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured — edit js/config.js' } };
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (!error && data?.session) {
        sessionStorage.removeItem(LOOP_KEY); // clear any stale bounce count
        window.location.href = '/admin/index.html';
      }
      return { data, error };
    } catch (e) {
      return { error: { message: 'Login failed — check your connection.' } };
    }
  };

  const logout = async () => {
    const sb = getSupabase();
    if (sb) { try { await sb.auth.signOut(); } catch (_) {} }
    sessionStorage.removeItem(LOOP_KEY);
    window.location.replace('/admin/login.html');
  };

  // ── Auto-init on admin pages (skip login page) ───────────────────────────

  const init = async () => {
    if (window.location.pathname.endsWith('login.html')) return;
    if (!window.location.pathname.includes('/admin')) return;
    await requireAuth();
  };

  return { init, login, logout, getSession, getUser, requireAuth };
})();

document.addEventListener('DOMContentLoaded', DEV27_AUTH.init);
