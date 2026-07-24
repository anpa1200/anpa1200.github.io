(function applyStoredTheme() {
  let theme = 'dark';
  try {
    theme = localStorage.getItem('theme') || theme;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
  document.documentElement.setAttribute('data-theme', theme);
}());
