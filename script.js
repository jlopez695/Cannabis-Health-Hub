// script.js

// 0) Debug: clear old logs
console.clear();
console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  // ───── APPS SECTION ─────

  // 1) Fetch apps.json
  let appsRaw;
  try {
    console.log('fetching apps.json…');
    const resp = await fetch('apps.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    appsRaw = await resp.json();
    console.log('apps.json loaded:', appsRaw);
  } catch (err) {
    console.error('failed to load apps.json:', err);
    document.getElementById('cards').innerHTML =
      '<p style="color:red;">Error loading apps. Check console.</p>';
    return;
  }

  // 2) Stamp an index for “Featured” ordering
  const apps = appsRaw.map((app, i) => ({ ...app, _idx: i }));
  console.log('apps with index:', apps);

  // 3) Cache DOM refs
  const panel       = document.querySelector('.filters-panel');
  const toggleBtn   = document.getElementById('toggle-filters');
  const sortMenu    = document.getElementById('sort-menu');
  const mainButtons = Array.from(document.querySelectorAll('.main-filter'));
  const cardsGrid   = document.getElementById('cards');
  const allChecks   = Array.from(panel.querySelectorAll('input[type="checkbox"]'));

  let activeMain = null; // null = show all

  // 4) Card HTML helper
  function createCardHTML(app) {
    return `
      <article class="app-card">
        <h2>${app.name}</h2>
        <img src="${app.logo}" alt="${app.name} icon">
        <div class="store-links">
          ${app.app ? `
            <a href="${app.app}" class="app-store" target="_blank">
              App Store <img src="./images/app-store-icon.png" alt="App Store icon">
            </a>` : ''}
          ${app.play ? `
            <a href="${app.play}" class="play-store" target="_blank">
              Play Store <img src="./images/play-store-logo.jpg" alt="Play Store icon">
            </a>` : ''}
          <span class="store-rating">${app.rating}★</span>
        </div>
        <p class="description">${app.desc}</p>
      </article>`;
  }

  // 5) Render a list of cards
  function renderCards(list) {
    cardsGrid.innerHTML = list.map(createCardHTML).join('');
  }

  // 6) Filter + sort + render
  function applyFiltersAndSort() {
    // 6a) Gather checked values by section
    let typeChecks = [], genreChecks = [], subChecks = [];
    panel.querySelectorAll('.filter-section').forEach(sec => {
      const heading = sec.querySelector('h3').textContent.trim().toLowerCase();
      const checked = Array.from(sec.querySelectorAll('input:checked'))
        .map(cb => cb.parentElement.textContent.trim().toLowerCase());
      if (heading === 'type')      typeChecks = checked;
      else if (heading === 'genre') genreChecks = checked;
      else                           subChecks   = checked;
    });

    // 6b) Filter
    let view = apps.filter(app => {
      const mainOK  = !activeMain || app.main === activeMain;
      const typeOK  = !typeChecks.length  || typeChecks.includes(app.type.toLowerCase());
      const genreOK = !genreChecks.length || genreChecks.includes(app.genre.toLowerCase());
      const subsOK  = !subChecks.length   ||
                      subChecks.some(s => app.subs.map(x=>x.toLowerCase()).includes(s));
      return mainOK && typeOK && genreOK && subsOK;
    });

    console.log('filtered view:', view.map(a => a.name));

    // 6c) Sort
    switch (sortMenu.value) {
      case 'name':
        view.sort((a,b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        view.sort((a,b) => b.rating - a.rating || a.name.localeCompare(b.name));
        break;
      case 'reviews':
        view.sort((a,b) => b.reviews - a.reviews || a.name.localeCompare(b.name));
        break;
      case 'default':
      default:
        view.sort((a,b) => a._idx - b._idx);
    }

    // 6d) Render
    renderCards(view);
  }

  // 7) Wire up UI

  // 7a) Show/Hide filters panel
  toggleBtn.addEventListener('click', () => {
    const open = panel.classList.toggle('active');
    toggleBtn.childNodes[0].textContent = open ? 'Hide Filters' : 'Show Filters';
  });

  // 7b) Accordion toggles
  panel.querySelectorAll('.filter-section h3').forEach(h3 =>
    h3.addEventListener('click', () =>
      h3.parentElement.classList.toggle('collapsed')
    )
  );

  // 7c) Main-category buttons (toggle on / off)
  mainButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      mainButtons.forEach(b => b.classList.remove('active'));
      activeMain = null;
      if (!wasActive) {
        btn.classList.add('active');
        activeMain = btn.textContent.trim().toLowerCase();
      }
      console.log('🎯 activeMain =', activeMain);
      applyFiltersAndSort();
    });
  });

  // 7d) All checkboxes re-filter
  allChecks.forEach(cb => cb.addEventListener('change', applyFiltersAndSort));

  // 7e) Sort menu
  sortMenu.addEventListener('change', applyFiltersAndSort);

  // 8) INITIAL PAINT: clear everything, then filter+sort
  activeMain = null;
  mainButtons.forEach(b => b.classList.remove('active'));
  allChecks.forEach(cb => (cb.checked = false));
  sortMenu.value = 'default';
  console.log('initial render:', apps.map(a => a.name));
  applyFiltersAndSort();
});

// ───── FAQ PAGE SCRIPT ─────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('faq.json');
    const faqs = await res.json();
    const container = document.getElementById('faq-container');

    // Group FAQs by category
    const grouped = {};
    faqs.forEach(faq => {
      const category = faq.category;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(faq);
    });

    // Loop through each category
    for (const category in grouped) {
      // Add category heading
      const heading = document.createElement('h2');
      heading.textContent = category;
      heading.className = 'faq-category';
      container.appendChild(heading);

      // Add each question in that category
      grouped[category].forEach(faq => {
        const item = document.createElement('div');
        item.classList.add('faq-item');
        item.innerHTML = `
          <button class="faq-question">
            ${faq.question} <span class="faq-arrow">▼</span>
          </button>
          <div class="faq-answer"><p class="faq-p">${faq.answer}</p></div>
        `;
        container.appendChild(item);
      });
    }

    // Toggle functionality
    document.querySelectorAll('.faq-question').forEach(button => {
      button.addEventListener('click', () => {
        button.parentElement.classList.toggle('open');
      });
    });

  } catch (err) {
    console.error('failed to load faq.json:', err);
  }
});
