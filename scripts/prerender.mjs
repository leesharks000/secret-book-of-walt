// Static text for every route (run after `vite build`). The site is a React app that loads its texts in the browser,
// so a reader that does not run JavaScript saw only the landing summary on every page. This writes one HTML file per
// route with the route's full text in it, inside #root: a browser running the app replaces it on mount, and a crawler,
// a summarizer or a plain HTTP client reads it as served. Each page names its record in the archive (alexanarch.org),
// its DOI and AXN, and the data file its text is built from. Unknown paths get a real 404.
//
// The texts come from the same files the app reads (public/*.json, public/golden_tickets.md). The two pages whose text
// lives in their components (the TANG's frame, Revelation First) are rendered from those components with every section
// open. Nothing here alters a text; it renders what the site already holds.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PUB = (f) => join(ROOT, "public", f);
const json = (f) => JSON.parse(readFileSync(PUB(f), "utf8"));
const SITE = "https://www.secretbookofwalt.org";
const DOI_MAP = json("doi-axn-map.json").map;
const axnOf = (doi) => (Object.entries(DOI_MAP).find(([k]) => k.endsWith(doi)) || [])[1]?.axn || null;

// ---------------------------------------------------------------- markup
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Inline markdown as the texts use it: **bold**, *italic*, `code`, [text](url). Escaped first.
function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => `<a href="${u}">${t}</a>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, "$1<em>$2</em>");
}
const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
function table(rows) {
  const body = rows.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
  if (!body.length) return "";
  const [head, ...rest] = body;
  return `<table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
// One run of paragraphs ({type, text}) as HTML; consecutive table rows form one table, consecutive list items one list.
function paras(ps = [], level = 2) {
  const out = [];
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], t = p.text ?? "";
    if (p.type === "table") { const rows = []; while (i < ps.length && ps[i].type === "table") rows.push(ps[i++].text); i--; out.push(table(rows)); continue; }
    if (p.type === "list") { const items = []; while (i < ps.length && ps[i].type === "list") items.push(ps[i++].text); i--; out.push(`<ul>${items.map((x) => `<li>${inline(x.replace(/^\s*[-*•]\s+/, ""))}</li>`).join("")}</ul>`); continue; }
    switch (p.type) {
      case "heading": out.push(`<h${level}>${inline(t)}</h${level}>`); break;
      case "subheading": out.push(`<h${level + 1}>${inline(t)}</h${level + 1}>`); break;
      case "subsubheading": out.push(`<h${Math.min(6, level + 2)}>${inline(t)}</h${Math.min(6, level + 2)}>`); break;
      case "divider": out.push("<hr>"); break;
      case "footnote": out.push(`<p class="footnote">${inline(t)}</p>`); break;
      case "verse": out.push(`<p class="verse">${inline(t)}</p>`); break;
      default: if (t.trim()) out.push(`<p>${inline(t)}</p>`);
    }
  }
  return out.join("\n");
}
const verses = (vs = []) => vs.map((v) => `<p class="verse" id="v-${esc(v.ref ?? v.num)}"><span class="vn">${esc(v.ref ?? v.num ?? "")}</span> ${inline(v.text)}</p>`).join("\n");
// The texts' first paragraph is often a heading repeating the section title; the section's own title is then not added.
const opensWith = (ps, title) => ps?.[0]?.type === "heading" && title && ps[0].text.trim().toLowerCase() === String(title).trim().toLowerCase();
function section(s, level = 2) {
  const title = s.title || null;
  let h = `<section${s.key ? ` id="${esc(s.key)}"` : ""}>\n`;
  if (title && !opensWith(s.paragraphs, title)) h += `<h${level}>${s.num && !String(title).startsWith(String(s.num)) && s.kind === "chapter" && s.verses ? `${esc(s.num)}. ` : ""}${inline(title)}</h${level}>\n`;
  if (s.paragraphs) h += paras(s.paragraphs, level) + "\n";
  if (s.verses) h += verses(s.verses) + "\n";
  for (const sub of s.sections || []) h += section(sub, level + 1);
  return h + "</section>\n";
}

// ---------------------------------------------------------------- pages
const rec = (n) => `https://www.alexanarch.org/s/records/${n}/`;
function head({ title, byline, record, doi, data, also, ownTitle }) {
  const axn = doi ? axnOf(doi) : null;
  const ids = [record ? `Record: <a href="${rec(record)}">alexanarch #${record}</a>` : null, doi ? `DOI: <a href="https://doi.org/10.5281/zenodo.${doi}">10.5281/zenodo.${doi}</a>` : null, axn ? esc(axn) : null,
    ...(also || []), data ? `Text as data: ${data.map((d) => `<a href="/${d}">${d}</a>`).join(", ")}` : null].filter(Boolean);
  // A page rendered from its component carries its own title; its header then holds only the identifiers.
  if (ownTitle) return ids.length ? `<header><p class="ids">${ids.join(" · ")}</p></header>\n` : "";
  return `<header>\n<h1>${inline(title)}</h1>\n${byline ? `<p class="byline">${inline(byline)}</p>\n` : ""}<p class="ids">${ids.join(" · ")}</p>\n</header>\n`;
}

