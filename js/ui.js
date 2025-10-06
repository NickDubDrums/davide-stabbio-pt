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


// === Spotlight hover PRO: bordo segue anche da fuori, interno solo in hover ===
(() => {
    const R = 180; // raggio in px entro cui il bordo "sente" il mouse
    let raf = null;

    const $spots = () => document.querySelectorAll('.spotlight');

    const updateAll = (mx, my) => {
        $spots().forEach(el => {
            const rect = el.getBoundingClientRect();

            // punto interno più vicino al mouse (clamping)
            const nx = Math.max(rect.left, Math.min(mx, rect.right));
            const ny = Math.max(rect.top, Math.min(my, rect.bottom));

            // distanza del mouse dal box (0 se dentro)
            const dx = mx - nx, dy = my - ny;
            const dist = Math.hypot(dx, dy);

            // opacità del bordo in base alla distanza (fade out fino a R)
            const bop = dist < R ? (1 - dist / R) : 0;

            // coord relative all'elemento per i gradient
            el.style.setProperty('--mx', (nx - rect.left) + 'px');
            el.style.setProperty('--my', (ny - rect.top) + 'px');
            el.style.setProperty('--bop', bop.toFixed(3));

            // interno acceso solo quando il mouse è sopra l’elemento
            const inside = (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom);
            el.style.setProperty('--op', inside ? '1' : '0');
        });
    };

    document.addEventListener('pointermove', (e) => {
        const { clientX: mx, clientY: my } = e;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => updateAll(mx, my));
    }, { passive: true });

    // quando il mouse esce dalla finestra: spegni tutto
    document.addEventListener('pointerleave', () => {
        $spots().forEach(el => el.style.setProperty('--bop', '0'));
    }, true);
})();
