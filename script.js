const API = 'https://restcountries.com/v3.1';
const KEY_FAVORITES = 'countryFavorites';
const KEY_THEME = 'themeMode';

let allCountries = [];
let activeRegion = 'all';
let searchQuery = '';
let sortMode = 'name';
let currentView = 'all';
let favorites = JSON.parse(localStorage.getItem(KEY_FAVORITES) || '[]');
let themeMode = 'light';

// DOM
const grid = document.getElementById('countryGrid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const skeletonGrid = document.getElementById('skeletonGrid');
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
const heroCounter = document.getElementById('heroCounter');
const suggestionsList = document.getElementById('suggestionsList');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const footerInfo = document.getElementById('footerInfo');

async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch(e) {
    clearTimeout(id);
    throw e;
  }
}

async function fetchCountries() {
  showLoading(true);
  showSkeleton(true);
  const fields = 'name,flags,population,capital,region,subregion,area,languages,currencies,cca2,cca3,borders';

  try {
    const res = await fetchWithTimeout(`${API}/all?fields=${fields}`);
    if (res.ok) {
      allCountries = await res.json();
      onCountriesLoaded();
      return;
    }
    throw new Error('Bad response');
  } catch (e) {
    console.warn('Primary API failed:', e.message);
    showLoading(false);
    showSkeleton(false);
    errorMsg.classList.remove('hidden');
  }
}

function onCountriesLoaded() {
  heroCountUp(allCountries.length);
  countryCount.textContent = `${allCountries.length} countries`;
  footerInfo.textContent = `${allCountries.length} countries loaded · Data via restcountries.com`;
  applyFilters();
  showLoading(false);
  showSkeleton(false);
}

function showLoading(show) {
  loading.classList.toggle('hidden', !show);
  errorMsg.classList.add('hidden');
  emptyMsg.classList.add('hidden');
}

function showSkeleton(show) {
  if (!show) {
    skeletonGrid.innerHTML = '';
    return;
  }
  skeletonGrid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join('');
}

function isFav(cca2) { return favorites.includes(cca2); }

function toggleFav(cca2, name) {
  if(isFav(cca2)) {
    favorites = favorites.filter(f => f !== cca2);
    showToast(`Removed ${name} from favorites`);
  } else {
    favorites.push(cca2);
    showToast(`❤️ Added ${name} to favorites`);
  }
  localStorage.setItem('countryFavorites', JSON.stringify(favorites));
  updateFavBadge();
  if(currentView === 'favorites') applyFilters();
  document.querySelectorAll(`[data-fav-cca="${cca2}"]`).forEach(btn => {
    btn.classList.toggle('active', isFav(cca2));
    btn.textContent = isFav(cca2) ? '❤️' : '🤍';
  });
}

function updateFavBadge() {
  favBadge.textContent = favorites.length;
  favBadge.style.display = favorites.length > 0 ? 'inline' : 'none';
}

function applyFilters() {
  let results = [...allCountries];
  if(currentView === 'favorites') {
    results = results.filter(c => isFav(c.cca2));
    filtersRow.style.opacity = '0.4';
    filtersRow.style.pointerEvents = 'none';
  } else {
    filtersRow.style.opacity = '';
    filtersRow.style.pointerEvents = '';
    if(activeRegion !== 'all') results = results.filter(c => c.region === activeRegion);
  }
  if(searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(c =>
      c.name.common.toLowerCase().includes(q) ||
      c.name.official.toLowerCase().includes(q) ||
      (c.capital?.[0] && c.capital[0].toLowerCase().includes(q)) ||
      c.region.toLowerCase().includes(q) ||
      (c.subregion && c.subregion.toLowerCase().includes(q))
    );
  }
  results.sort((a, b) => {
    switch(sortMode) {
      case 'name': return a.name.common.localeCompare(b.name.common);
      case 'name-desc': return b.name.common.localeCompare(a.name.common);
      case 'population': return b.population - a.population;
      case 'population-asc': return a.population - b.population;
      case 'area': return (b.area || 0) - (a.area || 0);
      default: return 0;
    }
  });
  resultsLabel.textContent = `${results.length} ${results.length === 1 ? 'country' : 'countries'}`;
  if(results.length === 0) {
    emptyMsg.classList.remove('hidden');
    grid.innerHTML = '';
    if(currentView === 'favorites' && !searchQuery) {
      emptyText.innerHTML = '❤️ No favorite countries yet<br><small style="color:#9896aa;font-size:0.85rem">Click 🤍 on any country card to save it</small>';
    } else {
      emptyText.textContent = `No countries found${searchQuery ? ` for "${searchQuery}"` : ''}`;
    }
  } else {
    emptyMsg.classList.add('hidden');
    renderGrid(results);
  }
  renderSuggestions(searchQuery);
}

