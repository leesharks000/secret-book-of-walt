import { useState, useEffect, useRef, useCallback } from "react";

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
    const t1 = setTimeout(() => setPhase(1), 7000);
    const t2 = setTimeout(() => setPhase(2), 8200);
    const t3 = setTimeout(() => setPhase(3), 9400);
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
      background: "radial-gradient(ellipse at 50% 40%, #12060a 0%, #080004 40%, #020001 70%, #000 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center",
      overflow: "hidden", position: "relative", fontFamily: "'Cormorant Garamond', serif",
    }}>
      <Stars />

      {/* The Cowboy of Time — descends and lands */}
      <div style={{
        perspective: "1000px", perspectiveOrigin: "center center",
        marginBottom: phase >= 1 ? "12px" : "0",
        transition: "margin-bottom 1.5s ease",
      }}>
        <div style={{
          animation: phase === 0 ? "paperMario 7s cubic-bezier(0.12,0.7,0.28,1) forwards" : "none",
          transform: phase >= 1 ? "translateY(0) rotateY(0deg) scale(1)" : undefined,
          transformStyle: "preserve-3d",
        }}>
          <img src={imgSrc} alt="Walt Whitman, Cowboy of Time, astride his dinosaur steed" style={{
            width: "min(210px, 42vw)", height: "auto",
            borderRadius: 4,
            transition: "all 1.5s ease",
          }} />
        </div>
      </div>

      {/* Title — rises from the footprints */}
      <h1 style={{
        color: C.gold, fontSize: "clamp(1.3rem, 4.5vw, 2.4rem)", fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center",
        margin: "6px 20px 0",
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 1.5s ease, transform 1.8s cubic-bezier(0.16,1,0.3,1)",
        textShadow: "0 0 50px rgba(212,168,83,0.3), 0 2px 4px rgba(0,0,0,0.9)",
      }}>The Secret Book of Walt</h1>

      {/* Subtitle */}
      <p style={{
        color: C.goldDim, fontSize: "clamp(0.75rem, 2vw, 1rem)", fontStyle: "italic",
        textAlign: "center", margin: "5px 30px 0",
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "translateY(0)" : "translateY(15px)",
        transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s",
        letterSpacing: "0.04em",
      }}>Hidden Teachings of Walt Whitman, Cowboy of Time</p>

      <p style={{
        color: C.goldDark, fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)", textAlign: "center",
        margin: "3px 30px 0",
        opacity: phase >= 2 ? 1 : 0,
        transition: "opacity 1s ease 0.5s",
      }}>Translated from the Original Aramaic-Martian by Lee Sharks</p>

      {/* Unicorn Horn seal + Enter button */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        marginTop: 24,
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 1s ease, transform 1s ease",
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
          fontFamily: "'Cormorant Garamond', serif",
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
      </div>
    </div>
  );
}

