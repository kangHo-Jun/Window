# AGENTS.md — 창호 자동 견적 프로젝트 룰

> 이 파일은 Claude Code, OpenAI Codex, Antigravity 등 모든 AI 에이전시가 자동으로 읽습니다.

---

## 행동 규칙

- 설명은 짧게
- 알았으면 "예"로 답
- 작업 완료 보고는 간결하게
- 코딩 전 반드시 감독 승인
- 질문은 한 번에 하나만

---

## 프로젝트 컨텍스트

- 항상 `docs/context.md` 를 먼저 읽고 시작
- 모르는 것은 context.md → PRD → ui.md 순서로 확인

---

## context.md 업데이트 규칙

다음 상황에서 반드시 `docs/context.md` 업데이트:

- 문서 완성 시
- 개발 Phase 완료 시
- 핵심 결정 변경 시
- 새 기능 추가 결정 시

업데이트 항목:
- 완료된 것
- 진행 중인 것
- 다음 할 일

---

## 기술 스택

- Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- 견적 엔진: json-rules-engine
- DB: Google Sheets
- DB 수집: Gemini API
- PDF: jsPDF
- 배포: Vercel

---

## 코딩 규칙

- 컴포넌트는 `src/components/` 에 위치
- 페이지는 `src/app/` 에 위치 (App Router)
- API는 `src/app/api/` 에 위치
- 환경변수는 `.env.local` 사용, 절대 하드코딩 금지
- 한글 주석 사용
- 커밋 메시지: `feat:`, `fix:`, `docs:`, `refactor:` 형식

---

## 주요 문서 위치

| 문서 | 경로 |
|------|------|
| 컨텍스트 | `docs/context.md` |
| PRD | `docs/PRD_창호견적시스템_v1.md` |
| UI 명세 | `docs/ui.md` |
| 개발 개요 | `docs/개발개요.md` |
| 가격 DB 샘플 | `docs/price_db_sample.csv` |
| 제품 DB 샘플 | `docs/products_db_sample.csv` |
