// Hides the customer links of features the admin has switched off (Admin → Features).
// The server already blocks their pages and APIs; this only keeps the menus and
// hub cards clean. Any failure here is silent, so a page never breaks because of it.
(function () {
  var pages = {};
  var offPaths = [];

  function under(path, base) { return path === base || path.indexOf(base + '/') === 0; }

  function hideLinks() {
    if (!offPaths.length) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var path;
      try { path = new URL(a.getAttribute('href'), location.origin).pathname; } catch (e) { continue; }
      var hit = offPaths.some(function (p) { return under(path, p); });
      if (!hit) continue;
      a.style.display = 'none';
      var li = a.closest ? a.closest('li') : null;
      if (li) li.style.display = 'none';
    }
  }

  function start(data) {
    var off = (data && data.disabled) || [];
    pages = (data && data.pages) || {};
    off.forEach(function (k) { (pages[k] || []).forEach(function (p) { offPaths.push(p); }); });
    if (!offPaths.length) return;
    hideLinks();
    var timer = null;
    try {
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(hideLinks, 150);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  try {
    fetch('/api/features', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(start)
      .catch(function () {});
  } catch (e) {}
})();
