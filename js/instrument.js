/* Wage Beauty School — the instrument.
   Plays a "scene" from content/instruments/<id>.json: a small emotional-
   chessboard game. Data-driven — the whole story is the JSON file; this
   engine just runs it. See README for the scenario schema.

   do -> feel -> name : you act, the board shifts, the Dark Jester names it. */
(function () {
  "use strict";

  var root = document.getElementById("instrument");
  if (!root) { return; }

  var sigil = window.wbsSigil || function () { return ""; };
  var id = new URLSearchParams(location.search).get("id");
  if (!id) { fail("No scene named."); return; }

  var S = null;   // the scenario
  var state = null;

  fetch("content/instruments/" + encodeURIComponent(id) + ".json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) { throw new Error("HTTP " + r.status); } return r.json(); })
    .then(function (data) { S = data; document.title = S.title + " — Wage Beauty School"; begin(); })
    .catch(function () { fail("That scene could not be loaded."); });

  function fail(msg) {
    root.innerHTML = '<p class="muted">' + esc(msg) +
      ' <a href="practice.html">Back to Practice</a>.</p>';
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function paras(v) {
    return (Array.isArray(v) ? v : [v]).filter(Boolean)
      .map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  }

  /* ---- condition evaluator (shared by flavour + endings + options) ---- */
  function test(cond) {
    return String(cond).trim().split(/\s+/).every(function (c) {
      var neg = c.indexOf("not-") === 0;
      if (neg) { c = c.slice(4); }
      var ok;
      var m = c.match(/^mark:([a-z]+)(<=|>=|<|>|==)(-?\d+)$/);
      if (m) {
        var val = state.marks[m[1]];
        var n = +m[3];
        ok = m[2] === "<=" ? val <= n : m[2] === ">=" ? val >= n :
             m[2] === "<" ? val < n : m[2] === ">" ? val > n : val === n;
      } else if (c.indexOf("temperament:") === 0) {
        ok = state.temperament === c.slice(12);
      } else if (c.indexOf("persona:") === 0) {
        ok = state.persona === c.slice(8);
      } else if (c.indexOf("chose:") === 0) {
        ok = state.chose.indexOf(c.slice(6)) !== -1;
      } else if ((m = c.match(/^count:([a-z]+)(<=|>=|==)(\d+)$/))) {
        var cc = state.counts[m[1]] || 0;
        ok = m[2] === "<=" ? cc <= +m[3] : m[2] === ">=" ? cc >= +m[3] : cc === +m[3];
      } else if (c === "changed-persona") {
        ok = state.changedPersona;
      } else if (c === "against-type") {
        ok = state.lastAgainstType;
      } else {
        ok = false;
      }
      return neg ? !ok : ok;
    });
  }

  // base text + any flavour fragments whose condition currently passes
  function tell(node) {
    if (!node) { return ""; }
    var out = (Array.isArray(node.text) ? node.text : (node.text ? [node.text] : [])).slice();
    var add = node.add || {};
    Object.keys(add).forEach(function (cond) { if (test(cond)) { out.push(add[cond]); } });
    return paras(out);
  }

  /* ---- setup ---- */
  function begin() {
    var tKey = pick(Object.keys(S.temperaments));
    var t = S.temperaments[tKey];
    var marks = {};
    Object.keys(S.marks).forEach(function (k) {
      marks[k] = clamp(k, S.marks[k].start + ((t.offsets && t.offsets[k]) || 0));
    });
    state = {
      temperament: tKey,
      persona: tKey,
      name: pick(t.name),
      marks: marks,
      chose: [],
      counts: {},
      changedPersona: false,
      settled: false,
      lastAgainstType: false
    };
    renderFrame(t);
  }

  function clamp(key, v) {
    var mk = S.marks[key];
    return Math.max(mk.min != null ? mk.min : 0, Math.min(mk.max != null ? mk.max : 7, Math.round(v)));
  }

  /* ---- screens ---- */
  function shell(inner) {
    root.innerHTML =
      '<div class="scene">' + board() + '<div class="scene__stage">' + inner + '</div></div>';
    var live = root.querySelector("[data-live]");
    if (live && state._announce) { live.textContent = state._announce; state._announce = ""; }
    var f = root.querySelector("[data-focus]");
    if (f) { f.focus({ preventScroll: true }); }
  }

  function board() {
    var rows = Object.keys(S.marks).map(function (k) {
      var mk = S.marks[k];
      var v = state.marks[k];
      var fig;
      if (mk.kind === "slider") {
        var span = (mk.max - mk.min) || 6;
        var pct = ((v - mk.min) / span) * 100;
        fig = '<span class="mk__slide"><i style="left:' + pct + '%"></i></span>' +
          '<span class="mk__poles">' + esc(mk.poles[0]) + ' &nbsp; &nbsp; ' + esc(mk.poles[1]) + '</span>';
      } else {
        var max = mk.max != null ? mk.max : 7;
        var s = "";
        for (var i = 0; i < max; i++) { s += i < v ? "●" : "○"; }
        fig = '<span class="mk__pips">' + s + '</span>';
      }
      var d = state._delta && state._delta[k];
      return '<div class="mk">' +
        '<span class="mk__label">' + esc(mk.label) + '</span>' + fig +
        (d ? '<span class="mk__delta">' + (d > 0 ? "+" : "") + d + '</span>' : '') +
        '</div>';
    }).join("");
    return '<aside class="scene__board" aria-label="The board">' +
      '<p class="scene__who">You are <b>' + esc(state.name) + '</b> &middot; <span>' +
      esc(S.temperaments[state.persona].pull) + '</span></p>' +
      rows +
      '<p class="scene__live" data-live aria-live="polite"></p></aside>';
  }

  function renderFrame(t) {
    state._delta = null;
    shell(
      '<p class="scene__mark">' + sigil("instrument") + '<span>' +
        esc(S.instrument || "The Emotional Chessboard") + ' &nbsp;·&nbsp; a played scene</span></p>' +
      '<h1 class="scene__title">' + esc(S.title) + '</h1>' +
      '<div class="scene__prose">' + tell(S.frame) + '</div>' +
      '<div class="scene__temperament"><p><b>' + esc(state.name) + '</b> — ' +
        esc(t.line) + '</p><p class="muted">This is your pull. You can move with it or against it; ' +
        'against it costs something.</p></div>' +
      '<div class="scene__go"><button type="button" class="scene__btn" data-focus data-act="set">Begin</button></div>'
    );
    root.querySelector("[data-act=set]").onclick = function () { state.si = 0; runSet(); };
  }

  function runSet() {
    var set = S.sets[state.si];
    state.bi = 0;
    state._delta = null;
    shell(
      progress() +
      '<h2 class="scene__set">' + esc(set.title) + '</h2>' +
      '<div class="scene__prose">' + tell(set.intro) + '</div>' +
      '<div class="scene__go"><button type="button" class="scene__btn" data-focus data-act="beat">Go on</button></div>'
    );
    root.querySelector("[data-act=beat]").onclick = runBeat;
  }

  function progress() {
    return '<p class="scene__progress">Set ' + (state.si + 1) + ' of ' + S.sets.length +
      ' &nbsp;·&nbsp; ' + esc(S.sets[state.si].title) + '</p>';
  }

  function runBeat() {
    var set = S.sets[state.si];
    var beat = set.beats[state.bi];
    state._delta = null;
    var opts = (beat.options || []).filter(function (o) {
      return (!o.showIf || test(o.showIf)) && (!o.hideIf || !test(o.hideIf));
    });
    // your grain only counts "against" when your comfortable move was actually
    // offered and you stepped past it — not when the board withheld it
    var grain = S.temperaments[state.persona].default;
    state._grainOnTable = opts.some(function (o) { return o.voice === grain && o.kind !== "persona"; });
    var list = opts.map(function (o, i) {
      var against = isAgainstType(o) ? ' <span class="opt__against">against type</span>' : '';
      return '<button type="button" class="opt" data-i="' + i + '"' + (i === 0 ? ' data-focus' : '') + '>' +
        '<span class="opt__label">' + esc(o.label) + '</span>' + against +
        (o.kind === "persona" ? ' <span class="opt__persona">start moving differently</span>' : '') +
        '</button>';
    }).join("");
    shell(
      progress() +
      (beat.prompt ? '<p class="scene__prompt">' + esc(beat.prompt) + '</p>' : '') +
      '<div class="scene__prose">' + tell(beat) + '</div>' +
      '<div class="opts" role="group" aria-label="Your move">' + list + '</div>'
    );
    root.querySelectorAll(".opt").forEach(function (btn) {
      btn.onclick = function () { choose(opts[+btn.dataset.i]); };
    });
  }

  function isAgainstType(o) {
    if (!o.voice || o.kind === "persona" || !state._grainOnTable) { return false; }
    return o.voice !== S.temperaments[state.persona].default;
  }
  function isNewGrain(o) {
    // moving in your newly-chosen persona's voice, before it has settled
    return o.voice && o.kind !== "persona" && state.changedPersona && !state.settled &&
      o.voice === S.temperaments[state.persona].default;
  }

  function applyEffect(eff) {
    if (!eff) { return; }
    state._delta = state._delta || {};
    Object.keys(eff).forEach(function (k) {
      if (!S.marks[k]) { return; }
      var before = state.marks[k];
      state.marks[k] = clamp(k, before + eff[k]);
      state._delta[k] = (state._delta[k] || 0) + (state.marks[k] - before);
    });
  }

  function choose(o) {
    if (o.id) { state.chose.push(o.id); }
    if (o.family) { state.counts[o.family] = (state.counts[o.family] || 0) + 1; }

    if (o.kind === "persona") {
      state.persona = o.to;
      state.changedPersona = true;
      state.settled = false;
    }

    state.lastAgainstType = isAgainstType(o);
    var newGrain = isNewGrain(o);
    applyEffect(o.effect);

    // Acting against your own grain reads as forced — a real, small cost.
    // The first move in a persona you have just chosen costs once too: you
    // can start to move differently, but you cannot suddenly *be* different.
    if (state.lastAgainstType) {
      applyEffect({ positioning: -1 });
    } else if (newGrain) {
      applyEffect({ positioning: -1 });
      state.settled = true;
    }

    if (o.effectIf) {
      applyEffect(test(o.effectIf.cond) ? o.effectIf.then : o.effectIf.else);
    }

    announce();

    var set = S.sets[state.si];
    var body = tell(o.result || o.reveal);
    var aside = o.jesterAside ? '<p class="scene__aside">' + jesterMark() + esc(o.jesterAside) + '</p>' : "";

    state.bi++;
    var moreBeats = state.bi < set.beats.length;
    shell(
      progress() +
      '<div class="scene__prose scene__prose--result">' + body + aside + '</div>' +
      '<div class="scene__go"><button type="button" class="scene__btn" data-focus data-act="next">' +
        (moreBeats ? "Continue" : "See where it stands") + '</button></div>'
    );
    root.querySelector("[data-act=next]").onclick = moreBeats ? runBeat : endSet;
  }

  function announce() {
    if (!state._delta) { return; }
    var bits = Object.keys(state._delta).filter(function (k) { return state._delta[k]; })
      .map(function (k) {
        return S.marks[k].label + " " + (state._delta[k] > 0 ? "+" : "") + state._delta[k] +
          ", now " + state.marks[k];
      });
    state._announce = bits.length ? bits.join(". ") + "." : "The board holds.";
  }

  function endSet() {
    var set = S.sets[state.si];
    state._delta = null;
    shell(
      progress() +
      '<div class="scene__prose">' + tell(set.resolution) + '</div>' +
      jesterBlock(set.jester) +
      '<div class="scene__go"><button type="button" class="scene__btn" data-focus data-act="on">' +
        (state.si + 1 < S.sets.length ? "The next part" : "How it ends") + '</button></div>'
    );
    root.querySelector("[data-act=on]").onclick = function () {
      state.si++;
      if (state.si < S.sets.length) { runSet(); } else { ending(); }
    };
  }

  function jesterMark() {
    return '<svg class="sigil sigil--jester" aria-hidden="true"><use href="#s-jester"></use></svg>';
  }
  function jesterBlock(j) {
    if (!j) { return ""; }
    return '<div class="jester">' +
      '<p class="jester__who">' + jesterMark() + 'The Dark Jester</p>' +
      tell(j) +
      (j.question ? '<p class="jester__q">' + esc(j.question) + '</p>' : "") +
      '</div>';
  }

  function ending() {
    var end = null;
    for (var i = 0; i < S.endings.length; i++) {
      if (S.endings[i].fallback || (S.endings[i].when && test(S.endings[i].when))) { end = S.endings[i]; break; }
    }
    if (!end) { end = S.endings[S.endings.length - 1]; }

    try { localStorage.setItem("wbs:instrument:" + id, end.id); } catch (e) { /* ok */ }

    var passages = (S.passages || []).map(function (p) {
      if (p.action === "replay") {
        return '<button type="button" class="scene__passage" data-act="replay">' + esc(p.label) + ' &#8635;</button>';
      }
      return '<a class="scene__passage" href="' + esc(p.href) + '">' + esc(p.label) + ' &rarr;</a>';
    }).join("");

    state._delta = null;
    shell(
      '<p class="scene__mark">' + sigil("instrument") + '<span>How it ends</span></p>' +
      '<h2 class="scene__set">' + esc(end.title) + '</h2>' +
      '<div class="scene__prose">' + tell(end) + '</div>' +
      jesterBlock(end.jester ? { text: end.jester, question: end.question } : { question: end.question }) +
      '<div class="scene__passages">' + passages + '</div>'
    );
    var rb = root.querySelector("[data-act=replay]");
    if (rb) { rb.onclick = function () { begin(); }; }
  }
})();
