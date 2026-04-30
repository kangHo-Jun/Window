# Firestore 설정 가이드

이 문서는 `stacking-492708` 프로젝트 기준으로 작성했습니다.  
PDF 지식DB 청크를 Firestore `window_knowledge` 컬렉션에 적재하기 위한 실제 설정 절차입니다.

## 1. Firestore 데이터베이스 생성

### 접속 경로
- GCP 콘솔:
  - `https://console.cloud.google.com/firestore/databases?project=stacking-492708`

### 생성 절차
1. GCP 콘솔에서 프로젝트를 `stacking-492708`로 선택합니다.
2. 왼쪽 메뉴 또는 검색창에서 `Firestore`를 엽니다.
3. `데이터베이스 만들기`를 클릭합니다.
4. 모드는 반드시 `Native mode`를 선택합니다.

### Native 모드 선택 이유
- 현재 프로젝트는 Firestore 문서 컬렉션 구조를 그대로 사용합니다.
- Python 업로더가 Firestore Native API를 기준으로 동작합니다.
- Vector 직렬화 및 문서 단위 저장이 Native 모드 기준으로 검증되었습니다.

### 생성 시 입력값
- 데이터베이스 ID: `default`
  - 주의: 괄호 없이 `default`만 입력합니다.
  - 실제 API 경로는 `projects/stacking-492708/databases/default`입니다.
- 리전: `asia-northeast3`
  - 이유: 현재 Cloud Run과 운영 리전이 동일하여 지연시간과 운영 복잡도를 줄일 수 있습니다.
- 실시간 업데이트: `비활성화`
  - 이 프로젝트는 실시간 구독보다 배치 적재/조회가 중심입니다.

### 화면에서 확인할 것
- 데이터베이스 상세 화면에서 아래처럼 보여야 합니다.
  - 프로젝트: `stacking-492708`
  - 데이터베이스 ID: `default`
  - 위치: `asia-northeast3`
  - 유형: `Firestore Native`

### 스크린샷에서 봐야 하는 위치
- 상단 상세 정보 영역에서:
  - `Database ID`
  - `Location`
  - `Type`
- 여기서 `default`가 맞는지 확인합니다.

## 2. 서비스 계정 JSON 발급

### 접속 경로
- GCP IAM 서비스 계정:
  - `https://console.cloud.google.com/iam-admin/serviceaccounts?project=stacking-492708`

### 대상 서비스 계정
- `loading-sheet@stacking-492708.iam.gserviceaccount.com`

### 발급 절차
1. 서비스 계정 목록에서 `loading-sheet@stacking-492708.iam.gserviceaccount.com`를 클릭합니다.
2. 상단 탭에서 `키`를 엽니다.
3. `키 추가` → `새 키 만들기`를 클릭합니다.
4. 형식은 `JSON`을 선택합니다.
5. 다운로드된 파일을 아래 위치로 옮깁니다.

### 저장 위치
- 권장 위치:
  - `docs/stacking-492708-5ea37291b3ae.json`

### .gitignore 등록
- 반드시 Git에 올라가지 않게 막아야 합니다.
- 루트 `.gitignore`에 아래 항목이 있어야 합니다.

```gitignore
docs/firebase-credentials.json
```

또는 실제 파일명을 직접 막아도 됩니다.

```gitignore
docs/stacking-492708-5ea37291b3ae.json
```

### 화면에서 확인할 것
- 서비스 계정 이메일이 정확히 아래와 같아야 합니다.

```text
loading-sheet@stacking-492708.iam.gserviceaccount.com
```

### 스크린샷에서 봐야 하는 위치
- 서비스 계정 상세 > `키` 탭
- JSON 키가 생성됐는지
- 다운로드 후 Finder에서 `docs/` 폴더에 파일이 들어갔는지

## 3. Python 패키지 설치

### 필요한 패키지
- `pymupdf`
- `google-genai`
- `google-generativeai`
- `firebase-admin`
- `google-cloud-firestore`
- `python-dotenv`

### 설치 명령어

```bash
cd "/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/window-estimate-system"
pip3 install pymupdf
pip3 install google-genai
pip3 install google-generativeai firebase-admin
pip3 install python-dotenv
```

### 주의
- macOS에서는 `python` 대신 `python3`, `pip` 대신 `pip3`를 사용합니다.

## 4. 알려진 문제 및 해결법

이 섹션은 이 프로젝트에서 실제로 겪었던 문제만 정리했습니다.

### 문제 1. `(default)` vs `default` DB ID 차이

오류 예시:

```text
404 The database (default) does not exist for project stacking-492708
```

원인:
- Firestore 콘솔에서 생성된 실제 DB ID는 `default`입니다.
- 일부 클라이언트 경로가 내부적으로 `(default)`를 찾으면서 mismatch가 발생했습니다.

