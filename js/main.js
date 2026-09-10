/* Wage Beauty School — shared behaviour.
   Progressive enhancement only. The site reads and navigates fine with
   JS disabled; this file adds the compact mobile menu and the year. */
(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  var y = document.querySelector("[data-year]");
  if (y) { y.textContent = String(new Date().getFullYear()); }
})();
