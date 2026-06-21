// dev27 CMS - Admin Common Utilities

const DEV27_ADMIN = (() => {
  // Generate slug from title
  const slugify = (text) =>
    text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Show toast notification
  let toastTimeout;
  const toast = (message, type = 'success', duration = 3500) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="toast__message">${message}</span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Confirm modal
  const confirm = (message, title = 'Confirm') => new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3 class="modal__title">${title}</h3>
        </div>
        <div class="modal__body">
          <p>${message}</p>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn--danger" id="modal-confirm">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('visible'));

    const close = (result) => {
      modal.classList.remove('visible');
      setTimeout(() => modal.remove(), 200);
      resolve(result);
    };
    modal.querySelector('#modal-cancel').addEventListener('click', () => close(false));
    modal.querySelector('#modal-confirm').addEventListener('click', () => close(true));
    modal.addEventListener('click', e => { if (e.target === modal) close(false); });
  });

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file, bucket = 'images') => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const path = `uploads/${fileName}`;

    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');

    const { data, error } = await sb.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (error) throw error;

    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  // Upload file to Supabase Storage (for downloads)
  const uploadDownloadFile = async (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${encodeURIComponent(file.name)}`;
    const path = `downloads/${fileName}`;

    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');

    const { data, error } = await sb.storage.from('downloads').upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (error) throw error;
    const { data: urlData } = sb.storage.from('downloads').getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name, size: formatFileSize(file.size) };
  };

  // Image upload widget
  const initImageUpload = (options = {}) => {
    const {
      dropzoneId,
      previewId,
      inputId,
      urlInputId,
      bucket = 'images',
      onUpload = () => {}
    } = options;

    const dropzone = document.getElementById(dropzoneId);
    const preview = document.getElementById(previewId);
    const fileInput = document.getElementById(inputId);
    const urlInput = document.getElementById(urlInputId);

    if (!dropzone || !fileInput) return;

    const showPreview = (url) => {
      if (!preview) return;
      preview.innerHTML = `<img src="${url}" alt="Preview" style="max-width:100%;max-height:200px;border-radius:8px;">`;
      if (urlInput) urlInput.value = url;
      onUpload(url);
    };

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', async e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (file) handleFileUpload(file);
    });

    const handleFileUpload = async (file) => {
      if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
      dropzone.classList.add('uploading');
      dropzone.querySelector('.dropzone-text').textContent = 'Uploading...';
      try {
        const url = await uploadImage(file, bucket);
        showPreview(url);
        toast('Image uploaded!');
      } catch (e) {
        toast('Upload failed: ' + e.message, 'error');
      } finally {
        dropzone.classList.remove('uploading');
        dropzone.querySelector('.dropzone-text').textContent = 'Click or drag image here';
      }
    };
  };

  // Render admin header user info
  const renderUserInfo = async () => {
    const user = await DEV27_AUTH.getUser();
    const userEl = document.getElementById('admin-user');
    if (userEl && user) {
      userEl.textContent = user.email;
    }
  };

  // Stats card helpers for dashboard
  const loadStats = async () => {
    const sb = getSupabase();
    if (!sb) return;

    const [
      { count: postCount },
      { count: downloadCount },
      { data: viewData }
    ] = await Promise.all([
      sb.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      sb.from('downloads').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      sb.from('posts').select('views').eq('status', 'published')
    ]);

    const totalViews = (viewData || []).reduce((sum, p) => sum + (p.views || 0), 0);

    setStatCard('stat-posts', postCount || 0);
    setStatCard('stat-downloads', downloadCount || 0);
    setStatCard('stat-views', totalViews.toLocaleString());
  };

  const setStatCard = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  // Settings helpers
  const saveSetting = async (key, value) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Not configured');
    const { error } = await sb.from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  };

  const saveSettings = async (settings) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Not configured');
    const rows = Object.entries(settings).map(([key, value]) => ({
      key, value: String(value), updated_at: new Date().toISOString()
    }));
    const { error } = await sb.from('settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    // Clear settings cache
    localStorage.removeItem('dev27_settings_cache');
  };

  const loadSettings = async () => {
    const sb = getSupabase();
    if (!sb) return {};
    const { data } = await sb.from('settings').select('key, value');
    const obj = {};
    (data || []).forEach(r => { obj[r.key] = r.value; });
    return obj;
  };

  return {
    slugify, toast, confirm, formatFileSize, formatDate,
    uploadImage, uploadDownloadFile, initImageUpload,
    renderUserInfo, loadStats, saveSetting, saveSettings, loadSettings
  };
})();
