(() => {
    const platformLabels = {
        steam: 'Steam',
        pc: 'PC',
        switch: 'Switch',
        ds: 'DS',
        wii: 'Wii',
        psp: 'PSP'
    };

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
        const hardTokens = (item.dataset.hard || '').split(/\s+/);
        if (!hardTokens.some(token => ['ds', 'wii', 'psp'].includes(token))) return;

        const thumb = item.querySelector('.game-thumb');
        const img = thumb?.querySelector('img');
        if (!thumb || !img) return;

        thumb.classList.add('is-package');
        const apply = () => thumb.style.setProperty('--thumb-bg', `url("${img.currentSrc || img.src}")`);

        if (img.complete) apply();
        img.addEventListener('load', apply, { once: true });
    }

    window.initGameUi = function initGameUi() {
        document.querySelectorAll('.game-item').forEach(item => {
            setupPlatformTags(item);
            setupThumbnailFrame(item);
        });
    };

    if (document.readyState !== 'loading') {
        window.initGameUi();
    }
})();
