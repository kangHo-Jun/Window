import json
import time
import argparse
import os
from google import genai
from google.genai import types
from google.oauth2 import service_account
from dotenv import load_dotenv
from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.services.firestore import FirestoreClient
from google.cloud.firestore_v1.types import Document
from google.cloud.firestore_v1.types import Write
from google.cloud.firestore_v1.types import DocumentTransform
from google.cloud.firestore_v1.vector import Vector

# .env.local에서 키 로드
load_dotenv(dotenv_path="../window-estimate-system/.env.local")
load_dotenv(
    dotenv_path="/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/window-estimate-system/.env.local"
)

EMBEDDING_MODEL = "models/gemini-embedding-001"
COLLECTION_NAME = "window_knowledge"
BRAND_NAME = "LX지인"
PROJECT_ID = "stacking-492708"
DATABASE_ID = "default"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
print(f"[debug] API KEY 로드: {'OK' if GEMINI_API_KEY else 'FAIL'}")
client = genai.Client(api_key=GEMINI_API_KEY)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--credentials", required=True)
    args = parser.parse_args()

    # credentials 파일 존재 확인
    cred_path = os.path.abspath(args.credentials)
    if not os.path.exists(cred_path):
        print(f"[error] credentials not found: {cred_path}")
        return

    # Firestore 초기화
    sa_creds = service_account.Credentials.from_service_account_file(cred_path)
    db = FirestoreClient(credentials=sa_creds, transport="rest")

    # Gemini 클라이언트
    # chunks.json 읽기
    with open(args.input, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    success, fail = 0, 0

    for chunk in chunks:
        try:
            # 임베딩
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=chunk["text"],
                config=types.EmbedContentConfig(
                    taskType="RETRIEVAL_DOCUMENT",
                    outputDimensionality=768,
                ),
            )
            embedding_values = result.embeddings[0].values

            # Firestore 저장
            document_name = (
                f"projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/"
                f"{COLLECTION_NAME}/{chunk['chunk_id']}"
            )
            document = Document(
                name=document_name,
                fields={
                    "chunk_id": _helpers.encode_value(chunk["chunk_id"]),
                    "page": _helpers.encode_value(chunk["page"]),
                    "source": _helpers.encode_value(chunk["source"]),
                    "category": _helpers.encode_value(chunk["category"]),
                    "brand": _helpers.encode_value(BRAND_NAME),
                    "chunk_text": _helpers.encode_value(chunk["text"]),
                    "embedding": _helpers.encode_value(Vector(embedding_values)),
                },
            )
            write = Write(
                update=document,
                update_transforms=[
                    DocumentTransform.FieldTransform(
                        field_path="created_at",
                        set_to_server_value=DocumentTransform.FieldTransform.ServerValue.REQUEST_TIME,
                    )
                ],
            )
            db.commit(
                database=f"projects/{PROJECT_ID}/databases/{DATABASE_ID}",
                writes=[write],
            )

            success += 1
            print(f"[ok] {chunk['chunk_id']} (page {chunk['page']})")
            time.sleep(0.5)

        except Exception as e:
            fail += 1
            print(f"[fail] {chunk['chunk_id']} — {e}")

    print(f"\n완료: 성공 {success} / 실패 {fail}")


if __name__ == "__main__":
    main()
