(() => {
  const root = document.querySelector('[data-music-page]');
  if (!root) return;
  const dataUrl = root.dataset.musicData || '/music-data.json';
  const artistsUrl = root.dataset.artistsData || '/music-artists.json';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const image = value => value ? `<img class="music-thumb" src="${escape(value)}" alt="" loading="lazy">` : '<div class="music-thumb music-thumb is-missing">NO IMAGE</div>';
  const youtubeId = value => { const match = String(value || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/))([^?&/]+)/i); return match ? match[1] : String(value || '').match(/^[\w-]{6,}$/)?.[0] || ''; };
  const tags = item => (item.tags || []).map(tag => `<span class="music-tag">${escape(tag)}</span>`).join('');
  const action = (url, label) => url ? `<a class="music-button" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';

  function card(item) {
    const id = youtubeId(item.youtube || item.youtubeId);
    return `<article class="music-card" data-youtube-id="${escape(id)}">
      ${image(item.thumbnail)}
      <div class="music-card-head"><div><h2>${escape(item.title)}</h2><p class="music-artist">${escape(item.artist)}</p></div>${item.added ? `<span class="music-meta">${escape(item.added)}</span>` : ''}</div>
      <p class="music-comment">${escape(item.comment || '')}</p><div class="music-tags">${tags(item)}</div>
      <div class="music-actions">${id ? '<button class="music-button" type="button" data-youtube-open>YOUTUBE</button>' : ''}${action(item.spotify, 'SPOTIFY')}</div>
      <div class="music-player"><iframe title="${escape(item.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe><button class="music-button music-close" type="button" data-youtube-close>閉じる</button></div>
    </article>`;
  }
  function setGrid(items) { const grid = root.querySelector('[data-music-grid]'); if (!grid) return; grid.innerHTML = items.length ? items.map(card).join('') : '<div class="music-empty">該当する曲がありません。</div>'; const status = root.querySelector('[data-music-status]'); if (status) status.textContent = `${items.length} TRACKS`; }
  function sorted(items) { return [...items].sort((a,b) => String(b.added || '').localeCompare(String(a.added || ''))); }
  function initMain(items) {
    const tabs = [...root.querySelectorAll('[data-music-filter]')];
    const apply = filter => { tabs.forEach(t => t.classList.toggle('is-active', t.dataset.musicFilter === filter)); setGrid(filter === 'favorite' ? sorted(items.filter(x => x.favorite)) : filter === 'otomad' ? sorted(items.filter(x => x.type === 'otomad')) : sorted(items)); };
    tabs.forEach(tab => tab.addEventListener('click', () => apply(tab.dataset.musicFilter)));
    apply('new');
  }
  function initArchive(items) {
    const search = root.querySelector('[data-music-search]'), filter = root.querySelector('[data-music-type]'), sort = root.querySelector('[data-music-sort]');
    const render = () => { let list = items.filter(x => `${x.title} ${x.artist}`.toLowerCase().includes((search.value || '').toLowerCase())); if (filter.value) list = list.filter(x => (x.type || '') === filter.value); const mode = sort.value; list.sort((a,b) => mode === 'title' ? String(a.title).localeCompare(String(b.title),'ja') : mode === 'artist' ? String(a.artist).localeCompare(String(b.artist),'ja') : mode === 'old' ? String(a.added||'').localeCompare(String(b.added||'')) : String(b.added||'').localeCompare(String(a.added||''))); const listEl = root.querySelector('[data-music-archive-list]'); listEl.innerHTML = list.length ? list.map(x => `<article class="music-archive-item"><img src="${escape(x.thumbnail || '')}" alt="" loading="lazy"><div><h2>${escape(x.title)}</h2><p>${escape(x.artist)}</p></div><span class="music-meta">${escape(x.added || '')}</span></article>`).join('') : '<div class="music-empty">該当する曲がありません。</div>'; };
    [search, filter, sort].forEach(el => el.addEventListener('input', render)); render();
  }
  function initArtists(items) { const search = root.querySelector('[data-artist-search]'), grid = root.querySelector('[data-artist-grid]'); const render = () => { const q = (search.value || '').toLowerCase(); const list = items.filter(x => `${x.name} ${x.note || ''}`.toLowerCase().includes(q)); grid.innerHTML = list.length ? list.map(x => { const inner = `<img src="${escape(x.image || '')}" alt="" loading="lazy"><h2>${escape(x.name)}</h2><p>${escape(x.note || '')}</p>`; return x.url ? `<a class="music-artist-card" href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : `<article class="music-artist-card">${inner}</article>`; }).join('') : '<div class="music-empty">該当するアーティストがありません。</div>'; }; search.addEventListener('input', render); render(); }
  document.addEventListener('click', event => { const open = event.target.closest('[data-youtube-open]'), close = event.target.closest('[data-youtube-close]'); if (open) { const card = open.closest('.music-card'), id = card.dataset.youtubeId, frame = card.querySelector('iframe'); if (id && frame) { frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`; card.classList.add('is-open'); } } if (close) { const card = close.closest('.music-card'), frame = card.querySelector('iframe'); frame.src = ''; card.classList.remove('is-open'); } });
  Promise.all([fetch(dataUrl).then(r => r.json()), fetch(artistsUrl).then(r => r.json()).catch(() => [])]).then(([items, artists]) => { const kind = root.dataset.musicView || 'main'; if (kind === 'archive') initArchive(items); else if (kind === 'artists') initArtists(artists); else initMain(items); }).catch(() => { const target = root.querySelector('[data-music-grid], [data-music-archive-list], [data-artist-grid]'); if (target) target.innerHTML = '<div class="music-empty">音楽情報を読み込めませんでした。</div>'; });
})();
