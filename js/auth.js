// dev27 CMS - Admin Authentication
// Handles login, session check, logout

const DEV27_AUTH = (() => {
  const ADMIN_RETURN_KEY = 'dev27_admin_return';

  const isAdminPage = () => window.location.pathname.startsWith('/admin') ||
    window.location.pathname.includes('/admin/');

  const redirectToLogin = () => {
    localStorage.setItem(ADMIN_RETURN_KEY, window.location.href);
    window.location.href = '/admin/login.html';
  };

  const getSession = async () => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  };

  const requireAuth = async () => {
    const session = await getSession();
    if (!session) {
      redirectToLogin();
      return false;
    }
    return session;
  };

  const login = async (email, password) => {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      const returnUrl = localStorage.getItem(ADMIN_RETURN_KEY) || '/admin/index.html';
      localStorage.removeItem(ADMIN_RETURN_KEY);
      window.location.href = returnUrl;
    }
    return { data, error };
  };

  const logout = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    window.location.href = '/admin/login.html';
  };

  const getUser = async () => {
    const session = await getSession();
    return session?.user || null;
  };

  // Auto-check on admin pages
  const init = async () => {
    // Skip on login page
    if (window.location.pathname.endsWith('login.html')) return;
    if (!isAdminPage()) return;
    await requireAuth();
  };

  return { init, login, logout, getSession, getUser, requireAuth };
})();

document.addEventListener('DOMContentLoaded', DEV27_AUTH.init);
