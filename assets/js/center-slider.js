
(() => {
    const defaults = {
        listId: '',
        itemSelector: '',
        titleSelector: '',
        tocSelector: '#toc-list',
        audio: false,
        audioKeys: ['opAudio', 'audio', 'opUrl', 'audioUrl', 'openingAudio']
    };

    function visibleItems(track, selector) {
        return Array.from(track.querySelectorAll(selector)).filter(item => !item.classList.contains('hidden'));
    }

    function getClosestIndex(track, items) {
        if (!items.length) return -1;
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        items.forEach((item, index) => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const distance = Math.abs(center - itemCenter);
            if (distance < bestDistance) {
                best = index;
                bestDistance = distance;
            }
        });
        return best;
    }

    function getAudioSrc(item, keys) {
        for (const key of keys) {
            const dataKey = key.replace(/[A-Z]/g, match => '-' + match.toLowerCase());
            const value = item.dataset[key] || item.dataset[dataKey] || item.getAttribute('data-' + dataKey);
            if (value) return value;
        }
        return '';
    }

    function createAudioControls(stage, track, itemSelector, keys) {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.22;
        let enabled = false;
        let currentSrc = '';

        const control = document.createElement('div');
        control.className = 'archive-audio-control is-muted';
        control.innerHTML = '<button class="archive-audio-toggle" type="button" aria-pressed="false">OP</button><input class="archive-audio-volume" type="range" min="0" max="100" value="22" aria-label="OP volume"><span class="archive-audio-label">OP READY</span>';
        stage.appendChild(control);

        const button = control.querySelector('.archive-audio-toggle');
        const volume = control.querySelector('.archive-audio-volume');
        const label = control.querySelector('.archive-audio-label');

        function activeItem() {
            return track.querySelector(itemSelector + '.is-active') || visibleItems(track, itemSelector)[0];
        }

        function syncAudio() {
            const item = activeItem();
            const src = item ? getAudioSrc(item, keys) : '';
            label.textContent = src ? 'OP READY' : 'NO OP';
            if (!src) {
                audio.pause();
                currentSrc = '';
                return;
            }
            if (src !== currentSrc) {
                currentSrc = src;
                audio.src = src;
            }
            if (enabled) audio.play().catch(() => {
                enabled = false;
                button.setAttribute('aria-pressed', 'false');
                control.classList.add('is-muted');
                label.textContent = 'CLICK OP';
            });
        }

        button.addEventListener('click', () => {
            enabled = !enabled;
            button.setAttribute('aria-pressed', String(enabled));
            control.classList.toggle('is-muted', !enabled);
            if (enabled) syncAudio();
            else audio.pause();
        });

        volume.addEventListener('input', () => {
            audio.volume = Number(volume.value) / 100;
        });

        return { syncAudio };
    }

    function initArchiveSlider(options) {
        const config = { ...defaults, ...options };
        const track = document.getElementById(config.listId);
        if (!track || track.dataset.sliderReady === 'true') return null;
        track.dataset.sliderReady = 'true';
        track.classList.add('archive-slider-track');

        const stage = document.createElement('div');
        stage.className = 'archive-slider-stage';
        track.parentNode.insertBefore(stage, track);
        stage.appendChild(track);

        const nav = document.createElement('div');
        nav.className = 'archive-slider-nav';
        nav.innerHTML = '<button class="archive-slider-btn" type="button" data-slider-prev aria-label="Previous">&lsaquo;</button><button class="archive-slider-btn" type="button" data-slider-next aria-label="Next">&rsaquo;</button>';
        stage.appendChild(nav);

        const status = document.createElement('div');
        status.className = 'archive-slider-status';
        status.textContent = '00 / 00';
        stage.appendChild(status);

        const toc = document.querySelector(config.tocSelector);
        const audioController = config.audio ? createAudioControls(stage, track, config.itemSelector, config.audioKeys) : null;
        let activeIndex = 0;
        let scrollTimer = null;

        function items() { return visibleItems(track, config.itemSelector); }

        function setActive(index, shouldScroll = true) {
            const currentItems = items();
            if (!currentItems.length) {
                status.textContent = '00 / 00';
                return;
            }
            activeIndex = Math.max(0, Math.min(index, currentItems.length - 1));
            currentItems.forEach((item, idx) => item.classList.toggle('is-active', idx === activeIndex));
            const active = currentItems[activeIndex];
            status.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(currentItems.length).padStart(2, '0');
            if (toc && active) {
                toc.querySelectorAll('a').forEach(link => {
                    const id = decodeURIComponent(String(link.getAttribute('href') || '').replace(/^#/, ''));
                    link.classList.toggle('is-current', id === active.id);
                });
            }
            if (shouldScroll && active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            audioController?.syncAudio();
        }

        function refresh() {
            const currentItems = items();
            const current = currentItems.findIndex(item => item.classList.contains('is-active'));
            setActive(current >= 0 ? current : 0, false);
        }

        nav.querySelector('[data-slider-prev]').addEventListener('click', () => setActive(activeIndex - 1));
        nav.querySelector('[data-slider-next]').addEventListener('click', () => setActive(activeIndex + 1));

        track.addEventListener('scroll', () => {
            window.clearTimeout(scrollTimer);
            scrollTimer = window.setTimeout(() => setActive(getClosestIndex(track, items()), false), 80);
        }, { passive: true });

        track.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') setActive(activeIndex - 1);
            if (event.key === 'ArrowRight') setActive(activeIndex + 1);
        });
        track.tabIndex = 0;

        if (toc) {
            toc.addEventListener('click', event => {
                const link = event.target.closest('a[href^="#"]');
                if (!link) return;
                const targetId = decodeURIComponent(link.getAttribute('href').slice(1));
                const index = items().findIndex(item => item.id === targetId);
                if (index < 0) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                history.replaceState(null, '', '#' + targetId);
                setActive(index);
            }, true);
        }

        const observer = new MutationObserver(refresh);
        observer.observe(track, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', () => setActive(activeIndex, false));
        window.setTimeout(refresh, 0);
        return { refresh, setActive };
    }

    window.initArchiveCenterSlider = initArchiveSlider;
})();
