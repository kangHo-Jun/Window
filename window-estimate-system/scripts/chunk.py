#!/usr/bin/env python3
"""Markdown 청크 분할 스크립트."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

PAGE_PATTERN = re.compile(r"<!--\s*page:\s*(\d+)\s*\|\s*source:\s*(.*?)\s*-->")
PRODUCT_PATTERN = re.compile(r"\bF-\d+[A-Z]?\b", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Markdown 파일을 RAG용 청크 JSON으로 분할합니다.")
    parser.add_argument("--input", required=True, help="parse_pdf.py가 생성한 full.md 경로")
    parser.add_argument("--output", required=True, help="chunks.json 저장 경로")
    parser.add_argument("--chunk-size", type=int, default=500, help="텍스트 청크 길이")
    parser.add_argument("--overlap", type=int, default=50, help="텍스트 청크 오버랩 길이")
    return parser.parse_args()


def normalize_text(text: str) -> str:
    lines = [line.rstrip() for line in text.splitlines()]
    cleaned: list[str] = []
    blank_pending = False

    for line in lines:
        if not line.strip():
            blank_pending = True
            continue
        if blank_pending and cleaned:
            cleaned.append("")
        cleaned.append(line.strip())
        blank_pending = False

    return "\n".join(cleaned).strip()


def parse_pages(markdown_text: str) -> list[dict[str, object]]:
    matches = list(PAGE_PATTERN.finditer(markdown_text))
    if not matches:
        raise ValueError("페이지 메타데이터를 찾지 못했습니다.")

    pages: list[dict[str, object]] = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown_text)
        body = normalize_text(markdown_text[start:end])
        if not body:
            continue
        pages.append(
            {
                "page": int(match.group(1)),
                "source": match.group(2).strip(),
                "text": body,
            }
        )
    return pages


def split_page_blocks(page_text: str) -> list[tuple[str, str]]:
    lines = page_text.splitlines()
    blocks: list[tuple[str, str]] = []
    buffer: list[str] = []
    index = 0

    def flush_text() -> None:
        nonlocal buffer
        text = normalize_text("\n".join(buffer))
        if text:
            blocks.append(("text", text))
        buffer = []

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if stripped.startswith("|"):
            flush_text()
            table_lines = [line.rstrip()]
            index += 1
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index].rstrip())
                index += 1
            table_text = "\n".join(table_lines).strip()
            if table_text:
                blocks.append(("table", table_text))
            continue

        if not stripped:
            flush_text()
            index += 1
            continue

        buffer.append(line)
        index += 1

    flush_text()
    return blocks


def slice_text_with_overlap(text: str, chunk_size: int, overlap: int) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []
    if len(normalized) <= chunk_size:
        return [normalized]

    chunks: list[str] = []
    start = 0
    step = max(1, chunk_size - overlap)

    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        if end < len(normalized):
            split_at = normalized.rfind("\n", start, end)
            if split_at <= start:
                split_at = normalized.rfind(" ", start, end)
            if split_at > start:
                end = split_at

        piece = normalized[start:end].strip()
        if piece:
            chunks.append(piece)

        if end >= len(normalized):
            break
        start = max(0, end - overlap)

    return chunks


def categorize_text(text: str) -> str:
    if any(keyword in text for keyword in ("열관류율", "등급", "에너지")):
        return "energy_spec"
    if any(keyword in text for keyword in ("시공", "설치", "주문모형")):
        return "install_guide"
    if PRODUCT_PATTERN.search(text) or any(keyword in text for keyword in ("라인업", "용도")):
        return "product_spec"
    return "general"


def build_chunks(pages: list[dict[str, object]], chunk_size: int, overlap: int) -> list[dict[str, object]]:
    chunks: list[dict[str, object]] = []
    chunk_index = 1

    for page_data in pages:
        page = int(page_data["page"])
        source = str(page_data["source"])
        text = str(page_data["text"])

        for block_type, block_text in split_page_blocks(text):
            units = [block_text] if block_type == "table" else slice_text_with_overlap(block_text, chunk_size, overlap)
            for unit in units:
                chunks.append(
                    {
                        "chunk_id": f"chunk_{chunk_index:03d}",
                        "page": page,
                        "source": source,
                        "category": categorize_text(unit),
                        "text": unit,
                    }
                )
                chunk_index += 1

    return chunks


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    markdown_text = input_path.read_text(encoding="utf-8")
    pages = parse_pages(markdown_text)
    chunks = build_chunks(pages, chunk_size=args.chunk_size, overlap=args.overlap)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"pages={len(pages)} chunks={len(chunks)} output={output_path}")


if __name__ == "__main__":
    main()