해결:
- DB 경로를 아래처럼 명시적으로 사용합니다.

```text
projects/stacking-492708/databases/default
```

### 문제 2. `firebase-admin` / 고수준 Firestore 클라이언트 404

오류 예시:

```text
404 The database (default) does not exist for project stacking-492708
```

원인:
- `firebase-admin` 고수준 경로와 일부 Firestore Python 클라이언트 경로가 현재 프로젝트 DB와 맞지 않았습니다.

해결:
- `google-cloud-firestore`의 REST transport 경로로 직접 저장합니다.
- 현재 업로더는 아래 방식으로 고정돼 있습니다.

```python
from google.cloud.firestore_v1.services.firestore import FirestoreClient

db = FirestoreClient(credentials=sa_creds, transport="rest")
database = "projects/stacking-492708/databases/default"
```

### 문제 3. `python` 실행 안 됨

오류 예시:

```text
command not found: python
```

해결:

```bash
python3 scripts/embed_upload.py ...
```

### 문제 4. 상대경로 credentials 인식 실패

오류 예시:

```text
[error] credentials not found: docs/firebase-credentials.json
```

원인:
- 작업 디렉토리가 다르면 상대경로가 깨질 수 있습니다.

해결:
- 서비스 계정 JSON은 절대경로로 넘깁니다.

```bash
python3 scripts/embed_upload.py \
  --input scripts/output/chunks.json \
  --credentials "/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/docs/stacking-492708-5ea37291b3ae.json"
```

### 문제 5. API 키 로드 실패

오류 예시:

```text
[debug] API KEY 로드: FAIL
```

해결:
- `.env.local`에서 직접 로드하도록 설정합니다.
- 현재 스크립트는 `python-dotenv`를 사용합니다.

```python
from dotenv import load_dotenv

load_dotenv(dotenv_path="/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/window-estimate-system/.env.local")
```

## 5. 적재 스크립트 실행

### API 키 준비
- `.env.local` 안에 아래 키가 있어야 합니다.

```env
GEMINI_API_KEY=실제키
```

### 환경변수 수동 설정 예시

```bash
export GEMINI_API_KEY="실제_키"
```

### 실제 스크립트는 `.env.local`도 같이 읽음
- 현재 업로더는 `.env.local`을 직접 로드하도록 되어 있습니다.
- 따라서 `export` 없이도 동작할 수 있지만, 문제 추적 시에는 `export`가 더 명확합니다.

### 실행 명령어

```bash
cd "/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/window-estimate-system"

python3 scripts/embed_upload.py \
  --input scripts/output/chunks.json \
  --credentials "/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/docs/stacking-492708-5ea37291b3ae.json"
```

### 정상 실행 시 예시

```text
[debug] API KEY 로드: OK
[ok] chunk_001 (page 1)
...
[ok] chunk_032 (page 21)

완료: 성공 32 / 실패 0
```

## 6. 정상 완료 확인

### Firestore 콘솔 URL
- `https://console.cloud.google.com/firestore/databases/-default-/data?project=stacking-492708`

### 확인 방법
1. Firestore 콘솔을 엽니다.
2. 데이터 탭으로 이동합니다.
3. 컬렉션 목록에서 `window_knowledge`를 찾습니다.
4. 문서 개수가 `32개` 이상인지 확인합니다.
5. 임의 문서 하나를 열고 아래 필드를 확인합니다.

### 문서에서 확인할 필드
- `chunk_id`
- `page`
- `source`
- `category`
- `brand`
- `chunk_text`
- `embedding`
- `created_at`

### 스크린샷에서 봐야 하는 위치
- 좌측 컬렉션 목록에 `window_knowledge`
- 중앙 문서 목록에 `chunk_001` ~ `chunk_032`
- 우측 상세 패널에 `embedding`, `created_at`

## 참고: 이 프로젝트에서 최종적으로 사용한 방식

현재 업로더의 핵심은 아래입니다.

1. Gemini 임베딩:

```python
result = client.models.embed_content(
    model="models/gemini-embedding-001",
    contents=chunk["text"],
    config=types.EmbedContentConfig(
        taskType="RETRIEVAL_DOCUMENT",
        outputDimensionality=768,
    ),
)
```

2. Firestore 저장:

```python
db = FirestoreClient(credentials=sa_creds, transport="rest")
database = "projects/stacking-492708/databases/default"
```

3. Vector 직렬화:

```python
embedding_field = _helpers.encode_value(Vector(embedding_values))
```

4. 서버 타임스탬프:

```python
DocumentTransform.FieldTransform(
    field_path="created_at",
    set_to_server_value=DocumentTransform.FieldTransform.ServerValue.REQUEST_TIME,
)
```
