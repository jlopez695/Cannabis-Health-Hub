/* ──────────────── script.js ──────────────── */
/* 0) Debug: clear old logs */
console.clear();
console.log('script.js loaded');

/* -------------------------------------------------
   MAIN LISTENERS (one per page type)
-------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  mainPortalLogic();     /* cards / filters / sort */
  faqLogic();            /* FAQ accordion          */
  contributorsLogic();   /* Contributors grid      */
});

/* =================================================
   1) PORTAL LOGIC  (apps, articles, studies)
================================================= */
async function mainPortalLogic() {
  /* 1a) Make sure we are on the portal page */
  var cardsGrid = document.getElementById('cards');
  if (cardsGrid === null) {
    return;   /* exit if not on portal.html */
  }

  /* 1b) Load apps.json (which also contains articles & studies) */
  var appsRaw;
  try {
    console.log('fetching apps.json…');
    var resp = await fetch('apps.json', { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error('HTTP ' + resp.status);
    }
    appsRaw = await resp.json();
    console.log('apps.json loaded:', appsRaw);
  } catch (err) {
    console.error('failed to load apps.json:', err);
    cardsGrid.innerHTML =
      '<p style="color:red;">Error loading data. Check console.</p>';
    return;
  }

  /* 1c) Copy data into `items` and remember original order */
  var items = [];
  for (var i = 0; i < appsRaw.length; i += 1) {
    var obj = appsRaw[i];
    obj._idx = i;   /* featured order */
    items.push(obj);
  }

  /* 1d) Cache DOM references */
  var panel = document.querySelector('.filters-panel');
  var toggleBtn = document.getElementById('toggle-filters');
  var sortMenu = document.getElementById('sort-menu');
  var mainButtons = document.querySelectorAll('.main-filter');
  var allChecks = panel.querySelectorAll('input[type="checkbox"]');
  var activeMain = null;

  /* 1e) Build card HTML */
  function createCardHTML(item) {
    /* type‑based class */
    var extraClass = 'card--app';
    if (item.type === 'article') {
      extraClass = 'card--article';
    } else if (item.type === 'study') {
      extraClass = 'card--study';
    }

    /* badge block */
    var badgeBlock = '';
    if (item.type === 'app') {
      badgeBlock = '<div class="store-links">';
      if (item.app) {
        badgeBlock +=
          '<a href="' + item.app + '" class="app-store" target="_blank">' +
          'App Store <img src="./images/app-store-icon.png" alt="App Store">' +
          '</a>';
      }
      if (item.play) {
        badgeBlock +=
          '<a href="' + item.play + '" class="play-store" target="_blank">' +
          'Play Store <img src="./images/play-store-logo.jpg" alt="Play Store">' +
          '</a>';
      }
      badgeBlock +=
        '<span class="store-rating">' + (item.rating || '') + '★</span>' +
        '</div>';
    } else {
      var linkText = 'Read Article';
      if (item.type === 'study') {
        linkText = 'Read Study';
      }
      badgeBlock =
        '<a href="' + item.url + '" class="read-more" target="_blank">' +
        linkText +
        '</a>';
    }

    /* assemble */
    var html = '<article class="card ' + extraClass + '">';
    html += '<h2>' + item.name + '</h2>';
    html += '<img src="' + item.logo + '" alt="' + item.name + ' thumbnail">';
    html += badgeBlock;
    html += '<p class="description">' + item.desc + '</p>';
    html += '</article>';
    return html;
  }

  /* 1f) Render helper */
  function renderCards(list) {
    var out = '';
    for (var i = 0; i < list.length; i += 1) {
      out += createCardHTML(list[i]);
    }
    cardsGrid.innerHTML = out;
  }

  /* 1g) Filtering + sorting */
  function applyFiltersAndSort() {
    /* Read check‑box filter selections */
    var typeChecks = [];
    var genreChecks = [];
    var subChecks = [];

    var sections = panel.querySelectorAll('.filter-section');
    for (var s = 0; s < sections.length; s += 1) {
      var sec = sections[s];
      var heading = sec.querySelector('h3').textContent.toLowerCase().trim();
      var checked = sec.querySelectorAll('input:checked');
      var labels = [];

      for (var c = 0; c < checked.length; c += 1) {
        var txt = checked[c].parentElement.textContent.toLowerCase().trim();
        labels.push(txt);
      }

      if (heading === 'type') {
        typeChecks = labels;
      } else if (heading === 'genre') {
        genreChecks = labels;
      } else {
        subChecks = labels;
      }
    }

    /* Filter the data set */
    var view = [];
    for (var i = 0; i < items.length; i += 1) {
      var it = items[i];

      var mainOK = (activeMain === null) || (it.main === activeMain);
      var typeOK = (typeChecks.length === 0) || (typeChecks.indexOf(it.type.toLowerCase()) !== -1);
      var genreOK = (genreChecks.length === 0) || (genreChecks.indexOf(it.genre.toLowerCase()) !== -1);

      var subsOK = false;
      if (subChecks.length === 0) {
        subsOK = true;
      } else {
        for (var x = 0; x < it.subs.length; x += 1) {
          if (subChecks.indexOf(it.subs[x].toLowerCase()) !== -1) {
            subsOK = true;
            break;
          }
        }
      }

      if (mainOK && typeOK && genreOK && subsOK) {
        view.push(it);
      }
    }

    /* Sort (and, where required, narrow the list) */
    if (sortMenu.value === 'name') {
      /* A → Z for everything */
      view.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

    } else if (sortMenu.value === 'rating') {
      /* Highest rated – apps only */
      var onlyApps = [];
      for (var r = 0; r < view.length; r += 1) {
        if (view[r].type === 'app') {
          onlyApps.push(view[r]);
        }
      }
      onlyApps.sort(function (a, b) {
        var diff = (b.rating || 0) - (a.rating || 0);
        if (diff !== 0) { return diff; }
        return a.name.localeCompare(b.name);
      });
      view = onlyApps;

    } else if (sortMenu.value === 'reviews') {
      /* Most reviewed – apps only */
      var appsList = [];
      for (var mv = 0; mv < view.length; mv += 1) {
        if (view[mv].type === 'app') {
          appsList.push(view[mv]);
        }
      }
      appsList.sort(function (a, b) {
        var diff = (b.reviews || 0) - (a.reviews || 0);
        if (diff !== 0) { return diff; }
        return a.name.localeCompare(b.name);
      });
      view = appsList;

    } else if (sortMenu.value === 'date') {
      /* Most recent – articles & studies only */
      var papers = [];
      for (var pd = 0; pd < view.length; pd += 1) {
        if (view[pd].type === 'article' || view[pd].type === 'study') {
          papers.push(view[pd]);
        }
      }
      papers.sort(function (a, b) {
        var da = (a.publicationDate) ? new Date(a.publicationDate) : new Date(0);
        var db = (b.publicationDate) ? new Date(b.publicationDate) : new Date(0);
        var diff = db - da;   /* newest first */
        if (diff !== 0) { return diff; }
        return a._idx - b._idx; /* tie‑break */
      });
      view = papers;

    } else {
      /* Featured – original JSON order */
      view.sort(function (a, b) {
        return a._idx - b._idx;
      });
    }

    /* Render */
    renderCards(view);
  }

  /* 1h) Wire up UI controls */
  toggleBtn.addEventListener('click', function () {
    var open = panel.classList.toggle('active');
    if (open) {
      toggleBtn.firstChild.textContent = 'Hide Filters';
    } else {
      toggleBtn.firstChild.textContent = 'Show Filters';
    }
  });

  var h3s = panel.querySelectorAll('.filter-section h3');
  for (var h = 0; h < h3s.length; h += 1) {
    (function (hdr) {
      hdr.addEventListener('click', function () {
        hdr.parentElement.classList.toggle('collapsed');
      });
    })(h3s[h]);
  }

  for (var mb = 0; mb < mainButtons.length; mb += 1) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var already = btn.classList.contains('active');
        for (var k = 0; k < mainButtons.length; k += 1) {
          mainButtons[k].classList.remove('active');
        }
        activeMain = null;
        if (!already) {
          btn.classList.add('active');
          activeMain = btn.textContent.toLowerCase().trim();
        }
        applyFiltersAndSort();
      });
    })(mainButtons[mb]);
  }

  for (var ac = 0; ac < allChecks.length; ac += 1) {
    allChecks[ac].addEventListener('change', applyFiltersAndSort);
  }
  sortMenu.addEventListener('change', applyFiltersAndSort);

  /* 1i) First render */
  applyFiltersAndSort();
}

