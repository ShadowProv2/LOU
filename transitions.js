(() => {
  'use strict';

  const STORAGE_KEY = 'split-entering';
  const MOBILE_QUERY = window.matchMedia('(max-width: 768px), (pointer: coarse)');

  const desktopTiming = {
    logoIn: 300,
    holdStart: 450,
    navigate: 570,
    openCleanup: 660,
  };

  const mobileTiming = Object.fromEntries(
    Object.entries(desktopTiming).map(([key, value]) => [key, Math.round(value * 0.85)]),
  );

  function getTiming() {
    return MOBILE_QUERY.matches ? mobileTiming : desktopTiming;
  }

  function readEnteringFlag() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function setEnteringFlag() {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Navigation still works when sessionStorage is unavailable.
    }
  }

  function clearEnteringFlag() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing else to clean up.
    }
  }

  function isInternalPageLink(link) {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return false;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;

    // Same-page anchors should scroll normally without a transition.
    const sameDocument =
      url.pathname === window.location.pathname &&
      url.search === window.location.search;
    if (sameDocument && url.hash) return false;

    return /\.html$/i.test(url.pathname) || url.pathname.endsWith('/');
  }

  function resetOverlay(overlay) {
    overlay.classList.remove('closing', 'opening', 'logo-visible', 'is-held');
    overlay.style.pointerEvents = 'none';
  }

  function playOpening(overlay) {
    const timing = getTiming();

    overlay.classList.remove('closing', 'logo-visible', 'is-held');
    overlay.classList.add('opening');
    overlay.style.pointerEvents = 'all';

    window.setTimeout(() => {
      resetOverlay(overlay);
    }, timing.openCleanup);
  }

  function initialize() {
    const overlay = document.getElementById('split-overlay');
    if (!overlay) return;

    // Always process the entering state before registering click handlers.
    if (readEnteringFlag()) {
      clearEnteringFlag();
      playOpening(overlay);
    } else {
      resetOverlay(overlay);
    }

    let isNavigating = false;

    document.addEventListener('click', (event) => {
      if (isNavigating || event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest('a[href]');
      if (!isInternalPageLink(link)) return;

      event.preventDefault();
      isNavigating = true;

      const timing = getTiming();
      const destination = link.href;

      overlay.classList.remove('opening', 'logo-visible', 'is-held');
      overlay.classList.add('closing');
      overlay.style.pointerEvents = 'all';

      window.setTimeout(() => {
        overlay.classList.add('logo-visible');
      }, timing.logoIn);

      window.setTimeout(() => {
        overlay.classList.add('is-held');
      }, timing.holdStart);

      window.setTimeout(() => {
        setEnteringFlag();
        window.location.href = destination;
      }, timing.navigate);
    });

    // Restore a clean idle state when returning through the back-forward cache.
    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return;
      isNavigating = false;
      clearEnteringFlag();
      resetOverlay(overlay);
    });
  }

  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
