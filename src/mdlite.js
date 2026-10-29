// The markdown the archive's deposits use, as HTML: headings, rules, tables, lists, numbered items with their numbers
// kept as written, quotations and paragraphs; inline **bold**, *italic*, `code` and [text](url). Shared by the
// /telepathic-prose page in the browser and by scripts/prerender.mjs, so the served text and the app's text are one.
// The text is escaped first; nothing in it is altered.
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, "$1<em>$2</em>");
}

const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

// Heading ids follow the section number where there is one ("## 5. Intertexts" -> s5), else a slug.
const hid = (t) => { const m = t.match(/^(\d+)\.\s/); return m ? `s${m[1]}` : t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };

export function mdToHtml(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out = [], used = new Set();
  const id = (k) => (used.has(k) ? "" : (used.add(k), ` id="${esc(k)}"`));
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
      const n = m[1].length, t = m[2].trim();
      out.push(`<h${n}${id(hid(t))}>${inline(t)}</h${n}>`); i++; continue;
    }
    if (/^-{3,}\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
    if (/^\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const body = rows.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      const [h, ...rest] = body;
      out.push(`<table><thead><tr>${cells(h).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^\s*-\s+/.test(l)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*-\s+/, ""));
      out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`); continue;
    }
    if (/^>\s?/.test(l)) {
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${q.map((x) => `<p>${inline(x)}</p>`).join("")}</blockquote>`); continue;
    }
    if ((m = l.match(/^(\d+)\.\s+(.*)$/))) {
      out.push(`<p class="num"${id("i" + m[1])}><span class="n">${m[1]}. </span>${inline(m[2])}</p>`); i++; continue;
    }
    const p = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|-{3,}\s*$|\||\s*-\s|>|\d+\.\s)/.test(lines[i])) p.push(lines[i++]);
    out.push(`<p>${p.map(inline).join("<br>")}</p>`);
  }
  return out.join("\n");
}
