const MICROCMS_SERVICE_DOMAIN = 'ezg7dan3lv';
const MICROCMS_ENDPOINT = 'blogs';
const MICROCMS_API_KEY = '0DJSHTcs6L8JLA8tNajA0FIIpKxhROB0zt1q';
const SITE_ORIGIN = 'https://www.akasa1529.site';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/profile/icon.jpg`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/visits') {
            return handleVisits(request, env);
        }

        if (url.pathname.startsWith('/blog/') && url.pathname !== '/blog/') {
            return handleBlogPost(url);
        }

        return new Response('Not found', { status: 404 });
    }
};

async function handleVisits(request, env) {
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    await ensureSchema(env);

    if (request.method === 'GET') {
        const total = await getTotal(env);
        return Response.json({ total }, { headers });
    }

    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
    }

    let visitorId = '';
    try {
        const body = await request.json();
        visitorId = String(body.visitorId || '');
    } catch (error) {
        return Response.json({ error: 'Invalid JSON' }, { status: 400, headers });
    }

    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(visitorId)) {
        return Response.json({ error: 'Invalid visitor id' }, { status: 400, headers });
    }

    await env.DB.prepare(
        'INSERT OR IGNORE INTO visitors (id, first_seen) VALUES (?, ?)'
    ).bind(visitorId, new Date().toISOString()).run();

    const total = await getTotal(env);
    return Response.json({ total }, { headers });
}

async function handleBlogPost(url) {
    const slug = decodeURIComponent(url.pathname.replace(/^\/blog\//, '').replace(/\/$/, ''));
    if (!/^[a-z0-9]{7}$/i.test(slug)) {
        return new Response('Not found', { status: 404 });
    }

    const posts = await fetchMicroCMSPosts();
    const post = posts.find(item => getPostSlug(item) === slug);
    if (!post) {
        return new Response(renderNotFoundPage(), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        });
    }

    return new Response(renderBlogPostPage(post, slug), {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
        }
    });
}

async function fetchMicroCMSPosts() {
    const apiUrl = `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/${MICROCMS_ENDPOINT}?orders=-publishedAt&limit=100`;
    const response = await fetch(apiUrl, {
        headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY }
    });
    if (!response.ok) throw new Error(`microCMS ${response.status}`);
    const data = await response.json();
    return Array.isArray(data.contents) ? data.contents : [];
}

function getPostSlug(post) {
    if (typeof post.slug === 'string' && /^[a-z0-9]{7}$/i.test(post.slug)) {
        return post.slug.toLowerCase();
    }
    const source = String(post.id || post.title || 'blog');
    return hashToBase36(source).slice(0, 7).padEnd(7, '0');
}

function hashToBase36(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function normalizeCategory(value) {
    if (!value) return 'note';
    if (typeof value === 'string') return value;
    return value.name || value.title || value.id || 'note';
}

function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.');
}

function renderBlogPostPage(post, slug) {
    const body = post.body || post.content || '';
    const title = post.title || 'Untitled';
    const excerpt = post.excerpt || post.description || stripHtml(body).slice(0, 110);
    const category = normalizeCategory(post.category || post.type);
    const publishedAt = formatDate(post.publishedAt || post.date || post.createdAt || '');
    const image = post.eyecatch?.url || post.image?.url || DEFAULT_OG_IMAGE;
    const pageUrl = `${SITE_ORIGIN}/blog/${slug}`;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} | Blog | Akasa1529 archive</title>
    <meta name="description" content="${escapeHtml(excerpt)}">
    <meta name="theme-color" content="#ffffff">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:site_name" content="Akasa1529 archive">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(excerpt)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:alt" content="${escapeHtml(title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(excerpt)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&family=Space+Mono&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
    <style>${blogPostCss()}</style>
</head>
<body>
    <main class="post-shell">
        <a class="back-link" href="/blog/">BLOG</a>
        <article class="post-card">
            <div class="post-meta"><span>${escapeHtml(publishedAt || 'NO DATE')}</span><span>${escapeHtml(category)}</span></div>
            <h1>${escapeHtml(title)}</h1>
            ${image ? `<img class="post-eyecatch" src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : ''}
            <div class="post-body">${body || `<p>${escapeHtml(excerpt)}</p>`}</div>
        </article>
    </main>
</body>
</html>`;
}

function renderNotFoundPage() {
    return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blog not found | Akasa1529 archive</title><style>${blogPostCss()}</style></head><body><main class="post-shell"><a class="back-link" href="/blog/">BLOG</a><article class="post-card"><h1>記事が見つかりません</h1><p>URLが変わったか、記事が削除された可能性があります。</p></article></main></body></html>`;
}

function blogPostCss() {
    return `:root{--bg:#f7f6f2;--paper:#fff;--text:#242424;--muted:#747474;--line:#e8e4dc;--font-main:'Plus Jakarta Sans','Noto Sans JP',sans-serif;--font-mono:'Space Mono',monospace}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-main);line-height:1.9}.post-shell{width:min(760px,calc(100% - 34px));margin:0 auto;padding:54px 0 90px}.back-link{display:inline-block;margin-bottom:34px;color:#777;text-decoration:none;font:0.72rem var(--font-mono);letter-spacing:.18em}.back-link:hover{color:#111}.post-card{background:var(--paper);border:1px solid var(--line);padding:42px}.post-meta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;color:#999;font:0.72rem var(--font-mono);letter-spacing:.08em}.post-card h1{font-size:clamp(2rem,6vw,4rem);line-height:1.2;margin:0 0 28px}.post-eyecatch{width:100%;height:auto;margin:0 0 34px;border:1px solid var(--line)}.post-body{font-size:1rem;color:#333}.post-body p{margin:0 0 1em}.post-body img{max-width:100%;height:auto}.post-body a{color:#111;text-underline-offset:3px}@media(max-width:640px){.post-card{padding:26px}}`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[char]));
}

async function ensureSchema(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS visitors (
            id TEXT PRIMARY KEY,
            first_seen TEXT NOT NULL
        )
    `).run();
}

async function getTotal(env) {
    const result = await env.DB.prepare('SELECT COUNT(*) AS total FROM visitors').first();
    return Number(result?.total || 0);
}