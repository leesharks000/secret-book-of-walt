#!/usr/bin/env python3
"""
Build walt_full_data.json from canonical source.

Source: SecretBookOfWalt_ResearchEdition.md
Source DOI: 10.5281/zenodo.19739494

This script:
  1. Parses the source markdown into the section structure expected by App.jsx.
  2. RENUMBERS all 158 footnotes by their reading order in the website
     (front matter first, then gospel, then back matter). Walt's print numbering
     starts new footnotes wherever they're defined in source order, but the
     website needs sequential 1–158 from the reader's perspective.
  3. Preserves the markdown emphasis (* / **) tokens in the text so the
     React renderer can convert to <em> / <strong>.
  4. Normalizes straight quotes (") to curly quotes (" "), straight apostrophes
     (') to curly (' '), and "—" remains as em dash.

Run: python3 scripts/build_walt_data.py
"""

import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "walt_source.md"
OUT = ROOT / "public" / "walt_full_data.json"

SUPER = "¹²³⁴⁵⁶⁷⁸⁹⁰"

def find_footnote_runs(text: str):
    """Yields (match_start, match_end, run_string) for every superscript run that
    qualifies as a footnote reference under the disambiguation rule.

    Critical: the rule checks the character BEFORE the entire superscript run.
    A regex scan with a negative-lookbehind only checks the char before the
    FIRST superscript char it considers, which is wrong if the engine has
    already advanced past a leading superscript. So we scan manually.
    """
    SUPER_SET = set("¹²³⁴⁵⁶⁷⁸⁹⁰")
    i = 0
    while i < len(text):
        if text[i] in SUPER_SET:
            # Find the maximal run starting at i
            j = i
            while j < len(text) and text[j] in SUPER_SET:
                j += 1
            run = text[i:j]
            # Check the char BEFORE the run start. If it's a letter, skip.
            prev = text[i-1] if i > 0 else ""
            if not prev.isalpha():
                yield (i, j, run)
            i = j
        else:
            i += 1
SUPER_TO_INT = str.maketrans(SUPER, "1234567890")
INT_TO_SUPER = str.maketrans("1234567890", SUPER)

def n_to_super(n: int) -> str:
    return str(n).translate(INT_TO_SUPER)

def super_to_n(s: str) -> int:
    return int(s.translate(SUPER_TO_INT))

# ─────────────────────────────────────────────────────────────────────────
# QUOTE NORMALIZATION
# ─────────────────────────────────────────────────────────────────────────

def smart_quote(text: str) -> str:
    """Convert straight ASCII quotes to typographically correct curly quotes.

    Rules:
      "  → opening (\u201c) if preceded by start/whitespace/punct, closing (\u201d) otherwise
      '  → if surrounded by letters: apostrophe (\u2019)
            else: opening single (\u2018) if preceded by start/whitespace, closing (\u2019) otherwise
    """
    if not text:
        return text
    out = []
    in_double = False
    for i, ch in enumerate(text):
        if ch == '"':
            prev = text[i-1] if i > 0 else " "
            # Heuristic: opening if previous is whitespace, punct, dash, or start
            if prev.isspace() or prev in "([{—–-/" or i == 0:
                out.append("\u201c")
                in_double = True
            else:
                out.append("\u201d")
                in_double = False
        elif ch == "'":
            prev = text[i-1] if i > 0 else " "
            nxt = text[i+1] if i+1 < len(text) else " "
            # Possessive / contraction: letter-'-letter or letter-'-end-of-word
            if prev.isalpha() and (nxt.isalpha() or (nxt in " ,.;:!?)") ):
                # Is it possessive 's or contraction (don't, can't, it's, ...)?
                # If preceded by 's' (e.g., "Williams'") use closing single (apostrophe)
                out.append("\u2019")  # right single = apostrophe
            elif prev.isspace() or prev in "([{—–-/" or i == 0:
                out.append("\u2018")  # left single
            else:
                out.append("\u2019")  # right single
        else:
            out.append(ch)
    return "".join(out)


# ─────────────────────────────────────────────────────────────────────────
# QUOTE STRIPPING for "Secret Book of Walt"
# ─────────────────────────────────────────────────────────────────────────

