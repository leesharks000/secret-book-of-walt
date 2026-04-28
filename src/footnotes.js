/**
 * Footnote system — pure JS helpers.
 *
 * READ docs/FOOTNOTES.md BEFORE MODIFYING THIS FILE.
 *
 * Footnotes in The Secret Book of Walt and The Gospel of Antioch are GLOBALLY
 * numbered across the entire critical edition. The same superscript number can
 * be REFERENCED in any section, but is DEFINED only once. We build a single
 * global map at load time and pass it down.
 *
 * Disambiguation: NOT every Unicode superscript is a footnote. Identifier
 * suffixes on letters (e.g. "G⁴⁶" = Golden Ticket 46) are NOT footnotes.
 * Rule: a superscript run is a footnote reference iff it is NOT immediately
 * preceded by an alphabet letter.
 */

const SUPER_RE_GLOBAL = /([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g;

/**
 * Walks a book's data object and produces a global footnote map.
 *
 *   { '¹': { id, text, sectionKey }, '²': {...}, ..., '¹⁵⁸': {...} }
 *
 * @param {object|array} root  The book data (may be keyed dict of sections OR
 *                             a list of sections — both shapes supported).
 * @returns {object}           Map keyed by superscript ID string.
 */
export function buildGlobalFnMap(root) {
  const map = {};
  if (!root) return map;

  const visit = (node, sectionKey) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, sectionKey ?? `[${i}]`));
      return;
    }
    if (typeof node !== 'object') return;

    // Identify a section: either { paragraphs: [...] } or { verses: [...] } or both
    const myKey = node.key ?? sectionKey;
    if (Array.isArray(node.paragraphs)) {
      node.paragraphs.forEach(p => indexFootnote(p, myKey, map));
    }
    if (Array.isArray(node.verses)) {
      node.verses.forEach(v => indexFootnote(v, myKey, map));
    }

    // Recurse into nested values that may be objects with their own paragraphs/verses
    for (const [k, v] of Object.entries(node)) {
      if (k === 'paragraphs' || k === 'verses' || k === 'text' ||
          k === 'key' || k === 'num' || k === 'title' || k === 'word_count') continue;
      visit(v, myKey);
    }
  };

  visit(root, null);
  return map;
}

function indexFootnote(p, sectionKey, map) {
  if (!p || p.type !== 'footnote') return;
  const text = p.text || '';
  // The leading superscript run = footnote ID.
  const m = text.match(/^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/);
  if (!m) return;
  const id = m[1];
  // Body = everything after the leading id, trimmed of one whitespace.
  const body = text.slice(id.length).replace(/^\s+/, '');
  // First definition wins; later duplicates ignored. (Should not happen with
  // canonical data; if it does, the earlier section is canonical.)
  if (!map[id]) {
    map[id] = { id, text, body, sectionKey };
  }
}

/**
 * Splits text into typed parts: { type: 'text' | 'fn', content?: string, id?: string }.
 *
 * Applies the disambiguation rule: a superscript run preceded by an alphabet
 * letter is treated as part of the surrounding text (not a footnote reference).
 *
 * @param {string} text
 * @returns {Array<{type:'text'|'fn', content?:string, id?:string}>}
 */
export function splitTextWithFootnotes(text) {
  if (!text) return [];
  const parts = [];
  let lastIdx = 0;
  let m;
  // Reset the global regex.
  SUPER_RE_GLOBAL.lastIndex = 0;
  while ((m = SUPER_RE_GLOBAL.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    // Disambiguation: skip if preceded by an alphabet letter.
    const prev = start > 0 ? text[start - 1] : '';
    if (/[A-Za-z]/.test(prev)) {
      // Not a footnote — it stays as text. Advance and continue.
      continue;
    }
    if (start > lastIdx) {
      parts.push({ type: 'text', content: text.slice(lastIdx, start) });
    }
    parts.push({ type: 'fn', id: m[1] });
    lastIdx = end;
  }
  if (lastIdx < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIdx) });
  }
  return parts;
}

/**
 * Returns true iff a string contains at least one footnote-eligible superscript run.
 * Useful for quickly skipping body-text that has no footnotes.
 */
export function hasFootnoteMarkers(text) {
  if (!text) return false;
  SUPER_RE_GLOBAL.lastIndex = 0;
  let m;
  while ((m = SUPER_RE_GLOBAL.exec(text)) !== null) {
    const prev = m.index > 0 ? text[m.index - 1] : '';
    if (!/[A-Za-z]/.test(prev)) return true;
  }
  return false;
}
