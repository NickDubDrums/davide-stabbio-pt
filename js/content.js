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

    const setImgSafe = (el, url) => {
        const test = new Image();
        test.onload = () => el.setAttribute('src', url);
        test.onerror = () => console.warn('IMG 404:', url);
        test.src = url;
    };


    // testo/href/src
    document.querySelectorAll('[data-content]').forEach(el => {
        const val = getByPath(data, el.dataset.content);
        if (val != null) el.textContent = val;
    });
    document.querySelectorAll('[data-src]').forEach(el => {
        if (el.hasAttribute('data-lock-src')) return; // non sovrascrivere
        const val = getByPath(data, el.dataset.src);
        if (val) setImgSafe(el, resolveUrl(val));
    });
    document.querySelectorAll('[data-href]').forEach(el => {
        const val = getByPath(data, el.dataset.href);
        if (val) el.setAttribute('href', resolveUrl(val));
    });

    // HERO bg — accetta URL Storage e data URL (blocca link tipo Instagram page)
    const heroBg = document.getElementById('hero-bg');
    if (heroBg && data.hero?.image) {
        const url = resolveUrl(data.hero.image);
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
      <li class="card spotlight" data-reveal="up">
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
      <article class="card spotlight" data-reveal="up">
        <h3>${s.title || ''}</h3>
        <p>${s.text || ''}</p>
      </article>`).join('');
    }

    // Forza visibilità se lo script delle animazioni non ri-scansiona
    document.querySelectorAll('#services [data-reveal], #cv-list [data-reveal]')
        .forEach(el => { el.classList.add('is-visible'); el.style.opacity = '1'; el.style.transform = 'none'; });
}

// GH Pages helper: se l'URL è root-relative ("/..."), prefissa la repo ("/davide-stabbio-pt")
function ghBasePath() {
    // se è un Project Page (username.github.io/repo)
    if (location.hostname.endsWith('github.io')) {
        const parts = location.pathname.split('/').filter(Boolean);
        // "davide-stabbio-pt" è di solito la prima cartella del path su GH Pages
        return parts.length ? '/' + parts[0] : '';
    }
    return ''; // in locale o su dominio tuo, nessun prefisso
}

function resolveUrl(u) {
    if (!u) return u;
    const url = String(u).trim();
    // assoluti o data-URL: lasciali stare
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
    // root-relative: aggiungi prefisso repo su GH Pages
    if (url.startsWith('/')) return ghBasePath() + url;
    // relativo: va già bene (assets/..., css/..., ecc.)
    return url;
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
