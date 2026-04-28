# Footnote Architecture

> **Read this entire file before modifying any footnote-related code.**
> Every prior fix to footnotes broke something else because the underlying
> model was misunderstood. This document is the source of truth.

---

## The data model

### Numbering is GLOBAL, not section-local

Footnotes in *The Secret Book of Walt* are numbered **1 through 158** across
the entire critical edition. The numbering follows the print Pergamon edition
exactly. Footnote ¹³⁸ is the 138th footnote in the book, not the 1st footnote
in any subsection.

A paragraph in **Introduction** can reference footnote `¹³⁸`, even though
footnote `¹³⁸`'s definition lives in **Gospel §IX** (because §IX of the
gospel is what generated the apparatus entry). Likewise, the Manuscripts
section uses footnotes `¹¹⁹–¹²⁷`, which appear only in Manuscripts. There is
no per-section restart, and there must never be one.

The actual distribution in `walt_full_data.json`:

| Section | Declared footnotes |
|---|---|
| introduction | ¹, ², ³, ¹³⁸–¹⁵¹, ¹¹⁰–¹¹⁶ |
| manuscripts | ¹¹⁹–¹²⁷ |
| gospel | ⁴–¹⁵⁶ (111 footnotes; not contiguous, gaps where notes live elsewhere) |
| appendix_d | ¹¹⁷, ¹¹⁸ |
| appendix_e | ¹²⁸–¹³⁶ |
| appendix_h | ¹³⁷ |
| appendix_k | ¹⁵⁷, ¹⁵⁸ |

Body-text references to these numbers can appear in **any** section. The
single source of truth is therefore a **global footnote map**, built once at
load time by walking every section.

### NOT every superscript is a footnote

The text uses Unicode superscripts (`¹²³⁴⁵⁶⁷⁸⁹⁰`) for two purposes:

1. **Footnote references** — at the end of a sentence, after a quote, or
   adjacent to whitespace.
   Examples: `…catalogue.³`  /  `…inside it."¹³⁸`  /  `arrived from the future).¹⁴²`

2. **Identifier suffixes on letters** — most importantly, "Golden Ticket"
   identifiers in the codicological apparatus.
   Examples: `G⁴⁶`  /  `G³¹–G⁴⁵`  /  `G¹–G³ | §I.`

The disambiguation rule is exact:

> **A run of superscripts is a footnote reference if and only if it is NOT
> immediately preceded by an alphabetical letter (`A-Z` / `a-z`).**

Implementation: negative-lookbehind regex `/(?<![A-Za-z])([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g`,
or equivalent character-by-character scan if lookbehind support is in doubt.

This rule is non-negotiable. Breaking it makes ticket references like `G⁴⁶`
clickable as fake footnotes, which has happened in past iterations.

### Paragraph-level footnote definitions

A footnote definition is a paragraph object of the form:
```json
{ "type": "footnote", "text": "¹³⁸ The description \"heavier than gold should be\" has led..." }
```

The leading superscript is the **footnote ID**. The remainder is the
footnote body. The system parses both at map-build time.

Some entries also carry an `fn_id` field (used in versed gospel data); when
present, it must equal the parsed leading superscript. If both are present
and they disagree, the parsed superscript wins (it is what the body text
references).

---

## The component model

### `useGlobalFnMap(rootData)` — single source of truth

A hook (or pure function) that walks the entire data object and produces:

```js
{
  '¹':   { id: '¹',   text: 'Sharks, L. (2015)…',          section: 'introduction' },
  '²':   { id: '²',   text: 'The parallel to…',             section: 'introduction' },
  '³':   { id: '³',   text: 'The numbering of the archons…', section: 'introduction' },
  '⁴':   { id: '⁴',   text: 'On the appearance of…',         section: 'gospel' },
  …
  '¹³⁸': { id: '¹³⁸', text: 'The description "heavier than gold…"', section: 'introduction' },
  …
  '¹⁵⁸': { id: '¹⁵⁸', text: '…',                              section: 'appendix_k' }
}
```

Built **once** per book, memoized by the data object identity. Built on the
client (no server-side preprocessing required). Fast — Walt has 158 entries.

### `<FootnotedText text glossaryLink isVeil onFnClick visibleFns />` — universal renderer

Replaces the legacy `Leaf` component for **all** body-text rendering in
front matter, gospel, and back matter. Outputs a sequence of:

