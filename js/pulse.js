/* Wage Beauty School — signs that the institution is ongoing.
   Every number here is counted from the content that actually exists in
   /content. Nothing is invented. Fills any of these if present on the page:

     [data-count="library|practice|laboratory|projects"]   → a count
     [data-lab-active]                                      → active experiments
     [data-pulse]                                           → a one-line census
     [data-recent] (with [data-recent-title] / -link)       → the newest entry
*/
(function () {
  "use strict";

  if (!window.wbs || !document.querySelector(
    "[data-count],[data-pulse],[data-recent],[data-lab-active]")) { return; }

  var DORMANT = /^(archived|abandoned)$/i;

  wbs.loadAllIndexes().then(function (all) {
    var n = {
      library: (all.library || []).length,
      practice: (all.practice || []).length,
      laboratory: (all.laboratory || []).length,
      projects: (all.projects || []).length
    };
    var labActive = (all.laboratory || []).filter(function (e) {
      return !DORMANT.test(e.status || "");
    }).length;

    document.querySelectorAll("[data-count]").forEach(function (el) {
      var k = el.getAttribute("data-count");
      if (n[k] != null) { el.textContent = String(n[k]); }
    });
    document.querySelectorAll("[data-lab-active]").forEach(function (el) {
      el.textContent = String(labActive);
    });

    // one-line census
    var census = document.querySelector("[data-pulse]");
    if (census) {
      census.innerHTML =
        '<span><b>' + n.library + '</b> texts</span>' +
        '<span><b>' + n.practice + '</b> exercises</span>' +
        '<span><b>' + n.laboratory + '</b> experiments</span>' +
        '<span><b>' + n.projects + '</b> projects</span>';
    }

    // newest dated entry across the reading rooms
    var recent = document.querySelector("[data-recent]");
    if (recent) {
      var pool = [];
      ["library", "practice", "laboratory"].forEach(function (col) {
        (all[col] || []).forEach(function (e) {
          if (e.date) { pool.push({ col: col, e: e }); }
        });
      });
      pool.sort(function (a, b) { return (b.e.date || "").localeCompare(a.e.date || ""); });
      if (pool.length) {
        var top = pool[0];
        var label = { library: "Library", practice: "Practice", laboratory: "Laboratory" }[top.col];
        var tEl = recent.querySelector("[data-recent-title]") || recent;
        tEl.innerHTML = '<a href="' + wbs.esc(wbs.entryHref(top.col, top.e.slug, top.e)) + '">' +
          wbs.esc(top.e.title) + '</a>';
        var wEl = recent.querySelector("[data-recent-where]");
        if (wEl) { wEl.textContent = label; }
      }
    }
  }).catch(function () { /* counts are an enhancement; fail quietly */ });
})();
