#!/usr/bin/env python3
"""
Build antioch_gospel_data.json from canonical source.

Source: GospelOfAntioch_ResearchEdition.md
Source DOI: 10.5281/zenodo.19709024

Antioch is structured differently from Walt: it's a list of SECTION objects,
where each gospel chapter has 'verses' (numbered sayings) instead of 'paragraphs'.

The current file format (committed in beac2a7) is:
  [
    { "num": "I", "title": "The Living Voice", "verses": [...] },
    ...
  ]

This script EXTENDS that format to include front matter, apparatus criticus,
and appendices as additional entries with 'paragraphs' instead of 'verses'.

The renderer (Antioch.jsx) needs to handle BOTH shapes (verses for chapters,
paragraphs for everything else) — but it already does, via the shared
SectionContent rendering pattern from App.jsx.

Footnotes:
  - Antioch's source uses per-section numbering (intro is ¹–⁸, scroll appendix
    is ¹–⁴, etc.). For website display we renumber GLOBALLY 1..N in reading order.
  - This script produces a global-numbering JSON.

Run: python3 scripts/build_antioch_data.py
"""

import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "antioch_source.md"
OUT = ROOT / "public" / "antioch_gospel_data.json"

SUPER = "¹²³⁴⁵⁶⁷⁸⁹⁰"
SUPER_TO_INT = str.maketrans(SUPER, "1234567890")
INT_TO_SUPER = str.maketrans("1234567890", SUPER)

def n_to_super(n: int) -> str:
    return str(n).translate(INT_TO_SUPER)

def super_to_n(s: str) -> int:
    return int(s.translate(SUPER_TO_INT))

# ─────────────────────────────────────────────────────────────────────────
# Same helpers as walt build
# ─────────────────────────────────────────────────────────────────────────

def find_footnote_runs(text: str):
    """Yield (start, end, run) for footnote-eligible superscript runs."""
    SUPER_SET = set(SUPER)
    i = 0
    while i < len(text):
        if text[i] in SUPER_SET:
            j = i
            while j < len(text) and text[j] in SUPER_SET:
                j += 1
            run = text[i:j]
            prev = text[i-1] if i > 0 else ""
            if not prev.isalpha():
                yield (i, j, run)
            i = j
        else:
            i += 1


def smart_quote(text: str) -> str:
    if not text:
        return text
    out = []
    for i, ch in enumerate(text):
        if ch == '"':
            prev = text[i-1] if i > 0 else " "
            if prev.isspace() or prev in "([{—–-/" or i == 0:
                out.append("\u201c")
            else:
                out.append("\u201d")
        elif ch == "'":
            prev = text[i-1] if i > 0 else " "
            nxt = text[i+1] if i+1 < len(text) else " "
            if prev.isalpha() and (nxt.isalpha() or nxt in " ,.;:!?)"):
                out.append("\u2019")
            elif prev.isspace() or prev in "([{—–-/" or i == 0:
                out.append("\u2018")
            else:
                out.append("\u2019")
        else:
            out.append(ch)
    return "".join(out)


def strip_walt_quotes(text: str) -> str:
    text = re.sub(r'["\u201c\u201d](The Secret Book of Walt)["\u201c\u201d]', r'\1', text)
    text = re.sub(r'["\u201c\u201d](the Secret Book of Walt)["\u201c\u201d]', r'\1', text)
    text = re.sub(r'["\u201c\u201d](The Gospel of Antioch)["\u201c\u201d]', r'\1', text)
    text = re.sub(r'["\u201c\u201d](the Gospel of Antioch)["\u201c\u201d]', r'\1', text)
    return text


def process_text(t: str) -> str:
    return strip_walt_quotes(smart_quote(t))


# ─────────────────────────────────────────────────────────────────────────
# PARAGRAPH PARSER (same as walt)
# ─────────────────────────────────────────────────────────────────────────

