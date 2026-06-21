// dev27 CMS - SEO & Meta Tags Manager
// Handles: dynamic meta, Open Graph, Twitter Card, Schema.org JSON-LD

const DEV27_SEO = (() => {
  const setMeta = (name, content, attr = 'name') => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setCanonical = (url) => {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', url);
  };

  const setTitle = (title, siteName) => {
    document.title = siteName ? `${title} | ${siteName}` : title;
  };

  const injectJsonLd = (data) => {
    let el = document.querySelector('#dev27-jsonld');
    if (!el) {
      el = document.createElement('script');
      el.id = 'dev27-jsonld';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  };

  const applyPost = (post, siteSettings = {}) => {
    const siteName = siteSettings.site_name || 'dev27';
    const siteUrl = siteSettings.site_url || window.location.origin;
    const title = post.seo_title || post.title;
    const description = post.seo_description || post.excerpt || '';
    const image = post.og_image || post.featured_image || `${siteUrl}/assets/og-default.jpg`;
    const url = `${siteUrl}/post.html?slug=${post.slug}`;

    setTitle(title, siteName);
    setMeta('description', description);
    setMeta('keywords', post.seo_keywords || '');
    setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:type', 'article', 'property');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:site_name', siteName, 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
    if (siteSettings.twitter_handle) {
      setMeta('twitter:site', siteSettings.twitter_handle);
    }

    // Pinterest
    setMeta('pinterest:description', description);

    setCanonical(url);

    // Article Schema
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': title,
      'description': description,
      'image': image,
      'url': url,
      'datePublished': post.created_at,
      'dateModified': post.updated_at || post.created_at,
      'author': { '@type': 'Organization', 'name': siteName },
      'publisher': {
        '@type': 'Organization',
        'name': siteName,
        'logo': { '@type': 'ImageObject', 'url': `${siteUrl}/assets/logo.png` }
      },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': url }
    });
  };

  const applyDownload = (item, siteSettings = {}) => {
    const siteName = siteSettings.site_name || 'dev27';
    const siteUrl = siteSettings.site_url || window.location.origin;
    const title = item.seo_title || item.title;
    const description = item.seo_description || item.description || '';
    const image = item.featured_image || `${siteUrl}/assets/og-default.jpg`;
    const url = `${siteUrl}/download.html?slug=${item.slug}`;

    setTitle(title, siteName);
    setMeta('description', description);
    setMeta('robots', 'index, follow');

    setMeta('og:type', 'product', 'property');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:site_name', siteName, 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    setCanonical(url);

    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': title,
      'description': description,
      'image': image,
      'url': url,
      'applicationCategory': 'WebApplication',
      'operatingSystem': 'Web',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    });
  };

  const applyHome = (siteSettings = {}) => {
    const siteName = siteSettings.site_name || 'dev27';
    const siteUrl = siteSettings.site_url || window.location.origin;
    const tagline = siteSettings.tagline || 'Templates, Themes & Dev Resources';
    const description = siteSettings.site_description || `${siteName} - ${tagline}`;
    const image = `${siteUrl}/assets/og-default.jpg`;

    setTitle(siteName, tagline);
    setMeta('description', description);
    setMeta('robots', 'index, follow');

    setMeta('og:type', 'website', 'property');
    setMeta('og:title', siteName, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:url', siteUrl, 'property');
    setMeta('og:site_name', siteName, 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', siteName);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    setCanonical(siteUrl);

    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteName,
      'url': siteUrl,
      'description': description,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${siteUrl}/search.html?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
  };

  return { applyPost, applyDownload, applyHome, setMeta, setTitle, setCanonical, injectJsonLd };
})();
