// dev27 CMS - Admin Authentication
// Handles login, session check, logout

const DEV27_AUTH = (() => {
  const ADMIN_RETURN_KEY = 'dev27_admin_return';
  const AUTH_FAIL_KEY = 'dev27_auth_redirect_fail';

  const isAdminPage = () => window.location.pathname.startsWith('/admin') ||
    window.location.pathname.includes('/admin/');

  const redirectToLogin = async () => {
    // Mark that we're redirecting due to auth failure — breaks any loop
    sessionStorage.setItem(AUTH_FAIL_KEY, '1');
    localStorage.setItem(ADMIN_RETURN_KEY, window.location.href);
    // Sign out to clear stale session from localStorage
    const sb = getSupabase();
    if (sb) {
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
    }
    window.location.href = '/admin/login.html';
  };

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

  const requireAuth = async () => {
    const session = await getSession();
    if (!session) {
      await redirectToLogin();
      return false;
    }
    return session;
  };

  const login = async (email, password) => {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured. Edit js/config.js' } };
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (!error && data.session) {
        // Clear any previous fail flag
        sessionStorage.removeItem(AUTH_FAIL_KEY);
        const returnUrl = localStorage.getItem(ADMIN_RETURN_KEY) || '/admin/index.html';
        localStorage.removeItem(ADMIN_RETURN_KEY);
        window.location.href = returnUrl;
      }
      return { data, error };
    } catch (e) {
      return { error: { message: 'Login failed. Please try again.' } };
    }
  };

  const logout = async () => {
    const sb = getSupabase();
    if (sb) {
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
    }
    sessionStorage.removeItem(AUTH_FAIL_KEY);
    window.location.href = '/admin/login.html';
  };

  const getUser = async () => {
    const session = await getSession();
    return session?.user || null;
  };

  // Auto-check on admin pages (skip login page itself)
  const init = async () => {
    if (window.location.pathname.endsWith('login.html')) return;
    if (!isAdminPage()) return;
    await requireAuth();
  };

  return { init, login, logout, getSession, getUser, requireAuth, AUTH_FAIL_KEY };
})();

document.addEventListener('DOMContentLoaded', DEV27_AUTH.init);