- Plain text spans (with optional glossary linking via `injectLinks` /
  `LinkedText`) for non-superscript runs;
- Clickable footnote markers (in veil mode), or styled-but-passive footnote
  markers (in pierce mode), for superscript runs that pass the
  not-preceded-by-letter rule.

**Veil mode click behavior**: toggles the footnote into the section's
`visibleFns` map; the footnote text is rendered inline immediately
below the paragraph that contained the marker. Re-clicking the same marker
collapses it.

**Pierce mode**: the markers are still rendered (as a low-saturation blue),
but click handlers and keyboard handlers are not bound. Pierce mode exists
to give a quieter reading experience; the markers still indicate "there is
apparatus here" without offering it.

### `<InlineFootnote text fnColor depth />` — popup display

The visible footnote body when a marker is clicked. Renders below the
parent paragraph with a thin left rule, the footnote text, and (optionally)
a close button. Uses `fnColor` for the marker rule.

### Where the components live

| Component | File | Notes |
|---|---|---|
| `useGlobalFnMap` | `src/footnotes.js` | Pure JS, no React imports — testable. |
| `FootnotedText` | `src/footnotes.jsx` | Render-only. No state. State lives in caller. |
| `InlineFootnote` | `src/footnotes.jsx` | The popup leaf. |

Both `App.jsx` (Walt) and `Antioch.jsx` import from `src/footnotes.jsx`.

---

## State model

Each section maintains its own `visibleFns` `useState({})` keyed by
**footnote ID** (the superscript string itself, e.g. `'¹³⁸'`). This is
section-local because two different sections might both reference `¹³⁸`,
and we want each render of `¹³⁸` to be independently togglable.

```js
const [visibleFns, setVisibleFns] = useState({});
const toggleFn = (id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] }));
```

After click: the parent paragraph renders `<InlineFootnote>` immediately
below itself if `visibleFns[id]` is truthy.

---

## What NOT to do

- **Do not renumber footnotes per section.** The numbering is canonical
  and matches the print edition.
- **Do not strip the leading superscript from footnote bodies** when
  rendering the footnote — the user expects to see "¹³⁸ The description…"
  as the leaf text.
- **Do not use the old `✦` adjacency toggle.** It only worked when a
  footnote paragraph was immediately after the prose paragraph that
  referenced it, which is rarely the case.
- **Do not use the old per-section "endnotes block" toggle.** It hid
  inline references and required users to scroll.
- **Do not strip `<sup>` styling from non-clickable markers in pierce
  mode.** The markers remain visible as a reading cue.
- **Do not turn ticket numbers like `G⁴⁶` into clickable footnotes.** Apply
  the not-preceded-by-letter rule.
- **Do not regenerate `walt_full_data.json` from scratch** — the JSON has
  been hand-aligned with the print edition. Modify the rendering logic,
  not the data, to fix display bugs.

---

## Pierce mode vs Veil mode

| Aspect | Pierce | Veil |
|---|---|---|
| Body text | Black on cream, no apparatus shown by default | Black on warm cream, apparatus accessible |
| Footnote markers (¹²³) in body | Rendered, blue, no click | Rendered, blue, clickable |
| Inline footnote popup | Not available | Toggles below paragraph |
| Endnotes block | Hidden | Hidden (legacy; we removed) |
| Glossary terms (LinkedText) | Active in both | Active in both |
| Visual feel | Stripped down — reading focus | Critical edition with apparatus reachable |

Pierce mode is a **reader's mode**, not a no-apparatus mode. The blue
markers are the cue. The reader knows footnotes exist and can switch to
veil mode to read them.

---

## Antioch parity

The same architecture must apply to **The Gospel of Antioch**. Antioch
also has globally-numbered footnotes (counted from the start of its own
critical edition; not shared with Walt). The same `FootnotedText`,
`useGlobalFnMap`, and `InlineFootnote` components are used.

Antioch's data file `antioch_gospel_data.json` must include all four
section types — front matter (introduction, headnote), gospel (114 logia),
apparatus criticus, appendices (A–E). Until that data file is regenerated,
Antioch will only display footnotes embedded in its gospel chapters
(none currently exist there).

---

## How to test a footnote change

Before merging, check:

