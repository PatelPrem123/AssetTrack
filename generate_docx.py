import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import re
import os

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Configure Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    # Read markdown content
    md_path = 'AssetTrack_Comprehensive_Documentation.md'
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_lines = []
    in_table = False
    table_lines = []

    def flush_code():
        nonlocal code_lines
        if not code_lines:
            return
        code_text = "".join(code_lines)
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, 'F1F5F9')
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(code_text.rstrip())
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(15, 23, 42)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)
        code_lines = []

    def flush_table():
        nonlocal table_lines
        if not table_lines:
            return
        # Parse markdown table
        rows_data = []
        for line in table_lines:
            line = line.strip()
            if not line.startswith('|') or not line.endswith('|'):
                continue
            cells = [c.strip() for c in line.split('|')[1:-1]]
            # Skip separator line (e.g. | :--- | :--- |)
            if all(set(c).issubset({'-', ':', ' '}) for c in cells):
                continue
            rows_data.append(cells)

        if rows_data:
            num_cols = max(len(r) for r in rows_data)
            # Normalize row lengths
            for r in rows_data:
                while len(r) < num_cols:
                    r.append('')

            t = doc.add_table(rows=len(rows_data), cols=num_cols)
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            t.autofit = True

            # Style Header
            for c_idx, val in enumerate(rows_data[0]):
                cell = t.cell(0, c_idx)
                set_cell_background(cell, '0F172A')
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                run = p.add_run(val)
                run.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)

            # Style Data Rows
            for r_idx in range(1, len(rows_data)):
                bg = 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF'
                for c_idx, val in enumerate(rows_data[r_idx]):
                    cell = t.cell(r_idx, c_idx)
                    set_cell_background(cell, bg)
                    set_cell_margins(cell, top=80, bottom=80, left=140, right=140)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    run = p.add_run(val)
                    run.font.size = Pt(9.0)
                    run.font.color.rgb = RGBColor(30, 41, 59)

            doc.add_paragraph().paragraph_format.space_after = Pt(4)

        table_lines = []

    idx = 0
    while idx < len(lines):
        line = lines[idx]
        stripped = line.strip()

        # Handle Code block toggle
        if stripped.startswith('```'):
            if in_code_block:
                flush_code()
                in_code_block = False
            else:
                if in_table:
                    flush_table()
                    in_table = False
                in_code_block = True
            idx += 1
            continue

        if in_code_block:
            code_lines.append(line)
            idx += 1
            continue

        # Handle Markdown Table lines
        if stripped.startswith('|') and stripped.endswith('|'):
            table_lines.append(stripped)
            in_table = True
            idx += 1
            continue
        elif in_table:
            flush_table()
            in_table = False

        # Blank line
        if not stripped:
            idx += 1
            continue

        # Horizontal rule
        if stripped in ('---', '***', '___'):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            p_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/></w:pBdr>')
            p._p.get_or_add_pPr().append(p_border)
            idx += 1
            continue

        # Title / Heading 1 (# ...)
        if stripped.startswith('# '):
            text = stripped[2:].replace('🖥️', '').replace('📌', '').strip()
            h = doc.add_heading(level=1)
            h.paragraph_format.space_before = Pt(18)
            h.paragraph_format.space_after = Pt(6)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(16)
            run.bold = True
            run.font.color.rgb = RGBColor(2, 132, 199) # Sky 600
            idx += 1
            continue

        # Heading 2 (## ...)
        if stripped.startswith('## '):
            text = stripped[3:].strip()
            h = doc.add_heading(level=2)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(4)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(13)
            run.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
            idx += 1
            continue

        # Heading 3 (### ...)
        if stripped.startswith('### '):
            text = stripped[4:].strip()
            h = doc.add_heading(level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(2)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.bold = True
            run.font.color.rgb = RGBColor(51, 65, 85) # Slate 700
            idx += 1
            continue

        # Blockquote (> ...)
        if stripped.startswith('>'):
            callout_text = stripped.lstrip('> ').strip()
            tbl = doc.add_table(rows=1, cols=1)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = tbl.cell(0, 0)
            cell.width = Inches(6.8)
            set_cell_background(cell, 'F0F9FF') # Sky 50
            set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
            # Left border styling
            tcPr = cell._tc.get_or_add_tcPr()
            tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="0284C7"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
            tcPr.append(tcBorders)
            cp = cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(2)
            cp.paragraph_format.space_after = Pt(2)
            run = cp.add_run(callout_text)
            run.font.size = Pt(9.5)
            run.font.italic = True
            run.font.color.rgb = RGBColor(12, 74, 110) # Sky 900
            doc.add_paragraph().paragraph_format.space_after = Pt(2)
            idx += 1
            continue

        # Bullet list item (- ... or * ...)
        if stripped.startswith(('- ', '* ')):
            bullet_text = stripped[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            # Parse bold **...** inside bullet
            parts = re.split(r'(\*\*.*?\*\*)', bullet_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    p.add_run(part)
            idx += 1
            continue

        # Numbered list (1. ... or 2. ...)
        match_num = re.match(r'^(\d+)\.\s+(.*)$', stripped)
        if match_num:
            num_str, item_text = match_num.groups()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.add_run(f"{num_str}. ").bold = True
            parts = re.split(r'(\*\*.*?\*\*)', item_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    p.add_run(part)
            idx += 1
            continue

        # Regular paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15

        parts = re.split(r'(\*\*.*?\*\*|\`.*?\`|\[.*?\]\(.*?\))', stripped)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                r = p.add_run(part[2:-2])
                r.bold = True
            elif part.startswith('`') and part.endswith('`'):
                r = p.add_run(part[1:-1])
                r.font.name = 'Consolas'
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(194, 24, 91) # Pink/Crimson
            elif part.startswith('[') and ']' in part and '(' in part and part.endswith(')'):
                link_text = part[1:part.index(']')]
                r = p.add_run(link_text)
                r.font.color.rgb = RGBColor(2, 132, 199)
                r.underline = True
            else:
                p.add_run(part)

        idx += 1

    # End of document flush
    if in_code_block:
        flush_code()
    if in_table:
        flush_table()

    output_path = 'AssetTrack_Comprehensive_Documentation.docx'
    doc.save(output_path)
    file_size = os.path.getsize(output_path)
    print(f"Document saved successfully: {output_path} ({file_size} bytes)")

if __name__ == '__main__':
    create_document()
