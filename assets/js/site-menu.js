(() => {
    if (document.querySelector('[data-site-menu-root]')) return;

    const cleanPages = {
        '/': 'index.html',
        '/home/': 'home/index.html',
        '/profile/': 'profile/index.html',
        '/anime/': 'anime/index.html',
        '/movie/': 'movie/index.html',
        '/game/': 'game/index.html',
        '/music/': 'music/index.html',
        '/blog/': 'blog/index.html',
        '/archive/': 'archive/index.html',
        '/privacy/': 'privacy/index.html',
        '/ticket/': 'ticket/index.html'
    };
    const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
    const nestedPage = /\/(home|profile|anime|movie|game|music|blog|archive|privacy|ticket)\/index\.html$/i.test(path);
    const homePage = window.location.protocol !== 'file:'
        ? (path === '/' || /\/home\/?$/i.test(path))
        : (!nestedPage && /\/index\.html$/i.test(path)) || /\/home\/index\.html$/i.test(path);
    const currentPath = window.location.protocol === 'file:'
        ? Object.entries(cleanPages).find(([, file]) => path.toLowerCase().endsWith(`/${file}`.toLowerCase()))?.[0] || '/'
        : (path.endsWith('/') ? path : `${path}/`);
    if (homePage) document.body.classList.add('site-menu-booting');

    function hrefFor(href) {
        if (href.startsWith('#')) return href;
        if (window.location.protocol !== 'file:') return href;
        const target = cleanPages[href];
        if (!target) return href;
        return `${nestedPage ? '../' : ''}${target}`;
    }

    const style = document.createElement('style');
    style.textContent = `
        .site-menu-toggle {
            position: fixed;
            top: 18px;
            right: 20px;
            z-index: 10020;
            width: 42px;
            height: 42px;
            border: 1px solid rgba(125, 95, 255, 0.35);
            background: rgba(4, 5, 10, 0.78);
            color: #d8d8e8;
            display: block;
            cursor: pointer;
            transition: opacity 0.35s ease, transform 0.35s ease, border-color 0.25s ease, background 0.25s ease;
            backdrop-filter: blur(14px);
        }
        .site-menu-toggle span,
        .site-menu-toggle::before,
        .site-menu-toggle::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            width: 18px;
            height: 2px;
            background: currentColor;
            display: block;
            border-radius: 999px;
            transition: 0.25s ease;
        }
        .site-menu-toggle span { transform: translate(-50%, -50%); }
        .site-menu-toggle::before { transform: translate(-50%, calc(-50% - 6px)); }
        .site-menu-toggle::after { transform: translate(-50%, calc(-50% + 6px)); }
        .site-menu-toggle:hover,
        .site-menu-toggle:focus-visible {
            border-color: var(--accent, #7d5fff);
            background: rgba(125, 95, 255, 0.12);
            color: #fff;
            outline: none;
        }
        .site-menu-open .site-menu-toggle span { opacity: 0; }
        .site-menu-open .site-menu-toggle::before { transform: translate(-50%, -50%) rotate(45deg); }
        .site-menu-open .site-menu-toggle::after { transform: translate(-50%, -50%) rotate(-45deg); }
        .site-menu-booting .site-menu-toggle {
            opacity: 0;
            pointer-events: none;
            transform: translateY(-10px);
        }
        .site-menu-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.46);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .site-menu-panel {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 10010;
            width: min(340px, calc(100vw - 34px));
            height: 100vh;
            padding: 78px 30px 34px;
            background: rgba(2, 2, 6, 0.94);
            border-left: 1px solid rgba(125, 95, 255, 0.18);
            box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45);
            transform: translateX(100%);
            transition: transform 0.34s cubic-bezier(0.2, 1, 0.3, 1);
            backdrop-filter: blur(18px);
            overflow-y: auto;
        }
        .site-menu-open .site-menu-overlay {
            opacity: 1;
            pointer-events: auto;
        }
        .site-menu-open .site-menu-panel { transform: translateX(0); }
        .site-menu-kicker {
            font-family: var(--font-mono, monospace);
            color: var(--accent, #7d5fff);
            font-size: 0.68rem;
            letter-spacing: 0.24em;
            margin-bottom: 26px;
            text-transform: uppercase;
        }
        .site-menu-group { margin-bottom: 28px; }
        .site-menu-label {
            font-family: var(--font-mono, monospace);
            color: #555;
            font-size: 0.62rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .site-menu-link,
        .site-menu-action {
            width: 100%;
            border: 0;
            border-left: 1px solid rgba(255, 255, 255, 0.07);
            background: transparent;
            color: #777;
            display: block;
            font: 700 1.02rem var(--font-main, sans-serif);
            letter-spacing: 0;
            padding: 10px 0 10px 16px;
            text-align: left;
            text-decoration: none;
            transition: 0.25s ease;
            cursor: pointer;
        }
        .site-menu-link span {
            display: block;
            color: #444;
            font-family: var(--font-mono, monospace);
            font-size: 0.58rem;
            font-weight: 400;
            letter-spacing: 0.16em;
            margin-top: 4px;
            text-transform: uppercase;
        }
        .site-menu-link:hover,
        .site-menu-link:focus-visible,
        .site-menu-action:hover,
        .site-menu-action:focus-visible,
        .site-menu-link.is-current {
            color: #fff;
            border-left-color: var(--accent, #7d5fff);
            transform: translateX(5px);
            outline: none;
        }
        .site-menu-link.is-current span { color: var(--accent, #7d5fff); }
        @media (max-width: 640px) {
            .site-menu-toggle { top: 14px; right: 14px; }
            .site-menu-panel { width: min(310px, calc(100vw - 22px)); padding: 72px 24px 30px; }
        }
    `;
    document.head.appendChild(style);

    const links = [
        { href: '/', label: 'HOME', sub: 'top page' },
        { href: '/profile/', label: 'PROFILE', sub: 'about' },
        { href: '/anime/', label: 'ANIME', sub: 'archive' },
        { href: '/movie/', label: 'MOVIE', sub: 'movie & drama' },
        { href: '/game/', label: 'GAME', sub: 'archive' },
        { href: '/music/', label: 'MUSIC', sub: 'bgm' },
        { href: '/blog/', label: 'BLOG', sub: 'notes' },
        { href: '/archive/', label: 'TOOL', sub: 'works' },
        { href: '/ticket/', label: 'CONTACT', sub: 'discord' },
        { href: '/privacy/', label: 'PRIVACY', sub: 'policy' }
    ];

    const root = document.createElement('div');
    root.setAttribute('data-site-menu-root', '');
    root.innerHTML = `
        <button class="site-menu-toggle" type="button" aria-label="メニューを開く" aria-controls="site-menu-panel" aria-expanded="false"><span></span></button>
        <div class="site-menu-overlay" data-site-menu-close></div>
        <aside class="site-menu-panel" id="site-menu-panel" aria-hidden="true">
            <div class="site-menu-kicker">Akasa1529 archive</div>
            <div class="site-menu-group" data-site-current hidden>
                <div class="site-menu-label">This Page</div>
                <a class="site-menu-link" href="#top">TOP<span>page top</span></a>
                <a class="site-menu-link" href="#toc-list">LIST<span>archive list</span></a>
                <button class="site-menu-action" type="button" data-site-filter>FILTER</button>
            </div>
            <div class="site-menu-group">
                <div class="site-menu-label">Pages</div>
                ${links.map(link => `
                    <a class="site-menu-link${currentPath === link.href ? ' is-current' : ''}" href="${hrefFor(link.href)}">
                        ${link.label}<span>${link.sub}</span>
                    </a>
                `).join('')}
            </div>
        </aside>
    `;
    document.body.appendChild(root);

    const toggle = root.querySelector('.site-menu-toggle');
    const panel = root.querySelector('.site-menu-panel');
    const currentGroup = root.querySelector('[data-site-current]');
    const filterButton = root.querySelector('[data-site-filter]');
    const hasArchiveList = Boolean(document.getElementById('toc-list'));
    if (hasArchiveList) currentGroup.hidden = false;
    if (typeof window.toggleFilterDialog !== 'function') filterButton.hidden = true;

    function setOpen(open) {
        document.body.classList.toggle('site-menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
        panel.setAttribute('aria-hidden', String(!open));
    }

    toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('site-menu-open')));
    root.querySelector('[data-site-menu-close]').addEventListener('click', () => setOpen(false));
    root.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    filterButton.addEventListener('click', () => {
        setOpen(false);
        if (typeof window.toggleFilterDialog === 'function') window.toggleFilterDialog(true);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') setOpen(false);
    });

    if (homePage) {
        window.setTimeout(() => document.body.classList.remove('site-menu-booting'), 3200);
    }
})();
