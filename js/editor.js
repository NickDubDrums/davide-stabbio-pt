// js/editor.js  — Editor con gate a password + RTDB load/save (niente Auth Firebase)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js';
import { getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject }
    from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// ----- Gate a password (client-side) -----
const PASSWORD = 'stabbi11'; // richiesto dall'utente — NB: è visibile lato client

const gate = $('#gate');
const appEl = $('#app');
const statusEl = $('#status');

// ----- Firebase RTDB -----
let app = null, db = null, contentRef = null;
let storage = null;


// stato editor
let state = null;

// ---- Utility ----
const getByPath = (obj, path) =>
    path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);

const setByPath = (obj, path, value) => {
    const keys = path.split('.');
    let curr = obj;
    keys.slice(0, -1).forEach(k => {
        if (typeof curr[k] !== 'object' || curr[k] == null) curr[k] = {};
        curr = curr[k];
    });
    curr[keys[keys.length - 1]] = value;
};

function toast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
        position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
        background: '#16161a', color: '#fff', padding: '10px 14px', borderRadius: '8px',
        border: '1px solid #2a2a2e', zIndex: 9999
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
}

function toArray(x) {
    if (Array.isArray(x)) return x;
    if (x && typeof x === 'object') {
        return Object.keys(x).sort((a, b) => Number(a) - Number(b)).map(k => x[k]);
    }
    return [];
}


// ---- Init Firebase ----
async function initFirebase() {
    const { firebaseConfig } = await import('./firebase-config.js');
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    contentRef = ref(db, 'site/content');
    storage = getStorage(app);
}


// ---- Load iniziale (RTDB -> fallback JSON locale) ----
async function loadState() {
    await initFirebase();
    try {
        const snap = await get(contentRef);
        if (snap.exists()) {
            state = snap.val();
            return;
        }
    } catch (e) {
        console.warn('RTDB get fallito, uso fallback locale', e);
    }
    // fallback locale
    const res = await fetch('data/content.json', { cache: 'no-store' });
    state = await res.json();
}

// ---- Tabs: Home / About ----
function wireTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.id.replace('tab-', ''); // 'home' | 'about'
            // toggle stato tab
            document.querySelectorAll('.tab-btn')
                .forEach(t => t.setAttribute('aria-selected', String(t === btn)));
            // toggle pannelli
            document.querySelectorAll('.panel')
                .forEach(p => p.setAttribute('aria-hidden', String(p.id !== 'panel-' + id)));
        });
    });
}


// ---- Binding bidirezionale: inputs <-> state ----
function bindBasicInputs() {
    // Precompila e collega TUTTI gli input/textarea con attributo name="a.b.c"
    $$('input[name], textarea[name]').forEach(el => {
        const path = el.name;
        const val = getByPath(state, path);
        if (val != null) {
            if (el.type === 'checkbox') el.checked = !!val;
            else el.value = val;
        }
        const handler = () => {
            if (el.type === 'checkbox') setByPath(state, path, !!el.checked);
            else setByPath(state, path, el.value);
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });
}

// ---- Servizi (fissi) ----
function renderServicesEditor() {
    const root = $('#services-editor');
    if (!root) return;
    root.innerHTML = '';

    state.services = toArray(state.services);
    state.services.forEach((svc, i) => {
        const item = document.createElement('div');
        item.className = 'cv-item'; // stesso stile card
        item.innerHTML = `
      <div class="field">
        <label>Servizio #${i + 1} — Titolo</label>
        <input class="card" data-path="services.${i}.title" placeholder="Titolo">
      </div>
      <div class="field">
        <label>Descrizione</label>
        <textarea class="card" rows="3" data-path="services.${i}.text" placeholder="Descrizione"></textarea>
      </div>
    `;
        root.appendChild(item);
    });

    // binding locali
    $$('[data-path]', root).forEach(el => {
        const path = el.getAttribute('data-path');
        const val = getByPath(state, path);
        if (el.tagName === 'TEXTAREA') el.value = val || '';
        else el.value = val ?? '';
        const onChange = () => setByPath(state, path, el.value);
        el.addEventListener('input', onChange);
        el.addEventListener('change', onChange);
    });
}

// ---- CV (lista dinamica in about.cv) ----
function renderCVEditor() {
    const root = $('#cv-list-editor');
    if (!root) return;
    root.innerHTML = '';
    if (!state.about) state.about = {};
    state.about.cv = toArray(state.about.cv);

    state.about.cv.forEach((cv, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'cv-item';
        wrap.innerHTML = `
      <div class="row">
        <div class="field">
          <label>Titolo</label>
          <input class="card" data-path="about.cv.${i}.title" placeholder="Titolo">
        </div>
        <div class="field">
          <label>Sottotitolo</label>
          <input class="card" data-path="about.cv.${i}.subtitle" placeholder="Sottotitolo">
        </div>
      </div>
      <div class="field">
        <label>Testo</label>
        <textarea class="card" rows="3" data-path="about.cv.${i}.text" placeholder="Descrizione"></textarea>
      </div>
      <div class="cv-actions">
        <button type="button" class="btn" data-remove="${i}">Elimina</button>
      </div>
    `;
        root.appendChild(wrap);
    });

    // binding campi
    $$('[data-path]', root).forEach(el => {
        const path = el.getAttribute('data-path');
        const val = getByPath(state, path);
        if (el.tagName === 'TEXTAREA') el.value = val || '';
        else el.value = val ?? '';
        const onChange = () => setByPath(state, path, el.value);
        el.addEventListener('input', onChange);
        el.addEventListener('change', onChange);
    });

    // elimina voce
    $$('button[data-remove]', root).forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-remove'));
            state.about.cv.splice(idx, 1);
            renderCVEditor();
        });
    });

    // aggiungi voce
    $('#cv-add')?.addEventListener('click', () => {
        state.about.cv.push({ title: '', subtitle: '', text: '' });
        renderCVEditor();
    }, { once: true }); // ricollegheremo un listener nuovo a ogni render
}

