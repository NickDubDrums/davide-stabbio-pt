// Reveal on scroll (classe .reveal e attributo [data-reveal])
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
}, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

document.querySelectorAll('.reveal, [data-reveal]').forEach(el => io.observe(el));

// Bonus: auto-stagger
document.querySelectorAll('[data-stagger]').forEach(container => {
    const step = parseInt(container.dataset.stagger || '80', 10);
    let i = 0;
    container.querySelectorAll('[data-reveal]').forEach(el => {
        el.style.setProperty('--i', i * step);
        i++;
    });
});
