/* Wage Beauty School — shared behaviour.
   Progressive enhancement only. The site reads and navigates fine with JS
   disabled; this file only adds the compact mobile menu and closes it when
   a link inside it is chosen. */
(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!toggle || !nav) { return; }

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("is-open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) { setOpen(false); }
  });
})();
