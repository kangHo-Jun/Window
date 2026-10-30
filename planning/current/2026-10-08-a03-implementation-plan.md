# A03 외풍 AI 상담 Implementation Plan

> 2026-10-12 범위 정정: 아래는 분리 전 초안/기록이다. 챗봇·AI 관련 내용은 모두 2차 B2C에 속하며 개발 중단 상태다. B2B 우선·B2C 확장 가정과 이전 다음 작업 지시 대신 [2차 재개 계획](B2C_MASTER_PLAN.md)과 [전체 구분](MASTER_PLAN.md)을 따른다. 1차 B2B 요구사항은 별도 설명 대기다.

**Goal:** 승인한 외풍 상담을 자유 입력으로 수행하고, 수정·중간 질문·근거 설명·담당자 전달 초안을 제공한다.
**Architecture:** 기존 /api/chat은 그대로 보존. /api/consultation은 서버 세션과 Gemini JSON 추출을 사용한다. 승인된 상담 절차만 작은 검색 원본으로 사용하며 미검토 제품 지식은 섞지 않는다. /consultation은 기본 입력/대화/요약만 제공한다.
**Tech Stack:** 기존 Next.js 16.2.4, React, TypeScript, Gemini REST; 추가 의존성 없음.
**Spec:** planning/current/2026-10-08-problem-solving-chatbot-plan.md, 2026-10-08 외풍 목업 승인.

## Global Constraints
- UI 디자인 후순위. baseline-chatbot-2026-10-08 및 기존 앱 경로 유지.
- 실제 제품/가격/보증 자료 미확정. 가격 생성·원인 확정·실제 접수 금지.
- 개발 검증 전용: production에서 404, localhost 개발 서버에서만 사용. 공개 다중 서버 예산(A02) 완료로 표시하지 않음.
- 로컬 호출 상한 60회/프로세스, 세션당 12회, 1,000자 입력, 1,600 출력 토큰. 실패도 사용량에 포함. 자동 재시도 없음.

## Tasks
- [x] core.ts: 고정 허용 필드·patch 검증, 미정과 삭제 처리, 누적 state와 다음 질문; knowledge.ts: 승인 절차의 출처·적용조건 검색.
- [x] provider.ts: 단일 Gemini 호출로 grounded answer/patch/intent/sourceIds 반환; JSON 검증 및 timeout/429 분리.
- [x] service.ts: 서버측 메모리 세션, TTL/동시요청/중복 requestId 및 호출 상한; 성공 응답만 state에 원자 반영.
- [x] route.ts: 요청 크기·origin·development 제한; page.tsx와 client.tsx: 기본 자유입력, 요약, 실패 재시도, session reset.
- [x] tests/consultation.test.ts: 수정·삭제·기간/수량·중간질문·출처위조·실패 원자성·중복/동시요청·전역 상한 검증.
- [ ] tsc, 새 파일 eslint, unit tests, Next build, 제한된 실제 모델/API/브라우저 대화 검증 후 인계 갱신.

검증 명령: `node scripts/test-consultation.mjs`, `npx tsc --noEmit`, `npx eslint src/lib/consultation src/app/consultation src/app/api/consultation`, `npm run build -- --webpack`.

공식 API 참고: https://ai.google.dev/gemini-api/docs/generate-content/structured-output (responseMimeType/responseJsonSchema), https://ai.google.dev/gemini-api/docs/generate-content/thinking (Gemini 2.5 thinkingBudget).

## 실행 결과
- 단위 테스트 14개, 변경 코드 eslint, 전체 Next.js webpack build 통과. 프로덕션 /consultation 및 /api/consultation은 opt-in 설정이 있어도 404 확인.
- 브라우저 세션/요청/AI_BILLING 오류 및 입력 보존 확인. 실제 Gemini 요청은 402 RESOURCE_EXHAUSTED여서 모델 응답 품질 검증은 미완료.
- 별도 코드 리뷰 지적 2건(예산 중간 질문 복귀, 초안 수정 후 유지)을 해결하고 회귀 테스트 및 재검토 완료.
- 기존 시트 route의 지원하지 않는 함수 export로 발생한 빌드 오류를 공용 모듈 이동으로 수정. 함수 및 POST 내용은 baseline과 동일함을 검토자가 확인.

## 모델 변경 (2026-10-08 후속)
사용자 요청으로 새 상담 API를 Claude Haiku 5.5(low)/Anthropic Messages API로 교체. ANTHROPIC_API_KEY 사용. 테스트 16개·빌드 통과, 실제 키 미설정으로 실모델 검증 미완료. 기존 Gemini 내용은 이전 구현 이력이다.
