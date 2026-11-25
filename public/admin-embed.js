/* Runs first inside every embedded admin section.
   Goal: once the admin has unlocked the panel, NO section ever asks for the passcode again.
   - always sends the admin's current login with every /api/admin request
   - a section can never wipe the saved login
   - only shows "session ended" when the server really rejects the passcode;
     any other problem (server error, missing route, network) shows a normal error with Retry */
(function () {
  var KEY = 'ksl_admin_pass', KEY_STAFF = 'ksl_staff_token';
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  var origRemove = null;

  try { document.documentElement.setAttribute('data-theme', 'dark'); } catch (e) {}

  /* make sure this frame can see the admin login (same tab storage; copy from parent as a fallback) */
  try {
    if (window.parent && window.parent !== window) {
      [KEY, KEY_STAFF].forEach(function (k) {
        try {
          if (!sessionStorage.getItem(k)) {
            var v = window.parent.sessionStorage.getItem(k);
            if (v) sessionStorage.setItem(k, v);
          }
        } catch (e) {}
      });
    }
  } catch (e) {}

  var memPass = '', memStaff = '';
  /* the admin page sends its login here (see sendAdminAuthTo in admin.html) */
  window.addEventListener('message', function (e) {
    try {
      if (!window.parent || e.source !== window.parent || e.origin !== location.origin) return;
      var d = e.data; if (!d || d.type !== 'ksl-admin-auth') return;
      var had = !!(memPass || memStaff || sessionStorage.getItem(KEY) || sessionStorage.getItem(KEY_STAFF));
      if (d.pass) { memPass = d.pass; try { sessionStorage.setItem(KEY, d.pass); } catch (x) {} }
      if (d.staff) { memStaff = d.staff; try { sessionStorage.setItem(KEY_STAFF, JSON.stringify({ token: d.staff, account: d.account || null })); } catch (x) {} }
      /* the section loaded before the login arrived: start it again, now with the login in place */
      if (!had && (memPass || memStaff)) location.reload();
    } catch (x) {}
  });

  function cred() {
    if (memPass || memStaff) return { pass: memPass, staff: memStaff };
    var pass = '', staff = '';
    try { pass = sessionStorage.getItem(KEY) || ''; } catch (e) {}
    if (!pass) {
      try { var s = JSON.parse(sessionStorage.getItem(KEY_STAFF) || 'null'); staff = (s && s.token) || ''; } catch (e) {}
    }
    return { pass: pass, staff: staff };
  }

  /* never let a section delete the saved admin login */
  try {
    origRemove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (k) {
      if ((k === KEY || k === KEY_STAFF) && this === window.sessionStorage) return;
      return origRemove.apply(this, arguments);
    };
  } catch (e) {}

  /* always attach the live admin login to admin API calls */
  if (origFetch) {
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (/\/api\/admin(\/|\?|$)/.test(url)) {
          var c = cred();
          init = init || {};
          var h = new Headers(init.headers || (typeof input !== 'string' && input && input.headers) || {});
          if (c.pass) h.set('x-admin-passcode', c.pass);
          else if (c.staff && !h.get('Authorization')) h.set('Authorization', 'Bearer ' + c.staff);
          init.headers = h;
        }
      } catch (e) {}
      return origFetch(input, init);
    };
  }

  function boxEl() {
    var box = document.getElementById('admExpired');
    if (!box) {
      box = document.createElement('div'); box.id = 'admExpired';
      box.innerHTML = '<b id="admExpiredTitle"></b><span id="admExpiredMsg"></span><br><button type="button" id="admExpiredBtn"></button>';
      document.body.insertBefore(box, document.body.firstChild);
    }
    return box;
  }
  function paint(kind, msg) {
    var box = boxEl();
    var title = document.getElementById('admExpiredTitle');
    var text = document.getElementById('admExpiredMsg');
    var btn = document.getElementById('admExpiredBtn');
    if (kind === 'expired') {
      title.textContent = 'Your admin session has ended';
      text.textContent = 'Please log in to the admin panel again.';
      btn.textContent = 'Log in again';
      btn.onclick = function () {
        try { origRemove.call(window.sessionStorage, KEY); origRemove.call(window.sessionStorage, KEY_STAFF); } catch (e) {}
        try { (window.parent && window.parent !== window ? window.parent : window).location.reload(); } catch (e) { location.reload(); }
      };
    } else {
      title.textContent = 'Could not load this section';
      text.textContent = msg ? String(msg) : 'Something went wrong. Your admin login is still active.';
      btn.textContent = 'Try again';
      btn.onclick = function () { location.reload(); };
    }
    box.style.display = 'block';
    var app = document.getElementById('app'); if (app) app.style.display = 'none';
  }

  /* called by the section pages whenever a load fails */
  window.__admExpired = function (msg) {
    var c = cred();
    if (!c.pass && !c.staff) {                                    // nothing here yet: ask the admin page for the login
      try { window.parent.postMessage({ type: 'ksl-admin-need-auth' }, location.origin); } catch (x) {}
      setTimeout(function () { var c2 = cred(); if (!c2.pass && !c2.staff) paint('expired'); }, 1500);
      return;
    }
    if (!c.pass) return paint('error', msg);                      // staff login: never claim "expired" from here
    if (!origFetch) return paint('error', msg);
    origFetch('/api/admin/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: c.pass })
    }).then(function (r) {
      if (r.status === 403) paint('expired');                      // server really rejects the passcode
      else paint('error', msg);                                    // passcode is fine, so the problem is something else
    })
      .catch(function () { paint('error', msg); });
  };
})();
