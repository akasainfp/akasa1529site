(() => {
    const typeLabels = {
        movie: '映画',
        drama: 'ドラマ'
    };

    const genreLabels = {
        animation: 'アニメーション',
        romance: '恋愛',
        'sci-fi': 'SF',
        comedy: 'コメディ',
        action: 'アクション',
        fantasy: 'ファンタジー',
        family: '家族',
        drama: 'ドラマ',
        adventure: '冒険',
        suspense: 'サスペンス',
        music: '音楽',
        mystery: 'ミステリー',
        history: '歴史',
        medical: '医療',
        business: 'ビジネス',
        school: '学園'
    };

    const selectedRatings = new Set();
    const selectedTypes = new Set();
    const selectedGenres = new Set();

    function nestedPath() {
        return /\/movie\/(?:index\.html)?$/i.test(window.location.pathname);
    }

    function assetPath(value) {
        if (!value) return '';
        return nestedPath() ? `../${value}` : value;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function ratingStars(score) {
        const value = Number(score) || 0;
        return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`;
    }

    function renderTags(item) {
        const tags = [`<span class="movie-tag">${escapeHtml(typeLabels[item.type] || item.type || '映画')}</span>`];
        (item.genres || []).forEach(genre => {
            tags.push(`<span class="movie-tag movie-tag-genre">${escapeHtml(genreLabels[genre] || genre)}</span>`);
        });
        return tags.join('');
    }

    function renderItem(item) {
        const thumbnail = assetPath(item.thumbnail);
        const title = escapeHtml(item.title);
        const type = escapeHtml(item.type || 'movie');
        const genres = Array.isArray(item.genres) ? item.genres.map(String) : [];
        return `<article class="movie-item anim-box" id="${escapeHtml(item.id)}" data-score="${escapeHtml(item.score)}" data-type="${type}" data-genre="${escapeHtml(genres.join(' '))}">
            <div class="movie-thumb">${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${title}">` : '<span>NO IMAGE</span>'}</div>
            <div class="movie-info">
                <div class="movie-meta-top">
                    <div class="movie-tags">${renderTags(item)}</div>
                    <span class="rating">評価: ${ratingStars(item.score)}</span>
                </div>
                <h2 class="movie-title">${title}</h2>
                ${item.note ? `<p class="synopsis">${escapeHtml(item.note)}</p>` : '<p class="synopsis">あらすじやメモは movie-data.json から追加できます。</p>'}
            </div>
        </article>`;
    }

    function sortMovieByScore() {
        const list = document.getElementById('movie-list');
        const items = Array.from(list.getElementsByClassName('movie-item'));
        items.sort((a, b) => Number(b.dataset.score) - Number(a.dataset.score));
        items.forEach(item => list.appendChild(item));
    }

    function generateTOC() {
        const tocList = document.getElementById('toc-list');
        const items = document.querySelectorAll('.movie-item');
        tocList.innerHTML = '';
        items.forEach(item => {
            if (item.classList.contains('hidden')) return;
            const title = item.querySelector('.movie-title').innerText;
            const score = item.dataset.score;
            const link = document.createElement('a');
            link.href = `#${item.id}`;
            link.title = title;
            link.textContent = `[★${score}] ${title}`;
            link.addEventListener('click', event => {
                event.preventDefault();
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                history.replaceState(null, '', `#${item.id}`);
            });
            tocList.appendChild(link);
        });
    }

    function toggleFilter(set, value) {
        if (value === 'all') {
            set.clear();
            return;
        }
        if (set.has(value)) set.delete(value);
        else set.add(value);
    }

    function updateFilterButtons(group, selected) {
        document.querySelectorAll(`[data-filter-group="${group}"]`).forEach(button => {
            const value = button.dataset.filterValue;
            button.classList.toggle('active', value === 'all' ? selected.size === 0 : selected.has(value));
        });
    }

    function applyFilters() {
        document.querySelectorAll('.movie-item').forEach(item => {
            const genres = (item.dataset.genre || '').split(/\s+/).filter(Boolean);
            const ratingMatch = selectedRatings.size === 0 || selectedRatings.has(item.dataset.score);
            const typeMatch = selectedTypes.size === 0 || selectedTypes.has(item.dataset.type);
            const genreMatch = selectedGenres.size === 0 || genres.some(genre => selectedGenres.has(genre));
            item.classList.toggle('hidden', !(ratingMatch && typeMatch && genreMatch));
        });
        generateTOC();
    }

    function observeItems() {
        if (!window.archiveObserver) return;
        document.querySelectorAll('.anim-box').forEach(box => window.archiveObserver.observe(box));
    }

    window.filterRating = value => {
        toggleFilter(selectedRatings, value);
        updateFilterButtons('rating', selectedRatings);
        applyFilters();
    };

    window.filterType = value => {
        toggleFilter(selectedTypes, value);
        updateFilterButtons('type', selectedTypes);
        applyFilters();
    };

    window.filterGenre = value => {
        toggleFilter(selectedGenres, value);
        updateFilterButtons('genre', selectedGenres);
        applyFilters();
    };

    window.clearFilters = () => {
        selectedRatings.clear();
        selectedTypes.clear();
        selectedGenres.clear();
        updateFilterButtons('rating', selectedRatings);
        updateFilterButtons('type', selectedTypes);
        updateFilterButtons('genre', selectedGenres);
        applyFilters();
    };

    window.toggleFilterDialog = open => {
        const dialog = document.getElementById('filter-dialog');
        if (!dialog) return;
        dialog.classList.toggle('is-open', open);
        dialog.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    document.addEventListener('click', event => {
        const dialog = document.getElementById('filter-dialog');
        if (dialog && event.target === dialog) window.toggleFilterDialog(false);

        const button = event.target.closest('button');
        if (!button) return;
        if (button.classList.contains('toc-filter-toggle')) {
            event.preventDefault();
            window.toggleFilterDialog(true);
        }
        if (button.classList.contains('filter-close')) {
            event.preventDefault();
            window.toggleFilterDialog(false);
        }
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') window.toggleFilterDialog(false);
    });

    async function loadMovieData() {
        const list = document.getElementById('movie-list');
        if (!list) return;
        const source = list.dataset.source || (nestedPath() ? '../movie-data.json' : 'movie-data.json');
        try {
            const response = await fetch(source, { cache: 'no-store' });
            if (!response.ok) throw new Error(`movie data not found: ${response.status}`);
            const items = await response.json();
            list.innerHTML = items.map(renderItem).join('');
            sortMovieByScore();
            generateTOC();
            observeItems();
        } catch (error) {
            list.innerHTML = '<section class="empty-state anim-box"><h2>movie-data.json を読み込めませんでした</h2><p>ローカルで確認する場合は簡易サーバー経由で開いてください。</p></section>';
            observeItems();
        }
    }

    document.addEventListener('DOMContentLoaded', loadMovieData);
})();
