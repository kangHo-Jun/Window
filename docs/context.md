# 창호 프로젝트 컨텍스트 (새 창 시작용)

> 이 문서를 새 창 첫 메시지로 붙여넣으세요.
> "이 문서를 읽고 프로젝트 맥락을 파악한 후 이어서 진행하라"

---

## 역할 정의
- **나 (사용자)**: 감독. 지시하고 피드백. 절대 코딩 안 함
- **Claude**: 코딩 에이전시 감독. 지시/피드백/평가. 코딩 안 함
- **에이전시**: Claude가 지시해서 실제 작업 수행

> 설명 짧게, 피드백 짧게, 알았으면 "예"

---

## 프로젝트 한 줄 요약
LX지인 창호 대리점을 위한 **창호 가견적 자동화 사이트** 구축
→ 소비자 신뢰 획득 → 상담 전화 유도가 최종 목적

---

## 핵심 결정사항 (변경 불가)

| 항목 | 결정 |
|------|------|
| 벤치마킹 | 휴그린 SYNC (hugreen.kr/sync/creation) |
| 입력 방식 | 옵션A(스마트 레고식: 평형→자동구성) + 옵션B(대화형 3문항 유지) 병렬 제공 |
| 브랜드 비교 | LX지인(프리미엄) / KCC(중간) / 기타(실속) |
| 출력물 | 3사 비교표 + 절감액 계산기 + 컨설팅 레포트 + PDF + 상담연결 |
| 개발 단계 | 1차: 폼 기반 / 2차: RAG 웹 채팅봇 |
| 기술 스택 | Next.js + Tailwind + shadcn/ui + Google Sheets + Google Cloud Run |
| DB 수집 | Gemini API로 크롤링 + Google Sheets 직접 입력 |
| 아키텍처 | A2UI + JSON 중심 + json-rules-engine |

---

## 현재까지 완료된 것