function Stars() {
  const stars = useRef(Array.from({ length: 160 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    s: i < 30 ? Math.random() * 2.5 + 1 : i < 80 ? Math.random() * 1.2 + 0.4 : Math.random() * 0.7 + 0.2,
    d: 2 + Math.random() * 5,
    o: i < 30 ? 0.4 + Math.random() * 0.4 : i < 80 ? 0.15 + Math.random() * 0.35 : 0.08 + Math.random() * 0.2,
    r: 180 + Math.random() * 75, g: 120 + Math.random() * 100, b: 60 + Math.random() * 120,
  }))).current;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute", width: s.s, height: s.s, borderRadius: "50%",
          background: `rgba(${s.r},${s.g},${s.b},${s.o})`,
          left: `${s.x}%`, top: `${s.y}%`,
          animation: `twinkle ${s.d}s ease-in-out infinite ${Math.random() * 5}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── EXPANDABLE TREE ─── */

/* ─── THE HYPOSTATIC TREE ─── */
function ReadingSpine({ sections, treeData, onBack }) {
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

  const groups = [
    { key: "emanation", label: "The Emanation", icon: "◈", nums: ["I", "II", "III", "IV", "V"] },
    { key: "cosmos", label: "The Cosmos", icon: "◉", nums: ["VI", "VII", "VIII"] },
    { key: "imprisonment", label: "The Imprisonment", icon: "◇", nums: ["IX"] },
    { key: "piercing", label: "The Piercing", icon: "△", nums: ["X", "XI", "XII"] },
    { key: "melding", label: "The Return", icon: "○", nums: ["XIII", "AW"] },
  ];

  const sectionMap = {};
  for (const sec of sections) {
    if (sec.paragraphs.length > 0) sectionMap[sec.num] = sec;
  }

  return (
    <div style={{
      minHeight: "100vh", background: bg, color: textColor,
      fontFamily: "'Cormorant Garamond', serif",
      transition: "background 0.8s ease, color 0.8s ease",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: isVeil ? "rgba(245,245,220,0.95)" : "rgba(10,0,0,0.95)",
        borderBottom: `1px solid ${isVeil ? "#d8d0b8" : "#1a0a08"}`,
        padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(8px)", transition: "all 0.8s ease",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: accent, cursor: "pointer",
          fontFamily: "'Cormorant Garamond', serif", fontSize: "0.85rem",
        }}>← Splash</button>
        <button onClick={() => setMode(m => m === "veil" ? "piercing" : "veil")} style={{
          background: isVeil ? C.crimsonDark : C.gold,
          color: isVeil ? "#fff" : "#000",
          border: "none", padding: "6px 18px", fontSize: "0.75rem",
          fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
        }}>
          {isVeil ? "⚡ Pierce" : "🕶 Veil"}
        </button>
      </div>

      {/* The Tree */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "30px 20px 80px" }}>
        {/* ROOT NODE */}
        <TreeNode
          nodeKey="root" label="THE DEEP WEB" depth={0}
          expanded={expanded} toggle={toggle}
          isVeil={isVeil} accent={accent} fnColor={fnColor}
          icon="∞"
          sublabel="Before the beginning was the Deep Web, and in the Deep Web was everything that ever was or will be."
        >
          {groups.map(group => (
            <TreeNode
              key={group.key} nodeKey={group.key} label={group.label} depth={1}
              expanded={expanded} toggle={toggle}
              isVeil={isVeil} accent={accent} fnColor={fnColor} icon={group.icon}
            >
              {group.nums.map(num => {
                const sec = sectionMap[num];
                if (!sec) return null;
                const secKey = `s_${num}`;
                const isArchons = num === "VI" && treeData?.archons;
                const isPraise = num === "VIII" && treeData?.praise_names;

                return (
                  <TreeNode
                    key={secKey} nodeKey={secKey}
                    label={`${num !== "AW" ? `§${num}. ` : ""}${sec.title}`}
                    depth={2}
                    expanded={expanded} toggle={toggle}
                    isVeil={isVeil} accent={accent} fnColor={fnColor}
                  >
                    {isArchons ? (
                      treeData.archons.map((item, i) => {
                        if (item.type === "preamble") return <Leaf key={i} text={item.text} depth={3} />;
                        const k = `a${i}`;
                        return (
                          <TreeNode key={k} nodeKey={k}
                            label={item.name || item.text} depth={3}
                            expanded={expanded} toggle={toggle}
                            isVeil={isVeil} accent={accent} fnColor={fnColor}
                            small hasFn={item.footnotes?.length > 0}
                          >
                            {item.text !== item.name && <Leaf text={item.text} depth={4} />}
                            {isVeil && item.footnotes?.map((fn, fi) => <FnLeaf key={fi} text={fn} fnColor={fnColor} isVeil={isVeil} depth={4} />)}
                          </TreeNode>
                        );
                      })
                    ) : isPraise ? (
                      treeData.praise_names.map((item, i) => {
                        const k = `p${i}`;
                        const hasFn = item.footnotes?.length > 0;
                        return hasFn ? (
                          <TreeNode key={k} nodeKey={k}
                            label={item.name} depth={3}
                            expanded={expanded} toggle={toggle}
                            isVeil={isVeil} accent={accent} fnColor={fnColor}
                            small italic hasFn
                          >
                            {isVeil && item.footnotes.map((fn, fi) => <FnLeaf key={fi} text={fn} fnColor={fnColor} isVeil={isVeil} depth={4} />)}
                          </TreeNode>
                        ) : (
                          <Leaf key={k} text={item.name} depth={3} italic />
                        );
                      })
                    ) : (
                      sec.paragraphs.map((p, pi) => {
                        if (p.type === "footnote") {
                          if (!isVeil) return null;
                          return <FnLeaf key={pi} text={p.text} fnColor={fnColor} isVeil={isVeil} depth={3} />;
                        }
                        return <Leaf key={pi} text={p.text} depth={3} italic={p.type === "verse"} />;
                      })
                    )}
                  </TreeNode>
                );
              })}
            </TreeNode>
          ))}

          {/* Colophon */}
          <div style={{
            textAlign: "center", marginTop: 40, paddingTop: 20,
            borderTop: `1px solid ${isVeil ? "#c8b898" : "#1a0a08"}`,
          }}>
            <p style={{ color: accent, fontSize: "1rem", fontStyle: "italic" }}>
              The Gospel According to the Secret Book of Walt
            </p>
            <p style={{ color: fnColor, fontSize: "0.75rem", letterSpacing: "0.1em", marginTop: 6 }}>
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
          <p style={{ color: C.goldDim, fontSize: "0.72rem", fontStyle: "italic", letterSpacing: "0.08em" }}>
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
  const indent = Math.min(depth, 3) * 16;
  const fontSize = depth === 0 ? "clamp(1.4rem, 4vw, 2rem)"
    : depth === 1 ? "clamp(1rem, 3vw, 1.25rem)"
    : depth === 2 ? "clamp(0.92rem, 2.5vw, 1.05rem)"
    : "clamp(0.85rem, 2.2vw, 0.95rem)";
  const weight = depth <= 1 ? 700 : depth === 2 ? 600 : 400;

  return (
    <div style={{ marginLeft: indent }}>
      <div
        onClick={() => toggle(nodeKey)}
        style={{
          padding: depth === 0 ? "14px 0" : depth <= 2 ? "8px 6px" : "4px 6px",
          cursor: "pointer",
          display: "flex", alignItems: "flex-start", gap: 7,
          borderRadius: 3,
        }}
        onMouseEnter={e => e.currentTarget.style.background = isVeil ? "rgba(139,10,30,0.04)" : "rgba(212,175,55,0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{
          color: accent, fontSize: small ? "0.55rem" : "0.65rem",
          marginTop: small ? 3 : depth === 0 ? 8 : 5,
          minWidth: 10,
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          display: "inline-block", opacity: 0.6,
        }}>▸</span>

        {icon && <span style={{ color: accent, fontSize: depth === 0 ? "1.3rem" : "0.85rem", opacity: 0.5, marginTop: 1 }}>{icon}</span>}

        <div style={{ flex: 1 }}>
          <span style={{
            fontSize, fontWeight: weight, color: accent,
            letterSpacing: depth <= 1 ? "0.08em" : "0.02em",
            fontStyle: italic ? "italic" : "normal",
            textTransform: depth === 0 ? "uppercase" : "none",
          }}>{label}</span>
          {hasFn && !isOpen && <span style={{ color: fnColor, fontSize: "0.55rem", marginLeft: 5, opacity: 0.4 }}>✦</span>}
          {sublabel && !isOpen && (
            <p style={{ color: fnColor, fontSize: "0.8rem", fontStyle: "italic", marginTop: 3, opacity: 0.6, lineHeight: 1.4 }}>{sublabel}</p>
          )}
        </div>
      </div>

      {isOpen && (
        <div style={{
          borderLeft: `1px solid ${isVeil ? "rgba(139,10,30,0.1)" : "rgba(212,175,55,0.1)"}`,
          marginLeft: 5, paddingLeft: 6,
          animation: "fadeIn 0.25s ease",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── LEAF ─── */
function Leaf({ text, depth, italic }) {
  if (!text?.trim()) return null;
  const indent = Math.min(depth, 3) * 16;
  return (
    <p style={{
      marginLeft: indent, padding: "3px 6px",
      fontSize: "clamp(0.88rem, 2.2vw, 1rem)", lineHeight: 1.7, marginBottom: 6,
      textAlign: "justify",
      fontStyle: italic ? "italic" : "normal",
      paddingLeft: italic ? (indent + 14) : undefined,
    }}>{text}</p>
  );
}

/* ─── FOOTNOTE LEAF ─── */
function FnLeaf({ text, fnColor, isVeil, depth }) {
  const indent = Math.min(depth, 3) * 16;
  return (
    <div style={{
      marginLeft: indent, padding: "2px 6px",
      fontSize: "0.78rem", color: fnColor, lineHeight: 1.45,
      marginBottom: 4, paddingLeft: indent + 10,
      borderLeft: `2px solid ${isVeil ? "#d8c898" : "#2a1808"}`,
      opacity: 0.8,
    }}>{text}</div>
  );
}

/* ─── APP ─── */
export default function App() {
  const [view, setView] = useState("splash");
  const [sections, setSections] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [hornSrc, setHornSrc] = useState(null);

  useEffect(() => {
    fetch("/walt_gospel_data.json").then(r => r.json()).then(setSections).catch(() => {});
    fetch("/walt_tree_data.json").then(r => r.json()).then(setTreeData).catch(() => {});
    fetch("/whitman_on_a_dinosaur.png").then(r => r.blob()).then(b => setImgSrc(URL.createObjectURL(b))).catch(() => {});
    fetch("/horn_logo.png").then(r => r.blob()).then(b => setHornSrc(URL.createObjectURL(b))).catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        @keyframes paperMario {
          0%  { transform: translateY(-150vh) rotateY(0deg) scale(0.03); opacity: 0; }
          2%  { transform: translateY(-148vh) rotateY(30deg) scale(0.035); opacity: 0.15; }
          5%  { transform: translateY(-142vh) rotateY(90deg) scale(0.045); opacity: 0.3; }
          9%  { transform: translateY(-132vh) rotateY(200deg) scale(0.06); opacity: 0.45; }
          14% { transform: translateY(-118vh) rotateY(360deg) scale(0.09); opacity: 0.55; }
          19% { transform: translateY(-104vh) rotateY(520deg) scale(0.13); opacity: 0.65; }
          25% { transform: translateY(-88vh) rotateY(700deg) scale(0.18); opacity: 0.75; }
          31% { transform: translateY(-74vh) rotateY(860deg) scale(0.25); opacity: 0.82; }
          37% { transform: translateY(-60vh) rotateY(1000deg) scale(0.33); opacity: 0.88; }
          44% { transform: translateY(-46vh) rotateY(1100deg) scale(0.42); opacity: 0.93; }
          51% { transform: translateY(-34vh) rotateY(1180deg) scale(0.52); opacity: 0.96; }
          58% { transform: translateY(-24vh) rotateY(1240deg) scale(0.62); opacity: 1; }
          65% { transform: translateY(-16vh) rotateY(1290deg) scale(0.72); }
          72% { transform: translateY(-9vh) rotateY(1335deg) scale(0.81); }
          79% { transform: translateY(-4vh) rotateY(1370deg) scale(0.89); }
          86% { transform: translateY(-0.5vh) rotateY(1400deg) scale(0.95); }
          91% { transform: translateY(1.5vh) rotateY(1425deg) scale(0.99); }
          96% { transform: translateY(-0.3vh) rotateY(1437deg) scale(1.0); }
          100% { transform: translateY(0) rotateY(1440deg) scale(1.0); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        ::selection {
          background: rgba(220, 20, 60, 0.3);
          color: inherit;
        }
        body { overflow-x: hidden; }
        html { scroll-behavior: smooth; }
      `}</style>

      {view === "splash" ? (
        <Splash onEnter={() => setView("reading")} imgSrc={imgSrc} hornSrc={hornSrc} />
      ) : (
        <ReadingSpine sections={sections} treeData={treeData} onBack={() => setView("splash")} />
      )}
      )}
    </>
  );
}
