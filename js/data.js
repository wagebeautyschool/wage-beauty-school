/* Wage Beauty School — content loader and shared render helpers.
   The Library, Practice, and Laboratory are each a folder under /content
   with an index.json manifest and one Markdown file per entry.
   Projects is a single manifest, rendered inline.

   To add an entry: drop a .md file in the folder and add a block to
   index.json. Nothing here needs to change. */
(function () {
  "use strict";

  var COLLECTIONS = {
    library:    { label: "Library",    base: "content/library" },
    practice:   { label: "Practice",   base: "content/practice" },
    laboratory: { label: "Laboratory", base: "content/laboratory" },
    projects:   { label: "Projects",   base: "content/projects" }
  };

  var _indexCache = {};

  function loadIndex(name) {
    if (_indexCache[name]) { return _indexCache[name]; }
    var cfg = COLLECTIONS[name];
    if (!cfg) { return Promise.reject(new Error("Unknown collection: " + name)); }
    _indexCache[name] = fetch(cfg.base + "/index.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) { throw new Error("Could not load " + name + " index (" + r.status + ")"); }
        return r.json();
      })
      .then(function (data) { return data.entries || []; });
    return _indexCache[name];
  }

  function loadAllIndexes() {
    var names = Object.keys(COLLECTIONS);
    return Promise.all(names.map(function (n) {
      return loadIndex(n).then(function (entries) { return [n, entries]; });
    })).then(function (pairs) {
      var out = {};
      pairs.forEach(function (p) { out[p[0]] = p[1]; });
      return out;
    });
  }

  function loadMarkdown(collection, file) {
    var cfg = COLLECTIONS[collection];
    return fetch(cfg.base + "/" + file, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) { throw new Error("Could not load document (" + r.status + ")"); }
      return r.text();
    });
  }

  // --- helpers ---
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    if (!iso) { return ""; }
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) { return iso; }
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  }

  function statusTag(status) {
    if (!status) { return ""; }
    var strong = /^(established|functional)$/i.test(status);
    return '<span class="tag' + (strong ? " tag--accent" : "") + '">' + esc(status) + "</span>";
  }

  // A project links to its own page only when it has a body file (e.g. a
  // development log); otherwise it is just an anchor on the Projects index.
  function entryHref(collection, slug, entry) {
    if (collection === "projects") {
      return (entry && entry.file)
        ? "entry.html?c=projects&id=" + encodeURIComponent(slug)
        : "projects.html#" + encodeURIComponent(slug);
    }
    return "entry.html?c=" + encodeURIComponent(collection) + "&id=" + encodeURIComponent(slug);
  }

  function renderMarkdown(md) {
    if (window.marked && typeof window.marked.parse === "function") {
      return window.marked.parse(md, { gfm: true, breaks: false });
    }
    return "<pre>" + esc(md) + "</pre>";
  }

  function showError(container, message) {
    container.innerHTML =
      '<div class="empty-state" role="alert">' + esc(message) +
      ' <a href="index.html">Return home</a>.</div>';
  }

  window.wbs = {
    COLLECTIONS: COLLECTIONS,
    loadIndex: loadIndex,
    loadAllIndexes: loadAllIndexes,
    loadMarkdown: loadMarkdown,
    esc: esc,
    formatDate: formatDate,
    statusTag: statusTag,
    entryHref: entryHref,
    renderMarkdown: renderMarkdown,
    showError: showError
  };
})();
