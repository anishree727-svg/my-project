const PRODUCTS_DATA = [
  {
    id: 'orchard-fruits',
    name: 'Orchard fruits',
    category: 'Fresh Fruits',
    tag: 'Seasonal',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85',
    description: 'Bright, seasonal and full of character — selected from trusted Indian orchards.',
    details: 'Premium export varieties including Bhagwa Pomegranates, fresh Table Grapes, seasonal Mangoes, and citrus, carefully harvested at optimum maturity.',
    origin: 'Maharashtra Orchards',
    indexStr: '01 / 05'
  },
  {
    id: 'field-vegetables',
    name: 'Field vegetables',
    category: 'Farm Vegetables',
    tag: 'Farm fresh',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85',
    description: 'Graded and packed for freshness, consistency and a dependable arrival.',
    details: 'Export-grade Nashik red onions, fresh tomatoes, green chillies, ginger, garlic, and root vegetables sorted by size, color, and shelf-life readiness.',
    origin: 'Nashik & Regional Farms',
    indexStr: '02 / 05'
  },
  {
    id: 'dals-pulses',
    name: 'Dals & pulses',
    category: 'Premium Pulses',
    tag: 'Pantry staples',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=85',
    description: 'Reliable lentils, chickpeas and pulses with consistent grading.',
    details: 'Machine-cleaned and sortexed Toor dal, Chana dal, Moong beans, Chickpeas (Kabuli & Desi), and Urad with consistent moisture levels and purity.',
    origin: 'Central & Western India',
    indexStr: '03 / 05'
  },
  {
    id: 'premium-rice',
    name: 'Premium rice',
    category: 'Export Rice',
    tag: 'Export grade',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=85',
    description: 'Basmati and non-basmati varieties, prepared for global buyers.',
    details: 'Aromatic 1121 Traditional Basmati, Pusa Basmati, Golden Sella, Steam Basmati, and premium non-basmati long-grain rice with custom packaging.',
    origin: 'Certified Indian Mills',
    indexStr: '04 / 05'
  },
  {
    id: 'food-ingredients',
    name: 'Food ingredients',
    category: 'Food Ingredients',
    tag: 'Made to order',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85',
    description: 'Spices, grains and custom requirements for wholesalers, processors and food makers.',
    details: 'Whole and ground spices (turmeric fingers, red chillies, cumin, coriander seeds), oilseeds, grains, and custom agro ingredients tailored to buyer specs.',
    origin: 'Direct Agro Processors',
    indexStr: '05 / 05'
  }
];

if (typeof window !== 'undefined') {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
}

let currentCategory = 'All';
let searchQuery = '';

const searchInput = document.getElementById('productSearch');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const categoryFiltersContainer = document.getElementById('categoryFilters');
const productsGrid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const catalogMeta = document.getElementById('catalogMeta');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

function initCategoryFilters() {
  if (!categoryFiltersContainer) return;
  const categories = ['All', ...new Set(PRODUCTS_DATA.map((p) => p.category))];

  categoryFiltersContainer.innerHTML = categories
    .map(
      (cat) => `
      <button type="button" class="filter-btn ${cat === currentCategory ? 'active' : ''}" data-category="${cat}" aria-pressed="${cat === currentCategory}">
        ${cat}
      </button>
    `
    )
    .join('');

  categoryFiltersContainer.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentCategory = btn.getAttribute('data-category') || 'All';
      categoryFiltersContainer.querySelectorAll('.filter-btn').forEach((b) => {
        const isActive = b.getAttribute('data-category') === currentCategory;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });
      renderProducts();
    });
  });
}

function getFilteredProducts() {
  const query = searchQuery.trim().toLowerCase();
  return PRODUCTS_DATA.filter((product) => {
    const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
    const searchableText = `${product.name} ${product.category} ${product.description} ${product.details} ${product.origin} ${product.tag}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  if (!productsGrid || !emptyState || !catalogMeta) return;

  const filtered = getFilteredProducts();
  const total = PRODUCTS_DATA.length;

  if (filtered.length === 0) {
    productsGrid.innerHTML = '';
    productsGrid.style.display = 'none';
    emptyState.removeAttribute('hidden');
    catalogMeta.textContent = `No products found (0 of ${total})`;
    return;
  }

  emptyState.setAttribute('hidden', '');
  productsGrid.style.display = 'grid';

  let statusText = `Showing ${filtered.length} of ${total} products`;
  if (currentCategory !== 'All') {
    statusText += ` in ${currentCategory}`;
  }
  if (searchQuery.trim()) {
    statusText += ` matching "${searchQuery.trim()}"`;
  }
  catalogMeta.textContent = statusText;

  productsGrid.innerHTML = filtered
    .map(
      (product) => `
    <article class="product-card catalog-card">
      <div class="product-photo" style="background-image: linear-gradient(160deg, rgba(13, 57, 38, .03), rgba(13, 57, 38, .4)), url('${product.image}');" role="img" aria-label="${product.name}">
        <span class="photo-label">${product.tag}</span>
      </div>
      <div class="product-card-body">
        <div class="product-card-header">
          <span class="product-index">${product.indexStr}</span>
          <span class="product-cat-pill">${product.category}</span>
        </div>
        <h3>${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-details-box">
          <span class="details-label">Specifications & Varieties</span>
          <p>${product.details}</p>
        </div>
        <div class="product-card-footer">
          <span class="product-origin"><span class="origin-pin">📍</span> ${product.origin}</span>
          <a href="index.html?product=${encodeURIComponent(product.name)}#contact" class="button button-lime button-sm" aria-label="Enquire about ${product.name}">
            <span>Enquire</span> <span>↗</span>
          </a>
        </div>
      </div>
    </article>
  `
    )
    .join('');
}

// Search input events
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (clearSearchBtn) {
      if (searchQuery.length > 0) {
        clearSearchBtn.removeAttribute('hidden');
      } else {
        clearSearchBtn.setAttribute('hidden', '');
      }
    }
    renderProducts();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    searchQuery = '';
    clearSearchBtn.setAttribute('hidden', '');
    renderProducts();
  });
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    searchQuery = '';
    currentCategory = 'All';
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.setAttribute('hidden', '');
    categoryFiltersContainer?.querySelectorAll('.filter-btn').forEach((b) => {
      const isAll = b.getAttribute('data-category') === 'All';
      b.classList.toggle('active', isAll);
      b.setAttribute('aria-pressed', String(isAll));
    });
    renderProducts();
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initCategoryFilters();
  renderProducts();
});

// If loaded after DOMContentLoaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initCategoryFilters();
  renderProducts();
}
