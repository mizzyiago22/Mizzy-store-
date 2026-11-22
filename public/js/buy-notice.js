/* "Before you buy a number" banner.
   Text is edited in Admin > Site Links > "Before you buy a number" notice.
   Pops up as soon as the customer opens a Buy Number page, BEFORE they fund their wallet or start
   a purchase (so no countdown is running while they read). They must tap "I understand, continue";
   Escape / outside taps do nothing. It shows EVERY time a Buy Number page is opened (leave and come
   back and it shows again) - nothing is remembered between visits. */
(function () {
  if (window.__mysBuyNotice) return; window.__mysBuyNotice = true;
  var notice = null, loading = null, open = false;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function seen(v) { try { return sessionStorage.getItem('mys_buy_notice_ok') === v; } catch (e) { return false; } }
  function mark(v) { try { sessionStorage.setItem('mys_buy_notice_ok', v); } catch (e) {} }

  function load() {
    if (loading) return loading;
    loading = fetch('/api/buy-notice', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (n) { notice = n; return n; })
      .catch(function () { return null; });
    return loading;
  }
  function needed(n) { return !!(n && n.enabled && String(n.message || '').trim()); }

  function render(message) {
    var lines = String(message).replace(/\r/g, '').split('\n');
    var title = '';
    while (lines.length && !title) title = (lines.shift() || '').trim();
    title = title.replace(/^(\u26A0\uFE0F?|\u2757)\s*/, '');
    var html = '', steps = [];
    function flush() { if (steps.length) { html += '<ol class="bn-steps">' + steps.join('') + '</ol>'; steps = []; } }
    lines.forEach(function (ln) {
      var t = ln.trim();
      if (!t) return;
      var m = t.match(/^(\d+)[.)]\s+(.*)$/);
      if (m) steps.push('<li><span class="bn-n">' + esc(m[1]) + '</span><span class="bn-t">' + esc(m[2]) + '</span></li>');
      else { flush(); html += '<p class="bn-p">' + esc(t) + '</p>'; }
    });
    flush();
    return { title: title, body: html };
  }

  function show(n, done) {
    if (open) return; open = true;
    var r = render(n.message);
    var css = document.createElement('style');
    css.textContent =
      '#mysBN{position:fixed;inset:0;z-index:2147483000;background:rgba(2,8,20,.74);display:flex;align-items:center;justify-content:center;padding:16px;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);animation:bnIn .18s ease-out}' +
      '@keyframes bnIn{from{opacity:0}to{opacity:1}}@keyframes bnUp{from{transform:translateY(14px) scale(.98);opacity:0}to{transform:none;opacity:1}}' +
      '#mysBN .bn-box{width:100%;max-width:460px;max-height:90vh;display:flex;flex-direction:column;background:var(--card,#fff);color:var(--t1,#0e1726);border:1px solid var(--border2,#c8dbea);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.5);overflow:hidden;animation:bnUp .22s ease-out}' +
      '#mysBN .bn-head{display:flex;gap:14px;align-items:center;padding:18px 20px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff}' +
      '#mysBN .bn-ic{flex:0 0 44px;height:44px;border-radius:12px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center}' +
      '#mysBN .bn-title{font-weight:800;font-size:15.5px;line-height:1.3;letter-spacing:.2px;text-transform:uppercase}' +
      '#mysBN .bn-body{padding:16px 20px 6px;overflow:auto;-webkit-overflow-scrolling:touch}' +
      '#mysBN .bn-p{font-size:14px;line-height:1.55;font-weight:600;margin:0 0 12px;color:var(--t1,#0e1726)}' +
      '#mysBN .bn-steps{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:8px}' +
      '#mysBN .bn-steps li{display:flex;gap:11px;align-items:flex-start;background:var(--bg4,#f1f5f9);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:10px 12px}' +
      '#mysBN .bn-n{flex:0 0 24px;height:24px;border-radius:50%;background:var(--gold,#2f7bf6);color:#fff;font-weight:800;font-size:12.5px;display:flex;align-items:center;justify-content:center}' +
      '#mysBN .bn-t{font-size:13.5px;line-height:1.5;color:var(--t1,#0e1726)}' +
      '#mysBN .bn-foot{padding:12px 20px 18px}' +
      '#mysBN .bn-ok{width:100%;padding:14px 16px;border:0;border-radius:12px;font:inherit;font-weight:800;font-size:15px;cursor:pointer;background:linear-gradient(135deg,var(--gold,#2f7bf6),var(--gold2,#1f5fd1));color:#fff;box-shadow:0 8px 20px rgba(47,123,246,.3)}' +
      '#mysBN .bn-ok:active{transform:scale(.99)}';
    document.head.appendChild(css);
    var o = document.createElement('div');
    o.id = 'mysBN'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', r.title || 'Please read');
    o.innerHTML =
      '<div class="bn-box"><div class="bn-head"><div class="bn-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>' +
      '<div class="bn-title">' + esc(r.title) + '</div></div>' +
      '<div class="bn-body">' + r.body + '</div>' +
      '<div class="bn-foot"><button type="button" class="bn-ok" id="mysBNok">I understand, continue</button></div></div>';
    document.body.appendChild(o);
    var prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    var ok = document.getElementById('mysBNok'); ok.focus();
    ok.addEventListener('click', function () {
      document.body.style.overflow = prev; o.remove(); css.remove(); open = false; done();
    });
    o.addEventListener('keydown', function (e) { if (e.key === 'Escape') e.preventDefault(); });
  }

  function init() {
    load().then(function (n) { if (needed(n)) show(n, function () {}); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
