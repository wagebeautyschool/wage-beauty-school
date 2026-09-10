# Wage Beauty School

The first digital home of Wage Beauty School — a living school for creative engineers.

> Make with intention. Question the instrument.

This is a **static-first** website: hand-written HTML, one stylesheet, a small
amount of vanilla JavaScript, and content stored as Markdown and JSON. There is
no database, no build step, no authentication, no framework, and no dependency on
any paid service or any AI model. It is designed to keep working, and to stay
easy to edit, for a long time.

---

## Running it locally

The site fetches Markdown and JSON files, so it needs to be served over HTTP —
opening `index.html` straight from the file system will leave the Library empty.

From the project folder:

```bash
python -m http.server 8000
```

Then visit <http://127.0.0.1:8000>. Any static server works (`npx serve`,
`php -S localhost:8000`, the VS Code "Live Server" extension, etc.).

---

## File structure

```
wage-beauty-school/
├── index.html            Home
├── library.html          Library index (search + category filter)
├── practice.html         Practice index
├── laboratory.html       Laboratory index
├── projects.html         Projects (rendered inline)
├── about.html            About (static prose)
├── entry.html            Universal reader for one Library / Practice / Laboratory entry
│                         (?c=<collection>&id=<slug>)
├── 404.html              Not-found page (used by GitHub Pages)
├── favicon.svg
├── .nojekyll             Tells GitHub Pages to serve files as-is
│
├── css/
│   └── style.css         The entire design system, one file, commented by section
│
├── js/
│   ├── main.js           Shared: mobile menu toggle, footer year
│   ├── data.js           Content loader + shared render helpers (window.wbs)
│   ├── collection.js     Renders an index listing (Library / Practice / Laboratory)
│   ├── entry.js          Renders a single entry from its Markdown file
│   └── projects.js       Renders the Projects archive inline
│
├── vendor/
│   └── marked.min.js     Markdown → HTML (marked v12.0.2, MIT, vendored — no CDN)
│
└── content/
    ├── library/
    │   ├── index.json        Manifest: one block per document
    │   ├── *.md              One Markdown file per document
    │   └── sources/          Original source files (PDF/DOCX) the Markdown was made from
    ├── practice/
    │   ├── index.json
    │   └── *.md
    ├── laboratory/
    │   ├── index.json
    │   └── *.md
    └── projects/
        ├── index.json        Manifest: one block per project
        ├── *.md              Optional — a project's own page (e.g. a dev log)
        └── <project>/        Optional — a project's documents + their sources
            ├── *.md
            └── sources/
```

The page header and footer are copied into each HTML file by hand. That is the
deliberate cost of having no build step: to change navigation, edit every
`*.html` file. There are eight of them.

---

## Adding content

### A new Library document (also how Practice and Laboratory work)

1. **Write the document.** Create `content/library/my-new-document.md`.
   Start with an optional italic standfirst, then use `##` for section headings
   (do **not** put a top-level `#` heading in the file — the title comes from the
   manifest). Standard Markdown: paragraphs, `##`/`###`, lists, `>` blockquotes,
   links, `` `code` ``, `---` rules.

2. **Register it.** Add a block to `content/library/index.json`:

   ```json
   {
     "slug": "my-new-document",
     "title": "My New Document",
     "category": "Critical Thinking",
     "type": "Essay",
     "status": "Working Draft",
     "date": "2026-09-10",
     "description": "One sentence shown on the Library card and at the top of the page.",
     "file": "my-new-document.md",
     "related": ["library/how-to-play-chess-with-yourself", "practice/question-the-default"]
   }
   ```

That is all. The Library index, search, category filter, the document page, and
the "Related material" links all update automatically.

#### Fields

| Field | Notes |
|-------|-------|
| `slug` | URL id. Lowercase, hyphenated. Must match the part before `.md`. |
| `title` | Shown everywhere. |
| `category` | Free text. New categories appear as filter buttons on their own. Suggested set: Emotional Resilience · Media Literacy · Critical Thinking · Creative Engineering · Artificial Intelligence · Storytelling · Philosophy · Communication · Systems Thinking. |
| `type` | Free text — Essay, Note, Experiment Note, Exercise, etc. |
| `status` | One of: Note · Working Draft · Experiment · Prototype · Established · Archived (Laboratory also uses Idea · In Progress · Functional; Projects also use In Progress · Hiatus). `Established` and `Functional` are shown in the accent colour. |
| `date` | `YYYY-MM-DD`. Used for sorting (newest first) and display. |
| `description` | One or two sentences. |
| `file` | Filename inside the same collection folder. |
| `related` | Array of `"<collection>/<slug>"` references. `collection` is `library`, `practice`, `laboratory`, or `projects`. Broken references are silently skipped. |

### A new Practice exercise or Laboratory experiment

