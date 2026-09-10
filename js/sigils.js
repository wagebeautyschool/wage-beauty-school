/* Wage Beauty School — the school's notation.
   A small set of geometric sigils, injected once as an SVG sprite. Reference
   them with:  <svg class="sigil"><use href="#s-library"></use></svg>
   No JS: the sigils simply don't appear; every label still reads in words. */
(function () {
  "use strict";

  var S = {
    // the five rooms
    "s-library":
      '<path d="M12 6.2C10 5 6.5 4.6 4 5.4v13.2c2.5-.8 6-.4 8 .8 2-1.2 5.5-1.6 8-.8V5.4C17.5 4.6 14 5 12 6.2Z"/>' +
      '<path d="M12 6.2v13.2"/>',
    "s-practice":
      '<path d="M8 5 19 12 8 19Z"/>',
    "s-laboratory":
      '<path d="M9.5 3h5"/>' +
      '<path d="M10.5 3v6L5.4 17.4A2.4 2.4 0 0 0 7.5 21h9a2.4 2.4 0 0 0 2.1-3.6L13.5 9V3"/>' +
      '<path d="M7.9 14.5h8.2"/>',
    "s-projects":
      '<path d="M12 3 21 12 12 21 3 12Z"/>' +
      '<path d="M12 8.2 15.8 12 12 15.8 8.2 12Z"/>',
    "s-about":
      '<circle cx="12" cy="12" r="8.5"/>' +
      '<circle cx="12" cy="12" r="2"/>',
    // recurring
    "s-instrument":
      '<circle cx="9" cy="15" r="5"/>' +
      '<path d="M12.6 11.4 20 4"/>',
    "s-mark":
      '<path d="M12 3v18M3 12h18"/>'
  };

  var ns = "http://www.w3.org/2000/svg";
  var sprite = document.createElementNS(ns, "svg");
  sprite.setAttribute("aria-hidden", "true");
  sprite.setAttribute("width", "0");
  sprite.setAttribute("height", "0");
  sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";

  Object.keys(S).forEach(function (id) {
    var sym = document.createElementNS(ns, "symbol");
    sym.setAttribute("id", id);
    sym.setAttribute("viewBox", "0 0 24 24");
    sym.setAttribute("fill", "none");
    sym.setAttribute("stroke", "currentColor");
    sym.setAttribute("stroke-width", "1.5");
    sym.setAttribute("stroke-linecap", "round");
    sym.setAttribute("stroke-linejoin", "round");
    sym.innerHTML = S[id];
    sprite.appendChild(sym);
  });

  if (document.body) {
    document.body.insertBefore(sprite, document.body.firstChild);
  }

  // expose the id map for other scripts that build markup with sigils
  window.wbsSigil = function (name) {
    var id = "s-" + String(name || "").toLowerCase();
    return S[id] ? '<svg class="sigil" aria-hidden="true"><use href="#' + id + '"></use></svg>' : "";
  };
})();
