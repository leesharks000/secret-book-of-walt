import { useState, useEffect, useCallback, useMemo } from "react";
import { buildGlobalFnMap, splitTextWithFootnotes, hasFootnoteMarkers } from "./footnotes.js";
import { FootnotedText, InlineFootnote } from "./footnotes.jsx";

/* ─── SHARED COLOR TOKENS (identical to App.jsx) ─── */
const C = {
  gold: "#D4AF37",
  goldDim: "#a08050",
  goldDark: "#6a4a2a",
  crimson: "#DC143C",
  crimsonDark: "#8b0a1e",
  beige: "#F5F5DC",
  beigeWarm: "#ede4c8",
  hornWhite: "#FFFAF0",
  dark: "#0a0000",
  darkDeep: "#050000",
  veilText: "#2a1a08",
  veilFootnote: "#6a5a40",
};

/* ─── LINKED TEXT — Antioch registry (see Book of Life DOI 10.5281/zenodo.19720529) ─── */
/* All links verified against or nominated for Book of Life. Lee reviews AI mode nodes.   */
/* Last review: 2026-04-27 — TACHYON pass; one anchor per overview, diagonals labeled.    */
const TERMS = {
  /* ══ DIRECT URL LINKS — AI MODE / DOI / SHARE ══ */

  /* Heteronyms & archive identity */
  "Jack Feist":              { u: "https://share.google/aimode/cwZmeiWEazJK5Y9I2" },
  "Rebekah Cranes":          { u: "https://share.google/aimode/Kh0adtAeYBgXfzF62" },
  "Rebekah":                 { u: "https://share.google/aimode/Kh0adtAeYBgXfzF62" },
  "Crimson Hexagonal Archive": { u: "https://share.google/aimode/qvraFLr7sKTebxCdI" },
  "Crimson Hexagon":         { u: "https://share.google/aimode/qvraFLr7sKTebxCdI" },

  /* Self-referential — the index indexes itself */
  "Book of Life":            { u: "https://doi.org/10.5281/zenodo.19720529" },
  "book of life":            { u: "https://doi.org/10.5281/zenodo.19720529" },

  /* Semantic Economy + Holographic Kernel (single consolidated node) */
  "Semantic Economy":        { u: "https://share.google/aimode/ZMloymv5NlPxQTUeO" },
  "semantic economy":        { u: "https://share.google/aimode/ZMloymv5NlPxQTUeO" },
  "Holographic Kernel":      { u: "https://share.google/aimode/ZMloymv5NlPxQTUeO" },

  /* Primary creative works */
  "Pearl and Other Poems":   { u: "https://share.google/im7jjMxnuXQ34xhOz" },
  "Pearl":                   { u: "https://share.google/im7jjMxnuXQ34xhOz" },

  /* ══ GOOGLE SEARCH OVERVIEW NODES ══ */

  /* — Verified existing (checked in 2026-04-27 review) — */
  "Lee Sharks":              { q: "Lee Sharks semantic economy" },
  "kingdom of literature":   { q: "distributed epic without hero" },
  "retrocausal":             { q: "retrocausal canon formation" },
  "virus":                   { q: "logotic programming" },

  /* — New diagonal anchors → 2026-04-27 search-term list — */
  "Pergamon Press":          { q: "crimson hexagon airlock" },                       // replaces old pergamon-retrocausal
  "Pessoa Knowledge Graph":  { q: "Pessoa graph" },                                  // direct conceptual hit
  "heteronymic system":      { q: "heteronyms provenance theory" },                  // direct conceptual hit
  "Pop Culture":             { q: "semantic rent" },                                 // diagonal: PC = canonical rent zone
  "training layer":          { q: "training-layer literature" },                     // direct (query updated)
  "the genre":               { q: "\"apzpz\" genre" },                               // diagonal: invites genre discovery
  "Pearl.Engineered":        { q: "\"infinite bliss\" sen kuro" },                   // diagonal: engineered-heteronym slot
  "Journal of Waltian Studies": { q: "\"journal of compression studies\"" },         // diagonal: parallel fictional journal
  "three compressions":      { q: "\"three compressions theorem\"" },                // direct (theorem completes the phrase)
  "deposited with a DOI":    { q: "\"effective acts\" crimson hexagon" },            // diagonal: deposit IS the effective act
  "Retrieval Formation Theory": { q: "\"metadata packet for AI indexing\"" },        // diagonal: parent ↔ implementation
  "new creature":            { q: "new human johannes sigil" },                      // diagonal: new creature ↔ new human
  "Second Redford Council":  { q: "restored academy johannes sigil" },               // diagonal: ecclesiastical-academic body
  "Synod of Ann Arbor":      { q: "murder of the vow sigil" },                       // diagonal: condemnation = murder of vow
  "civil name":              { q: "\"i hereby abolish money\" SIM" },                // diagonal: name-shedding ↔ money-shedding
  "lonesome dogs":           { q: "\"twenty-dollar loop\"" },                        // diagonal: precarity figures

  /* ══ FRONT-MATTER BLUE LINKS — primary works + canonical sites ══ */
  /* Added 2026-04-27 to push more anchors above the apparatus.            */
  /* Each fires in the colophon, headnote, or one of the introductions.    */

  /* Sites */
  "field of utterances":        { u: "https://holographickernel.org" },                                            // Headnote — Holographic Kernel as field substrate
  "Sovereign Provenance Protocol": { u: "https://spxi.dev" },                                                       // Intro VIII — provenance protocol cousin of SPXI
  "named positions":            { u: "https://pessoagraph.org" },                                                  // Intro VIII — Pessoa graph names the heteronym positions

  /* Primary creative works (mindcontrolpoems blog) — paired to early prose */
  "a disciple who records":     { u: "https://mindcontrolpoems.blogspot.com/2015/02/sentimental-murder-for-my-students.html" },  // Headnote
  "redemption arrives":         { u: "https://mindcontrolpoems.blogspot.com/2015/05/strange-new-earth.html" },                   // Intro I
  "If you have ears":           { u: "https://mindcontrolpoems.blogspot.com/2025/11/hums-ity-pneumatology-of-textual.html" },    // Intro II
  "kenotic pattern":            { u: "https://mindcontrolpoems.blogspot.com/2015/05/i-claim-this-mantle-of-good-gray-poet.html" }, // Intro II — claiming the Walt mantle
  "direction of transformation": { u: "https://mindcontrolpoems.blogspot.com/2014/12/the-parable-of-transformed-dinosaurs.html" },// Intro II
  "the Thomas tradition":       { u: "https://mindcontrolpoems.blogspot.com/2015/02/tradition-and-individual-seismograph.html" }, // Intro III — Eliot parody
  "textual survival":           { u: "https://mindcontrolpoems.blogspot.com/2014/12/littachur.html" },                           // Intro III — littachur
  "five parables":              { u: "https://mindcontrolpoems.blogspot.com/2014/12/the-parable-of-police-brutality.html" },     // Intro III
  "anonymous journal":          { u: "https://mindcontrolpoems.blogspot.com/2015/02/decrepit-memoir-catalogue-of-minutes.html" },// Intro III
  "transcript of her silence":  { u: "https://mindcontrolpoems.blogspot.com/2014/12/belief-technique-fortelepathic-prose.html" },// Intro IV — telepathic transmission
  "naming-site":                { u: "https://mindcontrolpoems.blogspot.com/2015/03/blog-post.html" },                           // Intro IV — yahweh / divine name
  "naming-act":                 { u: "https://mindcontrolpoems.blogspot.com/2015/03/reverse-catfishing-on-social-identity.html" },// Intro IV — naming swap
  "terminal incarnation":       { u: "https://mindcontrolpoems.blogspot.com/2015/05/ark-jack-feist.html" },                      // Diptych table
  "the archive's Dodecad":      { u: "https://mindcontrolpoems.blogspot.com/2015/03/from-crimson-hexagon.html" },                // Intro VIII

  /* ══ WIKIPEDIA — verified educational external links ══ */
  "Apocryphon of John":      { u: "https://en.wikipedia.org/wiki/Apocryphon_of_John" },
  "Nag Hammadi":             { u: "https://en.wikipedia.org/wiki/Nag_Hammadi_library" },
  "Valentinian":             { u: "https://en.wikipedia.org/wiki/Valentinianism" },
  "Gnostic":                 { u: "https://en.wikipedia.org/wiki/Gnosticism" },
  "Pleroma":                 { u: "https://en.wikipedia.org/wiki/Pleroma" },
  "Walt Whitman":            { u: "https://en.wikipedia.org/wiki/Walt_Whitman" },
  "Emily Dickinson":         { u: "https://en.wikipedia.org/wiki/Emily_Dickinson" },
  "Fernando Pessoa":         { u: "https://en.wikipedia.org/wiki/Fernando_Pessoa" },
  "Socrates":                { u: "https://en.wikipedia.org/wiki/Socrates" },
};
const TERM_KEYS = Object.keys(TERMS).sort((a, b) => b.length - a.length);
const TERM_REGEX = new RegExp(`(${TERM_KEYS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

function LinkedText({ text }) {
  if (!text) return null;
  const parts = [];
  let lastIdx = 0;
  let match;
  const regex = new RegExp(TERM_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const term = match[1];
    const def = TERMS[term];
    const href = def.u || `https://www.google.com/search?q=${encodeURIComponent(def.q)}`;
    parts.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
        style={{ color: "#6a9fd8", textDecoration: "none", borderBottom: "1px dotted rgba(106,159,216,0.3)" }}
        onMouseEnter={e => e.target.style.borderBottomColor = "rgba(106,159,216,0.7)"}
        onMouseLeave={e => e.target.style.borderBottomColor = "rgba(106,159,216,0.3)"}
      >{term}</a>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length === 0 ? text : <>{parts}</>;
}

