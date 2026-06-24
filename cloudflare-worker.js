export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/visits') {
            return handleVisits(request, env);
        }

        if (url.pathname === '/api/blog-webhook') {
            return handleBlogWebhook(request, env, url);
        }

        if (url.pathname === '/music/' || url.pathname === '/music/index.html') {
            return handleMusicPage(request, url);
        }

        if (url.pathname === '/music/privacy/index.html') {
            return Response.redirect(new URL('/privacy/', url.origin).toString(), 302);
        }

        if (url.pathname === '/blog/') {
            return handleBlogPage(request, env, url);
        }

        if (url.pathname.startsWith('/blog/')) {
            return handleBlogPermalink(request, env, url);
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

async function handleMusicPage(request, url) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405 });
    }

    const rawBase = 'https://raw.githubusercontent.com/akasainfp/akasa1529site/main';
    let response = await fetch(rawBase + '/music.html?fresh=20260625-youtube', {
        cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!response.ok) {
        const musicUrl = new URL('/music.html', url.origin);
        musicUrl.searchParams.set('fresh', '20260625-youtube');
        response = await fetch(new Request(musicUrl.toString(), request));
    }

    if (!response.ok || request.method === 'HEAD') {
        return response;
    }

    let html = await response.text();
    html = html.includes('<base ')
        ? html
        : html.replace('<head>', '<head>\n    <base href="/">');

    const dataResponse = await fetch(rawBase + '/music-data.json?fresh=20260625-youtube', {
        cf: { cacheTtl: 0, cacheEverything: false }
    });
    if (dataResponse.ok) {
        try {
            const items = await dataResponse.json();
            html = html.replace(
                /<section class="music-grid" id="music-grid" data-source="music-data.json" aria-label="[^"]*"></section>/,
                '<section class="music-grid" id="music-grid" data-source="music-data.json" aria-label="music cards">' + renderMusicCardsForHtml(items) + '</section>'
            );
        } catch (error) {
            // Keep the empty grid and let the browser-side fallback handle it.
        }
    }
    const scriptResponse = await fetch(rawBase + '/assets/js/music-archive.js?fresh=20260625-youtube', {
        cf: { cacheTtl: 0, cacheEverything: false }
    });
    if (scriptResponse.ok) {
        const script = await scriptResponse.text();
        html = html.replace(
            /<script\s+src="assets\/js\/music-archive\.js[^>]*><\/script>/,
            '<script>\n' + script + '\n</script>'
        );
    }

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.delete('Content-Length');
    return new Response(html, { status: response.status, headers });
}
function renderMusicCardsForHtml(items) {
    const list = Array.isArray(items) ? items : [];
    return list.map(item => {
        const id = escapeAttribute(item?.youtubeId || '');
        const tags = Array.isArray(item?.tags)
            ? item.tags.map(tag => '<span class="music-tag">' + escapeText(tag) + '</span>').join('')
            : '';
        const about = item?.description || item?.category || '';
        const playButton = id
            ? '<button class="play-button" type="button" data-play-music>\u518d\u751f\u3059\u308b</button>'
            : '<span class="play-unavailable">NO VIDEO</span>';
        return '<article class="music-card" data-youtube-id="' + id + '">' +
            '<p class="scene-text">' + escapeText(about) + '</p>' +
            '<div class="track-box">' +
                '<div class="music-title">' + escapeText(item?.title || '') + ' <span>/ ' + escapeText(item?.artist || '') + '</span></div>' +
                '<div class="music-tags">' + tags + '</div>' +
                '<div class="player-shell">' + playButton +
                    '<div class="player-frame-wrap">' +
                        '<button class="player-close" type="button" data-close-music aria-label="YouTube\u3092\u9589\u3058\u308b">CLOSE</button>' +
                        '<iframe class="youtube-frame" title="' + escapeAttribute(item?.title || 'YouTube') + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</article>';
    }).join('');
}

async function handleBlogPage(request, env, url, contentId = '') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405 });
    }

    const blogUrl = new URL('/blog.html', url.origin);
    if (contentId) {
        blogUrl.searchParams.set('id', contentId);
    }
    const response = await fetch(new Request(blogUrl.toString(), request));
    if (!response.ok || request.method === 'HEAD') {
        return response;
    }

    const html = await response.text();
    const withBase = html.includes('<base ')
        ? html
        : html.replace('<head>', '<head>\n    <base href="/">');
    const rewritten = contentId
        ? await injectBlogMeta(withBase, env, contentId)
        : withBase;
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.delete('Content-Length');
    return new Response(rewritten, { status: response.status, headers });
}