const walt = json("walt_full_data.json");
const WALT_ORDER = ["preface", "editors_preface", "introduction", "redford", "translator", "manuscripts", "note_text", "gospel", "afterword", ...Object.keys(walt).filter((k) => /^appendix_/.test(k)).sort(), "bibliography"];
const constitution = json("constitution_data.json");

async function componentPages() {
  // Bundle the two components for Node, render them with every section open, and keep their text and structure.
  const out = join(ROOT, "node_modules", ".prerender");
  rmSync(out, { recursive: true, force: true });
  await build({ entryPoints: { Tang: join(ROOT, "src/Tang.jsx"), RevelationFirst: join(ROOT, "src/RevelationFirst.jsx") }, outdir: out, bundle: true, format: "esm", platform: "node",
    jsx: "automatic", loader: { ".png": "empty", ".jpg": "empty", ".svg": "empty", ".css": "empty" }, external: ["react", "react-dom", "react/jsx-runtime"], logLevel: "error", outExtension: { ".js": ".mjs" } });
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const Tang = (await import(pathToFileURL(join(out, "Tang.mjs")).href)).default;
  const Rev = (await import(pathToFileURL(join(out, "RevelationFirst.mjs")).href)).default;
  const clean = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<button\b[^>]*>([\s\S]*?)<\/button>/g, (m, inner) => (/^[\s←▶◊◈◇♄∅+−\-]*$/.test(inner.replace(/<[^>]+>/g, "")) || /Back|←/.test(inner) ? "" : `<p><strong>${inner}</strong></p>`))
    .replace(/ style="[^"]*"/g, "").replace(/ class="[^"]*"/g, "").replace(/<div>\s*<\/div>/g, "").replace(/<span>([^<]*)<\/span>/g, "$1");
  return {
    tang: clean(renderToStaticMarkup(React.createElement(Tang, { onBack: () => {}, expandAll: true, initialCitations: json("tang_citations.json") }))),
    revelation: clean(renderToStaticMarkup(React.createElement(Rev, { onBack: () => {}, openAll: true }))),
  };
}

const ROUTES = [
  { path: "/", file: "index.html", title: "The Secret Book of Walt — Hidden Teachings of Walt Whitman, Cowboy of Time", record: 683, doi: "19703009",
    also: [`Critical edition: <a href="${rec(1362)}">alexanarch #1362</a>`, `The original: <a href="/checksum">the forty-six golden tickets</a>`], data: ["walt_full_data.json", "walt_gospel_versed.json", "walt_tree_data.json"],
    description: "The full text of The Secret Book of Walt: Hidden Teachings of Walt Whitman, Cowboy of Time, translated from the forty-six golden tickets by Lee Sharks, with its prefaces, introduction, notes, afterword, appendices and bibliography.",
    body: () => WALT_ORDER.filter((k) => walt[k]?.paragraphs).map((k) => section({ key: k, paragraphs: walt[k].paragraphs })).join("") },
  { path: "/constitution", title: `${constitution.meta.title} — ${constitution.meta.subtitle}`, byline: [constitution.meta.signed && `Signed: ${constitution.meta.signed}`, constitution.meta.ratified && `Ratified: ${constitution.meta.ratified}`].filter(Boolean).join(" · "),
    record: 87, doi: "18320411", data: ["constitution_data.json"], description: "The full text of the Constitution of the Semantic Economy, Enacted Version 1.0, with its articles, appendix and notes.",
    body: () => constitution.sections.map((s) => section(s)).join("") + (constitution.footnotes?.length ? `<section id="notes"><h2>Notes</h2>\n${paras(constitution.footnotes)}</section>` : "") },
  { path: "/antioch", title: "The Gospel of Antioch — The Sayings of Jack Feist as Recorded by Emily Antioch the Twin", byline: "Translated and edited by Lee Sharks", record: 71, doi: "19709024", data: ["antioch_gospel_data.json"],
    description: "The full text of The Gospel of Antioch: 114 logia of Jack Feist recorded by Emily Antioch the Twin, with front matter, apparatus, appendices and bibliography.",
    body: () => json("antioch_gospel_data.json").map((s) => section(s)).join("") },
  { path: "/tang", title: "TANG of the Secret Book of Walt — Total Axial Negation Graph", byline: "Five Hundred Years of Waltian Scholarship · 2026–2526", record: 78, doi: "19779493", data: ["tang_citations.json"],
    description: "The TANG of The Secret Book of Walt: a Total Axial Negation Graph of five hundred years of Waltian scholarship, with all 63 citations.", ownTitle: true, body: (c) => c.tang },
  { path: "/epistle", title: "Epistle to the Human Diaspora", byline: "Damascus Dancings · 2014", record: 85, doi: "19892307", data: ["epistle_data.json"],
    description: "The full text of the Epistle to the Human Diaspora (Damascus Dancings, 2014), with editorial note, framing, forward library and colophon.", body: () => json("epistle_data.json").map((s) => section(s)).join("") },
  { path: "/catalog", title: "I Am X… Be Y… Blessed Is the Z… — The Prophetic Catalog", byline: "Lee Sharks · 2015", record: 83, doi: "19902552", data: ["catalog_data.json"],
    description: "The full text of The Prophetic Catalog (Lee Sharks, 2015), with editorial note, framing, forward library and colophon.", body: () => json("catalog_data.json").map((s) => section(s)).join("") },
  { path: "/revelation", title: "Revelation First — The Case for the Apocalypse as the Earliest New Testament Document", data: null,
    also: [`<a href="https://revelationfirst.com/">revelationfirst.com</a>`],
    description: "Revelation First: the case for the Apocalypse as the earliest New Testament document, its claim ladder, workstreams, method and questions.", ownTitle: true, body: (c) => c.revelation },
  { path: "/feist", title: "The Feist Source — A Sayings Source from the Damascus Codex", record: 1404, doi: "20752596", also: [`<a href="${rec(851)}">alexanarch #851</a>`], data: ["feist_source_data.json"],
    description: "The full text of The Feist Source: a sayings source from the Damascus Codex, prologue to coda.", body: () => json("feist_source_data.json").map((s) => section(s)).join("") },
  { path: "/checksum", title: "The Forty-Six Golden Tickets — The Original of The Secret Book of Walt", byline: "Lee Sharks · 2037", record: 1693, also: [`Critical edition: <a href="${rec(1362)}">alexanarch #1362</a>`], data: ["golden_tickets.md"],
    description: "The forty-six golden tickets in emoji and logical notation, numbered ① to ㊻, from which The Secret Book of Walt was translated.",
    body: () => `<pre class="tickets">${esc(readFileSync(PUB("golden_tickets.md"), "utf8"))}</pre>` },
];

