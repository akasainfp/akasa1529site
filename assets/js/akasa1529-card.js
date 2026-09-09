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
        // Set a YouTube URL (or videoId), manual title, and enabled:true. Volume is 0-100.
        // A visible official player is required; no hidden audio-only embed.
        music: {
            enabled: true,
            youtube: { url: 'https://www.youtube.com/watch?v=qM32vntkWDM', videoId: '' },
            title: '月とロゼのEuphoria',
            autoplay: true,
            loop: true,
            startVolume: 0,
            targetVolume: 60,
            fadeDuration: 2000
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
        const lines = status ? [status[0]] : []; const activities = Array.isArray(data.activities) ? data.activities : []; const spotifyActivity = activities.find((item) => item.name === 'Spotify' || item.type === 2); const custom = activities.find((item) => item.type === 4 && item.state); if (custom) lines.push(custom.state);
        if (data.spotify?.song && data.spotify?.artist) lines.push(`Listening to Spotify: ${data.spotify.song} / ${data.spotify.artist}`); else if (spotifyActivity) lines.push(`Listening to Spotify${spotifyActivity.details ? `: ${spotifyActivity.details}` : ''}`); else { const activity = activities.find((item) => item.type !== 4 && item.name); if (activity) lines.push(`${activity.type === 0 ? 'Playing' : 'Activity'} ${activity.name}`); }
        lines.slice(0, 4).forEach((line) => { const p = document.createElement('p'); p.textContent = line; root.append(p); }); if (lines.length) root.hidden = false;
    }
    function loadPresence() {
        const cfg = PROFILE_CONFIG.discord; if (!cfg.enabled || cfg.provider !== 'lanyard') return; let socket; let heartbeat; let retry = 0; let stopped = false;
        const connect = () => { if (stopped || document.hidden) return; socket = new WebSocket('wss://api.lanyard.rest/socket'); socket.addEventListener('message', (event) => { const packet = JSON.parse(event.data); if (packet.op === 1) { retry = 0; heartbeat = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ op: 3 })), packet.d.heartbeat_interval); socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: cfg.userId } })); } if (packet.t === 'INIT_STATE' && packet.d) renderPresence(packet.d); if (packet.t === 'PRESENCE_UPDATE' && packet.d) renderPresence(packet.d); }); socket.addEventListener('close', () => { clearInterval(heartbeat); if (!stopped && !document.hidden) { const delay = Math.min(30000, 3000 * (2 ** retry)); retry += 1; setTimeout(connect, delay); } }); socket.addEventListener('error', () => socket.close()); };
        fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(cfg.userId)}`, { cache: 'no-store' }).then((response) => response.json()).then((payload) => { if (payload.success) renderPresence(payload.data); }).catch(() => {}); connect(); document.addEventListener('visibilitychange', () => { if (document.hidden) { stopped = true; clearInterval(heartbeat); if (socket) socket.close(); } else { stopped = false; retry = 0; connect(); } });
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
        const card = $('[data-profile-card]'); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; let frame = 0; let px = 0.5; let py = 0.5; const paint = () => { frame = 0; card.style.setProperty('--glow-x', `${px * 100}%`); card.style.setProperty('--glow-y', `${py * 100}%`); }; const reset = () => { card.style.transform = ''; };
        card.addEventListener('pointermove', (event) => { if (!window.matchMedia('(hover: hover)').matches) return; const rect = card.getBoundingClientRect(); px = (event.clientX - rect.left) / rect.width; py = (event.clientY - rect.top) / rect.height; if (PROFILE_CONFIG.effects.cursorGlow && !frame) frame = requestAnimationFrame(paint); if (PROFILE_CONFIG.effects.tilt) card.style.transform = `rotateX(${((0.5 - py) * 2.5).toFixed(2)}deg) rotateY(${((px - 0.5) * 2.5).toFixed(2)}deg)`; }); card.addEventListener('pointerleave', reset);
        const enableGyro = () => { if (!PROFILE_CONFIG.effects.gyro || !('DeviceOrientationEvent' in window)) return; const handler = (event) => { const gx = Math.max(-1, Math.min(1, (event.gamma || 0) / 45)); const gy = Math.max(-1, Math.min(1, ((event.beta || 45) - 45) / 45)); if (PROFILE_CONFIG.effects.tilt) card.style.transform = `rotateX(${(-gy * 1.5).toFixed(2)}deg) rotateY(${(gx * 1.5).toFixed(2)}deg)`; }; if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((result) => { if (result === 'granted') window.addEventListener('deviceorientation', handler); }).catch(() => {}); else window.addEventListener('deviceorientation', handler); }; card.addEventListener('pointerdown', enableGyro, { once: true });
    }
    renderProfile(); renderBackground(); renderSocials(); renderMusic(); renderViews(); initEffects(); loadPresence();
    window.AkasaFinish.init();
})();