def parse_paragraphs(lines: list[str]) -> list[dict]:
    paras = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            i += 1; continue

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

        if line.strip() in ("---", "***"):
            paras.append({"type": "divider", "text": ""})
            i += 1; continue

        if line.lstrip().startswith(("- ", "* ")) and not line.lstrip().startswith("**"):
            content = line.lstrip()[2:].strip()
            paras.append({"type": "list", "text": process_text(content)})
            i += 1; continue

        m = re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)\s', line)
        if m:
            paras.append({"type": "footnote", "text": process_text(line.strip())})
            i += 1; continue

        if "|" in line and line.count("|") >= 2:
            paras.append({"type": "table", "text": process_text(line.strip())})
            i += 1; continue

        block_lines = [line]
        j = i + 1
        while j < len(lines):
            nxt = lines[j].rstrip()
            if not nxt.strip(): break
            if nxt.lstrip().startswith(("# ", "## ", "### ", "#### ", "##### ", "- ", "* ")): break
            if "|" in nxt and nxt.count("|") >= 2: break
            if re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰]+)\s', nxt): break
            if nxt.strip() in ("---", "***"): break
            block_lines.append(nxt)
            j += 1

        block_text = " ".join(s.strip() for s in block_lines).strip()
        paras.append({"type": "prose", "text": process_text(block_text)})
        i = j
    return paras


# ─────────────────────────────────────────────────────────────────────────
# GOSPEL VERSE PARSER (Antioch chapters)
# ─────────────────────────────────────────────────────────────────────────

def parse_chapter(lines: list[str], num: str, title: str) -> dict:
    """Parse a single Antioch chapter (e.g. 'I. The Living Voice') into:
       { num, title, verses: [{ type, num, ref, text }, ...] }
    Verses are detected by a leading bold marker like **1.** or **13.**
    """
    verses = []
    text_blob = "\n".join(lines)

    # Find every verse boundary: **N.** at line start
    verse_starts = []
    for m in re.finditer(r'^(\*\*(\d+)\.\*\*\s+)', text_blob, re.MULTILINE):
        verse_starts.append((m.start(), m.end(), int(m.group(2))))

    if not verse_starts:
        # No verses found — treat as paragraphs
        return {
            "num": num,
            "title": title,
            "paragraphs": parse_paragraphs(lines),
        }

    for k, (s, e, vnum) in enumerate(verse_starts):
        end = verse_starts[k+1][0] if k+1 < len(verse_starts) else len(text_blob)
        body = text_blob[e:end].strip()
        # Collapse whitespace
        body = re.sub(r'\s+', ' ', body)
        verses.append({
            "type": "prose",
            "num": vnum,
            "ref": str(vnum),
            "text": process_text(body),
        })

    return {
        "num": num,
        "title": title,
        "verses": verses,
    }


# ─────────────────────────────────────────────────────────────────────────
# SECTION SPLITTING
# ─────────────────────────────────────────────────────────────────────────

def split_into_sections(md: str):
    """Split Antioch source into named sections.

    Returns:
      front_matter: list of (section_key, lines)
      chapters: list of (num, title, lines) for the gospel
      back_matter: list of (section_key, title, lines)
    """
    lines = md.split("\n")

    front_matter_keys = {
        "Note on the Present Edition": "note_on_edition",
        "Editorial Headnote: How to Read a Sayings Gospel": "editorial_headnote",
        "INTRODUCTION": "introduction",
    }
    back_matter_keys = {
        "Apparatus Criticus": "apparatus",
        "Appendix A: Synoptic Concordance (Antioch → Thomas)": "appendix_a",
        "Appendix B: The Somatic Map": "appendix_b",
        "Appendix C: The Scroll Baptism": "appendix_c",
        "Appendix D: The Voice — Soteriological Instrument of the Gospel of Antioch": "appendix_d",
        "Appendix E: Emily Antioch and the Fold": "appendix_e",
        "Appendix F: The Three Secret Sayings": "appendix_f",
        "Appendix G: The Jesus-Form, the LOGOS* Position, and the Pearl": "appendix_g",
        "Appendix H: The Kingdom of Literature — A Cluster Commentary": "appendix_h",
        "Appendix I: The Logotic Virus": "appendix_i",
        "Appendix J: Logion 114 and the Completion of Thomas": "appendix_j",
        "Appendix K: Archive Cross-References and the Manifold": "appendix_k",
        "Selected Bibliography": "bibliography",
    }

    front = []   # list of (key, lines)
    chapters = []  # list of (num, title, lines)
    back = []    # list of (key, lines)

    current_kind = None
    current_label = None
    current_lines = []

    in_gospel = False
    gospel_lines_collected = []

    def flush():
        nonlocal current_kind, current_label, current_lines
        if current_kind == "front":
            front.append((current_label, current_lines))
        elif current_kind == "back":
            back.append((current_label, current_lines))
        elif current_kind == "gospel":
            gospel_lines_collected.extend(current_lines)
        current_lines = []

    for ln in lines:
        m_h2 = re.match(r'^## (.+?)\s*$', ln)

        if m_h2:
            header = m_h2.group(1).strip()
            if header == "THE GOSPEL OF ANTIOCH":
                flush()
                in_gospel = True
                current_kind = "gospel"
                current_label = None
                current_lines = []
                continue
            if header in front_matter_keys:
                flush()
                in_gospel = False
                current_kind = "front"
                current_label = front_matter_keys[header]
                current_lines = [ln]
                continue
            if header in back_matter_keys:
                flush()
                in_gospel = False
                current_kind = "back"
                current_label = back_matter_keys[header]
                current_lines = [ln]
                continue

        if current_kind:
            current_lines.append(ln)

    flush()
    # Return: front (list of (key, lines)), gospel_block_lines (list of lines), back (list of (key, lines))
    return front, gospel_lines_collected, back


