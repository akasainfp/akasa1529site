
(() => {
    const routeWork = new URLSearchParams(window.location.search).get('work');
    const routePath = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
    const hasPathWork = /\/(anime|game|movie)\/[^/]+/i.test(routePath);
    let routeLoader = null;
    if ((routeWork || hasPathWork) && document.body) {
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
        const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>';
        const pauseIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/></svg>';
        const stopIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M320-640v320-320Zm-80 400v-480h480v480H240Zm80-80h320v-320H320v320Z"/></svg>';
        const volumeIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z"/></svg>';
        const externalIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>';
        control.innerHTML = '<button class="archive-audio-action archive-audio-play" type="button" aria-pressed="false" aria-label="Play" title="Play">' + playIcon + '</button><button class="archive-audio-action archive-audio-stop" type="button" aria-label="Stop" title="Stop">' + stopIcon + '</button><button class="archive-audio-action archive-audio-youtube" type="button" aria-label="Open in YouTube" title="Open in YouTube">' + externalIcon + '</button><span class="archive-audio-volume-icon" aria-hidden="true">' + volumeIcon + '</span><input class="archive-audio-volume" type="range" min="0" max="100" value="22" aria-label="Volume"><span class="archive-audio-label">READY</span>';
        stage.appendChild(control);

        const playButton = control.querySelector('.archive-audio-play');
        const stopButton = control.querySelector('.archive-audio-stop');
        const youtubeButton = control.querySelector('.archive-audio-youtube');
        const volume = control.querySelector('.archive-audio-volume');
        const label = control.querySelector('.archive-audio-label');

        function activeItem() { return track.querySelector(itemSelector + '.is-active') || visibleItems(track, itemSelector)[0]; }
        function currentSource() { return getAudioSrc(activeItem(), keys); }
        function updateButtons(src) {
            const available = Boolean(src);
            playButton.disabled = !available;
            stopButton.disabled = !available;
            youtubeButton.disabled = !available;
            playButton.innerHTML = enabled ? pauseIcon : playIcon;
            control.classList.toggle('is-muted', !enabled);
        }
        function pauseAll() { audio.pause(); if (playerReady) player.pauseVideo(); }
        function stopAll() { audio.pause(); audio.currentTime = 0; if (playerReady) player.stopVideo(); }
        function ensureYoutubePlayer() {
            if (player || !window.YT?.Player) return;
            player = new window.YT.Player(playerHost, { width: '1', height: '1', videoId: '', playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 }, events: { onReady: event => { playerReady = true; event.target.setVolume(Number(volume.value)); if (playerVideoId) { if (enabled) event.target.loadVideoById(playerVideoId); else event.target.cueVideoById(playerVideoId); } if (enabled) event.target.playVideo(); }, onStateChange: event => { if (event.data === window.YT.PlayerState.ENDED && enabled && playerVideoId) { event.target.seekTo(0, true); event.target.playVideo(); } } } });
        }
        function syncAudio() {
            const item = activeItem();
            const src = item ? getAudioSrc(item, keys) : '';
            const videoId = youtubeId(src);
            label.textContent = src ? (enabled ? 'PLAYING' : 'READY') : 'NO MUSIC';
            updateButtons(src);
            if (!src) { pauseAll(); currentSrc = ''; return; }
            if (src !== currentSrc) {
                pauseAll(); currentSrc = src;
                if (videoId) {
                    playerVideoId = videoId;
                    loadYoutubeApi().then(() => { ensureYoutubePlayer(); if (player && playerReady) { if (enabled) player.loadVideoById(playerVideoId); else player.cueVideoById(playerVideoId); player.setVolume(Number(volume.value)); } });
                } else audio.src = src;
            }
            if (!enabled) return;
            if (videoId) {
                loadYoutubeApi().then(() => { ensureYoutubePlayer(); if (!player || !playerReady) return; if (playerVideoId !== videoId) { playerVideoId = videoId; player.loadVideoById(videoId); } player.playVideo(); });
            } else audio.play().catch(() => { enabled = false; label.textContent = 'CLICK PLAY'; updateButtons(src); });
        }
        playButton.addEventListener('click', () => {
            if (!currentSource()) return;
            enabled = !enabled;
            updateButtons(currentSource());
            if (enabled) syncAudio(); else { pauseAll(); label.textContent = 'PAUSED'; }
        });
        stopButton.addEventListener('click', () => {
            if (!currentSource()) return;
            enabled = false;
            stopAll();
            label.textContent = 'STOPPED';
            updateButtons(currentSource());
        });
        youtubeButton.addEventListener('click', () => {
            const src = currentSource();
            if (!src) return;
            enabled = false;
            stopAll();
            label.textContent = 'STOPPED';
            updateButtons(src);
            window.open(src, '_blank', 'noopener,noreferrer');
        });
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

        function toggleItemDetails(item) {
            const currentItems = items();
            const index = currentItems.indexOf(item);
            if (index < 0) return;
            currentItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('is-expanded');
                    other.setAttribute('aria-expanded', 'false');
                }
            });
            setActive(index, true);
            const expanded = !item.classList.contains('is-expanded');
            item.classList.toggle('is-expanded', expanded);
            item.setAttribute('aria-expanded', String(expanded));
        }

        function prepareItems() {
            items().forEach(item => {
                item.tabIndex = 0;
                item.setAttribute('role', 'button');
                if (!item.hasAttribute('aria-expanded')) item.setAttribute('aria-expanded', 'false');
                if (item.dataset.detailReady === 'true') return;
                item.dataset.detailReady = 'true';
                item.addEventListener('click', event => {
                    if (event.target.closest('a, button, input, select, textarea')) return;
                    toggleItemDetails(item);
                });
                item.addEventListener('keydown', event => {
                    if (!['Enter', ' '].includes(event.key) || event.target.closest('a, button, input, select, textarea')) return;
                    event.preventDefault();
                    toggleItemDetails(item);
                });
            });
        }

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

        function normalizeWork(value) {
            return decodeURIComponent(String(value || ''))
                .replace(/\/$/, '')
                .replace(/-/g, ' ')
                .trim()
                .toLowerCase();
        }

        function initialIndex(currentItems) {
            const requested = requestedWork();
            if (!requested) return -1;
            const normalized = normalizeWork(requested);
            return currentItems.findIndex(item => {
                const title = workTitle(item);
                const slug = encodeURIComponent(title).replace(/%20/g, '-').toLowerCase();
                return normalizeWork(item.id) === normalized || normalizeWork(slug) === normalized || normalizeWork(title) === normalized;
            });
        }

        function setActive(index, shouldScroll = true, updateUrl = true) {
            const currentItems = items();
            if (!currentItems.length) {
                status.textContent = '00 / 00';
                return;
            }
            const previousActiveIndex = activeIndex;
            activeIndex = Math.max(0, Math.min(index, currentItems.length - 1));
            if (previousActiveIndex !== activeIndex) {
                currentItems.forEach(item => {
                    item.classList.remove('is-expanded');
                    item.setAttribute('aria-expanded', 'false');
                });
            }
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
            prepareItems();
            const currentItems = items();
            const current = currentItems.findIndex(item => item.classList.contains('is-active'));
            setActive(current >= 0 ? current : 0, false, false);
        }

        nav.querySelector('[data-slider-prev]').addEventListener('click', () => setActive(activeIndex - 1));
        nav.querySelector('[data-slider-next]').addEventListener('click', () => setActive(activeIndex + 1));

        track.addEventListener('scroll', () => {
            if (programmaticScroll) return;
            const expanded = track.querySelector('.is-expanded.is-active');
            if (expanded) return;
            window.clearTimeout(scrollTimer);
            scrollTimer = window.setTimeout(() => setActive(getClosestIndex(track, items()), false), 80);
        }, { passive: true });

        track.tabIndex = 0;

        document.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.repeat) return;
            if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
            event.preventDefault();
            setActive(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
        });

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
            prepareItems();
            refresh();
            const target = initialIndex(items());
            if (target >= 0) setActive(target, true, true);
            else if (items().length) setActive(0, true, false);
            finishRouteLoading();
        }, 0);
        return { refresh, setActive };
    }

    window.initArchiveCenterSlider = initArchiveSlider;
})();
