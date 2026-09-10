/* Renders the played-scene block on the Practice page from
   content/instruments/index.json. These are the pieces you don't read —
   you walk them. Markup: <div id="instruments"></div>  */
(function () {
  "use strict";

  var root = document.getElementById("instruments");
  if (!root || !window.wbs) { return; }
  var sigil = window.wbsSigil || function () { return ""; };

  var WALKED = {
    harmony: "last walk — harmony",
    point_won: "last walk — the point, won",
    peace_kept: "last walk — the peace, kept",
    broke: "last walk — it broke"
  };

  wbs.loadIndex("instruments").then(function (entries) {
    if (!entries.length) { root.hidden = true; return; }
    root.innerHTML =
      '<h2>Played scenes</h2>' +
      '<p class="muted" style="margin:-0.4rem 0 1.3rem;font-size:0.98rem">' +
      'Not read — walked. You act, the board shifts, the Dark Jester names it. ' +
      'You are dealt a different temperament each time.</p>' +
      entries.map(function (e) {
        var walked = "";
        try {
          var w = localStorage.getItem("wbs:instrument:" + e.slug);
          if (w && WALKED[w]) { walked = '<p class="instrument-card__walked">' + WALKED[w] + '</p>'; }
        } catch (err) { /* fine */ }
        return '<a class="instrument-card" href="' + wbs.esc(wbs.entryHref("instruments", e.slug, e)) + '">' +
          '<span class="instrument-card__tag">' + sigil("instrument") +
            (e.kind ? wbs.esc(e.kind) : "a played scene") +
            (e.instrument ? ' &nbsp;·&nbsp; ' + wbs.esc(e.instrument) : '') + '</span>' +
          '<h3>' + wbs.esc(e.title) + '</h3>' +
          (e.description ? '<p>' + wbs.esc(e.description) + '</p>' : '') +
          walked +
          '</a>';
      }).join("");
  }).catch(function () { root.hidden = true; });
})();
