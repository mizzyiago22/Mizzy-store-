// ══════════ MARKETPLACE 5 SHOP (ExpressLogs): categories → products → cart → instant credentials ══════════
// Loaded after script.js (uses req(), esc(), P(), showToast(), token, updateNav()).
(function () {
  var items = [], view = 'cats', curCat = '', q = '';
  var cart = {};            // productId -> qty
  var refs = {};            // productId -> idempotency ref for the current checkout
  var busy = false;
  var $ = function (id) { return document.getElementById(id); };
  var E = function (s) { return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var money = function (n) { return (typeof P === 'function') ? P(n) : '₦' + Number(n || 0).toLocaleString(); };
  var toast = function (m, t) { if (typeof showToast === 'function') showToast(m, t); };
  var newRef = function () { var r = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('r' + Date.now() + Math.random().toString(36).slice(2)); return String(r).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var NET = /connection problem|taking too long|offline|invalid server response/i;
  var byId = function (id) { return items.find(function (i) { return i.id === id; }); };
  var groupOf = function (i) { return i.group || i.category || 'Other'; };

  function prepPage() {
    document.body.classList.add('m4-shop');
    ['mktChips'].forEach(function (id) { var el = $(id); if (el) el.style.display = 'none'; });
    var tb = document.querySelector('.mkt-toolbar'); if (tb) tb.style.display = 'none';
    var rc = $('mktResultCount'); if (rc) rc.style.display = 'none';
    if (!$('m4Top')) {
      var grid = $('marketGrid');
      var top = document.createElement('div'); top.id = 'm4Top';
      top.innerHTML = '<div class="m4-bar"><button type="button" id="m4Back" class="m4-back" style="display:none">← All categories</button>' +
        '<div class="m4-search"><input id="m4Search" type="search" placeholder="Search products…" autocomplete="off"/></div></div><h2 id="m4Title" class="m4-title"></h2>';
      grid.parentNode.insertBefore(top, grid);
      $('m4Back').onclick = function () { view = 'cats'; curCat = ''; q = ''; $('m4Search').value = ''; render(); window.scrollTo(0, 0); };
      $('m4Search').oninput = function () { q = this.value.trim().toLowerCase(); if (q && view === 'cats') { view = 'search'; } else if (!q && view === 'search') { view = 'cats'; } render(); };
    }
    if (!$('m4Overlay')) {
      var ov = document.createElement('div'); ov.id = 'm4Overlay'; ov.className = 'm4-overlay';
      ov.innerHTML = '<div class="m4-sheet" role="dialog" aria-modal="true"><div id="m4SheetBody"></div></div>';
      ov.addEventListener('click', function (e) { if (e.target === ov && !busy) closeSheet(); });
      document.body.appendChild(ov);
    }
    if (!$('m5Style')) {
      var st = document.createElement('style'); st.id = 'm5Style';
      st.textContent = '.m5-logo{width:44px;height:44px;border-radius:12px;object-fit:cover;flex:0 0 44px;background:#fff;border:1px solid var(--border2,#dbe6f6)}' +
        '.m5-logo-ph{display:flex;align-items:center;justify-content:center;background:var(--gold,#0b7cf5);color:#fff;font-weight:900;font-size:18px;border:0}' +
        '.m5-head{display:flex;gap:10px;align-items:center;min-width:0}.m5-head .m4-card-head{flex:1;min-width:0}' +
        '.m4-cat-ico.m5-ico-img{padding:0;overflow:hidden;background:#fff;border:1px solid var(--border2,#dbe6f6)}.m4-cat-ico.m5-ico-img img{width:100%;height:100%;object-fit:cover}' +
        '.m5-buy{flex:1;min-height:40px;border:0;border-radius:10px;font-weight:800;font-size:14px;color:#fff;background:linear-gradient(135deg,#155EEF,#38BDF8);cursor:pointer}' +
        '.m5-buy:active{transform:scale(.98)}.m5-buy[disabled]{opacity:.5;cursor:not-allowed}';
      document.head.appendChild(st);
    }
  }

  async function init() {
    var grid = $('marketGrid'); if (!grid) return;
    prepPage();
    grid.innerHTML = (typeof skeletons === 'function') ? skeletons(6) : 'Loading…';
    try { items = await req('/api/market5/products', 'GET', null, false); }
    catch (e) {
      if (e.maintenance) { grid.innerHTML = '<div class="no-items" style="grid-column:1/-1;padding:50px 20px"><div style="font-size:40px">🛠️</div><h3>Under maintenance</h3><p>' + E(e.message) + '</p></div>'; return; }
      grid.innerHTML = '<div class="no-items" style="grid-column:1/-1">' + E(e.message) + '<br/><button class="btn-secondary" style="margin-top:10px" onclick="initMarket5()">Retry</button></div>'; return;
    }
    render();
  }

  function cartInfo() {
    var n = 0, total = 0;
    Object.keys(cart).forEach(function (id) { var it = byId(+id); if (!it) { delete cart[id]; return; } n += cart[id]; total += cart[id] * it.price; });
    return { n: n, total: total, lines: Object.keys(cart).length };
  }
  function updateBar() {
    var c = cartInfo(), bar = $('m4CartBar'); if (!bar) return;
    bar.style.display = c.n ? 'flex' : 'none';
    $('m4CartCount').textContent = c.n + (c.n === 1 ? ' item' : ' items');
    $('m4CartTotal').textContent = ' · ' + money(c.total);
    document.body.classList.toggle('m4-has-cart', !!c.n);
  }

  function render() {
    var grid = $('marketGrid'), title = $('m4Title'), back = $('m4Back');
    back.style.display = (view === 'cats') ? 'none' : 'inline-flex';
    grid.className = (view === 'cats') ? 'm4-cats' : 'm4-prods';
    if (view === 'cats') {
      title.textContent = 'Choose a category';
      var map = {};
      items.forEach(function (i) { var g = groupOf(i); (map[g] = map[g] || { n: 0, stock: 0, pic: '' }); map[g].n++; if (!map[g].pic && i.picture) map[g].pic = i.picture; if (i.inStock) map[g].stock += i.stock; });
      var names = Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
      grid.innerHTML = names.length ? names.map(function (g) {
        return '<button type="button" class="m4-cat" data-cat="' + E(g) + '">' + (map[g].pic ? '<span class="m4-cat-ico m5-ico-img"><img src="' + E(map[g].pic) + '" alt="" loading="lazy" onerror="this.parentNode.className=\'m4-cat-ico\';this.parentNode.textContent=\'' + E(g.charAt(0).toUpperCase()) + '\'"/></span>' : '<span class="m4-cat-ico">' + E(g.charAt(0).toUpperCase()) + '</span>') + '<span class="m4-cat-name">' + E(g) + '</span><span class="m4-cat-n">' + map[g].n + ' product' + (map[g].n === 1 ? '' : 's') + '</span></button>';
      }).join('') : '<div class="no-items" style="grid-column:1/-1">No products available yet</div>';
      Array.prototype.forEach.call(grid.querySelectorAll('.m4-cat'), function (b) { b.onclick = function () { curCat = b.getAttribute('data-cat'); view = 'cat'; render(); window.scrollTo(0, 0); }; });
    } else {
      var list = items.filter(function (i) { return view === 'search' || groupOf(i) === curCat; });
      if (q) list = list.filter(function (i) { return (i.title + ' ' + (i.description || '') + ' ' + groupOf(i)).toLowerCase().indexOf(q) > -1; });
      list.sort(function (a, b) { return Number(b.inStock) - Number(a.inStock) || a.price - b.price; });
      title.textContent = view === 'search' ? 'Search results' : curCat;
      grid.innerHTML = list.length ? list.map(card).join('') : '<div class="no-items" style="grid-column:1/-1">No products found</div>';
      Array.prototype.forEach.call(grid.querySelectorAll('[data-buy]'), function (b) { b.onclick = function () { buyNow(+b.getAttribute('data-buy')); }; });
      Array.prototype.forEach.call(grid.querySelectorAll('[data-step]'), function (b) { b.onclick = function () { step(b); }; });
    }
    updateBar();
  }

  function card(i) {
    var out = !i.inStock, max = Math.min(i.stock, 100);
    var logo = i.picture
      ? '<img class="m5-logo" src="' + E(i.picture) + '" alt="" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;m5-logo m5-logo-ph&quot;>' + E(i.title.charAt(0).toUpperCase()) + '</div>\'"/>'
      : '<div class="m5-logo m5-logo-ph">' + E(i.title.charAt(0).toUpperCase()) + '</div>';
    return '<div class="m4-card"><div class="m5-head">' + logo + '<div class="m4-card-head"><div class="m4-card-title">' + E(i.title) + '</div><div class="m4-card-price">' + money(i.price) + '</div></div></div>' +
      '<div class="m4-card-desc">' + E(i.description || 'Instant delivery after purchase.') + '</div>' +
      '<div class="m4-card-stock" style="color:' + (out ? '#e74c3c' : '#18a0fb') + '">' + (out ? 'Sold out' : i.stock + ' available') + '</div>' +
      (out ? '<div class="m4-card-act"><button type="button" class="m5-buy" disabled>Sold out</button></div>'
           : '<div class="m4-card-act"><div class="m4-qty"><button type="button" data-step="-1" data-id="' + i.id + '" aria-label="Less">−</button><input type="number" inputmode="numeric" id="q' + i.id + '" min="1" max="' + max + '" value="1"/><button type="button" data-step="1" data-id="' + i.id + '" aria-label="More">+</button></div>' +
             '<button type="button" class="m5-buy" data-buy="' + i.id + '">Buy now</button></div>') + '</div>';
  }
  function step(b) {
    var id = +b.getAttribute('data-id'), it = byId(id), inp = $('q' + id); if (!it || !inp) return;
    var v = (parseInt(inp.value, 10) || 1) + (+b.getAttribute('data-step'));
    inp.value = Math.max(1, Math.min(Math.min(it.stock, 100), v));
  }

  // ───── Buy now: one tap buys straight away (no cart, no confirmation step) ─────
  function closeSheet() { $('m4Overlay').classList.remove('open'); document.body.classList.remove('m4-lock'); }
  function openSheet() { $('m4Overlay').classList.add('open'); document.body.classList.add('m4-lock'); }

  async function buyNow(id) {
    if (busy) return;
    var it = byId(id), inp = $('q' + id); if (!it) return;
    if (typeof token === 'undefined' || !token) { toast('Please log in to buy', 'err'); setTimeout(function () { location.href = '/login'; }, 800); return; }
    var qty = Math.max(1, Math.min(Math.min(it.stock, 100), parseInt(inp && inp.value, 10) || 1));
    busy = true; openSheet();
    $('m4SheetBody').innerHTML = '<div class="m4-wait"><div class="m4-spin"></div><p>Buying…<br/><small>' + E(it.title) + ' × ' + qty + '</small></p><p class="m4-warn">Please do not close this page until your credentials appear.</p></div>';
    var res = await buyOne(id, qty);
    res.title = it.title; res.qty = res.qty || qty;
    if (res.ok) { delete refs[id]; it.stock = Math.max(0, it.stock - ((res.keys && res.keys.length) || qty)); it.inStock = it.stock > 0; }
    else if (!res.pending) { delete refs[id]; }
    busy = false;
    if (typeof updateNav === 'function') try { updateNav(); } catch (e) {}
    showResults([res]); render();
  }

  async function buyOne(id, qty) {
    var ref = refs[id] || (refs[id] = newRef());
    try {
      var it = byId(id); if (!it || !it.productKey) return { ok: false, error: 'Refresh the marketplace and choose the product again.' };
      var r = await req('/api/market5/buy', 'POST', { productId: it.productKey, quantity: qty, clientRef: ref }, true);
      return doneOne(r, ref);
    } catch (e) {
      if (e.maintenance) return { ok: false, error: e.message };
      if (NET.test(e.message || '')) {
        for (var i = 0; i < 6; i++) {
          await wait(2000);
          try {
            var list = await req('/api/market5/orders?ref=' + encodeURIComponent(ref), 'GET', null, true), o = Array.isArray(list) ? list[0] : null;
            if (!o) { if (i >= 2) break; continue; }
            if ((o.status === 'delivered' || o.status === 'partial') && o.keys && o.keys.length) return { ok: true, keys: o.keys, paid: o.amountPaid, partial: o.status === 'partial' };
            if (o.status === 'failed' || o.status === 'refunded') return { ok: false, error: 'This order did not go through. Nothing was charged.' };
          } catch (e2) {}
        }
        return { ok: false, pending: true, error: 'Connection problem. Check My Purchases before trying again, your order may have gone through.' };
      }
      delete refs[id];
      return { ok: false, error: e.message };
    }
  }
  function doneOne(r, ref) {
    if (r && r.pending) return { ok: false, pending: true, error: r.message || 'Order received, finalising delivery. Your credentials will appear in My Purchases shortly. Do not buy again.' };
    return { ok: true, keys: r.keys || [], paid: r.amountPaid, partial: !!r.partial, qty: r.quantity };
  }

  function showResults(results) {
    var allText = [];
    var html = results.map(function (r, idx) {
      if (!r.ok) return '<div class="m4-res bad"><b>' + E(r.title) + '</b><p>' + E(r.error) + '</p></div>';
      var txt = (r.keys || []).map(function (k) { return typeof k === 'string' ? k : JSON.stringify(k); }).join('\n') || 'Delivered';
      allText.push('# ' + r.title + '\n' + txt);
      return '<div class="m4-res"><b>' + E(r.title) + '</b> <span class="m4-ok">✔ ' + money(r.paid) + '</span>' + (r.partial ? '<p class="m4-warn">Only part of your order was available. The difference was refunded.</p>' : '') +
        '<pre class="m4-keys" id="m4k' + idx + '">' + E(txt) + '</pre><button type="button" class="m4-copy" data-copy="m4k' + idx + '">Copy</button></div>';
    }).join('');
    var okN = results.filter(function (r) { return r.ok; }).length;
    $('m4SheetBody').innerHTML = '<h3 class="m4-sh-title">' + (okN ? 'Purchase successful' : 'Purchase not completed') + '</h3>' + html +
      '<div class="m4-sh-btns">' + (allText.length ? '<button type="button" class="m4-ghost" id="m4Dl">Download .txt</button>' : '') + '<button type="button" class="m4-buy" id="m4Done">Done</button></div>' +
      '<p class="m4-note">You can see these again anytime in <a href="/purchases">My Purchases</a>.</p>';
    $('m4Done').onclick = closeSheet;
    var dl = $('m4Dl'); if (dl) dl.onclick = function () {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([allText.join('\n\n')], { type: 'text/plain' })); a.download = 'my-credentials.txt'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    Array.prototype.forEach.call($('m4SheetBody').querySelectorAll('[data-copy]'), function (b) { b.onclick = function () {
      var t = $(b.getAttribute('data-copy')).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Copied', 'ok'); }, function () {
        var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copied', 'ok'); } catch (e) {} ta.remove(); }); }; });
  }

  window.initMarket5 = init;

})();
