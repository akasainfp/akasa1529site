(() => {
    const platformLabels = {
        steam: 'Steam',
        pc: 'PC',
        switch: 'Switch',
        ds: 'DS',
        wii: 'Wii',
        psp: 'PSP'
    };

    const seriesDetails = {
        'yomawari-series': [
            { title: '夜廻', image: 'assets/game/yomawari1.jpg' },
            { title: '深夜廻', image: 'assets/game/yomawari2.jpg' },
            { title: '夜廻三', image: 'assets/game/yomawari3.jpg' }
        ],
        'inazuma-eleven-series': [
            { title: 'イナズマイレブン', image: 'assets/game/inazuma-irebun.jpg' },
            { title: 'イナズマイレブン2 脅威の侵略者', image: 'assets/game/inazuma-irebun.jpg' },
            { title: 'イナズマイレブン3 世界への挑戦!!', image: 'assets/game/inazuma-irebun.jpg' }
        ],
        'monster-hunter-portable': [
            { title: 'モンスターハンターポータブル', image: 'assets/game/monhan.jpg' },
            { title: 'モンスターハンターポータブル 2nd', image: 'assets/game/monhan.jpg' },
            { title: 'モンスターハンターポータブル 3rd', image: 'assets/game/monhan.jpg' }
        ]
    };

    function assetPath(path) {
        const nested = /\/game\/(?:index\.html)?$/i.test(window.location.pathname);
        return nested ? `../${path}` : path;
    }

    function setupPlatformTags(item) {
        const rating = item.querySelector('.rating');
        if (!rating || item.querySelector('.game-meta-top')) return;

        const hard = (item.dataset.hard || '')
            .split(/\s+/)
            .filter(Boolean)
            .map(value => platformLabels[value] || value.toUpperCase());

        const meta = document.createElement('div');
        meta.className = 'game-meta-top';

        const tags = document.createElement('div');
        tags.className = 'platform-tags';

        hard.forEach(label => {
            const tag = document.createElement('span');
            tag.className = 'platform-tag';
            tag.textContent = label;
            tags.appendChild(tag);
        });

        rating.parentNode.insertBefore(meta, rating);
        meta.appendChild(tags);
        meta.appendChild(rating);
    }

    function setupThumbnailFrame(item) {
        const thumb = item.querySelector('.game-thumb');
        const img = thumb?.querySelector('img');
        if (!thumb || !img) return;

        const apply = () => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const ratio = img.naturalWidth / img.naturalHeight;
            if (ratio < 1.05) {
                thumb.classList.add('is-package');
                thumb.style.setProperty('--thumb-bg', `url("${img.currentSrc || img.src}")`);
            }
        };

        if (img.complete) apply();
        img.addEventListener('load', apply, { once: true });
    }

    function setupSeriesDetails(item) {
        const details = seriesDetails[item.id];
        const list = item.querySelector('.series-list');
        if (!details || !list || list.querySelector('.series-grid')) return;

        const oldList = list.querySelector('ul');
        const grid = document.createElement('div');
        grid.className = 'series-grid';

        details.forEach(detail => {
            const card = document.createElement('div');
            card.className = 'series-card';

            const thumb = document.createElement('div');
            thumb.className = 'series-card-thumb';

            const image = document.createElement('img');
            image.src = assetPath(detail.image);
            image.alt = detail.title;
            thumb.appendChild(image);

            const title = document.createElement('div');
            title.className = 'series-card-title';
            title.textContent = detail.title;

            card.appendChild(thumb);
            card.appendChild(title);
            grid.appendChild(card);
        });

        oldList?.remove();
        list.appendChild(grid);
    }

    function initGameUi() {
        document.querySelectorAll('.game-item').forEach(item => {
            setupPlatformTags(item);
            setupThumbnailFrame(item);
            setupSeriesDetails(item);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGameUi);
    } else {
        initGameUi();
    }
})();
