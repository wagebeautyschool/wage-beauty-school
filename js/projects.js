/* Renders the Projects archive inline from content/projects/index.json.
   Each project reads like an artifact record: number, status, instruments,
   purpose, links, related work. Provenance, not a portfolio. */
(function () {
  "use strict";

  var root = document.getElementById("projects");
  if (!root) { return; }

  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

  Promise.all([wbs.loadIndex("projects"), wbs.loadAllIndexes()]).then(function (res) {
    var projects = res[0];
    var all = res[1];

    if (!projects.length) {
      root.innerHTML = '<p class="empty-state">No projects recorded yet.</p>';
      return;
    }

    root.innerHTML = '<ul class="entry-list">' + projects.map(function (p, i) {
      var num = p.number || pad(i + 1);
      var links = (p.links || []).map(function (l) {
        return '<a href="' + wbs.esc(l.url) + '"' +
          (/^https?:/i.test(l.url) ? ' rel="noopener"' : '') + '>' + wbs.esc(l.label) + '</a>';
      });
      var docCount = (p.documents || []).length;
      var related = (p.related || []).map(function (ref) {
        var parts = String(ref).split("/");
        var found = (all[parts[0]] || []).filter(function (e) { return e.slug === parts[1]; })[0];
        if (!found) { return null; }
        return '<a href="' + wbs.esc(wbs.entryHref(parts[0], parts[1], found)) + '">' +
          wbs.esc(found.title) + '</a>';
      }).filter(Boolean);

      var titleHtml = p.file
        ? '<a class="entry-card__link" href="' + wbs.esc(wbs.entryHref("projects", p.slug, p)) +
            '"><h2 class="entry-card__title">' + wbs.esc(p.title) + '</h2></a>'
        : '<h2 class="entry-card__title">' + wbs.esc(p.title) + '</h2>';

      var meta = [];
      if (p.type) { meta.push(wbs.esc(p.type)); }
      if (p.instruments) { meta.push("Instruments: " + wbs.esc(p.instruments)); }
      if (docCount) { meta.push(docCount + (docCount === 1 ? " document" : " documents")); }

      return '' +
        '<li class="entry-card" id="' + wbs.esc(p.slug) + '">' +
        '<div class="entry-card__body">' +
        '<span class="entry-card__num"><b>PROJECT ' + wbs.esc(num) + '</b></span>' +
        titleHtml +
        (p.description ? '<p class="entry-card__desc">' + wbs.esc(p.description) + '</p>' : '') +
        '<div class="entry-card__meta">' + wbs.statusTag(p.status) +
          (meta.length ? '<span>' + meta.join(" &nbsp;·&nbsp; ") + '</span>' : '') + '</div>' +
        (links.length ? '<p class="meta-line">' + links.join(" &nbsp;·&nbsp; ") + '</p>' : '') +
        (p.file ? '<p class="meta-line"><a href="' +
          wbs.esc(wbs.entryHref("projects", p.slug, p)) + '">' +
          wbs.esc(p.pageLabel || "Open the project page") + ' &rarr;</a></p>' : '') +
        (related.length ? '<p class="meta-line">Related: ' + related.join(" &nbsp;·&nbsp; ") + '</p>' : '') +
        '</div>' +
        '</li>';
    }).join("") + '</ul>';

    if (window.location.hash) {
      var el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (el) { el.scrollIntoView(); }
    }
  }).catch(function (err) {
    wbs.showError(root, err.message);
  });
})();
