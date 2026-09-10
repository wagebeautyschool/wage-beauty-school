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
  var sigil = window.wbsSigil || function () { return ""; };

  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

  if (!cfg || !slug) {
    wbs.showError(root, "That document could not be found.");
    return;
  }

  wbs.loadAllIndexes().then(function (all) {
    var listForCol = all[collection] || [];
    var entry = listForCol.filter(function (e) { return e.slug === slug; })[0];
    if (!entry) {
      wbs.showError(root, "That document is not in the " + cfg.label + " catalogue.");
      return;
    }

    if (docSlug) {
      var doc = (entry.documents || []).filter(function (d) { return d.slug === docSlug; })[0];
      if (!doc || doc.hidden) {
        wbs.showError(root, "That document is being revised and is not available right now.");
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
    var num = entry.number || pad(listForCol.indexOf(entry) + 1);
    return wbs.loadMarkdown(collection, entry.file).then(function (md) {
      render(entry, md, all, num);
    });
  }).catch(function (err) {
    wbs.showError(root, err.message);
  });

  function setMeta(title, description) {
    document.title = title + " — Wage Beauty School";
    var mt = document.querySelector('meta[name="description"]');
    if (mt && description) { mt.setAttribute("content", description); }
  }

  // a one-line catalogue record: NUMBER · TYPE · STATUS · INSTRUMENT · DATE
  function record(entry) {
    var parts = [];
    if (entry.category) { parts.push(wbs.esc(entry.category)); }
    if (entry.type) { parts.push(wbs.esc(entry.type)); }
    if (entry.aspect) { parts.push(wbs.esc(entry.aspect)); }
    if (entry.instrument) { parts.push("Instrument: " + wbs.esc(entry.instrument)); }
    if (entry.date) { parts.push(wbs.esc(wbs.formatDate(entry.date))); }
    return '<p class="entry-record">' +
      (entry.status ? wbs.statusTag(entry.status) : "") +
      (parts.length ? '<span>' + parts.join(" &nbsp;·&nbsp; ") + '</span>' : "") +
      '</p>';
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
    var docs = (entry.documents || []).filter(function (d) { return !d.hidden; });
    if (!docs.length) { return ""; }
    var byAspect = {};
    var order = [];
    docs.forEach(function (d) {
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

  // Practice asks the visitor to do. Fold the Reflection behind a reveal so it
  // is sat with, not skimmed. Runs on the rendered prose.
  function foldReflection(proseEl) {
    var heads = proseEl.querySelectorAll("h2, h3");
    for (var i = 0; i < heads.length; i++) {
      if (!/^reflection\b/i.test(heads[i].textContent.trim())) { continue; }
      var h = heads[i];
      var wrap = document.createElement("div");
      wrap.className = "reveal__body";
      var moved = [];
      var sib = h.nextElementSibling;
      while (sib && !/^H[1-6]$/.test(sib.tagName)) {
        moved.push(sib);
        sib = sib.nextElementSibling;
      }
      moved.forEach(function (m) { wrap.appendChild(m); });

      var details = document.createElement("details");
      details.className = "reveal";
      var summary = document.createElement("summary");
      summary.textContent = "Reveal the reflection";
      details.appendChild(summary);
      details.appendChild(wrap);
      h.replaceWith(details);
      return;
    }
  }

  function frame(kickerHtml, backHtml, headHtml, proseHtml, tailHtml) {
    return backHtml +
      '<div class="entry-layout"><div class="entry-main">' +
      '<header class="entry-header">' + kickerHtml + headHtml + '</header>' +
      '<div class="prose">' + proseHtml + '</div>' +
      (tailHtml || "") +
      '</div></div>';
  }

  function render(entry, md, all, num) {
    var roomMark = collection.toUpperCase() + " " + num;
    var kicker = '<p class="kicker">' + sigil(collection) +
      '<span>' + wbs.esc(roomMark) + '</span></p>';
    var head =
      '<h1>' + wbs.esc(entry.title) + '</h1>' +
      (entry.description ? '<p class="lede">' + wbs.esc(entry.description) + '</p>' : '') +
      record(entry) + linksLine(entry);

    root.innerHTML = frame(
      kicker,
      '<a class="back-link" href="' + collection + '.html">Back to ' +
        wbs.esc(wbs.COLLECTIONS[collection].label) + '</a>',
      head,
      wbs.renderMarkdown(md),
      docList(entry) + relatedNav(entry.related, all)
    );

    if (collection === "practice") {
      var pr = root.querySelector(".prose");
      if (pr) { foldReflection(pr); }
    }
  }

  function renderDoc(entry, doc, md) {
    var source = doc.source
      ? '<p class="meta-line entry-header__links"><a href="content/projects/' +
        wbs.esc(doc.source) + '" rel="noopener">Read the original, designed edition (PDF)</a></p>'
      : "";
    var kicker = '<p class="kicker">' + sigil("projects") + '<span>' +
      wbs.esc(entry.title) + (doc.aspect ? " &nbsp;·&nbsp; " + wbs.esc(doc.aspect) : "") +
      '</span></p>';
    var head =
      '<h1>' + wbs.esc(doc.title) + '</h1>' +
      (doc.description ? '<p class="lede">' + wbs.esc(doc.description) + '</p>' : '') +
      record(doc) + source;

    root.innerHTML = frame(
      kicker,
      '<a class="back-link" href="entry.html?c=projects&id=' + wbs.esc(entry.slug) +
        '">Back to ' + wbs.esc(entry.title) + '</a>',
      head,
      wbs.renderMarkdown(md),
      ""
    );
  }
})();