| 문서/작업 | 위치 | 상태 |
|------|------|------|
| 개발개요.md | docs/ | ✅ 완료 |
| PRD v1.1 | docs/ | ✅ 완료 |
| ui.md | docs/ | ✅ 완료 (섹션 1~14 전체) |
| db_structure.md | docs/ | ✅ 완료 |
| db_products_v2.csv | docs/ | ✅ 완료 |
| db_prices_v2.csv | docs/ | ✅ 완료 |
| db_configurations_v2.csv | docs/ | ✅ 완료 |
| db_margins.csv | docs/ | ✅ 완료 |
| google_sheets_setup_guide.md | docs/ | ✅ 완료 |
| CLAUDE.md | 루트 | ✅ 완료 |
| AGENTS.md | 루트 | ✅ 완료 |
| context.md | docs/ | ✅ 이 문서 |
| Google Sheets DB 구축 | - | ✅ 완료 (구글시트연동 준비) |
| 개발 Phase 1 (입력 폼) | - | ✅ 완료 (Smart Lego/Chat) |
| 개발 Phase 2 (계산 엔진) | - | ✅ 완료 (3사 비교/절감액) |
| 개발 Phase 3 (레포트/PDF) | - | ✅ 완료 (나눔고딕 PDF) |
| Google Sheets 실제 연동 | `window-estimate-system/` | ✅ 완료 |
| Cloud Run 배포 | `window-estimate-system/` | ✅ 완료 |
| Cloud Build 배포 설정 문서화 | `docs/구글런설정.md` | ✅ 완료 |
| Cloud Build 서비스 계정 로그 권한 부여 | GCP IAM | ✅ 완료 |
| `loading-sheet` Artifact Registry 조회 권한 부여 | GCP IAM | ✅ 완료 |
| `GEMINI_API_KEY` Secret Manager 등록 | GCP Secret Manager | ✅ 완료 |
| 구글런설정.md 최신 권한 이슈 반영 | `docs/구글런설정.md` | ✅ 완료 |
| ver20 RAG 챗봇 1차 구현 | `window-estimate-system/` | ✅ 완료 |
| AIChatBot 상호작용 버그 수정 | `window-estimate-system/` | ✅ 완료 |
| Gemini 모델 `gemini-2.0-flash` 교체 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 평형 중복 안내 문구 수정 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 대화 내용 세로 스크롤 수정 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 `route.ts` 상태 주입형 프롬프트 구조 개편 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 클라이언트 `fields` API 전달 및 프롬프트 주입 보강 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 최소 정보 3개 기반 빠른 가견적 버튼 추가 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 빠른 가견적 버튼 헤더 우측 고정으로 이동 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 견적 레벨 시스템 1~3단계 및 출력 분기 구현 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 Sentiment Detection 및 Fallback Handling 추가 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 지역명 오입력(`한국` 등) fallback 보강 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 `통과/패스` 스킵 처리 및 동적 오차율 반영 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 이름 수집 / 상시 헤더 버튼 / 상담필요 시트 플래그 추가 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 history 중복 전송 제거 및 이름/숫자 문맥 처리 보정 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 이름 단독 입력 정규식 보정 | `window-estimate-system/` | ✅ 완료 |
| Gemini 모델 `gemini-2.5-flash` 교체 | `window-estimate-system/` | ✅ 완료 |
| SmartOptions OPTION_MAP 허용값 불일치 수정 | `window-estimate-system/` | ✅ 완료 |
| SmartOptions → Gemini `currentQuestionField` 동기화 | `window-estimate-system/` | ✅ 완료 |
| pyeong 저장 형식 `'30평대'` 통일 | `window-estimate-system/` | ✅ 완료 |
| `quoteLevel >= 1` 시 SmartOptions 버튼 숨김 | `window-estimate-system/` | ✅ 완료 |
| `route.ts` 전면 재설계 — Gemini 대화 주도 구조 | `window-estimate-system/` | ✅ 완료 |
| ragEngine `customerName` 오추출 차단 | `window-estimate-system/` | ✅ 완료 |
| SmartOptions → Gemini JSON `options` 기반으로 전환 | `window-estimate-system/` | ✅ 완료 |
| PRD_v2.0_봇고도화_final.md | `docs/` | ✅ 완료 |
| brand_voice_지인이.md | `docs/` | ✅ 완료 |
| AI 챗봇 raw JSON reply 노출 방지 및 오피스텔→아파트 매핑 보강 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 속도 최적화 1차 — 정규식 fast-path + 단일 Gemini 호출 + SSE 스트리밍 | `window-estimate-system/` | ✅ 완료 |
| sentimentDetector.ts | `window-estimate-system/src/lib/` | ✅ 완료 |
| intentClassifier.ts | `window-estimate-system/src/lib/` | ✅ 완료 |
| personaEngine.ts | `window-estimate-system/src/lib/` | ✅ 완료 |
| dynamicQuestion.ts | `window-estimate-system/src/lib/` | ✅ 완료 |
| skipDetector.ts | `window-estimate-system/src/lib/` | ✅ 완료 |
| quoteLevelEngine.ts | `window-estimate-system/src/lib/` | ✅ 완료 |
| Gemini `gemini-2.5-flash` 연결 교체 | `window-estimate-system/` | ✅ 완료 |
| AI 챗봇 속도 최적화 — 정규식 fast-path + 단일 Gemini 호출 + SSE 스트리밍 | `window-estimate-system/` | ✅ 완료 |
| Phase 3 - QuoteCard.tsx 인라인 가견적 카드 (레벨 1/2/3 차별화) | `window-estimate-system/src/components/` | ✅ 완료 |
| Phase 3 - consumerGrouping.ts 소비자 5그룹 자동 분류 | `window-estimate-system/src/lib/` | ✅ 완료 |
| Phase 3 - AIChatBot 인라인 QuoteCard 표시 연동 | `window-estimate-system/src/components/` | ✅ 완료 |
| Phase 4 - OperatorReport.tsx 운영자 전략 카드 | `window-estimate-system/src/components/` | ✅ 완료 |
| Phase 4 - sheets/route.ts 운영자 데이터 20컬럼 고도화 | `window-estimate-system/src/app/api/sheets/` | ✅ 완료 |
| Phase 4 - fallbackCount 실제 추적 + Human-in-the-Loop 플래그 | `window-estimate-system/src/app/api/chat/` | ✅ 완료 |
| homewindow.kr 벤치마킹 분석 문서 | docs/ | ✅ 완료 |
| homewindow.kr 벤치마킹 분석 | docs/ | ✅ 완료 |
| benchmarking_homewindow.md 저장 | `docs/benchmarking_homewindow.md` | ✅ 완료 |
| Hugreen SYNC + homewindow.kr 재분석 문서 | `docs/benchmarking_hugreen.md` | ✅ 완료 |
| hugreen.kr 벤치마킹 분석 | docs/ | ✅ 완료 |
| 전체 구현 로드맵 확정 (Phase1~5) | docs/ | ✅ 완료 |
| Gemini 2.5-flash 모델 교체 | window-estimate-system/ | ✅ 완료 |
| Gemini 주도 대화 flow 재설계 | window-estimate-system/ | ✅ 완료 |
| AIChatBot 반응형 실시간 견적 레이아웃 재설계 (데스크탑 60/40, 태블릿 접이식, 모바일 바텀시트/FAB) | `window-estimate-system/src/components/` | ✅ 완료 |
| AIChatBot 헤더 액션/실시간 견적 패널 톤다운 리디자인 | `window-estimate-system/src/components/` | ✅ 완료 |
| AIChatBot 헤더 액션 버튼 오버플로우/잘림 보정 | `window-estimate-system/src/components/` | ✅ 완료 |
| AI 챗봇 공간별 창 크기 범주 선택 및 공간 규격 연동 | `window-estimate-system/`, `docs/db_space_size.csv` | ✅ 완료 |
| AI 챗봇 공간 카드 인라인 크기 선택 통합 | `window-estimate-system/src/components/AIChatBot.tsx` | ✅ 완료 |
| AI 추천 고도화 1차 (선호 규칙/맥락 멘트/난방비 절감/결과 카드 강화) | `window-estimate-system/`, `docs/db_preference_rules.csv` | ✅ 완료 |
| 창호 진단 지식DB 문서화 및 프롬프트 주입 | `docs/창호_진단_지식DB.md`, `window-estimate-system/public/` | ✅ 완료 |
| 불편사항 심층진단 flow (복수선택/연식/맞춤질문/진단결과) | `window-estimate-system/` | ✅ 완료 |
| 불편사항 심층진단 flow 구현 | `window-estimate-system/` | ✅ 완료 |
| 창호 진단 지식DB 작성 및 Gemini 프롬프트 주입 | `docs/` | ✅ 완료 |
| 불편사항 복수선택 → 즉시 심층진단 진입 | `window-estimate-system/` | ✅ 완료 |
| isSelectionCommitMessage 제어 메시지 분리 | `window-estimate-system/` | ✅ 완료 |
| diagnosisStep 0→1→2 진단 흐름 완성 | `window-estimate-system/` | ✅ 완료 |

