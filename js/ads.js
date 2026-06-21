// dev27 CMS - Ads Manager
// Fetches ad slots from Supabase and injects ad code into designated positions

const DEV27_ADS = (() => {
  let adsCache = null;
  const CACHE_KEY = 'dev27_ads_cache';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const LOCATIONS = {
    HEADER: 'header',
    FOOTER: 'footer',
    SIDEBAR: 'sidebar',
    BEFORE_CONTENT: 'before_content',
    AFTER_CONTENT: 'after_content',
    IN_CONTENT_1: 'in_content_1',
    IN_CONTENT_2: 'in_content_2',
    POPUP: 'popup',
    STICKY_BOTTOM: 'sticky_bottom'
  };

  const loadAds = async () => {
    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { ads, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          adsCache = ads;
          return ads;
        }
      } catch (e) { /* ignore */ }
    }

    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb.from('ads')
      .select('*')
      .eq('enabled', true);

    if (error) return [];
    adsCache = data || [];
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ads: adsCache, ts: Date.now() }));
    return adsCache;
  };

  const getAd = (location) => {
    if (!adsCache) return null;
    return adsCache.find(ad => ad.location === location) || null;
  };

  const injectAd = (location, containerSelector) => {
    const ad = getAd(location);
    if (!ad || !ad.code) return;

    const targets = containerSelector
      ? document.querySelectorAll(containerSelector)
      : document.querySelectorAll(`[data-ad="${location}"]`);

    targets.forEach(container => {
      container.innerHTML = '';
      container.classList.add('ad-slot', `ad-slot--${location}`);

      // Use a wrapper to safely inject script tags
      const wrapper = document.createElement('div');
      wrapper.innerHTML = ad.code;

      // Re-execute any script tags
      wrapper.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      container.appendChild(wrapper);
    });
  };

  const injectAllAds = () => {
    Object.values(LOCATIONS).forEach(loc => injectAd(loc));
  };

  // Inject ad after every N paragraphs in post content
  const injectInContentAds = (contentEl) => {
    if (!contentEl) return;
    const paragraphs = contentEl.querySelectorAll('p, h2, h3');
    if (paragraphs.length < 4) return;

    const positions = [
      { after: Math.floor(paragraphs.length * 0.3), location: LOCATIONS.IN_CONTENT_1 },
      { after: Math.floor(paragraphs.length * 0.65), location: LOCATIONS.IN_CONTENT_2 }
    ];

    positions.forEach(({ after, location }) => {
      const ad = getAd(location);
      if (!ad?.code) return;
      const target = paragraphs[after];
      if (!target) return;

      const adEl = document.createElement('div');
      adEl.className = `ad-slot ad-slot--in-content`;
      adEl.setAttribute('data-ad-location', location);
      adEl.innerHTML = ad.code;

      adEl.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      target.after(adEl);
    });
  };

  const init = async () => {
    await loadAds();
    injectAllAds();
  };

  return { init, loadAds, getAd, injectAd, injectAllAds, injectInContentAds, LOCATIONS };
})();

document.addEventListener('DOMContentLoaded', DEV27_ADS.init);
