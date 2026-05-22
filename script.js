const API = 'https://restcountries.com/v3.1';

let allCountries = [];
let filtered = [];
let activeRegion = 'all';
let searchQuery = '';
let sortMode = 'name';

// DOM
const grid = document.getElementById('countryGrid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('errorMsg');
const emptyMsg = document.getElementById('emptyMsg');
const emptyQuery = document.getElementById('emptyQuery');
const resultsLabel = document.getElementById('resultsLabel');
const countryCount = document.getElementById('countryCount');
const sortSelect = document.getElementById('sortSelect');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const retryBtn = document.getElementById('retryBtn');

// Fetch all countries
async function fetchCountries() {
  showLoading(true);
  try {
    const res = await fetch(`${API}/all?fields=name,flags,population,capital,region,subregion,area,languages,currencies,timezones,maps,cca2`);
    if (!res.ok) throw new Error('Failed');
    allCountries = await res.json();
    countryCount.textContent = `${allCountries.length} countries`;
    applyFilters();
    showLoading(false);
  } catch(e) {
    showLoading(false);
    errorMsg.classList.remove('hidden');
  }
}

function showLoading(show) {
  loading.classList.toggle('hidden', !show);
  errorMsg.classList.add('hidden');
  emptyMsg.classList.add('hidden');
}

function applyFilters() {
  let results = [...allCountries];
  if(activeRegion !== 'all') results = results.filter(c => c.region === activeRegion);
  if(searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(c =>
      c.name.common.toLowerCase().includes(q) ||
      c.name.official.toLowerCase().includes(q) ||
      (c.capital && c.capital[0] && c.capital[0].toLowerCase().includes(q)) ||
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
  filtered = results;
  resultsLabel.textContent = `${results.length} ${results.length === 1 ? 'country' : 'countries'}`;
  if(results.length === 0 && searchQuery) {
    emptyQuery.textContent = searchQuery;
    emptyMsg.classList.remove('hidden');
    grid.innerHTML = '';
  } else {
    emptyMsg.classList.add('hidden');
    renderGrid(results);
  }
}

function renderGrid(countries) {
  grid.innerHTML = '';
  countries.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${Math.min(i * 20, 300)}ms`;
    card.innerHTML = `
      <img class="card-flag" src="${c.flags.svg || c.flags.png}" alt="${c.name.common} flag" loading="lazy" />
      <div class="card-body">
        <div class="card-name">${c.name.common}</div>
        <div class="card-info">
          <span><strong>Capital:</strong> ${c.capital?.[0] || '—'}</span>
          <span><strong>Population:</strong> ${formatNum(c.population)}</span>
          <span><strong>Area:</strong> ${c.area ? formatNum(Math.round(c.area)) + ' km²' : '—'}</span>
        </div>
        <span class="card-region">${c.region}</span>
      </div>`;
    card.addEventListener('click', () => openModal(c));
    grid.appendChild(card);
  });
}

function openModal(c) {
  const currencies = c.currencies
    ? Object.values(c.currencies).map(cur => `${cur.name}${cur.symbol ? ' (' + cur.symbol + ')' : ''}`).join(', ')
    : '—';
  const timezones = c.timezones?.slice(0, 3).join(', ') + (c.timezones?.length > 3 ? '…' : '') || '—';

  modalBody.innerHTML = `
    <img class="modal-flag" src="${c.flags.svg || c.flags.png}" alt="${c.name.common} flag" />
    <div class="modal-content">
      <div class="modal-name">${c.name.common}</div>
      <div class="modal-native">${c.name.official}</div>
      <div class="modal-grid">
        <div class="modal-stat"><label>Capital</label><span>${c.capital?.[0] || '—'}</span></div>
        <div class="modal-stat"><label>Region</label><span>${c.region}${c.subregion ? ' · ' + c.subregion : ''}</span></div>
        <div class="modal-stat"><label>Population</label><span>${formatNum(c.population)}</span></div>
        <div class="modal-stat"><label>Area</label><span>${c.area ? formatNum(Math.round(c.area)) + ' km²' : '—'}</span></div>
        <div class="modal-stat"><label>Currency</label><span>${currencies}</span></div>
        <div class="modal-stat"><label>Timezone</label><span>${timezones}</span></div>
      </div>
      <div class="modal-section-title">Languages</div>
      <div class="modal-tags">
        ${c.languages ? Object.values(c.languages).map(l => `<span class="modal-tag">${l}</span>`).join('') : '<span class="modal-tag">—</span>'}
      </div>
      ${c.maps?.googleMaps ? `<a class="modal-maps-btn" href="${c.maps.googleMaps}" target="_blank">🗺 View on Maps</a>` : ''}
    </div>`;
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function formatNum(n) {
  if(n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if(n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if(n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if(e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  clearBtn.classList.toggle('hidden', !searchQuery);
  applyFilters();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = ''; searchQuery = '';
  clearBtn.classList.add('hidden');
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

fetchCountries();