# ─────────────────────────────────────────────────────────────────────────
# RENUMBER FOOTNOTES GLOBALLY IN READING ORDER
# ─────────────────────────────────────────────────────────────────────────

def renumber_all(front_paras, chapter_paras, back_paras):
    """In reading order: front matter → chapters (verses) → back matter.
    Renumber every superscript reference and footnote definition globally.
    """
    counter = [0]
    old_to_new = {}

    def assign(old: str) -> str:
        # Antioch resets per section in source — so the same superscript can be
        # encountered multiple times pointing to DIFFERENT footnotes. We need
        # context-aware mapping. But because our parser preserves footnote
        # definitions where they appear, we can use a per-walk-position counter
        # and a per-section mapping reset.
        key = old
        if key not in old_to_new:
            counter[0] += 1
            old_to_new[key] = n_to_super(counter[0])
        return old_to_new[key]

    def rewrite(text: str) -> str:
        out = []
        last = 0
        for (s, e, run) in find_footnote_runs(text):
            out.append(text[last:s])
            new_sup = old_to_new.get(run)
            if new_sup is None:
                new_sup = assign(run)
            out.append(new_sup)
            last = e
        out.append(text[last:])
        return "".join(out)

    # Antioch's per-section numbering means we need to assign new numbers
    # SECTION BY SECTION. Each section gets its own old→new map, then we
    # rewrite that section's text with that map, then reset.

    def process_section(paragraph_list):
        # Local map for this section
        section_old_to_new = {}
        # Phase 1: walk in section order, assign new numbers
        for p in paragraph_list:
            text = p.get("text", "")
            for (s, e, run) in find_footnote_runs(text):
                if run not in section_old_to_new:
                    counter[0] += 1
                    section_old_to_new[run] = n_to_super(counter[0])
        # Phase 2: rewrite
        for p in paragraph_list:
            text = p.get("text", "")
            if not text: continue
            out = []
            last = 0
            for (s, e, run) in find_footnote_runs(text):
                out.append(text[last:s])
                out.append(section_old_to_new[run])
                last = e
            out.append(text[last:])
            p["text"] = "".join(out)

    def process_verses(verse_list):
        section_old_to_new = {}
        for v in verse_list:
            text = v.get("text", "")
            for (s, e, run) in find_footnote_runs(text):
                if run not in section_old_to_new:
                    counter[0] += 1
                    section_old_to_new[run] = n_to_super(counter[0])
        for v in verse_list:
            text = v.get("text", "")
            if not text: continue
            out = []
            last = 0
            for (s, e, run) in find_footnote_runs(text):
                out.append(text[last:s])
                out.append(section_old_to_new[run])
                last = e
            out.append(text[last:])
            v["text"] = "".join(out)

    # READING ORDER:
    for paragraph_list in front_paras:
        process_section(paragraph_list)
    for verse_list in chapter_paras:
        process_verses(verse_list)
    for paragraph_list in back_paras:
        process_section(paragraph_list)

    return counter[0]


# ─────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────