### ui.md 완성 섹션 목록
1. UI 개요 및 목표
2. 페이지 구조
3. 컴포넌트 목록
4. 각 페이지별 상세 UI 스펙 (Step 1~4 + Result)
5. 디자인 시스템 (색상/폰트/간격)
6. 반응형 기준
7. 동적 위젯 스펙
8. 구현 순서 (Next.js 마이그레이션 기준)
9. 옵션B 대화형 입력 UI 스펙
10. 요구사항 폼 UI 스펙
11. 3사 비교표 UI 스펙
12. 난방비 절감 계산기 UI 스펙
13. 메인 랜딩 페이지 UI 스펙
14. 상담 신청 폼 + PDF 다운로드 흐름

---

## 기존 프로토타입 현황
- 파일: `direct-sync.html` / `direct-sync.js` / `direct-sync.css` / `config.js`
- Phase 1~5 완료 (레고식 입력 → 가격계산 → PDF)
- **Critical 버그**: 이미지 로컬 절대경로 깨짐, Google Sheets 미연결
- **Minor 버그**: PDF 한글 깨짐, 총가격 하드코딩 잔존

---

## 진행 중인 것
- 로컬 빌드 통과 상태에서 브라우저 실환경 검증 및 최종 UI 안정화 진행 중
- Phase 5 재배포 전, 대화형 Flow 마무리 점검 진행 중
- `부분확장` 공간 구성은 현재 `비확장형` fallback으로 동작하며, DB 원본 보강 여부 검토 진행 중

---

## 다음 할 일 (현재버그 정의 포함)
[다음 작업 순서]
1. `부분확장` 포함 전체 확장 옵션별 공간 카드 노출 브라우저 실환경 재검증
2. 공간 선택 완료 후 연식 → 불편사항 → 시공시기 흐름 재검증
3. 추천 이유/난방비 절감이 결과 카드에 실제 노출되는지 UI 검증
4. `부분확장` 전용 공간 구성 DB를 `db_configurations_v2.csv`에 보강할지 결정
5. Cloud Run `ver20` 재배포

---

## 주요 파일 목록
```
project/
├── direct-sync.html      # 메인 HTML (프로토타입)
├── direct-sync.js        # 메인 JS
├── direct-sync.css       # 스타일
├── config.js             # 설정 (API키 미입력)
└── docs/
    ├── context.md        # 이 파일 (새 창 복원용)
    ├── 개발개요.md
    ├── task.md
    ├── implementation_plan.md
    ├── ui.md             # UI 개발 문서
    ├── benchmarking_homewindow.md # 홈윈도우 분석
    ├── PRD_창호견적시스템_v1.md
    ├── price_db_sample.csv
    └── products_db_sample.csv
```

---

## 참고 URL
- 벤치마킹: https://www.hugreen.kr/sync/creation
- PRD 전체: docs/PRD_창호견적시스템_v1.md
- UI 문서: docs/ui.md
- 운영 URL: https://window-estimate-747058361639.asia-northeast3.run.app
