/* Mizzysales | smooth-nav.js
   1. Warms up the next page the moment a finger/mouse is on a link, so the switch feels instant.
   2. Where the browser can't cross-fade pages itself, fades the old page out for a moment first.
   Pure enhancement: if anything here fails, links behave exactly as before. */
(function () {
  if (window.__msSmoothNav) return;
  window.__msSmoothNav = true;

  var root = document.documentElement;
  var hasVT = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('selector(::view-transition)');
  if (hasVT) root.classList.add('ms-vt');

  // Never warm up or animate these (actions, admin, downloads, other sites).
  var SKIP = /^\/(api|logout|ksl-admin|admin|download|webhook)/i;
  function eligible(a) {
    if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
    if (a.origin !== location.origin) return false;
    if (SKIP.test(a.pathname)) return false;
    if (a.pathname === location.pathname && a.search === location.search) return false;
    return true;
  }

  // 1. Prefetch on intent (hover / touch start), once per URL.
  var done = {};
  function warm(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!eligible(a) || done[a.href]) return;
    done[a.href] = 1;
    try {
      var l = document.createElement('link');
      l.rel = 'prefetch'; l.href = a.href; l.as = 'document';
      document.head.appendChild(l);
    } catch (x) {}
  }
  document.addEventListener('mouseover', warm, { passive: true });
  document.addEventListener('touchstart', warm, { passive: true });

  // 2. Instant tap feedback: a thin bar starts the moment a link is tapped, so a slow server
  //    never looks like the tap did nothing. It is removed if the page comes back or navigation stops.
  var bar;
  function showBar() {
    if (!bar) { bar = document.createElement('div'); bar.className = 'ms-bar'; document.body.appendChild(bar); }
    bar.classList.remove('go'); void bar.offsetWidth; bar.classList.add('go');
  }
  function hideBar() { if (bar) bar.classList.remove('go'); }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!eligible(a) || a.getAttribute('href').charAt(0) === '#') return;
    showBar();
    setTimeout(hideBar, 15000); // never leave it hanging if navigation was cancelled
  });
  window.addEventListener('pagehide', hideBar);


  // 3. One standard toast for the whole site. Pages that draw their own black "showToast" bar
  //    now get this one instead (same call, same arguments). Also available as window.msToast.
  function msToast(msg, kind) {
    try {
      var box = document.getElementById('msToasts');
      if (!box) { box = document.createElement('div'); box.id = 'msToasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
      var t = document.createElement('div');
      var k = kind === true || kind === 'ok' ? 'ok' : kind === false || kind === 'err' ? 'err' : '';
      t.className = 'ms-toast' + (k ? ' ' + k : ''); t.setAttribute('role', 'status'); t.textContent = String(msg == null ? '' : msg);
      box.appendChild(t);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }, 3200);
    } catch (e) {}
  }
  window.msToast = msToast;
  function hookToast() {
    try {
      if (typeof window.showToast === 'function' && !window.showToast.__ms) {
        var f = function (m, k) { msToast(m, k); }; f.__ms = 1; window.showToast = f;
      }
    } catch (e) {}
  }
  hookToast(); window.addEventListener('DOMContentLoaded', hookToast); window.addEventListener('load', hookToast);

  // 4. The same bottom dock on every customer page (the dashboard already has its own).
  function addDock() {
    try {
      var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      if (['/', '/index', '/apidocs', '/api-docs', '/tutorials', '/games', '/login', '/register'].indexOf(p) > -1 || /admin/.test(p)) return;
      if (!localStorage.getItem('ksl_token') || document.querySelector('.ms-dock')) return;
      // Pages that had their own bottom bar (e.g. the dashboard) use the standard one instead.
      document.querySelectorAll('.mz-dock').forEach(function (n) { n.remove(); });
      var I = {
        home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
        cart: '<path d="M3 4h2l2.4 11h9.6l2-8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
        wallet: '<path d="M3 7a2 2 0 012-2h13a1 1 0 011 1v3"/><path d="M3 7v11a2 2 0 002 2h14a1 1 0 001-1v-6a1 1 0 00-1-1h-4a2 2 0 000 4h5"/>',
        hist: '<path d="M12 8v4l3 3M3 12a9 9 0 100 0z"/><path d="M3 4v5h5"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'
      };
      var T = [
        ['/dashboard', 'Home', 'home', ['/dashboard']],
        ['/boost', 'Boost', 'rocket', ['/boost', '/boost1', '/boost1/order', '/boost2', '/boost-services', '/boost-history']],
        ['/purchases', 'Orders', 'hist', ['/purchases', '/number-history', '/order-status']],
        ['/deposit', 'Wallet', 'wallet', ['/deposit', '/virtual-account', '/transactions']]
      ];
      var I2 = {
        phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
        mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
        key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M14 9l2 2"/>',
        rocket: '<path d="M12 2c3 1 5 5 5 9 0 3-1 5-2 6l-3 3-3-3c-1-1-2-3-2-6 0-4 2-8 5-9z"/><circle cx="12" cy="9" r="2"/>',
        bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
        gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9h18M12 9v12"/>',
        chat: '<path d="M21 12a8.5 8.5 0 01-11.9 7.8L4 21l1.2-5A8.5 8.5 0 1121 12z"/>',
        grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
      };
      function ic(n) { return I[n] || I2[n] || ''; }
      var css = document.createElement('style');
      css.textContent = '.ms-dock-svc{background:none;border:0;font:inherit;color:inherit;cursor:pointer}';
      document.head.appendChild(css);
      var nav = document.createElement('nav');
      nav.className = 'ms-dock'; nav.setAttribute('aria-label', 'Main');
      nav.innerHTML = T.map(function (t) {
        var on = t[3].some(function (x) { return p === x || p.indexOf(x + '/') === 0; });
        return '<a class="ms-dock-link' + (on ? ' active' : '') + '" href="' + t[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ic(t[2]) + '</svg>' + t[1] + '</a>';
      }).join('') +
      '<button type="button" class="ms-dock-link ms-dock-svc" id="msSvcBtn" aria-expanded="false" aria-controls="msSvcSheet"><svg viewBox="0 0 24 24" aria-hidden="true">' + ic('grid') + '</svg>Services</button>';
      document.body.appendChild(nav);
      var btn = document.getElementById('msSvcBtn');
      // Services now opens the main hamburger menu (the full list of every feature).
      btn.addEventListener('click', function () {
        var burger = document.querySelector('.std-burger');
        if (burger) { burger.click(); } else { location.href = '/dashboard'; }
      });
      document.body.classList.add('has-ms-dock');
    } catch (e) {}
  }
  addDock();

  // 5. One normal Back: goes to the page you came from (falls back to the link's own address).
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a.back, a.app-back, a.ms-back');
    if (!a) return;
    try {
      if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) { e.preventDefault(); history.back(); }
    } catch (x) {}
  });

  // Back/Forward restores the page instantly from memory. Never stay faded out, and if the
  // page was away for a while, refresh it once so balances and orders are not stale.
  var hiddenAt = 0;
  window.addEventListener('pagehide', function () { hiddenAt = Date.now(); });
  window.addEventListener('pageshow', function (e) {
    hideBar();
    if (e.persisted && hiddenAt && Date.now() - hiddenAt > 30000) location.reload();
  });
})();