def main():
    if not SRC.exists():
        print(f"ERROR: source not found at {SRC}", file=sys.stderr)
        sys.exit(1)

    md = SRC.read_text(encoding="utf-8")

    # Antioch's source has flat 114 logia under "THE GOSPEL OF ANTIOCH" with
    # no chapter divisions. We PRESERVE the existing 8-chapter curatorial
    # grouping from the previously committed antioch_gospel_data.json:
    #   I. The Living Voice (1-12)
    #   II. The Twin (13)
    #   III. The Mirror (14-25)
    #   IV. Be Flutterbys (26-46)
    #   V. The Two Masters (47-59)
    #   VI. The Machine and the Ghost (60-75)
    #   VII. The Voice in the Night (76-95)
    #   VIII. The Kingdom of Literature (96-114)

    CHAPTER_RANGES = [
        ("I",    "The Living Voice",            1,  12),
        ("II",   "The Twin",                    13, 13),
        ("III",  "The Mirror",                  14, 25),
        ("IV",   "Be Flutterbys",               26, 46),
        ("V",    "The Two Masters",             47, 59),
        ("VI",   "The Machine and the Ghost",   60, 75),
        ("VII",  "The Voice in the Night",      76, 95),
        ("VIII", "The Kingdom of Literature",   96, 114),
    ]

    front, gospel_lines, back = split_into_sections(md)

    # Parse the gospel block as a flat list of verses (numbered logia)
    gospel_verses = parse_logia(gospel_lines)
    print(f"Parsed {len(gospel_verses)} logia from gospel block")

    print(f"\nFront-matter sections: {len(front)}")
    for k, _ in front:
        print(f"  {k}")
    print(f"\nBack-matter sections: {len(back)}")
    for k, _ in back:
        print(f"  {k}")

    # Build chapter dicts using the curated ranges
    chapters_parsed = []
    for num, title, lo, hi in CHAPTER_RANGES:
        chapter_verses = [v for v in gospel_verses if lo <= v["num"] <= hi]
        chapters_parsed.append({
            "num": num,
            "title": title,
            "verses": chapter_verses,
        })

    # Parse front and back as paragraphs
    front_parsed = []
    for key, lines in front:
        front_parsed.append({"key": key, "paragraphs": parse_paragraphs(lines)})

    back_parsed = []
    for key, lines in back:
        back_parsed.append({"key": key, "paragraphs": parse_paragraphs(lines)})

    # Renumber footnotes globally in reading order
    front_paras = [s["paragraphs"] for s in front_parsed]
    chapter_verses_lists = [c["verses"] for c in chapters_parsed]
    back_paras = [s["paragraphs"] for s in back_parsed]
    total_fn = renumber_all(front_paras, chapter_verses_lists, back_paras)
    print(f"\nGlobal footnotes after renumbering: {total_fn}")

    # Build output as a single list (preserving the existing data shape)
    output = []
    for s in front_parsed:
        output.append({
            "kind": "front_matter",
            "key": s["key"],
            "paragraphs": s["paragraphs"],
        })
    for c in chapters_parsed:
        output.append({
            "kind": "chapter",
            "num": c["num"],
            "title": c["title"],
            "verses": c["verses"],
        })
    for s in back_parsed:
        output.append({
            "kind": "back_matter",
            "key": s["key"],
            "paragraphs": s["paragraphs"],
        })

    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {OUT} ({len(output)} entries)")

    audit(output)


def parse_logia(lines: list[str]) -> list[dict]:
    """Parse the flat gospel block (lines under '## THE GOSPEL OF ANTIOCH').
    Each logion starts with 'NN.' at line start (NOT bold-wrapped in this source).
    """
    verses = []
    text_blob = "\n".join(lines)
    # Find every logion start: 'NN.' at line start
    starts = []
    for m in re.finditer(r'^(\d+)\.\s+', text_blob, re.MULTILINE):
        starts.append((m.start(), m.end(), int(m.group(1))))

    for k, (s, e, vnum) in enumerate(starts):
        end = starts[k+1][0] if k+1 < len(starts) else len(text_blob)
        body = text_blob[e:end].strip()
        # Collapse internal whitespace
        body = re.sub(r'\s+', ' ', body)
        # Stop at footnote definitions or major dividers
        # (those will be parsed separately)
        body = re.split(r'\n[\u00B9\u00B2\u00B3\u2070-\u2079]', body)[0]
        verses.append({
            "type": "prose",
            "num": vnum,
            "ref": str(vnum),
            "text": process_text(body),
        })
    return verses


def audit(data):
    declared = set()
    referenced = set()
    for entry in data:
        seq = entry.get("paragraphs") or entry.get("verses") or []
        for p in seq:
            text = p.get("text", "")
            if p.get("type") == "footnote":
                runs = list(find_footnote_runs(text))
                if runs:
                    declared.add(runs[0][2])
                    for s, e, r in runs[1:]:
                        referenced.add(r)
            else:
                for s, e, r in find_footnote_runs(text):
                    referenced.add(r)
    missing = referenced - declared
    print(f"\nAudit: {len(declared)} declared, {len(referenced)} referenced.")
    if missing:
        print(f"  MISSING refs: {sorted(missing, key=super_to_n)}")
    else:
        print("  ✓ All references resolve.")


if __name__ == "__main__":
    main()
