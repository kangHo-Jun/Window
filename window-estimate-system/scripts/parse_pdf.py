#!/usr/bin/env python3
"""
PDF 페이지별 Markdown 추출 스크립트.

실행 예:
python scripts/parse_pdf.py --input docs/교육자료.pdf --output scripts/output/
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable, List

import fitz


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="PDF를 페이지별 Markdown으로 추출합니다.")
    parser.add_argument("--input", required=True, help="입력 PDF 경로")
    parser.add_argument("--output", required=True, help="출력 폴더 경로")
    return parser.parse_args()


def sanitize_name(name: str) -> str:
    return re.sub(r"[^\w\-.가-힣]+", "_", name).strip("_")


def split_lines(text: str) -> List[str]:
    return [line.rstrip() for line in text.splitlines()]


def normalize_cell(cell: str) -> str:
    compact = " ".join(cell.split())
    return compact.replace("|", "\\|")


def rows_to_markdown(rows: Iterable[Iterable[str]]) -> str:
    materialized = [[normalize_cell(str(cell or "")) for cell in row] for row in rows]
    materialized = [row for row in materialized if any(cell for cell in row)]
    if not materialized:
        return ""

    width = max(len(row) for row in materialized)
    normalized_rows = [row + [""] * (width - len(row)) for row in materialized]
    header = normalized_rows[0]
    divider = ["---"] * width
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(divider) + " |",
    ]
    for row in normalized_rows[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def extract_tables(page: fitz.Page) -> List[str]:
    tables: List[str] = []
    find_tables = getattr(page, "find_tables", None)
    if not callable(find_tables):
        return tables

    try:
        table_finder = find_tables()
    except Exception:
        return tables

    for table in getattr(table_finder, "tables", []):
        try:
            rows = table.extract()
        except Exception:
            continue
        markdown = rows_to_markdown(rows)
        if markdown:
            tables.append(markdown)

    return tables


def guess_heading(lines: List[str]) -> List[str]:
    content = [line for line in lines if line.strip()]
    if not content:
        return []

    first = content[0].strip()
    if len(first) <= 60 and not first.startswith(("#", "|", "<!--")):
        content[0] = f"# {first}"
    return content


def remove_table_lines(lines: List[str]) -> List[str]:
    filtered: List[str] = []
    table_hint = re.compile(r"\s{2,}|\t")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            filtered.append("")
            continue
        if table_hint.search(line) and len(stripped.split()) >= 3:
            continue
        filtered.append(stripped)
    return filtered


def build_page_markdown(page: fitz.Page, source_name: str, page_number: int) -> str:
    raw_text = page.get_text("text")
    lines = split_lines(raw_text)
    lines = remove_table_lines(lines)
    lines = guess_heading(lines)
    text_block = "\n".join(line for line in lines if line is not None).strip()
    tables = extract_tables(page)

    sections = [f"<!-- page: {page_number} | source: {source_name} -->"]
    if text_block:
        sections.append(text_block)
    if tables:
        if text_block:
            sections.append("")
        sections.append("\n\n".join(tables))

    return "\n".join(section for section in sections if section is not None).strip() + "\n"


def save_markdown(doc: fitz.Document, input_path: Path, output_dir: Path) -> List[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    base_name = sanitize_name(input_path.stem)
    source_name = input_path.name
    saved_paths: List[Path] = []
    full_parts: List[str] = []

    for index, page in enumerate(doc, start=1):
        page_markdown = build_page_markdown(page, source_name, index)
        page_path = output_dir / f"{base_name}_p{index:02d}.md"
        page_path.write_text(page_markdown, encoding="utf-8")
        saved_paths.append(page_path)
        full_parts.append(page_markdown.rstrip())

    full_path = output_dir / f"{base_name}_full.md"
    full_path.write_text("\n\n".join(full_parts).strip() + "\n", encoding="utf-8")
    saved_paths.append(full_path)
    return saved_paths


def main() -> None:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output).expanduser().resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"입력 PDF를 찾을 수 없습니다: {input_path}")

    with fitz.open(input_path) as doc:
        saved_paths = save_markdown(doc, input_path, output_dir)

    print(f"input: {input_path}")
    print(f"output_dir: {output_dir}")
    for path in saved_paths:
        print(path)


if __name__ == "__main__":
    main()
