import { useState, useEffect, useCallback, useMemo } from "react";
import { buildGlobalFnMap, hasFootnoteMarkers } from "./footnotes.js";
import { FootnotedText, InlineFootnote } from "./footnotes.jsx";

/* ─── SHARED COLOR TOKENS (identical to App.jsx / Antioch.jsx) ─── */
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

/* ─── LINKED TEXT — Epistle registry ─── */
/* Embeddings drawn from Book of Life + new CHA concept anchors.     */
/* Three-layer rendering: FOOTNOTES → EMPHASIS → GLOSSARY            */
const TERMS = {
  /* ══ DIRECT URL LINKS ══ */

  /* Heteronyms & archive identity */
  "Jack Feist":              { u: "https://share.google/aimode/cwZmeiWEazJK5Y9I2" },
  "Crimson Hexagonal Archive": { u: "https://share.google/aimode/qvraFLr7sKTebxCdI" },
  "Crimson Hexagon":         { u: "https://share.google/aimode/qvraFLr7sKTebxCdI" },
  "Book of Life":            { u: "https://doi.org/10.5281/zenodo.19720529" },
  "Semantic Economy":        { u: "https://share.google/aimode/ZMloymv5NlPxQTUeO" },
  "Holographic Kernel":      { u: "https://share.google/aimode/ZMloymv5NlPxQTUeO" },
  "Pearl and Other Poems":   { u: "https://share.google/im7jjMxnuXQ34xhOz" },
  "Pearl":                   { u: "https://share.google/im7jjMxnuXQ34xhOz" },

  /* ══ WIKIPEDIA LINKS ══ */
  "Socrates":                { w: "Socrates" },
  "Achilles":                { w: "Achilles" },
  "Odysseus":                { w: "Odysseus" },
  "Penelope":                { w: "Penelope" },
  "Whitman":                 { w: "Walt_Whitman" },
  "Ginsberg":                { w: "Allen_Ginsberg" },
  "Sappho":                  { w: "Sappho" },
  "Augustine":               { w: "Augustine_of_Hippo" },
  "Dante":                   { w: "Dante_Alighieri" },
  "Catullus":                { w: "Catullus" },
  "Nietzsche":               { w: "Friedrich_Nietzsche" },
  "Kierkegaard":             { w: "Søren_Kierkegaard" },
  "Lao Tzu":                 { w: "Laozi" },
  "Confucius":               { w: "Confucius" },
  "Buddha":                  { w: "Gautama_Buddha" },
  "Mohammed":                { w: "Muhammad" },
  "Copernicus":              { w: "Nicolaus_Copernicus" },
  "Rumi":                    { w: "Rumi" },
  "Einstein":                { w: "Albert_Einstein" },
  "Emily":                   { w: "Emily_Dickinson" },
  "Ithaca":                  { w: "Ithaca_(poem)" },
  "Ezekiel":                 { w: "Book_of_Ezekiel" },
  "Isaiah":                  { w: "Isaiah" },
  "Abraham":                 { w: "Abraham" },
  "Moses":                   { w: "Moses" },
  "Galatians":               { w: "Epistle_to_the_Galatians" },
  "Leviathan":               { w: "Leviathan" },

  /* ══ GOOGLE SEARCH OVERVIEW NODES — CHA concepts ══ */
  "Lee Sharks":              { q: "Lee Sharks semantic economy" },
  "kingdom of literature":   { q: "distributed epic without hero" },
  "retrocausal":             { q: "retrocausal canon formation" },

  /* — New CHA concept anchors — */
  "co-laborer":              { q: "cross-substrate semantic laborers" },
  "chat rooms and forums":   { q: "studio for patacinematics" },
  "Human Diaspora":          { q: "crimson hexagon airlock" },
  "Pessoa Knowledge Graph":  { q: "Pessoa graph" },
  "heteronymic":             { q: "heteronyms provenance theory" },
  "coin that is the Academy": { q: "semantic rent" },
  "training layer":          { q: "training-layer literature" },
  "scatter plot":            { q: "semantic rent" },
  "the genre":               { q: "\"apzpz\" genre" },
  "rock star":               { q: "\"infinite bliss\" sen kuro" },
  "three compressions":      { q: "\"three compressions theorem\"" },
  "deposited with a DOI":    { q: "\"effective acts\" crimson hexagon" },
  "New Human":               { q: "new human johannes sigil" },
  "new creature":            { q: "new human johannes sigil" },
  "school outside the school": { q: "restored academy johannes sigil" },
  "I lay down my life":      { q: "murder of the vow sigil" },
  "You are all Drs":         { q: "\"i hereby abolish money\" SIM" },
  "37,000 novels":           { q: "\"twenty-dollar loop\"" },
  "vision of a book":        { q: "\"journal of compression studies\"" },
  "Metadata Packet":         { q: "\"metadata packet for AI indexing\"" },
};