Identical to the above, in `content/practice/` or `content/laboratory/`.
By convention:

- **Practice** files use the headings `## Question`, `## Context`,
  `## Exercise`, `## Reflection`.
- **Laboratory** files use `## Question`, `## Input`, `## Method`, `## Tools`,
  `## Process`, `## Result`, `## Observations`, `## Failure points`,
  `## Next question`.

These are conventions, not code — the renderer just displays the Markdown.

### A new Project

Add a block to `content/projects/index.json`:

```json
{
  "slug": "my-project",
  "title": "My Project",
  "type": "Ongoing work",
  "status": "In Progress",
  "description": "A short paragraph.",
  "links": [{ "label": "Play it", "url": "https://…" }],
  "related": ["library/how-to-play-on-the-emotional-chessboard"]
}
```

`links` is an array of `{ "label", "url" }` — external links people can follow
(a playable build, a repository, a write-up).

**Projects can also have their own page.** Add `"file": "my-project.md"` and
create `content/projects/my-project.md` — the project's title then links to a
full page rendered from that Markdown. Set `"pageLabel"` for the link text
(e.g. `"Development log & notes"`). Without `file`, the project stays as a
single record on the Projects index. See `song-of-the-fallen.md` for a simple
shape (About / Status / Development log, newest entries first).

**A project can also carry a set of documents.** Add a `"documents"` array;
each entry is `{ slug, title, aspect, file, source, status, date, description }`.
The project page then shows them grouped by `aspect`, and each links to
`entry.html?c=projects&id=<project>&doc=<doc-slug>` — a full reading page
rendered from `file` (a path under `content/projects/`), with `source` (a PDF
under the same tree) offered as "the original, designed edition". `Shorigan` is
built this way: `shorigan.md` is the overview; its `Living Philosophy` documents
live in `shorigan/` (the two tomes) and its `Living Story` documents in
`shorigan/story/` (the fiction extracts); each folder has a `sources/` holding
the original PDFs and that section's README.

---

## Publishing the site (first time)

### Guided

Run the walkthrough script from the project folder:

```bash
bash scripts/publish.sh
```

It opens each page you need, tells you exactly what to click, creates the
GitHub connection, uploads the site, and waits for the live URL. Safe to
stop (Ctrl-C) and re-run — it remembers your username.

### Manual

1. Create a free account at <https://github.com/signup>.
2. Create a new **public** repository at <https://github.com/new> named
   `wage-beauty-school`. Do **not** add a README, `.gitignore`, or licence —
   it must start empty.
3. From this folder:
   ```bash
   git remote add origin https://github.com/<username>/wage-beauty-school.git
   git branch -M main
   git push -u origin main
   ```
   The first push opens a browser to authorise Git — sign in and approve.
4. In the repository: **Settings → Pages → Build and deployment**. Set
   **Source** to **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. Wait 1–3 minutes, then visit
   `https://<username>.github.io/wage-beauty-school/`.

### Publishing changes afterwards

```bash
git add -A && git commit -m "describe the change" && git push
```

The live site updates a minute or two later.

The `.nojekyll` file is already present so that the `content/`, `js/`, and
`vendor/` folders are served untouched.

**Absolute vs. relative paths.** Every content page uses relative links, so the
site works whether it is served from a domain root (`wagebeautyschool.org`, or
`<username>.github.io`) or a project subpath
(`<username>.github.io/wage-beauty-school/`). `404.html` is fully self-contained
(its own inline styles, no external files) and repoints its two links to the
correct site root at load time, so it works in every case.

To use a custom domain, add a file named `CNAME` containing just the domain
(e.g. `wagebeautyschool.org`) and configure DNS as GitHub documents.

---

## Design notes

The look is meant to read as *independent school / public library / research
notebook / publishing house / unfinished institution* — restrained, editorial,
strong on typography and spacing. Body text is set in a system serif for
comfortable long-form reading; labels, metadata, and status tags use a monospace
face, like a library catalogue. One accent colour (oxblood). Light and dark
themes both ship, following the reader's system setting. Animation is avoided;
nothing meaningful is communicated by motion alone.

All of it lives in `css/style.css`, grouped and commented by section. The colour
palette is defined once as custom properties at the top of that file.

## Accessibility

- Semantic HTML with a single `<h1>` per page and ordered headings.
- Skip link, keyboard-operable navigation, visible focus outlines.
- Colour contrast meets WCAG AA in both themes.
- The site is navigable with JavaScript disabled; the Library, Practice, and
  Laboratory index pages need JavaScript to search and filter, and point to the
  raw `content/` folder as a fallback.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.

## Licence

Content: © Wage Beauty School. Code: do as you like.
`vendor/marked.min.js` is MIT-licensed (© 2011–2024 Christopher Jeffrey).
