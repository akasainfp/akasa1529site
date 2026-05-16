export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/api/rawg/search') {
            return handleRawgSearch(request, env, url);
        }
        if (url.pathname !== '/api/visits') {
            return new Response('Not found', { status: 404 });
        }

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
};

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

async function handleRawgSearch(request, env, url) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = [
        'https://www.akasa1529.site',
        'https://akasa1529.site',
        'http://localhost:8792',
        'http://127.0.0.1:8792',
        'null'
    ].includes(origin) ? origin : 'https://www.akasa1529.site';
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
        return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
    }

    if (!env.RAWG_API_KEY) {
        return Response.json({ error: 'RAWG API key is not configured' }, { status: 500, headers });
    }

    const query = String(url.searchParams.get('q') || '').trim();
    if (query.length < 2 || query.length > 80) {
        return Response.json({ error: 'Query must be between 2 and 80 characters' }, { status: 400, headers });
    }

    const rawgUrl = new URL('https://api.rawg.io/api/games');
    rawgUrl.searchParams.set('key', env.RAWG_API_KEY);
    rawgUrl.searchParams.set('search', query);
    rawgUrl.searchParams.set('page_size', '5');

    const response = await fetch(rawgUrl, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 1800, cacheEverything: true }
    });

    if (!response.ok) {
        return Response.json({ error: 'RAWG request failed' }, { status: response.status, headers });
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results.map(game => ({
        id: game.id,
        name: game.name,
        slug: game.slug,
        url: game.slug ? `https://rawg.io/games/${game.slug}` : null,
        released: game.released,
        image: game.background_image,
        rating: game.rating,
        platforms: Array.isArray(game.platforms)
            ? game.platforms.map(item => item.platform?.name).filter(Boolean)
            : []
    })) : [];

    return Response.json({ results }, { headers });
}
