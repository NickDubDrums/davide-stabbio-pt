// Reveal + stagger
const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
    }
}, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

// Stagger: assegna delay automaticamente ai figli
document.querySelectorAll('[data-stagger]').forEach(container => {
    const step = parseInt(container.dataset.stagger, 10) || 80; // ms
    let i = 0;
    container.querySelectorAll('[data-reveal]').forEach(el => {
        el.style.setProperty('--i', i * step);
        i++;
    });
});

document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
