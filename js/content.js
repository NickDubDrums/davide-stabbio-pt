// js/content.js  (ESM)
function applyContent(data) {
    const getByPath = (obj, path) =>
        path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);

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

    // HERO background (nuovo: editabile da editor)
    const heroBg = document.getElementById('hero-bg');
    if (heroBg && data.hero?.image) {
        heroBg.style.backgroundImage = `url('${data.hero.image}')`;
    }

    // CV (about)
    const cvWrap = document.getElementById('cv-list');
    if (cvWrap && data.about?.cv) {
        cvWrap.innerHTML = data.about.cv.map(item => `
      <li class="card" data-reveal="up">
        <h3>${item.title}</h3>
        ${item.subtitle ? `<div class="muted">${item.subtitle}</div>` : ''}
        ${item.text ? `<p>${item.text}</p>` : ''}
      </li>
    `).join('');
    }

    // Servizi (home)
    const wrap = document.getElementById('services');
    if (wrap && Array.isArray(data.services)) {
        wrap.innerHTML = data.services.map(s => `
      <article class="card" data-reveal="up">
        <h3>${s.title}</h3>
        <p>${s.text}</p>
      </article>
    `).join('');
    }
}

(async function loadContent() {
    try {
        // Firebase first
        const { firebaseConfig } = await import('./firebase-config.js');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js');
        const { getFirestore, doc, getDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js');

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const ref = doc(db, 'site', 'content');

        const snap = await getDoc(ref);
        if (snap.exists()) applyContent(snap.data());
        onSnapshot(ref, (s) => { if (s.exists()) applyContent(s.data()); });
    } catch (err) {
        // fallback locale
        const res = await fetch('data/content.json', { cache: 'no-store' });
        const data = await res.json();
        applyContent(data);
    }
})();
