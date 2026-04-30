/* =====================
   SPA Router & App Init
   ===================== */

const ROUTES = {
  '/dashboard':    { html: 'pages/dashboard.html',    init: initDashboard },
  '/transactions': { html: 'pages/transactions.html',  init: initTransactions },
  '/categories':   { html: 'pages/categories.html',    init: initCategories },
};

const fragmentCache = new Map();
const pageEl = document.getElementById('page');
const navLinks = document.querySelectorAll('.nav-link');

async function navigate(path) {
  const route = ROUTES[path];
  if (!route) return navigate('/dashboard');

  // Update nav
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.route === path);
  });

  // Fetch HTML fragment (cached)
  let html = fragmentCache.get(path);
  if (!html) {
    try {
      const res = await fetch(route.html);
      html = await res.text();
      fragmentCache.set(path, html);
    } catch (e) {
      html = renderEmptyState('Failed to load page');
    }
  }

  // Inject and animate
  pageEl.style.animation = 'none';
  pageEl.offsetHeight; // reflow
  pageEl.style.animation = '';
  pageEl.innerHTML = html;

  // Init page logic
  route.init();
}

function getRoute() {
  const hash = location.hash.replace('#', '') || '/dashboard';
  return hash;
}

window.addEventListener('hashchange', () => navigate(getRoute()));

// Shuffle background button
document.getElementById('shuffle-bg')?.addEventListener('click', () => {
  shuffleBackground();
});

// Boot
initBackground();

if (!location.hash) {
  location.hash = '#/dashboard';
} else {
  navigate(getRoute());
}
