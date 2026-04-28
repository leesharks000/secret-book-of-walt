/**
 * Footnote renderer components.
 *
 * READ docs/FOOTNOTES.md BEFORE MODIFYING THIS FILE.
 *
 * Exports:
 *   <FootnotedText> — universal body-text renderer with clickable footnote markers
 *                    AND markdown emphasis rendering (** for bold, * for italic).
 *   <InlineFootnote> — popup body shown below the parent paragraph when clicked.
 */

import { splitTextWithFootnotes } from "./footnotes.js";

/* ─── FOOTNOTE MARKER COLORS ─── */
const FN_BLUE = "#6a9fd8";
const FN_BLUE_HOVER = "#8ab8f0";

/**
 * Renders inline markdown-style emphasis on a plain text run:
 *   **text**  → <strong>text</strong>
 *   *text*    → <em>text</em>
 *
 * Greedy matching for **; non-greedy for *. Handles unbalanced markers by
 * leaving them as text. Used inside FootnotedText for non-footnote text spans.
 */
function renderEmphasis(text, keyPrefix) {
  if (!text) return null;
  if (!text.includes("*")) return text;

  const out = [];
  let i = 0;
  let k = 0;
  while (i < text.length) {
    if (text[i] === "*" && text[i+1] === "*") {
      // Bold: find matching **
      const end = text.indexOf("**", i + 2);
      if (end === -1) {
        // Unbalanced — just emit literal
        out.push(text[i] + (text[i+1] || ""));
        i += 2;
        continue;
      }
      const inner = text.slice(i + 2, end);
      out.push(<strong key={`${keyPrefix}-b-${k++}`}>{renderEmphasis(inner, `${keyPrefix}-b-${k}`)}</strong>);
      i = end + 2;
    } else if (text[i] === "*") {
      // Italic: find matching single * (not part of **)
      let end = -1;
      for (let j = i + 1; j < text.length; j++) {
        if (text[j] === "*" && text[j+1] !== "*") { end = j; break; }
        if (text[j] === "*" && text[j+1] === "*") {
          // Skip past bold-marker pairs without consuming them
          j += 1;
          continue;
        }
      }
      if (end === -1) {
        out.push("*");
        i += 1;
        continue;
      }
      const inner = text.slice(i + 1, end);
      out.push(<em key={`${keyPrefix}-i-${k++}`}>{inner}</em>);
      i = end + 1;
    } else {
      // Run of plain text until next *
      const next = text.indexOf("*", i);
      if (next === -1) {
        out.push(text.slice(i));
        i = text.length;
      } else {
        out.push(text.slice(i, next));
        i = next;
      }
    }
  }
  return out;
}

/**
 * Renders text with clickable footnote markers in veil mode, passive in pierce mode.
 *
 * Props:
 *   text           the body-text string (may contain **bold**, *italic*, and ¹²³ markers)
 *   isVeil         boolean — whether veil mode is active
 *   onFnClick      (id) => void — toggle handler; called only in veil mode
 *   linkText       optional fn(content) => ReactNode — for glossary linking
 *   inline         render as <span>s only (default true). Set false to wrap in <>.
 */
export function FootnotedText({ text, isVeil, onFnClick, linkText, inline = true }) {
  const parts = splitTextWithFootnotes(text);

  const rendered = parts.map((p, i) => {
    if (p.type === "fn") {
      const baseStyle = {
        color: FN_BLUE,
        fontSize: "0.7em",
        verticalAlign: "super",
        fontWeight: 600,
      };
      if (isVeil && onFnClick) {
        return (
          <span
            key={`fn-${i}-${p.id}`}
            onClick={(e) => { e.stopPropagation(); onFnClick(p.id); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onFnClick(p.id); } }}
            role="button"
            tabIndex={0}
            aria-label={`Footnote ${p.id}`}
            style={{
              ...baseStyle,
              cursor: "pointer",
              textDecoration: "none",
              outline: "none",
            }}
            onMouseEnter={(e) => (e.target.style.color = FN_BLUE_HOVER)}
            onMouseLeave={(e) => (e.target.style.color = FN_BLUE)}
            onFocus={(e) => (e.target.style.color = FN_BLUE_HOVER)}
            onBlur={(e) => (e.target.style.color = FN_BLUE)}
          >
            {p.id}
          </span>
        );
      }
      // Pierce mode (or no handler): render styled but passive.
      return (
        <span key={`fn-${i}-${p.id}`} aria-label={`Footnote ${p.id}`} style={baseStyle}>
          {p.id}
        </span>
      );
    }
    // Plain text span — apply markdown emphasis first, then optional glossary linking.
    // If linkText is provided, we need to apply it inside the emphasis-rendered tree.
    // For simplicity: emphasis is applied BEFORE linking, since linking inside emphasis
    // is rare and works at a per-text-run level anyway. linkText wraps the whole content.
    const emphasized = renderEmphasis(p.content, `t-${i}`);
    if (linkText && typeof p.content === "string" && !p.content.includes("*")) {
      // No emphasis markers → safe to apply glossary linking on the raw text
      return <span key={`t-${i}`}>{linkText(p.content)}</span>;
    }
    return <span key={`t-${i}`}>{emphasized}</span>;
  });

  return inline ? <>{rendered}</> : <span>{rendered}</span>;
}

/**
 * Inline footnote popup, rendered immediately below the parent paragraph.
 *
 * Props:
 *   id          the footnote id (e.g., '¹³⁸')
 *   body        the footnote body (without leading id)
 *   onClose     handler to close the popup
 *   fnColor     accent color for the left rule
 *   depth       indent level (matches parent)
 *   linkText    optional fn for glossary linking
 */
export function InlineFootnote({ id, body, onClose, fnColor = "#6a5a40", depth = 0, linkText }) {
  const indent = Math.min(depth, 4) * 14;
  return (
    <div
      role="note"
      aria-label={`Footnote ${id}`}
      style={{
        marginLeft: indent + 24,
        marginRight: 12,
        marginTop: 4,
        marginBottom: 10,
        padding: "8px 14px 8px 14px",
        borderLeft: `2px solid ${fnColor}`,
        background: "rgba(212,175,55,0.04)",
        fontSize: "0.82rem",
        lineHeight: 1.55,
        color: "var(--fn-text, #6a5a40)",
        position: "relative",
      }}
    >
      <span
        style={{
          color: FN_BLUE,
          fontWeight: 600,
          marginRight: "0.5em",
          fontSize: "0.85em",
          verticalAlign: "super",
        }}
      >
        {id}
      </span>
      {body && body.includes("*")
        ? renderEmphasis(body, `fn-${id}`)
        : (linkText ? linkText(body) : body)}
      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close footnote"
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            background: "transparent",
            border: "none",
            color: fnColor,
            opacity: 0.5,
            cursor: "pointer",
            fontSize: "0.95rem",
            padding: "0 4px",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.target.style.opacity = "0.5")}
        >
          ×
        </button>
      )}
    </div>
  );
}
