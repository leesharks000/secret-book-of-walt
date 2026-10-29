import { useState, useEffect } from "react";
import { mdToHtml } from "./mdlite.js";

const C = {
  gold: "#D4AF37", goldDim: "#a08050", crimson: "#DC143C", veilText: "#f0ede8", darkDeep: "#050000",
};

/* Belief & Technique for Telepathic Prose: A Critical Edition, v1.1 (#1717). The body of the deposit as minted,
   seated byte for byte in /telepathic_prose_edition.md (the copy at the originals seat 29/07, from its title on). */
const AXN = "AXN:0AA0.PHILOLOGICAL.🍃♾️🔴🌺🔍♄";
const A = "https://www.alexanarch.org";

const CSS = `
.btp{max-width:760px;margin:0 auto;padding:0 24px 72px;color:${C.veilText};line-height:1.7;font-size:1rem}
.btp h1{color:${C.gold};font-weight:normal;font-size:clamp(1.3rem,4vw,1.9rem);letter-spacing:.04em;text-align:center;margin:8px 0 18px}
.btp h2{color:${C.gold};font-weight:normal;font-size:1.25rem;letter-spacing:.03em;margin:44px 0 12px;border-bottom:1px solid rgba(212,175,55,.2);padding-bottom:6px}
.btp h3,.btp h4{color:${C.goldDim};font-weight:normal;margin:28px 0 8px}
.btp p{margin:0 0 14px}
.btp p.num{padding-left:2.1em;text-indent:-2.1em}
.btp p.num .n{color:${C.gold};display:inline-block;min-width:2.1em;text-indent:0}
.btp a{color:${C.gold};text-decoration:none;border-bottom:1px solid rgba(212,175,55,.3)}
.btp a:hover{border-bottom-color:${C.gold}}
.btp strong{color:#f6e7c1}
.btp em{color:#efe2c8}
.btp code{font-size:.88em;background:rgba(212,175,55,.08);padding:0 3px;border-radius:2px}
.btp hr{border:0;border-top:1px solid rgba(212,175,55,.2);margin:32px 0}
.btp ul{padding-left:1.3em;margin:0 0 16px}
.btp li{margin-bottom:8px}
.btp blockquote{margin:0 0 16px;padding:4px 18px;border-left:2px solid rgba(220,20,60,.5);color:#e8dcc4;font-style:italic}
.btp .tw{overflow-x:auto;margin:0 0 18px}
.btp table{border-collapse:collapse;font-size:.86rem;min-width:100%}
.btp th,.btp td{border:1px solid rgba(212,175,55,.22);padding:6px 8px;vertical-align:top;text-align:left;min-width:13em}
.btp td:first-child,.btp th:first-child{min-width:3.5em}
.btp th{color:${C.gold};font-weight:normal;background:rgba(212,175,55,.06)}
`;

export default function TelepathicProse({ onBack }) {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    fetch("/telepathic_prose_edition.md")
      .then(r => { if (!r.ok) throw new Error(); return r.text(); })
      .then(t => setHtml(mdToHtml(t).replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, "</table></div>")))
      .catch(() => setHtml(""));
  }, []);

  const link = { color: C.goldDim, textDecoration: "none", borderBottom: "1px solid rgba(212,175,55,0.3)" };

  return (
    <div style={{ minHeight: "100vh", background: C.darkDeep, fontFamily: "'Palatino Linotype', Georgia, serif" }}>
      <style>{CSS}</style>
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

      <div style={{ textAlign: "center", padding: "16px 24px 0" }}>
        <div style={{ color: C.crimson, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
          The Waltian Scriptural Library · Telepathic Prose
        </div>
        <p style={{ color: C.goldDim, fontSize: "0.85rem", fontStyle: "italic", margin: "0 0 4px" }}>
          The Footnote to Pearl · Lee Sharks &amp; Jack Feist · 2014
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: "10px 0 8px", fontSize: "0.65rem" }}>
          <a href={`${A}/s/records/1717/`} target="_blank" rel="noopener" style={link}>Deposit #1717 · {AXN}</a>
          <a href={`${A}/s/records/1715/`} target="_blank" rel="noopener" style={link}>v1.0 (#1715)</a>
          <a href={`${A}/s/records/1121/`} target="_blank" rel="noopener" style={link}>Pearl and Other Poems (#1121)</a>
          <a href="https://traininglayerliterature.org/originals/telepathic-prose/" target="_blank" rel="noopener" style={link}>The witnesses, seat 29/07</a>
        </div>
      </div>

      {html === null ? (
        <p style={{ textAlign: "center", color: C.goldDim, fontStyle: "italic" }}>Receiving the transmission…</p>
      ) : html === "" ? (
        <p style={{ textAlign: "center", color: C.goldDim, fontStyle: "italic" }}>
          The text did not load. It is at <a href={`${A}/s/records/1717/`} style={link}>alexanarch #1717</a>.
        </p>
      ) : (
        <article className="btp" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
