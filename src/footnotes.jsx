/**
 * Footnote renderer components.
 *
 * READ docs/FOOTNOTES.md BEFORE MODIFYING THIS FILE.
 *
 * Exports:
 *   <FootnotedText> — universal body-text renderer with clickable footnote markers.
 *   <InlineFootnote> — popup body shown below the parent paragraph when clicked.
 */

import { splitTextWithFootnotes } from "./footnotes.js";

/* ─── FOOTNOTE MARKER COLORS ─── */
const FN_BLUE = "#6a9fd8";
const FN_BLUE_HOVER = "#8ab8f0";

/**
 * Renders text with clickable footnote markers in veil mode, passive in pierce mode.
 *
 * Props:
 *   text           the body-text string
 *   isVeil         boolean — whether veil mode is active
 *   onFnClick      (id) => void — toggle handler; called only in veil mode
 *   linkText       optional fn(content) => ReactNode — for glossary linking
 *                  (the existing LinkedText / injectLinks helpers each book has)
 *   inline         render as <span>s only (default true). Set false to wrap in <>.
 *
 * Emits a flat sequence of spans. The caller decides the surrounding container.
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
    // Plain text
    if (linkText) {
      return <span key={`t-${i}`}>{linkText(p.content)}</span>;
    }
    return <span key={`t-${i}`}>{p.content}</span>;
  });

  return inline ? <>{rendered}</> : <span>{rendered}</span>;
}

/**
 * Inline footnote popup, rendered immediately below the parent paragraph.
 *
 * Props:
 *   id          the footnote id (e.g., '¹³⁸')
 *   body        the footnote body (with or without leading id)
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
      {linkText ? linkText(body) : body}
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
