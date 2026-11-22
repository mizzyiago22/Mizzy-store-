/* Floating Support pop-out menu (same look as the old one) on every customer page, dashboard included.
   Admin picks ONE channel (WhatsApp or Telegram): the round button shows that app's icon and opens its contact menu. Items follow the Admin > Site Links switches: WhatsApp off -> WhatsApp items hide and Telegram becomes
   "Contact on Telegram"; Telegram off -> Telegram item hides. Pages that already have the old
   #supportFab keep it; this only adds it where it was missing and fixes its Telegram label. */
(function () {
  if (window.__msDock) return; window.__msDock = true;
  var p = location.pathname.replace(/\/+$/, '') || '/';
  if (p.indexOf('/admin') === 0) return;
  var TG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M21.9 4.1 2.8 11.5c-1.3.5-1.3 1.3-.2 1.6l4.9 1.5 1.9 5.8c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.7-.8l3.2-15.1c.3-1.3-.5-1.9-1.4-1.5zM9 13.9l9.4-5.9c.4-.3.8-.1.5.2l-7.8 7-.3 3.2z"/></svg>';
  var WA = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.09c-.24.68-1.4 1.3-1.93 1.35-.5.06-1.13.08-1.83-.11-.42-.12-.96-.3-1.66-.6-2.92-1.26-4.82-4.2-4.97-4.4-.15-.19-1.19-1.58-1.19-3.01 0-1.44.75-2.14 1.02-2.44.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2.01.9 2.15.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.27.37-.22.62-.13.25.09 1.6.75 1.87.89.27.13.45.2.51.31.06.11.06.66-.18 1.34z"/></svg>';
  var WA_BIG = WA.replace(/width="16" height="16"/, 'width="28" height="28"');
  var TG_BIG = TG.replace(/width="16" height="16"/, 'width="28" height="28"');
  function styleToggle(btn, wa, tg) {
    if (!btn) return;
    if (wa) { btn.innerHTML = WA_BIG; btn.style.background = '#25D366'; btn.style.color = '#fff'; btn.setAttribute('aria-label', 'Contact us on WhatsApp'); }
    else if (tg) { btn.innerHTML = TG_BIG; btn.style.background = '#229ed9'; btn.style.color = '#fff'; btn.setAttribute('aria-label', 'Contact us on Telegram'); }
  }
  var BOT = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 01-11.9 7.8L4 21l1.2-5A8.5 8.5 0 1121 12z"/></svg>';
  var HEAD = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-2a9 9 0 0118 0v2"/><rect x="2" y="14" width="5" height="7" rx="1.5"/><rect x="17" y="14" width="5" height="7" rx="1.5"/><path d="M20 21a4 4 0 01-4 3h-2"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function item(href, icon, label, primary) {
    return '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer" class="msd-item' + (primary ? ' msd-primary' : '') + '">' + icon + ' ' + esc(label) + '</a>';
  }
  function links(cb) {
    fetch('/api/public/site-links?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (l) { if (l) cb(l); }).catch(function () {});
  }

  var legacy = document.getElementById('supportFab');
  if (legacy) {
    /* Old pop-out menu already on this page: keep it, just make its Telegram line follow the admin switch. */
    links(function (l) {
      var wa = l.whatsappEnabled !== false, tgOn = l.telegramEnabled !== false && !wa;
      styleToggle(legacy.querySelector('.sfab-toggle'), wa, tgOn);
      legacy.querySelectorAll('[data-link="group"],[data-link="channel"],[data-link="contact"]').forEach(function (a) { a.style.display = wa ? '' : 'none'; });
      var tg = legacy.querySelector('[data-link="telegram"]');
      if (tg) {
        tg.style.display = tgOn ? '' : 'none';
        if (tgOn) { tg.classList.add('sfab-item-primary'); tg.style.background = '#229ed9'; tg.style.color = '#fff'; tg.lastChild.nodeValue = ' Contact on Telegram'; }
      }
    });
    return;
  }

  var css = document.createElement('style');
  css.textContent =
    '#msDock{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:9100;display:flex;flex-direction:column;align-items:flex-end;gap:10px}' +
    '#msDock .msd-toggle{width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#2f7bf6,#1f5fd1);border:none;box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
    '#msDock .msd-toggle:hover{transform:scale(1.06)}' +
    '#msDock .msd-menu{display:none;flex-direction:column;gap:8px;align-items:flex-end;margin-bottom:4px}' +
    '#msDock.open .msd-menu{display:flex}' +
    '#msDock .msd-item{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:24px;font:700 13.5px/1.2 inherit;font-family:inherit;text-decoration:none;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.3);background:#1a1a2b;color:#eeeef5;border:1px solid #2e2e42;transition:transform .15s}' +
    '#msDock .msd-item:hover{transform:translateX(-2px);border-color:#2f7bf6}' +
    '#msDock .msd-primary{background:#25D366;color:#0a0a14;border-color:transparent}' +
    '#msDock .msd-tgp{background:#229ed9;color:#fff;border-color:transparent}';
  document.head.appendChild(css);

  var box = document.createElement('div');
  box.id = 'msDock';
  box.innerHTML = '<div class="msd-menu" id="msdMenu"></div><button type="button" class="msd-toggle" aria-label="Support">' + HEAD + '</button>';
  box.querySelector('.msd-toggle').onclick = function (e) { e.stopPropagation(); box.classList.toggle('open'); };
  document.addEventListener('click', function (e) { if (box.classList.contains('open') && !e.target.closest('#msDock')) box.classList.remove('open'); });
  function add() { document.body.appendChild(box); }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);

  function render(l) {
    var wa = l.whatsappEnabled !== false, tg = l.telegramEnabled !== false, h = '';
    var phone = String(l.adminPhone || l.whatsappNumber || '').replace(/\D/g, '');
    var waChat = l.whatsappChatLink || (phone ? 'https://wa.me/' + phone : '');
    var tgUser = String(l.telegramUsername || '').replace(/^@/, '');
    var tgChat = l.telegramLink || (tgUser ? 'https://t.me/' + tgUser : '');
    h += '<a href="/support" class="msd-item">' + BOT + ' Mizzy Sales Assistant</a>';
    if (wa && l.whatsappGroupLink) h += item(l.whatsappGroupLink, WA, 'Join Community');
    if (wa && l.whatsappChannelLink) h += item(l.whatsappChannelLink, WA, 'Join Channel');
    if (tg && tgChat) h += wa ? item(tgChat, TG, 'Telegram') : '<a href="' + esc(tgChat) + '" target="_blank" rel="noopener noreferrer" class="msd-item msd-tgp">' + TG + ' Contact on Telegram</a>';
    if (wa && waChat) h += item(waChat, WA, 'Contact Owner', true);
    document.getElementById('msdMenu').innerHTML = h;
    styleToggle(box.querySelector('.msd-toggle'), wa, tg && !wa);
  }
  links(render);
  window.addEventListener('focus', function () { links(render); });
})();
