/* Renders the Projects archive inline from content/projects/index.json.
   Each project is a short record: description, status, links, related work. */
(function () {
  "use strict";

  var root = document.getElementById("projects");
  if (!root) { return; }

  Promise.all([wbs.loadIndex("projects"), wbs.loadAllIndexes()]).then(function (res) {
    var projects = res[0];
    var all = res[1];

    if (!projects.length) {
      root.innerHTML = '<p class="empty-state">No projects recorded yet.</p>';
      return;
    }

    root.innerHTML = '<ul class="entry-list">' + projects.map(function (p) {
      var links = (p.links || []).map(function (l) {
        return '<a href="' + wbs.esc(l.url) + '"' +
          (/^https?:/i.test(l.url) ? ' rel="noopener"' : '') + '>' + wbs.esc(l.label) + '</a>';
      });
      var related = (p.related || []).map(function (ref) {
        var parts = String(ref).split("/");
        var list = all[parts[0]] || [];
        var found = list.filter(function (e) { return e.slug === parts[1]; })[0];
        if (!found) { return null; }
        return '<a href="' + wbs.esc(wbs.entryHref(parts[0], parts[1])) + '">' +
          wbs.esc(found.title) + '</a>';
      }).filter(Boolean);

      return '' +
        '<li class="entry-card" id="' + wbs.esc(p.slug) + '">' +
        '<h2 class="entry-card__title">' + wbs.esc(p.title) + '</h2>' +
        '<div class="entry-card__meta">' + wbs.statusTag(p.status) +
          (p.type ? '<span>' + wbs.esc(p.type) + '</span>' : '') + '</div>' +
        (p.description ? '<p class="entry-card__desc">' + wbs.esc(p.description) + '</p>' : '') +
        (links.length ? '<p class="meta-line">' + links.join(" &nbsp;·&nbsp; ") + '</p>' : '') +
        (related.length ? '<p class="meta-line">Related: ' + related.join(" &nbsp;·&nbsp; ") + '</p>' : '') +
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
