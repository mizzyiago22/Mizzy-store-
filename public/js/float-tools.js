/* Floating notification bell + site-wide search with favorites. Loaded on every customer page. */
(function () {
  if (window.__msFloat) return; window.__msFloat = true;
  var TOKEN = null; try { TOKEN = localStorage.getItem('ksl_token'); } catch (e) {}
  var PAGES = [
    ['Dashboard', '/dashboard', 'home overview balance wallet'],
    ['Buy Numbers', '/buy-number', 'virtual number sms otp verification code whatsapp telegram instagram facebook google tiktok country service'],
    ['Accounts & Logs', '/marketplace', 'marketplace shop store buy accounts logs'],
    ['Working Pics', '/working-pics', 'working pics media image link mega'],
    ['Boosts', '/boost', 'boost followers likes views subscribers growth social'],
    ['Boost services', '/boost-services', 'boost services prices list'],
    ['Boost history', '/boost-history', 'boost orders history'],
    ['Tutorials', '/tutorials', 'tutorial guide how to video learn help'],
    ['Format & tools', '/tools', 'format tools utilities downloads'],
    ['Deposit / Add money', '/deposit', 'deposit fund add money wallet payment pay paystack flutterwave bank transfer'],
    ['Wallet', '/wallet', 'wallet balance funds'],
    ['Purchases', '/purchases', 'purchases orders bought history receipts'],
    ['Transactions', '/transactions', 'transactions history payments deposits'],
    ['Number history', '/number-history', 'number history codes received sms'],
    ['Referrals', '/referrals', 'referral invite earn commission link'],
    ['Giveaways', '/giveaways', 'giveaway win reward prize'],
    ['Games', '/games', 'games play score'],
    ['Chat groups', '/groups', 'chat community group'],
    ['Messages', '/messages', 'messages direct chat dm'],
    ['Support', '/support', 'support help contact ticket complaint refund'],
    ['Notifications', '/notifications', 'notifications alerts updates'],
    ['Settings & profile', '/settings', 'settings profile password account security picture'],
    ['API docs', '/api-docs', 'api developers docs'],
    ['Terms', '/terms', 'terms conditions rules policy']
  ];
  var extra = []; // tutorials + working pics, loaded lazily
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function favs() { try { return JSON.parse(localStorage.getItem('ms_favs') || '[]'); } catch (e) { return []; } }
  function saveFavs(a) { try { localStorage.setItem('ms_favs', JSON.stringify(a.slice(0, 50))); } catch (e) {} }
  function isFav(path) { return favs().some(function (f) { return f.path === path; }); }
  function toggleFav(title, path) {
    var a = favs(), i = a.findIndex(function (f) { return f.path === path; });
    if (i >= 0) a.splice(i, 1); else a.unshift({ title: title, path: path });
    saveFavs(a);
  }
  function here() { var p = location.pathname.replace(/\/+$/, '') || '/'; return p === '/' ? (TOKEN ? '/dashboard' : '/') : p; }
  function hereTitle() {
    var m = PAGES.find(function (p) { return p[1] === here(); });
    return m ? m[0] : (document.title || 'This page').split('|')[0].trim();
  }

  var css = document.createElement('style');
  css.textContent = '#msFloat{position:fixed;right:14px;bottom:152px;z-index:9000;display:flex;flex-direction:column;gap:12px}' +
    '#msFloat a,#msFloat button{position:relative;width:52px;height:52px;border-radius:50%;border:1px solid rgba(0,180,248,.35);background:rgba(16,24,39,.92);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 24px -8px rgba(0,0,0,.6);backdrop-filter:blur(8px);text-decoration:none}' +
    '#msFloat svg{width:24px;height:24px;stroke:#00b4f8;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '#msFloat .b{position:absolute;top:-3px;right:-3px;min-width:19px;height:19px;border-radius:999px;background:#ef4444;color:#fff;font:800 11px/19px sans-serif;text-align:center;padding:0 5px}' +
    '#msSearch{position:fixed;inset:0;z-index:9500;background:rgba(3,8,18,.72);backdrop-filter:blur(6px);display:none;align-items:flex-start;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 14px 14px}' +
    '#msSearch.on{display:flex}#msSearch .box{width:100%;max-width:560px;background:#101827;color:#f0f6fc;border:1px solid #29394f;border-radius:20px;box-shadow:0 30px 70px -20px #000;overflow:hidden;font-family:"Plus Jakarta Sans",system-ui,sans-serif}' +
    '#msSearch .top{display:flex;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid #29394f}#msSearch input{flex:1;background:transparent;border:0;outline:0;color:inherit;font-size:16px}' +
    '#msSearch .x{background:none;border:0;color:#8b9bb4;font-size:22px;cursor:pointer}' +
    '#msSearch .cur{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:rgba(0,180,248,.08);font-size:13px}' +
    '#msSearch .res{max-height:60vh;overflow:auto;padding:6px}#msSearch .h{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b9bb4;padding:10px 10px 4px}' +
    '#msSearch .r{display:flex;align-items:center;gap:6px;border-radius:12px}#msSearch .r:hover{background:rgba(0,180,248,.1)}' +
    '#msSearch .r a{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:11px 10px;color:inherit;text-decoration:none;font-weight:600;font-size:14.5px}#msSearch .r a small{display:block;color:#8b9bb4;font-weight:500;font-size:12px}' +
    '#msSearch .st{background:none;border:0;font-size:20px;cursor:pointer;padding:8px 10px;color:#8b9bb4}#msSearch .st.on{color:#fbbf24}' +
    '#msSearch .cur button{background:#00b4f8;color:#06121f;border:0;border-radius:10px;padding:7px 12px;font-weight:800;cursor:pointer}#msSearch .none{padding:26px;text-align:center;color:#8b9bb4}';
  document.head.appendChild(css);

  var bell = '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0"/></svg>';
  var mag = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
  var wrap = document.createElement('div'); wrap.id = 'msFloat';
  wrap.innerHTML = (TOKEN ? '<a href="/notifications" aria-label="Notifications" id="msBell">' + bell + '</a>' : '') +
    '<button type="button" aria-label="Search" id="msSearchBtn">' + mag + '</button>';
  document.body.appendChild(wrap);

  var ov = document.createElement('div'); ov.id = 'msSearch';
  ov.innerHTML = '<div class="box"><div class="top">' + mag.replace('<svg', '<svg style="width:20px;height:20px;stroke:#8b9bb4;fill:none;stroke-width:2"') +
    '<input id="msQ" type="search" placeholder="Search Facebook, boosts, numbers, accounts, pages..." autocomplete="off"/><button class="x" id="msX" aria-label="Close">&times;</button></div>' +
    '<div class="cur" id="msCur"></div><div class="res" id="msRes"></div></div>';
  document.body.appendChild(ov);
  var q = ov.querySelector('#msQ'), res = ov.querySelector('#msRes'), cur = ov.querySelector('#msCur');

  function row(title, path, sub) {
    var on = isFav(path);
    return '<div class="r"><a href="' + esc(path) + '">' + esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</a>' +
      '<button class="st' + (on ? ' on' : '') + '" data-t="' + esc(title) + '" data-p="' + esc(path) + '" aria-label="' + (on ? 'Remove from favorites' : 'Add to favorites') + '">' + (on ? '\u2605' : '\u2606') + '</button></div>';
  }
  function paintCur() {
    var p = here(), on = isFav(p);
    cur.innerHTML = '<span>' + (on ? 'This page is in your favorites' : 'Save this page to favorites') + '</span><button id="msCurBtn">' + (on ? 'Remove' : 'Add') + '</button>';
    cur.querySelector('#msCurBtn').onclick = function () { toggleFav(hereTitle(), p); render(); };
  }
  function render() {
    paintCur();
    var term = q.value.trim().toLowerCase(), html = '';
    if (!term) {
      var f = favs();
      html += '<div class="h">Favorites</div>' + (f.length ? f.map(function (x) { return row(x.title, x.path, ''); }).join('') : '<div class="none" style="padding:12px">No favorites yet. Tap the star on any result.</div>');
      html += '<div class="h">Popular</div>' + PAGES.slice(0, 8).map(function (p) { return row(p[0], p[1], ''); }).join('');
    } else {
      var words = term.split(/\s+/);
      var all = PAGES.map(function (p) { return { t: p[0], p: p[1], k: (p[0] + ' ' + p[2]).toLowerCase(), s: '' }; }).concat(extra.map(function (e) { return { t: e.t, p: e.p, k: (e.t + ' ' + e.k).toLowerCase(), s: e.s }; }));
      var hits = all.filter(function (a) { return words.every(function (w) { return a.k.indexOf(w) >= 0; }); });
      html = hits.length ? hits.slice(0, 40).map(function (a) { return row(a.t, a.p, a.s); }).join('') : '<div class="none">No results for "' + esc(term) + '"</div>';
    }
    res.innerHTML = html;
  }
  res.addEventListener('click', function (e) { var b = e.target.closest('.st'); if (!b) return; toggleFav(b.dataset.t, b.dataset.p); render(); });
  function open() { ov.classList.add('on'); q.value = ''; render(); loadExtra(); setTimeout(function () { q.focus(); }, 50); }
  function close() { ov.classList.remove('on'); }
  wrap.querySelector('#msSearchBtn').onclick = open;
  ov.querySelector('#msX').onclick = close;
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); } });
  q.addEventListener('input', render);

  var loaded = false;
  function addItems(list, path, label, mk) {
    (Array.isArray(list) ? list : []).forEach(function (x) {
      var t = mk(x); if (!t) return;
      extra.push({ t: String(t).trim(), p: path, k: ((x.category || x.platform || '') + ' ' + (x.description || '') + ' ' + label).toLowerCase(), s: label });
    });
    if (ov.classList.contains('on')) render();
  }
  function get(url, auth) {
    return fetch(url, auth && TOKEN ? { headers: { Authorization: 'Bearer ' + TOKEN } } : undefined).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function loadExtra() {
    if (loaded) return; loaded = true;
    get('/api/public/tutorials').then(function (a) { addItems(a, '/tutorials', 'Tutorial', function (t) { return t.title; }); });
    get('/api/working-pics', true).then(function (a) { addItems(a, '/working-pics', 'Working pic', function (w) { return w.title; }); });
    // Accounts & logs: all four marketplaces
    get('/api/logs').then(function (a) { addItems(a, '/marketplace', 'Marketplace', function (l) { return l.title; }); });
    get('/api/market2/products').then(function (a) { addItems(a, '/marketplace2', 'Marketplace Two', function (l) { return l.title; }); });
    get('/api/market3/products').then(function (a) { addItems(a, '/marketplace3', 'Marketplace Three', function (l) { return l.title; }); });
    get('/api/market4/products').then(function (a) { addItems(a, '/marketplace4', 'Marketplace Four', function (l) { return l.title; }); });
    // Buy Number services (e.g. Facebook, WhatsApp...)
    get('/api/numbers/server2/services').then(function (a) { addItems(a, '/buy-number', 'Buy Number', function (n) { return n.name ? n.name + ' number' : ''; }); });
    // Boosting services (needs login)
    if (TOKEN) get('/api/boost/services', true).then(function (d) { addItems(d && d.services, '/boost', 'Boosting', function (b) { return b.name; }); });
  }

  function badge() {
    if (!TOKEN) return;
    fetch('/api/user/notifications', { headers: { Authorization: 'Bearer ' + TOKEN } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var b = document.getElementById('msBell'); if (!b || !d) return;
      var old = b.querySelector('.b'); if (old) old.remove();
      if (d.count > 0) b.insertAdjacentHTML('beforeend', '<span class="b">' + (d.count > 99 ? '99+' : d.count) + '</span>');
    }).catch(function () {});
  }
  badge(); setInterval(function () { if (!document.hidden) badge(); }, 60000);
})();
