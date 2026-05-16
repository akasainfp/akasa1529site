(() => {
    const hardLabels = {
        steam: 'Steam',
        pc: 'PC',
        switch: 'Switch',
        ds: 'DS',
        wii: 'Wii',
        psp: 'PSP'
    };
    const rawgCacheKey = 'akasa1529:rawg:v1:';
    const pending = [];
    let busy = 0;

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function searchTitle(item) {
        return item.getAttribute('data-rawg-query')
            || item.querySelector('.game-title')?.textContent?.trim()
            || '';
    }

    function getCached(query) {
        try {
            const cached = localStorage.getItem(rawgCacheKey + query);
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.savedAt > 1000 * 60 * 60 * 24 * 7) return null;
            return parsed.data;
        } catch {
            return null;
        }
    }

    function setCached(query, data) {
        try {
            localStorage.setItem(rawgCacheKey + query, JSON.stringify({
                savedAt: Date.now(),
                data
            }));
        } catch {
            /* localStorage can be unavailable in some privacy modes. */
        }
    }

    function setupPlatformTags(item) {
        const rating = item.querySelector('.rating');
        if (!rating || rating.parentElement?.classList.contains('game-meta-top')) return;
        const row = document.createElement('div');
        row.className = 'game-meta-top';
        const tags = document.createElement('div');
        tags.className = 'platform-tags';
        const hard = (item.getAttribute('data-hard') || '')
            .split(/\s+/)
            .filter(Boolean);
        tags.innerHTML = hard.map(key => `<span>${escapeHtml(hardLabels[key] || key)}</span>`).join('');
        rating.parentNode.insertBefore(row, rating);
        row.appendChild(tags);
        row.appendChild(rating);
    }

    function ensureRawgMeta(item) {
        let meta = item.querySelector('[data-rawg-meta]');
        if (meta) return meta;
        meta = document.createElement('div');
        meta.className = 'game-rawg-meta';
        meta.setAttribute('data-rawg-meta', '');
        meta.textContent = '情報を取得中';
        const links = item.querySelector('.game-links');
        if (links) {
            links.parentNode.insertBefore(meta, links);
        }
        return meta;
    }

    function setEmptyLink(item, game) {
        const emptyLinks = item.querySelectorAll('.btn-link[href="#"]');
        emptyLinks.forEach(link => {
            if (!game?.url) return;
            link.href = game.url;
            link.textContent = 'RAWG';
        });
    }

    function applyRawg(item, game) {
        const meta = ensureRawgMeta(item);
        if (!game) {
            meta.textContent = '発売日: 不明 / 価格: RAWG非対応';
            item.setAttribute('data-rawg-status', 'missing');
            window.akasaRawgMissingTitles = window.akasaRawgMissingTitles || [];
            window.akasaRawgMissingTitles.push(searchTitle(item));
            return;
        }
        const released = game.released ? game.released.replaceAll('-', '.') : '不明';
        meta.textContent = `発売日: ${released} / 価格: RAWG非対応`;
        setEmptyLink(item, game);
        item.setAttribute('data-rawg-status', 'ready');
    }

    async function fetchRawg(item) {
        const query = searchTitle(item);
        if (!query) return;
        const cached = getCached(query);
        if (cached) {
            applyRawg(item, cached);
            return;
        }
        try {
            const response = await fetch(`/api/rawg/search?q=${encodeURIComponent(query)}`, { cache: 'force-cache' });
            if (!response.ok) throw new Error('RAWG request failed');
            const data = await response.json();
            const game = Array.isArray(data.results) ? data.results[0] : null;
            setCached(query, game);
            applyRawg(item, game);
        } catch {
            applyRawg(item, null);
        }
    }

    function pumpQueue() {
        while (busy < 3 && pending.length) {
            const item = pending.shift();
            busy += 1;
            fetchRawg(item).finally(() => {
                busy -= 1;
                pumpQueue();
            });
        }
    }

    function init() {
        const items = Array.from(document.querySelectorAll('.game-item'));
        items.forEach(item => {
            setupPlatformTags(item);
            ensureRawgMeta(item);
            pending.push(item);
        });
        pumpQueue();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