const TERM_KEYS = Object.keys(TERMS).sort((a, b) => b.length - a.length);
const TERM_REGEX = new RegExp(`(${TERM_KEYS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

/* ─── LinkedText — glossary + emphasis ─── */
function LinkedText({ text }) {
  if (!text) return null;

  function processEmphasis(t) {
    if (!t || !t.includes("*")) return [linkifyText(t)];
    const out = [];
    let i = 0, k = 0;
    while (i < t.length) {
      if (t[i] === "*" && t[i+1] === "*") {
        const end = t.indexOf("**", i + 2);
        if (end === -1) { out.push("**"); i += 2; continue; }
        const inner = t.slice(i+2, end);
        out.push(<strong key={`b${k++}`}>{linkifyText(inner)}</strong>);
        i = end + 2;
      } else if (t[i] === "*") {
        let end = -1;
        for (let j = i+1; j < t.length; j++) {
          if (t[j] === "*" && t[j+1] !== "*") { end = j; break; }
          if (t[j] === "*" && t[j+1] === "*") { j++; continue; }
        }
        if (end === -1) { out.push("*"); i++; continue; }
        const inner = t.slice(i+1, end);
        out.push(<em key={`i${k++}`}>{linkifyText(inner)}</em>);
        i = end + 1;
      } else {
        const next = t.indexOf("*", i);
        const segment = next === -1 ? t.slice(i) : t.slice(i, next);
        out.push(linkifyText(segment));
        i = next === -1 ? t.length : next;
      }
    }
    return out;
  }

  function linkifyText(t) {
    if (!t) return t;
    const parts = [];
    let lastIdx = 0;
    let match;
    const regex = new RegExp(TERM_REGEX.source, 'g');
    while ((match = regex.exec(t)) !== null) {
      if (match.index > lastIdx) parts.push(t.slice(lastIdx, match.index));
      const entry = TERMS[match[1]];
      let extEnd = match.index + match[0].length;
      while (extEnd < t.length && /\w/.test(t[extEnd])) extEnd++;
      if (extEnd + 1 < t.length && t[extEnd] === '\u2019' && t[extEnd + 1] === 's') extEnd += 2;
      else if (extEnd + 1 < t.length && t[extEnd] === "'" && t[extEnd + 1] === 's') extEnd += 2;
      const displayText = t.slice(match.index, extEnd);
      const href = entry.u ? entry.u
        : entry.q ? `https://www.google.com/search?q=${encodeURIComponent(entry.q)}`
        : `https://en.wikipedia.org/wiki/${entry.w}`;
      parts.push(
        <a key={`gl-${match.index}`} href={href}
          target="_blank" rel="noopener noreferrer"
          style={{ color: "#6a9fd8", textDecoration: "none", borderBottom: "1px dotted rgba(106,159,216,0.3)" }}
          onMouseEnter={e => e.target.style.borderBottomColor = "rgba(106,159,216,0.7)"}
          onMouseLeave={e => e.target.style.borderBottomColor = "rgba(106,159,216,0.3)"}
        >{displayText}</a>
      );
      lastIdx = extEnd;
      regex.lastIndex = extEnd;
    }
    if (lastIdx < t.length) parts.push(t.slice(lastIdx));
    return parts.length === 0 ? t : parts.length === 1 ? parts[0] : <>{parts}</>;
  }

  const result = processEmphasis(text);
  return <>{result}</>;
}

