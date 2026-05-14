(() => {
    const counter = document.getElementById('visitor-count');
    const endpoint = '/api/visits';
    const storageKey = 'akasa1529.visitorId';

    function getVisitorId() {
        try {
            let id = localStorage.getItem(storageKey);
            if (!id) {
                id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                localStorage.setItem(storageKey, id);
            }
            return id;
        } catch (error) {
            return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }
    }

    function updateCounter(total) {
        if (!counter || total === undefined || total === null) return;
        counter.textContent = Number(total).toLocaleString('ja-JP');
    }

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId() }),
        cache: 'no-store'
    })
        .then(response => {
            if (!response.ok) throw new Error('Visitor counter unavailable');
            return response.json();
        })
        .then(data => updateCounter(data.total))
        .catch(() => {
            if (counter) counter.textContent = '\u6e96\u5099\u4e2d';
        });
})();