async function handleBlogPermalink(request, env, url) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405 });
    }

    const contentId = decodeURIComponent(url.pathname.replace(/^\/blog\//, '').replace(/\/$/, ''));
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(contentId)) {
        return new Response('Not found', { status: 404 });
    }

    return handleBlogPage(request, env, url, contentId);
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
    const blogUrl = buildBlogUrl(env, post.id);
    const bodyText = stripHtml(post.body || post.excerpt || '');
    const description = `${createDiscordPreview(bodyText)}\n\n[===詳細はこちらから===](${blogUrl})`;
    const embed = {
        title: truncate(post.title, 250),
        url: blogUrl,
        description,
        color: 0xffd700,
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
            content: '<@&1515742409605124126> 新しいBlogが追加されました',
            allowed_mentions: { roles: ['1515742409605124126'] },
            embeds: [embed]
        })
    });
}

async function injectBlogMeta(html, env, contentId) {
    const fetched = await fetchMicrocmsPost(env, contentId);
    const post = normalizeBlogPost(fetched);
    if (!post.title) return html;

    const blogUrl = buildBlogUrl(env, contentId);
    const title = `${post.title} | Akasa1529 blog`;
    const description = createOgpDescription(post.body || post.excerpt || '') || 'Akasa1529のBlog記事です。';
    const image = post.eyecatch || 'https://www.akasa1529.site/assets/profile/icon.jpg';

    let rewritten = html;
    rewritten = replaceTitle(rewritten, title);
    rewritten = replaceCanonical(rewritten, blogUrl);
    rewritten = replaceMeta(rewritten, 'name', 'description', description);
    rewritten = replaceMeta(rewritten, 'property', 'og:title', title);
    rewritten = replaceMeta(rewritten, 'property', 'og:description', description);
    rewritten = replaceMeta(rewritten, 'property', 'og:type', 'article');
    rewritten = replaceMeta(rewritten, 'property', 'og:url', blogUrl);
    rewritten = replaceMeta(rewritten, 'property', 'og:image', image);
    rewritten = replaceMeta(rewritten, 'property', 'og:image:alt', post.title);
    rewritten = replaceMeta(rewritten, 'name', 'twitter:card', 'summary_large_image');
    rewritten = replaceMeta(rewritten, 'name', 'twitter:title', title);
    rewritten = replaceMeta(rewritten, 'name', 'twitter:description', description);
    rewritten = replaceMeta(rewritten, 'name', 'twitter:image', image);
    return rewritten;
}

function replaceTitle(html, title) {
    const tag = `<title>${escapeText(title)}</title>`;
    return /<title>.*?<\/title>/i.test(html)
        ? html.replace(/<title>.*?<\/title>/i, tag)
        : html.replace('</head>', `    ${tag}\n</head>`);
}

function replaceCanonical(html, url) {
    const tag = `<link rel="canonical" href="${escapeAttribute(url)}">`;
    return /<link\s+rel="canonical"[^>]*>/i.test(html)
        ? html.replace(/<link\s+rel="canonical"[^>]*>/i, tag)
        : html.replace('</head>', `    ${tag}\n</head>`);
}

function replaceMeta(html, kind, key, content) {
    const escapedKey = escapeRegExp(key);
    const pattern = new RegExp(`<meta\\s+${kind}="${escapedKey}"[^>]*>`, 'i');
    const tag = `<meta ${kind}="${escapeAttribute(key)}" content="${escapeAttribute(content)}">`;
    return pattern.test(html)
        ? html.replace(pattern, tag)
        : html.replace('</head>', `    ${tag}\n</head>`);
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
function buildBlogUrl(env, contentId) {
    const base = env.BLOG_URL || 'https://www.akasa1529.site/blog/';
    if (!contentId) return base;
    return `${base.replace(/\/$/, '')}/${encodeURIComponent(contentId)}`;
}

function createOgpDescription(value) {
    const text = stripHtml(value).replace(/\s+/g, ' ').trim();
    return text ? `${truncate(text, 72)}...` : '';
}
function createDiscordPreview(value) {
    const lines = String(value || '')
        .split(/\r?\n+/)
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map(line => truncate(line, 80));

    const preview = lines.join('\n') || '新しいBlogが追加されました。';
    return `${preview}....`;
}


function escapeText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
    return escapeText(value)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\r?\n/g, ' ');
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function stableId(value) {
    let hash = 0;
    const text = String(value || '');
    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) | 0;
    }
    return `blog-${Math.abs(hash)}`;
}