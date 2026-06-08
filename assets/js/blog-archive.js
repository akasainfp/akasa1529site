const blogList = document.getElementById('blog-list');
const blogCount = document.getElementById('blog-count');

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function stripHtml(value) {
    const element = document.createElement('div');
    element.innerHTML = value || '';
    return element.textContent || element.innerText || '';
}

function normalizeCategory(value) {
    if (!value) return 'note';
    if (typeof value === 'string') return value;
    return value.name || value.title || value.id || 'note';
}

function normalizeImage(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.url || '';
}

function normalizePost(post) {
    const body = post.body || post.content || '';
    const excerpt = post.excerpt || post.description || stripHtml(body).slice(0, 90);
    return {
        id: post.id || post.title,
        title: post.title || 'Untitled',
        excerpt,
        body,
        category: normalizeCategory(post.category || post.type),
        publishedAt: post.publishedAt || post.date || post.createdAt || '',
        tags: post.tags || [],
        eyecatch: normalizeImage(post.eyecatch || post.image || post.thumbnail)
    };
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.');
}

function renderPosts(posts) {
    if (!blogList) return;
    const normalized = posts.map(normalizePost);
    if (blogCount) blogCount.textContent = normalized.length ? String(normalized.length).padStart(2, '0') + ' POSTS' : 'NO POSTS';
    if (!normalized.length) {
        blogList.innerHTML = '<div class="blog-empty"><h2>まだ記事がありません</h2><p>投稿されるまで少しお待ちください。</p></div>';
        return;
    }
    blogList.innerHTML = normalized.map(post => {
        const date = formatDate(post.publishedAt);
        const tags = Array.isArray(post.tags) ? post.tags.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean) : [];
        const tagText = tags.length ? '<span>' + tags.map(escapeHtml).join(' / ') + '</span>' : '';
        const eyecatch = post.eyecatch ? '<img class="blog-eyecatch" src="' + escapeHtml(post.eyecatch) + '" alt="' + escapeHtml(post.title) + '" loading="lazy">' : '';
        return '<article class="blog-card" data-blog-card>' +
            eyecatch +
            '<div class="blog-meta"><span>' + (date || 'NO DATE') + '</span><span class="blog-category">' + escapeHtml(post.category) + '</span>' + tagText + '</div>' +
            '<h2>' + escapeHtml(post.title) + '</h2>' +
            '<p class="blog-excerpt">' + escapeHtml(post.excerpt) + '</p>' +
            '<div class="blog-body">' + (post.body || '<p>' + escapeHtml(post.excerpt) + '</p>') + '</div>' +
            '<div class="blog-actions"><button class="blog-toggle" type="button" data-blog-toggle aria-expanded="false">もっと見る</button></div>' +
        '</article>';
    }).join('');
}

async function fetchMicroCMSPosts(config) {
    const url = 'https://' + config.serviceDomain + '.microcms.io/api/v1/' + config.endpoint + '?orders=-publishedAt&limit=20';
    const response = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': config.apiKey } });
    if (!response.ok) throw new Error('microCMS ' + response.status);
    const data = await response.json();
    return Array.isArray(data.contents) ? data.contents : [];
}

async function fetchLocalPosts() {
    const source = blogList?.dataset.source || 'blog-data.json';
    const response = await fetch(source, { cache: 'no-store' });
    if (!response.ok) throw new Error('local ' + response.status);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

async function loadBlogPosts() {
    const config = window.AKASA_BLOG_CONFIG || {};
    try {
        if (config.serviceDomain && config.apiKey && config.endpoint) {
            renderPosts(await fetchMicroCMSPosts(config));
            return;
        }
        renderPosts(await fetchLocalPosts());
    } catch (error) {
        blogList.innerHTML = '<div class="blog-empty"><h2>blogを読み込めませんでした</h2><p>時間をおいて再読み込みしてください。</p></div>';
        if (blogCount) blogCount.textContent = 'ERROR';
    }
}

document.addEventListener('click', event => {
    const button = event.target.closest('[data-blog-toggle]');
    if (!button) return;
    const card = button.closest('[data-blog-card]');
    const open = !card.classList.contains('is-open');
    card.classList.toggle('is-open', open);
    button.textContent = open ? '閉じる' : 'もっと見る';
    button.setAttribute('aria-expanded', String(open));
});

loadBlogPosts();