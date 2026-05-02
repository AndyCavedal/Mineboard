/* =====================
   SPA Router & App Init
   ===================== */

const ROUTES = {
  '/dashboard':    { html: 'pages/dashboard.html',    init: initDashboard },
  '/transactions': { html: 'pages/transactions.html',  init: initTransactions },
  '/categories':   { html: 'pages/categories.html',    init: initCategories },
  '/pombero':      { html: 'pages/pombero.html',       init: () => {} },
};

const fragmentCache = new Map();
const pageEl = document.getElementById('page');
const navLinks = document.querySelectorAll('.nav-link');
const appShell = document.querySelector('.app-shell');
const loginScreen = document.getElementById('login-screen');

function render404(path) {
  navLinks.forEach(link => link.classList.remove('active'));
  pageEl.style.animation = 'none';
  pageEl.offsetHeight;
  pageEl.style.animation = '';
  pageEl.innerHTML = `
    <div class="page-404">
      <div class="p404-code">404</div>
      <p class="p404-msg">Ruta no encontrada: <code>${path}</code></p>
      <a href="#/dashboard" class="btn btn-ghost btn-sm">← volver al inicio</a>
    </div>
  `;
}

async function navigate(path) {
  const route = ROUTES[path];
  if (!route) return render404(path);

  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.route === path);
  });

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

  pageEl.style.animation = 'none';
  pageEl.offsetHeight;
  pageEl.style.animation = '';
  pageEl.innerHTML = html;

  route.init();
}

function getRoute() {
  const hash = location.hash.replace('#', '') || '/dashboard';
  return hash;
}

window.addEventListener('hashchange', () => {
  if (getCurrentUser()) navigate(getRoute());
});

document.getElementById('shuffle-bg')?.addEventListener('click', () => {
  shuffleBackground();
});

document.getElementById('btn-signin')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-signin');
  btn.disabled = true;
  btn.textContent = 'conectando...';
  try {
    await signInWithGoogle();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'continuar con google';
    showToast('Error al iniciar sesión', 'error');
  }
});

window.addEventListener('authStateChanged', async ({ detail: { user } }) => {
  if (user) {
    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');

    try {
      const me = await api.get('/me');
      setUserRole(me.role);
      window.APP_USER = me;
      document.getElementById('nav-user-name')?.setAttribute('data-role', me.role);
    } catch {
      // role stays null, readonly by default
    }

    if (!location.hash || location.hash === '#/') {
      location.hash = '#/dashboard';
    } else {
      navigate(getRoute());
    }
  } else {
    appShell.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    window.APP_USER = null;
    fragmentCache.clear();
    pageEl.innerHTML = '';
  }
});

// Boot
initBackground();
initAuth();
