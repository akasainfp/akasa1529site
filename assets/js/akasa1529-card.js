(() => {
    'use strict';

    const PROFILE_CONFIG = {
        name: 'Akasa1529', birthday: '2008-01-28', location: 'TOKYO / JAPAN', bio: '',
        avatar: '../assets/profile/icon.jpg', background: { type: 'auto', src: '' },
        discord: { enabled: true, userId: '931953913555464192', provider: 'lanyard' },
        music: { enabled: false, src: '', title: '', autoplay: true, loop: true, startVolume: 0, targetVolume: 0.6, fadeDuration: 2000 },
        effects: { tilt: true, cursorGlow: true, gyro: true, parallax: false },
        socials: [
            { id: 'x', label: 'X', url: 'https://x.com/infp_player', color: '#f4f1f7' },
            { id: 'github', label: 'GitHub', url: 'https://github.com/akasainfp', color: '#f4f1f7' },
            { id: 'discord', label: 'Discord', url: 'https://discord.gg/y73Y6mvhU4', color: '#5865f2' },
            { id: 'vrchat', label: 'VRChat', url: '', color: '#1b9aaa' }, { id: 'steam', label: 'Steam', url: '', color: '#66c0f4' },
            { id: 'spotify', label: 'Spotify', url: '', color: '#1ed760' }, { id: 'youtube', label: 'YouTube', url: '', color: '#ff0033' }
        ]
    };
    const ICONS = {
        x: '<path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-6.42L6.43 22H3.3l7.24-8.28L2.8 2h6.4l4.43 5.86L18.9 2Zm-1.1 17.85h1.73L8.27 4.05H6.42L17.8 19.85Z"/>',
        github: '<path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.6 2.35 1.14 2.92.87.09-.67.35-1.14.64-1.4-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.2 9.2 0 0 1 12 9.12c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9v2.83c0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z"/>',
        discord: '<path d="M19.54 4.2A16.2 16.2 0 0 0 15.5 3l-.5 1.03a14.7 14.7 0 0 0-6 0L8.5 3a16.2 16.2 0 0 0-4.04 1.2C1.9 8.1 1.2 11.9 1.55 15.65A16.3 16.3 0 0 0 6.5 18.1l1.2-1.65a10.3 10.3 0 0 1-1.9-.92l.46-.36c3.67 1.72 7.65 1.72 11.28 0l.48.36c-.6.36-1.24.67-1.9.92l1.2 1.65a16.3 16.3 0 0 0 4.95-2.45c.4-4.35-.68-8.12-2.73-11.45Z"/>'
    };
    const $ = (selector) => document.querySelector(selector);
    const ageAt = (birthday, now = new Date()) => { const birth = new Date(`${birthday}T00:00:00`); let age = now.getFullYear() - birth.getFullYear(); if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1; return age; };
    const ext = (src) => (src.split('?')[0].split('.').pop() || '').toLowerCase();

    function renderBackground() {
        const image = $('.profile-backdrop-image'); const video = $('.profile-backdrop-video'); const bg = PROFILE_CONFIG.background || {};
        if (!bg.src) return; const kind = bg.type === 'auto' ? (['mp4', 'webm'].includes(ext(bg.src)) ? 'video' : 'image') : bg.type;
        if (kind === 'video') { const node = document.createElement('video'); node.autoplay = true; node.muted = true; node.loop = true; node.playsInline = true; node.src = bg.src; node.addEventListener('error', () => { video.replaceChildren(); document.body.classList.remove('has-background-media'); }); video.append(node); video.style.display = 'block'; document.body.classList.add('has-background-media'); return; }
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext(bg.src))) return;
        const probe = new Image(); probe.onload = () => { image.style.backgroundImage = `url("${bg.src.replace(/"/g, '')}")`; image.style.display = 'block'; document.body.classList.add('has-background-media'); }; probe.onerror = () => { image.style.backgroundImage = ''; document.body.classList.remove('has-background-media'); }; probe.src = bg.src;
    }
    function renderProfile() {
        $('[data-profile-name]').textContent = PROFILE_CONFIG.name; $('[data-profile-avatar]').src = PROFILE_CONFIG.avatar; $('[data-profile-avatar]').alt = PROFILE_CONFIG.name;
        const birth = new Date(`${PROFILE_CONFIG.birthday}T00:00:00`); $('[data-profile-meta]').textContent = `${ageAt(PROFILE_CONFIG.birthday)} / ${String(birth.getMonth() + 1).padStart(2, '0')}.${String(birth.getDate()).padStart(2, '0')}`; $('[data-profile-location]').textContent = PROFILE_CONFIG.location || '';
        if (PROFILE_CONFIG.bio.trim()) { const bio = $('[data-profile-bio]'); bio.textContent = PROFILE_CONFIG.bio; bio.hidden = false; }
    }
    function renderSocials() {
        const root = $('[data-profile-socials]'); PROFILE_CONFIG.socials.filter((item) => item.url).forEach((item) => { const link = document.createElement('a'); link.className = 'profile-social'; link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', item.label); link.dataset.tooltip = item.label; link.style.setProperty('--social-color', item.color || '#fff'); link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[item.id] || '<circle cx="12" cy="12" r="8"/>'}</svg>`; root.append(link); });
    }
    const STATUS = { online: ['Online', '#23a55a'], idle: ['Idle', '#f0b232'], dnd: ['DND', '#f23f42'], offline: ['Offline', '#80848e'] };
    function renderPresence(data) {
        if (!data) return; const status = STATUS[data.discord_status]; const indicator = $('[data-profile-status]'); const root = $('[data-profile-presence]');
        if (status) { indicator.hidden = false; indicator.className = `profile-status-indicator status-${data.discord_status}`; indicator.title = status[0]; indicator.style.setProperty('--status-color', status[1]); }
        const lines = status ? [status[0]] : []; const custom = (data.activities || []).find((activity) => activity.type === 4 && activity.state); if (custom) lines.push(custom.state); const activity = (data.activities || []).find((item) => item.type !== 4 && item.name); if (activity) lines.push(`${activity.type === 0 ? 'Playing' : 'Activity'} ${activity.name}`); if (data.spotify?.song && data.spotify?.artist) lines.push(`${data.spotify.song} / ${data.spotify.artist}`);
        if (!lines.length) return; root.replaceChildren(); lines.forEach((line) => { const p = document.createElement('p'); p.textContent = line; root.append(p); }); root.hidden = false;
    }
    async function loadPresence() {
        const cfg = PROFILE_CONFIG.discord; if (!cfg.enabled || cfg.provider !== 'lanyard') return;
        try { const response = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(cfg.userId)}`, { cache: 'no-store' }); const payload = await response.json(); if (payload.success) renderPresence(payload.data); } catch (error) { console.warn('Presence unavailable', error); }
        try { const socket = new WebSocket('wss://api.lanyard.rest/socket'); let heartbeat; socket.addEventListener('message', (event) => { const packet = JSON.parse(event.data); if (packet.op === 1) { heartbeat = setInterval(() => socket.send(JSON.stringify({ op: 3 })), packet.d.heartbeat_interval); socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: cfg.userId } })); } if (packet.t === 'PRESENCE_UPDATE') renderPresence(packet.d); }); socket.addEventListener('close', () => clearInterval(heartbeat)); } catch (error) { console.warn('Presence realtime unavailable', error); }
    }
    function renderMusic() {
        const cfg = PROFILE_CONFIG.music; const root = $('[data-profile-music]'); if (!cfg.enabled || !cfg.src || !cfg.title) return; root.hidden = false;
        root.innerHTML = `<div class="music-copy"><span>NOW PLAYING</span><strong></strong></div><button class="music-toggle" type="button" aria-label="Play music"><span aria-hidden="true">▶</span></button><div class="music-progress"><span class="music-time">0:00</span><input class="music-seek" type="range" min="0" max="100" value="0" aria-label="Seek music"><span class="music-duration">0:00</span></div><label class="music-volume"><span aria-hidden="true">VOL</span><input type="range" min="0" max="100" value="0" aria-label="Volume"></label>`;
        root.querySelector('strong').textContent = cfg.title; const audio = new Audio(cfg.src); audio.loop = cfg.loop !== false; audio.volume = Math.max(0, Math.min(1, cfg.startVolume)); let fadeFrame = 0; let manualVolume = false; const format = (value) => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '0:00'; const toggle = root.querySelector('.music-toggle'); const seek = root.querySelector('.music-seek'); const volume = root.querySelector('.music-volume input');
        const update = () => { seek.max = Number.isFinite(audio.duration) ? audio.duration : 100; seek.value = audio.currentTime || 0; root.querySelector('.music-time').textContent = format(audio.currentTime); root.querySelector('.music-duration').textContent = format(audio.duration); toggle.querySelector('span').textContent = audio.paused ? '▶' : 'Ⅱ'; toggle.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music'); };
        const fadeIn = () => { cancelAnimationFrame(fadeFrame); const startTime = performance.now(); const from = Math.max(0, Math.min(1, cfg.startVolume)); const to = Math.max(0, Math.min(1, cfg.targetVolume)); const tick = (now) => { if (manualVolume) return; const progress = cfg.fadeDuration ? Math.min(1, (now - startTime) / cfg.fadeDuration) : 1; audio.volume = from + (to - from) * progress; if (progress < 1) fadeFrame = requestAnimationFrame(tick); }; fadeFrame = requestAnimationFrame(tick); };
        const start = () => audio.play().then(fadeIn).catch(() => {}); toggle.addEventListener('click', () => audio.paused ? start() : audio.pause()); seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); }); volume.addEventListener('input', (event) => { manualVolume = true; cancelAnimationFrame(fadeFrame); audio.volume = Number(event.target.value) / 100; }); audio.addEventListener('timeupdate', update); audio.addEventListener('loadedmetadata', update); document.addEventListener('pointerdown', () => { if (cfg.autoplay && audio.paused) start(); }, { once: true }); if (cfg.autoplay) start();
    }
    function initEffects() {
        const card = $('[data-profile-card]'); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; let frame = 0; let x = 0.5; let y = 0.5; const paint = () => { frame = 0; card.style.setProperty('--glow-x', `${x * 100}%`); card.style.setProperty('--glow-y', `${y * 100}%`); if (PROFILE_CONFIG.effects.tilt && window.matchMedia('(hover: hover)').matches) card.style.transform = `rotateX(${((0.5 - y) * 2.5).toFixed(2)}deg) rotateY(${((x - 0.5) * 2.5).toFixed(2)}deg)`; }; card.addEventListener('pointermove', (event) => { const rect = card.getBoundingClientRect(); x = (event.clientX - rect.left) / rect.width; y = (event.clientY - rect.top) / rect.height; if (PROFILE_CONFIG.effects.cursorGlow && !frame) frame = requestAnimationFrame(paint); }); card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        const enableGyro = () => { if (!PROFILE_CONFIG.effects.gyro || !('DeviceOrientationEvent' in window)) return; const handler = (event) => { x = 0.5 + Math.max(-0.5, Math.min(0.5, (event.gamma || 0) / 90)) * 0.12; y = 0.5 + Math.max(-0.5, Math.min(0.5, ((event.beta || 0) - 45) / 90)) * 0.12; if (!frame) frame = requestAnimationFrame(paint); }; if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((result) => { if (result === 'granted') window.addEventListener('deviceorientation', handler); }).catch(() => {}); else window.addEventListener('deviceorientation', handler); }; card.addEventListener('pointerdown', enableGyro, { once: true });
    }
    renderProfile(); renderBackground(); renderSocials(); renderMusic(); initEffects(); loadPresence();
})();
