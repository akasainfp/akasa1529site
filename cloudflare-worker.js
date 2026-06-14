export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/visits') {
            return handleVisits(request, env);
        }

        if (url.pathname === '/api/blog-webhook') {
            return handleBlogWebhook(request, env, url);
        }

        return new Response('Not found', { status: 404 });
    }
};

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
};

async function handleVisits(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    await ensureSchema(env);

    if (request.method === 'GET') {
        const total = await getTotal(env);
        return Response.json({ total }, { headers: JSON_HEADERS });
    }

    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405, headers: JSON_HEADERS });
    }

    let visitorId = '';
    try {
        const body = await request.json();
        visitorId = String(body.visitorId || '');
    } catch (error) {
        return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: JSON_HEADERS });
    }

    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(visitorId)) {
        return Response.json({ error: 'Invalid visitor id' }, { status: 400, headers: JSON_HEADERS });
    }

    await env.DB.prepare(
        'INSERT OR IGNORE INTO visitors (id, first_seen) VALUES (?, ?)'
    ).bind(visitorId, new Date().toISOString()).run();

    const total = await getTotal(env);
    return Response.json({ total }, { headers: JSON_HEADERS });
}

async function handleBlogWebhook(request, env, url) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405, headers: JSON_HEADERS });
    }

    if (env.MICROCMS_WEBHOOK_SECRET) {
        const headerSecret = request.headers.get('x-akasa-webhook-secret') || '';
        const querySecret = url.searchParams.get('secret') || '';
        if (headerSecret !== env.MICROCMS_WEBHOOK_SECRET && querySecret !== env.MICROCMS_WEBHOOK_SECRET) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: JSON_HEADERS });
        }
    }

    if (!env.DISCORD_WEBHOOK_URL) {
        return Response.json({ error: 'Discord webhook is not configured' }, { status: 500, headers: JSON_HEADERS });
    }

    let payload;
    try {
        payload = await request.json();
    } catch (error) {
        return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: JSON_HEADERS });
    }

    await ensureSchema(env);

    let post = normalizeBlogPost(extractBlogContent(payload));
    if ((!post.title || !post.body || !post.eyecatch) && post.id) {
        const fetched = await fetchMicrocmsPost(env, post.id);
        post = { ...post, ...normalizeBlogPost(fetched) };
    }

    const postId = post.id || stableId(post.title + post.body + post.publishedAt);
    if (!postId || !post.title) {
        return Response.json({ error: 'Blog content was not found in payload' }, { status: 400, headers: JSON_HEADERS });
    }

    const inserted = await env.DB.prepare(
        'INSERT OR IGNORE INTO blog_notifications (id, notified_at) VALUES (?, ?)'
    ).bind(postId, new Date().toISOString()).run();

    if (!inserted.meta?.changes) {
        return Response.json({ ok: true, skipped: 'already_notified' }, { headers: JSON_HEADERS });
    }

    const discordResponse = await sendDiscordBlogNotification(env, post);
    if (!discordResponse.ok) {
        await env.DB.prepare('DELETE FROM blog_notifications WHERE id = ?').bind(postId).run();
        const text = await discordResponse.text();
        return Response.json({ error: 'Discord webhook failed', detail: text.slice(0, 500) }, { status: 502, headers: JSON_HEADERS });
    }

    return Response.json({ ok: true }, { headers: JSON_HEADERS });
}

async function sendDiscordBlogNotification(env, post) {
    const blogUrl = env.BLOG_URL || 'https://www.akasa1529.site/blog/';
    const description = truncate(stripHtml(post.body || post.excerpt || ''), 3800) || '新しいBlogが追加されました。';
    const embed = {
        title: truncate(post.title, 250),
        url: blogUrl,
        description,
        color: 0x2f263a,
        fields: [
            { name: 'BlogURL', value: blogUrl, inline: false }
        ],
        timestamp: post.publishedAt || new Date().toISOString()
    };

    if (post.eyecatch) {
        embed.image = { url: post.eyecatch };
    }

    return fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'Akasa1529 blog',
            content: '新しいBlogが追加されました',
            embeds: [embed]
        })
    });
}

function extractBlogContent(payload) {
    return payload?.contents?.new ||
        payload?.content?.new ||
        payload?.new ||
        payload?.contents ||
        payload?.content ||
        payload?.data ||
        payload;
}

function normalizeBlogPost(content) {
    if (!content || typeof content !== 'object') return {};
    const eyecatch = normalizeImage(content.eyecatch || content.image || content.thumbnail);
    return {
        id: content.id || content.contentId || content.objectId || '',
        title: content.title || content.name || '',
        body: content.body || content.content || content.description || content.excerpt || '',
        excerpt: content.excerpt || content.description || '',
        eyecatch,
        publishedAt: content.publishedAt || content.revisedAt || content.createdAt || ''
    };
}

function normalizeImage(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.url || value.src || '';
    return '';
}

async function fetchMicrocmsPost(env, id) {
    const serviceDomain = env.MICROCMS_SERVICE_DOMAIN || 'ezg7dan3lv';
    const endpoint = env.MICROCMS_ENDPOINT || 'blogs';
    const apiKey = env.MICROCMS_API_KEY;
    if (!apiKey || !id) return null;

    const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/${endpoint}/${encodeURIComponent(id)}`, {
        headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!response.ok) return null;
    return response.json();
}

async function ensureSchema(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS visitors (
            id TEXT PRIMARY KEY,
            first_seen TEXT NOT NULL
        )
    `).run();

    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS blog_notifications (
            id TEXT PRIMARY KEY,
            notified_at TEXT NOT NULL
        )
    `).run();
}

async function getTotal(env) {
    const result = await env.DB.prepare('SELECT COUNT(*) AS total FROM visitors').first();
    return Number(result?.total || 0);
}

function stripHtml(value) {
    return String(value || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function truncate(value, max) {
    const text = String(value || '');
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function stableId(value) {
    let hash = 0;
    const text = String(value || '');
    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) | 0;
    }
    return `blog-${Math.abs(hash)}`;
}