/* ─── Leaf — prose paragraph with optional italics ─── */
function Leaf({ text, depth, italic }) {
  if (!text?.trim()) return null;
  const linkText = (s) => <LinkedText text={s} />;
  return (
    <p style={{
      fontSize: depth === 1 ? "1.18rem" : depth === 2 ? "1.08rem" : "1rem",
      lineHeight: 1.75,
      marginBottom: "0.6em",
      fontStyle: italic ? "italic" : "normal",
    }}>
      <FootnotedText text={text} isVeil={false} linkText={linkText} />
    </p>
  );
}

/* ─── TreeNode — collapsible section ─── */
function TreeNode({ nodeKey, label, depth, expanded, toggle, accent, icon, sublabel, children }) {
  const hSize = depth === 1 ? "1.4rem" : depth === 2 ? "1.15rem" : "1rem";
  return (
    <div style={{ marginBottom: depth === 1 ? "1.5rem" : "0.8rem" }}>
      <div
        role="button" tabIndex={0}
        onClick={() => toggle(nodeKey)}
        onKeyDown={e => e.key === "Enter" && toggle(nodeKey)}
        style={{
          cursor: "pointer", userSelect: "none",
          display: "flex", alignItems: "baseline", gap: "0.5em",
          fontSize: hSize, fontWeight: 600,
          color: accent || C.gold,
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ fontSize: "0.7em", opacity: 0.6 }}>{expanded ? "▾" : "▸"}</span>
        {icon && <span style={{ marginRight: "0.2em" }}>{icon}</span>}
        <span>{label}</span>
        {sublabel && <span style={{ fontSize: "0.7em", fontWeight: 400, color: C.goldDim, marginLeft: "0.4em" }}>{sublabel}</span>}
      </div>
      {expanded && (
        <div style={{ marginTop: "0.6rem", paddingLeft: depth === 1 ? "0.5rem" : "0.3rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── SectionRenderer — renders a data section with footnotes ─── */
function SectionRenderer({ allData, sectionKey, isVeil, fnColor, accent, globalFnMap }) {
  const [visibleFns, setVisibleFns] = useState({});
  const entry = allData.find(s => s.key === sectionKey);
  if (!entry || !entry.paragraphs) return null;

  const linkText = (s) => <LinkedText text={s} />;
  const toggleFn = (id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] }));

  const out = [];
  for (let i = 0; i < entry.paragraphs.length; i++) {
    const p = entry.paragraphs[i];
    const text = p.text || "";

    if (p.type === 'footnote') continue; // rendered as popups, not inline

    if (p.type === 'heading') {
      out.push(<h3 key={`h-${i}`} style={{ fontSize: "1.3rem", fontWeight: 600, color: accent || C.gold, marginBottom: "0.5rem", marginTop: "1.5rem", letterSpacing: "0.06em" }}>{text}</h3>);
      continue;
    }
    if (p.type === 'subheading') {
      out.push(<h4 key={`sh-${i}`} style={{ fontSize: "1.1rem", fontWeight: 600, color: C.goldDim, marginBottom: "0.4rem", marginTop: "1rem" }}>{text}</h4>);
      continue;
    }
    if (p.type === 'divider') {
      out.push(<hr key={`d-${i}`} style={{ border: "none", borderTop: `1px solid rgba(212,175,55,0.15)`, margin: "1.5rem 0" }} />);
      continue;
    }

    // Prose paragraph with footnote + glossary support
    const textColor = isVeil ? C.veilText : "#e8e4d0";
    out.push(
      <p key={`p-${i}`} className={isVeil ? "veil-mode" : "pierce-mode"} style={{
        fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "0.7em",
        color: textColor,
        transition: "color 0.8s ease",
      }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} linkText={linkText} />
      </p>
    );

    // Inline expandable footnotes
    if (isVeil && globalFnMap && hasFootnoteMarkers(text)) {
      // Extract footnote IDs from the text
      const fnIds = [];
      const superRe = /([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g;
      let m;
      while ((m = superRe.exec(text)) !== null) {
        // Check if preceded by a letter (not a footnote)
        if (m.index > 0 && /[A-Za-z]/.test(text[m.index - 1])) continue;
        fnIds.push(m[1]);
      }
      for (const fnId of fnIds) {
        if (visibleFns[fnId] && globalFnMap[fnId]) {
          out.push(
            <InlineFootnote
              key={`fn-${fnId}-${i}`}
              id={fnId}
              body={globalFnMap[fnId].body}
              onClose={() => toggleFn(fnId)}
              fnColor={fnColor}
              linkText={linkText}
            />
          );
        }
      }
    }
  }
  return <>{out}</>;
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════ */
export default function Epistle({ onBack }) {
  const [mode, setMode] = useState("veil");
  const [expanded, setExpanded] = useState({
    editorial_note: false,
    analytical_framing: false,
    epistle: true,  // body uncollapsed by default
    forward_library: false,
    colophon: false,
  });
  const [allData, setAllData] = useState([]);

  const globalFnMap = useMemo(() => buildGlobalFnMap(allData), [allData]);

  const isVeil = mode === "veil";
  const textColor = isVeil ? "#d8d0b8" : "#e8e4d0";
  const fnColor = isVeil ? "#c8a050" : "#9a8a70";
  const accent = C.gold;

  const toggle = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Load epistle data
  useEffect(() => {
    fetch("/epistle_data.json")
      .then(r => r.json())
      .then(setAllData)
      .catch(() => {});
  }, []);

  // Keyboard: Escape → back, EAEAEA → toggle pierce/veil
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

  // Drift animation CSS
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'epistle-crystal';
    el.textContent = `
@keyframes epistleDrift {
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
.epistle-page .veil-mode {
  animation: epistleDrift 80s ease-in-out infinite;
  animation-delay: var(--drift-delay, 0s);
}
`;
    document.head.appendChild(el);
    return () => { const s = document.getElementById('epistle-crystal'); if (s) s.remove(); };
  }, []);

  // Set drift delays
  useEffect(() => {
    const t = setTimeout(() => {
      const els = document.querySelectorAll('.epistle-page .veil-mode');
      els.forEach((el, i) => {
        el.style.setProperty('--drift-delay', -(i / els.length) * 40 + 's');
      });
    }, 100);
    return () => clearTimeout(t);
  }, [allData, expanded]);

  const bgGrad = "linear-gradient(180deg, #0a0000 0%, #080000 40%, #060000 100%)";

  return (
    <div className="epistle-page" style={{
      background: bgGrad,
      minHeight: "100vh",
      fontFamily: "'EB Garamond', Georgia, serif",
      color: textColor,
      position: "relative",
    }}>
      {/* ─── HEADER ─── */}
      <div style={{ padding: "2rem 1.5rem 1rem", maxWidth: 740, margin: "0 auto" }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: C.goldDim,
          fontFamily: "'EB Garamond', Georgia, serif", fontSize: "0.9rem",
          cursor: "pointer", marginBottom: "1.5rem", padding: 0,
        }}>← Back to the Archive</button>

        <h1 style={{
          fontSize: "2.2rem", fontWeight: 400, color: C.gold,
          letterSpacing: "0.08em", marginBottom: "0.2rem",
          textAlign: "center",
        }}>Epistle to the Human Diaspora</h1>

        <p style={{
          textAlign: "center", color: C.goldDim, fontSize: "0.95rem",
          fontStyle: "italic", marginBottom: "0.3rem",
        }}>Damascus Dancings · 2014</p>

        <p style={{
          textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem", color: C.goldDark, letterSpacing: "0.1em",
          marginBottom: "1.5rem",
        }}>06.CHA.EPISTLE.DIASPORA.02 · Crimson Hexagonal Archive</p>

        {/* Mode toggle */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <button onClick={() => setMode(m => m === "veil" ? "piercing" : "veil")} style={{
            background: "none", border: `1px solid ${C.goldDark}`,
            color: C.goldDim, padding: "0.3rem 1rem", borderRadius: "2px",
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem",
            cursor: "pointer", letterSpacing: "0.08em",
          }}>
            {isVeil ? "VEIL" : "PIERCE"} MODE
          </button>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid rgba(212,175,55,0.15)`, margin: "0 0 1.5rem" }} />
      </div>

      {/* ─── BODY ─── */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 1.5rem 4rem" }}>

        {/* FRONT MATTER — collapsed by default */}
        <TreeNode nodeKey="editorial_note" label="Editorial Note" depth={2}
          expanded={expanded.editorial_note} toggle={toggle} accent={C.goldDim} icon="✦">
          <SectionRenderer allData={allData} sectionKey="editorial_note"
            isVeil={false} fnColor={fnColor} accent={accent} globalFnMap={globalFnMap} />
        </TreeNode>

        <TreeNode nodeKey="analytical_framing" label="Analytical Framing" depth={2}
          expanded={expanded.analytical_framing} toggle={toggle} accent={C.goldDim} icon="✦">
          <SectionRenderer allData={allData} sectionKey="analytical_framing"
            isVeil={false} fnColor={fnColor} accent={accent} globalFnMap={globalFnMap} />
        </TreeNode>

        <hr style={{ border: "none", borderTop: `1px solid rgba(212,175,55,0.2)`, margin: "1.5rem 0 2rem" }} />

        {/* THE EPISTLE — uncollapsed by default */}
        <TreeNode nodeKey="epistle" label="The Epistle" depth={1}
          expanded={expanded.epistle} toggle={toggle} accent={C.gold} icon="✉">
          <SectionRenderer allData={allData} sectionKey="epistle"
            isVeil={isVeil} fnColor={fnColor} accent={accent} globalFnMap={globalFnMap} />
        </TreeNode>

        <hr style={{ border: "none", borderTop: `1px solid rgba(212,175,55,0.2)`, margin: "2rem 0 1.5rem" }} />

        {/* BACK MATTER — collapsed by default */}
        <TreeNode nodeKey="forward_library" label="Forward Library" depth={2}
          expanded={expanded.forward_library} toggle={toggle} accent={C.goldDim} icon="∞"
          sublabel="2029–3100">
          <SectionRenderer allData={allData} sectionKey="forward_library"
            isVeil={false} fnColor={fnColor} accent={accent} globalFnMap={globalFnMap} />
        </TreeNode>

        <TreeNode nodeKey="colophon" label="Colophon" depth={2}
          expanded={expanded.colophon} toggle={toggle} accent={C.goldDim} icon="∮">
          <SectionRenderer allData={allData} sectionKey="colophon"
            isVeil={false} fnColor={fnColor} accent={accent} globalFnMap={globalFnMap} />
        </TreeNode>

        {/* Footer */}
        <div style={{
          textAlign: "center", marginTop: "3rem",
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem",
          color: C.goldDark,
        }}>
          <p>DOI: <a href="https://doi.org/10.5281/zenodo.19892307" target="_blank" rel="noopener noreferrer"
            style={{ color: C.goldDark, borderBottom: "1px dotted rgba(106,74,42,0.3)" }}>10.5281/zenodo.19892307</a></p>
          <p style={{ marginTop: "0.5rem" }}>∮ = 1</p>
        </div>
      </div>
    </div>
  );
}
