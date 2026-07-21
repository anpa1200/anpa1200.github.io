(function () {
  'use strict';

  function labelWorkspaceSearch() {
    document.querySelectorAll('button[aria-label="Search actors, techniques, and reports"]').forEach(function (button) {
      button.setAttribute('aria-label', 'Search this workspace');
      button.setAttribute('title', 'Search this workspace');
    });
    document.querySelectorAll('[role="dialog"][aria-label="Global intelligence search"]').forEach(function (dialog) {
      dialog.setAttribute('aria-label', 'Search this workspace');
      const input = dialog.querySelector('input[type="search"], input');
      if (input) input.setAttribute('aria-label', 'Search this workspace');
    });
  }

  labelWorkspaceSearch();
  new MutationObserver(labelWorkspaceSearch).observe(document.getElementById('root'), {
    childList: true,
    subtree: true,
  });
})();
