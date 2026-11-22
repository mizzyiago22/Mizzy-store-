/* Standard site header, menu drawer and Recommended row.
   Front-end only. Icons are built in, so they show on every page. */
(function () {
  'use strict';

  // Line icons (24x24, drawn with currentColor). Each is the inner SVG markup.
  var ICON = {
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M14 9l2 2"/>',
    rocket: '<path d="M12 2c3 1 5 5 5 9 0 3-1 5-2 6l-3 3-3-3c-1-1-2-3-2-6 0-4 2-8 5-9z"/><circle cx="12" cy="9" r="2"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.6 12.6a2 2 0 002 1.4h8.6a2 2 0 002-1.6L22 8H6"/>',
    wallet: '<path d="M3 7a2 2 0 012-2h13v3"/><path d="M3 7v11a2 2 0 002 2h14V9H5"/><circle cx="16.5" cy="14" r="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    bag: '<path d="M6 7h12l1 13H5z"/><path d="M9 7V5a3 3 0 016 0v2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9h18M12 9v12M12 9c-2-4-6-4-6-1s3 1 6 1M12 9c2-4 6-4 6-1s-3 1-6 1"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    chat: '<path d="M21 12a8.5 8.5 0 01-11.9 7.8L4 21l1.2-5A8.5 8.5 0 1121 12z"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    book: '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4z"/><path d="M20 4h-6"/>',
    tool: '<path d="M14 6a4 4 0 005 5l-9 9a2.1 2.1 0 01-3-3l9-9a4 4 0 00-2-2z"/>',
    game: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 12.5h4M9 10.5v4"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="14" r="1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 9"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14a5 5 0 014 6"/>'
  };

  function svg(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || '') + '</svg>';
  }

  // Menu: one consolidated service directory shared by the header and Services dock.
  var MENU = [
    { title: 'Home', items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'home', color: '#6366f1' }
    ] },
    { title: 'Marketplace', items: [
      { href: '/marketplace', label: 'Marketplace', icon: 'cart', color: '#10b981' }
    ] },
    { title: 'Numbers & Email', items: [
      { href: '/buy-number', label: 'Buy Numbers', icon: 'phone', color: '#3b82f6' },
      { href: '/instant-numbers', label: 'Instant Numbers', icon: 'phone', color: '#3b82f6' },
      { href: '/rental', label: 'Rentals', icon: 'key', color: '#f59e0b' },
      { href: '/temp-email', label: 'Temporary Email', icon: 'mail', color: '#8b5cf6' },
      { href: '/number-history', label: 'Number history', icon: 'clock', color: '#3b82f6' }
    ] },
    { title: 'Boost & Tools', items: [
      { href: '/boost', label: 'Social Boost', icon: 'rocket', color: '#ec4899' },
      { href: '/boost-services', label: 'Boost Services', icon: 'list', color: '#ec4899' },
      { href: '/tools', label: 'Tools & FMT', icon: 'tool', color: '#10b981' },
      { href: '/vtu', label: 'Airtime & Data', icon: 'zap', color: '#06b6d4' },
      { href: '/working-pics', label: 'Working Pics', icon: 'image', color: '#10b981' }
    ] },
    { title: 'More Services', items: [
      { href: '/games', label: 'Games', icon: 'game', color: '#f97316' },
      { href: '/giveaways', label: 'Giveaways', icon: 'gift', color: '#84cc16' },
      { href: '/tutorials', label: 'Tutorials', icon: 'book', color: '#a855f7' }
    ] },
    { title: 'Community', items: [
      { href: '/groups', label: 'Groups', icon: 'users', color: '#6366f1' },
      { href: '/messages', label: 'Messages', icon: 'chat', color: '#6366f1' }
    ] },
    { title: 'Account', items: [
      { href: '/purchases', label: 'My Orders', icon: 'bag', color: '#22c55e' },
      { href: '/deposit', label: 'Wallet / Add Money', icon: 'wallet', color: '#22c55e' },
      { href: '/transactions', label: 'Transactions', icon: 'list', color: '#22c55e' },
      { href: '/referrals', label: 'Referrals & Cashback', icon: 'gift', color: '#84cc16' },
      { href: '/settings', label: 'My Profile & Settings', icon: 'gear', color: '#64748b' }
    ] },
    { title: 'Support', items: [
      { href: '/support', label: 'Support', icon: 'chat', color: '#6366f1' },
      { href: '/apidocs', label: 'API docs', icon: 'book', color: '#64748b' }
    ] }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isActive(href) {
    var p = location.pathname.replace(/\/+$/, '') || '/';
    return p === href;
  }

  function buildHeader() {
    var old = document.querySelector('nav.navbar');
    if (old) old.style.display = 'none';

    var header = document.querySelector('.dsh-header');
    var burger;
    if (header) {
      burger = header.querySelector('.std-burger');
      if (!burger) {
        burger = document.createElement('button');
        burger.type = 'button';
        burger.className = 'std-burger';
        burger.setAttribute('aria-label', 'Open menu');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-controls', 'stdDrawer');
        burger.innerHTML = '<span></span><span></span><span></span>';
        (header.querySelector('.dsh-header-right') || header).appendChild(burger);
      }
    } else {
      header = document.createElement('header');
      header.className = 'std-header';
      header.innerHTML =
        '<a class="std-brand" href="/buy-number">' +
          '<img src="/img/mizzy-logo.jpg" alt="" width="36" height="36"/>' +
          '<span>Mizzy Sales</span>' +
        '</a>' +
        '<button type="button" class="std-burger" aria-label="Open menu" aria-expanded="false" aria-controls="stdDrawer">' +
          '<span></span><span></span><span></span>' +
        '</button>';
      document.body.insertBefore(header, document.body.firstChild);
      burger = header.querySelector('.std-burger');
    }

    var overlay = document.createElement('div');
    overlay.className = 'std-overlay';
    overlay.hidden = true;

    var drawer = document.createElement('aside');
    drawer.className = 'std-drawer';
    drawer.id = 'stdDrawer';
    drawer.setAttribute('aria-label', 'Site menu');
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="std-drawer-head">' +
        '<img src="/img/mizzy-logo.jpg" alt="" width="40" height="40"/>' +
        '<div><b>Mizzy Sales</b><small>Menu</small></div>' +
        '<button type="button" class="std-close" aria-label="Close menu">' + svg('close') + '</button>' +
      '</div>' +
      '<div class="std-drawer-body">' +
      MENU.map(function (group) {
        return '<div class="std-group"><div class="std-group-title">' + esc(group.title) + '</div>' +
          group.items.map(function (it) {
            return '<a class="std-link' + (isActive(it.href) ? ' active' : '') + '" href="' + esc(it.href) + '">' +
              '<span class="std-link-ico" style="background:' + it.color + '1f;color:' + it.color + '">' + svg(it.icon) + '</span>' +
              '<span class="std-link-txt">' + esc(it.label) + '</span>' +
              '<span class="std-link-chev">' + svg('chevron') + '</span>' +
            '</a>';
          }).join('') + '</div>';
      }).join('') +
      '<button type="button" class="std-logout">' + svg('logout') + '<span>Log out</span></button>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    var closeBtn = drawer.querySelector('.std-close');

    function open() {
      drawer.hidden = false; overlay.hidden = false;
      requestAnimationFrame(function () {
        drawer.classList.add('open'); overlay.classList.add('open');
      });
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('std-menu-open');
    }
    function close() {
      drawer.classList.remove('open'); overlay.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('std-menu-open');
      setTimeout(function () { drawer.hidden = true; overlay.hidden = true; }, 240);
    }

    burger.addEventListener('click', function () {
      drawer.classList.contains('open') ? close() : open();
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a.std-link')) close();
      if (e.target.closest('.std-logout')) {
        try { localStorage.removeItem('ksl_token'); } catch (x) {}
        location.href = '/login';
      }
    });
  }

  // Recommended row: product-style cards that scroll sideways.
  var REC_PAGES = ['/buy-number', '/dashboard', '/boost', '/marketplace'];
  var REC_STYLE = {
    number: { icon: 'phone', from: '#1d4ed8', to: '#38bdf8' },
    boost: { icon: 'trend', from: '#be185d', to: '#f472b6' },
    email: { icon: 'mail', from: '#6d28d9', to: '#a78bfa' },
    rental: { icon: 'key', from: '#b45309', to: '#fbbf24' }
  };
  var REC_FALLBACK = [
    { key: 'number:server1', label: 'USA WhatsApp numbers', sub: 'Buy Number 1 · live prices', href: '/buy-number?server=server1' },
    { key: 'number:server2', label: 'Any service, any country', sub: 'Buy Number 2', href: '/buy-number?server=server2' },
    { key: 'email', label: 'Temp email', sub: 'Disposable inbox', href: '/temp-email' },
    { key: 'boost', label: 'Social boosting', sub: 'Followers, views, likes', href: '/boost' }
  ];

  // Brand marks, used only when a listing has no picture of its own.
  var BRAND = {
    facebook: { from: '#1877F2', to: '#1877F2', path: '<path fill="#fff" stroke="none" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.9c0-.9.3-1.6 1.6-1.6h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.4H7.6V14h2.7v8z"/>' },
    tiktok: { from: '#111', to: '#25f4ee', path: '<path fill="#fff" stroke="none" d="M16.6 3h-3v12.2a2.6 2.6 0 1 1-2.6-2.6c.2 0 .4 0 .6.1V9.6a5.6 5.6 0 1 0 5 5.6V8.8a7.2 7.2 0 0 0 4.2 1.3V7.1a4.2 4.2 0 0 1-4.2-4.1z"/>' },
    instagram: { from: '#833ab4', to: '#fd1d1d', path: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none"/><circle cx="12" cy="12" r="4" fill="none"/><circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none"/>' }
  };
  var PLATFORM_NAME = { facebook: 'Facebook', tiktok: 'TikTok', instagram: 'Instagram' };
  // Marketplace order: the first market that has a listing wins; the next market fills the gap.
  var MARKETS = [
    { name: 'Marketplace One', url: '/api/logs?type=log', page: '/marketplace' },
    { name: 'Marketplace Two', url: '/api/market2/products', page: '/marketplace2' },
    { name: 'Marketplace Three', url: '/api/market3/products', page: '/marketplace3' },
    { name: 'Marketplace Four', url: '/api/market4/products', page: '/marketplace4' }
  ];

  function platformOf(text) {
    var t = String(text || '').toLowerCase();
    if (/\bfacebook\b|\bfb\b/.test(t)) return 'facebook';
    if (/tik\s?tok/.test(t)) return 'tiktok';
    if (/instagram|\binsta\b|\big\b/.test(t)) return 'instagram';
    return null;
  }

  function getJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) { return Array.isArray(d) ? d : []; })
      .catch(function () { return []; });
  }

  // Lists every live listing per platform, in marketplace order (One, Two, Three, Four), cheapest first.
  var RAW_LISTS = [];
  function collectListings() {
    return Promise.all(MARKETS.map(function (m) { return getJson(m.url); })).then(function (lists) {
      RAW_LISTS = lists;
      var byPlatform = { facebook: [], tiktok: [], instagram: [] };
      lists.forEach(function (list, mi) {
        var m = MARKETS[mi];
        var rows = [];
        list.forEach(function (it) {
          if (!it || it.soldOut || it.inStock === false || it.enabled === false) return;
          var price = Number(it.price != null ? it.price : it.priceFrom) || 0;
          if (price <= 0) return;
          var plat = platformOf(it.category) || platformOf(it.title);
          if (!plat) return;
          rows.push({ plat: plat, price: price, item: it, m: m });
        });
        rows.sort(function (a, b) { return a.price - b.price; });
        rows.forEach(function (r) { byPlatform[r.plat].push(r); });
      });
      return byPlatform;
    });
  }

  function buildPlatformCards(byPlatform, mix, slots, used, skipTitles) {
    var out = [];
    used = used || {};
    skipTitles = skipTitles || {};
    function take(plat) {
      var list = byPlatform[plat];
      while (list.length) {
        var r = list.shift();
        var rid = r.item._id != null ? r.item._id : (r.item.id != null ? r.item.id : r.item.title);
        var key = r.m.name + ':' + rid;
        if (used[key] || skipTitles[String(r.item.title || '').trim().toLowerCase()]) continue;
        used[key] = true;
        var cat = r.item.category ? String(r.item.category) : PLATFORM_NAME[plat];
        out.push({
          key: 'plat:' + key, label: String(r.item.title || PLATFORM_NAME[plat]).slice(0, 60),
          sub: PLATFORM_NAME[plat] + ' · ' + r.m.name,
          href: r.m.page + '?' + (r.m.name === 'Marketplace Four' ? 'category=' + encodeURIComponent(cat) + '&' : '') + 'item=' + encodeURIComponent(rid),
          price: r.price, picture: r.item.picture || '', platform: plat,
          buy: buyMeta(r.m.name, r.item, r.price)
        });
        return true;
      }
      return false;
    }
    // First pass: the admin's mix. Second pass: fill any gap from whichever platform still has listings.
    ['facebook', 'tiktok', 'instagram'].forEach(function (p) {
      for (var i = 0; i < (mix[p] || 0) && out.length < slots; i++) if (!take(p)) break;
    });
    ['facebook', 'tiktok', 'instagram'].forEach(function (p) {
      while (out.length < slots && take(p)) { /* keep filling */ }
    });
    return out;
  }

  var BUY_MK = { 'Marketplace One': 'm1', 'Marketplace Two': 'm2', 'Marketplace Three': 'm3', 'Marketplace Four': 'm4' };
  function buyMeta(marketName, item, price) {
    var mk = BUY_MK[marketName];
    if (!mk) return null;
    var id = mk === 'm1' ? (item._id != null ? item._id : item.id) : item.id;
    if (id == null) return null;
    return { mk: mk, id: String(id), price: Number(price) || 0 };
  }

  var BUY_CSS_DONE = false;
  function ensureBuyCss() {
    if (BUY_CSS_DONE) return; BUY_CSS_DONE = true;
    var st = document.createElement('style');
    st.textContent = '.srb-row{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x proximity}' +
      '.srb-card{flex:0 0 188px;background:var(--card,#16161f);border:1px solid var(--border,#2a2a40);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;scroll-snap-align:start}' +
      '.srb-top{display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit;min-width:0}' +
      '.srb-ico{flex:0 0 40px;width:40px;height:40px;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center}' +
      '.srb-ico img{width:100%;height:100%;object-fit:cover}' +
      '.srb-ico svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2}' +
      '.srb-title{font-weight:700;font-size:13px;line-height:1.25;color:var(--t1,#fff);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.srb-sub{font-size:11.5px;color:var(--t2,#9a9ab0);margin-top:2px}' +
      '.srb-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto}' +
      '.srb-price{font-weight:800;font-size:13px;color:#22c55e;white-space:nowrap}' +
      '.srb-buy{background:var(--nb-blue,#2f7bf6);color:#fff;border:0;border-radius:9px;padding:7px 10px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap}' +
      '.srb-buy:disabled{opacity:.5;cursor:wait}';
    document.head.appendChild(st);
  }

  function renderRecommended(box, items) {
    ensureBuyCss();
    box.innerHTML =
      '<div class="std-rec-head"><h3>Recommended for you</h3><a href="/marketplace">See all</a></div>' +
      '<div class="srb-row">' + items.map(function (it) {
        var k = String(it.key || '').split(':')[0];
        var brand = BRAND[it.platform];
        var art;
        if (it.picture) {
          art = '<span class="srb-ico"><img src="' + esc(it.picture) + '" alt="" loading="lazy"/></span>';
        } else if (brand) {
          art = '<span class="srb-ico" style="background:linear-gradient(135deg,' + brand.from + ',' + brand.to + ')">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true">' + brand.path + '</svg></span>';
        } else {
          var st = REC_STYLE[k] || { icon: 'zap', from: '#334155', to: '#64748b' };
          art = '<span class="srb-ico" style="background:linear-gradient(135deg,' + st.from + ',' + st.to + ')">' + svg(st.icon) + '</span>';
        }
        var price = it.price ? Math.ceil(Number(it.price)).toLocaleString('en-NG') : '';
        var buyAttrs = it.buy
          ? ' data-mk="' + it.buy.mk + '" data-id="' + esc(it.buy.id) + '"'
          : ' data-href="' + esc(it.href) + '"';
        return '<div class="srb-card">' +
          '<a class="srb-top" href="' + esc(it.href) + '">' + art +
            '<span style="min-width:0"><span class="srb-title" style="display:block">' + esc(it.label) + '</span><span class="srb-sub" style="display:block">' + esc(it.sub || '') + '</span></span></a>' +
          '<div class="srb-foot"><span class="srb-price">' + (price ? 'from ₦' + price : '') + '</span>' +
            '<button type="button" class="srb-buy" data-label="' + esc(it.label) + '" data-price="' + (it.price || 0) + '"' + buyAttrs + '>Buy now</button></div>' +
          '</div>';
      }).join('') + '</div>';
    box.onclick = function (e) {
      var b = e.target.closest && e.target.closest('.srb-buy');
      if (b) buyNow(b);
    };
  }

  // Buy straight from the dashboard. Marketplace items are bought here; number, boost and other cards open their page.
  function buyNow(btn) {
    var href = btn.getAttribute('data-href');
    if (href) { location.href = href; return; }
    var token = null; try { token = localStorage.getItem('ksl_token'); } catch (e) {}
    if (!token) { location.href = '/login'; return; }
    var mk = btn.getAttribute('data-mk'), id = btn.getAttribute('data-id');
    var label = btn.getAttribute('data-label') || 'this item';
    var price = Number(btn.getAttribute('data-price')) || 0;
    var ask = window.mzConfirm
      ? window.mzConfirm({ type: 'info', title: 'Buy ' + label + '?', message: 'About ₦' + Math.ceil(price).toLocaleString('en-NG') + ' will be taken from your wallet. Your item appears in Purchase history.', confirmText: 'Buy now', cancelText: 'Cancel' })
      : Promise.resolve(confirm('Buy ' + label + '?'));
    ask.then(function (ok) {
      if (!ok) return;
      var url, body;
      if (mk === 'm1') { url = '/api/logs/buy/' + encodeURIComponent(id); body = {}; }
      else if (mk === 'm2') { url = '/api/market2/buy'; body = { productId: parseInt(id, 10), quantity: 1 }; }
      else if (mk === 'm3') { url = '/api/market3/buy'; body = { productId: parseInt(id, 10), quantity: 1 }; }
      else if (mk === 'm4') { url = '/api/market4/buy'; body = { productId: parseInt(id, 10), quantity: 1, clientRef: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random()) }; }
      else return;
      var old = btn.textContent; btn.disabled = true; btn.textContent = 'Buying…';
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.d.error || 'Purchase failed');
          if (window.mzBanner) window.mzBanner('Purchased. Find it in your Purchase history.', 'ok');
          if (window.updateNav) try { window.updateNav(); } catch (e) {}
        })
        .catch(function (e) { if (window.mzBanner) window.mzBanner(e.message, 'err'); })
        .then(function () { btn.disabled = false; btn.textContent = old; });
    });
  }

  // Where the Recommended row sits on each page: right after the page's main block,
  // so the page's own features come first and the row sits in the middle.
  var REC_AFTER = {
    '/dashboard': '.mz-actions-grid',
    '/boost': '#page-boost .page-hero',
    '/marketplace': '.mkt-page-switch'
  };

  function buildRecommended() {
    var path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    var middle = REC_AFTER[path] ? document.querySelector(REC_AFTER[path]) : null;
    var anchor = document.getElementById('numServerCard') || document.querySelector('.wrap');
    var box = document.createElement('section');
    box.className = 'std-recommended';
    box.setAttribute('aria-label', 'Recommended for you');
    if (middle) middle.insertAdjacentElement('afterend', box);
    else if (anchor) anchor.parentNode.insertBefore(box, anchor);
    else {
      var hdr = document.querySelector('.std-header');
      if (!hdr) return;
      hdr.insertAdjacentElement('afterend', box);
    }
    // No default cards first: show a quiet placeholder until the admin's pinned products are known,
    // so the customer never sees "USA WhatsApp numbers" flash and then switch.
    ensureBuyCss();
    box.innerHTML = '<div class="std-rec-head"><h3>Recommended for you</h3><a href="/marketplace">See all</a></div>' +
      '<div class="srb-row">' + [1, 2, 3, 4].map(function () {
        return '<div class="srb-card" style="min-height:96px;opacity:.45"></div>';
      }).join('') + '</div>';
    var shown = false;
    function compose(d, byPlatform) {
      var mix = d.platformMix || { facebook: 2, tiktok: 2, instagram: 2 };
      var pinned = (Array.isArray(d.pinned) ? d.pinned : []).slice(0, 6);
      // Pinned marketplace products: refresh name / price / logo from the live listing, and drop any that sold out or were removed.
      var MK_IDX = { m1: 0, m2: 1, m3: 2, m4: 3 };
      var used = {}, skipTitles = {}, slotsArr = [null, null, null, null, null, null], loose = [];
      pinned.forEach(function (p) {
        var item = { key: p.key, label: p.label, sub: p.sub, href: p.href, price: p.price, picture: p.picture, buy: p.mk && p.pid ? { mk: p.mk, id: String(p.pid), price: p.price } : null };
        if (p.mk && MK_IDX[p.mk] != null) {
          var live = RAW_LISTS[MK_IDX[p.mk]] || [];
          if (live.length) {
            var hit = live.filter(function (it) { return String(it && (it._id != null ? it._id : it.id)) === String(p.pid); })[0];
            if (!hit || hit.soldOut || hit.inStock === false || hit.enabled === false) return;   // gone: the card falls back to auto
            item.label = String(hit.title || item.label).slice(0, 60);
            var pr = Number(hit.price != null ? hit.price : hit.priceFrom);
            if (pr > 0) item.price = pr;
            if (hit.picture) item.picture = hit.picture;
          }
        }
        used[p.key] = true; skipTitles[String(item.label).trim().toLowerCase()] = true;
        if (Number.isInteger(p.slot) && p.slot >= 0 && p.slot < 6 && !slotsArr[p.slot]) slotsArr[p.slot] = item; else loose.push(item);
      });
      loose.forEach(function (it) { var i = slotsArr.indexOf(null); if (i > -1) slotsArr[i] = it; });
      var empty = slotsArr.filter(function (x) { return !x; }).length;
      var cards = buildPlatformCards(byPlatform, mix, empty, used, skipTitles);
      return slotsArr.map(function (x) { return x || cards.shift() || null; }).filter(Boolean);
    }
    function fresh() { return { facebook: [], tiktok: [], instagram: [] }; }
    fetch('/api/suggestions', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) throw 0;
        // 1) Pinned products appear immediately from the saved data (no waiting for the marketplaces).
        if (Array.isArray(d.pinned) && d.pinned.length) {
          var first = compose(d, fresh());
          if (first.length) { renderRecommended(box, first); shown = true; }
        }
        // 2) Then refresh with live listings (current price/logo, drop sold-out, fill empty cards).
        return collectListings().then(function (byPlatform) {
          var items = compose(d, byPlatform);
          if (items.length) { renderRecommended(box, items); shown = true; }
          else if (!shown) renderRecommended(box, REC_FALLBACK);
        });
      })
      .catch(function () { if (!shown) renderRecommended(box, REC_FALLBACK); });
  }

  // Removes any "Wallet balance" card, whatever its class name, so no standard page shows it.
  function hideBalanceCards() {
    var labels = document.querySelectorAll('body div, body span, body p, body b, body strong, body small, body h2, body h3, body h4, body label');
    Array.prototype.forEach.call(labels, function (n) {
      if (n.children.length || n.closest('.std-header, .std-drawer')) return;
      var t = (n.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (t !== 'wallet balance' && t !== 'wallet balance:') return;
      var card = n;
      for (var i = 0; i < 3 && card.parentElement && card.parentElement !== document.body; i++) {
        var parent = card.parentElement;
        if ((parent.textContent.match(/\u20A6|NGN/g) || []).length > 1) break;
        card = parent;
      }
      card.style.display = 'none';
    });
  }

  // Compact balance strip at the top of every Buy number page.
  function buildNumberBalance() {
    var hdr = document.querySelector('.std-header');
    if (!hdr || document.getElementById('stdNumBal')) return;
    var tok = null, user = null;
    try { tok = localStorage.getItem('ksl_token'); user = JSON.parse(localStorage.getItem('ksl_user') || 'null'); } catch (e) {}
    if (!tok) return;
    var raw = '';
    var fmt = function (n) { return '\u20a6' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var hidden = function () { try { return localStorage.getItem('ksl_hide_balance') === '1'; } catch (e) { return false; } };
    var bar = document.createElement('div');
    bar.id = 'stdNumBal'; bar.className = 'std-numbal';
    bar.innerHTML =
      '<span class="std-numbal-ico">' + svg('wallet') + '</span>' +
      '<div class="std-numbal-txt"><small>Your balance</small><b id="stdNumBalAmt">\u20a6\u2014</b></div>' +
      '<button type="button" class="std-numbal-eye" id="stdNumBalEye" aria-label="Show or hide balance"></button>' +
      '<a class="std-numbal-add" href="/deposit">+ Add funds</a>';
    hdr.insertAdjacentElement('afterend', bar);
    var eyeOn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOff = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A9.9 9.9 0 0112 19c-6 0-10-7-10-7a17.7 17.7 0 014.1-5M9.9 4.2A10 10 0 0112 4c6 0 10 7 10 7a17.6 17.6 0 01-2 3M3 3l18 18"/></svg>';
    function paint() {
      var h = hidden();
      document.getElementById('stdNumBalAmt').textContent = h ? '\u2022\u2022\u2022\u2022\u2022\u2022' : (raw || '\u20a6\u2014');
      document.getElementById('stdNumBalEye').innerHTML = h ? eyeOff : eyeOn;
    }
    document.getElementById('stdNumBalEye').addEventListener('click', function () {
      try { localStorage.setItem('ksl_hide_balance', hidden() ? '0' : '1'); } catch (e) {}
      paint();
    });
    if (user && (user.balance != null || user.wallet != null)) raw = fmt(user.balance != null ? user.balance : user.wallet);
    paint();
    fetch('/api/user/wallet', { headers: { Authorization: 'Bearer ' + tok } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (w) {
        var b = w && w.balance;
        var n = b && typeof b === 'object' ? (b.ngn != null ? b.ngn : null) : (typeof b === 'number' ? b : null);
        if (n != null) { raw = fmt(n); paint(); }
      }).catch(function () {});
  }

  function init() {
    var path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    // The dashboard and the Fund wallet page show the wallet card on purpose.
    var keepWallet = path === '/dashboard' || path === '/deposit';
    if (keepWallet) document.body.classList.add('std-keep-wallet');
    buildHeader();
    if (!keepWallet) { hideBalanceCards(); setTimeout(hideBalanceCards, 1500); }
    if (REC_PAGES.indexOf(path) > -1) buildRecommended();
    // Last, so the balance strip sits directly under the header, above everything else.
    if (/^\/buy-number/.test(path)) buildNumberBalance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
