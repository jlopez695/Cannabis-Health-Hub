/* ──────────────── script.js ──────────────── */
/* 0) Debug: clear old logs */
console.clear();
console.log('script.js loaded');

/* ────────────────────────────────────────────
   1) MAIN PORTAL LOGIC  (apps / filters grid)
──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  /* Bail out if this page doesn’t have cards grid */
  const cardsGrid = document.getElementById('cards');
  if (!cardsGrid) return;   // not on portal page

  /* 1a) Load apps.json (+ articles & studies) */
  let appsRaw;
  try {
    console.log('fetching apps.json…');
    const resp = await fetch('apps.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    appsRaw = await resp.json();
    console.log('apps.json loaded:', appsRaw);
  } catch (err) {
    console.error('failed to load apps.json:', err);
    cardsGrid.innerHTML =
      '<p style="color:red;">Error loading data. Check console.</p>';
    return;
  }

  /* 1b) Prep data */
  const items = appsRaw.map((obj, i) => ({ ...obj, _idx: i }));

  /* 1c) Cache DOM refs for filters */
  const panel       = document.querySelector('.filters-panel');
  const toggleBtn   = document.getElementById('toggle-filters');
  const sortMenu    = document.getElementById('sort-menu');
  const mainButtons = Array.from(document.querySelectorAll('.main-filter'));
  const allChecks   = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
  let activeMain = null;

  /* 1d) Build a card */
  function createCardHTML(item) {
    const extraClass =
      item.type === 'article' ? 'card--article'
      : item.type === 'study' ? 'card--study'
      : 'card--app';

    const isApp = item.type === 'app';
    const badgeBlock = isApp
      ? `
        <div class="store-links">
          ${item.app  ? `<a href="${item.app}"  class="app-store"  target="_blank">
                           App Store <img src="./images/app-store-icon.png" alt="App Store">
                         </a>` : ''}
          ${item.play ? `<a href="${item.play}" class="play-store" target="_blank">
                           Play Store <img src="./images/play-store-logo.jpg" alt="Play Store">
                         </a>` : ''}
          <span class="store-rating">${item.rating}★</span>
        </div>`
      : `
        <a href="${item.url}" class="read-more" target="_blank">
          Read ${item.type === 'study' ? 'Study' : 'Article'}
        </a>`;

    return `
      <article class="card ${extraClass}">
        <h2>${item.name}</h2>
        <img src="${item.logo}" alt="${item.name} thumbnail">
        ${badgeBlock}
        <p class="description">${item.desc}</p>
      </article>`;
  }

  /* 1e) Render helpers */
  const renderCards = list =>
    (cardsGrid.innerHTML = list.map(createCardHTML).join(''));

  function applyFiltersAndSort() {
    /* read checkbox filters */
    let typeChecks = [], genreChecks = [], subChecks = [];
    panel.querySelectorAll('.filter-section').forEach(sec => {
      const heading = sec.querySelector('h3').textContent.trim().toLowerCase();
      const checked = Array.from(sec.querySelectorAll('input:checked'))
        .map(cb => cb.parentElement.textContent.trim().toLowerCase());
      if (heading === 'type')      typeChecks = checked;
      else if (heading === 'genre') genreChecks = checked;
      else                          subChecks  = checked;
    });

    /* filter */
    const view = items.filter(it => {
      const mainOK  = !activeMain || it.main === activeMain;
      const typeOK  = !typeChecks.length  || typeChecks.includes(it.type.toLowerCase());
      const genreOK = !genreChecks.length || genreChecks.includes(it.genre.toLowerCase());
      const subsOK  = !subChecks.length   ||
                      subChecks.some(s => it.subs.map(x=>x.toLowerCase()).includes(s));
      return mainOK && typeOK && genreOK && subsOK;
    });

    /* sort */
    switch (sortMenu.value) {
      case 'name':
        view.sort((a,b) => a.name.localeCompare(b.name));           break;
      case 'rating':
        view.sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0) ||
                           a.name.localeCompare(b.name));           break;
      case 'reviews':
        view.sort((a,b) => (b.reviews ?? 0) - (a.reviews ?? 0) ||
                           a.name.localeCompare(b.name));           break;
      default: view.sort((a,b) => a._idx - b._idx);
    }
    renderCards(view);
  }

  /* 1f) Wire up UI */
  toggleBtn.addEventListener('click', () => {
    const open = panel.classList.toggle('active');
    toggleBtn.firstChild.textContent = open ? 'Hide Filters' : 'Show Filters';
  });

  panel.querySelectorAll('.filter-section h3').forEach(h3 =>
    h3.addEventListener('click', () =>
      h3.parentElement.classList.toggle('collapsed')
    )
  );

  mainButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      mainButtons.forEach(b => b.classList.remove('active'));
      activeMain = null;
      if (!wasActive) {
        btn.classList.add('active');
        activeMain = btn.textContent.trim().toLowerCase();
      }
      applyFiltersAndSort();
    });
  });

  allChecks.forEach(cb => cb.addEventListener('change', applyFiltersAndSort));
  sortMenu.addEventListener('change', applyFiltersAndSort);

  /* 1g) Initial render */
  applyFiltersAndSort();
});

/* ────────────────────────────────────────────
   2) FAQ PAGE LOGIC
──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('faq-container');
  if (!container) return;   // not on FAQ page

  try {
    const res  = await fetch('faq.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const faqs = await res.json();

    /* group & render */
    const grouped = {};
    faqs.forEach(f => (grouped[f.category] ??= []).push(f));

    for (const cat in grouped) {
      container.insertAdjacentHTML('beforeend',
        `<h2 class="faq-category">${cat}</h2>`);

      grouped[cat].forEach(faq => {
        container.insertAdjacentHTML('beforeend', `
          <div class="faq-item">
            <button class="faq-question">
              ${faq.question} <span class="faq-arrow">▼</span>
            </button>
            <div class="faq-answer"><p class="faq-p">${faq.answer}</p></div>
          </div>`);
      });
    }

    /* toggle answers */
    container.addEventListener('click', e => {
      if (e.target.closest('.faq-question')) {
        e.target.closest('.faq-item').classList.toggle('open');
      }
    });
  } catch (err) {
    console.error('failed to load faq.json:', err);
  }
});

/* ────────────────────────────────────────────
   3) CONTRIBUTORS PAGE LOGIC
──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('profile-container');
  if (!container) return;   // not on Contributors page

  try {
    const res = await fetch('contributors.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const profiles = await res.json();

    profiles.forEach(p => {
      container.insertAdjacentHTML('beforeend', `
        <div class="profile-card">
          <img src="${p.image}" alt="${p.name}" class="profile-img">
          <h3>${p.name}</h3>
          <p>${p.title}</p>
          <p>Email: <a href="mailto:${p.email}">${p.email}</a></p>
          ${p.phone ? `<p>Phone: ${p.phone}</p>` : ''}
        </div>`);
    });
  } catch (error) {
    console.error('Error loading contributor data:', error);
  }
});
/* ──────────────── end script.js ──────────────── */