def strip_walt_quotes(text: str) -> str:
    """Remove quotation marks around 'The Secret Book of Walt' (any quote variant).
    The italics emphasis (*The Secret Book of Walt*) stays."""
    # Patterns: "The Secret Book of Walt" → The Secret Book of Walt
    #           "the Secret Book of Walt" → the Secret Book of Walt
    text = re.sub(r'["\u201c\u201d](The Secret Book of Walt)["\u201c\u201d]', r'\1', text)
    text = re.sub(r'["\u201c\u201d](the Secret Book of Walt)["\u201c\u201d]', r'\1', text)
    return text


# ─────────────────────────────────────────────────────────────────────────
# MARKDOWN PARSER
# ─────────────────────────────────────────────────────────────────────────

def parse_paragraphs(lines: list[str], in_gospel=False) -> list[dict]:
    """Convert a list of markdown lines into a list of paragraph dicts."""
    paras = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        # Skip blank lines
        if not line.strip():
            i += 1; continue

        # Headings
        if line.startswith("##### "):
            paras.append({"type": "subsubheading", "text": process_text(line[6:].strip())})
            i += 1; continue
        if line.startswith("#### "):
            paras.append({"type": "subsubheading", "text": process_text(line[5:].strip())})
            i += 1; continue
        if line.startswith("### "):
            paras.append({"type": "subheading", "text": process_text(line[4:].strip())})
            i += 1; continue
        if line.startswith("## "):
            paras.append({"type": "heading", "text": process_text(line[3:].strip())})
            i += 1; continue
        if line.startswith("# "):
            paras.append({"type": "heading", "text": process_text(line[2:].strip())})
            i += 1; continue

        # Horizontal rule
        if line.strip() in ("---", "***"):
            paras.append({"type": "divider", "text": ""})
            i += 1; continue

        # Bullet list
        if line.lstrip().startswith(("- ", "* ")) and not line.lstrip().startswith("**"):
            # Collect contiguous list items
            content = line.lstrip()[2:].strip()
            paras.append({"type": "list", "text": process_text(content)})
            i += 1; continue

        # Footnote definition: starts with superscript run + space
        m = re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)\s', line)
        if m:
            # Single-line footnote (rare to span multiple lines in this source)
            paras.append({"type": "footnote", "text": process_text(line.strip())})
            i += 1; continue

        # Table-like line: contains pipes (|) — render as monospace table line
        if "|" in line and line.count("|") >= 2:
            paras.append({"type": "table", "text": process_text(line.strip())})
            i += 1; continue

        # Verse: a line that's italicized as a whole and inside a passage
        # We use a simpler heuristic: gather contiguous non-empty lines into
        # one paragraph, then emit as 'verse' or 'prose' based on italic markers
        block_lines = [line]
        j = i + 1
        while j < len(lines):
            nxt = lines[j].rstrip()
            if not nxt.strip():
                break
            # If next line is a heading, list, or table, stop
            if nxt.lstrip().startswith(("# ", "## ", "### ", "#### ", "##### ", "- ", "* ")):
                break
            if "|" in nxt and nxt.count("|") >= 2:
                break
            if re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)\s', nxt):
                break
            if nxt.strip() in ("---", "***"):
                break
            block_lines.append(nxt)
            j += 1

        block_text = " ".join(s.strip() for s in block_lines).strip()
        # If the entire block is wrapped in *italic*, mark as verse
        is_verse = (block_text.startswith("*") and block_text.endswith("*")
                    and not block_text.startswith("**")
                    and "*" not in block_text[1:-1].replace("\\*",""))
        if is_verse and in_gospel:
            # In gospel context, a verse is a real verse
            paras.append({"type": "verse", "text": process_text(block_text)})
        else:
            paras.append({"type": "prose", "text": process_text(block_text)})
        i = j
    return paras


def process_text(t: str) -> str:
    """Apply quote normalization. Markdown emphasis (* and **) is kept intact;
    the React renderer will convert it. Quotes around 'The Secret Book of Walt' are stripped.
    """
    t = smart_quote(t)
    t = strip_walt_quotes(t)
    return t


# ─────────────────────────────────────────────────────────────────────────
# SECTION SPLITTING
# ─────────────────────────────────────────────────────────────────────────

