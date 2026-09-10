/* Renders a single entry: a Library document, a Practice exercise, a
   Laboratory experiment, a Project with its own page, or one document
   belonging to a project (e.g. a Shorigan tome).

   URL: ?c=<collection>&id=<slug>            → the entry
        ?c=projects&id=<slug>&doc=<docSlug>  → one of that project's documents */
(function () {
  "use strict";

  var root = document.getElementById("entry");
  if (!root) { return; }

  var params = new URLSearchParams(window.location.search);
  var collection = params.get("c");
  var slug = params.get("id");
  var docSlug = params.get("doc");
  var cfg = wbs.COLLECTIONS[collection];

  if (!cfg || !slug) {
    wbs.showError(root, "That document could not be found.");
    return;
  }

  wbs.loadAllIndexes().then(function (all) {
    var entry = (all[collection] || []).filter(function (e) { return e.slug === slug; })[0];
    if (!entry) {
      wbs.showError(root, "That document is not in the " + cfg.label + " catalogue.");
      return;
    }

    if (docSlug) {
      var doc = (entry.documents || []).filter(function (d) { return d.slug === docSlug; })[0];
      if (!doc) {
        wbs.showError(root, "That document is not part of " + entry.title + ".");
        return;
      }
      setMeta(doc.title, doc.description);
      return wbs.loadMarkdown("projects", doc.file).then(function (md) {
        renderDoc(entry, doc, md);
      });
    }

    if (collection === "projects" && !entry.file) {
      window.location.replace("projects.html#" + encodeURIComponent(slug));
      return;
    }

    setMeta(entry.title, entry.description);
    return wbs.loadMarkdown(collection, entry.file).then(function (md) {
      render(entry, md, all);
    });
  }).catch(function (err) {
    wbs.showError(root, err.message);
  });

  function setMeta(title, description) {
    document.title = title + " — Wage Beauty School";
    var mt = document.querySelector('meta[name="description"]');
    if (mt && description) { mt.setAttribute("content", description); }
  }

  function dl(entry) {
    var rows = [];
    if (entry.category) { rows.push(["Category", entry.category]); }
    if (entry.type) { rows.push(["Type", entry.type]); }
    if (entry.aspect) { rows.push(["Aspect", entry.aspect]); }
    if (entry.status) { rows.push(["Status", entry.status]); }
    if (entry.date) { rows.push(["Dated", wbs.formatDate(entry.date)]); }
    return '<dl class="dl">' + rows.map(function (r) {
      return '<dt>' + wbs.esc(r[0]) + '</dt><dd>' + wbs.esc(r[1]) + '</dd>';
    }).join("") + '</dl>';
  }

  function linksLine(entry) {
    var links = (entry.links || []).map(function (l) {
      var ext = /^https?:/i.test(l.url);
      return '<a href="' + wbs.esc(l.url) + '"' + (ext ? ' rel="noopener"' : '') +
        '>' + wbs.esc(l.label) + '</a>';
    });
    return links.length
      ? '<p class="meta-line entry-header__links">' + links.join(" &nbsp;·&nbsp; ") + '</p>'
      : "";
  }

  function resolveRelated(refs, all) {
    if (!refs || !refs.length) { return []; }
    return refs.map(function (ref) {
      var parts = String(ref).split("/");
      var col = parts[0], s = parts[1];
      var found = (all[col] || []).filter(function (e) { return e.slug === s; })[0];
      if (!found) { return null; }
      return {
        href: wbs.entryHref(col, s, found),
        title: found.title,
        where: (wbs.COLLECTIONS[col] || {}).label || col
      };
    }).filter(Boolean);
  }

  function relatedNav(refs, all) {
    var related = resolveRelated(refs, all);
    if (!related.length) { return ""; }
    return '<nav class="related" aria-label="Related material">' +
      '<h2>Related material</h2><ul>' +
      related.map(function (r) {
        return '<li><a href="' + wbs.esc(r.href) + '">' + wbs.esc(r.title) +
          '</a><span class="related__where">' + wbs.esc(r.where) + '</span></li>';
      }).join("") + '</ul></nav>';
  }

  function docList(entry) {
    if (!entry.documents || !entry.documents.length) { return ""; }
    var byAspect = {};
    var order = [];
    entry.documents.forEach(function (d) {
      var a = d.aspect || "Documents";
      if (!byAspect[a]) { byAspect[a] = []; order.push(a); }
      byAspect[a].push(d);
    });
    return '<nav class="doc-list" aria-label="' + wbs.esc(entry.title) + ' documents">' +
      '<h2>Documents</h2>' +
      order.map(function (a) {
        return '<h3>' + wbs.esc(a) + '</h3><ul>' + byAspect[a].map(function (d) {
          return '<li><a class="doc-list__link" href="entry.html?c=projects&id=' +
            wbs.esc(entry.slug) + '&doc=' + wbs.esc(d.slug) + '">' +
            '<span class="doc-list__title">' + wbs.esc(d.title) + '</span>' +
            (d.description ? '<span class="doc-list__desc">' + wbs.esc(d.description) + '</span>' : '') +
            '</a></li>';
        }).join("") + '</ul>';
      }).join("") + '</nav>';
  }

  function render(entry, md, all) {
    root.innerHTML =
      '<a class="back-link" href="' + collection + '.html">Back to the ' +
        wbs.esc(wbs.COLLECTIONS[collection].label) + '</a>' +
      '<header class="entry-header">' +
        '<p class="kicker">' + wbs.esc(wbs.COLLECTIONS[collection].label) + '</p>' +
        '<h1>' + wbs.esc(entry.title) + '</h1>' +
        (entry.description ? '<p class="lede">' + wbs.esc(entry.description) + '</p>' : '') +
        dl(entry) + linksLine(entry) +
      '</header>' +
      '<div class="prose">' + wbs.renderMarkdown(md) + '</div>' +
      docList(entry) +
      relatedNav(entry.related, all);
  }

  function renderDoc(entry, doc, md) {
    var source = doc.source
      ? '<p class="meta-line entry-header__links"><a href="content/projects/' +
        wbs.esc(doc.source) + '" rel="noopener">Read the original, designed edition (PDF)</a></p>'
      : "";
    root.innerHTML =
      '<a class="back-link" href="entry.html?c=projects&id=' + wbs.esc(entry.slug) +
        '">Back to ' + wbs.esc(entry.title) + '</a>' +
      '<header class="entry-header">' +
        '<p class="kicker">' + wbs.esc(entry.title) +
          (doc.aspect ? ' &nbsp;·&nbsp; ' + wbs.esc(doc.aspect) : '') + '</p>' +
        '<h1>' + wbs.esc(doc.title) + '</h1>' +
        (doc.description ? '<p class="lede">' + wbs.esc(doc.description) + '</p>' : '') +
        dl(doc) + source +
      '</header>' +
      '<div class="prose">' + wbs.renderMarkdown(md) + '</div>';
  }
})();
