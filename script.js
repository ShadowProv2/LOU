const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const cartCount = document.getElementById('cartCount');
const toast = document.getElementById('toast');
const hero = document.getElementById('accueil');
const heroCursorGlow = document.getElementById('heroCursorGlow');

const mobileQuery = window.matchMedia('(max-width: 920px), (pointer: coarse)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const performanceLite = mobileQuery.matches || reducedMotion || Boolean(connection?.saveData);

document.body.classList.toggle('performance-lite', performanceLite);

let cartItems = Number(sessionStorage.getItem('lou-cart-count') || 0);
let toastTimer;
let headerFrame = 0;
let parallaxFrame = 0;

if (cartCount) cartCount.textContent = String(cartItems);

// Keep the red page transition, but make it much faster on phones.
document.body.classList.add('is-entering');
window.setTimeout(
  () => document.body.classList.remove('is-entering'),
  performanceLite ? 240 : 800,
);
window.addEventListener('pageshow', () => {
  document.body.classList.remove('is-leaving', 'is-entering');
});

// Pause all decorative animation while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('is-page-hidden', document.hidden);
});

function updateHeader() {
  headerFrame = 0;
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
}

function requestHeaderUpdate() {
  if (headerFrame) return;
  headerFrame = window.requestAnimationFrame(updateHeader);
}

window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
updateHeader();

function closeMobileMenu() {
  menuToggle?.classList.remove('is-open');
  mobileMenu?.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

menuToggle?.addEventListener('click', () => {
  const willOpen = !mobileMenu?.classList.contains('is-open');
  menuToggle.classList.toggle('is-open', willOpen);
  mobileMenu?.classList.toggle('is-open', willOpen);
  menuToggle.setAttribute('aria-expanded', String(willOpen));
  document.body.classList.toggle('menu-open', willOpen);
});

document.querySelectorAll('#mobileMenu a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 920) closeMobileMenu();
}, { passive: true });

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1900);
}

// Use one delegated listener instead of one listener for every button.
document.addEventListener('click', (event) => {
  const addButton = event.target.closest('.add-button');
  if (!addButton) return;

  event.stopPropagation();
  cartItems += 1;
  sessionStorage.setItem('lou-cart-count', String(cartItems));
  if (cartCount) cartCount.textContent = String(cartItems);
  showToast(`${addButton.dataset.product} ajouté à ta sélection.`);
});

// Menu card expansion remains available for mouse, touch and keyboard users.
document.querySelectorAll('[data-menu-card]').forEach((card) => {
  const hitArea = card.querySelector('.menu-card-hit');
  const closeButton = card.querySelector('.menu-details-toggle');
  const detail = card.querySelector('.menu-card-detail');
  if (!hitArea || !detail) return;

  const setExpanded = (expanded) => {
    card.classList.toggle('is-expanded', expanded);
    hitArea.setAttribute('aria-expanded', String(expanded));
    detail.setAttribute('aria-hidden', String(!expanded));
  };

  hitArea.setAttribute('aria-expanded', 'false');
  hitArea.addEventListener('click', () => {
    const willExpand = !card.classList.contains('is-expanded');

    document.querySelectorAll('[data-menu-card].is-expanded').forEach((openCard) => {
      if (openCard === card) return;
      openCard.classList.remove('is-expanded');
      openCard.querySelector('.menu-card-hit')?.setAttribute('aria-expanded', 'false');
      openCard.querySelector('.menu-card-detail')?.setAttribute('aria-hidden', 'true');
    });

    setExpanded(willExpand);
  });

  closeButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    setExpanded(false);
    hitArea.focus({ preventScroll: true });
  });
});

// Shared category filters for menu and merch pages.
document.querySelectorAll('[data-filter-group]').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.dataset.filterGroup;
    const filter = button.dataset.filter;
    const grid = document.querySelector(`[data-filter-grid="${group}"]`);
    if (!grid) return;

    document.querySelectorAll(`[data-filter-group="${group}"]`).forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });

    grid.querySelectorAll('[data-category]').forEach((card) => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !visible);
      if (!visible) card.classList.remove('is-expanded');
    });
  });
});

// Existing horizontal carousel controls remain supported.
document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => {
    const track = document.getElementById(button.dataset.scroll);
    if (!track) return;
    const direction = Number(button.dataset.direction || 1);
    const distance = Math.min(track.clientWidth * 0.82, 430);
    track.scrollBy({
      left: direction * distance,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  });
});

// Reveal elements once, then stop observing them.
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: performanceLite ? 0.01 : 0.1,
    rootMargin: performanceLite ? '120px 0px' : '0px 0px -30px',
  });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

// Desktop-only cursor glow.
if (hero && heroCursorGlow && !performanceLite && window.matchMedia('(pointer: fine)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    heroCursorGlow.style.transform = `translate3d(${event.clientX - bounds.left - 210}px, ${event.clientY - bounds.top - 210}px, 0)`;
  }, { passive: true });
}

// Desktop-only gallery/card parallax. It is disabled on phones to keep scrolling fluid.
const parallaxItems = performanceLite ? [] : [...document.querySelectorAll('[data-parallax]')];

function updateParallax() {
  parallaxFrame = 0;
  const viewportCenter = window.innerHeight / 2;

  parallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return;

    const itemCenter = rect.top + rect.height / 2;
    const strength = Number(item.dataset.parallax || 0.08);
    const offset = Math.max(-30, Math.min(30, (viewportCenter - itemCenter) * strength));
    item.style.setProperty('--parallax-y', `${offset}px`);
  });
}

function requestParallaxUpdate() {
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(updateParallax);
}

if (parallaxItems.length) {
  window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
  window.addEventListener('resize', requestParallaxUpdate, { passive: true });
  updateParallax();
}

// Brief red wipe between internal HTML pages.
document.querySelectorAll('a[href]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

    const url = new URL(link.href, window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    const internalHtml = /\.html$/.test(url.pathname);
    if (!sameOrigin || !internalHtml) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

    event.preventDefault();
    closeMobileMenu();
    document.body.classList.add('is-leaving');
    window.setTimeout(() => window.location.assign(url.href), performanceLite ? 170 : 470);
  });
});
