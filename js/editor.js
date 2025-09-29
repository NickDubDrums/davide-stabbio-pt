// === Protezione: password + (opzionale) token URL ===
// Password DEMO: "davide-2025" (cambia!). Hash sotto.
const ALLOWED_HASH = "7159f07226609ec6b08751b0c097447c2806dd3ba041ce6e46d4fea6c332e27e";

// (Opzionale) Segreto URL: imposta SECRET_KEY_HASH e poi apri /editor.html?k=<chiave-plain>
// Lascia vuoto per disabilitare.
const SECRET_KEY_HASH = ""; // es: "e3b0c442..." (sha256 di "mio-token-url")

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const $app = $('#app');
const $gate = $('#gate');
const $status = $('#status');

let state = null; // content.json in memoria

async function sha256hex(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function qs(key) {
    const p = new URLSearchParams(location.search);
    return p.get(key);
}

async function checkUrlKey() {
    if (!SECRET_KEY_HASH) return true; // disattivato
    const k = qs('k');
    if (!k) return false;
    const h = await sha256hex(k);
    return h === SECRET_KEY_HASH;
}

$('#login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    $status.textContent = 'Verifica…';
    const okToken = await checkUrlKey();
    if (!okToken) { $status.textContent = 'Link non valido.'; return; }

    const pwd = e.target.password.value;
    const hash = await sha256hex(pwd);
    if (hash === ALLOWED_HASH) {
        $gate.hidden = true;
        $app.hidden = false;
        await loadJSON();
        initEditor();
    } else {
        $status.textContent = 'Password errata.';
    }
});

async function loadJSON() {
    const res = await fetch('/data/content.json', { cache: 'no-store' });
    state = await res.json();
}

// ---------- UI BINDING ----------
function setVal(name, value) {
    const el = document.getElementById(name);
    if (el) el.value = value ?? '';
}
function getVal(name) {
    const el = document.getElementById(name);
    return el ? el.value.trim() : '';
}

function bindHome() {
    setVal('hero.headline', state.hero?.headline);
    setVal('hero.subheadline', state.hero?.subheadline);
    setVal('hero.ctaText', state.hero?.ctaText);
    setVal('hero.ctaLink', state.hero?.ctaLink);
    setVal('hero.image', state.hero?.image);

    // Servizi (fissi): genera blocchi di input per ciascun item
    const wrap = document.getElementById('services-editor');
    wrap.innerHTML = (state.services || []).map((s, i) => `
    <div class="card" style="padding:16px;">
      <div class="field">
        <label>Servizio ${i + 1} — Titolo</label>
        <input class="card" id="services.${i}.title" value="${escapeHtml(s.title || '')}">
      </div>
      <div class="field">
        <label>Servizio ${i + 1} — Testo</label>
        <textarea class="card" id="services.${i}.text" rows="3">${escapeHtml(s.text || '')}</textarea>
      </div>
    </div>
  `).join('');
}

function bindAbout() {
    setVal('about.name', state.about?.name);
    setVal('about.portrait', state.about?.portrait);
    setVal('about.bio', state.about?.bio);
    renderCV();
}

function renderCV() {
    const list = document.getElementById('cv-list-editor');
    const cv = state.about?.cv || [];
    list.innerHTML = cv.map((item, idx) => `
    <div class="cv-item" data-idx="${idx}">
      <div class="row-3">
        <div class="field">
          <label>Titolo (h3)</label>
          <input class="card" data-k="title" value="${escapeHtml(item.title || '')}">
        </div>
        <div class="field">
          <label>Sottotitolo</label>
          <input class="card" data-k="subtitle" value="${escapeHtml(item.subtitle || '')}">
        </div>
        <div class="field">
          <label>Paragrafo</label>
          <input class="card" data-k="text" value="${escapeHtml(item.text || '')}">
        </div>
      </div>
      <div class="cv-actions">
        <button class="btn" data-action="save">Salva</button>
        <button class="btn" data-action="remove">Elimina</button>
      </div>
    </div>
  `).join('');
}

// Escaping basico per iniettare in HTML
function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function initEditor() {
    // Tabs
    const tabs = $$('.tab-btn');
    const panels = $$('.panel');
    function show(id) {
        tabs.forEach(t => t.setAttribute('aria-selected', String(t.id === 'tab-' + id)));
        panels.forEach(p => p.setAttribute('aria-hidden', String(p.id !== 'panel-' + id)));
    }
    tabs.forEach(btn => btn.addEventListener('click', () => show(btn.id.replace('tab-', ''))));

    // Bind initial
    bindHome();
    bindAbout();

    // Inputs generali (one-way update in state)
    document.getElementById('panel-home').addEventListener('input', (e) => {
        const el = e.target;
        if (!el.id) return;
        setByPath(state, el.id, el.value);
    });
    document.getElementById('panel-about').addEventListener('input', (e) => {
        const el = e.target;
        if (!el.id) return;
        setByPath(state, el.id, el.value);
    });

    // Servizi (fissi)
    document.getElementById('services-editor').addEventListener('input', (e) => {
        const el = e.target;
        if (!el.id) return;
        setByPath(state, el.id, el.value);
    });

    // CV save/remove
    document.getElementById('cv-list-editor').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const item = e.target.closest('.cv-item');
        const idx = parseInt(item.dataset.idx, 10);
        if (btn.dataset.action === 'remove') {
            state.about.cv.splice(idx, 1);
            renderCV();
            toast('Voce rimossa');
        } else if (btn.dataset.action === 'save') {
            const inputs = item.querySelectorAll('input[data-k]');
            inputs.forEach(inp => state.about.cv[idx][inp.dataset.k] = inp.value.trim());
            toast('Voce salvata');
        }
    });

    // Aggiungi CV
    $('#cv-add').addEventListener('click', () => {
        state.about = state.about || {};
        state.about.cv = state.about.cv || [];
        state.about.cv.push({ title: "Titolo", subtitle: "", text: "" });
        renderCV();
    });

    // Download / Import
    $('#download').addEventListener('click', downloadJSON);
    $('#import').addEventListener('change', importJSON);
}

function setByPath(obj, path, val) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        cur[k] ??= {};
        cur = cur[k];
    }
    cur[keys[keys.length - 1]] = val;
}

function downloadJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

async function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
        state = JSON.parse(text);
        bindHome(); bindAbout();
        toast('JSON importato');
    } catch {
        alert('JSON non valido');
    }
}

// mini toast
function toast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
        position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
        background: '#16161a', color: 'var(--text)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', zIndex: 9999, boxShadow: '0 6px 30px #0007'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
}