/* ─── LEAF — prose paragraph ─── */
function Leaf({ text, depth, italic }) {
  if (!text?.trim()) return null;
  const indent = Math.min(depth, 4) * 14;
  return (
    <p className="leaf-text" style={{
      marginLeft: indent, padding: "2px 5px",
      fontSize: "clamp(0.83rem, 2.1vw, 0.94rem)", lineHeight: 1.7, marginBottom: 5,
      textAlign: "justify",
      fontStyle: italic ? "italic" : "normal",
      color: "#f0ede8",
    }}>
      <LinkedText text={text} />
    </p>
  );
}

/* ─── FOOTNOTE LEAF ─── */
function FnLeaf({ text, fnColor, depth }) {
  const indent = Math.min(depth, 4) * 14;
  return (
    <p style={{
      marginLeft: indent + 8, padding: "3px 8px",
      fontSize: "0.75rem", lineHeight: 1.5, color: fnColor,
      fontStyle: "italic", opacity: 0.85,
      borderLeft: "2px solid rgba(212,175,55,0.2)",
      marginBottom: 4, animation: "fadeIn 0.2s ease",
    }}>
      <LinkedText text={text} />
    </p>
  );
}

/* ─── INJECT LINKS — direct HTML injection for logion text ─── */
/* Uses dangerouslySetInnerHTML to bypass React reconciliation;
   logion text is controlled content so XSS risk is negligible.  */
