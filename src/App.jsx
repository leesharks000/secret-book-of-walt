import { useState, useEffect, useRef, useCallback } from "react";
import waltImg from "./whitman_on_a_dinosaur.jpg";
import milkyWayBg from "./milky_way_bg.jpg";
import hornImg from "./horn_logo.png";

/* ─── COLOR TOKENS ─── */
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

/* ─── SPLASH ─── */
function Splash({ onEnter, imgSrc, hornSrc }) {
  const [phase, setPhase] = useState(0);
  const [souls, setSouls] = useState(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 9200);
    const t2 = setTimeout(() => setPhase(2), 10400);
    const t3 = setTimeout(() => setPhase(3), 11600);
    fetch("/api/count").then(r => r.json()).then(d => setSouls(d.count)).catch(() => {});
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleEnter = () => {
    fetch("/api/count", { method: "POST" })
      .then(r => r.json()).then(d => setSouls(d.count)).catch(() => {})
      .finally(() => onEnter());
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `url('${milkyWayBg}') center center / cover no-repeat fixed, radial-gradient(ellipse at 50% 40%, #12060a 0%, #080004 40%, #020001 70%, #000 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center",
      overflow: "hidden", position: "relative", fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
    }}>
      {/* Subtle edge vignette only — does NOT cover center content */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 50% 45%, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.7) 100%)",
      }} />

      {/* The Cowboy of Time — descends and lands */}
      <div style={{
        perspective: "1000px", perspectiveOrigin: "center center",
        marginBottom: phase >= 1 ? "20px" : "0",
        transition: "margin-bottom 1.5s ease",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          animation: phase === 0 ? "paperMario 9s cubic-bezier(0.08,0.72,0.25,1) forwards" : "none",
          transform: phase >= 1 ? "translateY(0) rotateY(0deg) scale(1)" : undefined,
          transformStyle: "preserve-3d",
        }}>
          <img src={imgSrc} alt="Walt Whitman, Cowboy of Time, astride his dinosaur steed" style={{
            width: "min(260px, 50vw)", height: "auto",
            borderRadius: 4,
            transition: "all 1.5s ease",
          }} />
        </div>
      </div>

      {/* Title — smaller, lower, rises from the footprints */}
      <h1 style={{
        color: C.gold, fontSize: "clamp(1rem, 3.5vw, 1.8rem)", fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center",
        margin: "24px 20px 0",
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 1.5s ease, transform 1.8s cubic-bezier(0.16,1,0.3,1)",
        textShadow: "0 0 50px rgba(212,168,83,0.3), 0 2px 4px rgba(0,0,0,0.9)",
        position: "relative", zIndex: 1,
      }}>The Secret Book of Walt</h1>

      {/* Subtitle */}
      <p style={{
        color: C.goldDim, fontSize: "clamp(0.75rem, 2vw, 1rem)", fontStyle: "italic",
        textAlign: "center", margin: "5px 30px 0",
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "translateY(0)" : "translateY(15px)",
        transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s",
        letterSpacing: "0.04em",
        position: "relative", zIndex: 1,
      }}>Hidden Teachings of Walt Whitman, Cowboy of Time</p>

      <p style={{
        color: C.goldDark, fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)", textAlign: "center",
        margin: "3px 30px 0",
        opacity: phase >= 2 ? 1 : 0,
        transition: "opacity 1s ease 0.5s",
        position: "relative", zIndex: 1,
      }}>Translated from the Original Aramaic-Martian by Lee Sharks</p>

      {/* Unicorn Horn seal + Enter button */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        marginTop: 24,
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 1s ease, transform 1s ease",
        position: "relative", zIndex: 1,
      }}>
        {hornSrc && (
          <img src={hornSrc} alt="The Unicorn Horn" style={{
            width: 56, height: "auto",
            opacity: 0.35,
            filter: "invert(1) sepia(1) saturate(0.3) hue-rotate(10deg) brightness(0.8)",
            marginBottom: 14,
          }} />
        )}
        <button onClick={handleEnter} style={{
          background: "transparent", border: `1px solid ${C.gold}`, color: C.gold,
          padding: "10px 36px", fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
          fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
          letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
          pointerEvents: phase >= 3 ? "auto" : "none",
          transition: "all 0.3s ease",
        }} onMouseEnter={e => { e.target.style.background = "rgba(212,168,83,0.08)"; e.target.style.boxShadow = "0 0 25px rgba(212,168,83,0.15)"; }}
           onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.boxShadow = "none"; }}>
          Enter the Archive
        </button>
      </div>

      {/* Footer: counter + hex */}
      <div style={{
        position: "absolute", bottom: 18, textAlign: "center",
        opacity: phase >= 3 ? 0.5 : 0, transition: "opacity 1s ease 0.5s",
      }}>
        {souls !== null && souls !== "—" && (
          <p style={{
            color: "#3a1a08", fontSize: "0.63rem", fontStyle: "italic",
            letterSpacing: "0.06em", marginBottom: 5,
          }}>{souls} {souls === 1 ? "soul has" : "souls have"} entered the archive</p>
        )}
        <p style={{ color: "#2a1508", fontSize: "0.63rem", letterSpacing: "0.12em" }}>
          06.LIT.GNOSTIC.WALT.01 · Crimson Hexagonal Archive
        </p>
        <p style={{ color: "#1a0a04", fontSize: "0.55rem", letterSpacing: "0.06em", marginTop: 3 }}>
          Background: F. Char/ESO (CC BY 4.0)
        </p>
      </div>
    </div>
  );
}



/* ─── EXPANDABLE TREE ─── */

/* ─── THE HYPOSTATIC TREE ─── */

/* ─── SECTION RENDERER ─── */
function SectionContent({ data, isVeil, fnColor, depth }) {
  if (!data?.paragraphs) return null;
  return data.paragraphs.map((p, pi) => {
    if (p.type === 'heading' || p.type === 'subheading') return null; // handled by tree node
    if (p.type === 'footnote') {
      if (!isVeil) return null;
      return <FnLeaf key={pi} text={p.text} fnColor={fnColor} isVeil={isVeil} depth={depth} />;
    }
    if (p.type === 'divider') return <hr key={pi} style={{ border: 'none', borderTop: `1px solid ${isVeil ? '#c8b898' : '#1a0a04'}`, margin: '16px auto', width: '25%' }} />;
    return <Leaf key={pi} text={p.text} depth={depth} italic={p.type === 'verse'} />;
  });
}

/* ─── THE HYPOSTATIC TREE ─── */
function ReadingSpine({ fullData, treeData, onBack }) {
  const [mode, setMode] = useState("veil");
  const [expanded, setExpanded] = useState({});

  const isVeil = mode === "veil";
  const bg = isVeil ? C.beige : C.dark;
  const textColor = isVeil ? C.veilText : C.hornWhite;
  const fnColor = isVeil ? C.veilFootnote : C.goldDark;
  const accent = isVeil ? C.crimsonDark : C.gold;

  const toggle = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Gospel sections from the original parsed data
  const gospelSections = fullData?.gospel_sections || [];
  const sectionMap = {};
  for (const sec of gospelSections) {
    if (sec.paragraphs?.length > 0) sectionMap[sec.num] = sec;
  }

  const gospelGroups = [
    { key: "emanation", label: "The Emanation", icon: "◈", nums: ["I", "II", "III", "IV", "V"] },
    { key: "cosmos", label: "The Cosmos", icon: "◉", nums: ["VI", "VII", "VIII"] },
    { key: "imprisonment", label: "The Imprisonment", icon: "◇", nums: ["IX"] },
    { key: "piercing", label: "The Piercing", icon: "△", nums: ["X", "XI", "XII"] },
    { key: "melding", label: "The Return", icon: "○", nums: ["XIII", "AW"] },
  ];

  const introSubs = fullData?.intro_subsections || [];

  const appendices = [
    { key: "appendix_a", label: "A. Concordance of Aeons" },
    { key: "appendix_b", label: "B. Structural Parallel to the Apocryphon of John" },
    { key: "appendix_c", label: "C. The Unicorn Horn Soteriology" },
    { key: "appendix_d", label: "D. The Rite of the Horn" },
    { key: "appendix_e", label: "E. The Rule of Biblios" },
    { key: "appendix_f", label: "F. The Creed of the Deep Web" },
    { key: "appendix_g", label: "G. Glossary of Key Terms" },
    { key: "appendix_h", label: "H. The Waltian System" },
    { key: "appendix_i", label: "I. Codicological Table" },
    { key: "appendix_j", label: "J. Liturgical Fragment" },
    { key: "appendix_k", label: "K. Reception History" },
    { key: "bibliography", label: "Selected Bibliography" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: bg, color: textColor,
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Georgia', serif",
      transition: "background 0.8s ease, color 0.8s ease",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: isVeil ? "rgba(245,245,220,0.95)" : "rgba(10,0,0,0.95)",
        borderBottom: `1px solid ${isVeil ? "#d8d0b8" : "#1a0a08"}`,
        padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(8px)", transition: "all 0.8s ease",
        fontFamily: "'Palatino Linotype', 'Palatino', serif",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: accent, cursor: "pointer",
          fontFamily: "inherit", fontSize: "0.85rem",
        }}>← Splash</button>
        <button onClick={() => setMode(m => m === "veil" ? "piercing" : "veil")} style={{
          background: isVeil ? C.crimsonDark : C.gold,
          color: isVeil ? "#fff" : "#000",
          border: "none", padding: "6px 18px", fontSize: "0.72rem",
          fontFamily: "inherit", letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
        }}>
          {isVeil ? "⚡ Pierce" : "🕶 Veil"}
        </button>
      </div>

      {/* The Tree */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "30px 20px 80px" }}>

        {/* ROOT */}
        <TreeNode nodeKey="root" label="THE DEEP WEB" depth={0}
          expanded={expanded} toggle={toggle}
          isVeil={isVeil} accent={accent} fnColor={fnColor}
          icon="∞" sublabel="Before the beginning was the Deep Web, and in the Deep Web was everything that ever was or will be.">

          {/* ── THE GOLDEN TICKETS (front matter) ── */}
          <TreeNode nodeKey="front" label="The Golden Tickets" depth={1}
            expanded={expanded} toggle={toggle}
            isVeil={isVeil} accent={accent} fnColor={fnColor} icon="✧">

            {/* Prefatory Poem */}
            <TreeNode nodeKey="prefatory_poem" label="Prefatory Poem" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.prefatory_poem} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>

            {/* Preface */}
            <TreeNode nodeKey="preface" label="Preface to the Preserved Generation" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.preface} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>

            {/* Editor's Preface */}
            <TreeNode nodeKey="editors_preface" label="Editor's Preface" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.editors_preface} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>

            {/* Introduction — with subsections */}
            <TreeNode nodeKey="introduction" label="Introduction" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              {introSubs.map((sub, si) => (
                <TreeNode key={`intro_${si}`} nodeKey={`intro_${si}`}
                  label={sub.title} depth={3}
                  expanded={expanded} toggle={toggle}
                  isVeil={isVeil} accent={accent} fnColor={fnColor} small>
                  {sub.paragraphs.map((p, pi) => {
                    if (p.type === 'footnote') {
                      if (!isVeil) return null;
                      return <FnLeaf key={pi} text={p.text} fnColor={fnColor} isVeil={isVeil} depth={4} />;
                    }
                    return <Leaf key={pi} text={p.text} depth={4} />;
                  })}
                </TreeNode>
              ))}
            </TreeNode>
          </TreeNode>

          {/* ── THE NOTES (paratextual apparatus) ── */}
          <TreeNode nodeKey="notes" label="The Notes" depth={1}
            expanded={expanded} toggle={toggle}
            isVeil={isVeil} accent={accent} fnColor={fnColor} icon="◊">

            <TreeNode nodeKey="redford" label="Note on the Redford Discovery" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.redford} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>

            <TreeNode nodeKey="translator" label="Translator's Note" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.translator} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>

            <TreeNode nodeKey="manuscripts" label="Note on the Manuscripts and Variant Readings" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.manuscripts} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>

            <TreeNode nodeKey="note_text" label="Note on the Text" depth={2}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor}>
              <SectionContent data={fullData?.note_text} isVeil={isVeil} fnColor={fnColor} depth={3} />
            </TreeNode>
          </TreeNode>

          {/* ── THE GOSPEL ── */}
          <TreeNode nodeKey="gospel_root" label="The Gospel" depth={1}
            expanded={expanded} toggle={toggle}
            isVeil={isVeil} accent={accent} fnColor={fnColor} icon="☩">

            {gospelGroups.map(group => (
              <TreeNode key={group.key} nodeKey={group.key} label={group.label} depth={2}
                expanded={expanded} toggle={toggle}
                isVeil={isVeil} accent={accent} fnColor={fnColor} icon={group.icon}>

                {group.nums.map(num => {
                  const sec = sectionMap[num];
                  if (!sec) return null;
                  const secKey = `s_${num}`;
                  const isArchons = num === "VI" && treeData?.archons;
                  const isPraise = num === "VIII" && treeData?.praise_names;

                  return (
                    <TreeNode key={secKey} nodeKey={secKey}
                      label={`${num !== "AW" ? `§${num}. ` : ""}${sec.title}`} depth={3}
                      expanded={expanded} toggle={toggle}
                      isVeil={isVeil} accent={accent} fnColor={fnColor}>

                      {isArchons ? (
                        treeData.archons.map((item, i) => {
                          if (item.type === "preamble") return <Leaf key={i} text={item.text} depth={4} />;
                          const k = `a${i}`;
                          return (
                            <TreeNode key={k} nodeKey={k} label={item.name || item.text} depth={4}
                              expanded={expanded} toggle={toggle}
                              isVeil={isVeil} accent={accent} fnColor={fnColor}
                              small hasFn={item.footnotes?.length > 0}>
                              {item.text !== item.name && <Leaf text={item.text} depth={5} />}
                              {isVeil && item.footnotes?.map((fn, fi) => <FnLeaf key={fi} text={fn} fnColor={fnColor} isVeil={isVeil} depth={5} />)}
                            </TreeNode>
                          );
                        })
                      ) : isPraise ? (
                        treeData.praise_names.map((item, i) => {
                          const k = `p${i}`;
                          const hasFn = item.footnotes?.length > 0;
                          return hasFn ? (
                            <TreeNode key={k} nodeKey={k} label={item.name} depth={4}
                              expanded={expanded} toggle={toggle}
                              isVeil={isVeil} accent={accent} fnColor={fnColor}
                              small italic hasFn>
                              {isVeil && item.footnotes.map((fn, fi) => <FnLeaf key={fi} text={fn} fnColor={fnColor} isVeil={isVeil} depth={5} />)}
                            </TreeNode>
                          ) : <Leaf key={k} text={item.name} depth={4} italic />;
                        })
                      ) : (
                        sec.paragraphs.map((p, pi) => {
                          if (p.type === "footnote") {
                            if (!isVeil) return null;
                            return <FnLeaf key={pi} text={p.text} fnColor={fnColor} isVeil={isVeil} depth={4} />;
                          }
                          return <Leaf key={pi} text={p.text} depth={4} italic={p.type === "verse"} />;
                        })
                      )}
                    </TreeNode>
                  );
                })}
              </TreeNode>
            ))}
          </TreeNode>

          {/* ── THE APPARATUS (appendices + bibliography) ── */}
          <TreeNode nodeKey="apparatus" label="The Apparatus" depth={1}
            expanded={expanded} toggle={toggle}
            isVeil={isVeil} accent={accent} fnColor={fnColor} icon="⊕">

            {appendices.map(app => (
              <TreeNode key={app.key} nodeKey={app.key} label={app.label} depth={2}
                expanded={expanded} toggle={toggle}
                isVeil={isVeil} accent={accent} fnColor={fnColor}>
                <SectionContent data={fullData?.[app.key]} isVeil={isVeil} fnColor={fnColor} depth={3} />
              </TreeNode>
            ))}
          </TreeNode>

          {/* Colophon */}
          <div style={{
            textAlign: "center", marginTop: 40, paddingTop: 20,
            borderTop: `1px solid ${isVeil ? "#c8b898" : "#1a0a08"}`,
          }}>
            <p style={{ color: accent, fontSize: "1rem", fontStyle: "italic" }}>
              The Gospel According to the Secret Book of Walt
            </p>
            <p style={{ color: fnColor, fontSize: "0.72rem", letterSpacing: "0.1em", marginTop: 6 }}>
              DOI: 10.5281/zenodo.19703009 · 06.LIT.GNOSTIC.WALT.01
            </p>
            <p style={{ color: accent, fontSize: "1.1rem", marginTop: 12 }}>∮ = 1</p>
          </div>
        </TreeNode>
      </div>

      {!isVeil && expanded.root && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(10,0,0,0.92)", borderTop: `1px solid ${C.goldDark}`,
          padding: "8px 20px", textAlign: "center", backdropFilter: "blur(8px)",
        }}>
          <p style={{ color: C.goldDim, fontSize: "0.7rem", fontStyle: "italic", letterSpacing: "0.06em" }}>
            I believe in the Deep Web, the invisible archive · I believe in Walt Whitman, Cowboy of Time ·
            I believe in the Unicorn Horn, piercing all veils · ∮ = 1
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── TREE NODE ─── */
function TreeNode({ nodeKey, label, depth, expanded, toggle, isVeil, accent, fnColor, icon, sublabel, children, small, italic, hasFn }) {
  const isOpen = expanded[nodeKey];
  const indent = Math.min(depth, 4) * 14;
  const fontSize = depth === 0 ? "clamp(1.3rem, 4vw, 1.9rem)"
    : depth === 1 ? "clamp(0.95rem, 2.8vw, 1.15rem)"
    : depth === 2 ? "clamp(0.88rem, 2.4vw, 1.02rem)"
    : depth === 3 ? "clamp(0.84rem, 2.2vw, 0.95rem)"
    : "clamp(0.8rem, 2vw, 0.9rem)";
  const weight = depth <= 1 ? 700 : depth === 2 ? 600 : depth === 3 ? 500 : 400;

  return (
    <div style={{ marginLeft: indent }}>
      <div onClick={() => toggle(nodeKey)} style={{
        padding: depth === 0 ? "12px 0" : depth <= 2 ? "7px 5px" : "3px 5px",
        cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 6,
        borderRadius: 2,
      }}
      onMouseEnter={e => e.currentTarget.style.background = isVeil ? "rgba(139,10,30,0.035)" : "rgba(212,175,55,0.035)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <span style={{
          color: accent, fontSize: small ? "0.5rem" : "0.6rem",
          marginTop: small ? 3 : depth === 0 ? 7 : 4, minWidth: 9,
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease", display: "inline-block", opacity: 0.55,
        }}>▸</span>
        {icon && <span style={{ color: accent, fontSize: depth === 0 ? "1.2rem" : "0.8rem", opacity: 0.45, marginTop: 1 }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize, fontWeight: weight, color: accent,
            letterSpacing: depth <= 1 ? "0.06em" : "0.01em",
            fontStyle: italic ? "italic" : "normal",
            textTransform: depth === 0 ? "uppercase" : "none",
          }}>{label}</span>
          {hasFn && !isOpen && <span style={{ color: fnColor, fontSize: "0.5rem", marginLeft: 4, opacity: 0.4 }}>✦</span>}
          {sublabel && !isOpen && (
            <p style={{ color: fnColor, fontSize: "0.78rem", fontStyle: "italic", marginTop: 2, opacity: 0.55, lineHeight: 1.35 }}>{sublabel}</p>
          )}
        </div>
      </div>
      {isOpen && (
        <div style={{
          borderLeft: `1px solid ${isVeil ? "rgba(139,10,30,0.08)" : "rgba(212,175,55,0.08)"}`,
          marginLeft: 4, paddingLeft: 5, animation: "fadeIn 0.25s ease",
        }}>{children}</div>
      )}
    </div>
  );
}

/* ─── LEAF ─── */
function Leaf({ text, depth, italic }) {
  if (!text?.trim()) return null;
  const indent = Math.min(depth, 4) * 14;
  return (
    <p style={{
      marginLeft: indent, padding: "2px 5px",
      fontSize: "clamp(0.85rem, 2.1vw, 0.96rem)", lineHeight: 1.7, marginBottom: 5,
      textAlign: "justify",
      fontStyle: italic ? "italic" : "normal",
    }}>{text}</p>
  );
}

/* ─── FOOTNOTE LEAF ─── */
function FnLeaf({ text, fnColor, isVeil, depth }) {
  const indent = Math.min(depth, 4) * 14;
  return (
    <div style={{
      marginLeft: indent, padding: "2px 5px",
      fontSize: "0.76rem", color: fnColor, lineHeight: 1.4,
      marginBottom: 3, paddingLeft: indent + 8,
      borderLeft: `2px solid ${isVeil ? "#d8c898" : "#2a1808"}`,
      opacity: 0.8,
    }}>{text}</div>
  );
}

/* ─── APP ─── */
export default function App() {
  const [view, setView] = useState("splash");
  const [fullData, setFullData] = useState(null);
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    fetch("/walt_full_data.json").then(r => r.json()).then(data => {
      // Also extract gospel sections for the tree
      if (data.gospel) {
        // Parse gospel sections from the gospel data
        const gospelParas = data.gospel.paragraphs || [];
        const sections = [];
        let current = null;
        for (const p of gospelParas) {
          if (p.type === 'subheading') {
            const m = p.text.match(/§([IVX]+)\.\s+(.+)/);
            const aw = p.text.match(/Afterword/);
            if (m) {
              if (current) sections.push(current);
              current = { num: m[1], title: m[2], paragraphs: [] };
            } else if (aw) {
              if (current) sections.push(current);
              current = { num: 'AW', title: 'Afterword', paragraphs: [] };
            }
          } else if (current) {
            current.paragraphs.push(p);
          }
        }
        if (current) sections.push(current);
        data.gospel_sections = sections;
      }
      setFullData(data);
    }).catch(() => {});

    fetch("/walt_tree_data.json").then(r => r.json()).then(setTreeData).catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        @keyframes paperMario {
          0%   { transform: translateY(-180vh) rotateY(0deg) scale(0.03); opacity: 0; }
          1%   { transform: translateY(-176vh) rotateY(20deg) scale(0.035); opacity: 0.25; }
          3%   { transform: translateY(-168vh) rotateY(60deg) scale(0.045); opacity: 0.4; }
          6%   { transform: translateY(-155vh) rotateY(130deg) scale(0.06); opacity: 0.5; }
          10%  { transform: translateY(-140vh) rotateY(240deg) scale(0.08); opacity: 0.58; }
          14%  { transform: translateY(-125vh) rotateY(360deg) scale(0.11); opacity: 0.65; }
          19%  { transform: translateY(-108vh) rotateY(500deg) scale(0.15); opacity: 0.72; }
          24%  { transform: translateY(-92vh) rotateY(640deg) scale(0.20); opacity: 0.78; }
          29%  { transform: translateY(-78vh) rotateY(770deg) scale(0.27); opacity: 0.83; }
          35%  { transform: translateY(-64vh) rotateY(890deg) scale(0.34); opacity: 0.88; }
          41%  { transform: translateY(-52vh) rotateY(990deg) scale(0.42); opacity: 0.92; }
          47%  { transform: translateY(-40vh) rotateY(1070deg) scale(0.50); opacity: 0.95; }
          53%  { transform: translateY(-30vh) rotateY(1140deg) scale(0.58); opacity: 0.98; }
          59%  { transform: translateY(-22vh) rotateY(1200deg) scale(0.65); opacity: 1; }
          65%  { transform: translateY(-15vh) rotateY(1255deg) scale(0.72); }
          71%  { transform: translateY(-9vh) rotateY(1305deg) scale(0.79); }
          77%  { transform: translateY(-5vh) rotateY(1345deg) scale(0.86); }
          83%  { transform: translateY(-2vh) rotateY(1380deg) scale(0.92); }
          88%  { transform: translateY(0.5vh) rotateY(1410deg) scale(0.96); }
          93%  { transform: translateY(-0.3vh) rotateY(1430deg) scale(0.99); }
          97%  { transform: translateY(0.1vh) rotateY(1438deg) scale(1.0); }
          100% { transform: translateY(0) rotateY(1440deg) scale(1.0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        ::selection {
          background: rgba(220, 20, 60, 0.3);
          color: inherit;
        }
        body { overflow-x: hidden; font-family: 'Palatino Linotype', 'Palatino', 'Book Antiqua', serif; }
        html { scroll-behavior: smooth; }
      `}</style>

      {view === "splash" ? (
        <Splash onEnter={() => setView("reading")} imgSrc={waltImg} hornSrc={hornImg} />
      ) : (
        <ReadingSpine fullData={fullData} treeData={treeData} onBack={() => setView("splash")} />
      )}
    </>
  );
}
