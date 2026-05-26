const API = 'https://restcountries.com/v3.1';
const FIELDS = 'name,flags,population,capital,region,subregion,area,languages,currencies,cca2';

let allCountries = [];
let activeRegion = 'all';
let searchQuery = '';
let sortMode = 'name';
let currentView = 'all';
let favorites = JSON.parse(localStorage.getItem('countryFavorites') || '[]');

// DOM refs
const grid = document.getElementById('countryGrid');
const skeletonGrid = document.getElementById('skeletonGrid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const errorMsg = document.getElementById('errorMsg');
const emptyMsg = document.getElementById('emptyMsg');
const emptyText = document.getElementById('emptyText');
const resultsLabel = document.getElementById('resultsLabel');
const countryCount = document.getElementById('countryCount');
const sortSelect = document.getElementById('sortSelect');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const retryBtn = document.getElementById('retryBtn');
const favBadge = document.getElementById('favBadge');
const toast = document.getElementById('toast');
const filtersRow = document.getElementById('filtersRow');
const themeToggle = document.getElementById('themeToggle');
const scrollTopBtn = document.getElementById('scrollTop');
const heroCounter = document.getElementById('heroCounter');
const heroBg = document.getElementById('heroBg');
const suggestions = document.getElementById('suggestions');

// ── THEME ──
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
});

// ── SCROLL TOP ──
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('hidden', window.scrollY < 300);
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── HERO BG FLAGS ──
const flagEmojis = ['🇳🇵','🇺🇸','🇯🇵','🇫🇷','🇧🇷','🇮🇳','🇩🇪','🇨🇳','🇬🇧','🇰🇷','🇮🇹','🇨🇦','🇦🇺','🇲🇽','🇷🇺','🇿🇦','🇦🇷','🇪🇸','🇹🇷','🇮🇩'];
function buildHeroBg() {
  heroBg.innerHTML = '';
  flagEmojis.forEach((f, i) => {
    const span = document.createElement('span');
    span.textContent = f;
    span.style.left = `${Math.random() * 100}%`;
    span.style.animationDuration = `${12 + Math.random() * 14}s`;
    span.style.animationDelay = `${Math.random() * 12}s`;
    heroBg.appendChild(span);
  });
}
buildHeroBg();

// ── COUNTER ANIMATION ──
function animateCounter(target) {
  let current = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    heroCounter.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 16);
}

