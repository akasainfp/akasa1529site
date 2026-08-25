(() => {
    const list = document.getElementById('anime-list');
    const tocList = document.getElementById('toc-list');
    const script = document.currentScript;
    const dataSrc = script?.dataset.animeSrc || 'anime-data.json';
    const jikanEnabled = script?.dataset.jikan !== 'off';
    const state = { ratings: new Set(), genres: new Set(), items: [] };
    const jikanCacheKey = 'akasa1529:jikan:v2:';
    const jikanQueue = [];
    let jikanBusy = false;

    const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));

    function stars(score) {
        const value = Number(score) || 0;
        return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`;
    }

    function assetUrl(src) {
        if (!src || /^(?:https?:)?\/\//.test(src) || src.startsWith('/')) return src;
        const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
        const nestedAnimePage = /\/anime\/(?:index\.html)?$/i.test(path);
        return nestedAnimePage && src.startsWith('assets/') ? `../${src}` : src;
    }

    function renderItem(item) {
        const genres = Array.isArray(item.genres) ? item.genres.join(' ') : '';
        const image = assetUrl(item.image || '');
        const opYoutube = item.openingTheme?.youtube || item.opYoutube || item.youtube || '';
        const sites = Array.isArray(item.sites) ? item.sites : [];
        const siteLinks = sites.filter(site => site && site.label && site.url).map(site => `
                    <a href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer" class="btn-search site-link">${escapeHtml(site.label)}</a>
                `).join('');
        return `
        <article class="anime-item anim-box" id="${escapeHtml(item.id)}" data-score="${escapeHtml(item.score)}" data-genre="${escapeHtml(genres)}" data-jikan-query="${escapeHtml(item.jikanQuery || item.title)}" data-op-youtube="${escapeHtml(opYoutube)}">
            <div class="anime-thumb"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="lazy"></div>
            <div class="anime-info">
                <span class="rating">評価: ${stars(item.score)}</span>
                <h2 class="anime-title">${escapeHtml(item.title)}</h2>
                <p class="synopsis">${escapeHtml(item.synopsis)}</p>
                <div class="anime-meta" data-jikan-meta>情報を取得中</div>
                <div class="search-links site-links">
                    ${siteLinks}
                </div>
            </div>
        </article>`;
    }

    function sortAnimeByScore() {
        const items = Array.from(list.getElementsByClassName('anime-item'));
        items.sort((a, b) => Number(b.getAttribute('data-score')) - Number(a.getAttribute('data-score')));
        items.forEach(item => list.appendChild(item));
    }

    function generateTOC() {
        tocList.innerHTML = '';
        document.querySelectorAll('.anime-item').forEach(item => {
            if (item.classList.contains('hidden')) return;
            const title = item.querySelector('.anime-title').innerText;
            const score = item.getAttribute('data-score');
            const link = document.createElement('a');
            link.href = `#${item.id}`;
            link.title = title;
            link.innerHTML = `[★${score}] ${escapeHtml(title)}`;
            link.addEventListener('click', event => {
                event.preventDefault();
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                history.replaceState(null, '', `#${item.id}`);
            });
            tocList.appendChild(link);
        });
    }

    function getFilterButtonValue(btn) {
        if (btn.dataset.filterValue) return btn.dataset.filterValue;
        const action = btn.getAttribute('onclick') || '';
        const match = action.match(/\('([^']+)'\)/);
        return match ? match[1] : '';
    }

    function updateFilterButtons(groupIdx, selected) {
        const group = document.querySelectorAll('.filter-group')[groupIdx];
        if (!group) return;
        group.querySelectorAll('.f-btn').forEach(btn => {
            const value = getFilterButtonValue(btn);
            btn.classList.toggle('active', value === 'all' ? selected.size === 0 : selected.has(value));
        });
    }

    function toggleFilter(set, value) {
        if (value === 'all') {
            set.clear();
            return;
        }
        if (set.has(value)) {
            set.delete(value);
            return;
        }
        set.add(value);
    }

    function matchesValue(selected, value) {
        return selected.size === 0 || selected.has(String(value));
    }

    function matchesTokens(selected, value) {
        if (selected.size === 0) return true;
        const tokens = String(value || '').split(/\s+/).filter(Boolean);
        return tokens.some(token => selected.has(token));
    }

    function applyFilters() {
        document.querySelectorAll('.anime-item').forEach(item => {
            const score = item.getAttribute('data-score');
            const genres = item.getAttribute('data-genre') || '';
            const ratingMatch = matchesValue(state.ratings, score);
            const genreMatch = matchesTokens(state.genres, genres);
            item.classList.toggle('hidden', !(ratingMatch && genreMatch));
        });
        generateTOC();
    }

    function getCachedJikan(query) {
        try {
            const cached = localStorage.getItem(jikanCacheKey + query);
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.savedAt > 1000 * 60 * 60 * 24 * 14) return null;
            return parsed.data;
        } catch {
            return null;
        }
    }

    function setCachedJikan(query, data) {
        try {
            localStorage.setItem(jikanCacheKey + query, JSON.stringify({ savedAt: Date.now(), data }));
        } catch {
            /* localStorage may be unavailable in some privacy modes. */
        }
    }

    function applyJikanMeta(article, data) {
        const meta = article.querySelector('[data-jikan-meta]');
        if (!meta) return;
        if (!data) {
            meta.textContent = '情報なし';
            return;
        }
        const parts = [];
        if (data.year) parts.push(data.year);
        if (data.type) parts.push(data.type);
        if (data.episodes) parts.push(`${data.episodes}話`);
        meta.textContent = parts.length ? parts.join(' / ') : '情報なし';
        if (!article.querySelector('.anime-thumb img')?.getAttribute('src') && data.image) {
            article.querySelector('.anime-thumb img').src = data.image;
        }
    }

    function queueJikanForImage(article) {
        if (!jikanEnabled) return;
        if (!article || article.dataset.jikanQueued === 'true') return;
        article.dataset.jikanQueued = 'true';
        jikanQueue.push(article);
        runJikanQueue();
    }

    async function fetchJikan(query) {
        let lastError;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const controller = new AbortController();
                const timeout = window.setTimeout(() => controller.abort(), 12000);
                const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1&sfw=true`, { cache: 'no-store', signal: controller.signal });
                window.clearTimeout(timeout);
                if (!response.ok) throw new Error(`Jikan request failed: ${response.status}`);
                const json = await response.json();
                const hit = json.data?.[0];
                if (!hit) return null;
                return {
                    malId: hit.mal_id,
                    type: hit.type,
                    year: hit.year,
                    episodes: hit.episodes,
                    score: hit.score,
                    image: hit.images?.jpg?.large_image_url || hit.images?.jpg?.image_url || ''
                };
            } catch (error) {
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 2500 * (attempt + 1)));
            }
        }
        throw lastError || new Error('Jikan request failed');
    }

    async function runJikanQueue() {
        if (jikanBusy) return;
        jikanBusy = true;
        while (jikanQueue.length) {
            const article = jikanQueue.shift();
            const query = article.getAttribute('data-jikan-query');
            const cached = getCachedJikan(query);
            if (cached) {
                applyJikanMeta(article, cached);
                continue;
            }
            try {
                const data = await fetchJikan(query);
                setCachedJikan(query, data);
                applyJikanMeta(article, data);
            } catch {
                applyJikanMeta(article, null);
            }
            await new Promise(resolve => setTimeout(resolve, 1800));
        }
        jikanBusy = false;
    }

    function observeJikan() {
        if (!jikanEnabled) return;
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.anime-item').forEach(item => {
                queueJikanForImage(item);
            });
            return;
        }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                const meta = entry.target.querySelector('[data-jikan-meta]');
                if (meta?.textContent === '情報を取得中') queueJikanForImage(entry.target);
            });
        }, { rootMargin: '320px 0px' });
        document.querySelectorAll('.anime-item').forEach(item => {
            const image = item.querySelector('.anime-thumb img');
            if (image) image.addEventListener('error', () => {
                image.removeAttribute('src');
                queueJikanForImage(item);
            }, { once: true });
            observer.observe(item);
        });
    }

    async function init() {
        try {
            let entries = null;
            try {
                const response = await fetch(dataSrc, { cache: 'no-store' });
                if (!response.ok) throw new Error('Anime data not found');
                entries = await response.json();
            } catch {
                entries = Array.isArray(window.AKASA_ANIME_DATA) ? window.AKASA_ANIME_DATA : null;
            }
            if (!entries) throw new Error('Anime data not found');
            state.items = entries;
            list.innerHTML = state.items.map(renderItem).join('');
            sortAnimeByScore();
            generateTOC();
            document.querySelectorAll('.anim-box').forEach(box => window.archiveObserver?.observe(box));
            observeJikan();
            window.animeCenterSlider = window.initArchiveCenterSlider?.({ listId: 'anime-list', itemSelector: '.anime-item', titleSelector: '.anime-title', audio: true });
        } catch {
            list.innerHTML = '<section class="empty-state anim-box"><h2>anime-data.json ???????????</h2><p>?????????????????????????</p></section>';
        }
    }

    window.filterRating = val => {
        toggleFilter(state.ratings, val);
        updateFilterButtons(0, state.ratings);
        applyFilters();
    };

    window.filterGenre = val => {
        toggleFilter(state.genres, val);
        updateFilterButtons(1, state.genres);
        applyFilters();
    };

    window.clearFilters = () => {
        state.ratings.clear();
        state.genres.clear();
        updateFilterButtons(0, state.ratings);
        updateFilterButtons(1, state.genres);
        applyFilters();
    };

    window.toggleFilterDialog = open => {
        const dialog = document.getElementById('filter-dialog');
        if (!dialog) return;
        dialog.classList.toggle('is-open', open);
        dialog.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    function handleFilterControlClick(event) {
        const button = event.target.closest('button');
        if (!button || !button.closest('.filter-dialog, .archive-toolbar')) return;

        const action = button.getAttribute('onclick') || '';
        const value = getFilterButtonValue(button);

        if (button.classList.contains('toc-filter-toggle')) {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.toggleFilterDialog?.(true);
            return;
        }
        if (button.classList.contains('filter-close')) {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.toggleFilterDialog?.(false);
            return;
        }
        if (!button.classList.contains('f-btn')) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (button.dataset.filterAction === 'clear' || action.startsWith('clearFilters')) {
            window.clearFilters();
            return;
        }
        if (!value) return;
        if (button.dataset.filterGroup === 'rating' || action.startsWith('filterRating')) {
            window.filterRating(value);
            return;
        }
        if (button.dataset.filterGroup === 'genre' || action.startsWith('filterGenre')) {
            window.filterGenre(value);
        }
    }

    document.addEventListener('click', handleFilterControlClick, true);
    document.addEventListener('click', event => {
        const dialog = document.getElementById('filter-dialog');
        if (dialog && event.target === dialog) window.toggleFilterDialog(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') window.toggleFilterDialog(false);
    });

    document.addEventListener('DOMContentLoaded', init);
})();
