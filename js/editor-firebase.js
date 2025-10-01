// js/editor-firebase.js
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

const $ = s => document.querySelector(s);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ref = doc(db, 'site', 'content');

const gate = $('#gate');
const appEl = $('#app');
const statusEl = $('#status');

let state = null;
let saveTimer = null;

function toast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
        position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
        background: '#16161a', color: '#fff', border: '1px solid #2a2a2f', borderRadius: '10px', padding: '10px 14px',
        zIndex: 9999, boxShadow: '0 6px 30px #0007'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
}
function setByPath(obj, path, val) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] ??= {}; cur = cur[keys[i]]; }
    cur[keys.at(-1)] = val;
}
async function ensureDoc() {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
            site: { title: "Davide Stabbio — Personal Trainer", tagline: "Performance, postura, risultati reali." },
            hero: { headline: "Allenati al tuo livello, supera i tuoi limiti", subheadline: "Programmi personalizzati e valutazioni su misura", ctaText: "Contattami", ctaLink: "contact.html", image: "assets/images/hero-placeholder.jpg" },
            about: { name: "Davide Stabbio", bio: "", portrait: "assets/images/davide-portrait.jpg", cv: [] },
            services: [
                { title: "Personal Training 1:1", text: "Sessioni su misura con focus su obiettivi concreti." },
                { title: "Programmazione", text: "Piani progressivi basati su evidenze e feedback." },
                { title: "Valutazione Posturale", text: "Screening posturale e consigli pratici." }
            ],
            contact: { email: "contatto@example.com", phone: "+39 345 929 6330", instagram: "https://www.instagram.com/davidestabbio_personalcoach/", location: "Torino, Italia" }
        });
    }
}

function bindHome() {
    $('#hero.headline').value = state.hero?.headline || '';
    $('#hero.subheadline').value = state.hero?.subheadline || '';
    $('#hero.ctaText').value = state.hero?.ctaText || '';
    $('#hero.ctaLink').value = state.hero?.ctaLink || '';
    $('#hero.image').value = state.hero?.image || '';

    const wrap = $('#services-editor');
    wrap.innerHTML = (state.services || []).map((s, i) => `
    <div class="card" style="padding:16px;">
      <div class="field"><label>Servizio ${i + 1} — Titolo</label><input class="card" id="services.${i}.title" value="${s.title || ''}"></div>
      <div class="field"><label>Servizio ${i + 1} — Testo</label><textarea class="card" id="services.${i}.text" rows="3">${s.text || ''}</textarea></div>
    </div>
  `).join('');
}
function renderCV() {
    const list = $('#cv-list-editor');
    const cv = state.about?.cv || [];
    list.innerHTML = cv.map((item, idx) => `
    <div class="cv-item" data-idx="${idx}">
      <div class="row-3">
        <div class="field"><label>Titolo (h3)</label><input class="card" data-k="title" value="${item.title || ''}"></div>
        <div class="field"><label>Sottotitolo</label><input class="card" data-k="subtitle" value="${item.subtitle || ''}"></div>
        <div class="field"><label>Paragrafo</label><input class="card" data-k="text" value="${item.text || ''}"></div>
      </div>
      <div class="cv-actions">
        <button class="btn" data-action="save">Salva</button>
        <button class="btn" data-action="remove">Elimina</button>
      </div>
    </div>
  `).join('');
}
function bindAbout() {
    $('#about.name').value = state.about?.name || '';
    $('#about.portrait').value = state.about?.portrait || '';
    $('#about.bio').value = state.about?.bio || '';
    renderCV();
}
function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        await updateDoc(ref, state);
        toast('Salvato');
    }, 400);
}
function initEditor() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.id.replace('tab-', '');
        document.querySelectorAll('.tab-btn').forEach(t => t.setAttribute('aria-selected', String(t === btn)));
        document.querySelectorAll('.panel').forEach(p => p.setAttribute('aria-hidden', String(p.id !== 'panel-' + id)));
    }));
    bindHome(); bindAbout();

    // Live update + save
    $('#panel-home').addEventListener('input', (e) => { if (!e.target.id) return; setByPath(state, e.target.id, e.target.value); scheduleSave(); });
    $('#panel-about').addEventListener('input', (e) => { if (!e.target.id) return; setByPath(state, e.target.id, e.target.value); scheduleSave(); });
    $('#services-editor').addEventListener('input', (e) => { if (!e.target.id) return; setByPath(state, e.target.id, e.target.value); scheduleSave(); });

    // CV actions
    $('#cv-list-editor').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]'); if (!btn) return;
        const item = e.target.closest('.cv-item'); const idx = parseInt(item.dataset.idx, 10);
        if (btn.dataset.action === 'remove') {
            state.about.cv.splice(idx, 1); await updateDoc(ref, state); renderCV(); toast('Voce rimossa');
        } else {
            const inputs = item.querySelectorAll('input[data-k]');
            inputs.forEach(inp => state.about.cv[idx][inp.dataset.k] = inp.value.trim());
            await updateDoc(ref, state); toast('Voce salvata');
        }
    });
    $('#cv-add').addEventListener('click', async () => {
        state.about ??= {}; state.about.cv ??= [];
        state.about.cv.push({ title: "Titolo", subtitle: "", text: "" });
        await updateDoc(ref, state); renderCV();
    });
}

// Login con Google
$('#login-google')?.addEventListener('click', async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (err) {
        console.error('[Auth error]', err.code, err.message);
        statusEl.textContent = `Errore accesso: ${err.code || 'login_failed'}`;
    }
});

// Auth state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await ensureDoc();
        const snap = await getDoc(ref);
        state = snap.data();
        gate.hidden = true; appEl.hidden = false;
        initEditor();
    } else {
        gate.hidden = false; appEl.hidden = true;
    }
});