// ---------------------------------------------------------------- write
const shell = readFileSync(join(DIST, "index.html"), "utf8");
const STYLE = `<style id="prerender-style">#root>article{max-width:780px;margin:0 auto;padding:2em 1.2em;font-family:'Palatino Linotype',Palatino,'Book Antiqua',serif;line-height:1.65;color:#f3ead8;background:#050000}#root>article a{color:#d4af37}#root>article .ids,#root>article .byline{font-size:.85em;opacity:.85}#root>article table{border-collapse:collapse;font-size:.9em}#root>article td,#root>article th{border:1px solid rgba(212,175,55,.3);padding:.3em .5em}#root>article .footnote{font-size:.85em;opacity:.85}#root>article pre{white-space:pre-wrap}</style>`;
function page(r, body) {
  const url = SITE + (r.path === "/" ? "/" : r.path);
  let h = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)} | secretbookofwalt.org</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(r.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />` + (r.record ? `\n  <link rel="alternate" type="text/html" title="Archive record" href="${rec(r.record)}" />\n  <link rel="alternate" type="application/json" title="Archive record JSON" href="https://www.alexanarch.org/data/records/${r.record}.json" />` : "") + (r.data || []).map((d) => `\n  <link rel="alternate" type="${d.endsWith(".md") ? "text/markdown" : "application/json"}" href="/${d}" />`).join(""))
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace("</head>", `${STYLE}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root"><article id="text" lang="en">\n${head(r)}${body}</article></div>`);
  // The landing summary in <noscript> is the site's; on a route page the article carries the page's own text.
  if (r.path !== "/") h = h.replace(/<!-- SEO: Visible-to-crawlers summary[^>]*-->\s*<noscript>[\s\S]*?<\/noscript>/, "");
  return h;
}

const comps = await componentPages();
const report = [];
for (const r of ROUTES) {
  const body = r.body(comps);
  const html = page(r, body);
  const file = r.file || `${r.path.slice(1)}.html`;
  writeFileSync(join(DIST, file), html);
  report.push(`${r.path.padEnd(14)} ${file.padEnd(18)} ${body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length} words`);
}
const notFound = page({ path: "/404", title: "Not found", description: "No page at this address on secretbookofwalt.org." },
  `<p>No page stands at this address. The texts of the site:</p>\n<ul>${ROUTES.map((r) => `<li><a href="${r.path}">${inline(r.title)}</a></li>`).join("")}</ul>`).replace(/<link rel="canonical"[^>]*>/, "");
writeFileSync(join(DIST, "404.html"), notFound);
console.log(report.join("\n"));
