// Carica /data/content.json e popola DOM via data-content, data-src, data-href
(async function () {
    const res = await fetch('data/content.json', { cache: 'no-store' });
    const data = await res.json();

    const getByPath = (obj, path) =>
        path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);

    document.querySelectorAll('[data-content]').forEach(el => {
        const val = getByPath(data, el.dataset.content);
        if (val == null) return;
        el.textContent = val;
    });
    document.querySelectorAll('[data-src]').forEach(el => {
        const val = getByPath(data, el.dataset.src);
        if (val) el.setAttribute('src', val);
    });
    document.querySelectorAll('[data-href]').forEach(el => {
        const val = getByPath(data, el.dataset.href);
        if (val) el.setAttribute('href', val);
    });

    // CV list on about page
    const cvWrap = document.getElementById('cv-list');
    if (cvWrap && data.about?.cv) {
        cvWrap.innerHTML = data.about.cv.map(item => `
      <li class="card">
        <h3>${item.title}</h3>
        ${item.subtitle ? `<div class="muted">${item.subtitle}</div>` : ''}
        ${item.text ? `<p>${item.text}</p>` : ''}
      </li>
    `).join('');
    }
})();
