(() => {
    'use strict';

    // ================================
    // PROFILE CONFIG
    // ================================
    // BACKGROUND: place the normal background file here:
    // assets/akasa1529/background.jpg
    // The default path below is ready to use. Replace only src for WEBP/GIF/MP4/WEBM.
    // type:'auto' detects jpg/jpeg/png/webp/gif/avif as images and mp4/webm as video.
    // position can be 'center center', '50% 30%', 'left center', etc.
    // ================================
    const PROFILE_CONFIG = {
        name: 'Akasa1529', birthday: '2008-01-28', location: 'TOKYO / JAPAN', bio: '',
        avatar: '../assets/profile/icon.jpg',
        background: {
            type: 'webgl', src: '../assets/akasa1529/background.jpg', position: 'center center', opacity: 1,
            webgl: {
                enabled: true,
                base: '../assets/akasa1529/wallpaper/1261087.jpg',
                foliageMask: '../assets/akasa1529/wallpaper/foliagesway_mask_dbd08025.png',
                waterMask: '../assets/akasa1529/wallpaper/waterwaves_mask_99ec8e48.png',
                rippleMask: '../assets/akasa1529/wallpaper/waterripple_mask_505b38e0.png',
                rippleNormal: '../assets/akasa1529/wallpaper/waterripplenormal.png',
                effects: { foliageSway: true, waterWaves: true, waterRipple: true, chromaticAberration: true, vhs: true }
            },
            performance: { desktopFPS: 60, mobileFPS: 30 }
        },
        discord: { enabled: true, userId: '931953913555464192', provider: 'lanyard' },
        // Profile BGM. Volume values are 0-100.
        music: {
            enabled: true,
            source: 'youtube',
            youtube: { url: 'https://youtu.be/qM32vntkWDM' },
            title: '月とロゼのEuphoria',
            artist: '瑠芽 feat. 闇音レンリ',
            credit: 'Music: 瑠芽 / Vocal: 闇音レンリ',
            creditUrl: 'https://piapro.jp/t/aKh1',
            autoplay: true,
            loop: true,
            startVolume: 0,
            targetVolume: 60,
            fadeDuration: 8000
        },
        effects: { tilt: true, cursorGlow: true, gyro: true, parallax: false },
        socials: [
            { id: 'x', label: 'X', url: 'https://x.com/infp_player', color: '#f4f1f7' }, { id: 'github', label: 'GitHub', url: 'https://github.com/akasainfp', color: '#f4f1f7' }, { id: 'discord', label: 'Discord', url: 'https://discord.gg/y73Y6mvhU4', color: '#5865f2' },
            { id: 'vrchat', label: 'VRChat', url: '', color: '#1b9aaa' }, { id: 'steam', label: 'Steam', url: '', color: '#66c0f4' }, { id: 'spotify', label: 'Spotify', url: '', color: '#1ed760' }, { id: 'youtube', label: 'YouTube', url: '', color: '#ff0033' }
        ]
    };
    // Brand SVGs: local Simple Icons symbols, assets/akasa1529/brands.svg.
    const $ = (selector) => document.querySelector(selector);
    const ageAt = (birthday, now = new Date()) => { const birth = new Date(`${birthday}T00:00:00`); let age = now.getFullYear() - birth.getFullYear(); if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1; return age; };
    const extension = (src) => (src.split('?')[0].split('.').pop() || '').toLowerCase();

    function renderBackground() {
        const image = $('.profile-backdrop-image'); const video = $('.profile-backdrop-video'); const bg = PROFILE_CONFIG.background || {};
        if (bg.type === 'webgl') {
            document.documentElement.style.setProperty('--background-position', bg.position || 'center center');
            document.documentElement.style.setProperty('--background-opacity', String(Math.max(0, Math.min(1, bg.opacity ?? 1))));
            document.body.classList.add('has-wallpaper-background');
            if (bg.webgl?.base) {
                image.style.backgroundImage = `url("${bg.webgl.base.replace(/"/g, '')}")`;
                image.style.backgroundPosition = bg.position || 'center center';
                image.style.display = 'block';
                document.body.classList.add('has-background-media');
            }
            const canvas = $('[data-wallpaper-canvas]');
            if (bg.webgl?.enabled && canvas && window.AkasaWallpaper) new window.AkasaWallpaper(canvas, bg).start();
            return;
        }
        if (!bg.src) return; const kind = bg.type === 'auto' ? (['mp4', 'webm'].includes(extension(bg.src)) ? 'video' : 'image') : bg.type;
        document.documentElement.style.setProperty('--background-position', bg.position || 'center center'); document.documentElement.style.setProperty('--background-opacity', String(Math.max(0, Math.min(1, bg.opacity ?? 1))));
        if (kind === 'video') { const node = document.createElement('video'); node.autoplay = true; node.muted = true; node.loop = true; node.playsInline = true; node.src = bg.src; node.addEventListener('error', () => { video.replaceChildren(); document.body.classList.remove('has-background-media'); }); video.append(node); video.style.display = 'block'; document.body.classList.add('has-background-media'); return; }
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(extension(bg.src))) return;
        const probe = new Image(); probe.onload = () => { image.style.backgroundImage = `url("${bg.src.replace(/"/g, '')}")`; image.style.backgroundPosition = bg.position || 'center center'; image.style.display = 'block'; document.body.classList.add('has-background-media'); }; probe.onerror = () => { image.style.backgroundImage = ''; document.body.classList.remove('has-background-media'); }; probe.src = bg.src;
    }
    function renderProfile() {
        $('[data-profile-name]').textContent = PROFILE_CONFIG.name; $('[data-profile-avatar]').src = PROFILE_CONFIG.avatar; $('[data-profile-avatar]').alt = PROFILE_CONFIG.name; const birth = new Date(`${PROFILE_CONFIG.birthday}T00:00:00`); $('[data-profile-meta]').textContent = `${ageAt(PROFILE_CONFIG.birthday)} / ${String(birth.getMonth() + 1).padStart(2, '0')}.${String(birth.getDate()).padStart(2, '0')}`; $('[data-profile-location]').textContent = PROFILE_CONFIG.location || ''; if (PROFILE_CONFIG.bio.trim()) { const bio = $('[data-profile-bio]'); bio.textContent = PROFILE_CONFIG.bio; bio.hidden = false; }
    }
    function renderSocials() {
        const root = $('[data-profile-socials]');
        PROFILE_CONFIG.socials.filter(item => item.url).forEach(item => {
            if (!['x','github','discord','vrchat','steam','spotify','youtube'].includes(item.id)) return;
            const link = document.createElement('a');
            link.className = 'profile-social'; link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', item.label); link.dataset.tooltip = item.label;
            link.style.setProperty('--social-color', item.color || '#fff');
            link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="../assets/akasa1529/brands.svg#${item.id}"></use></svg>`;
            root.append(link);
        });
    }

    const STATUS = { online: ['Online', '#23a55a'], idle: ['Idle', '#f0b232'], dnd: ['DND', '#f23f42'], offline: ['Offline', '#80848e'] };
    function renderPresence(data) {
        const indicator = $('[data-profile-status]'); const root = $('[data-profile-presence]'); indicator.hidden = true; root.hidden = true; root.replaceChildren(); if (!data) return;
        const status = STATUS[data.discord_status]; if (status) { indicator.hidden = false; indicator.className = `profile-status-indicator status-${data.discord_status}`; indicator.title = status[0]; indicator.style.setProperty('--status-color', status[1]); }
        if (!status) return;
        const heading = document.createElement('div'); heading.className = 'profile-presence-status';
        heading.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="../assets/akasa1529/brands.svg#discord"></use></svg>';
        const statusText = document.createElement('span'); statusText.textContent = status[0]; heading.append(statusText); root.append(heading);
        const activities = Array.isArray(data.activities) ? data.activities : [];
        const custom = activities.find((item) => item.type === 4 && item.state);
        const playing = activities.find((item) => item.type === 0 && item.name && item.name !== 'Spotify');
        const spotifyActivity = activities.find((item) => item.name === 'Spotify' || item.type === 2);
        const lines = [];
        if (custom) lines.push(custom.state);
        if (playing) lines.push(`Playing ${playing.name}`);
        if (data.spotify?.song && data.spotify?.artist) lines.push(`Listening to Spotify: ${data.spotify.song} - ${data.spotify.artist}`);
        else if (spotifyActivity) lines.push(`Listening to Spotify${spotifyActivity.details ? `: ${spotifyActivity.details}` : ''}`);
        lines.slice(0, 3).forEach((line) => { const p = document.createElement('p'); p.textContent = line; root.append(p); }); root.hidden = false;
    }
    function loadPresence() {
        const cfg = PROFILE_CONFIG.discord; if (!cfg.enabled || cfg.provider !== 'lanyard') return; let socket; let heartbeat; let retry = 0; let stopped = false;
        const isDevelopment = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
        const warn = (message, detail) => { if (isDevelopment) console.warn(`[Lanyard] ${message}`, detail || ''); };
        const renderPacket = (packet) => {
            if (!packet || !['INIT_STATE', 'PRESENCE_UPDATE'].includes(packet.t)) return;
            const data = packet.d?.[cfg.userId] || packet.d;
            if (data && Object.keys(data).length) renderPresence(data);
        };
        const connect = () => {
            if (stopped || document.hidden) return;
            socket = new WebSocket('wss://api.lanyard.rest/socket');
            socket.addEventListener('message', (event) => {
                let packet; try { packet = JSON.parse(event.data); } catch (error) { warn('Invalid WebSocket payload', error); return; }
                if (packet.op === 1 && Number(packet.d?.heartbeat_interval) > 0) {
                    retry = 0; clearInterval(heartbeat);
                    heartbeat = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ op: 3 })), packet.d.heartbeat_interval);
                    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: cfg.userId } }));
                }
                renderPacket(packet);
            });
            socket.addEventListener('close', () => { clearInterval(heartbeat); if (!stopped && !document.hidden) { const delay = Math.min(30000, 3000 * (2 ** retry)); retry += 1; setTimeout(connect, delay); } });
            socket.addEventListener('error', () => { warn('WebSocket connection failed'); try { socket.close(); } catch {} });
        };
        fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(cfg.userId)}`, { cache: 'no-store' }).then(async (response) => {
            let payload; try { payload = await response.json(); } catch (error) { warn('Invalid REST payload', { status: response.status, error }); return; }
            if (payload?.success && payload.data) { renderPresence(payload.data); return; }
            if (payload?.error?.code === 'user_not_monitored') { warn('User is not monitored by Lanyard', { status: response.status }); return; }
            if (payload?.success === false) { warn('REST returned success:false', { status: response.status, error: payload.error }); return; }
            warn('Invalid REST payload', { status: response.status, payload });
        }).catch((error) => warn('REST request failed', error));
        connect(); document.addEventListener('visibilitychange', () => { if (document.hidden) { stopped = true; clearInterval(heartbeat); if (socket) socket.close(); } else { stopped = false; retry = 0; connect(); } });
    }
    function renderMusic() { window.AkasaFinish.music(PROFILE_CONFIG.music); }
    function getVisitorId() {
        const key = 'akasa1529.visitorId';
        const read = (storage) => { try { return storage.getItem(key) || ''; } catch { return ''; } };
        const write = (storage, id) => { try { storage.setItem(key, id); return true; } catch { return false; } };
        const localId = read(localStorage);
        if (localId) return localId;
        const sessionId = read(sessionStorage);
        if (sessionId) { write(localStorage, sessionId); return sessionId; }
        const id = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        if (write(localStorage, id) || write(sessionStorage, id)) return id;
        return '';
    }
    function renderViews() {
        const root = $('[data-profile-views]');
        const visitorId = getVisitorId();
        const request = visitorId
            ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId }), cache: 'no-store' }
            : { method: 'GET', cache: 'no-store' };
        fetch('/api/visits', request).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { if (data.total === undefined) return; root.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-5.5 0-9.5 7-9.5 7s4 7 9.5 7 9.5-7 9.5-7-4-7-9.5-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg>'; root.append(document.createTextNode(Number(data.total).toLocaleString('ja-JP'))); root.title = 'Total Views'; root.setAttribute('aria-label', `Total Views ${data.total}`); root.hidden = false; }).catch(() => {});
    }
    function initEffects() {
        const card = $('[data-profile-card]'); const reduce = window.matchMedia('(prefers-reduced-motion: reduce)'); if (reduce.matches) return;
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
        const lerp = .14; let frame = 0; let px = .5; let py = .5; let targetX = 0; let targetY = 0; let currentX = 0; let currentY = 0;
        const paint = () => {
            frame = 0;
            if (document.body.classList.contains('background-only') || !finePointer.matches) return;
            currentX += (targetX - currentX) * lerp; currentY += (targetY - currentY) * lerp;
            if (PROFILE_CONFIG.effects.cursorGlow) { card.style.setProperty('--glow-x', `${px * 100}%`); card.style.setProperty('--glow-y', `${py * 100}%`); }
            if (PROFILE_CONFIG.effects.tilt) { card.style.setProperty('--tilt-x', `${currentX.toFixed(2)}deg`); card.style.setProperty('--tilt-y', `${currentY.toFixed(2)}deg`); }
            if (Math.abs(targetX - currentX) > .01 || Math.abs(targetY - currentY) > .01) frame = requestAnimationFrame(paint);
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
        const center = () => { targetX = 0; targetY = 0; schedule(); };
        window.addEventListener('pointermove', (event) => {
            if (!finePointer.matches || document.body.classList.contains('background-only')) return;
            px = Math.max(0, Math.min(1, event.clientX / innerWidth)); py = Math.max(0, Math.min(1, event.clientY / innerHeight));
            targetY = (px * 2 - 1) * 14; targetX = (py * 2 - 1) * -10; schedule();
        }, { passive: true });
        window.addEventListener('pointerout', (event) => { if (!event.relatedTarget) center(); }); document.documentElement.addEventListener('mouseleave', center); window.addEventListener('blur', center);
        document.addEventListener('profile-background-change', (event) => { if (event.detail) { cancelAnimationFrame(frame); frame = 0; targetX = 0; targetY = 0; currentX = 0; currentY = 0; card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg'); } else schedule(); });
        const enableGyro = () => { if (!PROFILE_CONFIG.effects.gyro || finePointer.matches || !('DeviceOrientationEvent' in window)) return; const handler = (event) => { if (document.body.classList.contains('background-only') || reduce.matches) { card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg'); return; } const gx = Math.max(-1, Math.min(1, (event.gamma || 0) / 45)); const gy = Math.max(-1, Math.min(1, ((event.beta || 45) - 45) / 45)); if (PROFILE_CONFIG.effects.tilt) { card.style.setProperty('--tilt-x', `${(-gy * 1.5).toFixed(2)}deg`); card.style.setProperty('--tilt-y', `${(gx * 1.5).toFixed(2)}deg`); } }; if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((result) => { if (result === 'granted') window.addEventListener('deviceorientation', handler); }).catch(() => {}); else window.addEventListener('deviceorientation', handler); }; card.addEventListener('pointerdown', enableGyro, { once: true });
    }
    function initBackgroundToggle() {
        const button = $('[data-background-toggle]'); if (!button) return;
        button.addEventListener('click', () => {
            const backgroundOnly = !document.body.classList.contains('background-only'); const label = backgroundOnly ? 'Show Profile' : 'Hide Profile';
            document.body.classList.toggle('background-only', backgroundOnly);
            button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', String(backgroundOnly)); button.dataset.tooltip = label;
            document.dispatchEvent(new CustomEvent('profile-background-change', { detail: backgroundOnly }));
        });
    }
    renderProfile(); renderBackground(); renderSocials(); renderMusic(); renderViews(); initEffects(); initBackgroundToggle(); loadPresence();
    window.AkasaFinish.init();
})();