/* =================================================
   2) FAQ PAGE LOGIC
================================================= */
function faqLogic() {
  var container = document.getElementById('faq-container');
  if (container === null) {
    return;  /* not on FAQ.html */
  }

  fetch('faq.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (faqs) {
      /* group by category */
      var grouped = {};
      for (var i = 0; i < faqs.length; i += 1) {
        var f = faqs[i];
        if (!grouped[f.category]) {
          grouped[f.category] = [];
        }
        grouped[f.category].push(f);
      }

      /* render */
      for (var cat in grouped) {
        container.insertAdjacentHTML('beforeend',
          '<h2 class="faq-category">' + cat + '</h2>');

        var arr = grouped[cat];
        for (var j = 0; j < arr.length; j += 1) {
          var faq = arr[j];
          var block = '<div class="faq-item">';
          block += '<button class="faq-question">' +
            faq.question +
            ' <span class="faq-arrow">▼</span>' +
            '</button>';
          block += '<div class="faq-answer"><p class="faq-p">' +
            faq.answer +
            '</p></div>';
          block += '</div>';
          container.insertAdjacentHTML('beforeend', block);
        }
      }

      container.addEventListener('click', function (e) {
        var btn = e.target.closest('.faq-question');
        if (btn) {
          btn.closest('.faq-item').classList.toggle('open');
        }
      });
    })
    .catch(function (err) {
      console.error('failed to load faq.json:', err);
    });
}

/* =================================================
   3) CONTRIBUTORS PAGE LOGIC
================================================= */
function contributorsLogic() {
  var container = document.getElementById('profile-container');
  if (container === null) {
    return;  /* not on contributors.html */
  }

  fetch('contributors.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (profiles) {
      for (var i = 0; i < profiles.length; i += 1) {
        var p = profiles[i];
        var html = '<div class="profile-card">';
        html += '<img src="' + p.image + '" alt="' + p.name + '" class="profile-img">';
        html += '<h3>' + p.name + '</h3>';
        html += '<p>' + p.title + '</p>';
        html += '<p>Email: <a href="mailto:' + p.email + '">' + p.email + '</a></p>';
        if (p.phone) {
          html += '<p>Phone: ' + p.phone + '</p>';
        }
        html += '</div>';
        container.insertAdjacentHTML('beforeend', html);
      }
    })
    .catch(function (error) {
      console.error('Error loading contributor data:', error);
    });
}

/* ──────────────── end script.js ──────────────── */