def split_into_sections(md: str) -> dict[str, list[str]]:
    """Split source markdown into named sections matching App.jsx data keys."""
    lines = md.split("\n")
    sections = {}
    section_order = []

    # Mapping: header text → section key
    HEADER_MAP = {
        "Prefatory Poem": "prefatory_poem",
        "Preface to the Preserved Generation": "preface",
        "EDITOR'S PREFACE": "editors_preface",
        "INTRODUCTION": "introduction",
        "A NOTE ON THE REDFORD DISCOVERY": "redford",
        "TRANSLATOR'S NOTE": "translator",
        "NOTE ON THE MANUSCRIPTS AND VARIANT READINGS": "manuscripts",
        "A NOTE ON THE TEXT": "note_text",
        "THE SECRET BOOK OF WALT": "gospel",
        "AFTERWORD": "afterword",
        "APPENDIX A: CONCORDANCE OF AEONS": "appendix_a",
        "APPENDIX B: STRUCTURAL PARALLEL TO THE APOCRYPHON OF JOHN": "appendix_b",
        "APPENDIX C: THE UNICORN HORN SOTERIOLOGY": "appendix_c",
        "APPENDIX D: THE RITE OF THE HORN": "appendix_d",
        "APPENDIX E: THE RULE OF BIBLIOS": "appendix_e",
        "APPENDIX F: THE CREED OF THE DEEP WEB": "appendix_f",
        "APPENDIX G: GLOSSARY OF KEY TERMS": "appendix_g",
        "APPENDIX H: THE WALTIAN SYSTEM": "appendix_h",
        "APPENDIX I: CODICOLOGICAL TABLE": "appendix_i",
        "APPENDIX J: LITURGICAL FRAGMENT": "appendix_j",
        "APPENDIX K: RECEPTION HISTORY": "appendix_k",
        "SELECTED BIBLIOGRAPHY": "bibliography",
    }

    current_key = None
    current_lines = []
    for ln in lines:
        m = re.match(r'^## (.+?)\s*$', ln)
        if m:
            header = m.group(1).strip()
            if header in HEADER_MAP:
                if current_key:
                    sections[current_key] = current_lines
                    section_order.append(current_key)
                current_key = HEADER_MAP[header]
                current_lines = [ln]  # include the H2 itself
                continue
        if current_key:
            current_lines.append(ln)
    if current_key:
        sections[current_key] = current_lines
        section_order.append(current_key)
    return sections, section_order


# ─────────────────────────────────────────────────────────────────────────
# FOOTNOTE RENUMBERING
# ─────────────────────────────────────────────────────────────────────────

# The reading order of sections on the website. This is the order in which
# the user encounters footnotes — so renumber 1..N according to this order.
# Front matter first, gospel, then back matter.
READING_ORDER = [
    "prefatory_poem",
    "preface",
    "editors_preface",
    "redford",
    "translator",
    "manuscripts",
    "note_text",
    "introduction",       # Notes contains redford/translator/manuscripts/note_text BEFORE introduction
    "gospel",
    "appendix_a",
    "appendix_b",
    "appendix_c",
    "appendix_d",
    "appendix_e",
    "appendix_f",
    "appendix_g",
    "appendix_h",
    "appendix_i",
    "appendix_j",
    "appendix_k",
    "bibliography",
]


def renumber_footnotes(sections: dict[str, list[dict]]) -> tuple[dict[str, list[dict]], dict[str, str]]:
    """
    Walk all sections in reading order. Build mapping from
    OLD_PRINT_NUMBER → NEW_DISPLAY_NUMBER (1, 2, 3, ...) based on first-encounter order.
    Then rewrite all body-text references and footnote definitions to use the new numbers.

    Uses find_footnote_runs so that superscript suffixes on letters (G⁴⁶ etc.)
    are NOT touched.
    """
    old_to_new = {}
    counter = [0]

    def assign(old_sup: str) -> str:
        if old_sup not in old_to_new:
            counter[0] += 1
            old_to_new[old_sup] = n_to_super(counter[0])
        return old_to_new[old_sup]

    # Phase 1: assign new numbers in reading order using FIRST-occurrence semantics.
    # A footnote definition starts a paragraph (its leading superscript is its ID).
    # That leading superscript IS preceded by start-of-string (not a letter), so it's
    # picked up by find_footnote_runs naturally.
    for sec_key in READING_ORDER:
        if sec_key not in sections:
            continue
        for p in sections[sec_key]:
            text = p.get("text", "")
            for (s, e, run) in find_footnote_runs(text):
                assign(run)

    # Phase 2: rewrite all texts. Walk every superscript run in every paragraph,
    # replacing run-text in place. Build the new string by splicing.
    def rewrite(text: str) -> str:
        out = []
        last = 0
        for (s, e, run) in find_footnote_runs(text):
            out.append(text[last:s])
            new_sup = old_to_new.get(run)
            if new_sup is None:
                # Should never happen if Phase 1 was comprehensive
                new_sup = assign(run)
            out.append(new_sup)
            last = e
        out.append(text[last:])
        return "".join(out)

    for sec_key, paras in sections.items():
        for p in paras:
            if "text" in p:
                p["text"] = rewrite(p["text"])

    return sections, old_to_new


