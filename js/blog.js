// dev27 CMS - Blog Frontend Logic

const DEV27_BLOG = (() => {
  const POSTS_PER_PAGE = 12;

  const getSlugFromUrl = () => new URLSearchParams(window.location.search).get('slug');
  const getPageFromUrl = () => parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
  const getCategoryFromUrl = () => new URLSearchParams(window.location.search).get('cat');
  const getQueryFromUrl = () => new URLSearchParams(window.location.search).get('q') || '';

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Calculate read time
  const readTime = (content) => {
    const words = content?.replace(/<[^>]+>/g, '').split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Post card HTML
  const postCard = (post) => `
    <article class="post-card" itemscope itemtype="https://schema.org/BlogPosting">
      <a href="/post.html?slug=${post.slug}" class="post-card__image-link">
        <div class="post-card__image-wrap">
          ${post.featured_image
            ? `<img src="${post.featured_image}" alt="${post.title}" loading="lazy" itemprop="image">`
            : `<div class="post-card__image-placeholder"><span>📄</span></div>`}
          ${post.category ? `<span class="post-card__cat">${post.category.name}</span>` : ''}
        </div>
      </a>
      <div class="post-card__body">
        <div class="post-card__meta">
          <time datetime="${post.created_at}" itemprop="datePublished">${formatDate(post.created_at)}</time>
          <span class="post-card__read-time">· ${readTime(post.content)} min read</span>
        </div>
        <h2 class="post-card__title" itemprop="headline">
          <a href="/post.html?slug=${post.slug}" itemprop="url">${post.title}</a>
        </h2>
        ${post.excerpt ? `<p class="post-card__excerpt" itemprop="description">${post.excerpt}</p>` : ''}
        <a href="/post.html?slug=${post.slug}" class="post-card__read-more">
          Read More <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>`;

  // Pagination HTML
  const renderPagination = (currentPage, totalPages, buildUrl) => {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return `
      <nav class="pagination" aria-label="Posts pagination">
        ${currentPage > 1
          ? `<a href="${buildUrl(currentPage - 1)}" class="pagination__btn pagination__prev">← Previous</a>`
          : '<span class="pagination__btn pagination__prev disabled">← Previous</span>'}
        <div class="pagination__pages">
          ${pages.map(p => p === '...'
            ? `<span class="pagination__ellipsis">…</span>`
            : `<a href="${buildUrl(p)}" class="pagination__page ${p === currentPage ? 'active' : ''}">${p}</a>`
          ).join('')}
        </div>
        ${currentPage < totalPages
          ? `<a href="${buildUrl(currentPage + 1)}" class="pagination__btn pagination__next">Next →</a>`
          : '<span class="pagination__btn pagination__next disabled">Next →</span>'}
      </nav>`;
  };

  // Load homepage posts
  const loadHome = async () => {
    const grid = document.getElementById('posts-grid');
    const featured = document.getElementById('featured-post');
    const paginationEl = document.getElementById('pagination');
    if (!grid) return;

    const sb = getSupabase();
    if (!sb) { grid.innerHTML = '<p class="error-msg">Database not configured.</p>'; return; }

    showSkeleton(grid, 6);
    const page = getPageFromUrl();
    const from = (page - 1) * POSTS_PER_PAGE;

    const { data: posts, count, error } = await sb.from('posts')
      .select('id, title, slug, excerpt, featured_image, created_at, content, category:categories(name, slug)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(from, from + POSTS_PER_PAGE - 1);

    if (error || !posts) { grid.innerHTML = '<p class="error-msg">Could not load posts.</p>'; return; }

    // Featured post (first on first page)
    if (featured && page === 1 && posts.length > 0) {
      const fp = posts[0];
      featured.innerHTML = `
        <article class="featured-post" itemscope itemtype="https://schema.org/BlogPosting">
          <a href="/post.html?slug=${fp.slug}" class="featured-post__image-link">
            ${fp.featured_image
              ? `<img src="${fp.featured_image}" alt="${fp.title}" loading="eager" itemprop="image">`
              : `<div class="featured-post__placeholder"></div>`}
          </a>
          <div class="featured-post__body">
            ${fp.category ? `<span class="featured-post__cat">${fp.category.name}</span>` : ''}
            <h1 class="featured-post__title" itemprop="headline">
              <a href="/post.html?slug=${fp.slug}">${fp.title}</a>
            </h1>
            ${fp.excerpt ? `<p class="featured-post__excerpt" itemprop="description">${fp.excerpt}</p>` : ''}
            <div class="featured-post__meta">
              <time datetime="${fp.created_at}" itemprop="datePublished">${formatDate(fp.created_at)}</time>
              <span>· ${readTime(fp.content)} min read</span>
            </div>
            <a href="/post.html?slug=${fp.slug}" class="btn btn--primary">Read Article</a>
          </div>
        </article>`;
      featured.hidden = false;
      // Remove featured from grid posts
      posts.shift();
    }

    grid.innerHTML = posts.length
      ? posts.map(postCard).join('')
      : '<p class="empty-msg">No posts published yet.</p>';

    const totalPages = Math.ceil((count - (page === 1 ? 1 : 0)) / POSTS_PER_PAGE);
    if (paginationEl) {
      paginationEl.innerHTML = renderPagination(page, totalPages,
        p => `/?page=${p}`);
    }

    // Inject in-content ad slots
    DEV27_ADS.injectAd(DEV27_ADS.LOCATIONS.BEFORE_CONTENT,
      '#before-content-ad');
  };

  // Load single post
  const loadPost = async () => {
    const slug = getSlugFromUrl();
    const container = document.getElementById('post-container');
    if (!slug || !container) return;

    const sb = getSupabase();
    if (!sb) return;

    container.innerHTML = '<div class="post-skeleton"></div>';

    const { data: post, error } = await sb.from('posts')
      .select('*, category:categories(name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      container.innerHTML = '<div class="post-not-found"><h1>Post Not Found</h1><p>This post may have been removed or the URL is incorrect.</p><a href="/" class="btn btn--primary">← Back to Home</a></div>';
      return;
    }

    // SEO
    const { data: sSettings } = await sb.from('settings').select('key, value');
    const settings = {};
    (sSettings || []).forEach(r => { settings[r.key] = r.value; });
    DEV27_SEO.applyPost(post, settings);

    // Increment view count
    sb.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id).then(() => {});

    container.innerHTML = `
      <article class="single-post" itemscope itemtype="https://schema.org/BlogPosting">
        <header class="single-post__header">
          ${post.category ? `
            <a href="/category.html?cat=${post.category.slug}" class="post-cat-badge">
              ${post.category.name}
            </a>` : ''}
          <h1 class="single-post__title" itemprop="headline">${post.title}</h1>
          <div class="single-post__meta">
            <time datetime="${post.created_at}" itemprop="datePublished">${formatDate(post.created_at)}</time>
            <span>· ${readTime(post.content)} min read</span>
            ${post.views ? `<span>· ${post.views.toLocaleString()} views</span>` : ''}
          </div>
        </header>
        ${post.featured_image ? `
          <figure class="single-post__featured-image">
            <img src="${post.featured_image}" alt="${post.title}" itemprop="image" loading="eager">
          </figure>` : ''}
        <div class="single-post__share-top" id="share-top"></div>
        <div id="before-content-ad" data-ad="before_content"></div>
        <div class="single-post__content prose" itemprop="articleBody" id="post-content">
          ${post.content || ''}
        </div>
        <div id="after-content-ad" data-ad="after_content"></div>
        <div class="single-post__share-bottom" id="share-bottom"></div>
        <div class="single-post__tags">
          ${(post.seo_keywords || '').split(',').filter(Boolean).map(tag =>
            `<a href="/search.html?q=${encodeURIComponent(tag.trim())}" class="tag">${tag.trim()}</a>`
          ).join('')}
        </div>
      </article>`;

    // Social sharing
    const shareOpts = {
      url: window.location.href,
      title: post.title,
      image: post.featured_image
    };
    const shareTop = document.getElementById('share-top');
    const shareBottom = document.getElementById('share-bottom');
    if (shareTop) DEV27_SHARE.renderShareBar(shareTop, shareOpts);
    if (shareBottom) DEV27_SHARE.renderShareBar(shareBottom, shareOpts);

    // Inject in-content ads
    DEV27_ADS.injectInContentAds(document.getElementById('post-content'));
    DEV27_ADS.injectAd(DEV27_ADS.LOCATIONS.BEFORE_CONTENT, '#before-content-ad');
    DEV27_ADS.injectAd(DEV27_ADS.LOCATIONS.AFTER_CONTENT, '#after-content-ad');

    // Load related posts
    loadRelatedPosts(post);
  };

  const loadRelatedPosts = async (post) => {
    const container = document.getElementById('related-posts');
    if (!container) return;
    const sb = getSupabase();
    if (!sb) return;

    let query = sb.from('posts')
      .select('id, title, slug, excerpt, featured_image, created_at')
      .eq('status', 'published')
      .neq('id', post.id)
      .limit(3);

    if (post.category_id) {
      query = query.eq('category_id', post.category_id);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (!data?.length) { container.closest('.related-posts-section')?.remove(); return; }

    container.innerHTML = data.map(postCard).join('');
  };

  // Category page
  const loadCategory = async () => {
    const grid = document.getElementById('posts-grid');
    const catName = document.getElementById('cat-name');
    const paginationEl = document.getElementById('pagination');
    if (!grid) return;

    const sb = getSupabase();
    if (!sb) return;

    const catSlug = getCategoryFromUrl();
    const page = getPageFromUrl();
    const from = (page - 1) * POSTS_PER_PAGE;

    showSkeleton(grid, 9);

    let query = sb.from('posts')
      .select('id, title, slug, excerpt, featured_image, created_at, content, category:categories!inner(name, slug)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(from, from + POSTS_PER_PAGE - 1);

    if (catSlug) {
      query = query.eq('categories.slug', catSlug);
    }

    const { data: posts, count, error } = await query;
    if (error) { grid.innerHTML = '<p class="error-msg">Could not load posts.</p>'; return; }

    if (catName && catSlug && posts?.[0]?.category) {
      catName.textContent = posts[0].category.name;
      document.title = `${posts[0].category.name} | ${document.title.split('|').pop().trim()}`;
    } else if (catName) {
      catName.textContent = 'All Posts';
    }

    grid.innerHTML = posts?.length
      ? posts.map(postCard).join('')
      : '<p class="empty-msg">No posts in this category yet.</p>';

    const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);
    if (paginationEl) {
      paginationEl.innerHTML = renderPagination(page, totalPages,
        p => `/category.html?${catSlug ? 'cat=' + catSlug + '&' : ''}page=${p}`);
    }
  };

  // Search page
  const loadSearch = async () => {
    const grid = document.getElementById('posts-grid');
    const queryEl = document.getElementById('search-query-display');
    const inputEl = document.getElementById('search-input');
    if (!grid) return;

    const q = getQueryFromUrl();
    if (queryEl) queryEl.textContent = q || '';
    if (inputEl) inputEl.value = q || '';

    if (!q) {
      grid.innerHTML = '<p class="empty-msg">Enter a search term above.</p>';
      return;
    }

    const sb = getSupabase();
    if (!sb) return;

    showSkeleton(grid, 6);
    document.title = `Search: ${q} | ${document.title.split('|').pop().trim()}`;

    const { data, error } = await sb.from('posts')
      .select('id, title, slug, excerpt, featured_image, created_at, content, category:categories(name, slug)')
      .eq('status', 'published')
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) { grid.innerHTML = '<p class="error-msg">Search error.</p>'; return; }
    grid.innerHTML = data?.length
      ? data.map(postCard).join('')
      : `<p class="empty-msg">No results found for "<strong>${q}</strong>".</p>`;
  };

  // Load sidebar widgets
  const loadSidebar = async () => {
    const sb = getSupabase();
    if (!sb) return;

    // Categories
    const catList = document.getElementById('sidebar-categories');
    if (catList) {
      const { data } = await sb.from('categories').select('name, slug').order('name');
      if (data?.length) {
        catList.innerHTML = data.map(c =>
          `<li><a href="/category.html?cat=${c.slug}" class="sidebar-cat-link">${c.name}</a></li>`
        ).join('');
      }
    }

    // Recent posts
    const recentList = document.getElementById('sidebar-recent');
    if (recentList) {
      const { data } = await sb.from('posts')
        .select('title, slug, featured_image, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data?.length) {
        recentList.innerHTML = data.map(p => `
          <li class="sidebar-recent__item">
            ${p.featured_image ? `<img src="${p.featured_image}" alt="${p.title}" loading="lazy">` : ''}
            <div>
              <a href="/post.html?slug=${p.slug}" class="sidebar-recent__title">${p.title}</a>
              <time class="sidebar-recent__date">${formatDate(p.created_at)}</time>
            </div>
          </li>`).join('');
      }
    }
  };

  // Skeleton loader
  const showSkeleton = (el, count) => {
    el.innerHTML = Array(count).fill(`
      <div class="post-card skeleton">
        <div class="skeleton-image"></div>
        <div class="post-card__body">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>`).join('');
  };

  return { loadHome, loadPost, loadCategory, loadSearch, loadSidebar, formatDate, readTime, postCard };
})();
