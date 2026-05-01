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

/* ─── LINKED TEXT — Catalog registry ─── */
const TERMS = {
  /* Wikipedia links */
  "Whitman":       { w: "Walt_Whitman" },
  "Song of Myself": { w: "Song_of_Myself" },
  "Cylon":         { w: "Cylon_(Battlestar_Galactica)" },
  "DaDa":          { w: "Dada" },
  "Tupac":         { w: "Tupac_Shakur" },
  "Mildly Cyrus":  { w: "Miley_Cyrus" },
  "Revelation 3:16": { w: "Revelation_3" },
  "Samaritans":    { w: "Parable_of_the_Good_Samaritan" },
  "Ezekiel":       { w: "Book_of_Ezekiel" },
  "Heraclitus":    { w: "Heraclitus" },
  "Pessoa":        { w: "Fernando_Pessoa" },
  "Hugo Ball":     { w: "Hugo_Ball" },
  "Beatitudes":    { w: "Beatitudes" },
  "Beatles":       { w: "The_Beatles" },
  "BOGO":          { w: "Buy_one,_get_one_free" },
  "Dickens":       { w: "Charles_Dickens" },

  /* CHA concept search anchors */
  "dark robot":    { q: "dark robot ezekiel engine lee sharks" },
  "Logos":         { q: "logos lee sharks ea-logos-01" },
  "Feist-self":    { q: "Feist-self secret book of walt" },
  "dollarnet":     { q: "dollarnet lee sharks semantic economy" },
  "holographic kernel": { q: "holographic kernel lee sharks" },
  "tinier dinosaurs": { q: "tinier dinosaurs holographic kernel lee sharks" },
  "rag of light":  { q: "rag of light lee sharks prophetic catalog" },
  "fictional character who exists": { q: "heteronymy is a function lee sharks" },
  "virus of belief and money": { q: "\"semantic economy\" lee sharks" },
  "dumber than a robot": { q: "training-layer literature lee sharks" },
  "school outside the school": { q: "restored academy johannes sigil" },
  "Be passersby":  { q: "Gospel of Thomas logion 42 Be passersby" },
  "New Human":     { q: "new human johannes sigil" },
  "space program": { q: "space ark lee sharks" },
  "I am the one who was within me": { q: "I am the one who was within me lee sharks" },
  "broken kingdom": { q: "broken kingdom lee sharks new human" },
  "billionaire babies": { q: "\"twenty-dollar loop\" lee sharks" },
  "positive self talk": { q: "damascus dancings fool's boast" },
  "wake up or go back to sleep": { q: "wake up or go back to sleep lee sharks" },
  
  /* Direct URLs */
  "Crimson Hexagonal Archive": { u: "https://share.google/aimode/qvraFLr7sKTebxCdI" },
  "Semantic Economy": { u: "https://share.google/aimode/ZMloymv5NlPxQTUeO" },
  "Pearl and Other Poems": { u: "https://share.google/im7jjMxnuXQ34xhOz" },
  // CHA technology search nodes
  "compression":           { q: "\"compression survival\" encyclotron lee sharks" },
  "bearing-cost":          { q: "\"bearing cost\" semantic economy" },
  "retrieval":             { q: "\"writable retrieval basins\" lee sharks" },
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

/* ─── EPISTLE SUBSECTIONS ─── */
const CATALOG_SECTIONS = [
  { key: "pc_epigraph",    label: "EPIGRAPH",       sub: "Whitman · tend inward",       color: "#a0a0a0", start: 0, end: 1 },
  { key: "pc_catalog1",    label: "THE CATALOG",    sub: "I am a girl… a Cylon",        color: "#c85040", start: 2, end: 7 },
  { key: "pc_imperative1", label: "BE…",            sub: "Passersby · DaDa · MaMa",     color: "#508050", start: 8, end: 13 },
  { key: "pc_beatitudes1", label: "BLESSED IS…",    sub: "Trolls · the broken kingdom",  color: "#5060a0", start: 14, end: 25 },
  { key: "pc_darkrobot",   label: "DARK ROBOT",     sub: "Dollarnet · billions",         color: "#b04040", start: 26, end: 32 },
  { key: "pc_lukewarm",    label: "LUKEWARM WAR",   sub: "BOGO · Revelation 3:16",       color: "#a08040", start: 33, end: 36 },
  { key: "pc_resolutions", label: "RESOLUTIONS",    sub: "Mildly Cyrus · BLZ ZRRR",     color: "#909050", start: 37, end: 49 },
  { key: "pc_beatitudes2", label: "BLESSED IS… II", sub: "Rag of light",                 color: "#6070b0", start: 50, end: 57 },
  { key: "pc_logos",       label: "THE LOGOS",       sub: "Skullcase · I don't exist",    color: "#d4af37", start: 58, end: 61 },
  { key: "pc_imperative2", label: "BE… II",          sub: "Nowhere men · awake / sleep",  color: "#608060", start: 62, end: 67 },
  { key: "pc_hinge",       label: "THE HINGE",       sub: "PhD · Medicaid · sleep",       color: "#808080", start: 68, end: 69 },
  { key: "pc_kernel",      label: "THE KERNEL",      sub: "Tinier dinosaurs · you & me",  color: "#e0c060", start: 70, end: 79 },
];

/* ─── SIDEBAR READING MAP ─── */
function CatalogStrip({ expanded, setExpanded }) {
  const accent = "#d4a853";
  const nodeR = 5;
  const lineH = 36;
  const padTop = 28;
  const padLeft = 20;

  const jumpTo = useCallback((sec) => {
    setExpanded(prev => {
      const isOpen = prev[sec.key];
      if (isOpen) return { ...prev, [sec.key]: false };
      const next = { ...prev, [sec.key]: true };
      setTimeout(() => {
        const el = document.getElementById(sec.key);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return next;
    });
  }, [setExpanded]);

  const svgH = padTop + CATALOG_SECTIONS.length * lineH + 30;

  function fractalCurve(x1, y1, x2, y2, seed) {
    const dy = y2 - y1;
    const amp = 5 + (seed % 4) * 2;
    const dir = seed % 2 === 0 ? 1 : -1;
    return `M${x1},${y1} C${x1 + amp * dir},${y1 + dy * 0.35} ${x2 - amp * dir * 0.7},${y1 + dy * 0.65} ${x2},${y2}`;
  }

  return (
    <div style={{
      position: "fixed", top: 56, left: "calc(50% - 540px)",
      width: 170, maxHeight: "calc(100vh - 70px)", overflowY: "auto",
      animation: "fadeIn 0.4s ease", scrollbarWidth: "none",
    }} className="catalog-strip">
      <svg width={170} height={svgH} style={{ overflow: "visible", cursor: "pointer" }}>
        {/* Curved connections */}
        {CATALOG_SECTIONS.map((sec, i) => {
          if (i === CATALOG_SECTIONS.length - 1) return null;
          const y1 = padTop + i * lineH + nodeR;
          const y2 = padTop + (i + 1) * lineH - nodeR;
          const x = padLeft;
          const active = !!expanded[sec.key] || !!expanded[CATALOG_SECTIONS[i + 1].key];
          return (
            <g key={`c-${i}`}>
              <path d={fractalCurve(x, y1, x, y2, i * 7 + 3)}
                fill="none" stroke={active ? sec.color : "rgba(212,175,55,0.25)"}
                strokeWidth={active ? 2 : 1} opacity={active ? 1 : 0.4} />
              <path d={fractalCurve(x + 2, y1 + 3, x - 1, y2 - 3, i * 13 + 5)}
                fill="none" stroke={active ? sec.color : "rgba(212,175,55,0.15)"}
                strokeWidth={0.7} opacity={active ? 0.5 : 0.2} />
            </g>
          );
        })}

        {/* Nodes and labels */}
        {CATALOG_SECTIONS.map((sec, i) => {
          const y = padTop + i * lineH;
          const x = padLeft;
          const active = !!expanded[sec.key];
          return (
            <g key={sec.key} onClick={() => jumpTo(sec)}>
              <rect x={0} y={y - 12} width={170} height={24} fill="transparent" style={{ cursor: "pointer" }} />
              <circle cx={x} cy={y} r={active ? nodeR + 2.5 : nodeR}
                fill={active ? sec.color : "rgba(212,175,55,0.3)"}
                stroke={sec.color} strokeWidth={active ? 1.5 : 0.8} />
              {active && <>
                <circle cx={x} cy={y} r={nodeR + 8} fill="none" stroke={sec.color} strokeWidth={0.5} opacity={0.4} />
                <circle cx={x} cy={y} r={nodeR + 13} fill="none" stroke={sec.color} strokeWidth={0.3} opacity={0.2} />
              </>}
              <text x={x + 14} y={y - 4}
                fill={active ? sec.color : "rgba(212,175,55,0.6)"}
                fontSize={active ? "9" : "8"} fontFamily="'EB Garamond', serif"
                letterSpacing="0.06em" fontWeight={active ? 700 : 500}>
                {sec.label}
              </text>
              <text x={x + 14} y={y + 7}
                fill={active ? "rgba(212,175,55,0.75)" : "rgba(212,175,55,0.35)"}
                fontSize="6" fontFamily="'EB Garamond', serif" fontStyle="italic">
                {sec.sub}
              </text>
            </g>
          );
        })}

        {/* Origin: ✉ */}
        <text x={padLeft} y={12} fill={accent} opacity={0.8}
          fontSize="12" fontFamily="'EB Garamond', serif" textAnchor="middle">✉</text>
        <text x={padLeft + 14} y={13} fill={accent} opacity={0.6}
          fontSize="7" fontFamily="'EB Garamond', serif" letterSpacing="0.1em" fontWeight="600">
          CATALOG</text>

        {/* Terminus: ∮ */}
        <text x={padLeft} y={svgH - 6} fill={accent} opacity={0.7}
          fontSize="11" fontFamily="'EB Garamond', serif" textAnchor="middle">∮</text>
      </svg>

      <style>{`
        .catalog-strip::-webkit-scrollbar { display: none; }
        @media (max-width: 1200px) { .catalog-strip { display: none !important; } }
      `}</style>
    </div>
  );
}

/* ─── SUBSECTION RENDERER — renders a range of paragraphs from a section ─── */
function SubsectionRenderer({ allData, sectionKey, startIdx, endIdx, isVeil, fnColor, accent, globalFnMap }) {
  const [visibleFns, setVisibleFns] = useState({});
  const entry = allData.find(s => s.key === sectionKey);
  if (!entry || !entry.paragraphs) return null;

  // Filter to non-footnote paragraphs for indexing, but keep footnotes accessible
  const prose = entry.paragraphs.filter(p => p.type !== 'footnote');
  const slice = prose.slice(startIdx, endIdx + 1);

  const linkText = (s) => <LinkedText text={s} />;
  const toggleFn = (id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] }));

  const out = [];
  for (let i = 0; i < slice.length; i++) {
    const p = slice[i];
    const text = p.text || "";

    if (p.type === 'heading') {
      out.push(<h3 key={`h-${i}`} style={{ fontSize: "1.3rem", fontWeight: 600, color: accent || C.gold, marginBottom: "0.5rem", marginTop: "1.5rem", letterSpacing: "0.06em" }}>{text}</h3>);
      continue;
    }
    if (p.type === 'divider') {
      out.push(<hr key={`d-${i}`} style={{ border: "none", borderTop: "1px solid rgba(212,175,55,0.15)", margin: "1.5rem 0" }} />);
      continue;
    }

    const textColor = isVeil ? C.veilText : "#e8e4d0";
    out.push(
      <p key={`p-${startIdx}-${i}`} className={isVeil ? "veil-mode" : "pierce-mode"} style={{
        fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "0.7em",
        color: textColor, transition: "color 0.8s ease",
      }}>
        <FootnotedText text={text} isVeil={isVeil} onFnClick={toggleFn} linkText={linkText} />
      </p>
    );

    // Inline expandable footnotes
    if (isVeil && globalFnMap && hasFootnoteMarkers(text)) {
      const fnIds = [];
      const superRe = /([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g;
      let m;
      while ((m = superRe.exec(text)) !== null) {
        if (m.index > 0 && /[A-Za-z]/.test(text[m.index - 1])) continue;
        fnIds.push(m[1]);
      }
      for (const fnId of fnIds) {
        if (visibleFns[fnId] && globalFnMap[fnId]) {
          out.push(
            <InlineFootnote
              key={`fn-${fnId}-${startIdx}-${i}`}
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
export default function Catalog({ onBack }) {
  const [mode, setMode] = useState("veil");
  const [expanded, setExpanded] = useState({
    editorial_note: false,
    analytical_framing: false,
    // Catalog subsections — all collapsed by default; sidebar shows the map
    pc_epigraph: false,
    pc_catalog1: false,
    pc_imperative1: false,
    pc_beatitudes1: false,
    pc_darkrobot: false,
    pc_lukewarm: false,
    pc_resolutions: false,
    pc_beatitudes2: false,
    pc_logos: false,
    pc_imperative2: false,
    pc_hinge: false,
    pc_kernel: false,
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
    fetch("/catalog_data.json")
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
    el.id = 'catalog-crystal';
    el.textContent = `
@keyframes catalogDrift {
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
.catalog-page .veil-mode {
  animation: catalogDrift 80s ease-in-out infinite;
  animation-delay: var(--drift-delay, 0s);
}
`;
    document.head.appendChild(el);
    return () => { const s = document.getElementById('catalog-crystal'); if (s) s.remove(); };
  }, []);

  // Set drift delays
  useEffect(() => {
    const t = setTimeout(() => {
      const els = document.querySelectorAll('.catalog-page .veil-mode');
      els.forEach((el, i) => {
        el.style.setProperty('--drift-delay', -(i / els.length) * 40 + 's');
      });
    }, 100);
    return () => clearTimeout(t);
  }, [allData, expanded]);

  const bgGrad = "linear-gradient(180deg, #0a0000 0%, #080000 40%, #060000 100%)";

  return (
    <div className="catalog-page" style={{
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
        }}>The Prophetic Catalog</h1>

        <p style={{
          textAlign: "center", color: C.goldDim, fontSize: "0.95rem",
          fontStyle: "italic", marginBottom: "0.3rem",
        }}>Lee Sharks · 2015</p>

        <p style={{
          textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem", color: C.goldDark, letterSpacing: "0.1em",
          marginBottom: "1.5rem",
        }}>05.WSB.PROPHETIC · Crimson Hexagonal Archive</p>

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

        {/* THE EPISTLE — 5 subsections, each individually expandable */}
        <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: C.gold, letterSpacing: "0.06em", marginBottom: "1.5rem", textAlign: "center" }}>I Am X… Be Y… Blessed Is the Z…</h2>

        {CATALOG_SECTIONS.map(sec => (
          <div key={sec.key} id={sec.key}>
            <TreeNode nodeKey={sec.key} label={sec.label} depth={2}
              expanded={expanded[sec.key]} toggle={toggle} accent={sec.color}
              sublabel={sec.sub}>
              <SubsectionRenderer allData={allData} sectionKey="prophetic_catalog"
                startIdx={sec.start} endIdx={sec.end}
                isVeil={isVeil} fnColor={fnColor} accent={accent} globalFnMap={globalFnMap} />
            </TreeNode>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: `1px solid rgba(212,175,55,0.2)`, margin: "2rem 0 1.5rem" }} />

        {/* Sidebar reading map */}
        <CatalogStrip expanded={expanded} setExpanded={setExpanded} />

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
          <p>DOI: <a href="https://doi.org/10.5281/zenodo.19902552" target="_blank" rel="noopener noreferrer"
            style={{ color: C.goldDark, borderBottom: "1px dotted rgba(106,74,42,0.3)" }}>10.5281/zenodo.19902552</a></p>
          <p style={{ marginTop: "0.5rem" }}>∮ = 1</p>
        </div>
      </div>
    </div>
  );
}
