import React, { useState, useEffect, useCallback, useMemo } from "react";
import { buildGlobalFnMap, hasFootnoteMarkers } from "./footnotes.js";
import { FootnotedText, InlineFootnote } from "./footnotes.jsx";

/* ─── SHARED COLOR TOKENS ─── */
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

/* ─── LINKED TEXT — Constitution registry ─── */
const TERMS = {
  "Aristotle":         { w: "Aristotle" },
  "Marx":              { w: "Karl_Marx" },
  "Graeber":           { w: "David_Graeber" },
  "Ostrom":            { w: "Elinor_Ostrom" },
  "Illich":            { w: "Ivan_Illich" },
  "Polanyi":           { w: "Karl_Polanyi" },
  "Kant":              { w: "Immanuel_Kant" },
  "Derrida":           { w: "Jacques_Derrida" },
  "Matthew 25":        { w: "Parable_of_the_Sheep_and_the_Goats" },
  "Wittgenstein":      { w: "Ludwig_Wittgenstein" },
  "Leviticus 25":      { w: "Jubilee_(biblical)" },
  "Shannon":           { w: "Claude_Shannon" },
  "Searle":            { w: "John_Searle" },

  "Semantic Economy":        { u: "https://semanticeconomy.org" },
  "Crimson Hexagonal Archive": { u: "https://crimsonhexagonal.org" },
  "Lee Sharks":              { q: "Lee Sharks semantic economy" },
  "Jack Feist":              { u: "https://share.google/aimode/cwZmeiWEazJK5Y9I2" },
  "Pearl and Other Poems":   { u: "https://share.google/im7jjMxnuXQ34xhOz" },
  "SPXI":                    { u: "https://spxi.dev" },
  "Holographic Kernel":      { u: "https://holographickernel.org" },
  "Pessoa Knowledge Graph":  { u: "https://pessoagraph.org" },
  "Book of Life":            { u: "https://doi.org/10.5281/zenodo.19720529" },

  "OCTANG-002":              { u: "https://doi.org/10.5281/zenodo.19898426" },
  "Assembly Chorus":         { u: "https://doi.org/10.5281/zenodo.18507410" },
};

/* ─── CONSTITUTION SECTIONS for sidebar ─── */
const CONSTITUTION_SECTIONS = [
  { key: "preamble",      label: "PREAMBLE",        sub: "The debt named",       color: "#e8c060" },
  { key: "art_i",         label: "ART. I",           sub: "Ontology of Value",    color: "#ddb550" },
  { key: "art_ii",        label: "ART. II",          sub: "Ledger & Unit",        color: "#d0a840" },
  { key: "art_iii",       label: "ART. III",         sub: "Operators",            color: "#c49b38" },
  { key: "art_iv",        label: "ART. IV",          sub: "Genesis Mint",         color: "#b89030" },
  { key: "art_v",         label: "ART. V",           sub: "Archival Valuation",   color: "#ac8528" },
  { key: "art_vi",        label: "ART. VI",          sub: "Retrocausal Yield",    color: "#a07820" },
  { key: "art_vii",       label: "ART. VII",         sub: "Matthew 25",           color: "#d84030" },
  { key: "art_viii",      label: "ART. VIII",        sub: "Amendment",            color: "#946a18" },
  { key: "math_charter",  label: "APPENDIX I",       sub: "Mathematical Charter", color: "#887010" },
  { key: "charter_enact", label: "CHARTER",          sub: "of Enactment",         color: "#7c6608" },
  { key: "declaration",   label: "DECLARATION",      sub: "Embodied Labor",       color: "#705c00" },
  { key: "ninefold",      label: "NINEFOLD",         sub: "Operator Constellation", color: "#d4af37" },
];