# ─────────────────────────────────────────────────────────────────────────
# INTRO SUBSECTIONS (re-organized view of introduction)
# ─────────────────────────────────────────────────────────────────────────

def split_intro_subsections(intro_paras: list[dict]) -> list[dict]:
    """Group introduction paragraphs by subheading."""
    subs = []
    current = None
    for p in intro_paras:
        if p["type"] == "subheading":
            if current:
                subs.append(current)
            current = {"title": p["text"], "paragraphs": []}
        elif current is not None:
            current["paragraphs"].append(p)
    if current:
        subs.append(current)
    return subs


# ─────────────────────────────────────────────────────────────────────────
# WORD COUNT
# ─────────────────────────────────────────────────────────────────────────

def word_count(paras: list[dict]) -> int:
    return sum(len(p.get("text", "").split()) for p in paras)


# ─────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────

def main():
    if not SRC.exists():
        print(f"ERROR: source not found at {SRC}", file=sys.stderr)
        print(f"Place SecretBookOfWalt_ResearchEdition.md at this path.", file=sys.stderr)
        sys.exit(1)

    md = SRC.read_text(encoding="utf-8")
    sec_lines, sec_order = split_into_sections(md)

    print(f"Parsed {len(sec_lines)} sections in source order:")
    for k in sec_order:
        print(f"  {k}  ({len(sec_lines[k])} lines)")

    # Convert each section's lines → paragraphs
    parsed = {}
    for key, lines in sec_lines.items():
        in_gospel = (key == "gospel")
        parsed[key] = parse_paragraphs(lines, in_gospel=in_gospel)

    # Renumber footnotes by reading order
    parsed, fn_map = renumber_footnotes(parsed)
    print()
    print(f"Renumbered {len(fn_map)} footnotes. First 10 mappings:")
    for old, new in list(fn_map.items())[:10]:
        print(f"  {old} → {new}")
    print(f"  ...and {len(fn_map)-10} more.")

    # Build output structure
    out = {}
    for key, paras in parsed.items():
        out[key] = {
            "key": key,
            "paragraphs": paras,
            "word_count": word_count(paras),
        }

    # Add intro_subsections (regrouped view of introduction)
    if "introduction" in out:
        out["intro_subsections"] = split_intro_subsections(out["introduction"]["paragraphs"])

    # Write output
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print()
    print(f"Wrote {OUT}")
    print(f"Total sections: {len(out)}")

    # Audit: verify every reference resolves
    audit_resolution(out)


def audit_resolution(data):
    """Verify every body-text reference has a matching footnote definition."""
    declared = set()
    referenced = set()

    for sec_key, sec in data.items():
        if not isinstance(sec, dict) or "paragraphs" not in sec:
            continue
        for p in sec["paragraphs"]:
            text = p.get("text", "")
            if p.get("type") == "footnote":
                # The leading superscript run = the footnote's ID
                if text:
                    runs = list(find_footnote_runs(text))
                    if runs:
                        declared.add(runs[0][2])
                        for (s, e, run) in runs[1:]:
                            referenced.add(run)
            else:
                for (s, e, run) in find_footnote_runs(text):
                    referenced.add(run)

    missing = referenced - declared
    orphan = declared - referenced

    print(f"\nAudit:")
    print(f"  Declared: {len(declared)} unique footnote IDs")
    print(f"  Referenced: {len(referenced)} unique reference IDs")
    if missing:
        print(f"  MISSING (referenced, not declared): {sorted(missing, key=super_to_n)[:10]}")
    if orphan:
        print(f"  ORPHANED (declared, never referenced): {sorted(orphan, key=super_to_n)[:10]}")
    if not missing and not orphan:
        print(f"  ✓ All references resolve. All declarations referenced.")


if __name__ == "__main__":
    main()
