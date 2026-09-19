(() => {
    'use strict';
    const isProfile = /^\/akasa1529\/(?:index\.html)?$/.test(location.pathname);
    const TITLE = { deleteDelay: 180, typeDelay: 220, minPause: 500, fullPause: 1800 };
    const SPARKLE = { lifetime: [420, 680], spacing: 18, mobileSpacing: 26, purple: .2, clickPurple: .55, radius: 10, sizes: [2.2, 4], max: 96, mobileMax: 48 };

    function titleLoop() {
        const name = 'Akasa1529'; let length = name.length, direction = -1, timer;
        const tick = () => {
            length += direction; document.title = name.slice(0, length);
            let delay = direction < 0 ? TITLE.deleteDelay : TITLE.typeDelay;
            if (length === 1) { direction = 1; delay = TITLE.minPause; }
            if (length === name.length) { direction = -1; delay = TITLE.fullPause; }
            timer = setTimeout(tick, delay);
        };
        document.title = name; timer = setTimeout(tick, TITLE.fullPause);
        window.addEventListener('pagehide', () => clearTimeout(timer));
        window.addEventListener('pageshow', e => { if (e.persisted) { clearTimeout(timer); length = name.length; direction = -1; document.title = name; timer = setTimeout(tick, TITLE.fullPause); } });
    }

    function magnetic() {
        const fine = matchMedia('(hover: hover) and (pointer: fine)');
        const reduce = matchMedia('(prefers-reduced-motion: reduce)');
        document.querySelectorAll('.profile-social').forEach(link => {
            link.addEventListener('pointermove', event => {
                if (!fine.matches || reduce.matches) return;
                const r = link.getBoundingClientRect();
                link.style.setProperty('--mag-x', `${Math.max(-2.5, Math.min(2.5, (event.clientX - r.left - r.width / 2) * .12))}px`);
                link.style.setProperty('--mag-y', `${Math.max(-2.5, Math.min(2.5, (event.clientY - r.top - r.height / 2) * .12))}px`);
            });
            const reset = () => { link.style.removeProperty('--mag-x'); link.style.removeProperty('--mag-y'); };
            link.addEventListener('pointerleave', reset); reduce.addEventListener('change', reset);
        });
    }

    function sparkle() {
        const canvas = document.querySelector('[data-sparkle-canvas]'), ctx = canvas?.getContext('2d');
        if (!ctx) return;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)');
        const sprites = new Map();
        const spriteFor = (color, size, rayed) => {
            const key = `${color}-${size}-${rayed}`;
            if (sprites.has(key)) return sprites.get(key);
            const extent = Math.ceil(size * 6 + 6), scale = 2;
            const sprite = document.createElement('canvas'); sprite.width = extent * scale; sprite.height = extent * scale;
            const pen = sprite.getContext('2d'); pen.scale(scale, scale); pen.translate(extent / 2, extent / 2);
            pen.fillStyle = color; pen.strokeStyle = color; pen.shadowColor = color; pen.shadowBlur = size * 1.7;
            if (rayed) {
                pen.lineWidth = Math.max(.55, size * .16); pen.beginPath();
                pen.moveTo(-size, 0); pen.lineTo(size, 0); pen.moveTo(0, -size); pen.lineTo(0, size); pen.stroke();
            }
            pen.beginPath(); pen.arc(0, 0, Math.max(.55, size * .24), 0, Math.PI * 2); pen.fill();
            const result = { canvas: sprite, extent }; sprites.set(key, result); return result;
        };
        let particles = [], frame = 0, lastPoint = null, width = 0, height = 0;
        const resize = () => {
            width = innerWidth; height = innerHeight;
            const dpr = Math.min(devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const clear = () => { cancelAnimationFrame(frame); frame = 0; particles = []; lastPoint = null; ctx.clearRect(0, 0, width, height); };
        const draw = now => {
            ctx.clearRect(0, 0, width, height);
            particles = particles.filter(p => now - p.born < p.life);
            for (const p of particles) {
                const age = (now - p.born) / p.life, distance = 1 - (1 - age) ** 2.4;
                const x = p.x + p.dx * distance, y = p.y + p.dy * distance;
                if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;
                ctx.save(); ctx.translate(x, y); ctx.rotate(p.angle + age * .12);
                const alpha = age < .1 ? age / .1 : (1 - age) ** 1.35;
                const scale = 1 - age * .55, sprite = spriteFor(p.color, p.size, p.rayed);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = alpha;
                ctx.scale(scale, scale);
                ctx.drawImage(sprite.canvas, -sprite.extent / 2, -sprite.extent / 2, sprite.extent, sprite.extent);
                ctx.restore();
            }
            frame = particles.length ? requestAnimationFrame(draw) : 0;
        };
        const spawn = (x, y, purple, mobile) => {
            if (reduce.matches || document.hidden) return;
            const angle = Math.random() * Math.PI * 2, radius = Math.random() * SPARKLE.radius;
            const max = mobile ? SPARKLE.mobileMax : SPARKLE.max;
            if (particles.length >= max) particles.shift();
            const origin = Math.random() * 3.5, originAngle = Math.random() * Math.PI * 2;
            particles.push({ x: x + Math.cos(originAngle) * origin, y: y + Math.sin(originAngle) * origin, born: performance.now(), life: SPARKLE.lifetime[0] + Math.random() * (SPARKLE.lifetime[1] - SPARKLE.lifetime[0]), dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius, angle, size: SPARKLE.sizes[Math.random() < .78 ? 0 : 1], rayed: Math.random() < .46, color: Math.random() < purple ? '#b49aff' : '#f4f1ff' });
            if (!frame) frame = requestAnimationFrame(draw);
        };
        const emit = (x, y, purple, mobile, count = Math.random() < .35 ? 3 : 2) => { for (let i = 0; i < count; i++) spawn(x, y, purple, mobile); };
        document.addEventListener('pointermove', e => {
            const mobile = e.pointerType !== 'mouse', point = { x: e.clientX, y: e.clientY, id: e.pointerId };
            if (reduce.matches) return;
            if (!lastPoint || lastPoint.id !== point.id) { lastPoint = point; emit(point.x, point.y, SPARKLE.purple, mobile); return; }
            const dx = point.x - lastPoint.x, dy = point.y - lastPoint.y, distance = Math.hypot(dx, dy);
            const spacing = mobile ? SPARKLE.mobileSpacing : SPARKLE.spacing;
            const count = Math.min(5, Math.floor(distance / spacing));
            if (!count) return;
            for (let i = 1; i <= count; i++) emit(lastPoint.x + dx * i / count, lastPoint.y + dy * i / count, SPARKLE.purple, mobile);
            lastPoint = point;
        }, { passive: true });
        document.addEventListener('pointerdown', e => { emit(e.clientX, e.clientY, SPARKLE.clickPurple, e.pointerType !== 'mouse', e.pointerType === 'mouse' ? 6 : 4); lastPoint = { x: e.clientX, y: e.clientY, id: e.pointerId }; }, { passive: true });
        document.addEventListener('pointercancel', () => { lastPoint = null; });
        document.addEventListener('pointerout', e => { if (!e.relatedTarget) lastPoint = null; });
        document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
        reduce.addEventListener('change', clear); window.addEventListener('resize', resize); window.addEventListener('pagehide', clear); resize();
    }

    let youtubeApiPromise = null;
    function loadYoutubeApi() {
        if (window.YT?.Player) return Promise.resolve(window.YT);
        if (youtubeApiPromise) return youtubeApiPromise;
        youtubeApiPromise = new Promise(resolve => {
            const previous = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
            const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
            if (!existing) {
                const script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                script.async = true;
                document.head.appendChild(script);
            }
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
                const index = parts.findIndex(part => part === 'embed' || part === 'shorts');
                return index >= 0 ? parts[index + 1] || '' : '';
            }
        } catch {}
        return '';
    }

    function music(config) {
        const videoId = youtubeId(config?.youtube?.url || '');
        if (!isProfile || !config?.enabled || config.source !== 'youtube' || !videoId) return;
        const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
        const startVolume = clamp(config.startVolume ?? 0);
        const target = clamp(config.targetVolume ?? 60);
        const trackLabel = [config.title, config.artist].filter(Boolean).join(' - ') || 'BGM';
        const host = document.createElement('div'); host.className = 'profile-youtube-player'; host.setAttribute('aria-hidden', 'true');
        const playerMount = document.createElement('div'); host.append(playerMount);
        const ui = document.createElement('div'); ui.className = 'profile-audio-ui';
        const credit = document.createElement('div'); credit.className = 'profile-audio-credit';
        const title = document.createElement('strong'); title.className = 'profile-audio-title'; title.textContent = config.title || 'BGM';
        const creator = document.createElement('span'); creator.className = 'profile-audio-creator'; creator.textContent = config.credit || config.artist || '';
        credit.append(title, creator);
        if (config.creditUrl) { const link = document.createElement('a'); link.href = config.creditUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Piapro'; credit.append(link); }
        const controls = document.createElement('div'); controls.className = 'profile-volume';
        controls.title = trackLabel; controls.setAttribute('aria-label', trackLabel);
        controls.innerHTML = '<button type="button" aria-label="Unmute BGM" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z"/><path class="volume-waves" d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/><path class="volume-muted" d="m16 9 5 6m0-6-5 6"/></svg></button><input type="range" min="0" max="100" value="0" aria-label="BGM volume">';
        ui.append(credit, controls); document.body.append(host, ui);
        const button = controls.querySelector('button'), slider = controls.querySelector('input');
        let player = null, fade = 0, playbackWatch = 0, volume = startVolume, saved = target || 60;
        let playerReady = false, playRequested = false, playingConfirmed = false, fadeStarted = false, manual = false, interactionSeen = false, disposed = false;
        const sync = () => { slider.value = String(Math.round(volume)); button.setAttribute('aria-pressed', String(volume === 0)); button.setAttribute('aria-label', volume === 0 ? 'Unmute BGM' : 'Mute BGM'); controls.classList.toggle('is-muted', volume === 0); };
        const setVolume = value => { volume = clamp(value); if (playerReady) player?.setVolume(volume); sync(); };
        const cancelFade = () => { clearInterval(fade); fade = 0; };
        const stopPlaybackWatch = () => { clearInterval(playbackWatch); playbackWatch = 0; };
        const beginFade = () => {
            if (manual || fadeStarted || disposed) return;
            fadeStarted = true; const start = performance.now(), duration = Math.max(0, Number(config.fadeDuration) || 0);
            const from = startVolume;
            cancelFade();
            fade = setInterval(() => { const t = duration ? Math.min(1, (performance.now() - start) / duration) : 1; const eased = t * t * (3 - 2 * t); setVolume(from + (target - from) * eased); if (t === 1) cancelFade(); }, 50);
        };
        const verifyPlayback = () => {
            if (disposed || fadeStarted || !playingConfirmed || !playerReady || Number(player?.getCurrentTime?.()) <= 0.05) return;
            stopPlaybackWatch();
            beginFade();
        };
        const watchPlayback = () => {
            if (playbackWatch || fadeStarted || disposed) return;
            verifyPlayback();
            if (!fadeStarted) playbackWatch = setInterval(verifyPlayback, 50);
        };
        const attempt = fromInteraction => {
            if (disposed || !playerReady || playingConfirmed || (playRequested && !fromInteraction) || (!config.autoplay && !fromInteraction)) return;
            playRequested = true;
            if (!manual && !fadeStarted) setVolume(startVolume);
            player.playVideo();
        };
        const interact = () => { interactionSeen = true; if (!playingConfirmed) attempt(true); };
        button.addEventListener('click', () => { manual = true; cancelFade(); if (volume > 0) { saved = volume; setVolume(0); } else setVolume(saved); interact(); });
        slider.addEventListener('input', () => { manual = true; cancelFade(); setVolume(slider.value); if (volume > 0) saved = volume; interact(); });
        document.addEventListener('pointerdown', interact, { passive: true });
        document.addEventListener('touchstart', interact, { passive: true });
        document.addEventListener('keydown', interact);
        const clean = () => {
            disposed = true; cancelFade(); stopPlaybackWatch();
            document.removeEventListener('pointerdown', interact); document.removeEventListener('touchstart', interact); document.removeEventListener('keydown', interact);
            player?.destroy?.(); player = null; host.remove(); ui.remove();
        };
        sync();
        window.addEventListener('pagehide', clean, { once: true });
        loadYoutubeApi().then(() => {
            if (disposed) return;
            player = new window.YT.Player(playerMount, {
                width: '1', height: '1', videoId,
                playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
                events: {
                    onReady: event => {
                        if (disposed) return;
                        playerReady = true; event.target.setVolume(volume);
                        if (config.autoplay || interactionSeen) attempt(interactionSeen);
                    },
                    onStateChange: event => {
                        if (disposed) return;
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            playingConfirmed = true; playRequested = true; watchPlayback();
                        } else if (event.data === window.YT.PlayerState.ENDED && config.loop) {
                            event.target.seekTo(0, true); event.target.playVideo();
                        }
                    },
                    onError: () => { playRequested = false; playingConfirmed = false; stopPlaybackWatch(); }
                }
            });
        });
    }
    window.AkasaFinish = { init() { if (!isProfile) return; titleLoop(); magnetic(); sparkle(); }, music };
})();
