(() => {
    'use strict';
    const isProfile = /^\/akasa1529\/(?:index\.html)?$/.test(location.pathname);
    const SPARKLE = { lifetime: [300, 500], spacing: 12, mobileSpacing: 22, purple: .2, clickPurple: .55, radius: 14, sizes: [3, 5], max: 72, mobileMax: 36 };

    function titleLoop() {
        const name = 'Akasa1529'; let length = name.length, direction = -1, timer;
        const tick = () => {
            length += direction; document.title = name.slice(0, length);
            let delay = 70;
            if (length === 1) { direction = 1; delay = 150; }
            if (length === name.length) { direction = -1; delay = 1000; }
            timer = setTimeout(tick, delay);
        };
        document.title = name; timer = setTimeout(tick, 1000);
        window.addEventListener('pagehide', () => clearTimeout(timer));
        window.addEventListener('pageshow', e => { if (e.persisted) { clearTimeout(timer); length = name.length; direction = -1; document.title = name; timer = setTimeout(tick, 1000); } });
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
                const age = (now - p.born) / p.life, distance = 1 - (1 - age) ** 2;
                const x = p.x + p.dx * distance, y = p.y + p.dy * distance;
                if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;
                ctx.save(); ctx.translate(x, y); ctx.rotate(p.angle + age * .3);
                ctx.globalAlpha = Math.min(1, (1 - age) * 1.3); ctx.fillStyle = p.color;
                const size = p.size * (1 - age * .35);
                ctx.beginPath();
                for (let i = 0; i < 8; i++) { const r = i % 2 ? size * .24 : size; const a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
                ctx.closePath(); ctx.fill(); ctx.restore();
            }
            frame = particles.length ? requestAnimationFrame(draw) : 0;
        };
        const spawn = (x, y, purple, mobile) => {
            if (reduce.matches || document.hidden) return;
            const angle = Math.random() * Math.PI * 2, radius = Math.random() * SPARKLE.radius;
            const max = mobile ? SPARKLE.mobileMax : SPARKLE.max;
            if (particles.length >= max) particles.shift();
            particles.push({ x, y, born: performance.now(), life: SPARKLE.lifetime[0] + Math.random() * (SPARKLE.lifetime[1] - SPARKLE.lifetime[0]), dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius, angle, size: SPARKLE.sizes[Math.random() < .7 ? 0 : 1], color: Math.random() < purple ? '#b49aff' : '#f4f1ff' });
            if (!frame) frame = requestAnimationFrame(draw);
        };
        document.addEventListener('pointermove', e => {
            const mobile = e.pointerType !== 'mouse', point = { x: e.clientX, y: e.clientY, id: e.pointerId };
            if (reduce.matches) return;
            if (!lastPoint || lastPoint.id !== point.id) { lastPoint = point; spawn(point.x, point.y, SPARKLE.purple, mobile); return; }
            const dx = point.x - lastPoint.x, dy = point.y - lastPoint.y, distance = Math.hypot(dx, dy);
            const spacing = mobile ? SPARKLE.mobileSpacing : SPARKLE.spacing;
            const count = Math.min(6, Math.floor(distance / spacing));
            if (!count) return;
            for (let i = 1; i <= count; i++) spawn(lastPoint.x + dx * i / count, lastPoint.y + dy * i / count, SPARKLE.purple, mobile);
            lastPoint = point;
        }, { passive: true });
        document.addEventListener('pointerdown', e => { for (let i = 0; i < (e.pointerType === 'mouse' ? 3 : 2); i++) spawn(e.clientX, e.clientY, SPARKLE.clickPurple, e.pointerType !== 'mouse'); lastPoint = { x: e.clientX, y: e.clientY, id: e.pointerId }; }, { passive: true });
        document.addEventListener('pointercancel', () => { lastPoint = null; });
        document.addEventListener('pointerout', e => { if (!e.relatedTarget) lastPoint = null; });
        document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
        reduce.addEventListener('change', clear); window.addEventListener('resize', resize); window.addEventListener('pagehide', clear); resize();
    }

    function youtubeId(config) {
        if (/^[\w-]{11}$/.test(config?.videoId || '')) return config.videoId;
        try {
            const url = new URL(config?.url || '');
            if (url.hostname === 'youtu.be') return /^[\w-]{11}$/.test(url.pathname.slice(1)) ? url.pathname.slice(1) : '';
            if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) return '';
            const id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/)?.[1];
            return /^[\w-]{11}$/.test(id || '') ? id : '';
        } catch { return ''; }
    }

    function music(config) {
        if (!isProfile || !config?.enabled) return;
        const id = youtubeId(config.youtube); if (!id) return;
        const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
        const target = clamp(config.targetVolume ?? 60);
        const section = document.createElement('section'); section.className = 'profile-bgm'; section.setAttribute('aria-label', config.title || 'YouTube');
        const host = document.createElement('div'); section.append(host);
        const controls = document.createElement('div'); controls.className = 'profile-volume';
        controls.innerHTML = '<button type="button" aria-label="Unmute BGM" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z"/><path class="volume-waves" d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/><path class="volume-muted" d="m16 9 5 6m0-6-5 6"/></svg></button><input type="range" min="0" max="100" value="0" aria-label="BGM volume">';
        document.body.append(section, controls); document.body.classList.add('has-youtube-bgm');
        const button = controls.querySelector('button'), slider = controls.querySelector('input');
        let player, ready = false, visible = false, manual = false, needsFade = true, fade = 0, volume = 0, saved = target || 60, retry = true, interacted = false, disposed = false;
        const sync = () => { slider.value = String(Math.round(volume)); button.setAttribute('aria-pressed', String(volume === 0)); button.setAttribute('aria-label', volume === 0 ? 'Unmute BGM' : 'Mute BGM'); controls.classList.toggle('is-muted', volume === 0); };
        const setVolume = value => { volume = clamp(value); if (ready) { player.setVolume(volume); volume === 0 ? player.mute() : player.unMute(); } sync(); };
        const cancelFade = () => { clearInterval(fade); fade = 0; };
        const beginFade = () => {
            if (manual || !needsFade) return;
            needsFade = false; const start = performance.now(), duration = Math.max(0, Number(config.fadeDuration) || 0);
            const from = clamp(config.startVolume || 0);
            cancelFade();
            fade = setInterval(() => { const t = duration ? Math.min(1, (performance.now() - start) / duration) : 1; setVolume(from + (target - from) * t); if (t === 1) cancelFade(); }, 50);
        };
        const attempt = () => { if (ready && visible && !document.hidden && retry && (config.autoplay || interacted)) { retry = false; if (!manual) { needsFade = true; setVolume(0); } player.playVideo(); } };
        const interact = () => { interacted = true; if (ready && retry) attempt(); };
        const observer = new IntersectionObserver(entries => { visible = entries[0].intersectionRatio > .5; attempt(); }, { threshold: [0, .5, 1] }); observer.observe(section);
        button.addEventListener('click', () => { manual = true; cancelFade(); if (volume > 0) { saved = volume; setVolume(0); } else setVolume(saved); interact(); });
        slider.addEventListener('input', () => { manual = true; cancelFade(); setVolume(slider.value); if (volume > 0) saved = volume; interact(); });
        document.addEventListener('pointerdown', interact, { passive: true });
        const clean = () => { disposed = true; cancelFade(); observer.disconnect(); document.removeEventListener('pointerdown', interact); player?.destroy(); section.remove(); controls.remove(); document.body.classList.remove('has-youtube-bgm'); };
        const create = () => {
            if (disposed) return;
            player = new YT.Player(host, { width: 356, height: 200, videoId: id,
                playerVars: { origin: location.origin, playsinline: 1, controls: 0, disablekb: 1, autoplay: 0, loop: config.loop ? 1 : 0, playlist: id },
                events: {
                    onReady: () => { ready = true; player.getIframe().title = config.title || 'YouTube'; setVolume(volume); attempt(); },
                    onStateChange: e => {
                        if (e.data === 1) beginFade();
                        // Some browsers pause a muted autoplay when the fade first unmutes it.
                        if (e.data === 2 && fade && !manual) { cancelFade(); retry = true; needsFade = true; setVolume(0); }
                    },
                    onAutoplayBlocked: () => { cancelFade(); retry = true; if (!manual) { needsFade = true; setVolume(0); } },
                    onError: clean
                }
            });
        };
        sync();
        if (window.YT?.Player) create();
        else {
            const previous = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { previous?.(); create(); };
            const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.async = true; script.onerror = clean; document.head.append(script);
        }
    }
    window.AkasaFinish = { init() { if (!isProfile) return; titleLoop(); magnetic(); sparkle(); }, music };
})();
