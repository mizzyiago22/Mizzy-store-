// Mizzy Sales: one dropdown style for every page. Each <select> inside .mzp becomes a themed button
// that opens a bottom sheet. The real <select> stays in the page (hidden), so the page's own code keeps working.
(function () {
  if (window.__mzSelect) return; window.__mzSelect = true;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function titleFor(sel) {
    var l = sel.id && document.querySelector('label[for="' + sel.id + '"]');
    return l ? l.textContent.replace(/^\s*Step\s*\d+\s*[—-]\s*/i, '').trim() : 'Choose an option';
  }
  function labelFor(sel) { var o = sel.options[sel.selectedIndex]; return (o && o.text.trim()) || 'Choose…'; }
  function sheet() {
    var s = document.getElementById('mzsSheet');
    if (s) return s;
    s = document.createElement('div'); s.id = 'mzsSheet'; s.className = 'mzs-sheet';
    s.innerHTML = '<div class="mzs-panel" role="dialog" aria-modal="true"><div class="mzs-head"></div><input class="mzs-search" type="search" placeholder="Search" aria-label="Search"><div class="mzs-list"></div><button type="button" class="mzs-close">Close</button></div>';
    s.addEventListener('click', function (e) { if (e.target === s) close(); });
    s.querySelector('.mzs-close').addEventListener('click', close);
    document.body.appendChild(s);
    return s;
  }
  function close() { var s = document.getElementById('mzsSheet'); if (s) s.classList.remove('show'); }
  function render(sel, filter) {
    var s = sheet(), list = s.querySelector('.mzs-list'), q = (filter || '').toLowerCase(), html = '';
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i], t = o.text.trim();
      if (!o.value && i === 0) continue;          // skip the "Choose…" placeholder row
      if (q && t.toLowerCase().indexOf(q) === -1) continue;
      html += '<div class="mzs-opt' + (o.selected ? ' sel' : '') + (o.disabled ? ' dis' : '') + '" data-i="' + i + '"><span>' + esc(t) + '</span><span class="mzs-dot"></span></div>';
    }
    list.innerHTML = html || '<div class="mzs-opt dis"><span>Nothing to choose</span></div>';
  }
  function sync(sel) {
    var b = sel._mzsBtn; if (!b) return;
    var lab = b.querySelector('.mzs-label'), t = labelFor(sel);
    if (lab.textContent !== t) lab.textContent = t;          // write only on change, so the observer does not loop
    if (b.disabled !== !!sel.disabled) b.disabled = !!sel.disabled;
  }
  function enhance(sel) {
    if (sel.getAttribute('data-mzs')) { sync(sel); return; }
    sel.setAttribute('data-mzs', '1'); sel.classList.add('mzs-native'); sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mzs-btn';
    b.innerHTML = '<span class="mzs-label"></span>';
    sel.parentNode.insertBefore(b, sel);
    sel._mzsBtn = b;
    b.addEventListener('click', function () {
      if (b.disabled) return;
      var s = sheet(), search = s.querySelector('.mzs-search');
      s.querySelector('.mzs-head').textContent = titleFor(sel);
      search.value = ''; search.oninput = function () { render(sel, search.value); };
      render(sel, '');
      s.querySelector('.mzs-list').onclick = function (e) {
        var row = e.target.closest('.mzs-opt'); if (!row || row.dataset.i === undefined) return;
        var idx = +row.dataset.i; if (sel.options[idx].disabled) return;
        sel.selectedIndex = idx; sel.dispatchEvent(new Event('change', { bubbles: true }));
        sync(sel); close();
      };
      s.classList.add('show');
    });
    sel.addEventListener('change', function () { sync(sel); });
    sync(sel);
  }
  function scan() { document.querySelectorAll('.mzp select').forEach(enhance); }
  function init() {
    scan();
    new MutationObserver(function () { scan(); }).observe(document.body, { childList: true, subtree: true });
    setInterval(function () { document.querySelectorAll('select[data-mzs]').forEach(sync); }, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
