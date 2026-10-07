# 창호 견적 사이트

이 폴더는 iCloud의 창호 작업본을 2026-10-07 로컬 `Projects/창호`로 복사해 정리한 개발 작업본이다. iCloud 원본은 보존한다.

| 위치 | 내용 |
|---|---|
| `window-estimate-system/` | 현재 Next.js 견적 사이트와 챗봇. `src/components/AIChatBot.tsx`, `src/app/api/chat/route.ts`, `src/lib/ragEngine.ts`가 챗봇의 주요 코드 |
| `knowledge/sources/` | 창호 교육 PDF 원본 |
| `knowledge/curated/` | 검토·정리한 창호 진단 지식 |
| `knowledge/generated/` | PDF에서 추출한 문서와 RAG 청크 |
| `window-estimate-system/data/source/` | 견적 계산에 사용하는 제품·가격 CSV의 단일 원본. 서버 내부에서만 읽음 |
| `data/samples/` | 예시 데이터 |
| `planning/current/` | 현재 PRD, UI, 브랜드 문서 |
| `planning/research/`, `planning/history/` | 벤치마킹·연구와 이전 기획 |
| `operations/` | Cloud Run·Firestore 운영 안내 |
| `archive/direct-sync/` | 이전 정적 견적 페이지와 당시 설명서 |
| `private/` | 로컬 인증 자료. Git에서 제외 |

## 로컬 실행

```sh
cd window-estimate-system
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`을 연다. `window-estimate-system/.env.local`은 로컬에만 둔다. `window-estimate-system/data/source/`의 CSV는 서버가 직접 읽으며 웹의 `public/`에는 두지 않는다.

이 저장소는 공개되어 있다. 인증 자료와 교육 PDF 원본·추출본은 Git에서 제외하며, 필요한 경우 로컬 `private/` 및 `knowledge/`에 별도로 보관한다. GitHub 브랜치에서는 소스 코드와 기획 문서를 확인할 수 있지만, Next.js 서버 기능은 GitHub 화면만으로 실행되지 않는다.

현재 개발 상태와 남은 일은 `HANDOFF.md`, 상세 맥락은 `docs/context.md`를 확인한다.
