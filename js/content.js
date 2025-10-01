// js/content.js  (ESM)
function applyContent(data) {
    const getByPath = (obj, path) =>
        path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), obj);

    // Normalizza liste {0:{},1:{},...} -> []
    const toArray = (x) => {
        if (Array.isArray(x)) return x;
        if (x && typeof x === 'object') {
            return Object.keys(x).sort((a, b) => Number(a) - Number(b)).map(k => x[k]);
        }
        return [];
    };

    // testo/href/src
    document.querySelectorAll('[data-content]').forEach(el => {
        const val = getByPath(data, el.dataset.content);
        if (val != null) el.textContent = val;
    });
    document.querySelectorAll('[data-src]').forEach(el => {
        const val = getByPath(data, el.dataset.src);
        if (val) el.setAttribute('src', val);
    });
    document.querySelectorAll('[data-href]').forEach(el => {
        const val = getByPath(data, el.dataset.href);
        if (val) el.setAttribute('href', val);
    });

    // HERO bg — accetta URL Storage e data URL (blocca link tipo Instagram page)
    const heroBg = document.getElementById('hero-bg');
    if (heroBg && data.hero?.image) {
        const url = String(data.hero.image).trim();
        const ok = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url)
            || /firebasestorage\.(googleapis|app)\.com/i.test(url)
            || url.startsWith('data:image');
        if (ok) heroBg.style.backgroundImage = `url('${url}')`;
    }

    // CV (about)
    const cvWrap = document.getElementById('cv-list');
    if (cvWrap && data.about?.cv != null) {
        const cv = toArray(data.about.cv);
        cvWrap.innerHTML = cv.map(item => `
      <li class="card" data-reveal="up">
        <h3>${item.title || ''}</h3>
        ${item.subtitle ? `<div class="muted">${item.subtitle}</div>` : ''}
        ${item.text ? `<p>${item.text}</p>` : ''}
      </li>`).join('');
    }

    // Servizi (home)
    const wrap = document.getElementById('services');
    if (wrap && data.services != null) {
        const services = toArray(data.services);
        wrap.innerHTML = services.map(s => `
      <article class="card" data-reveal="up">
        <h3>${s.title || ''}</h3>
        <p>${s.text || ''}</p>
      </article>`).join('');
    }

    // Forza visibilità se lo script delle animazioni non ri-scansiona
    document.querySelectorAll('#services [data-reveal], #cv-list [data-reveal]')
        .forEach(el => { el.classList.add('is-visible'); el.style.opacity = '1'; el.style.transform = 'none'; });
}

(async () => {
    try {
        const { firebaseConfig } = await import('./firebase-config.js');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js');
        const { getDatabase, ref, get, onValue } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js');

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const contentRef = ref(db, 'site/content');

        // Primo render
        const snap = await get(contentRef);
        if (snap.exists()) applyContent(snap.val());

        // Aggiornamenti live
        onValue(contentRef, (s) => {
            if (s.exists()) applyContent(s.val());
        });
    } catch (err) {
        const res = await fetch('data/content.json', { cache: 'no-store' });
        const data = await res.json();
        applyContent(data);
    }
})();
