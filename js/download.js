// dev27 CMS - Download Timer Logic
// Multi-step verification with countdown timer before revealing download button

const DEV27_DOWNLOAD = (() => {
  const getSlugFromUrl = () => new URLSearchParams(window.location.search).get('slug');
  const getStepFromUrl = () => parseInt(new URLSearchParams(window.location.search).get('step')) || 1;

  let currentItem = null;
  let timerInterval = null;

  const loadItem = async () => {
    const slug = getSlugFromUrl();
    const container = document.getElementById('download-container');
    if (!slug || !container) return;

    const sb = getSupabase();
    if (!sb) return;

    container.innerHTML = '<div class="download-loading"><div class="spinner"></div><p>Loading...</p></div>';

    const { data: item, error } = await sb.from('downloads')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !item) {
      container.innerHTML = `
        <div class="download-not-found">
          <div class="not-found-icon">📭</div>
          <h1>Download Not Found</h1>
          <p>This item may have been removed or the URL is incorrect.</p>
          <a href="/" class="btn btn--primary">← Back to Home</a>
        </div>`;
      return;
    }

    currentItem = item;

    // SEO
    const { data: sSettings } = await sb.from('settings').select('key, value');
    const settings = {};
    (sSettings || []).forEach(r => { settings[r.key] = r.value; });
    DEV27_SEO.applyDownload(item, settings);

    const step = getStepFromUrl();
    const totalSteps = item.timer_enabled ? (item.timer_steps || 2) : 1;

    if (!item.timer_enabled || step >= totalSteps) {
      renderDownloadPage(item, container, settings);
    } else {
      renderTimerPage(item, container, step, totalSteps);
    }
  };

  const renderTimerPage = (item, container, step, totalSteps) => {
    const duration = parseInt(item.timer_duration) || 15;

    container.innerHTML = `
      <div class="download-timer-page">
        <div class="download-header">
          ${item.featured_image
            ? `<img src="${item.featured_image}" alt="${item.title}" class="download-hero-image" loading="eager">`
            : ''}
          <div class="download-info">
            <h1 class="download-title">${item.title}</h1>
            ${item.description ? `<p class="download-description">${item.description}</p>` : ''}
            <div class="download-meta">
              ${item.file_type ? `<span class="download-badge">${item.file_type.toUpperCase()}</span>` : ''}
              ${item.file_size ? `<span class="download-badge">📦 ${item.file_size}</span>` : ''}
              ${item.download_count ? `<span class="download-badge">⬇ ${item.download_count.toLocaleString()} downloads</span>` : ''}
            </div>
          </div>
        </div>

        <div class="timer-section">
          <div class="step-indicator">
            ${Array.from({ length: totalSteps + 1 }, (_, i) => i + 1).map(s => `
              <div class="step ${s < step ? 'done' : s === step ? 'active' : ''}">
                <div class="step-dot">${s < step ? '✓' : s}</div>
                <span>${s === totalSteps + 1 ? 'Download' : 'Step ' + s}</span>
              </div>
              ${s <= totalSteps ? '<div class="step-line"></div>' : ''}
            `).join('')}
          </div>

          <div class="timer-card">
            <div class="timer-icon">⏳</div>
            <h2 class="timer-heading">Please wait while we prepare your download</h2>
            <p class="timer-subtext">This helps support our free resource library. Step ${step} of ${totalSteps}.</p>
            
            <div class="timer-display" id="timer-display">
              <div class="timer-ring">
                <svg viewBox="0 0 120 120">
                  <circle class="timer-ring__track" cx="60" cy="60" r="54"/>
                  <circle class="timer-ring__fill" id="timer-ring-fill" cx="60" cy="60" r="54"
                    style="stroke-dasharray: 339.29; stroke-dashoffset: 0;"/>
                </svg>
                <div class="timer-number" id="timer-number">${duration}</div>
              </div>
              <p class="timer-seconds-label">seconds</p>
            </div>

            <div class="timer-action" id="timer-action" style="display:none;">
              ${step < totalSteps
                ? `<a href="/download.html?slug=${item.slug}&step=${step + 1}" class="btn btn--primary btn--large">
                     Continue to Step ${step + 1} <span>→</span>
                   </a>`
                : `<a href="/download.html?slug=${item.slug}&step=${totalSteps + 1}" class="btn btn--success btn--large">
                     <span>⬇</span> Get Download Link
                   </a>`}
            </div>
            <div id="timer-ad-slot" data-ad="timer_ad" class="timer-ad"></div>
          </div>
        </div>

        ${item.content ? `
          <div class="download-content prose">
            <h2>About This Download</h2>
            ${item.content}
          </div>` : ''}

        <div id="after-content-ad" data-ad="after_content"></div>
        <div class="download-share" id="share-container"></div>
      </div>`;

    // Start timer
    startTimer(duration, step, totalSteps, item);

    // Share bar
    const shareContainer = document.getElementById('share-container');
    if (shareContainer) {
      DEV27_SHARE.renderShareBar(shareContainer, {
        url: `/download.html?slug=${item.slug}`,
        title: item.title,
        image: item.featured_image
      });
    }

    DEV27_ADS.injectAd(DEV27_ADS.LOCATIONS.AFTER_CONTENT, '#after-content-ad');
  };

  const startTimer = (duration, step, totalSteps, item) => {
    let remaining = duration;
    const numberEl = document.getElementById('timer-number');
    const fillEl = document.getElementById('timer-ring-fill');
    const actionEl = document.getElementById('timer-action');
    const circumference = 339.29;

    const update = () => {
      if (numberEl) numberEl.textContent = remaining;
      if (fillEl) {
        const progress = (duration - remaining) / duration;
        fillEl.style.strokeDashoffset = circumference * (1 - progress);
      }

      if (remaining <= 0) {
        clearInterval(timerInterval);
        if (actionEl) {
          actionEl.style.display = 'flex';
          actionEl.style.flexDirection = 'column';
          actionEl.style.alignItems = 'center';
          actionEl.style.gap = '12px';
          actionEl.style.animation = 'fadeInUp 0.4s ease';
        }
        if (fillEl) fillEl.classList.add('complete');
        return;
      }
      remaining--;
    };

    update();
    timerInterval = setInterval(update, 1000);
  };

  const renderDownloadPage = async (item, container, settings = {}) => {
    // Increment download count
    const sb = getSupabase();
    if (sb) {
      await sb.from('downloads')
        .update({ download_count: (item.download_count || 0) + 1 })
        .eq('id', item.id);
    }

    container.innerHTML = `
      <div class="download-reveal-page">
        <div class="download-header">
          ${item.featured_image
            ? `<img src="${item.featured_image}" alt="${item.title}" class="download-hero-image" loading="eager">`
            : ''}
          <div class="download-info">
            <div class="download-success-badge">✓ Download Ready</div>
            <h1 class="download-title">${item.title}</h1>
            ${item.description ? `<p class="download-description">${item.description}</p>` : ''}
          </div>
        </div>

        <div class="download-box">
          <div class="download-box__icon">📥</div>
          <h2 class="download-box__title">Your Download is Ready!</h2>
          <div class="download-file-info">
            ${item.file_name ? `<div class="download-file-name"><span>📄</span> ${item.file_name}</div>` : ''}
            <div class="download-file-meta">
              ${item.file_type ? `<span class="download-badge">${item.file_type.toUpperCase()}</span>` : ''}
              ${item.file_size ? `<span class="download-badge">📦 ${item.file_size}</span>` : ''}
            </div>
          </div>
          ${item.file_url
            ? `<a href="${item.file_url}" class="btn btn--download btn--large" download target="_blank" rel="noopener">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22">
                   <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                   <polyline points="7 10 12 15 17 10"/>
                   <line x1="12" y1="15" x2="12" y2="3"/>
                 </svg>
                 Download Now
               </a>
               <p class="download-trouble">Having trouble? <a href="${item.file_url}" target="_blank">Click here for direct link</a></p>`
            : '<p class="error-msg">Download link not available. Please contact support.</p>'}
          
          <div class="download-share-section" id="share-container"></div>
        </div>

        ${item.content ? `
          <div class="download-content prose">
            <h2>About This Download</h2>
            ${item.content}
          </div>` : ''}

        <div id="after-download-ad" data-ad="after_content"></div>

        ${item.preview_images?.length ? `
          <div class="download-previews">
            <h2>Preview</h2>
            <div class="preview-grid">
              ${item.preview_images.map(img =>
                `<img src="${img}" alt="Preview" loading="lazy" class="preview-img">`
              ).join('')}
            </div>
          </div>` : ''}
      </div>`;

    const shareContainer = document.getElementById('share-container');
    if (shareContainer) {
      DEV27_SHARE.renderShareBar(shareContainer, {
        url: `/download.html?slug=${item.slug}`,
        title: item.title,
        image: item.featured_image
      });
    }

    DEV27_ADS.injectAd(DEV27_ADS.LOCATIONS.AFTER_CONTENT, '#after-download-ad');
  };

  // Load downloads listing page
  const loadDownloadsList = async () => {
    const grid = document.getElementById('downloads-grid');
    if (!grid) return;

    const sb = getSupabase();
    if (!sb) return;

    grid.innerHTML = '<div class="downloads-loading"><div class="spinner"></div></div>';

    const { data, error } = await sb.from('downloads')
      .select('id, title, slug, description, featured_image, file_type, file_size, download_count, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error || !data) { grid.innerHTML = '<p class="error-msg">Could not load downloads.</p>'; return; }

    grid.innerHTML = data.length
      ? data.map(item => `
          <article class="download-card">
            <a href="/download.html?slug=${item.slug}" class="download-card__image-link">
              <div class="download-card__image-wrap">
                ${item.featured_image
                  ? `<img src="${item.featured_image}" alt="${item.title}" loading="lazy">`
                  : `<div class="download-card__placeholder"><span>📦</span></div>`}
                ${item.file_type ? `<span class="download-card__badge">${item.file_type.toUpperCase()}</span>` : ''}
              </div>
            </a>
            <div class="download-card__body">
              <h2 class="download-card__title">
                <a href="/download.html?slug=${item.slug}">${item.title}</a>
              </h2>
              ${item.description ? `<p class="download-card__desc">${item.description}</p>` : ''}
              <div class="download-card__meta">
                ${item.file_size ? `<span>📦 ${item.file_size}</span>` : ''}
                ${item.download_count ? `<span>⬇ ${item.download_count.toLocaleString()}</span>` : ''}
              </div>
              <a href="/download.html?slug=${item.slug}" class="btn btn--primary">Free Download</a>
            </div>
          </article>`).join('')
      : '<p class="empty-msg">No downloads available yet.</p>';
  };

  return { loadItem, loadDownloadsList };
})();
