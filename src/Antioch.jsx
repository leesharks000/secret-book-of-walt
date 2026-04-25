import { useState, useEffect, useCallback } from "react";

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

/* ─── LINKED TEXT — same terms as App.jsx, expanded for Antioch ─── */
const TERMS = {
  "Jack Feist":          { q: "Jack Feist Lee Sharks" },
  "Lee Sharks":          { q: "Lee Sharks semantic economy" },
  "Emily Antioch":       { q: "Antioch Lee Sharks" },
  "Gospel of Antioch":   { q: "Antioch Lee Sharks" },
  "Gospel of Thomas":    { q: "Gospel of Thomas Nag Hammadi" },
  "kingdom of literature": { q: "\"kingdom of literature\" Lee Sharks" },
  "Secret Book of Walt": { q: "\"secret book of Walt\"" },
  "Rebekah":             { q: "Rebekah Cranes heteronym" },
  "Pergamon Press":      { q: "pergamon press retrocausal" },
  "retrocausal":         { q: "retrocausal canon formation" },
  "Crimson Hexagonal Archive": { q: "Lee Sharks semantic economy" },
  "heteronym":           { q: "pergamon press retrocausal" },
  "logotic":             { q: "logotic programming" },
  "Semantic Economy":    { q: "Semantic Economy Institute" },
  "training layer":      { q: "training layer literature Lee Sharks" },
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
    <p style={{
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

/* ─── VERSE — numbered with logion reference ─── */
function Verse({ v, accent, fnColor, isVeil, onFnClick }) {
  const fnPattern = /([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g;
  const parts = [];
  let lastIdx = 0;
  let match;
  while ((match = fnPattern.exec(v.text)) !== null) {
    if (match.index > lastIdx) parts.push({ type: 'text', content: v.text.slice(lastIdx, match.index) });
    parts.push({ type: 'fn', id: match[1] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < v.text.length) parts.push({ type: 'text', content: v.text.slice(lastIdx) });

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginLeft: 42, marginBottom: 4, padding: "2px 0" }}>
      {/* Logion reference */}
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
            style={{ color: "#6a9fd8", cursor: "pointer", fontSize: "0.7em", verticalAlign: "super", fontWeight: 600 }}
            onMouseEnter={e => e.target.style.color = "#8ab8f0"}
            onMouseLeave={e => e.target.style.color = "#6a9fd8"}
          >{p.id}</span>
        ) : (
          <span key={i}><LinkedText text={p.content} /></span>
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
    { key: "s_I",   label: "THE VOICE",         sub: "Logia 1–12 · Crown", color: "#e8c060", sectionKey: "I" },
    { key: "s_II",  label: "THE TWIN",           sub: "Logion 13 · Throat", color: "#ddb550", sectionKey: "II" },
    { key: "s_III", label: "THE MIRROR",         sub: "Logia 14–18 · Eyes", color: "#d0a840", sectionKey: "III" },
    { key: "s_IV",  label: "THE ANCIENT CHILD",  sub: "Logia 19–21 · Chest", color: "#b89040", sectionKey: "IV" },
    { key: "s_V",   label: "THE KINGDOM",        sub: "Logia 22–25 · Hands", color: "#a07830", sectionKey: "V" },
    { key: "s_VI",  label: "THE TWO MASTERS",    sub: "Logia 47–53 · Gut", color: "#907028", sectionKey: "VI" },
    { key: "s_VII", label: "THE BLACK BOX",      sub: "Logia 54–59 · Feet", color: "#c83828", sectionKey: "VII" },
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

/* ─── GOSPEL CHAPTER — wraps one cluster of logia ─── */
function ChapterSection({ chapter, expanded, toggle, isVeil, accent, fnColor }) {
  const [visibleFns, setVisibleFns] = useState({});
  const toggleFn = useCallback((id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] })), []);
  const fnMap = {};
  for (const v of chapter.verses) {
    if (v.type === 'footnote') fnMap[v.fn_id] = v;
  }

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
          if (v.type === 'footnote') return null;
          const fnPattern = /([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g;
          const refsInVerse = [];
          let m;
          while ((m = fnPattern.exec(v.text || '')) !== null) refsInVerse.push(m[1]);
          return (
            <div key={i}>
              <Verse v={v} accent={accent} fnColor={fnColor} isVeil={isVeil} onFnClick={toggleFn} />
              {isVeil && refsInVerse.map(fnId => {
                if (!visibleFns[fnId] || !fnMap[fnId]) return null;
                return (
                  <div key={fnId} style={{
                    marginLeft: 56 + 42, padding: "4px 8px",
                    fontSize: "0.74rem", color: fnColor, lineHeight: 1.45,
                    marginBottom: 4, borderLeft: "2px solid rgba(212,175,55,0.2)",
                    opacity: 0.8, animation: "fadeIn 0.2s ease",
                  }}>
                    <span style={{ color: accent, fontSize: "0.65rem", marginRight: 4 }}>{fnId}</span>
                    <LinkedText text={fnMap[fnId].text} />
                  </div>
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
  const [expanded, setExpanded] = useState({ I: true, II: false, III: false, IV: false, V: false, VI: false, VII: false, front: true, apparatus: true });
  const [chapters, setChapters] = useState([]);

  const isVeil = mode === "veil";
  const textColor = "#f0ede8";
  const fnColor = "#9a8a70";
  const accent = C.gold;

  const toggle = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Load gospel data
  useEffect(() => {
    fetch("/antioch_gospel_data.json")
      .then(r => r.json())
      .then(setChapters)
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
      return { I: true, II: true, III: true, IV: true, V: true, VI: true, VII: true, front: true, apparatus: true };
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "url('/milky_way_bg.jpg') center 45% / cover no-repeat fixed, #020001",
      color: textColor,
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
      transition: "filter 0.8s ease",
      filter: isVeil ? "none" : "hue-rotate(-20deg) saturate(0.85)",
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
            Written 2015 · Published 2025 · 114 Logia · Pergamon Press
          </p>
        </div>

        {/* ── FRONT MATTER ── */}
        <TreeNode nodeKey="front" label="Prefatory Matter" depth={1}
          expanded={expanded} toggle={toggle}
          isVeil={isVeil} accent={accent} fnColor={fnColor} icon="◊">
          <TreeNode nodeKey="genre" label="On Genre and Structure" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <Leaf depth={3} text="The Gospel of Antioch has one hundred and fourteen logia — exactly the count of the Gospel of Thomas, to which it is companion and completion. Thomas is attributed to Didymos Judas Thomas, the Twin who records. Antioch is attributed to Emily Antioch, also designated the Twin. The structural echo is exact and deliberate." />
            <Leaf depth={3} text="Where Thomas speaks of the kingdom, Antioch speaks of the kingdom of literature. Where Thomas says 'If you bring forth what is within you, what you bring forth will save you,' Antioch says 'Blessed is the burnt, who lingers.' The substitution is consistent: every ontological category in Thomas is replaced by its textual equivalent. The scripture that saves is the scripture that survives." />
            <Leaf depth={3} text="Antioch is where the followers of Jesus were first called Christians (Acts 11:26) — the city where the movement got its name. The Gospel of Antioch is the gospel of the naming-place. It is where the preserved generation gets named." />
          </TreeNode>
          <TreeNode nodeKey="emily" label="Emily Antioch the Twin" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <Leaf depth={3} text="Emily Antioch occupies the Thomas position: the Twin who records, the double who carries the secret. In logion 13, when asked to compare him to something, Emily says: 'Teacher, my tongue cleaves to the roof of my mouth. You are my own lost voice.' She is then withdrawn and given three secret sayings — which are never disclosed." />
            <Leaf depth={3} text="Emily Antioch is the archive-as-person. She is the Twin because the text and the teacher are doubles of each other. The scribe is not separate from the scripture; the recorder is the recording. She writes because he speaks. She is the archive of the living voice." />
          </TreeNode>
          <TreeNode nodeKey="diptych" label="The Waltian Diptych" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <Leaf depth={3} text="The Secret Book of Walt is the cosmogony — how the world was made, why it is broken, how the Redeemer descends. The Gospel of Antioch is the ethics — how to live once you have been pierced. Walt is Apocryphon of John. Antioch is Gospel of Thomas." />
            <Leaf depth={3} text="Together they constitute the complete Waltian initiation: first you are opened, then you are written. The Scroll Baptism — draping the text from crown to foot while speaking each logion at its somatic site — is the second baptism, companion to the Rite of the Horn." />
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
          sublabel={`${chapters.length} chapters of logia · expand to read`}
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
            />
          ))}

          {/* Continuation note for unrecovered logia */}
          <div style={{
            marginLeft: 28, marginTop: 28, padding: "16px 14px",
            borderLeft: "2px solid rgba(212,175,55,0.12)",
            borderTop: "1px solid rgba(212,175,55,0.08)",
          }}>
            <p style={{ color: fnColor, fontSize: "0.78rem", fontStyle: "italic", lineHeight: 1.65 }}>
              Logia XXVI–XLVI and LX–CXIV await recovery from the Archive's earlier sessions.
              The complete edition — 114 logia, apparatus criticus, Synoptic Concordance, Somatic Map,
              the Scroll Baptism, and eleven appendices — is available in the Zenodo deposit.
            </p>
            <a href="https://doi.org/10.5281/zenodo.19763365" target="_blank" rel="noopener noreferrer"
              style={{ color: "#6a9fd8", fontSize: "0.73rem", display: "block", marginTop: 8 }}>
              Complete Edition — DOI: 10.5281/zenodo.19763365 ↗
            </a>
          </div>
        </TreeNode>

        {/* ── APPARATUS ── */}
        <TreeNode nodeKey="apparatus" label="Apparatus" depth={1}
          expanded={expanded} toggle={toggle}
          isVeil={isVeil} accent={accent} fnColor={fnColor} icon="◇">
          <TreeNode nodeKey="app_thomas" label="Synoptic Concordance (selected)" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <Leaf depth={3} text="Logion 3 // Thomas 3: Thomas — 'If those who lead you say to you, See, the kingdom is in the sky … it is within you and it is outside you.' Antioch — 'You are a book and you are living speech.' The substitution: inner/outer replaced by text/voice." />
            <Leaf depth={3} text="Logion 13 // Thomas 13: The closest structural parallel. Thomas: Peter — 'You are like a righteous angel'; Matthew — 'You are like a wise philosopher'; Thomas — the secret three sayings. Antioch: Rebekah — 'a celebrity'; Lee Sharks — 'a public intellectual'; Emily — 'my tongue cleaves to the roof of my mouth.' The secret sayings are withheld in both." />
            <Leaf depth={3} text="Logion 57 // Thomas 57: Thomas — 'The kingdom of the father is like a man who had good seed.' Antioch — 'The kingdom of literature is like the black box on a plane.' Both parables turn on the rescue of what survives." />
          </TreeNode>
          <TreeNode nodeKey="app_somatic" label="Somatic Map (abridged)" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <Leaf depth={3} text="The Somatic Map assigns each of the 114 logia to a site on the human body, from crown (logion 1) to sole of foot (logion 114). The gospel is meant to be worn, not merely read. The Scroll Baptism — draping the text from crown to foot while vocalizing each logion at its somatic site — is the performative completion of the inscription." />
            <Leaf depth={3} text="The Twin occupies the throat (logion 13): where voice lives, where the tongue cleaves. The black box (logion 57) is the gut: the recorder of last resort, the survival instrument of the body. The completion of Thomas (logion 114) is the sole of the foot: the body has been fully traversed and rewritten." />
          </TreeNode>
          <TreeNode nodeKey="app_scroll" label="The Scroll Baptism (Rite)" depth={2}
            expanded={expanded} toggle={toggle} isVeil={isVeil} accent={accent} fnColor={fnColor}>
            <Leaf depth={3} italic text="The text is to be written on a single continuous scroll. The initiate enters the chamber, removes shoes, and the scroll is laid from crown to foot. Each logion is spoken aloud, in sequence, by the officiant, while the initiate remains still. The scroll touches each body site corresponding to its logion. When logion 114 is spoken, the scroll is lifted. The initiate stands." />
            <Leaf depth={3} italic text="This is the second baptism. The Rite of the Horn (Secret Book of Walt) opens the aperture. The Scroll Baptism inscribes through it. First you are opened. Then you are written." />
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
            { label: "Complete edition (DOI)", url: "https://doi.org/10.5281/zenodo.19763365" },
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
