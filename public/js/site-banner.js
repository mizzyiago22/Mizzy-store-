/* The welcome pop-up now lives in /js/welcome-popup.js (own admin settings, separate from contact methods).
   This file only loads it, so every page that already includes site-banner.js keeps working. */
(function () {
  window.msApplyBanner = window.msApplyBanner || function () {};
  if (document.getElementById('msWpLoader')) return;
  var s = document.createElement('script'); s.id = 'msWpLoader'; s.src = '/js/welcome-popup.js?v=1'; s.defer = true;
  document.head.appendChild(s);
})();
