const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const hero = document.getElementById('accueil');
const heroCursorGlow = document.getElementById('heroCursorGlow');

const mobileQuery = window.matchMedia('(max-width: 920px), (pointer: coarse)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const performanceLite = mobileQuery.matches || reducedMotion || Boolean(connection?.saveData);

document.body.classList.toggle('performance-lite', performanceLite);

let headerFrame = 0;
let parallaxFrame = 0;
let lockedScrollY = 0;
let lastFocusedElement = null;

// Pause decorative animation while the tab is hidden.
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

/* MOBILE FIX: lock the complete page, including iOS Safari, while navigation is open. */
function lockPageScroll() {
  lockedScrollY = window.scrollY;
  document.documentElement.classList.add('menu-open');
  document.body.classList.add('menu-open');
  document.body.style.top = `-${lockedScrollY}px`;
}

function unlockPageScroll() {
  const wasLocked = document.body.classList.contains('menu-open');
  document.documentElement.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
  document.body.style.top = '';
  if (wasLocked) window.scrollTo(0, lockedScrollY);
}

function setMobileMenuState(open, { restoreFocus = false } = {}) {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.classList.toggle('is-open', open);
  mobileMenu.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  mobileMenu.setAttribute('aria-hidden', String(!open));

  if (open) {
    lastFocusedElement = document.activeElement;
    lockPageScroll();
    window.requestAnimationFrame(() => mobileMenu.querySelector('a')?.focus({ preventScroll: true }));
  } else {
    unlockPageScroll();
    if (restoreFocus) (lastFocusedElement || menuToggle).focus({ preventScroll: true });
  }
}

function closeMobileMenu(options) {
  setMobileMenuState(false, options);
}

menuToggle?.addEventListener('click', () => {
  setMobileMenuState(!mobileMenu?.classList.contains('is-open'));
});

document.querySelectorAll('#mobileMenu a').forEach((link) => {
  link.addEventListener('click', () => closeMobileMenu());
});

// MOBILE FIX: Escape closes the menu and Tab stays inside the open overlay.
document.addEventListener('keydown', (event) => {
  if (!mobileMenu?.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMobileMenu({ restoreFocus: true });
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = [...mobileMenu.querySelectorAll('a[href], button:not([disabled])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 920) closeMobileMenu();
}, { passive: true });

window.addEventListener('orientationchange', () => closeMobileMenu(), { passive: true });

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
  button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
  button.addEventListener('click', () => {
    const group = button.dataset.filterGroup;
    const filter = button.dataset.filter;
    const grid = document.querySelector(`[data-filter-grid="${group}"]`);
    if (!grid) return;

    document.querySelectorAll(`[data-filter-group="${group}"]`).forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
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
