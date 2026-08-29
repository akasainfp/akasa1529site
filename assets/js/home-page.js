(() => {
    const typewriter = document.getElementById('typewriter-text');
    if (typewriter) {
        const initialText = 'Akasa1529 の記録を整理しています...';
        const finalText = 'PROFILE / ANIME / MOVIE / GAME / TOOL';
        let index = 0;
        const write = () => {
            if (index < initialText.length) {
                typewriter.innerHTML += initialText.charAt(index);
                index += 1;
                window.setTimeout(write, 60);
                return;
            }
            window.setTimeout(() => {
                typewriter.style.transition = 'opacity 0.5s';
                typewriter.style.opacity = '0';
                window.setTimeout(() => {
                    typewriter.textContent = finalText;
                    typewriter.style.opacity = '1';
                }, 500);
            }, 1000);
        };
        window.setTimeout(write, 1200);
    }

    const list = document.getElementById('change-log-list');
    if (!list) return;
    const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
    const source = /\/home\/?(?:index\.html)?$/i.test(path) ? '../changelog.json' : 'changelog.json';
    const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));

    fetch(source, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('Change log not found');
            return response.json();
        })
        .then(entries => {
            list.innerHTML = entries.map(entry => {
                const date = escapeHtml(entry.date || '');
                const title = entry.title ? `<strong>${escapeHtml(entry.title)}</strong> ` : '';
                return `<div class="log-entry"><time class="log-date" datetime="${date}">${date.replaceAll('-', '.')}</time><p>${title}${escapeHtml(entry.body || '')}</p></div>`;
            }).join('');
        })
        .catch(() => {
            list.innerHTML = '<div class="log-entry"><time class="log-date" datetime="2026-05-13">2026.05.13</time><p>changelog.json を読み込めませんでした。</p></div>';
        });
})();
