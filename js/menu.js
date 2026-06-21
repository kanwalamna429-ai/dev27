// dev27 CMS - Menu Renderer
// Renders header/footer navigation from Supabase settings

const DEV27_MENU = (() => {
  const CACHE_KEY = 'dev27_menus_cache';
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  let menusCache = null;

  const loadMenus = async () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { menus, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          menusCache = menus;
          return menus;
        }
      } catch (e) { /* ignore */ }
    }

    const sb = getSupabase();
    if (!sb) return [];

    const { data } = await sb.from('menus').select('*');
    menusCache = data || [];
    localStorage.setItem(CACHE_KEY, JSON.stringify({ menus: menusCache, ts: Date.now() }));
    return menusCache;
  };

  const getMenu = (location) => {
    if (!menusCache) return null;
    return menusCache.find(m => m.location === location) || null;
  };

  const renderItems = (items, depth = 0) => {
    if (!items?.length) return '';
    return `<ul class="nav-menu ${depth > 0 ? 'nav-submenu' : ''}">
      ${items.map(item => {
        const hasChildren = item.children?.length > 0;
        const isActive = window.location.pathname === item.url ||
          (item.url !== '/' && window.location.pathname.startsWith(item.url));
        return `
          <li class="nav-item ${hasChildren ? 'has-children' : ''} ${isActive ? 'active' : ''}">
            <a href="${item.url || '#'}" 
               class="nav-link"
               ${item.target === '_blank' ? 'target="_blank" rel="noopener noreferrer"' : ''}>
              ${item.icon ? `<span class="nav-icon">${item.icon}</span>` : ''}
              ${item.label}
              ${hasChildren ? '<span class="nav-arrow">▾</span>' : ''}
            </a>
            ${hasChildren ? renderItems(item.children, depth + 1) : ''}
          </li>`;
      }).join('')}
    </ul>`;
  };

  const renderHeader = (menuEl) => {
    if (!menuEl) return;
    const menu = getMenu('header');
    if (!menu?.items?.length) {
      // Default menu
      menuEl.innerHTML = renderItems([
        { label: 'Home', url: '/' },
        { label: 'Blog', url: '/category.html' },
        { label: 'Downloads', url: '/downloads.html' }
      ]);
      return;
    }
    menuEl.innerHTML = renderItems(
      typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items
    );
    initDropdowns(menuEl);
  };

  const renderFooter = (menuEl, location = 'footer') => {
    if (!menuEl) return;
    const menu = getMenu(location);
    if (!menu?.items?.length) {
      menuEl.innerHTML = renderItems([
        { label: 'Home', url: '/' },
        { label: 'Blog', url: '/category.html' },
        { label: 'Downloads', url: '/downloads.html' },
        { label: 'Privacy Policy', url: '/privacy.html' }
      ]);
      return;
    }
    menuEl.innerHTML = renderItems(
      typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items
    );
  };

  const initDropdowns = (menuEl) => {
    menuEl.querySelectorAll('.has-children').forEach(item => {
      const link = item.querySelector('.nav-link');
      link.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
          e.preventDefault();
          item.classList.toggle('open');
        }
      });
    });
  };

  const init = async () => {
    await loadMenus();
    renderHeader(document.getElementById('header-nav'));
    renderFooter(document.getElementById('footer-nav'));
    renderFooter(document.getElementById('footer-nav-2'), 'footer_2');
    initMobileToggle();
  };

  const initMobileToggle = () => {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.querySelector('.hamburger')?.classList.toggle('open', isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('.hamburger')?.classList.remove('open');
      }
    });
  };

  return { init, loadMenus, getMenu, renderHeader, renderFooter };
})();

document.addEventListener('DOMContentLoaded', DEV27_MENU.init);
