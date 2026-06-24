const musicGrid = document.getElementById('music-grid');
const fallbackMusicScenes = [
    {
        category: "深夜3時のインターネット",
        description: "画面だけが明るい時間に流したい、少し現実感が薄いBGM。",
        title: "sample: late night loop",
        artist: "artist name",
        youtubeId: "jfKfPfyJRdk",
        comment: "無言で作業している時の空気に近い曲をここへ。",
        era: "midnight",
        tags: ["深夜", "ネット", "作業"],
        memory: "眠いけどまだ終わりたくない時用。"
    }
];

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[char]));
}

function renderMusicCards(items) {
    if (!musicGrid) return;
    musicGrid.innerHTML = items.map(item => {
        const id = escapeHtml(item.youtubeId || '');
        const tags = (item.tags || []).map(tag => `<span class="music-tag">${escapeHtml(tag)}</span>`).join('');
        const about = item.description || item.category || '';
        const playButton = id ? '<button class="play-button" type="button" data-play-music>再生する</button>' : '<span class="play-unavailable">NO VIDEO</span>';
        return `<article class="music-card anim-box" data-youtube-id="${id}">
            <p class="scene-text">${escapeHtml(about)}</p>
            <div class="track-box">
                <div class="music-title">${escapeHtml(item.title)} <span>/ ${escapeHtml(item.artist)}</span></div>
                <div class="music-tags">${tags}</div>
                <div class="player-shell">
                    ${playButton}
                    <div class="player-frame-wrap">
                        <button class="player-close" type="button" data-close-music aria-label="YouTubeを閉じる">CLOSE</button>
                        <iframe class="youtube-frame" title="${escapeHtml(item.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        </article>`;
    }).join('');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-animated');
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.anim-box').forEach(el => observer.observe(el));
}

async function loadMusicData() {
    if (!musicGrid) return;
    const source = musicGrid.dataset.source || 'music-data.json';
    try {
        const response = await fetch(source, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const items = await response.json();
        renderMusicCards(Array.isArray(items) ? items : fallbackMusicScenes);
    } catch (error) {
        renderMusicCards(fallbackMusicScenes);
    }
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
loadMusicData();