// ── FETCH ──
async function fetchCountries() {
  skeletonGrid.style.display = 'grid';
  grid.innerHTML = '';
  errorMsg.classList.add('hidden');

  try {
    const res = await fetch(`${API}/all?fields=${FIELDS}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allCountries = await res.json();
    skeletonGrid.style.display = 'none';
    countryCount.textContent = `${allCountries.length} countries`;
    animateCounter(allCountries.length);
    applyFilters();
  } catch(e) {
    console.error(e);
    skeletonGrid.style.display = 'none';
    errorMsg.classList.remove('hidden');
  }
}

// ── FAVORITES ──
function isFav(cca2) { return favorites.includes(cca2); }

function toggleFav(cca2, name) {
  if (isFav(cca2)) {
    favorites = favorites.filter(f => f !== cca2);
    showToast(`Removed ${name} from favorites`);
  } else {
    favorites.push(cca2);
    showToast(`❤️ Added ${name} to favorites`);
  }
  localStorage.setItem('countryFavorites', JSON.stringify(favorites));
  updateFavBadge();
  if (currentView === 'favorites') applyFilters();
  document.querySelectorAll(`[data-fav-cca="${cca2}"]`).forEach(btn => {
    btn.classList.toggle('active', isFav(cca2));
    btn.textContent = isFav(cca2) ? '❤️' : '🤍';
  });
}

function updateFavBadge() {
  favBadge.textContent = favorites.length;
  favBadge.style.display = favorites.length > 0 ? 'inline' : 'none';
}

// ── FILTERS ──
function applyFilters() {
  let results = [...allCountries];

  if (currentView === 'favorites') {
    results = results.filter(c => isFav(c.cca2));
    filtersRow.style.opacity = '0.4';
    filtersRow.style.pointerEvents = 'none';
  } else {
    filtersRow.style.opacity = '';
    filtersRow.style.pointerEvents = '';
    if (activeRegion !== 'all') results = results.filter(c => c.region === activeRegion);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(c =>
      c.name.common.toLowerCase().includes(q) ||
      c.name.official.toLowerCase().includes(q) ||
      (c.capital?.[0] || '').toLowerCase().includes(q) ||
      (c.region || '').toLowerCase().includes(q) ||
      (c.subregion || '').toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => {
    switch (sortMode) {
      case 'name': return a.name.common.localeCompare(b.name.common);
      case 'name-desc': return b.name.common.localeCompare(a.name.common);
      case 'population': return b.population - a.population;
      case 'population-asc': return a.population - b.population;
      case 'area': return (b.area || 0) - (a.area || 0);
      default: return 0;
    }
  });

  resultsLabel.textContent = `${results.length} ${results.length === 1 ? 'country' : 'countries'}`;

  if (results.length === 0) {
    emptyMsg.classList.remove('hidden');
    grid.innerHTML = '';
    emptyText.innerHTML = currentView === 'favorites' && !searchQuery
      ? '❤️ No favorites yet<br><small style="color:var(--text3)">Click 🤍 on any card to save</small>'
      : `No results${searchQuery ? ` for "<strong>${searchQuery}</strong>"` : ''}`;
  } else {
    emptyMsg.classList.add('hidden');
    renderGrid(results);
  }
}

// ── RENDER ──
function renderGrid(countries) {
  grid.innerHTML = '';
  countries.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.region = c.region;
    card.style.animationDelay = `${Math.min(i * 18, 400)}ms`;
    const favActive = isFav(c.cca2);
    card.innerHTML = `
      <button class="card-fav-btn ${favActive ? 'active' : ''}" data-fav-cca="${c.cca2}">${favActive ? '❤️' : '🤍'}</button>
      <img class="card-flag" src="${c.flags?.svg || c.flags?.png || ''}" alt="${c.name.common} flag" loading="lazy" />
      <div class="card-body">
        <div class="card-name">${c.name.common}</div>
        <div class="card-info">
          <span><strong>Capital:</strong> ${c.capital?.[0] || '—'}</span>
          <span><strong>Population:</strong> ${fmt(c.population)}</span>
          <span><strong>Area:</strong> ${c.area ? fmt(Math.round(c.area)) + ' km²' : '—'}</span>
        </div>
        <div class="card-footer">
          <span class="card-region">${c.region}</span>
        </div>
      </div>`;
    card.querySelector('.card-fav-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFav(c.cca2, c.name.common);
    });
    card.addEventListener('click', () => openModal(c));
    grid.appendChild(card);
  });
}

// ── MODAL ──
function openModal(c) {
  const currencies = c.currencies
    ? Object.values(c.currencies).map(x => `${x.name}${x.symbol ? ' (' + x.symbol + ')' : ''}`).join(', ')
    : '—';
  const langs = c.languages ? Object.values(c.languages) : [];
  const favActive = isFav(c.cca2);

  // Neighbors not available without borders field
  let neighborsHTML = '';

  modalBody.innerHTML = `
    <div class="modal-flag-wrap">
      <img class="modal-flag" src="${c.flags?.svg || c.flags?.png || ''}" alt="${c.name.common} flag" />
      <div class="modal-flag-grad"></div>
    </div>
    <div class="modal-content">
      <div class="modal-name">${c.name.common}</div>
      <div class="modal-native">${c.name.official}</div>
      <div class="modal-grid">
        <div class="modal-stat"><label>Capital</label><span>${c.capital?.[0] || '—'}</span></div>
        <div class="modal-stat"><label>Region</label><span>${c.region}${c.subregion ? ' · ' + c.subregion : ''}</span></div>
        <div class="modal-stat"><label>Population</label><span>${fmt(c.population)}</span></div>
        <div class="modal-stat"><label>Area</label><span>${c.area ? fmt(Math.round(c.area)) + ' km²' : '—'}</span></div>
        <div class="modal-stat"><label>Currency</label><span>${currencies}</span></div>
        <div class="modal-stat"><label>Languages</label><span>${langs.join(', ') || '—'}</span></div>
      </div>
      ${langs.length > 2 ? `
        <div class="modal-section-title">Languages</div>
        <div class="modal-tags">${langs.map(l => `<span class="modal-tag">${l}</span>`).join('')}</div>
      ` : ''}
      ${neighborsHTML}
      <div class="modal-actions">
        <button class="modal-fav-btn ${favActive ? 'active' : ''}" data-fav-cca="${c.cca2}">
          ${favActive ? '❤️ Saved' : '🤍 Save to Favorites'}
        </button>
      </div>
    </div>`;

  // Neighbor chip clicks
  modalBody.querySelectorAll('.modal-neighbor-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const neighbor = allCountries.find(x => x.cca2 === chip.dataset.cca2);
      if (neighbor) openModal(neighbor);
    });
  });

  modalBody.querySelector('.modal-fav-btn').addEventListener('click', function() {
    toggleFav(c.cca2, c.name.common);
    const nowFav = isFav(c.cca2);
    this.classList.toggle('active', nowFav);
    this.textContent = nowFav ? '❤️ Saved' : '🤍 Save to Favorites';
  });

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── SEARCH SUGGESTIONS ──
function showSuggestions(q) {
  if (!q || q.length < 1) { suggestions.classList.remove('open'); return; }
  const matches = allCountries
    .filter(c => c.name.common.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 5);
  if (!matches.length) { suggestions.classList.remove('open'); return; }

  suggestions.innerHTML = matches.map(c => {
    const highlighted = c.name.common.replace(
      new RegExp(`(${q})`, 'gi'),
      '<mark>$1</mark>'
    );
    return `
      <div class="suggestion-item" data-cca2="${c.cca2}">
        <span class="suggestion-flag">${c.flags?.emoji || '🏳'}</span>
        <div>
          <div class="suggestion-name">${highlighted}</div>
          <div class="suggestion-sub">${c.capital?.[0] || ''} · ${c.region}</div>
        </div>
      </div>`;
  }).join('');

  suggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const c = allCountries.find(x => x.cca2 === item.dataset.cca2);
      if (c) {
        searchInput.value = c.name.common;
        searchQuery = c.name.common;
        suggestions.classList.remove('open');
        clearBtn.classList.remove('hidden');
        applyFilters();
        openModal(c);
      }
    });
  });

  suggestions.classList.add('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) suggestions.classList.remove('open');
});

// ── TOAST ──
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.add('hidden'), 2400);
}

// ── FORMAT ──
function fmt(n) {
  if (!n) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ── EVENTS ──
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  clearBtn.classList.toggle('hidden', !searchQuery);
  applyFilters();
  showSuggestions(searchQuery);
});

clearBtn.addEventListener('click', () => {
  searchInput.value = ''; searchQuery = '';
  clearBtn.classList.add('hidden');
  suggestions.classList.remove('open');
  applyFilters();
});

document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeRegion = pill.dataset.region;
    applyFilters();
  });
});

sortSelect.addEventListener('change', () => { sortMode = sortSelect.value; applyFilters(); });
retryBtn.addEventListener('click', fetchCountries);

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    applyFilters();
  });
});

updateFavBadge();
fetchCountries();