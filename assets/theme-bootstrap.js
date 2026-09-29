(function applyStoredTheme() {
  let theme = 'light';
  try {
    theme = localStorage.getItem('theme') || theme;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
  document.documentElement.setAttribute('data-theme', theme);
}());

// Event delegation works even when a print button appears after this head script.
// It avoids CSP-blocked inline onclick attributes on course and CV pages.
document.addEventListener('click', function (event) {
  if (event.target?.closest?.('[data-print-page]')) window.print();
});
