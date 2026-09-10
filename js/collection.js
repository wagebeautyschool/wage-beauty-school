/* Renders an index listing for a room (Library / Practice / Laboratory).
   Markup needed on the page:
     <div id="listing" data-collection="library" data-search="true"></div>
   data-search="true" adds the search box + category filter (used by the Library).

   Each entry gets a catalogue number from its position in index.json — the
   accession order. Adding a new entry at the end keeps every existing number. */
(function () {
  "use strict";

  var root = document.getElementById("listing");
  if (!root) { return; }

  var collection = root.getAttribute("data-collection");
  var withSearch = root.getAttribute("data-search") === "true";
  var roomMark = (collection || "").toUpperCase();
  var state = { q: "", category: "All", entries: [] };

  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

  wbs.loadIndex(collection).then(function (entries) {
    state.entries = entries.map(function (e, i) {
      var copy = Object.create(e);
      copy._n = i + 1;                 // catalogue number = accession order
      return copy;
    }).sort(function (a, b) {
      return (b.date || "").localeCompare(a.date || "");
    });
    build();
  }).catch(function (err) {
    wbs.showError(root, err.message);
  });

  function categories() {
    var seen = {};
    state.entries.forEach(function (e) { if (e.category) { seen[e.category] = true; } });
    return ["All"].concat(Object.keys(seen).sort());
  }

  function build() {
    root.innerHTML = "";

    if (withSearch) {
      var filters = document.createElement("div");
      filters.className = "filters";

      var field = document.createElement("div");
      field.className = "search-field";
      field.innerHTML =
        '<label for="q">Search the archive</label>' +
        '<input type="search" id="q" autocomplete="off" ' +
        'placeholder="Title, description, category…">';
      filters.appendChild(field);

      var cats = document.createElement("div");
      cats.className = "category-filter";
      cats.setAttribute("role", "group");
      cats.setAttribute("aria-label", "Filter by category");
      categories().forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        b.setAttribute("aria-pressed", String(c === state.category));
        b.addEventListener("click", function () {
          state.category = c;
          syncPressed(cats);
          renderList();
        });
        cats.appendChild(b);
      });
      filters.appendChild(cats);
      root.appendChild(filters);

      field.querySelector("input").addEventListener("input", function (e) {
        state.q = e.target.value.trim().toLowerCase();
        renderList();
      });
    }

    var count = document.createElement("p");
    count.className = "result-count";
    count.id = "result-count";
    count.setAttribute("role", "status");
    count.setAttribute("aria-live", "polite");
    root.appendChild(count);

    var list = document.createElement("ul");
    list.className = "entry-list";
    list.id = "entry-list";
    root.appendChild(list);

    renderList();
  }

  function syncPressed(container) {
    container.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.textContent === state.category));
    });
  }

  function matches(e) {
    if (state.category !== "All" && e.category !== state.category) { return false; }
    if (!state.q) { return true; }
    var hay = [e.title, e.description, e.category, e.type, e.status, e.instrument]
      .join(" ").toLowerCase();
    return hay.indexOf(state.q) !== -1;
  }

  function renderList() {
    var list = document.getElementById("entry-list");
    var count = document.getElementById("result-count");
    var shown = state.entries.filter(matches);

    count.textContent = shown.length + (shown.length === 1 ? " entry" : " entries");

    if (!shown.length) {
      list.innerHTML =
        '<li class="empty-state">Nothing here yet under those terms.</li>';
      return;
    }

    list.innerHTML = shown.map(function (e) {
      var num = e.number || pad(e._n);
      var meta = [];
      if (e.category) { meta.push(wbs.esc(e.category)); }
      if (e.type) { meta.push(wbs.esc(e.type)); }
      if (e.instrument) { meta.push("Instrument: " + wbs.esc(e.instrument)); }
      if (e.date) { meta.push(wbs.esc(wbs.formatDate(e.date))); }
      return '' +
        '<li class="entry-card">' +
        '<a class="entry-card__link" href="' + wbs.esc(wbs.entryHref(collection, e.slug)) + '">' +
        '<span class="entry-card__num"><b>' + wbs.esc(roomMark) + ' ' + wbs.esc(num) + '</b></span>' +
        '<h2 class="entry-card__title">' + wbs.esc(e.title) + '</h2>' +
        (e.description ? '<p class="entry-card__desc">' + wbs.esc(e.description) + '</p>' : '') +
        '<div class="entry-card__meta">' +
        wbs.statusTag(e.status) +
        (meta.length ? '<span>' + meta.join(" &nbsp;·&nbsp; ") + '</span>' : '') +
        '</div>' +
        '</a>' +
        '</li>';
    }).join("");
  }
})();
