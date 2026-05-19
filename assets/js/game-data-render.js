(() => {
    function assetPath(value) {
        const nested = /\/game\/(?:index\.html)?$/i.test(window.location.pathname);
        if (!value) return '';
        return nested ? `../${value}` : value;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function ratingStars(score) {
        const value = Number(score) || 0;
        return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`;
    }

    function renderLinks(game) {
        const links = Array.isArray(game.links) ? game.links : [];
        const linkHtml = links.map(link => {
            const href = escapeHtml(link.href || '#');
            const label = escapeHtml(link.label || 'LINK');
            const external = href !== '#';
            return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''} class="btn-link">${label}</a>`;
        }).join('');

        const series = game.series && Array.isArray(game.series.items) && game.series.items.length;
        if (!series) return linkHtml;
        return `${linkHtml}<button class="series-toggle" type="button" aria-expanded="false" aria-controls="${escapeHtml(game.id)}-titles" onclick="toggleSeries(this)">TITLES</button>`;
    }

    function renderSeries(game) {
        const series = game.series;
        if (!series || !Array.isArray(series.items) || !series.items.length) return '';
        const items = series.items.map(title => `<li>${escapeHtml(title)}</li>`).join('');
        return `<div class="series-list" id="${escapeHtml(game.id)}-titles"><div class="series-list-title">${escapeHtml(series.title || 'Included titles')}</div><ul>${items}</ul></div>`;
    }

    function renderGame(game) {
        const title = escapeHtml(game.title);
        const thumb = escapeHtml(assetPath(game.thumbnail));
        return `<article class="game-item anim-box" id="${escapeHtml(game.id)}" data-score="${escapeHtml(game.score)}" data-category="${escapeHtml(game.category)}" data-hard="${escapeHtml(game.hard)}">
            <div class="game-thumb">${thumb ? `<img src="${thumb}" alt="${escapeHtml(game.alt || game.title)}">` : '<span>NO IMAGE</span>'}</div>
            <div class="game-info">
                <span class="rating">評価: ${ratingStars(game.score)}</span>
                <h2 class="game-title">${title}</h2>
                <p class="synopsis">${escapeHtml(game.synopsis)}</p>
                <div class="game-links">${renderLinks(game)}</div>
                ${renderSeries(game)}
            </div>
        </article>`;
    }

    window.loadGameData = async function loadGameData() {
        const list = document.getElementById('game-list');
        if (!list) return [];
        const source = list.dataset.source || (/\/game\/(?:index\.html)?$/i.test(window.location.pathname) ? '../game-date.json' : 'game-date.json');
        try {
            const response = await fetch(source, { cache: 'no-store' });
            if (!response.ok) throw new Error(`game data not found: ${response.status}`);
            const games = await response.json();
            list.innerHTML = games.map(renderGame).join('');
            return games;
        } catch (error) {
            list.innerHTML = '<section class="empty-state anim-box"><h2>game-date.json を読み込めませんでした</h2><p>ローカルで確認する場合は簡易サーバー経由で開いてください。</p></section>';
            return [];
        }
    };
})();
