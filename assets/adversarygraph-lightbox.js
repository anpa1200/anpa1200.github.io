(function () {
  var lastScrollY = 0;
  var openLightbox = null;

  function restoreScroll() {
    window.scrollTo(0, lastScrollY);
    window.requestAnimationFrame(function () {
      window.scrollTo(0, lastScrollY);
    });
  }

  function clearHashWithoutScroll() {
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    restoreScroll();
  }

  function closeLightbox() {
    if (!openLightbox) {
      return;
    }
    openLightbox.classList.remove("is-open");
    openLightbox.setAttribute("aria-hidden", "true");
    openLightbox = null;
    clearHashWithoutScroll();
  }

  function showLightbox(target) {
    if (!target) {
      return;
    }
    lastScrollY = window.scrollY || window.pageYOffset || 0;
    if (openLightbox && openLightbox !== target) {
      openLightbox.classList.remove("is-open");
      openLightbox.setAttribute("aria-hidden", "true");
    }
    openLightbox = target;
    target.classList.add("is-open");
    target.setAttribute("aria-hidden", "false");
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    restoreScroll();
  }

  document.querySelectorAll('a[href^="#lightbox-"]').forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      var id = trigger.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) {
        return;
      }
      event.preventDefault();
      showLightbox(target);
    });
  });

  document.querySelectorAll(".lightbox").forEach(function (lightbox) {
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.addEventListener("click", function (event) {
      event.preventDefault();
      closeLightbox();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });

  if (window.location.hash && window.location.hash.indexOf("#lightbox-") === 0) {
    var initialTarget = document.getElementById(window.location.hash.slice(1));
    if (initialTarget) {
      lastScrollY = window.scrollY || window.pageYOffset || 0;
      showLightbox(initialTarget);
    }
  }
})();
