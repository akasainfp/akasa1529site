const musicGrid = document.getElementById('music-grid');
const artistGrid = document.getElementById('artist-grid');

const fallbackMusicScenes = [
    {
        category: '\u6df1\u591c3\u6642\u306e\u30a4\u30f3\u30bf\u30fc\u30cd\u30c3\u30c8',
        description: '\u753b\u9762\u3060\u3051\u304c\u660e\u308b\u3044\u6642\u9593\u306b\u6d41\u3057\u305f\u3044\u3001\u5c11\u3057\u73fe\u5b9f\u611f\u304c\u8584\u3044BGM\u3002',
        title: 'sample: late night loop',
        artist: 'artist name',
        youtubeId: 'jfKfPfyJRdk',
        era: 'midnight',
        tags: ['\u6df1\u591c', '\u30cd\u30c3\u30c8', '\u4f5c\u696d']
    }
];

const fallbackArtists = [
    { name: 'Ado', note: '\u8868\u73fe\u529b\u3068\u58f0\u306e\u5f37\u3055\u304c\u597d\u304d\u3002', tags: ['VOCAL', 'J-POP'] },
    { name: 'LiSA', note: '\u30a2\u30cb\u30bd\u30f3\u3067\u6c17\u5206\u3092\u4e0a\u3052\u305f\u3044\u6642\u306b\u805e\u304f\u3002', tags: ['ANISON', 'ROCK'] },
    { name: 'JELEE', note: '\u4f5c\u696d\u4e2d\u306b\u6d41\u3057\u3084\u3059\u3044\u7a7a\u6c17\u611f\u304c\u597d\u304d\u3002', tags: ['BGM', 'ANIME'] }
];

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[char]));
}

function setupAnimation() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-animated');
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.anim-box').forEach(el => observer.observe(el));
}

function renderArtists(items) {
    if (!artistGrid) return;
    artistGrid.innerHTML = items.map(item => {
        const tags = (item.tags || []).map(tag => `<span class="artist-tag">${escapeHtml(tag)}</span>`).join('');
        return `<article class="artist-card">
            <div class="artist-name">${escapeHtml(item.name)}</div>
            <p class="artist-note">${escapeHtml(item.note || '')}</p>
            <div class="artist-tags">${tags}</div>
        </article>`;
    }).join('');
}

function renderMusicCards(items) {
    if (!musicGrid) return;
    musicGrid.innerHTML = items.map(item => {
        const id = escapeHtml(item.youtubeId || '');
        const tags = (item.tags || []).map(tag => `<span class="music-tag">${escapeHtml(tag)}</span>`).join('');
        const about = item.description || item.category || '';
        const playButton = id ? '<button class="play-button" type="button" data-play-music>\u518d\u751f\u3059\u308b</button>' : '<span class="play-unavailable">NO VIDEO</span>';
        return `<article class="music-card anim-box" data-youtube-id="${id}">
            <p class="scene-text">${escapeHtml(about)}</p>
            <div class="track-box">
                <div class="music-title">${escapeHtml(item.title)} <span>/ ${escapeHtml(item.artist)}</span></div>
                <div class="music-tags">${tags}</div>
                <div class="player-shell">
                    ${playButton}
                    <div class="player-frame-wrap">
                        <button class="player-close" type="button" data-close-music aria-label="YouTube\u3092\u9589\u3058\u308b">CLOSE</button>
                        <iframe class="youtube-frame" title="${escapeHtml(item.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        </article>`;
    }).join('');
}

async function loadJson(source, fallback) {
    try {
        const response = await fetch(source, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const items = await response.json();
        return Array.isArray(items) ? items : fallback;
    } catch (error) {
        return fallback;
    }
}

async function loadMusicPageData() {
    if (artistGrid) {
        const artists = await loadJson(artistGrid.dataset.source || 'music-artists.json', fallbackArtists);
        renderArtists(artists);
    }

    if (musicGrid) {
        const items = await loadJson(musicGrid.dataset.source || 'music-data.json', fallbackMusicScenes);
        renderMusicCards(items);
    }

    setupAnimation();
}

document.addEventListener('click', event => {
    const playButton = event.target.closest('[data-play-music]');
    const closeButton = event.target.closest('[data-close-music]');

    if (playButton) {
        const card = playButton.closest('.music-card');
        const id = card.dataset.youtubeId;
        const frame = card.querySelector('.youtube-frame');
        if (!id || !frame) return;
        frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`;
        card.classList.add('is-playing');
    }

    if (closeButton) {
        const card = closeButton.closest('.music-card');
        const frame = card.querySelector('.youtube-frame');
        if (frame) frame.src = '';
        card.classList.remove('is-playing');
    }
});

loadMusicPageData();
