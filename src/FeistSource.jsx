import { useState, useEffect } from "react";

const C = {
  gold: "#D4AF37", goldDim: "#a08050", crimson: "#DC143C",
  beige: "#F5F5DC", hornWhite: "#FFFAF0", dark: "#0a0000",
  darkDeep: "#050000", veilText: "#2a1a08",
};

export default function FeistSource() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/feist_source_data.json")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData([]));
  }, []);

  if (!data) return (
    <div style={{ textAlign: "center", padding: "4em", color: C.gold, fontFamily: "Georgia, serif" }}>
      Loading the Damascus Codex...
    </div>
  );

  return (
    <div style={{
      maxWidth: 780, margin: "0 auto", padding: "2em 1.5em",
      fontFamily: "Georgia, serif", color: C.veilText, lineHeight: 1.65,
    }}>
      <h1 style={{
        fontSize: "1.8em", color: C.gold, letterSpacing: 1,
        textAlign: "center", marginBottom: 4,
      }}>
        THE FEIST SOURCE
      </h1>
      <p style={{
        textAlign: "center", color: C.goldDim, fontSize: "0.85em",
        fontStyle: "italic", marginBottom: "2em",
      }}>
        A Sayings Source from the Damascus Codex
      </p>

      {data.map((section, si) => (
        <div key={si} style={{ marginBottom: "2.5em" }}>
          {section.paragraphs.map((p, pi) => {
            if (p.type === "heading") return (
              <h2 key={pi} style={{
                fontSize: "1.1em", color: C.crimson, letterSpacing: 1,
                borderBottom: "1px solid #2a1a08", paddingBottom: 4,
                marginTop: "1.5em", marginBottom: "0.8em",
              }}>{p.text}</h2>
            );
            if (p.type === "divider") return (
              <hr key={pi} style={{ border: "none", borderTop: "1px solid #3a2a18", margin: "1.5em 0" }} />
            );
            // Render prose with basic emphasis
            let html = p.text
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>");
            return (
              <p key={pi} style={{ marginBottom: "0.6em", fontSize: "0.95em" }}
                 dangerouslySetInnerHTML={{ __html: html }} />
            );
          })}
        </div>
      ))}

      <div style={{
        textAlign: "center", marginTop: "3em", paddingTop: "1em",
        borderTop: "1px solid #2a1a08", color: C.goldDim, fontSize: "0.8em",
      }}>
        <div>Lee Sharks · Rebekah Cranes, ed. · Crimson Hexagonal Archive</div>
        <div style={{ color: C.crimson, marginTop: 8 }}>∮ = 1</div>
      </div>
    </div>
  );
}
