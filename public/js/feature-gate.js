// Removes the customer links, cards, menu items and buttons of every feature the admin
// has switched off (Admin → Features), so they disappear from the site completely.
// The server already blocks the pages and APIs; this only makes the menus and hub cards
// vanish. Any failure here is silent, so a page never breaks because of it.
//
// Hiding rules, in order:
//  1. Any link (a[href]) that points at one of the off features' pages.
//  2. Any element marked data-feature="<feature key>" (e.g. a tab button).
//  3. The shared Boost hub (/boost) disappears only when BOTH boosting sections are off.
(function () {
  var offKeys = [];
  var offPaths = [];
  var hubRules = { '/boost': ['boost-1', 'boost-2'] };

  function under(path, base) { return path === base || path.indexOf(base + '/') === 0; }

  function hideEl(el) {
    el.style.display = 'none';
    var li = el.closest ? el.closest('li') : null;
    if (li) li.style.display = 'none';
  }

  function isOff(key) { return offKeys.indexOf(key) !== -1; }

  function hideAll() {
    if (!offKeys.length) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var path;
      try { path = new URL(a.getAttribute('href'), location.origin).pathname; } catch (e) { continue; }
      if (offPaths.some(function (p) { return under(path, p); })) hideEl(a);
    }
    offKeys.forEach(function (k) {
      var nodes = document.querySelectorAll('[data-feature="' + k + '"]');
      for (var j = 0; j < nodes.length; j++) hideEl(nodes[j]);
    });
    Object.keys(hubRules).forEach(function (hub) {
      var needed = hubRules[hub];
      if (needed.every(isOff)) {
        var hubLinks = document.querySelectorAll('a[href]');
        for (var h = 0; h < hubLinks.length; h++) {
          var hp;
          try { hp = new URL(hubLinks[h].getAttribute('href'), location.origin).pathname; } catch (e) { continue; }
          if (under(hp, hub)) hideEl(hubLinks[h]);
        }
      }
    });
  }

  function start(data) {
    var off = (data && data.disabled) || [];
    var pages = (data && data.pages) || {};
    offKeys = off.slice();
    off.forEach(function (k) { (pages[k] || []).forEach(function (p) { offPaths.push(p); }); });
    if (!offKeys.length) return;
    hideAll();
    var timer = null;
    try {
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(hideAll, 150);
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