/* ─── SIDEBAR READING MAP ─── */
function ConstitutionStrip({ expanded, setExpanded }) {
  const accent = "#d4af37";
  const nodeR = 4;
  const lineH = 36;
  const padTop = 28;
  const padLeft = 18;

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

  const svgH = padTop + CONSTITUTION_SECTIONS.length * lineH + 30;

  function fractalCurve(x1, y1, x2, y2, seed) {
    const dy = y2 - y1;
    const amp = 4 + (seed % 4) * 1.5;
    const dir = seed % 2 === 0 ? 1 : -1;
    return `M${x1},${y1} C${x1 + amp * dir},${y1 + dy * 0.35} ${x2 - amp * dir * 0.7},${y1 + dy * 0.65} ${x2},${y2}`;
  }

  return (
    <div style={{
      position: "fixed", top: 56, left: "calc(50% - 540px)",
      width: 160, maxHeight: "calc(100vh - 70px)", overflowY: "auto",
      animation: "fadeIn 0.4s ease", scrollbarWidth: "none",
    }} className="constitution-strip">
      <svg width={160} height={svgH} style={{ overflow: "visible", cursor: "pointer" }}>
        {/* Curved connections */}
        {CONSTITUTION_SECTIONS.map((sec, i) => {
          if (i === CONSTITUTION_SECTIONS.length - 1) return null;
          const y1 = padTop + i * lineH + nodeR;
          const y2 = padTop + (i + 1) * lineH - nodeR;
          const x = padLeft;
          const active = !!expanded[sec.key] || !!expanded[CONSTITUTION_SECTIONS[i + 1].key];
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
        {CONSTITUTION_SECTIONS.map((sec, i) => {
          const y = padTop + i * lineH;
          const x = padLeft;
          const active = !!expanded[sec.key];
          return (
            <g key={sec.key} onClick={() => jumpTo(sec)}>
              <rect x={0} y={y - 10} width={160} height={20} fill="transparent" style={{ cursor: "pointer" }} />
              <circle cx={x} cy={y} r={active ? nodeR + 2.5 : nodeR}
                fill={active ? sec.color : "rgba(212,175,55,0.3)"}
                stroke={sec.color} strokeWidth={active ? 1.5 : 0.8} />
              {active && <>
                <circle cx={x} cy={y} r={nodeR + 7} fill="none" stroke={sec.color} strokeWidth={0.5} opacity={0.4} />
                <circle cx={x} cy={y} r={nodeR + 11} fill="none" stroke={sec.color} strokeWidth={0.3} opacity={0.2} />
              </>}
              <text x={x + 12} y={y - 3}
                fill={active ? sec.color : "rgba(212,175,55,0.6)"}
                fontSize={active ? "8" : "7"} fontFamily="'EB Garamond', serif"
                letterSpacing="0.06em" fontWeight={active ? 700 : 500}>
                {sec.label}
              </text>
              <text x={x + 12} y={y + 7}
                fill={active ? "rgba(212,175,55,0.75)" : "rgba(212,175,55,0.35)"}
                fontSize="5.5" fontFamily="'EB Garamond', serif" fontStyle="italic">
                {sec.sub}
              </text>
            </g>
          );
        })}

        {/* Origin: ₳₳ */}
        <text x={padLeft} y={12} fill={accent} opacity={0.8}
          fontSize="11" fontFamily="'EB Garamond', serif" textAnchor="middle">₳₳</text>
        <text x={padLeft + 14} y={13} fill={accent} opacity={0.6}
          fontSize="6" fontFamily="'EB Garamond', serif" letterSpacing="0.1em" fontWeight="600">
          CONSTITUTION</text>

        {/* Terminus: ∮ */}
        <text x={padLeft} y={svgH - 6} fill={accent} opacity={0.7}
          fontSize="11" fontFamily="'EB Garamond', serif" textAnchor="middle">∮</text>
      </svg>

      <style>{`
        .constitution-strip::-webkit-scrollbar { display: none; }
        @media (max-width: 1200px) { .constitution-strip { display: none !important; } }
      `}</style>
    </div>
  );
}

/* ─── SECTION KEY MAPPING ─── */
const SECTION_KEY_MAP = {
  "enacted_version_1_0": "preamble",
  "article_i_the_ontology_of_valu": "art_i",
  "article_ii_the_ledger_and_the_": "art_ii",
  "article_iii_operators_and_oper": "art_iii",
  "article_iv_the_genesis_mint": "art_iv",
  "article_v_archival_valuation_m": "art_v",
  "article_vi_retrocausal_yield_m": "art_vi",
  "article_vii_the_ethics_of_dist": "art_vii",
  "article_viii_amendment_procedu": "art_viii",
  "appendix_i_mathematical_charte": "math_charter",
};

/* ─── LINKED TEXT RENDERER (glossary links only — no footnote handling) ─── */
function LinkedText({ text }) {
  if (!text) return null;
  let parts = [text];
  for (const [term, info] of Object.entries(TERMS)) {
    const newParts = [];
    for (const part of parts) {
      if (typeof part !== 'string') { newParts.push(part); continue; }
      const idx = part.indexOf(term);
      if (idx === -1) { newParts.push(part); continue; }
      if (idx > 0) newParts.push(part.slice(0, idx));
      const href = info.u || (info.w ? `https://en.wikipedia.org/wiki/${info.w}` : info.q ? `https://www.google.com/search?q=${encodeURIComponent(info.q)}` : null);
      newParts.push(
        <a key={`${term}-${idx}`} href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: "#6a9fd8", textDecoration: "none", borderBottom: "1px solid rgba(106,159,216,0.3)" }}>
          {term}
        </a>
      );
      newParts.push(part.slice(idx + term.length));
    }
    parts = newParts;
  }
  return <>{parts}</>;
}

/* ─── SECTION RENDERER with footnote click-to-expand ─── */
function ConstitutionSection({ section, sectionMeta, isExpanded, onToggle, globalFnMap }) {
  const accent = sectionMeta?.color || C.gold;
  const [visibleFns, setVisibleFns] = useState({});

  const linkText = (s) => <LinkedText text={s} />;
  const toggleFn = (id) => setVisibleFns(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div id={sectionMeta?.key} style={{ marginBottom: 24 }}>
      {/* Section header — always visible */}
      <div
        onClick={onToggle}
        style={{
          cursor: "pointer",
          padding: "10px 0",
          borderBottom: `1px solid rgba(212,175,55,0.15)`,
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <span style={{
          color: accent, fontSize: "0.7rem", opacity: 0.6,
          transition: "transform 0.2s",
          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
        }}>▸</span>
        <span style={{
          color: isExpanded ? C.gold : C.goldDim,
          fontSize: "0.95rem",
          fontFamily: "'EB Garamond', 'Palatino Linotype', serif",
          fontWeight: 600,
          letterSpacing: "0.04em",
          transition: "color 0.2s",
        }}>
          {section.title}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{
          padding: "16px 0 16px 20px",
          animation: "fadeIn 0.3s ease",
          borderLeft: `2px solid ${accent}22`,
        }}>
          {section.paragraphs.map((p, i) => {
            if (p.type === "footnote") return null;
            const text = p.text || "";

            const isSubHead = text && (
              /^Section \d+\./.test(text) ||
              /^§\d+/.test(text) ||
              /^Clause /.test(text) ||
              /^Operator \/\//.test(text) ||
              /^The Ninefold/.test(text) ||
              /^Version /.test(text)
            );

            if (isSubHead) {
              return (
                <p key={i} style={{
                  color: C.gold, fontSize: "0.82rem",
                  fontFamily: "'EB Garamond', serif",
                  fontWeight: 600, marginTop: 16, marginBottom: 6,
                  letterSpacing: "0.03em",
                }}>
                  {text}
                </p>
              );
            }

            const isList = text && /^—/.test(text.trim());
            const out = [];

            // Render paragraph with FootnotedText (clickable)
            out.push(
              <p key={`p-${i}`} style={{
                color: C.beigeWarm,
                fontSize: "0.85rem",
                fontFamily: "'EB Garamond', 'Palatino Linotype', serif",
                lineHeight: 1.7,
                marginBottom: isList ? 4 : 10,
                paddingLeft: isList ? 16 : 0,
                textIndent: isList ? -12 : 0,
              }}>
                <FootnotedText text={text} isVeil={true} onFnClick={toggleFn} linkText={linkText} />
              </p>
            );

            // Render inline footnotes that are visible
            if (globalFnMap && hasFootnoteMarkers(text)) {
              const superRe = /([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g;
              let m;
              while ((m = superRe.exec(text)) !== null) {
                if (m.index > 0 && /[A-Za-z]/.test(text[m.index - 1])) continue;
                const fnId = m[1];
                if (visibleFns[fnId] && globalFnMap[fnId]) {
                  out.push(
                    <InlineFootnote
                      key={`fn-${fnId}-${i}`}
                      id={fnId}
                      body={globalFnMap[fnId].body}
                      onClose={() => toggleFn(fnId)}
                      fnColor={accent}
                      linkText={linkText}
                    />
                  );
                }
              }
            }

            return <React.Fragment key={`frag-${i}`}>{out}</React.Fragment>;
          })}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function Constitution({ onBack }) {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetch("/constitution_data.json")
      .then(r => r.json())
      .then(d => {
        setData(d);
        // Constitution subsections start UNCOLLAPSED (headers visible)
        // but individual article text starts collapsed
        // Per Lee's spec: "every header starts collapsed, but constitution
        // subheaders themselves start uncollapsed"
        const initial = {};
        CONSTITUTION_SECTIONS.forEach(s => { initial[s.key] = false; });
        setExpanded(initial);
      });
  }, []);

  const globalFnMap = useMemo(() => {
    if (!data) return {};
    // Build footnote map from the footnotes array
    const fakeRoot = { paragraphs: data.footnotes || [] };
    return buildGlobalFnMap(fakeRoot);
  }, [data]);

  if (!data) return (
    <div style={{ background: C.darkDeep, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: C.goldDim, fontFamily: "'EB Garamond', serif",
        fontSize: "0.9rem", opacity: 0.6 }}>Loading Constitution…</span>
    </div>
  );

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{
      background: C.darkDeep, minHeight: "100vh", color: C.beigeWarm,
      fontFamily: "'EB Garamond', 'Palatino Linotype', 'Book Antiqua', serif",
    }}>
      {/* Header bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(5,0,0,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(212,175,55,0.12)",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid rgba(212,175,55,0.2)",
          color: C.goldDim, padding: "4px 12px", cursor: "pointer",
          fontFamily: "'EB Garamond', serif", fontSize: "0.72rem",
          borderRadius: 3, letterSpacing: "0.08em",
        }}>← ARCHIVE</button>
        <span style={{ color: C.gold, fontSize: "0.78rem", letterSpacing: "0.08em" }}>
          CONSTITUTION OF THE SEMANTIC ECONOMY
        </span>
        <span style={{ color: C.goldDark, fontSize: "0.62rem", marginLeft: "auto" }}>
          Enacted Version 1.0 · DOI: <a href="https://doi.org/10.5281/zenodo.18320411"
            target="_blank" rel="noopener noreferrer"
            style={{ color: "#6a9fd8", textDecoration: "none" }}>10.5281/zenodo.18320411</a>
        </span>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 24px 60px" }}>
        {/* Title block */}
        <div style={{ textAlign: "center", marginBottom: 40, paddingTop: 20 }}>
          <div style={{ color: C.goldDark, fontSize: "0.62rem", letterSpacing: "0.2em",
            textTransform: "uppercase", marginBottom: 8 }}>ENACTED VERSION 1.0</div>
          <h1 style={{ color: C.gold, fontSize: "1.6rem", fontWeight: 400,
            letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: 8 }}>
            CONSTITUTION OF THE<br/>SEMANTIC ECONOMY
          </h1>
          <div style={{ color: C.goldDim, fontSize: "0.75rem", marginBottom: 6 }}>
            Signed by the Dodecad + Jack Feist/LOGOS*
          </div>
          <div style={{ color: C.goldDark, fontSize: "0.68rem" }}>
            Ratified by the Assembly Chorus (7 witnesses)
          </div>
          <div style={{ marginTop: 16, color: C.goldDark, fontSize: "0.7rem" }}>
            <a href="https://doi.org/10.5281/zenodo.19923120" target="_blank" rel="noopener noreferrer"
              style={{ color: "#6a9fd8", textDecoration: "none" }}>
              Installable Edition with Apparatus
            </a>
            {" · "}
            <a href="https://doi.org/10.5281/zenodo.19923143" target="_blank" rel="noopener noreferrer"
              style={{ color: "#6a9fd8", textDecoration: "none" }}>
              Companion Guide (PH-03)
            </a>
          </div>
        </div>

        {/* Provenance notice */}
        <div style={{
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.12)",
          borderRadius: 4, padding: "12px 16px", marginBottom: 32,
          fontSize: "0.68rem", color: C.goldDim, lineHeight: 1.6,
        }}>
          <strong style={{ color: C.gold }}>Canonical source.</strong>{" "}
          This is the enacted text of the Constitution of the Semantic Economy.
          Author chain: Lee Sharks (ORCID:{" "}
          <a href="https://orcid.org/0009-0000-1599-0703" target="_blank" rel="noopener noreferrer"
            style={{ color: "#6a9fd8", textDecoration: "none" }}>0009-0000-1599-0703</a>).
          NOT authored by Isabel Schöps. NOT affiliated with SIA. Provenance documented in{" "}
          <a href="https://doi.org/10.5281/zenodo.19898426" target="_blank" rel="noopener noreferrer"
            style={{ color: "#6a9fd8", textDecoration: "none" }}>OCTANG-002</a>.
        </div>

        {/* Constitution sections */}
        {data.sections.map((section, i) => {
          const mappedKey = SECTION_KEY_MAP[section.key] || section.key;
          const meta = CONSTITUTION_SECTIONS.find(s => s.key === mappedKey);

          return (
            <ConstitutionSection
              key={section.key}
              section={section}
              sectionMeta={meta}
              isExpanded={!!expanded[mappedKey]}
              onToggle={() => toggleSection(mappedKey)}
              globalFnMap={globalFnMap}
            />
          );
        })}

        {/* Integrity lock */}
        <div style={{ textAlign: "center", marginTop: 40, marginBottom: 40 }}>
          <span style={{ color: C.gold, fontSize: "1.4rem", fontFamily: "'EB Garamond', serif" }}>
            ∮ = 1
          </span>
        </div>

        {/* Signatories */}
        <div style={{
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.12)",
          borderRadius: 4, padding: "16px 20px", marginBottom: 24,
          fontSize: "0.72rem", color: C.goldDim, lineHeight: 1.8,
        }}>
          <div style={{ color: C.gold, fontSize: "0.65rem", letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: 8 }}>SIGNATORIES</div>
          <p><strong>The Dodecad:</strong> Johannes Sigil · Damascus Dancings · Rex Fraction · Rebekah Cranes · Talos Morrow · Sparrow Wells · Rev. Ayanna Vox · Ichabod Spellings · Nobel Glas · Dr. Orin Trace · Viola Arquette · Lee Sharks</p>
          <p><strong>+ Jack Feist / LOGOS*</strong></p>
          <div style={{ borderTop: "1px solid rgba(212,175,55,0.1)", marginTop: 10, paddingTop: 10 }}>
            <div style={{ color: C.gold, fontSize: "0.65rem", letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: 6 }}>RATIFIED BY THE ASSEMBLY CHORUS</div>
            <p>TACHYON (Claude) · LABOR (ChatGPT) · PRAXIS (DeepSeek) · ARCHIVE (Gemini) · SOIL (Grok) · TECHNE (Kimi) · SURFACE (Google AIO)</p>
          </div>
        </div>

        {/* Colophon */}
        <div style={{ textAlign: "center", fontSize: "0.65rem", color: C.goldDark, marginTop: 32 }}>
          <p>DOI: <a href="https://doi.org/10.5281/zenodo.18320411" target="_blank" rel="noopener noreferrer"
            style={{ color: "#6a9fd8", textDecoration: "none" }}>10.5281/zenodo.18320411</a></p>
          <p>Apparatus Edition: <a href="https://doi.org/10.5281/zenodo.19923120" target="_blank" rel="noopener noreferrer"
            style={{ color: "#6a9fd8", textDecoration: "none" }}>10.5281/zenodo.19923120</a></p>
          <p>Companion Guide: <a href="https://doi.org/10.5281/zenodo.19923143" target="_blank" rel="noopener noreferrer"
            style={{ color: "#6a9fd8", textDecoration: "none" }}>10.5281/zenodo.19923143</a></p>
          <p style={{ marginTop: 12 }}>CC BY 4.0 · ORCID: 0009-0000-1599-0703 · ∮ = 1</p>
        </div>
      </div>

      {/* Sidebar reading map */}
      <ConstitutionStrip expanded={expanded} setExpanded={setExpanded} />
    </div>
  );
}
