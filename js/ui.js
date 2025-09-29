// Toggle offcanvas
const root = document.documentElement;
const btnToggle = document.querySelector('[data-menu-toggle]');
const backdrop = document.querySelector('.backdrop');
const panel = document.getElementById('nav-panel');

function closeNav() {
    root.classList.remove('nav-open');
    btnToggle?.setAttribute('aria-expanded', 'false');
    panel?.setAttribute('aria-hidden', 'true');
}
function openNav() {
    root.classList.add('nav-open');
    btnToggle?.setAttribute('aria-expanded', 'true');
    panel?.setAttribute('aria-hidden', 'false');
}

document.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-toggle]')) {
        (root.classList.contains('nav-open') ? closeNav : openNav)();
    }
    if (e.target.matches('[data-close-nav]')) closeNav();
    if (e.target.closest('.offcanvas-nav a')) closeNav();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

// Evidenzia link attivo (underline piena)
const path = location.pathname.replace(/\/index\.html?$/, '/') || '/';
document.querySelectorAll('.navlink').forEach(a => {
    try {
        const href = new URL(a.href, location.origin).pathname.replace(/\/index\.html?$/, '/') || '/';
        if (href === path) a.classList.add('is-active');
    } catch { }
});
