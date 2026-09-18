(() => {
  if (typeof particlesJS !== 'function' || !document.getElementById('particles-js')) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    window.innerWidth <= 768 || (window.innerWidth <= 932 && window.innerHeight <= 500);
  particlesJS('particles-js', {
    particles: { number: { value: reducedMotion ? 12 : touch ? 36 : 80, density: { enable: true, value_area: 800 } }, color: { value: '#ffffff' }, shape: { type: 'circle' }, opacity: { value: 0.5, random: false }, size: { value: 3, random: true }, line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 }, move: { enable: !reducedMotion, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false } },
    interactivity: { detect_on: 'canvas', events: { onhover: { enable: !touch && !reducedMotion, mode: 'grab' }, onclick: { enable: !reducedMotion, mode: 'push' }, resize: true }, modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } } },
    retina_detect: true
  });
})();