1. **Front matter**: Click `¹` in Introduction §I — popup appears below
   that paragraph; popup contains "Sharks, L. (2015)…"
2. **Cross-section**: Click `¹³⁸` in Introduction §IX (Physical Description) —
   popup appears with the heavier-than-gold note (defined in introduction
   but lives in the same section).
3. **Manuscripts**: Click `¹¹⁹` in Note on the Manuscripts — popup with
   manuscripts §A note.
4. **Codicological table**: `G⁴⁶` and `G³¹` in the codicological table
   are NOT clickable — they remain inline text with the same superscript
   styling but no cursor change, no click handler.
5. **Pierce mode**: All markers are blue; clicking them does NOTHING; the
   popup never opens.
6. **Gospel verse**: Proem footnote `⁴` opens inline below the verse, as
   it always has.
7. **Re-click**: Clicking an opened footnote closes it.
8. **Section switch**: Switching sections preserves no state (each section's
   `visibleFns` is local).

---

## How to regenerate the data

The build scripts in `scripts/` produce the JSON data files from the canonical
source markdown deposits. Run them when:
- Source markdown is updated on Zenodo (re-download the .md to `scripts/walt_source.md` or `scripts/antioch_source.md`)
- A footnote's body text needs to change
- Quote styling or emphasis rendering needs adjustment

```bash
python3 scripts/build_walt_data.py     # → public/walt_full_data.json
python3 scripts/build_antioch_data.py  # → public/antioch_gospel_data.json
```

Both scripts:
- Apply `smart_quote()` to convert straight quotes to curly
- Apply `strip_walt_quotes()` to remove "" around "The Secret Book of Walt"
- Preserve `*italic*` and `**bold**` markdown markers (the React renderer converts them)
- Use `find_footnote_runs()` to scan superscript references with the disambiguation rule
- Renumber footnotes globally in reading order (1..N)
- Audit the result and report any unresolved references

If the audit reports **MISSING** references (referenced in body but not declared
as a footnote paragraph), that's a real corruption — fix the source markdown.

If the audit reports **ORPHANED** definitions (declared but never referenced),
that's usually fine — sometimes the source has a footnote definition whose
reference is in a section we don't include.

## Maintenance log

| Date | Change | Author |
|---|---|---|
| 2026-04-28 | Universal footnote system: global fnMap, FootnotedText component, InlineFootnote popup. Removed ✦ adjacency toggle and endnotes block. Documented architecture. | TACHYON / Sharks, Lee |
| 2026-04-28 (later) | **Data-layer fixes:** wrote `scripts/build_walt_data.py` and `scripts/build_antioch_data.py` to regenerate `walt_full_data.json` and `antioch_gospel_data.json` from canonical source markdown. Renumbered all footnotes 1..N in **reading order** (front matter first). Walt: 158 footnotes, ¹ now begins in Manuscripts. Antioch: 19 footnotes globally renumbered, all front+back matter parsed. **Markdown emphasis** (`*italic*`, `**bold**`) is now rendered to `<em>`/`<strong>` by the FootnotedText component. **Quotes normalized** to curly via build-time `smart_quote()`. **Quotes around "The Secret Book of Walt"** stripped via `strip_walt_quotes()`. Antioch's hardcoded front-matter prose retained, but the parsed footnotes are surfaced via a new `<SectionFootnotes>` component appended to each tree node. | TACHYON / Sharks, Lee |
| 2026-04-28 (final) | **Antioch full parity with Walt.** All hardcoded `<Leaf>` blocks in front matter and back matter replaced with `<SectionRenderer>` calls reading from the parsed JSON. New `<SectionRenderer>` component is Antioch's analog of Walt's `<SectionContent>` — same primitives, same data flow, same footnote popup behavior. Optional `subheading` prop slices one subsection out of `introduction`. Diptych comparison table preserved as hand-coded JSX (it isn't in source markdown by design). Three previously-invisible sections now exposed: Apparatus Criticus, Appendix D (The Voice), Appendix H (Cluster Commentary), Appendix K (Manifold). Result: footnote symmetry is structural, not just behavioral — both books import the same modules and route footnote clicks through identical components. JS bundle dropped from 278KB → 249KB by moving prose out of code. | TACHYON / Sharks, Lee |

When you change footnote rendering, **append an entry to this table** and
**update the relevant section above** if the architecture changed.
