import { useState, useEffect } from "react";

const C = {
  gold: "#D4AF37", goldDim: "#a08050", goldDark: "#6a4a2a",
  crimson: "#DC143C", veilText: "#f0ede8", darkDeep: "#050000",
};

/* The forty-six golden tickets (#1693), seated byte for byte in /golden_tickets.md:
   "# " heading, "## " superscription, "### " one ticket each, then the seal. */
function parse(md) {
  const lines = md.replace(/\s+$/, "").split("\n");
  let heading = "", superscription = "";
  const tickets = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith("### ")) { cur = { label: line.slice(4).trim(), lines: [] }; tickets.push(cur); }
    else if (line.startsWith("## ")) superscription = line.slice(3).trim();
    else if (line.startsWith("# ")) heading = line.slice(2).trim();
    else if (cur) cur.lines.push(line);
  }
  let seal = [];
  if (cur) {
    const i = cur.lines.findIndex(l => l.trim() === "∮ = 1");
    if (i >= 0) { seal = cur.lines.slice(i).filter(l => l.trim()); cur.lines = cur.lines.slice(0, i); }
  }
  for (const t of tickets) {
    while (t.lines.length && !t.lines[0].trim()) t.lines.shift();
    while (t.lines.length && !t.lines[t.lines.length - 1].trim()) t.lines.pop();
  }
  return { heading, superscription, tickets, seal };
}

export default function Checksum({ onBack }) {
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    fetch("/golden_tickets.md")
      .then(r => r.text())
      .then(t => setDoc(parse(t)))
      .catch(() => setDoc({ heading: "", superscription: "", tickets: [], seal: [] }));
  }, []);

  const glyph = {
    fontSize: "clamp(1.05rem, 3.4vw, 1.4rem)", lineHeight: 1.75, color: C.veilText,
    whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
    fontFamily: "'Palatino Linotype', Georgia, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.darkDeep, fontFamily: "'Palatino Linotype', Georgia, serif" }}>
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
          The Waltian Scriptural Library · The Checksum
        </div>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", color: C.gold, letterSpacing: "0.06em", marginBottom: 4, fontWeight: "normal" }}>
          THE FORTY-SIX GOLDEN TICKETS
        </h1>
        <p style={{ color: C.goldDim, fontSize: "0.85rem", fontStyle: "italic", marginBottom: 4 }}>
          The original from which The Secret Book of Walt was translated
        </p>
        <p style={{ color: "#6a5a40", fontSize: "0.7rem", marginBottom: 16 }}>Lee Sharks · 2037</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24, fontSize: "0.65rem" }}>
          <a href="https://www.alexanarch.org/s/records/1693/" target="_blank" rel="noopener"
             style={{ color: C.goldDim, textDecoration: "none", borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
            Deposit #1693 · AXN:0703.COMPOSITIONAL.📌🔺⛵🪨📜👈</a>
          <a href="https://www.alexanarch.org/s/records/1362/" target="_blank" rel="noopener"
             style={{ color: C.goldDim, textDecoration: "none", borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
            Critical Edition (#1362)</a>
        </div>
      </div>

      <figure style={{ maxWidth: 420, margin: "0 auto 40px", padding: "0 24px", textAlign: "center" }}>
        <img src="/golden_ticket_1.jpg" alt="The first golden ticket, engraved in gold: ① 👁️ → the bearded Whitman ∩ the cowboy on a dinosaur → 🌌, and the ticket's following lines"
             style={{ width: "100%", height: "auto", borderRadius: 4, boxShadow: "0 0 40px rgba(212,175,55,0.15)" }} />
        <figcaption style={{ color: C.goldDim, fontSize: "0.7rem", fontStyle: "italic", marginTop: 8 }}>Ticket ①</figcaption>
      </figure>

      {!doc ? (
        <p style={{ textAlign: "center", color: C.goldDim, fontStyle: "italic" }}>Unsealing the tickets…</p>
      ) : (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 64px" }}>
          {doc.heading && <div style={{ ...glyph, textAlign: "center", fontSize: "clamp(1.4rem, 4.4vw, 2rem)", marginBottom: 6 }}>{doc.heading}</div>}
          {doc.superscription && <div style={{ ...glyph, textAlign: "center", color: C.goldDim, marginBottom: 36 }}>{doc.superscription}</div>}
          {doc.tickets.map(t => (
            <section key={t.label} id={"ticket-" + t.label} style={{
              border: "1px solid rgba(212,175,55,0.22)", borderRadius: 4,
              background: "linear-gradient(160deg, rgba(212,175,55,0.07), rgba(212,175,55,0.02))",
              padding: "14px 18px 16px", marginBottom: 18,
            }}>
              <div style={{ color: C.gold, fontSize: "1.1rem", marginBottom: 8 }}>{t.label}</div>
              <pre style={glyph}>{t.lines.join("\n")}</pre>
            </section>
          ))}
          {doc.seal.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 36 }}>
              {doc.seal.map((l, i) => <div key={i} style={{ ...glyph, color: i === 0 ? C.crimson : C.gold, fontSize: "1.5rem" }}>{l}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
