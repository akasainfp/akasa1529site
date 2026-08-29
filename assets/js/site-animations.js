(() => {
    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-animated', entry.isIntersecting);
            });
        }, { threshold: 0.15 })
        : null;

    document.querySelectorAll('.anim-box').forEach(box => {
        if (observer) observer.observe(box);
        else box.classList.add('is-animated');
    });

    const title = document.getElementById('target-title');
    if (!title || title.dataset.siteTitleAnimated === 'true' || title.querySelector('.char')) return;
    const text = title.textContent || '';
    title.textContent = '';
    [...text].forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00a0' : char;
        span.className = 'char';
        span.style.animationDelay = `${index * 0.1}s`;
        title.appendChild(span);
    });
    title.dataset.siteTitleAnimated = 'true';
})();
