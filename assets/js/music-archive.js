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
        const tags = (item.tags || []).map(tag => `<span class="music-tag">${escapeHtml(tag)}</span>`).join('');
        const about = item.description || item.category || '';
        return `<article class="music-card anim-box">
            <p class="scene-text">${escapeHtml(about)}</p>
            <div class="track-box">
                <div class="music-title">${escapeHtml(item.title)} <span>/ ${escapeHtml(item.artist)}</span></div>
                <div class="music-tags">${tags}</div>
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

loadMusicData();