function renderGrid(countries) {
  grid.innerHTML = '';
  countries.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = `card region-${c.region || 'all'}`;
    card.style.animationDelay = `${Math.min(i * 20, 300)}ms`;
    const favActive = isFav(c.cca2);
    const currencyList = c.currencies
      ? Object.values(c.currencies).map(cur => `${cur.name}${cur.symbol ? ' (' + cur.symbol + ')' : ''}`).join(', ')
      : '—';
    const languages = c.languages ? Object.values(c.languages).join(', ') : '—';
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <button class="card-fav-btn ${favActive ? 'active' : ''}" data-fav-cca="${c.cca2}" data-fav-name="${c.name.common}">${favActive ? '❤️' : '🤍'}</button>
          <img class="card-flag" src="${c.flags?.svg || c.flags?.png || ''}" alt="${c.name.common} flag" loading="lazy" />
          <div class="card-body">
            <div class="card-name">${c.name.common}</div>
            <div class="card-info">
              <span><strong>Capital:</strong> ${c.capital?.[0] || '—'}</span>
              <span><strong>Population:</strong> ${formatNum(c.population)}</span>
              <span><strong>Area:</strong> ${c.area ? formatNum(Math.round(c.area)) + ' km²' : '—'}</span>
            </div>
            <span class="card-region">${c.region}</span>
          </div>
        </div>
        <div class="card-back">
          <h3>More about ${c.name.common}</h3>
          <p><strong>Languages:</strong> ${languages}</p>
          <p><strong>Currency:</strong> ${currencyList}</p>
          <small>Click for full details.</small>
        </div>
      </div>`;
    const favButton = card.querySelector('.card-fav-btn');
    favButton.addEventListener('click', e => {
      e.stopPropagation();
      toggleFav(c.cca2, c.name.common);
    });
    card.addEventListener('click', () => openModal(c));
    grid.appendChild(card);
  });
}

function openModal(c) {
  const currencies = c.currencies
    ? Object.values(c.currencies).map(cur => `${cur.name}${cur.symbol ? ' (' + cur.symbol + ')' : ''}`).join(', ')
    : '—';
  const languages = c.languages ? Object.values(c.languages).join(', ') : '—';
  const favActive = isFav(c.cca2);
  const neighbors = c.borders
    ? allCountries.filter(country => c.borders.includes(country.cca3))
    : [];
  const neighborChips = neighbors.length
    ? neighbors.map(n => `<button class="modal-tag" data-cca3="${n.cca3}">${n.name.common}</button>`).join('')
    : '<span>None available</span>';

  modalBody.innerHTML = `
    <div class="modal-flag-wrapper">
      <img class="modal-flag" src="${c.flags?.svg || c.flags?.png || ''}" alt="${c.name.common} flag" />
    </div>
    <div class="modal-content">
      <div class="modal-name">${c.name.common}</div>
      <div class="modal-native">${c.name.official}</div>
      <div class="modal-grid">
        <div class="modal-stat"><label>Capital</label><span>${c.capital?.[0] || '—'}</span></div>
        <div class="modal-stat"><label>Region</label><span>${c.region}${c.subregion ? ' · ' + c.subregion : ''}</span></div>
        <div class="modal-stat"><label>Population</label><span>${formatNum(c.population)}</span></div>
        <div class="modal-stat"><label>Area</label><span>${c.area ? formatNum(Math.round(c.area)) + ' km²' : '—'}</span></div>
        <div class="modal-stat"><label>Currency</label><span>${currencies}</span></div>
        <div class="modal-stat"><label>Languages</label><span>${languages}</span></div>
      </div>
      <div class="modal-section-title">Neighboring Countries</div>
      <div class="modal-tags">${neighborChips}</div>
      <div style="display:flex;gap:8px;margin-top:1rem;flex-wrap:wrap">
        <button class="modal-fav-btn ${favActive ? 'active' : ''}" data-fav-cca="${c.cca2}" data-fav-name="${c.name.common}">
          ${favActive ? '❤️ Saved' : '🤍 Save to Favorites'}
        </button>
        <a class="modal-maps-btn" href="https://www.google.com/maps/search/${encodeURIComponent(c.name.common)}" target="_blank" rel="noreferrer">View on Map</a>
      </div>
    </div>`;

  modalBody.querySelector('.modal-fav-btn').addEventListener('click', function() {
    toggleFav(c.cca2, c.name.common);
    const nowFav = isFav(c.cca2);
    this.classList.toggle('active', nowFav);
    this.textContent = nowFav ? '❤️ Saved' : '🤍 Save to Favorites';
  });

  modalBody.querySelectorAll('.modal-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetCca3 = btn.dataset.cca3;
      const nextCountry = allCountries.find(cc => cc.cca3 === targetCca3);
      if (nextCountry) openModal(nextCountry);
    });
  });

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.add('hidden'), 2200);
}

function formatNum(n) {
  if(n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if(n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if(n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function heroCountUp(total) {
  const duration = 1200;
  const start = performance.now();
  const step = now => {
    const progress = Math.min((now - start) / duration, 1);
    heroCounter.textContent = formatNum(Math.floor(progress * total));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function setTheme(mode) {
  themeMode = mode;
  document.body.classList.toggle('dark', mode === 'dark');
  themeToggle.textContent = mode === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(KEY_THEME, mode);
}

function initTheme() {
  const stored = localStorage.getItem(KEY_THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(stored || (prefersDark ? 'dark' : 'light'));
}

function renderSuggestions(query) {
  if (!query) {
    suggestionsList.classList.add('hidden');
    suggestionsList.innerHTML = '';
    return;
  }
  const q = query.toLowerCase();
  const matches = allCountries
    .filter(c => c.name.common.toLowerCase().includes(q) || c.capital?.[0]?.toLowerCase().includes(q))
    .slice(0, 5);
  if (!matches.length) {
    suggestionsList.classList.add('hidden');
    suggestionsList.innerHTML = '';
    return;
  }
  suggestionsList.classList.remove('hidden');
  suggestionsList.innerHTML = matches.map(c => {
    const highlight = text => text.replace(new RegExp(`(${q})`, 'gi'), '<strong>$1</strong>');
    return `<button type="button" data-name="${c.name.common}">${highlight(c.name.common)}${c.capital?.[0] ? ` — ${highlight(c.capital[0])}` : ''}</button>`;
  }).join('');
}

function updateScrollButton() {
  scrollTopBtn.classList.toggle('hidden', window.scrollY < 300);
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('scroll', updateScrollButton);
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
themeToggle.addEventListener('click', () => setTheme(themeMode === 'dark' ? 'light' : 'dark'));
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  clearBtn.classList.toggle('hidden', !searchQuery);
  applyFilters();
});
clearBtn.addEventListener('click', () => {
  searchInput.value = ''; searchQuery = '';
  clearBtn.classList.add('hidden');
  renderSuggestions('');
  applyFilters();
});
suggestionsList.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button) return;
  const name = button.dataset.name;
  if (!name) return;
  searchInput.value = name;
  searchQuery = name;
  clearBtn.classList.remove('hidden');
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
initTheme();
fetchCountries();