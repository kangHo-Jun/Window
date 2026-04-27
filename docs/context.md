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
- Phase 5 (RAG 웹 채팅봇) 준비 중
- 운영 URL 기준 기능 검증
- GitHub 저장소 Cloud Build repository mapping 연결 대기

---

## 다음 할 일 (순서)
1. Cloud Run 운영 URL 기준 기능 검증
2. GitHub 저장소 Cloud Build 자동 배포 트리거 연결 완료
3. Phase 5 - RAG 웹 채팅봇 개발

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
