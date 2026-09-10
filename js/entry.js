/* Renders a single entry (a Library document, a Practice exercise, or a
   Laboratory experiment). Reads ?c=<collection>&id=<slug> from the URL. */
(function () {
  "use strict";

  var root = document.getElementById("entry");
  if (!root) { return; }

  var params = new URLSearchParams(window.location.search);
  var collection = params.get("c");
  var slug = params.get("id");
  var cfg = wbs.COLLECTIONS[collection];

  if (!cfg || !slug || collection === "projects") {
    wbs.showError(root, "That document could not be found.");
    return;
  }

  Promise.all([wbs.loadAllIndexes(), null]).then(function (res) {
    var all = res[0];
    var entry = (all[collection] || []).filter(function (e) { return e.slug === slug; })[0];
    if (!entry) {
      wbs.showError(root, "That document is not in the " + cfg.label + " catalogue.");
      return;
    }
    document.title = entry.title + " — Wage Beauty School";
    var mt = document.querySelector('meta[name="description"]');
    if (mt && entry.description) { mt.setAttribute("content", entry.description); }

    return wbs.loadMarkdown(collection, entry.file).then(function (md) {
      render(entry, md, all);
    });
  }).catch(function (err) {
    wbs.showError(root, err.message);
  });

  function resolveRelated(refs, all) {
    if (!refs || !refs.length) { return []; }
    return refs.map(function (ref) {
      var parts = String(ref).split("/");
      var col = parts[0], s = parts[1];
      var list = all[col] || [];
      var found = list.filter(function (e) { return e.slug === s; })[0];
      if (!found) { return null; }
      return {
        href: wbs.entryHref(col, s),
        title: found.title,
        where: (wbs.COLLECTIONS[col] || {}).label || col
      };
    }).filter(Boolean);
  }

  function render(entry, md, all) {
    var dl = [];
    if (entry.category) { dl.push(["Category", entry.category]); }
    if (entry.type) { dl.push(["Type", entry.type]); }
    if (entry.status) { dl.push(["Status", entry.status]); }
    if (entry.date) { dl.push(["Dated", wbs.formatDate(entry.date)]); }

    var related = resolveRelated(entry.related, all);

    root.innerHTML = '' +
      '<a class="back-link" href="' + collection + '.html">Back to the ' +
        wbs.esc(wbs.COLLECTIONS[collection].label) + '</a>' +
      '<header class="entry-header">' +
        '<p class="kicker">' + wbs.esc(wbs.COLLECTIONS[collection].label) + '</p>' +
        '<h1>' + wbs.esc(entry.title) + '</h1>' +
        (entry.description ? '<p class="lede">' + wbs.esc(entry.description) + '</p>' : '') +
        '<dl class="dl">' + dl.map(function (row) {
          return '<dt>' + wbs.esc(row[0]) + '</dt><dd>' + wbs.esc(row[1]) + '</dd>';
        }).join("") + '</dl>' +
      '</header>' +
      '<div class="prose">' + wbs.renderMarkdown(md) + '</div>' +
      (related.length ? (
        '<nav class="related" aria-label="Related material">' +
        '<h2>Related material</h2><ul>' +
        related.map(function (r) {
          return '<li><a href="' + wbs.esc(r.href) + '">' + wbs.esc(r.title) +
            '</a><span class="related__where">' + wbs.esc(r.where) + '</span></li>';
        }).join("") +
        '</ul></nav>'
      ) : "");
  }
})();
