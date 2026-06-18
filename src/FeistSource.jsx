import { useState, useEffect, useCallback } from "react";

const C = {
  gold: "#D4AF37", goldDim: "#a08050", goldDark: "#6a4a2a",
  crimson: "#DC143C", crimsonDark: "#8b0a1e",
  beige: "#F5F5DC", hornWhite: "#FFFAF0",
  dark: "#0a0000", darkDeep: "#050000",
  veilText: "#f0ede8", fnColor: "#c8a050",
};

/* ─── SUPERSCRIPT PATTERN ─── */
const FN_RE = /(?<![A-Za-z])([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g;

/* ─── PROSE WITH FOOTNOTE MARKERS ─── */
function Prose({ text, onFnClick }) {
  // Apply emphasis first
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Split on footnote markers and render with clickable superscripts
  const parts = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(FN_RE.source, "g");

  while ((match = re.exec(html)) !== null) {
    // Check if preceded by a letter (disambiguation rule)
    if (match.index > 0 && /[A-Za-z]/.test(html[match.index - 1])) continue;

    if (match.index > lastIndex) {
      parts.push({ type: "text", content: html.slice(lastIndex, match.index) });
    }
    parts.push({ type: "fn", id: match[1] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < html.length) {
    parts.push({ type: "text", content: html.slice(lastIndex) });
  }

  if (parts.length === 0 || (parts.length === 1 && parts[0].type === "text")) {
    return (
      <p style={{
        marginBottom: 6, fontSize: "clamp(0.83rem, 2.1vw, 0.94rem)",
        lineHeight: 1.7, color: C.veilText,
      }} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <p style={{
      marginBottom: 6, fontSize: "clamp(0.83rem, 2.1vw, 0.94rem)",
      lineHeight: 1.7, color: C.veilText,
    }}>
      {parts.map((part, i) => {
        if (part.type === "fn") {
          return (
            <sup key={i}
              onClick={() => onFnClick && onFnClick(part.id)}
              style={{
                color: C.fnColor, cursor: "pointer", fontSize: "0.7em",
                fontWeight: "bold", marginLeft: 1,
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.gold}
              onMouseLeave={e => e.currentTarget.style.color = C.fnColor}
            >{part.id}</sup>
          );
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: part.content }} />;
      })}
    </p>
  );
}

/* ─── FOOTNOTE BODY ─── */
function FootnoteBody({ text, isOpen }) {
  if (!isOpen) return null;
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return (
    <div style={{
      marginLeft: 12, padding: "6px 12px", marginBottom: 8,
      borderLeft: "2px solid rgba(212,175,55,0.3)",
      fontSize: "0.78rem", lineHeight: 1.5, color: C.fnColor,
      fontStyle: "italic", animation: "fadeIn 0.2s ease",
    }} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/* ─── SECTION ─── */
function Section({ section, isOpen, toggle, openFns, toggleFn }) {
  const title = section.title || "";
  const num = section.num || 0;
  const label = num > 0 ? `§${num}. ${title}` : title;
  const paras = section.paragraphs || [];
  const bodyParas = paras.filter(p => p.type !== "footnote");
  const fnParas = paras.filter(p => p.type === "footnote");

  // Build footnote map
  const fnMap = {};
  for (const fp of fnParas) {
    const id = fp.fn_id || fp.text.match(/^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/)?.[1] || "";
    if (id) fnMap[id] = fp.text.replace(/^[¹²³⁴⁵⁶⁷⁸⁹⁰]+\s*/, "");
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={toggle} style={{
        display: "block", width: "100%", textAlign: "left",
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "inherit", padding: "6px 0",
        color: isOpen ? C.gold : C.goldDim,
        fontSize: "0.9rem", letterSpacing: "0.04em",
        borderBottom: isOpen ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(212,175,55,0.1)",
        transition: "color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.color = C.gold}
      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.color = C.goldDim; }}
      >
        <span style={{ marginRight: 8, fontSize: "0.7rem" }}>{isOpen ? "▼" : "▶"}</span>
        {label}
        {fnParas.length > 0 && <span style={{ marginLeft: 8, fontSize: "0.6rem", color: C.fnColor }}>({fnParas.length} notes)</span>}
      </button>
      {isOpen && (
        <div style={{ padding: "12px 0 12px 8px", animation: "fadeIn 0.3s ease" }}>
          {bodyParas.map((p, pi) => {
            if (p.type === "divider") return <hr key={pi} style={{ border: "none", borderTop: "1px solid rgba(212,175,55,0.15)", margin: "16px 0" }} />;
            return <Prose key={pi} text={p.text} onFnClick={(id) => toggleFn(id)} />;
          })}
          {/* Render footnotes at bottom of section */}
          {Object.keys(fnMap).length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid rgba(200,160,80,0.15)", paddingTop: 8 }}>
              {Object.entries(fnMap).map(([id, body]) => (
                <div key={id}>
                  <button onClick={() => toggleFn(id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: openFns[id] ? C.gold : C.fnColor, fontFamily: "inherit",
                    fontSize: "0.72rem", padding: "2px 0", textAlign: "left",
                  }}>
                    <sup style={{ fontWeight: "bold" }}>{id}</sup>
                    {openFns[id] ? " ▾" : " ▸"}
                  </button>
                  <FootnoteBody text={body} isOpen={!!openFns[id]} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── CHAPTER ─── */
function Chapter({ chapter, openSections, toggleSection, openFns, toggleFn }) {
  const [isOpen, setIsOpen] = useState(false);
  const sections = chapter.sections || [];
  const title = chapter.title || "";
  const num = chapter.num || "";

  if (sections.length === 0) return null;
  const isSingle = sections.length === 1;

  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{
        display: "block", width: "100%", textAlign: "left",
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "inherit", padding: "8px 0",
        color: isOpen ? C.crimson : C.goldDim,
        fontSize: "1rem", fontWeight: "bold",
        letterSpacing: "0.08em", textTransform: "uppercase",
        borderBottom: "1px solid rgba(220,20,60,0.2)",
        transition: "color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.color = C.crimson}
      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.color = C.goldDim; }}
      >
        <span style={{ marginRight: 8, fontSize: "0.7rem" }}>{isOpen ? "▼" : "▶"}</span>
        {num !== "0" && num !== "X" ? `${num}. ` : ""}{title}
      </button>
      {isOpen && (
        <div style={{ paddingLeft: 8, paddingTop: 8 }}>
          {isSingle ? (
            <div style={{ padding: "8px 0" }}>
              {sections[0].paragraphs.filter(p => p.type !== "footnote").map((p, pi) => {
                if (p.type === "divider") return <hr key={pi} style={{ border: "none", borderTop: "1px solid rgba(212,175,55,0.15)", margin: "16px 0" }} />;
                return <Prose key={pi} text={p.text} onFnClick={(id) => toggleFn(id)} />;
              })}
              {/* Footnotes for single-section chapters */}
              {(() => {
                const fns = sections[0].paragraphs.filter(p => p.type === "footnote");
                if (fns.length === 0) return null;
                return (
                  <div style={{ marginTop: 16, borderTop: "1px solid rgba(200,160,80,0.15)", paddingTop: 8 }}>
                    {fns.map((fp, fi) => {
                      const id = fp.fn_id || fp.text.match(/^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/)?.[1] || `fn${fi}`;
                      const body = fp.text.replace(/^[¹²³⁴⁵⁶⁷⁸⁹⁰]+\s*/, "");
                      return (
                        <div key={fi}>
                          <button onClick={() => toggleFn(id)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: openFns[id] ? C.gold : C.fnColor, fontFamily: "inherit",
                            fontSize: "0.72rem", padding: "2px 0", textAlign: "left",
                          }}>
                            <sup style={{ fontWeight: "bold" }}>{id}</sup>
                            {openFns[id] ? " ▾" : " ▸"}
                          </button>
                          <FootnoteBody text={body} isOpen={!!openFns[id]} />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            sections.map((sec, si) => {
              const secKey = `${chapter.key}-${sec.num}`;
              return (
                <Section key={si} section={sec}
                  isOpen={!!openSections[secKey]}
                  toggle={() => toggleSection(secKey)}
                  openFns={openFns} toggleFn={toggleFn}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function FeistSource({ onBack }) {
  const [data, setData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [openFns, setOpenFns] = useState({});

  useEffect(() => {
    fetch("/feist_source_data.json")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData([]));
  }, []);

  const toggleSection = useCallback((key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleFn = useCallback((id) => {
    setOpenFns(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!data) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: C.darkDeep,
      color: C.gold, fontFamily: "'Palatino Linotype', Georgia, serif",
    }}>
      Loading the Damascus Codex...
    </div>
  );

  const frontMatter = data.filter(d => d.kind === "front_matter");
  const chapters = data.filter(d => d.kind === "chapter");

  return (
    <div style={{
      minHeight: "100vh", background: C.darkDeep,
      fontFamily: "'Palatino Linotype', Georgia, serif",
    }}>
      <div style={{ padding: "16px 24px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid rgba(212,175,55,0.3)",
          color: C.goldDim, fontFamily: "inherit", fontSize: "0.75rem",
          padding: "4px 12px", cursor: "pointer", borderRadius: 2,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; e.currentTarget.style.color = C.goldDim; }}
        >← Back to Walt</button>
      </div>

      <div style={{ textAlign: "center", padding: "24px 24px 8px" }}>
        <div style={{ color: C.crimson, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
          The Waltian Scriptural Library · Fifth Text
        </div>
        <h1 style={{
          fontSize: "clamp(1.4rem, 4vw, 2rem)", color: C.gold,
          letterSpacing: "0.06em", marginBottom: 4, fontWeight: "normal",
        }}>THE FEIST SOURCE</h1>
        <p style={{ color: C.goldDim, fontSize: "0.85rem", fontStyle: "italic", marginBottom: 4 }}>
          A Sayings Source from the Damascus Codex
        </p>
        <p style={{ color: "#6a5a40", fontSize: "0.7rem", marginBottom: 24 }}>
          Lee Sharks · Critical apparatus by Rebekah Cranes
        </p>
        <div style={{ color: C.crimson, fontSize: "0.75rem", marginBottom: 8 }}>∮ = 1</div>
        <div style={{
          display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          marginBottom: 24, fontSize: "0.65rem",
        }}>
          <a href="https://doi.org/10.5281/zenodo.20752596" target="_blank" rel="noopener"
             style={{ color: C.goldDim, textDecoration: "none", borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
            Critical Edition</a>
          <a href="https://doi.org/10.5281/zenodo.20752296" target="_blank" rel="noopener"
             style={{ color: C.goldDim, textDecoration: "none", borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
            Entity Resolution</a>
          <a href="https://doi.org/10.5281/zenodo.20753314" target="_blank" rel="noopener"
             style={{ color: C.goldDim, textDecoration: "none", borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
            The Feist Function</a>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 48px" }}>
        {frontMatter.map((fm, fi) => (
          <div key={fi} style={{ marginBottom: 32 }}>
            {fm.paragraphs.map((p, pi) => {
              if (p.type === "heading") return (
                <h2 key={pi} style={{
                  fontSize: "0.95rem", color: C.gold, letterSpacing: "0.06em",
                  borderBottom: "1px solid rgba(212,175,55,0.2)", paddingBottom: 6,
                  marginBottom: 12,
                }}>{p.text}</h2>
              );
              if (p.type === "divider") return <hr key={pi} style={{ border: "none", borderTop: "1px solid rgba(212,175,55,0.15)", margin: "20px 0" }} />;
              return <Prose key={pi} text={p.text} onFnClick={toggleFn} />;
            })}
          </div>
        ))}

        {chapters.map((ch, ci) => (
          <Chapter key={ci} chapter={ch}
            openSections={openSections} toggleSection={toggleSection}
            openFns={openFns} toggleFn={toggleFn}
          />
        ))}

        <div style={{
          textAlign: "center", marginTop: 48, paddingTop: 16,
          borderTop: "1px solid rgba(212,175,55,0.2)",
        }}>
          <div style={{ color: "#6a5a40", fontSize: "0.7rem", marginBottom: 8 }}>
            Crimson Hexagonal Archive · New Human 2: A Distributed Journal of Voice
          </div>
          <div style={{ color: C.crimson, fontSize: "0.8rem" }}>∮ = 1</div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
