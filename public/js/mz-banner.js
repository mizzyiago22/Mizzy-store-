/* mz-banner.js — nice banners for confirmations and results.
 *   mzBanner(message, type, opts)   slide-down banner. type: 'ok' | 'err' | 'warn' | 'info'
 *   mzConfirm(opts)                 returns Promise<boolean>; replaces window.confirm()
 *     opts: { title, message, confirmText, cancelText, type }
 * Everything is inserted with textContent, so server messages can never inject HTML.
 */
(function () {
  if (window.mzBanner) return;

  var ICONS = { ok: '✓', err: '✕', warn: '!', info: 'i' };
  var COLORS = {
    ok: { bg: '#e8f8ef', bd: '#2ecc71', fg: '#116b3a', dot: '#2ecc71' },
    err: { bg: '#fdecea', bd: '#e74c3c', fg: '#8e1f14', dot: '#e74c3c' },
    warn: { bg: '#fff6e0', bd: '#f5a623', fg: '#7a4b00', dot: '#f5a623' },
    info: { bg: '#eaf2fe', bd: '#4a90e2', fg: '#17407a', dot: '#4a90e2' }
  };

  var css = document.createElement('style');
  css.textContent =
    '#mzBannerStack{position:fixed;top:12px;left:0;right:0;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;padding:0 12px}' +
    '.mz-banner{pointer-events:auto;display:flex;align-items:flex-start;gap:12px;width:100%;max-width:520px;box-sizing:border-box;padding:13px 14px;border-radius:14px;border:1px solid;box-shadow:0 10px 30px rgba(0,0,0,.18);font:500 14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;transform:translateY(-16px);opacity:0;transition:transform .25s ease,opacity .25s ease}' +
    '.mz-banner.show{transform:none;opacity:1}' +
    '.mz-ico{flex:0 0 auto;width:26px;height:26px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}' +
    '.mz-txt{flex:1;min-width:0;word-wrap:break-word}.mz-txt b{display:block;margin-bottom:2px;font-size:14.5px}' +
    '.mz-x{flex:0 0 auto;background:none;border:0;color:inherit;opacity:.55;font-size:20px;line-height:1;cursor:pointer;padding:0 2px}.mz-x:hover{opacity:1}' +
    '.mz-ov{position:fixed;inset:0;z-index:100001;background:rgba(10,12,20,.55);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s}' +
    '.mz-ov.show{opacity:1}' +
    '.mz-dlg{width:100%;max-width:400px;background:var(--card,#fff);color:var(--t1,#1a1d29);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);transform:translateY(14px) scale(.97);transition:transform .2s}' +
    '.mz-ov.show .mz-dlg{transform:none}' +
    '.mz-dh{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid}' +
    '.mz-dh b{font-size:16px}' +
    '.mz-db{padding:16px 18px;font-size:14.5px;line-height:1.55;color:var(--t2,#4a4f63);white-space:pre-line}' +
    '.mz-df{display:flex;gap:10px;padding:0 18px 18px}' +
    '.mz-df button{flex:1;padding:12px 10px;border-radius:12px;border:1px solid rgba(128,128,128,.35);font:600 14px system-ui,sans-serif;cursor:pointer;background:transparent;color:inherit}' +
    '.mz-df button.mz-go{border:0;color:#fff}';
  document.head.appendChild(css);

  function stack() {
    var s = document.getElementById('mzBannerStack');
    if (!s) { s = document.createElement('div'); s.id = 'mzBannerStack'; document.body.appendChild(s); }
    return s;
  }

  window.mzBanner = function (message, type, opts) {
    type = COLORS[type] ? type : 'info';
    opts = opts || {};
    var c = COLORS[type];
    var el = document.createElement('div');
    el.className = 'mz-banner';
    el.setAttribute('role', type === 'err' ? 'alert' : 'status');
    el.style.cssText = 'background:' + c.bg + ';border-color:' + c.bd + ';color:' + c.fg;
    var ico = document.createElement('div'); ico.className = 'mz-ico'; ico.style.background = c.dot; ico.textContent = ICONS[type];
    var tx = document.createElement('div'); tx.className = 'mz-txt';
    if (opts.title) { var b = document.createElement('b'); b.textContent = opts.title; tx.appendChild(b); }
    tx.appendChild(document.createTextNode(String(message == null ? '' : message)));
    var x = document.createElement('button'); x.className = 'mz-x'; x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
    el.appendChild(ico); el.appendChild(tx); el.appendChild(x);
    stack().appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    var done = false;
    function close() {
      if (done) return; done = true;
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 260);
    }
    x.onclick = close;
    var ms = opts.ms != null ? opts.ms : (type === 'err' ? 7000 : 5000);
    if (ms > 0) setTimeout(close, ms);
    return close;
  };

  window.mzConfirm = function (opts) {
    opts = opts || {};
    var type = COLORS[opts.type] ? opts.type : 'warn';
    var c = COLORS[type];
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'mz-ov';
      var dlg = document.createElement('div'); dlg.className = 'mz-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
      var hd = document.createElement('div'); hd.className = 'mz-dh'; hd.style.cssText = 'background:' + c.bg + ';border-color:' + c.bd + ';color:' + c.fg;
      var ico = document.createElement('div'); ico.className = 'mz-ico'; ico.style.background = c.dot; ico.textContent = ICONS[type];
      var ti = document.createElement('b'); ti.textContent = opts.title || 'Please confirm';
      hd.appendChild(ico); hd.appendChild(ti);
      var bd = document.createElement('div'); bd.className = 'mz-db'; bd.textContent = opts.message || '';
      var ft = document.createElement('div'); ft.className = 'mz-df';
      var no = document.createElement('button'); no.type = 'button'; no.textContent = opts.cancelText || 'Not now';
      var yes = document.createElement('button'); yes.type = 'button'; yes.className = 'mz-go'; yes.style.background = c.dot; yes.textContent = opts.confirmText || 'Confirm';
      ft.appendChild(no); ft.appendChild(yes);
      dlg.appendChild(hd); dlg.appendChild(bd); dlg.appendChild(ft); ov.appendChild(dlg);
      document.body.appendChild(ov);
      requestAnimationFrame(function () { ov.classList.add('show'); yes.focus(); });
      function finish(v) {
        document.removeEventListener('keydown', onKey);
        ov.classList.remove('show');
        setTimeout(function () { ov.remove(); }, 200);
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') finish(false); }
      document.addEventListener('keydown', onKey);
      no.onclick = function () { finish(false); };
      yes.onclick = function () { finish(true); };
      ov.addEventListener('click', function (e) { if (e.target === ov) finish(false); });
    });
  };
  // mzAsk(message[, opts]) -> Promise<boolean>. Drop-in for window.confirm(): `if (!await mzAsk(msg)) return;`
  // Picks a sensible title/colour/button label from the wording unless opts override them.
  window.mzAsk = function (message, opts) {
    message = String(message == null ? '' : message);
    opts = opts || {};
    var danger = /delete|permanent|remove|revoke|cannot be undone|can't be undone|restrict|reverse|cancel this/i.test(message);
    var buy = /purchase|buy |boost |deducted|pay /i.test(message);
    var o = {
      message: message,
      type: danger ? 'err' : (buy ? 'info' : 'warn'),
      title: danger ? 'Are you sure?' : (buy ? 'Confirm purchase' : 'Please confirm'),
      confirmText: danger ? 'Yes, continue' : (buy ? 'Confirm & pay' : 'Yes, continue'),
      cancelText: 'Cancel'
    };
    for (var k in opts) o[k] = opts[k];
    return window.mzConfirm(o);
  };

  // Any leftover alert() now shows as the floating site banner instead of the browser popup.
  window.alert = function (msg) {
    var m = String(msg == null ? '' : msg);
    var bad = /error|fail|invalid|cannot|can't|couldn't|unable|denied|not |wrong|insufficient|expired/i.test(m);
    window.mzBanner(m, bad ? 'err' : 'ok');
  };
})();
