# Window Estimate System

## Dev Container 실행

저장소 루트의 `.devcontainer/` 기준으로 컨테이너를 열면 됩니다.

1. VS Code에서 저장소 루트를 엽니다.
2. `Reopen in Container`를 실행합니다.
3. 컨테이너 생성 후 `postCreateCommand`로 `window-estimate-system/npm ci`가 자동 실행됩니다.
4. 터미널에서 아래 명령으로 개발 서버를 실행합니다.

```bash
cd window-estimate-system
npm run dev
```

브라우저는 `http://localhost:3000`으로 접속합니다.

## 환경변수

- `window-estimate-system/.env.local` 파일이 필요합니다.
- 워크스페이스가 그대로 마운트되므로 기존 로컬 `.env.local`을 그대로 사용합니다.
- 서버 기능 확인 시 최소한 아래 값들은 채워져 있어야 합니다.

```bash
GEMINI_API_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
FIRESTORE_PROJECT_ID=
NEXT_PUBLIC_CONTACT_PHONE=
```

## 참고

- Dev Container 이미지는 Node.js 20 기반입니다.
- Python 스크립트 실행을 위해 `python3`, `pip`를 함께 설치합니다.
- 프로덕션용 이미지는 이 폴더의 [Dockerfile](Dockerfile)을 사용합니다.
