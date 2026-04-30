#!/usr/bin/env python3
"""Firestore 벡터 검색 품질 테스트.

실행 방법:
  python3 scripts/test_search.py \
    --credentials "/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/docs/stacking-492708-5ea37291b3ae.json"

embed_upload.py와 동일한 FirestoreClient(transport="rest") 방식 사용.
32개 청크 전체 조회 → 코사인 유사도 계산 → TOP-3 반환.
"""

from __future__ import annotations

import argparse
import math
import os
import sys
import warnings

warnings.filterwarnings("ignore")

from dotenv import load_dotenv

load_dotenv(
    dotenv_path="/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/window-estimate-system/.env.local"
)

EMBEDDING_MODEL = "models/gemini-embedding-001"
COLLECTION_NAME = "window_knowledge"
PROJECT_ID = "stacking-492708"
DATABASE_ID = "default"
TOP_K = 3
PREVIEW_LEN = 150

QUERIES = [
    "단열 성능이 가장 좋은 창호",
    "열관류율 1등급 제품",
    "발코니창 추천",
    "이중창과 단창 차이",
    "수퍼로이 수퍼더블로이 차이",
    "아파트 발코니에 맞는 창호",
    "창호 5대 성능",
    "F-250I 에너지등급",
    "방충망 핸들",
    "아르곤 유리 단열",
]


def get_query_embedding(genai_client, text: str) -> list[float]:
    from google.genai import types

    result = genai_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            taskType="RETRIEVAL_QUERY",
            outputDimensionality=768,
        ),
    )
    return result.embeddings[0].values


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def load_all_docs(db, database: str) -> list[dict]:
    """FirestoreClient(REST)로 window_knowledge 컬렉션 전체 조회."""
    from google.cloud.firestore_v1 import _helpers

    parent = f"{database}/documents"
    response = db.list_documents(
        request={
            "parent": parent,
            "collection_id": COLLECTION_NAME,
            "page_size": 100,
        }
    )

    docs = []
    for doc in response:
        fields = doc.fields
        chunk_id = fields["chunk_id"].string_value if "chunk_id" in fields else ""
        page = int(fields["page"].integer_value) if "page" in fields else 0
        category = fields["category"].string_value if "category" in fields else ""
        chunk_text = fields["chunk_text"].string_value if "chunk_text" in fields else ""

        # embedding 필드 파싱: mapValue → fields["value"] → arrayValue → doubleValue
        embedding: list[float] = []
        if "embedding" in fields:
            emb_field = fields["embedding"]
            map_fields = emb_field.map_value.fields
            if "value" in map_fields:
                arr = map_fields["value"].array_value.values
                embedding = [v.double_value for v in arr]

        if chunk_id and embedding:
            docs.append({
                "chunk_id": chunk_id,
                "page": page,
                "category": category,
                "chunk_text": chunk_text,
                "embedding": embedding,
            })

    return docs


def top_k_similar(docs: list[dict], query_embedding: list[float], k: int) -> list[dict]:
    scored = []
    for doc in docs:
        sim = cosine_similarity(query_embedding, doc["embedding"])
        scored.append({**doc, "similarity": sim})
    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:k]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--credentials", required=True)
    args = parser.parse_args()

    cred_path = os.path.abspath(args.credentials)
    if not os.path.exists(cred_path):
        print(f"[error] credentials not found: {cred_path}")
        sys.exit(1)

    from google import genai
    from google.cloud.firestore_v1.services.firestore import FirestoreClient
    from google.oauth2 import service_account

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        print("[error] GEMINI_API_KEY not found in .env.local")
        sys.exit(1)

    genai_client = genai.Client(api_key=GEMINI_API_KEY)
    sa_creds = service_account.Credentials.from_service_account_file(cred_path)
    db = FirestoreClient(credentials=sa_creds, transport="rest")
    database = f"projects/{PROJECT_ID}/databases/{DATABASE_ID}"

    print(f"[info] 컬렉션 전체 로드 중...")
    docs = load_all_docs(db, database)
    print(f"[info] 로드된 문서: {len(docs)}개\n")

    if not docs:
        print("[error] 문서가 없습니다. Firestore 적재 상태를 확인하세요.")
        sys.exit(1)

    print(f"{'='*70}")
    print(f"Firestore 벡터 검색 품질 테스트  |  컬렉션: {COLLECTION_NAME}  |  TOP-{TOP_K}")
    print(f"{'='*70}\n")

    suspicious: list[str] = []

    for i, query in enumerate(QUERIES, 1):
        print(f"[Q{i:02d}] {query}")
        print(f"{'-'*60}")

        q_emb = get_query_embedding(genai_client, query)
        hits = top_k_similar(docs, q_emb, TOP_K)

        for rank, hit in enumerate(hits, 1):
            preview = hit["chunk_text"][:PREVIEW_LEN].replace("\n", " ")
            print(f"  #{rank}  {hit['chunk_id']}  page={hit['page']}  cat={hit['category']}  sim={hit['similarity']:.4f}")
            print(f"      {preview}...")
        print()

    print(f"{'='*70}")
    print("자체 평가:")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
