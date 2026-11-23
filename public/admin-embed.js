/* Runs first inside every embedded admin section: reuse the admin's existing login, never ask again. */
(function () {
  var KEY = 'ksl_admin_pass';
  try {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (!sessionStorage.getItem(KEY) && window.parent && window.parent !== window) {
      var p = '';
      try { p = window.parent.adminPass || window.parent.sessionStorage.getItem(KEY) || ''; } catch (e) {}
      if (p) sessionStorage.setItem(KEY, p);
    }
  } catch (e) {}
  window.__admExpired = function (msg) {
    var box = document.getElementById('admExpired');
    if (!box) {
      box = document.createElement('div'); box.id = 'admExpired';
      box.innerHTML = '<b>Your admin session has ended</b><span id="admExpiredMsg">Please log in to the admin panel again.</span><br><button type="button" id="admExpiredBtn">Log in again</button>';
      document.body.insertBefore(box, document.body.firstChild);
      document.getElementById('admExpiredBtn').onclick = function () {
        try { sessionStorage.removeItem(KEY); } catch (e) {}
        try { (window.parent && window.parent !== window ? window.parent : window).location.reload(); } catch (e) { location.reload(); }
      };
    }
    if (msg && !/wrong passcode/i.test(msg)) document.getElementById('admExpiredMsg').textContent = msg;
    box.style.display = 'block';
    var app = document.getElementById('app'); if (app) app.style.display = 'none';
  };
})();
