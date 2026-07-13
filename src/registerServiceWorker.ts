export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // The service worker only makes sense against a production build. Against
  // the Vite dev server it intercepts module/HMR requests with its cache-first
  // strategy and can serve stale modules, breaking the page. Unregister any
  // leftover worker (e.g. from previously loading the built app on the same
  // origin/port) so dev stays clean.
  if (!import.meta.env.PROD) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Only auto-reload on a genuine version swap. `controllerchange` also
      // fires the very first time a page is claimed by a freshly installed
      // worker (no prior controller) — reloading then would loop every new
      // visitor. Only wire the listener when a controller already existed.
      if (navigator.serviceWorker.controller) {
        let hasReloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hasReloaded) return;
          hasReloaded = true;
          window.location.reload();
        });
      }

      // Browsers only auto-check for a new sw.js on their own throttled
      // schedule; force a check on every load so a normal refresh (not
      // just a hard reload) picks up new deployments.
      registration.update();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}
