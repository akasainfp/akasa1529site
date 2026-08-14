
(() => {
    const routeWork = new URLSearchParams(window.location.search).get('work');
    let routeLoader = null;
    if (routeWork && document.body) {
        routeLoader = document.createElement('div');
        routeLoader.className = 'archive-route-loader';
        routeLoader.setAttribute('aria-label', 'Loading');
        routeLoader.innerHTML = '<span class="archive-route-spinner" aria-hidden="true"></span>';
        document.body.appendChild(routeLoader);
    }
    function finishRouteLoading() {
        if (!routeLoader) return;
        routeLoader.classList.add('is-hidden');
        window.setTimeout(() => routeLoader?.remove(), 260);
    }

    const defaults = {
        listId: '',
        itemSelector: '',
        titleSelector: '',
        tocSelector: '#toc-list',
        audio: false,
        audioKeys: ['opYoutube', 'themeYoutube', 'youtube', 'youtubeUrl', 'opAudio', 'audio', 'opUrl', 'audioUrl', 'openingAudio'],
        audioLabel: 'OP',
        archiveName: ''
    };

    function visibleItems(track, selector) {
        return Array.from(track.querySelectorAll(selector)).filter(item => !item.classList.contains('hidden'));
    }

    function getClosestIndex(track, items) {
        if (!items.length) return -1;
        const trackRect = track.getBoundingClientRect();
        const center = trackRect.left + track.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        items.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
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

    let youtubeApiPromise = null;

    function loadYoutubeApi() {
        if (window.YT?.Player) return Promise.resolve(window.YT);
        if (youtubeApiPromise) return youtubeApiPromise;
        youtubeApiPromise = new Promise(resolve => {
            const previous = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            document.head.appendChild(script);
        });
        return youtubeApiPromise;
    }

    function youtubeId(value) {
        try {
            const url = new URL(value);
            if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
            if (url.hostname.includes('youtube.com')) {
                if (url.pathname === '/watch') return url.searchParams.get('v') || '';
                const parts = url.pathname.split('/').filter(Boolean);
                const embedIndex = parts.indexOf('embed');
                if (embedIndex >= 0) return parts[embedIndex + 1] || '';
                const shortsIndex = parts.indexOf('shorts');
                if (shortsIndex >= 0) return parts[shortsIndex + 1] || '';
            }
        } catch {}
        return '';
    }

    function createAudioControls(stage, track, itemSelector, keys, labelText) {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.22;
        let enabled = false;
        let currentSrc = '';
        let player = null;
        let playerVideoId = '';
        let playerReady = false;

        const playerHost = document.createElement('div');
        playerHost.className = 'archive-youtube-player';
        playerHost.setAttribute('aria-hidden', 'true');
        stage.appendChild(playerHost);

        const control = document.createElement('div');
        control.className = 'archive-audio-control is-muted';
        control.innerHTML = '<button class="archive-audio-toggle" type="button" aria-pressed="false">' + (labelText || 'OP') + '</button><input class="archive-audio-volume" type="range" min="0" max="100" value="22" aria-label="\u97f3\u91cf"><span class="archive-audio-label">READY</span>';
        stage.appendChild(control);

        const button = control.querySelector('.archive-audio-toggle');
        const volume = control.querySelector('.archive-audio-volume');
        const label = control.querySelector('.archive-audio-label');

        function activeItem() { return track.querySelector(itemSelector + '.is-active') || visibleItems(track, itemSelector)[0]; }
        function pauseAll() { audio.pause(); if (playerReady) player.pauseVideo(); }
        function ensureYoutubePlayer() {
            if (player || !window.YT?.Player) return;
            player = new window.YT.Player(playerHost, { width: '1', height: '1', videoId: '', playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 }, events: { onReady: event => { playerReady = true; event.target.setVolume(Number(volume.value)); if (playerVideoId) event.target.loadVideoById(playerVideoId); if (enabled) event.target.playVideo(); } } });
        }
        function syncAudio() {
            const item = activeItem();
            const src = item ? getAudioSrc(item, keys) : '';
            const videoId = youtubeId(src);
            label.textContent = src ? 'READY' : 'NO MUSIC';
            if (!src) { pauseAll(); currentSrc = ''; return; }
            if (src !== currentSrc) {
                pauseAll(); currentSrc = src;
                if (videoId) {
                    playerVideoId = videoId;
                    loadYoutubeApi().then(() => { ensureYoutubePlayer(); if (player && playerReady) { player.loadVideoById(playerVideoId); player.setVolume(Number(volume.value)); if (!enabled) player.pauseVideo(); } });
                } else audio.src = src;
            }
            if (!enabled) return;
            if (videoId) {
                loadYoutubeApi().then(() => { ensureYoutubePlayer(); if (!player || !playerReady) return; if (playerVideoId !== videoId) { playerVideoId = videoId; player.loadVideoById(videoId); } player.playVideo(); });
            } else audio.play().catch(() => { enabled = false; button.setAttribute('aria-pressed', 'false'); control.classList.add('is-muted'); label.textContent = 'CLICK ' + (labelText || 'OP'); });
        }
        button.addEventListener('click', () => { enabled = !enabled; button.setAttribute('aria-pressed', String(enabled)); control.classList.toggle('is-muted', !enabled); if (enabled) syncAudio(); else pauseAll(); });
        volume.addEventListener('input', () => { audio.volume = Number(volume.value) / 100; if (playerReady) player.setVolume(Number(volume.value)); });
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
        const audioController = config.audio ? createAudioControls(stage, track, config.itemSelector, config.audioKeys, config.audioLabel) : null;
        let activeIndex = 0;
        let scrollTimer = null;
        let programmaticScroll = false;
        let programmaticScrollTimer = null;

        function items() { return visibleItems(track, config.itemSelector); }

        function archiveName() {
            if (config.archiveName) return config.archiveName;
            const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
            const match = path.match(/\/(anime|movie|game)(?:\/|\.html)/i);
            return match ? match[1].toLowerCase() : '';
        }

        function workTitle(item) {
            return item?.querySelector(config.titleSelector)?.textContent?.trim() || item?.id || '';
        }

        function workUrl(item) {
            const name = archiveName();
            if (!name) return '';
            const slug = encodeURIComponent(workTitle(item)).replace(/%20/g, '-');
            return '/' + name + '/' + slug;
        }

        function syncWorkUrl(item) {
            const href = workUrl(item);
            if (!href) return;
            if (window.location.protocol === 'file:') {
                history.replaceState(null, '', '#' + (item?.id || ''));
                return;
            }
            history.replaceState(null, '', href);
        }

        function requestedWork() {
            const query = new URLSearchParams(window.location.search).get('work');
            if (query) return query;
            const name = archiveName();
            const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
            if (!name) return '';
            const prefix = '/' + name + '/';
            if (!path.toLowerCase().startsWith(prefix.toLowerCase())) return '';
            return path.slice(prefix.length).replace(/\/$/, '');
        }

        function initialIndex(currentItems) {
            const requested = requestedWork();
            if (!requested) return -1;
            const normalized = requested.toLowerCase();
            return currentItems.findIndex(item => {
                const title = workTitle(item);
                const slug = encodeURIComponent(title).replace(/%20/g, '-').toLowerCase();
                return item.id.toLowerCase() === normalized || slug === normalized || title.toLowerCase() === normalized;
            });
        }

        function setActive(index, shouldScroll = true, updateUrl = true) {
            const currentItems = items();
            if (!currentItems.length) {
                status.textContent = '00 / 00';
                return;
            }
            activeIndex = Math.max(0, Math.min(index, currentItems.length - 1));
            currentItems.forEach((item, idx) => item.classList.toggle('is-active', idx === activeIndex));
            const active = currentItems[activeIndex];
            if (updateUrl) syncWorkUrl(active);
            status.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(currentItems.length).padStart(2, '0');
            if (toc && active) {
                toc.querySelectorAll('a').forEach(link => {
                    const id = decodeURIComponent(String(link.getAttribute('href') || '').replace(/^#/, ''));
                    link.classList.toggle('is-current', id === active.id);
                });
            }
            if (shouldScroll && active) {
                programmaticScroll = true;
                window.clearTimeout(programmaticScrollTimer);
                active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                programmaticScrollTimer = window.setTimeout(() => {
                    programmaticScroll = false;
                    setActive(activeIndex, false, false);
                }, 500);
            }
            audioController?.syncAudio();
        }
        function refresh() {
            const currentItems = items();
            const current = currentItems.findIndex(item => item.classList.contains('is-active'));
            setActive(current >= 0 ? current : 0, false, false);
        }

        nav.querySelector('[data-slider-prev]').addEventListener('click', () => setActive(activeIndex - 1));
        nav.querySelector('[data-slider-next]').addEventListener('click', () => setActive(activeIndex + 1));

        track.addEventListener('scroll', () => {
            if (programmaticScroll) return;
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
        window.setTimeout(() => {
            refresh();
            const target = initialIndex(items());
            if (target >= 0) setActive(target, true, true);
            finishRouteLoading();
        }, 0);
        return { refresh, setActive };
    }

    window.initArchiveCenterSlider = initArchiveSlider;
})();
