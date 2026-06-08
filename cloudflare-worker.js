export default {
    async fetch(request, env) {
        const url = new URL(request.url);
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