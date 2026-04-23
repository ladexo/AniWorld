/* ============================================================
   THE VAULT — Multi-Project Application Engine
   ============================================================ */

const App = (() => {

  /* ========== HELPERS ========== */
  function qs(sel, ctx = document) { return ctx.querySelector(sel); }
  function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
  function getParam(key) { return new URLSearchParams(location.search).get(key); }
  function getProject(id) { return CONFIG.projects.find(p => p.id === id) || null; }
  function isImageProject(type) { return ['manga','graphic-novel','comic','webtoon'].includes(type); }

  /* ========== THEME ========== */
  const Theme = {
    KEY: 'vault-theme',
    init() {
      const saved = localStorage.getItem(this.KEY) || 'dark';
      this.apply(saved);
      const btn = qs('#themeToggle');
      if (btn) btn.addEventListener('click', () => this.toggle());
    },
    apply(t) {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(this.KEY, t);
      const btn = qs('#themeToggle');
      if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
    },
    toggle() {
      const cur = document.documentElement.getAttribute('data-theme');
      this.apply(cur === 'dark' ? 'light' : 'dark');
    }
  };

  /* ========== MOBILE NAV ========== */
  function initMobileNav() {
    const toggle = qs('#navToggle'), links = qs('#navLinks');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    qsa('a', links).forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open'); toggle.textContent = '☰';
    }));
  }

  /* ========== BOOKMARKS (project-aware) ========== */
  const Bookmarks = {
    KEY: 'vault-bookmarks',
    _all() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; } },
    save(projectId, chapterId, page) {
      const all = this._all();
      const k = projectId + '-ch' + chapterId;
      all[k] = { projectId, chapterId, page, ts: Date.now() };
      localStorage.setItem(this.KEY, JSON.stringify(all));
    },
    get(projectId, chapterId) {
      return this._all()[projectId + '-ch' + chapterId] || null;
    },
    getLatestForProject(projectId) {
      const all = this._all();
      let latest = null;
      for (const [, v] of Object.entries(all)) {
        if (v.projectId === projectId && (!latest || v.ts > latest.ts)) latest = v;
      }
      return latest;
    },
    getLatestGlobal() {
      const all = this._all();
      let latest = null;
      for (const [, v] of Object.entries(all)) {
        if (!latest || v.ts > latest.ts) latest = v;
      }
      return latest;
    }
  };

  /* ========== TOAST ========== */
  function toast(msg, type = 'info') {
    const c = qs('#toastContainer'); if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    const icons = { success: '✅', info: 'ℹ️', error: '❌' };
    t.innerHTML = '<span class="toast-icon">' + (icons[type]||'ℹ️') + '</span> ' + msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  /* ========== SHARE MODAL ========== */
  function initShareModal() {
    const overlay = qs('#shareModal'), close = qs('#shareClose'),
          urlInput = qs('#shareUrl'), copyBtn = qs('#copyLink');
    if (!overlay) return;
    close && close.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
    copyBtn && copyBtn.addEventListener('click', () => {
      urlInput.select(); navigator.clipboard.writeText(urlInput.value).then(() => toast('Link copied!', 'success'));
    });
    qsa('.share-btn', overlay).forEach(btn => {
      btn.addEventListener('click', () => {
        const url = encodeURIComponent(urlInput.value);
        const title = encodeURIComponent(document.title);
        const map = {
          twitter:  'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
          whatsapp: 'https://wa.me/?text=' + title + '%20' + url,
          facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
          reddit:   'https://reddit.com/submit?url=' + url + '&title=' + title
        };
        const p = btn.dataset.platform;
        if (map[p]) window.open(map[p], '_blank', 'width=600,height=400');
      });
    });
  }
  function openShare(url) {
    const overlay = qs('#shareModal'), urlInput = qs('#shareUrl');
    if (!overlay) return;
    urlInput && (urlInput.value = url || location.href);
    overlay.classList.add('active');
  }

  /* ========== PROJECT GRID (index.html) ========== */
  function renderProjectGrid(containerId) {
    const container = qs('#' + containerId); if (!container) return;
    container.innerHTML = '';
    CONFIG.projects.forEach(p => {
      const published = p.chapters.filter(c => c.status === 'published').length;
      const card = document.createElement('a');
      card.href = 'project.html?id=' + p.id;
      card.className = 'project-card animate-in';
      card.dataset.type = p.type;
      card.innerHTML =
        '<div class="project-card-cover">' +
          '<img src="' + p.cover + '" alt="' + p.title + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<span class=placeholder>' + p.title.charAt(0) + '</span>\';">' +
        '</div>' +
        '<div class="project-card-info">' +
          '<span class="project-card-type type-' + p.type + '">' + p.type.replace('-',' ') + '</span>' +
          '<h3 class="project-card-title">' + p.title + '</h3>' +
          '<p class="project-card-desc">' + p.description + '</p>' +
          '<div class="project-card-footer">' +
            '<span>' + published + ' chapter' + (published !== 1 ? 's' : '') + '</span>' +
            '<span class="status-badge status-' + p.status + '">' + p.status + '</span>' +
          '</div>' +
        '</div>';
      container.appendChild(card);
    });
  }

  /* ========== FILTERS (index.html) ========== */
  function initFilters(barId, gridId, emptyId) {
    const bar = qs('#' + barId), grid = qs('#' + gridId), empty = qs('#' + emptyId);
    if (!bar || !grid) return;
    qsa('.filter-btn', bar).forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('.filter-btn', bar).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        const cards = qsa('.project-card', grid);
        let shown = 0;
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.type === filter;
          card.style.display = match ? '' : 'none';
          if (match) shown++;
        });
        if (empty) empty.style.display = shown === 0 ? '' : 'none';
      });
    });
  }

  /* ========== PROJECT PAGE (project.html) ========== */
  function renderProjectPage() {
    const id = getParam('id'); if (!id) { location.href = 'index.html'; return; }
    const p = getProject(id); if (!p) { location.href = 'index.html'; return; }

    document.title = p.title + ' — The Vault';

    // Cover
    const coverEl = qs('#projectCover');
    if (coverEl) {
      coverEl.innerHTML = '<img src="' + p.cover + '" alt="' + p.title + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<span style=font-family:var(--font-display);font-size:3rem;color:var(--text-muted);opacity:.3>' + p.title.charAt(0) + '</span>\';">';
    }

    // Badges
    const badges = qs('#projectBadges');
    if (badges) {
      badges.innerHTML = '<span class="project-card-type type-' + p.type + '">' + p.type.replace('-',' ') + '</span>' +
        '<span class="status-badge status-' + p.status + '">' + p.status + '</span>';
    }

    // Title, desc
    const titleEl = qs('#projectTitle'); if (titleEl) titleEl.textContent = p.title;
    const descEl = qs('#projectDesc'); if (descEl) descEl.textContent = p.description;

    // Genres
    const genreEl = qs('#projectGenres');
    if (genreEl && p.genre) {
      genreEl.innerHTML = p.genre.map(g => '<span class="genre-tag">' + g + '</span>').join('');
    }

    // Stats
    const statsEl = qs('#projectStats');
    if (statsEl) {
      const published = p.chapters.filter(c => c.status === 'published').length;
      const total = p.chapters.length;
      let statHtml = '<span><strong>' + published + '</strong> / ' + total + ' chapters</span>';
      if (isImageProject(p.type)) {
        const totalPages = p.chapters.reduce((sum, c) => sum + (c.pageCount || 0), 0);
        statHtml += '<span><strong>' + totalPages + '</strong> pages</span>';
      } else {
        const totalWords = p.chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
        if (totalWords) statHtml += '<span><strong>' + totalWords.toLocaleString() + '</strong> words</span>';
      }
      statsEl.innerHTML = statHtml;
    }

    // Actions
    const actionsEl = qs('#projectActions');
    if (actionsEl) {
      const firstPublished = p.chapters.find(c => c.status === 'published');
      if (firstPublished) {
        const readerUrl = 'reader.html?project=' + p.id + '&ch=' + firstPublished.id + '&pg=1';
        actionsEl.innerHTML =
          '<a href="' + readerUrl + '" class="btn btn-primary btn-small">📖 Start Reading</a>' +
          '<button class="btn btn-secondary btn-small" onclick="App.openShare()">↗ Share</button>';
      }
    }

    // Continue Banner
    const bm = Bookmarks.getLatestForProject(p.id);
    if (bm) {
      const ch = p.chapters.find(c => c.id === bm.chapterId);
      if (ch && ch.status === 'published') {
        const banner = qs('#continueBanner');
        const cTitle = qs('#continueTitle');
        const cDetail = qs('#continueDetail');
        const cBtn = qs('#continueBtn');
        if (banner) {
          banner.classList.remove('hidden');
          if (cTitle) cTitle.textContent = ch.title;
          if (cDetail) {
            cDetail.textContent = isImageProject(p.type)
              ? 'Page ' + bm.page + ' of ' + (ch.pageCount || '?')
              : 'Scroll position saved';
          }
          if (cBtn) cBtn.href = 'reader.html?project=' + p.id + '&ch=' + bm.chapterId + '&pg=' + (bm.page || 1);
        }
      }
    }

    // Chapter List
    const listEl = qs('#chapterList');
    if (listEl) {
      listEl.innerHTML = '';
      p.chapters.forEach(ch => {
        const row = document.createElement('div');
        row.className = 'chapter-row animate-in' + (ch.status === 'coming-soon' ? ' coming-soon' : '');
        const progress = Bookmarks.get(p.id, ch.id);
        let metaHtml = '';
        if (ch.status === 'published') {
          if (isImageProject(p.type)) metaHtml = (ch.pageCount || 0) + ' pages';
          else if (ch.wordCount) metaHtml = ch.wordCount.toLocaleString() + ' words';
          if (ch.date) metaHtml += (metaHtml ? ' · ' : '') + formatDate(ch.date);
          if (progress && isImageProject(p.type)) {
            const pct = Math.round((progress.page / (ch.pageCount || 1)) * 100);
            metaHtml += ' · <strong style="color:var(--success);">' + pct + '% read</strong>';
          }
        }
        row.innerHTML =
          '<span class="chapter-row-num">' + ch.id + '</span>' +
          '<div class="chapter-row-info">' +
            '<p class="chapter-row-title">' + ch.title + '</p>' +
            '<p class="chapter-row-sub">' + (ch.subtitle || '') +
              (ch.description ? ' — ' + ch.description : '') + '</p>' +
          '</div>' +
          (ch.status === 'coming-soon'
            ? '<span class="chapter-row-badge">Coming Soon</span>'
            : '<span class="chapter-row-meta">' + metaHtml + '</span>');

        if (ch.status === 'published') {
          row.addEventListener('click', () => {
            const pg = progress ? progress.page : 1;
            location.href = 'reader.html?project=' + p.id + '&ch=' + ch.id + '&pg=' + pg;
          });
        }
        listEl.appendChild(row);
      });
    }
  }

  function formatDate(str) {
    try {
      const d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return str; }
  }

  /* ========== UNIVERSAL READER (reader.html) ========== */
  let readerState = { project: null, chapter: null, page: 1, totalPages: 1, fontSize: 1.1 };

  function initReader() {
    const projectId = getParam('project');
    const chId = parseInt(getParam('ch'));
    const pg = parseInt(getParam('pg')) || 1;
    if (!projectId || !chId) { location.href = 'index.html'; return; }

    const project = getProject(projectId);
    if (!project) { location.href = 'index.html'; return; }
    const chapter = project.chapters.find(c => c.id === chId);
    if (!chapter || chapter.status !== 'published') { location.href = 'project.html?id=' + projectId; return; }

    readerState.project = project;
    readerState.chapter = chapter;
    readerState.page = pg;

    document.title = chapter.title + ' — ' + project.title;

    // Back link
    const backBtn = qs('#backToProject');
    if (backBtn) backBtn.href = 'project.html?id=' + projectId;

    // Title
    const titleEl = qs('#readerTitle');
    if (titleEl) titleEl.textContent = project.title + ' · ' + chapter.title;

    // Bookmark button
    const bmBtn = qs('#bookmarkBtn');
    if (bmBtn) bmBtn.addEventListener('click', () => {
      Bookmarks.save(project.id, chapter.id, readerState.page);
      bmBtn.classList.add('active');
      toast('Bookmarked!', 'success');
    });

    // Share button
    const shareBtn = qs('#shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', () => openShare(location.href));

    // Prev/Next chapter links
    setupChapterNav(project, chapter);

    // Decide mode
    if (isImageProject(project.type)) {
      initImageReader(project, chapter, pg);
    } else {
      initTextReader(project, chapter);
    }
  }

  function setupChapterNav(project, chapter) {
    const chapters = project.chapters.filter(c => c.status === 'published');
    const idx = chapters.findIndex(c => c.id === chapter.id);
    const prevCh = idx > 0 ? chapters[idx - 1] : null;
    const nextCh = idx < chapters.length - 1 ? chapters[idx + 1] : null;

    const prevBtn = qs('#prevChapterBtn');
    const nextBtn = qs('#nextChapterBtn');
    if (prevBtn) {
      if (prevCh) { prevBtn.href = 'reader.html?project=' + project.id + '&ch=' + prevCh.id + '&pg=1'; }
      else { prevBtn.style.visibility = 'hidden'; }
    }
    if (nextBtn) {
      if (nextCh) { nextBtn.href = 'reader.html?project=' + project.id + '&ch=' + nextCh.id + '&pg=1'; }
      else {
        nextBtn.textContent = 'Back to Project';
        nextBtn.href = 'project.html?id=' + project.id;
      }
    }
  }

  /* ---- IMAGE READER ---- */
  function initImageReader(project, chapter, startPage) {
    // Hide text reader, show image reader
    const imgReader = qs('#imageReader');
    const txtReader = qs('#textReader');
    if (txtReader) txtReader.classList.add('hidden');
    if (imgReader) imgReader.classList.remove('hidden');

    readerState.totalPages = chapter.pageCount || 1;
    readerState.page = Math.min(startPage, readerState.totalPages);

    // Determine reading direction for nav
    const rtl = project.readingDirection === 'rtl';

    renderPage();
    autoSaveBookmark();

    // Buttons
    const prevBtn = qs('#prevBtn'), nextBtn = qs('#nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => rtl ? nextPage() : prevPage());
    if (nextBtn) nextBtn.addEventListener('click', () => rtl ? prevPage() : nextPage());

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { rtl ? nextPage() : prevPage(); }
      else if (e.key === 'ArrowRight') { rtl ? prevPage() : nextPage(); }
    });

    // Swipe
    initSwipe(qs('#readerViewport') || qs('#imageReader'), rtl);

    // Preload adjacent pages
    preloadPages(project, chapter, readerState.page);
  }

  function getPageUrl(project, chapter, pageNum) {
    const ext = project.imageExtension || CONFIG.defaultImageExtension || 'webp';
    return 'images/projects/' + project.id + '/ch' + chapter.id + '/page-' + pageNum + '.' + ext;
  }

  function renderPage() {
    const { project, chapter, page, totalPages } = readerState;
    const pageEl = qs('#readerPage');
    const infoEl = qs('#readerPageInfo');
    const progressEl = qs('#progressFill');

    if (pageEl) {
      const url = getPageUrl(project, chapter, page);
      pageEl.classList.add('page-enter');
      pageEl.innerHTML = '<img src="' + url + '" alt="Page ' + page + '" onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=page-placeholder><span class=page-num>' + page + '</span><span class=page-label>Page ' + page + '</span></div>\';">';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => pageEl.classList.remove('page-enter'));
      });
    }
    if (infoEl) infoEl.textContent = page + ' / ' + totalPages;
    if (progressEl) progressEl.style.width = (page / totalPages * 100) + '%';

    // Update URL without reload
    const newUrl = 'reader.html?project=' + project.id + '&ch=' + chapter.id + '&pg=' + page;
    history.replaceState(null, '', newUrl);
  }

  function nextPage() {
    if (readerState.page < readerState.totalPages) {
      readerState.page++;
      renderPage();
      autoSaveBookmark();
      preloadPages(readerState.project, readerState.chapter, readerState.page);
    } else {
      // Auto-advance to next chapter
      const chapters = readerState.project.chapters.filter(c => c.status === 'published');
      const idx = chapters.findIndex(c => c.id === readerState.chapter.id);
      if (idx < chapters.length - 1) {
        const nextCh = chapters[idx + 1];
        location.href = 'reader.html?project=' + readerState.project.id + '&ch=' + nextCh.id + '&pg=1';
      } else {
        toast('End of available chapters', 'info');
      }
    }
  }

  function prevPage() {
    if (readerState.page > 1) {
      readerState.page--;
      renderPage();
      autoSaveBookmark();
    }
  }

  function autoSaveBookmark() {
    const { project, chapter, page } = readerState;
    Bookmarks.save(project.id, chapter.id, page);
    const bmBtn = qs('#bookmarkBtn');
    if (bmBtn) bmBtn.classList.add('active');
  }

  function preloadPages(project, chapter, currentPage) {
    for (let i = 1; i <= 3; i++) {
      const p = currentPage + i;
      if (p <= (chapter.pageCount || 0)) {
        const img = new Image();
        img.src = getPageUrl(project, chapter, p);
      }
    }
  }

  /* ---- SWIPE ---- */
  function initSwipe(el, rtl) {
    if (!el) return;
    let startX = 0, startY = 0, tracking = false;
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    el.addEventListener('touchend', e => {
      if (!tracking) return; tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) { rtl ? prevPage() : nextPage(); }
      else { rtl ? nextPage() : prevPage(); }
    }, { passive: true });
  }

  /* ---- TEXT READER (Light Novels) ---- */
  function initTextReader(project, chapter) {
    const imgReader = qs('#imageReader');
    const txtReader = qs('#textReader');
    const pageInfo = qs('#readerPageInfo');
    if (imgReader) imgReader.classList.add('hidden');
    if (txtReader) txtReader.classList.remove('hidden');
    if (pageInfo) pageInfo.textContent = '';

    // Show font controls
    const fontDown = qs('#fontDownBtn'), fontUp = qs('#fontUpBtn');
    if (fontDown) { fontDown.classList.remove('hidden'); fontDown.addEventListener('click', () => changeFontSize(-0.1)); }
    if (fontUp) { fontUp.classList.remove('hidden'); fontUp.addEventListener('click', () => changeFontSize(0.1)); }

    // Restore font size
    const savedSize = localStorage.getItem('vault-fontsize');
    if (savedSize) { readerState.fontSize = parseFloat(savedSize); }
    applyFontSize();

    // Load chapter content
    const contentEl = qs('#textContent');
    const contentUrl = 'content/' + project.id + '/ch' + chapter.id + '.html';

    fetch(contentUrl)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(html => {
        if (contentEl) contentEl.innerHTML = html;
        // Update progress on scroll
        const progressEl = qs('#progressFill');
        window.addEventListener('scroll', () => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          if (progressEl) progressEl.style.width = Math.min(pct, 100) + '%';
        });
        // Bookmark scroll position
        Bookmarks.save(project.id, chapter.id, 1);
        // Restore scroll if returning
        const bm = Bookmarks.get(project.id, chapter.id);
        if (bm && bm.scrollY) {
          setTimeout(() => window.scrollTo(0, bm.scrollY), 100);
        }
        // Save scroll on leave
        window.addEventListener('beforeunload', () => {
          const all = JSON.parse(localStorage.getItem('vault-bookmarks') || '{}');
          const k = project.id + '-ch' + chapter.id;
          if (all[k]) {
            all[k].scrollY = window.scrollY;
            localStorage.setItem('vault-bookmarks', JSON.stringify(all));
          }
        });
      })
      .catch(() => {
        if (contentEl) contentEl.innerHTML =
          '<div style="text-align:center;padding:60px 20px;">' +
          '<p style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:16px;">Chapter Not Found</p>' +
          '<p style="color:var(--text-muted);">Add your chapter file at:<br><code style="color:var(--tertiary);">' + contentUrl + '</code></p>' +
          '<a href="project.html?id=' + project.id + '" class="btn btn-secondary btn-small" style="margin-top:24px;">← Back to Project</a>' +
          '</div>';
      });
  }

  function changeFontSize(delta) {
    readerState.fontSize = Math.max(0.8, Math.min(1.8, readerState.fontSize + delta));
    localStorage.setItem('vault-fontsize', readerState.fontSize);
    applyFontSize();
  }

  function applyFontSize() {
    const el = qs('#textContent');
    if (el) el.style.fontSize = readerState.fontSize + 'rem';
  }

  /* ========== SOCIAL LINKS (about.html) ========== */
  function renderSocialLinks(containerId) {
    const container = qs('#' + containerId); if (!container) return;
    const s = CONFIG.social || {};
    const links = [];
    if (s.twitter)   links.push({ icon: '𝕏', label: 'Twitter', url: 'https://twitter.com/' + s.twitter });
    if (s.instagram) links.push({ icon: '📸', label: 'Instagram', url: 'https://instagram.com/' + s.instagram });
    if (s.tiktok)    links.push({ icon: '🎵', label: 'TikTok', url: 'https://tiktok.com/@' + s.tiktok });
    if (s.email)     links.push({ icon: '✉️', label: 'Email', url: 'mailto:' + s.email });
    if (links.length === 0) return;
    container.innerHTML = links.map(l =>
      '<a href="' + l.url + '" target="_blank" class="social-link"><span>' + l.icon + '</span> ' + l.label + '</a>'
    ).join('');
  }

  /* ========== INIT ========== */
  function init() {
    Theme.init();
    initMobileNav();
    initShareModal();
  }

  /* ========== PUBLIC API ========== */
  return {
    init,
    renderProjectGrid,
    initFilters,
    renderProjectPage,
    initReader,
    renderSocialLinks,
    openShare: openShare,
    toast
  };

})();