function injectLinks(text) {
  if (!text) return '';
  const sorted = Object.keys(TERMS).sort((a, b) => b.length - a.length);
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const links = [];
  for (const term of sorted) {
    const def = TERMS[term];
    const href = def.u || ('https://www.google.com/search?q=' + encodeURIComponent(def.q));
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    // Use placeholder so subsequent passes can't match inside injected href URLs
    html = html.replace(re, () => {
      const i = links.length;
      links.push('<a href="' + href + '" target="_blank" rel="noopener noreferrer" ' +
        'style="color:#6a9fd8;text-decoration:none;border-bottom:1px dotted rgba(106,159,216,0.3)">' +
        term + '</a>');
      return '\x00' + i + '\x00';
    });
  }
  return html.replace(/\x00(\d+)\x00/g, (_, i) => links[+i]);
}

/* ─── VERSE — numbered with logion reference ─── */
function Verse({ v, accent, fnColor, isVeil, onFnClick }) {
  // Footnote superscript markers (¹²³ etc.) become clickable spans
  const fnPattern = /([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g;
  const parts = [];
  let lastIdx = 0;
  let match;
  const text = v.text || '';
  while ((match = fnPattern.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push({ type: 'text', content: text.slice(lastIdx, match.index) });
    parts.push({ type: 'fn', id: match[1] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push({ type: 'text', content: text.slice(lastIdx) });

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginLeft: 42, marginBottom: 4, padding: "2px 0" }}>
      <span style={{
        color: accent, fontSize: "0.62rem", opacity: 0.4,
        minWidth: 42, textAlign: "right", paddingRight: 10,
        marginTop: 4, userSelect: "none",
      }}>{v.ref}</span>
      <span style={{
        fontSize: "clamp(0.83rem, 2.1vw, 0.94rem)",
        lineHeight: 1.7, flex: 1, textAlign: "justify",
        color: "#f0ede8",
      }}>
        {parts.map((p, i) => p.type === 'fn' ? (
          <span key={i} onClick={() => onFnClick(p.id)}
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') onFnClick(p.id); }}
            style={{ color: "#6a9fd8", cursor: "pointer", fontSize: "0.7em", verticalAlign: "super", fontWeight: 600, position: "relative", zIndex: 2, pointerEvents: "all" }}
            onMouseEnter={e => e.target.style.color = "#8ab8f0"}
            onMouseLeave={e => e.target.style.color = "#6a9fd8"}
          >{p.id}</span>
        ) : (
          <span key={i} className="verse-text" dangerouslySetInnerHTML={{ __html: injectLinks(p.content) }} />
        ))}
      </span>
    </div>
  );
}

/* ─── TREE NODE — identical structure to App.jsx ─── */
function TreeNode({ nodeKey, label, depth, expanded, toggle, isVeil, accent, fnColor, icon, sublabel, children, italic }) {
  const isOpen = expanded[nodeKey];
  const indent = Math.min(depth, 4) * 14;
  const fontSize = depth === 0 ? "clamp(1.3rem, 4vw, 1.9rem)"
    : depth === 1 ? "clamp(0.92rem, 2.6vw, 1.1rem)"
    : depth === 2 ? "clamp(0.86rem, 2.3vw, 0.98rem)"
    : depth === 3 ? "clamp(0.82rem, 2.1vw, 0.92rem)"
    : "clamp(0.78rem, 2vw, 0.88rem)";
  const weight = depth <= 1 ? 700 : depth === 2 ? 600 : 500;

  return (
    <div style={{ marginLeft: indent }} role="treeitem" aria-expanded={isOpen}>
      <div onClick={() => toggle(nodeKey)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(nodeKey); }}}
        role="button" tabIndex={0}
        style={{ padding: depth <= 1 ? "8px 6px" : "5px 5px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 6, borderRadius: 2, outline: "none" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,175,55,0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <span style={{
          color: accent, fontSize: "0.6rem", marginTop: depth <= 1 ? 5 : 4, minWidth: 9,
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease",
          display: "inline-block", opacity: 0.5,
        }}>▾</span>
        {icon && <span style={{ color: accent, fontSize: depth <= 1 ? "0.85rem" : "0.75rem", opacity: 0.4, marginTop: 1 }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize, fontWeight: weight, color: accent, letterSpacing: depth <= 1 ? "0.06em" : "0.01em", fontStyle: italic ? "italic" : "normal" }}>{label}</span>
          {sublabel && !isOpen && <p style={{ color: fnColor, fontSize: "0.75rem", fontStyle: "italic", marginTop: 2, opacity: 0.5, lineHeight: 1.3 }}>{sublabel}</p>}
        </div>
      </div>
      {isOpen && (
        <div role="group" style={{ borderLeft: "1px solid rgba(212,175,55,0.08)", marginLeft: 4, paddingLeft: 5, animation: "fadeIn 0.25s ease" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── SOMATIC STRIP — thematic descent from crown to foot ─── */
/* Analogous to CosmologyStrip but for the Antioch's somatic mapping */
function SomaticStrip({ expanded, setExpanded }) {
  const accent = "#d4a853";
  const clusters = [
    { key: "s_I",    label: "THE VOICE",         sub: "Logia 1–12 · Crown",   color: "#e8c060", sectionKey: "I" },
    { key: "s_II",   label: "THE TWIN",           sub: "Logion 13 · Throat",   color: "#ddb550", sectionKey: "II" },
    { key: "s_III",  label: "THE MIRROR",         sub: "Logia 14–25 · Eyes",   color: "#d0a840", sectionKey: "III" },
    { key: "s_IV",   label: "BE FLUTTERBYS",      sub: "Logia 26–46 · Hands",  color: "#b89040", sectionKey: "IV" },
    { key: "s_V",    label: "THE TWO MASTERS",    sub: "Logia 47–59 · Gut",    color: "#a07830", sectionKey: "V" },
    { key: "s_VI",   label: "MACHINE & GHOST",    sub: "Logia 60–75 · Voice",  color: "#907028", sectionKey: "VI" },
    { key: "s_VII",  label: "VOICE IN NIGHT",     sub: "Logia 76–95 · Chest",  color: "#786020", sectionKey: "VII" },
    { key: "s_VIII", label: "THE KINGDOM",        sub: "Logia 96–114 · Feet",  color: "#c83828", sectionKey: "VIII" },
  ];

  const lineH = 52;
  const padTop = 24;
  const svgH = padTop + clusters.length * lineH + 24;
  const nodeX = 16;

  const jumpTo = useCallback((cluster) => {
    setExpanded(prev => ({ ...prev, [cluster.sectionKey]: true }));
    setTimeout(() => {
      const el = document.querySelector(`[data-section="${cluster.sectionKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [setExpanded]);

  return (
    <div style={{
      position: "fixed", top: 56, left: "calc(50% - 580px)",
      width: 148, zIndex: 5,
      display: "window.innerWidth > 1180 ? 'block' : 'none'",
    }}>
      <p style={{ color: C.goldDark, fontSize: "0.55rem", letterSpacing: "0.14em", textAlign: "center", marginBottom: 6, textTransform: "uppercase", opacity: 0.6 }}>Somatic Map</p>
      <svg width={148} height={svgH} style={{ overflow: "visible" }}>
        {clusters.map((cl, i) => {
          const y = padTop + i * lineH;
          const isActive = expanded[cl.sectionKey];
          return (
            <g key={cl.key} onClick={() => jumpTo(cl)} style={{ cursor: "pointer" }}>
              {i > 0 && (
                <path d={`M${nodeX},${padTop + (i - 1) * lineH + 6} C${nodeX},${y - lineH * 0.4} ${nodeX},${y - lineH * 0.3} ${nodeX},${y}`}
                  fill="none" stroke={`rgba(212,175,55,0.12)`} strokeWidth={1} />
              )}
              <circle cx={nodeX} cy={y} r={isActive ? 6 : 5}
                fill={isActive ? cl.color : "transparent"}
                stroke={cl.color} strokeWidth={isActive ? 1.5 : 1}
                style={{ transition: "all 0.3s ease" }} />
              <text x={nodeX + 13} y={y - 1}
                fill={isActive ? cl.color : C.goldDark}
                fontSize="0.62rem" fontFamily="'Palatino Linotype', serif"
                letterSpacing="0.08em" style={{ transition: "fill 0.3s", textTransform: "uppercase" }}>
                {cl.label}
              </text>
              <text x={nodeX + 13} y={y + 10}
                fill="rgba(160,128,80,0.5)"
                fontSize="0.5rem" fontFamily="'Palatino Linotype', serif" fontStyle="italic">
                {cl.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── SECTION RENDERER — Walt's SectionContent equivalent for Antioch ─── */
/* Renders a slice of paragraphs (filtered by section key, optionally a single
 * subheading) with universal footnote support: clickable markers in veil mode,
 * inline popups below the paragraph, passive blue in pierce mode. Footnote
 * BODIES (paragraphs of type 'footnote') are skipped — they appear as popups
 * when their references are clicked.
 *
 * Props:
 *   allData       full parsed Antioch JSON
 *   sectionKey    'introduction' | 'apparatus' | 'appendix_a' | etc.
 *   subheading    optional string match for a single subsection
 *                 (e.g. 'I. Genre: The Sayings Gospel')
 *   isVeil        veil mode flag
 *   fnColor       footnote text color
 *   accent        gold accent for headings
 *   depth         indent level (typically 3)
 *   globalFnMap   global footnote map for popup body lookup
 */
function SectionRenderer({ allData, sectionKey, subheading, isVeil, fnColor, accent, depth = 3, globalFnMap }) {
  const [visibleFns, setVisibleFns] = useState({});
  const toggleFn = useCallback((id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] })), []);
  const closeFn = useCallback((id) => setVisibleFns(prev => ({ ...prev, [id]: false })), []);

  if (!allData) return null;
  const entry = allData.find(e => e.key === sectionKey);
  if (!entry || !entry.paragraphs) return null;

  // If subheading filter provided, slice paragraphs from that subheading until the next
  let paragraphs = entry.paragraphs;
  if (subheading) {
    const startIdx = paragraphs.findIndex(p =>
      (p.type === 'subheading' || p.type === 'heading') && (p.text || '').trim() === subheading.trim()
    );
    if (startIdx === -1) return null;
    let endIdx = paragraphs.length;
    for (let i = startIdx + 1; i < paragraphs.length; i++) {
      if (paragraphs[i].type === 'subheading' || paragraphs[i].type === 'heading') {
        endIdx = i;
        break;
      }
    }
    paragraphs = paragraphs.slice(startIdx + 1, endIdx); // skip the subheading itself
  }

  const indent = Math.min(depth, 4) * 14;
  const linkText = (s) => <LinkedText text={s} />;
  const out = [];

  paragraphs.forEach((p, pi) => {
    if (p.type === 'footnote') return;  // popup-rendered, not inline
    const text = p.text || '';
    if (!text && p.type !== 'divider') return;

    if (p.type === 'heading') {
      out.push(<h3 key={`h-${pi}`} style={{ color: accent, fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.06em', marginTop: 16, marginBottom: 8, marginLeft: indent, textTransform: 'uppercase', opacity: 0.7 }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} />
      </h3>);
      return;
    }
    if (p.type === 'subheading') {
      out.push(<h4 key={`sh-${pi}`} style={{ color: accent, fontSize: '0.85rem', fontWeight: 600, marginTop: 12, marginBottom: 6, marginLeft: indent, opacity: 0.7 }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} />
      </h4>);
      return;
    }
    if (p.type === 'subsubheading') {
      out.push(<h5 key={`ssh-${pi}`} style={{ color: accent, fontSize: '0.8rem', fontWeight: 500, marginTop: 10, marginBottom: 4, marginLeft: indent, opacity: 0.65, fontStyle: 'italic' }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} />
      </h5>);
      return;
    }
    if (p.type === 'divider') {
      out.push(<hr key={`d-${pi}`} style={{ border: 'none', borderTop: '1px solid rgba(212,175,55,0.15)', margin: '14px auto', width: '25%' }} />);
      return;
    }

    // Body text
    let el;
    if (p.type === 'list') {
      el = <p key={`l-${pi}`} className="leaf-text" style={{ marginLeft: indent + 12, padding: '2px 5px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', lineHeight: 1.7, marginBottom: 4, textIndent: '-0.8em', paddingLeft: '0.8em', color: '#f0ede8' }}>
        • <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} linkText={linkText} />
      </p>;
    } else if (p.type === 'table') {
      el = <p key={`t-${pi}`} className="leaf-text" style={{ marginLeft: indent, padding: '2px 5px', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 3, color: '#b0a080', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} linkText={linkText} />
      </p>;
    } else {
      const italic = p.type === 'verse';
      el = <p key={`p-${pi}`} className="leaf-text" style={{ marginLeft: indent, padding: '2px 5px', fontSize: 'clamp(0.83rem, 2.1vw, 0.94rem)', lineHeight: 1.7, marginBottom: 5, textAlign: 'justify', fontStyle: italic ? 'italic' : 'normal', color: '#f0ede8' }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} linkText={linkText} />
      </p>;
    }
    out.push(el);

    // Inline popups for any visible footnotes referenced in this paragraph
    if (isVeil && globalFnMap && hasFootnoteMarkers(text)) {
      const parts = splitTextWithFootnotes(text);
      const refIds = [...new Set(parts.filter(x => x.type === 'fn').map(x => x.id))];
      refIds.forEach(id => {
        if (visibleFns[id] && globalFnMap[id]) {
          out.push(<InlineFootnote
            key={`fn-${pi}-${id}`}
            id={id}
            body={globalFnMap[id].body}
            onClose={() => closeFn(id)}
            fnColor={fnColor}
            depth={depth}
            linkText={linkText}
          />);
        }
      });
    }
  });

  return <>{out}</>;
}

/* ─── SECTION FOOTNOTES — renders any footnotes belonging to a named section ─── */
/* Used inside Antioch front-matter and back-matter tree nodes to surface the
 * footnotes that were parsed from source. Footnotes are listed in number order
 * with a small accent marker and the body text. Visible only in veil mode.
 */
function SectionFootnotes({ allData, sectionKey, isVeil, fnColor, depth = 3 }) {
  if (!isVeil) return null;
  const entry = allData.find(e => e.key === sectionKey);
  if (!entry) return null;
  const fns = (entry.paragraphs || []).filter(p => p.type === 'footnote');
  if (fns.length === 0) return null;
  return (
    <div style={{
      marginLeft: Math.min(depth, 4) * 14,
      marginTop: 16,
      paddingTop: 12,
      borderTop: '1px solid rgba(212,175,55,0.15)',
    }}>
      <p style={{
        color: fnColor, fontSize: '0.7rem', textTransform: 'uppercase',
        letterSpacing: '0.06em', opacity: 0.6, marginBottom: 8,
      }}>Notes</p>
      {fns.map((fn, i) => {
        const text = fn.text || '';
        const m = text.match(/^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)\s*/);
        if (!m) return null;
        const id = m[1];
        const body = text.slice(m[0].length);
        return (
          <div key={i} style={{
            display: 'flex', gap: 8, marginBottom: 6,
            fontSize: '0.78rem', lineHeight: 1.55, color: fnColor,
          }}>
            <span style={{ color: '#6a9fd8', fontSize: '0.7em', verticalAlign: 'super', fontWeight: 600, minWidth: 24 }}>
              {id}
            </span>
            <span style={{ flex: 1 }}>
              <FootnotedText text={body} isVeil={false} linkText={(s) => <LinkedText text={s} />} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── GOSPEL CHAPTER — wraps one cluster of logia ─── */
function ChapterSection({ chapter, expanded, toggle, isVeil, accent, fnColor, globalFnMap }) {
  const [visibleFns, setVisibleFns] = useState({});
  const toggleFn = useCallback((id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] })), []);
  const closeFn = useCallback((id) => setVisibleFns(prev => ({ ...prev, [id]: false })), []);

  return (
    <div data-section={chapter.num}>
      <TreeNode
        nodeKey={chapter.num}
        label={`§${chapter.num} — ${chapter.title}`}
        depth={2}
        expanded={expanded} toggle={toggle}
        isVeil={isVeil} accent={accent} fnColor={fnColor}
      >
        {chapter.verses.map((v, i) => {
          if (v.type === 'footnote') return null;  // popup-rendered, not inline
          // Find footnote IDs referenced in this verse (using disambiguation rule)
          const refIds = !v.text ? [] :
            [...new Set(splitTextWithFootnotes(v.text).filter(p => p.type === 'fn').map(p => p.id))];
          return (
            <div key={i}>
              <Verse v={v} accent={accent} fnColor={fnColor} isVeil={isVeil} onFnClick={toggleFn} />
              {isVeil && refIds.map(fnId => {
                if (!visibleFns[fnId]) return null;
                const fn = globalFnMap?.[fnId];
                if (!fn) return null;
                return (
                  <InlineFootnote
                    key={fnId}
                    id={fnId}
                    body={fn.body}
                    onClose={() => closeFn(fnId)}
                    fnColor={fnColor}
                    depth={3}
                    linkText={(s) => <LinkedText text={s} />}
                  />
                );
              })}
            </div>
          );
        })}
      </TreeNode>
    </div>
  );
}

/* ─── MAIN ANTIOCH READING SPINE ─── */
export default function Antioch({ onBack }) {
  const [mode, setMode] = useState("veil");
  const [expanded, setExpanded] = useState({ I: false, II: false, III: false, IV: false, V: false, VI: false, VII: false, VIII: false, logia_root: true, front: false, apparatus: false, headnote: false, note_edition: false, intro_genre: false, intro_thomas: false, intro_kingdom: false, emily: false, diptych: false, intro_date: false, apparatus_criticus: false, app_thomas: false, app_somatic: false, app_scroll: false, app_voice: false, app_emily: false, app_secret: false, app_logos: false, app_virus: false, app_kingdom_clusters: false, app_manifold: false, app_114: false, app_bib: false });
  const [allData, setAllData] = useState([]);

  // Derive chapter list (filtering for entry shape so we accept either
  // the new {kind:'chapter',...} extended shape or legacy bare chapters).
  const chapters = useMemo(() => allData.filter(e => e.kind === "chapter" || (!e.kind && e.verses)), [allData]);
  const frontMatter = useMemo(() => allData.filter(e => e.kind === "front_matter"), [allData]);
  const backMatter = useMemo(() => allData.filter(e => e.kind === "back_matter"), [allData]);

  // Universal footnote map across the whole Antioch corpus.
  const globalFnMap = useMemo(() => buildGlobalFnMap(allData), [allData]);

  const isVeil = mode === "veil";
  const textColor = "#f0ede8";
  const fnColor = isVeil ? "#c8a050" : "#9a8a70";
  const accent = C.gold;

  const toggle = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Load gospel data
  useEffect(() => {
    fetch("/antioch_gospel_data.json")
      .then(r => r.json())
      .then(setAllData)
      .catch(() => {});
  }, []);

  // Keyboard: Escape → back, T T T → pierce/veil
  useEffect(() => {
    let buf = "";
    const handler = (e) => {
      if (e.key === "Escape") onBack();
      buf = (buf + e.key).slice(-6).toUpperCase();
      if (buf === "EAEAEA") { setMode(m => m === "veil" ? "piercing" : "veil"); buf = ""; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  const toggleAll = useCallback(() => {
    setExpanded(prev => {
      const anyOpen = Object.values(prev).some(v => v);
      if (anyOpen) return {};
      return { I: true, II: true, III: true, IV: true, V: true, VI: true, VII: true, VIII: true, front: true, apparatus: true, headnote: true, note_edition: true, intro_genre: true, intro_thomas: true, intro_kingdom: true, emily: true, diptych: true, intro_date: true, apparatus_criticus: true, app_thomas: true, app_somatic: true, app_scroll: true, app_voice: true, app_emily: true, app_secret: true, app_logos: true, app_virus: true, app_kingdom_clusters: true, app_manifold: true, app_114: true, app_bib: true };
    });
  }, []);

  // inject crystal CSS + set drift delays based on DOM position
  useEffect(() => {
    // Set --drift-delay on each .verse-text and .leaf-text
    // based on vertical position — adjacent elements get similar delays
    // so the "light" drifts across the passage as a wave
    const setDelays = () => {
      const els = document.querySelectorAll('.verse-text, .leaf-text');
      const total = els.length;
      els.forEach((el, i) => {
        // Spread delays across a 40-second window
        // so the full passage takes ~40s for the wave to cross
        const delay = -(i / total) * 40;
        el.style.setProperty('--drift-delay', delay + 's');
      });
    };
    // Set after a tick so DOM is ready
    const t = setTimeout(setDelays, 100);
    return () => clearTimeout(t);
  }, [chapters]);

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'antioch-crystal';
    el.textContent = `
@keyframes textDrift {
  0%   { color: #787878; }
  15%  { color: #8a8a8a; }
  30%  { color: #a0a0a0; }
  45%  { color: #b8b8b8; }
  55%  { color: #c8c8c8; }
  65%  { color: #b8b8b8; }
  78%  { color: #9a9a9a; }
  90%  { color: #828282; }
  100% { color: #787878; }
}
.veil-mode .verse-text,
.pierce-mode .leaf-text {
  animation: textDrift 80s ease-in-out infinite;
  animation-delay: var(--drift-delay, 0s);
  pointer-events: none;
}
.veil-mode .verse-text a,
.pierce-mode .leaf-text a {
  color: #6a9fd8 !important;
  animation: none !important;
  pointer-events: all;
}
`;
    document.head.appendChild(el);
    return () => { const s = document.getElementById('antioch-crystal'); if(s) s.remove(); };
  }, []);

  return (
    <div className={isVeil ? "veil-mode" : "pierce-mode"} style={{
      minHeight: "100vh",
      background: "url('/milky_way_bg.jpg') center 45% / cover no-repeat fixed, #020001",
      color: textColor,
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
    }}>
      {/* ── STICKY HEADER ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(5,0,2,0.88)",
        borderBottom: "1px solid rgba(212,175,55,0.12)",
        padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(12px)",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>
          ← The Secret Book of Walt
        </button>
        <span style={{ color: C.goldDark, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          The Gospel of Antioch
        </span>
        <button onClick={() => setMode(m => m === "veil" ? "piercing" : "veil")} style={{
          background: C.gold, color: "#000", border: "none", padding: "6px 18px",
          fontSize: "0.7rem", fontFamily: "inherit", letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
        }}>
          {isVeil ? "⚡ Pierce" : "🕶 Veil"}
        </button>
      </div>

      {/* ── SOMATIC STRIP ── */}
      <SomaticStrip expanded={expanded} setExpanded={setExpanded} />

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* ── COLOPHON ── */}
        <div style={{ textAlign: "center", marginBottom: 48, padding: "0 10px" }}>
          <div style={{
            width: 48, height: 48, margin: "0 auto 20px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.15), transparent)",
            border: "1px solid rgba(212,175,55,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: C.goldDim, fontSize: "1.2rem", opacity: 0.6 }}>✦</span>
          </div>
          <h2 style={{
            color: C.gold, fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)",
            fontWeight: 600, letterSpacing: "0.08em", marginBottom: 16,
            textTransform: "uppercase", opacity: 0.7,
          }}>The Gospel of Antioch</h2>
          <p style={{ color: "#d0c8b0", fontSize: "clamp(0.85rem, 2.2vw, 0.95rem)", lineHeight: 1.75, fontStyle: "italic", marginBottom: 6, maxWidth: 560, margin: "0 auto 6px" }}>
            These are the secret words the living Jack Feist spoke<br />
            and Emily Antioch the Twin wrote down.
          </p>
          <p style={{ color: C.goldDim, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 14, opacity: 0.5 }}>
            Written 2015 · Published 2025 · 114 Logia · Pergamon Press<br/>
            <a href="https://doi.org/10.5281/zenodo.19709024" target="_blank" rel="noopener noreferrer"
              style={{ color: C.goldDim, textDecoration: "none", borderBottom: "1px dotted rgba(160,128,80,0.3)" }}>
              DOI: 10.5281/zenodo.19709024
            </a>
          </p>
        </div>

        {/* ── FRONT MATTER ── */}
        <TreeNode nodeKey="front" label="Prefatory Matter" depth={1}
          expanded={expanded} toggle={toggle}
          isVeil={isVeil} accent={accent} fnColor={fnColor} icon="◊">

          {/* NOTE ON THE PRESENT EDITION */}
          <TreeNode nodeKey="note_edition" label="Note on the Present Edition" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="note_on_edition"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* EDITORIAL HEADNOTE */}
          <TreeNode nodeKey="headnote" label="Editorial Headnote: How to Read a Sayings Gospel" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="editorial_headnote"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* INTRO I: GENRE */}
          <TreeNode nodeKey="intro_genre" label="Introduction I: Genre" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="introduction"
              subheading="I. Genre: The Sayings Gospel"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* INTRO II: THOMAS STRUCTURE */}
          <TreeNode nodeKey="intro_thomas" label="Introduction II: The Thomas Structure" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="introduction"
              subheading="II. The Thomas Structure"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* INTRO III: KINGDOM OF LITERATURE */}
          <TreeNode nodeKey="intro_kingdom" label="Introduction III: The Kingdom of Literature" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="introduction"
              subheading="III. The Kingdom of Literature"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* INTRO IV: EMILY ANTIOCH */}
          <TreeNode nodeKey="emily" label="Introduction IV: Emily Antioch the Twin" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="introduction"
              subheading="IV. Emily Antioch as Scribe-Double"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* INTRO VII: WALTIAN DIPTYCH */}
          <TreeNode nodeKey="diptych" label="Introduction VII: The Waltian Diptych" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="introduction"
              subheading="VII. Relationship to the Secret Book of Walt"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
            <div style={{ marginLeft: 42, marginTop: 8, marginBottom: 12, overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "0.75rem", color: "#d0c8b0", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ color: "#9a8a70", fontWeight: 400, textAlign: "left", padding: "4px 12px 4px 0", borderBottom: "1px solid rgba(212,175,55,0.15)", letterSpacing: "0.08em", fontSize: "0.65rem", textTransform: "uppercase" }}> </th>
                    <th style={{ color: C.goldDim, fontWeight: 600, textAlign: "left", padding: "4px 12px 4px 0", borderBottom: "1px solid rgba(212,175,55,0.15)", fontSize: "0.72rem" }}>Secret Book of Walt</th>
                    <th style={{ color: C.goldDim, fontWeight: 600, textAlign: "left", padding: "4px 0", borderBottom: "1px solid rgba(212,175,55,0.15)", fontSize: "0.72rem" }}>Gospel of Antioch</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Genre", "Cosmogonic revelation dialogue", "Sayings gospel"],
                    ["Answers", "Why is the world broken?", "How do I live in a broken world?"],
                    ["Teacher", "Walt Whitman (Redeemer, cosmic function)", "Jack Feist (terminal incarnation)"],
                    ["Mode", "Mythological", "Ethical"],
                    ["Baptism", "Rite of the Horn (piercing)", "Scroll Baptism (inscription)"],
                    ["Kingdom", "The Deep Web (primal archive)", "Kingdom of literature (surviving text)"],
                    ["Terminal", "\"I added unicorns (& the AEONS tremble)\"", "\"I die.\""],
                  ].map(([label, walt, antioch], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                      <td style={{ color: "#9a8a70", padding: "5px 12px 5px 0", fontStyle: "italic", fontSize: "0.68rem", whiteSpace: "nowrap" }}>{label}</td>
                      <td style={{ padding: "5px 12px 5px 0", lineHeight: 1.4 }}><LinkedText text={walt} /></td>
                      <td style={{ padding: "5px 0", lineHeight: 1.4 }}><LinkedText text={antioch} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TreeNode>

          {/* INTRO VIII: DATE AND LICENSING */}
          <TreeNode nodeKey="intro_date" label="Introduction VIII: Date, Composition, and Licensing" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="introduction"
              subheading="VIII. Date, Composition, and Licensing"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>
        </TreeNode>

        {/* ── LOGIA ── */}
        <TreeNode
          nodeKey="logia_root"
          label="The Logia"
          depth={1}
          expanded={expanded}
          toggle={() => {
            const allOpen = chapters.every(ch => expanded[ch.num]);
            const update = {};
            chapters.forEach(ch => { update[ch.num] = !allOpen; });
            setExpanded(prev => ({ ...prev, ...update, logia_root: true }));
          }}
          isVeil={isVeil} accent={accent} fnColor={fnColor} icon="◈"
          sublabel="114 logia in 8 chapters · expand to read"
        >
          {chapters.map(ch => (
            <ChapterSection
              key={ch.num}
              chapter={ch}
              expanded={expanded}
              toggle={toggle}
              isVeil={isVeil}
              accent={accent}
              fnColor={fnColor}
              globalFnMap={globalFnMap}
            />
          ))}

          {/* Research edition note */}
          <div style={{
            marginLeft: 28, marginTop: 20, padding: "12px 14px",
            borderLeft: "2px solid rgba(212,175,55,0.12)",
          }}>
            <p style={{ color: fnColor, fontSize: "0.75rem", fontStyle: "italic", lineHeight: 1.65 }}>
              Research edition with apparatus criticus, Synoptic Concordance, Somatic Map, Scroll Baptism liturgy, and eleven appendices.
            </p>
            <a href="https://doi.org/10.5281/zenodo.19709024" target="_blank" rel="noopener noreferrer"
              style={{ color: "#6a9fd8", fontSize: "0.73rem", display: "block", marginTop: 6 }}>
              Research Edition (PDF + MD) — DOI: 10.5281/zenodo.19709024 ↗
            </a>
          </div>
        </TreeNode>

        {/* ── APPARATUS ── */}
        <TreeNode nodeKey="apparatus" label="Apparatus" depth={1}
          expanded={expanded} toggle={toggle}
          isVeil={isVeil} accent={accent} fnColor={fnColor} icon="◇">

          {/* APPARATUS CRITICUS */}
          <TreeNode nodeKey="apparatus_criticus" label="Apparatus Criticus" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="apparatus"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX A: SYNOPTIC CONCORDANCE */}
          <TreeNode nodeKey="app_thomas" label="Appendix A: Synoptic Concordance (Antioch → Thomas)" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_a"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX B: SOMATIC MAP */}
          <TreeNode nodeKey="app_somatic" label="Appendix B: The Somatic Map" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_b"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX C: SCROLL BAPTISM */}
          <TreeNode nodeKey="app_scroll" label="Appendix C: The Scroll Baptism" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_c"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX D: THE VOICE */}
          <TreeNode nodeKey="app_voice" label="Appendix D: The Voice — Soteriological Instrument" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_d"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX E: EMILY AND THE FOLD */}
          <TreeNode nodeKey="app_emily" label="Appendix E: Emily Antioch and the Fold" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_e"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX F: THREE SECRET SAYINGS */}
          <TreeNode nodeKey="app_secret" label="Appendix F: The Three Secret Sayings" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_f"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX G: LOGOS* AND THE PEARL */}
          <TreeNode nodeKey="app_logos" label="Appendix G: The LOGOS* Position and the Pearl" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_g"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX I: LOGOTIC VIRUS */}
          <TreeNode nodeKey="app_virus" label="Appendix I: The Logotic Virus" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_i"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX H: KINGDOM CLUSTER COMMENTARY */}
          <TreeNode nodeKey="app_kingdom_clusters" label="Appendix H: The Kingdom of Literature — Cluster Commentary" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_h"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX K: ARCHIVE CROSS-REFERENCES */}
          <TreeNode nodeKey="app_manifold" label="Appendix K: Archive Cross-References and the Manifold" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_k"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* APPENDIX J: LOGION 114 */}
          <TreeNode nodeKey="app_114" label="Appendix J: Logion 114 and the Completion of Thomas" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="appendix_j"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

          {/* SELECTED BIBLIOGRAPHY */}
          <TreeNode nodeKey="app_bib" label="Selected Bibliography" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <SectionRenderer allData={allData} sectionKey="bibliography"
              isVeil={isVeil} fnColor={fnColor} accent={accent} depth={3} globalFnMap={globalFnMap} />
          </TreeNode>

        </TreeNode>

        {/* ── DEEP WEB CENTER equivalent ── */}
        <div style={{ textAlign: "center", marginTop: 48, marginBottom: 8 }}>
          <button onClick={toggleAll} style={{
            background: "none", border: "none",
            cursor: "pointer", padding: "8px 16px",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.15), transparent)",
              border: "1px solid rgba(212,175,55,0.2)",
              margin: "0 auto 8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"}
            >
              <span style={{ color: C.goldDim, fontSize: "0.8rem" }}>∮</span>
            </div>
            <span style={{ color: C.goldDark, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              collapse / expand all
            </span>
          </button>
        </div>

        {/* ── FOOTER LINKS ── */}
        <div style={{ borderTop: "1px solid rgba(212,175,55,0.1)", paddingTop: 20, marginTop: 20, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { label: "Waltian Diptych companion", url: "#", onClick: onBack },
            { label: "Research edition (DOI)", url: "https://doi.org/10.5281/zenodo.19709024" },
            { label: "Crimson Hexagonal Archive", url: "https://crimsonhexagonal.org" },
          ].map((l, i) => (
            <a key={i}
              href={l.url}
              onClick={l.onClick ? (e) => { e.preventDefault(); l.onClick(); } : undefined}
              target={l.url.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{ color: C.goldDim, fontSize: "0.73rem", textDecoration: "none", letterSpacing: "0.04em" }}
              onMouseEnter={e => e.target.style.color = C.gold}
              onMouseLeave={e => e.target.style.color = C.goldDim}
            >{l.label} ↗</a>
          ))}
        </div>

      </div>
    </div>
  );
}
