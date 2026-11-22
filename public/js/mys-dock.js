/* Mizzy Sales bottom dock: one fixed bar (Home / Boost / Orders / Wallet / Services) on every logged-in page. */
(function () {
  'use strict';
  if (window.__mysDock) return; window.__mysDock = true;
  if (!document.querySelector('link[href*="mys-dock.css"]')) { var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = '/css/mys-dock.css?v=1'; (document.head || document.documentElement).appendChild(lk); }
  function addDock() {
    try {
      var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      if (['/login', '/register'].indexOf(p) > -1 || /admin/.test(p)) return;
      if (!localStorage.getItem('ksl_token') || document.querySelector('.ms-dock')) return;
      // Replace the dashboard's legacy dock so its Services action opens the shared hamburger.
      document.querySelectorAll('.dsh-bottom-nav').forEach(function (n) { n.remove(); });
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
  if (document.body) addDock(); else document.addEventListener('DOMContentLoaded', addDock);
})();
