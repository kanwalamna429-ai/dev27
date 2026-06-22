// dev27 CMS — Admin Authentication
// Handles login, session verification, logout

const DEV27_AUTH = (() => {

  // ── Session helpers ──────────────────────────────────────────────────────

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
    const session = await getSession();
    return session?.user || null;
  };

  // ── Auth guard ───────────────────────────────────────────────────────────
  // Called on every admin page (except login).
  // Retries once after a short delay — Supabase needs a moment after a fresh
  // page navigation to restore the session from localStorage.

  const requireAuth = async () => {
    let session = await getSession();

    if (!session) {
      // Wait for Supabase to finish restoring the session, then retry
      await new Promise(r => setTimeout(r, 600));
      session = await getSession();
    }

    if (!session) {
      // Still no session — send to login WITHOUT calling signOut()
      // Calling signOut() here would destroy a valid session if getSession()
      // returned null due to a transient issue (timing, network, etc.)
      window.location.replace('/admin/login.html');
      return false;
    }

    return session;
  };

  // ── Login / Logout ───────────────────────────────────────────────────────

  const login = async (email, password) => {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured. Edit js/config.js.' } };
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (!error && data?.session) {
        // Session is now in localStorage — navigate to dashboard
        window.location.href = '/admin/index.html';
      }
      return { data, error };
    } catch (e) {
      return { error: { message: 'Login failed. Please check your connection.' } };
    }
  };

  const logout = async () => {
    const sb = getSupabase();
    if (sb) {
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
    }
    window.location.replace('/admin/login.html');
  };

  // ── Auto-init on admin pages ─────────────────────────────────────────────

  const init = async () => {
    // Skip the auth check on the login page itself
    if (window.location.pathname.endsWith('login.html')) return;
    // Only guard pages inside /admin/
    if (!window.location.pathname.includes('/admin')) return;
    await requireAuth();
  };

  return { init, login, logout, getSession, getUser, requireAuth };
})();

document.addEventListener('DOMContentLoaded', DEV27_AUTH.init);