// ---- Pulsanti Download / Import / Salva online ----
function wireToolbar() {

    const heroBtn = $('#upload-hero');
    const heroInp = $('#heroImgFile');
    const heroStatus = $('#hero-upload-status');

    const portraitBtn = $('#upload-portrait');
    const portraitInp = $('#portraitFile');
    const portraitStatus = $('#portrait-upload-status');

    // Download JSON (tutti i pulsanti con id=download)
    $$('#download').forEach(btn => {
        btn.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'content.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
    });

    // Import JSON (tutti gli input file con id=import)
    $$('#import').forEach(inp => {
        inp.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const txt = await file.text();
                const obj = JSON.parse(txt);
                state = obj;
                bindBasicInputs();     // ripopola i campi base
                renderServicesEditor();
                renderCVEditor();
                toast('Import completato');
            } catch (err) {
                console.error(err);
                toast('File non valido');
            } finally {
                e.target.value = '';
            }
        });
    });

    // Salva su Realtime Database
    $('#save-rt')?.addEventListener('click', async () => {
        const label = $('#save-status');
        if (label) label.textContent = 'Salvataggio…';
        try {
            await set(contentRef, { ...state, _updatedAt: new Date().toISOString() });
            if (label) label.textContent = 'Fatto ✔';
            toast('Contenuti salvati online');
        } catch (err) {
            console.error(err);
            if (label) label.textContent = 'Errore';
            toast('Errore salvataggio');
        } finally {
            setTimeout(() => { if (label) label.textContent = ''; }, 1800);
        }
    });

    // --- Upload HERO
    heroBtn?.addEventListener('click', async () => {
        try {
            const file = heroInp.files?.[0];
            if (!file) return (heroStatus.textContent = 'Seleziona un file');
            heroStatus.textContent = 'Caricamento…';
            const prev = state?.hero?.image || '';
            const url = await uploadImageAndGetUrl(file, 'images/hero', prev);
            setByPath(state, 'hero.image', url);
            $('#hero.image').value = url;
            await set(contentRef, { ...state, _updatedAt: new Date().toISOString() }); // ✅
            heroStatus.textContent = 'Fatto ✔';
        } catch (e) {
            console.error(e);
            heroStatus.textContent = `Errore: ${e?.code || e?.message || 'upload_failed'}`;
        } finally {
            setTimeout(() => (heroStatus.textContent = ''), 1500);
            if (heroInp) heroInp.value = '';
        }
    });

    // --- Upload RITRATTO
    portraitBtn?.addEventListener('click', async () => {
        try {
            const file = portraitInp.files?.[0];
            if (!file) return (portraitStatus.textContent = 'Seleziona un file');
            portraitStatus.textContent = 'Caricamento…';
            const prev = state?.about?.portrait || '';
            const url = await uploadImageAndGetUrl(file, 'images/portrait', prev);
            setByPath(state, 'about.portrait', url);
            $('#about.portrait').value = url;
            await set(contentRef, { ...state, _updatedAt: new Date().toISOString() });
            portraitStatus.textContent = 'Fatto ✔';
        } catch (e) {
            console.error(e);
            heroStatus.textContent = `Errore: ${e?.code || e?.message || 'upload_failed'}`;
        } finally {
            setTimeout(() => (portraitStatus.textContent = ''), 1500);
            if (portraitInp) portraitInp.value = '';
        }
    });


}

function fileExt(name = '') {
    const m = String(name).match(/\.(\w+)(?:$|\?)/);
    return m ? m[1].toLowerCase() : 'jpg';
}

async function deleteIfFromOurBucket(url) {
    try {
        if (!url) return;
        if (!/firebasestorage\.(googleapis|app)\.com/i.test(url)) return;
        const r = sref(storage, url);
        await deleteObject(r);
    } catch (e) {
        console.warn('Delete old image skipped:', e?.message || e);
    }
}

async function uploadImageAndGetUrl(file, folder, prevUrl) {
    if (!file) throw new Error('Nessun file selezionato');
    const safeFolder = folder.replace(/[^a-z0-9/_-]+/gi, '_');
    const ts = Date.now();
    const ext = (file.name.match(/\.(\w+)(?:$|\?)/)?.[1] || 'jpg').toLowerCase();
    const path = `${safeFolder}/${ts}.${ext}`;
    const r = sref(storage, path);
    await uploadBytes(r, file);
    await deleteIfFromOurBucket(prevUrl); // pulizia PRIMA di salvare lo stato
    return await getDownloadURL(r);
}


// ---- Inizializzazione Editor ----
async function initEditor() {
    await loadState();
    bindBasicInputs();
    wireTabs();                // <--- AGGIUNTA
    renderServicesEditor();
    renderCVEditor();
    wireToolbar();
}


// ---- Login form (una sola password) ----
$('#password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    const pwd = $('#pwd')?.value?.trim() || '';
    if (pwd !== PASSWORD) {
        statusEl.textContent = 'Password errata';
        return;
    }
    // ok
    gate.hidden = true;
    appEl.hidden = false;
    await initEditor();
});
