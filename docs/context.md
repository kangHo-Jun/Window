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
| 입력 방식 | 옵션A(스마트 레고식) + 옵션B(대화형 3문항) 병렬 제공 |
| 브랜드 비교 | LX지인(프리미엄) / KCC(중간) / 기타(실속) |
| 출력물 | 3사 비교표 + 절감액 계산기 + 컨설팅 레포트 + PDF + 상담연결 |
| 개발 단계 | 1차: 폼 기반 / 2차: RAG 웹 채팅봇 / 4차: PDF 지식베이스 통합 |
| 기술 스택 | Next.js + Tailwind + shadcn/ui + Firestore + Google Cloud Run |
| Vector DB | Firestore Native Vector Search |
| LLM | gemini-2.5-flash |

---

## 인프라

| 항목 | 값 |
|------|------|
| GCP 프로젝트 | stacking-492708 |
| Cloud Run 서비스 | window-estimate |
| 운영 URL | https://window-estimate-747058361639.asia-northeast3.run.app |
| GitHub | kangHo-Jun/Window |
| 서비스 계정 | loading-sheet@stacking-492708.iam.gserviceaccount.com |
| Firestore DB | stacking-492708 / default / window_knowledge |

---

## 브랜치 전략

```text
main                        ← ver10 운영 (건드리지 않음)
ver20                       ← 봇고도화
feature/pdf-knowledge-rag   ← v4.0 현재 개발 중
```

---

## 현재까지 완료된 것

### ver20 (봇고도화)
- Smart Lego 입력 + 대화형 챗봇 병렬 제공
- 3사 비교표 + 절감액 계산기
- PDF 컨설팅 레포트 (NotoSansKR)
- Google Sheets 연동
- Cloud Run 배포
- Gemini 2.5-flash 연결
- RAG 엔진 + intentClassifier + sentimentDetector 등 모듈 구현
- QuoteCard 인라인 견적 카드 (레벨 1/2/3)
- 불편사항 심층진단 flow
- 공간별 창 크기 범주 선택

### feature/pdf-knowledge-rag (v4.0)
| 작업 | 상태 |
|------|------|
| PRD v4.0 문서 작성 | ✅ |
| Firestore 설정 가이드 | ✅ |
| PDF 파싱 스크립트 (parse_pdf.py) | ✅ |
| 청크 분할 스크립트 (chunk.py) | ✅ |
| 임베딩 + Firestore 적재 (embed_upload.py) | ✅ |
| Firestore window_knowledge 34개 청크 적재 | ✅ |
| 벡터 검색 품질 테스트 (정확도 상) | ✅ |
| ragEngine.ts HybridRetriever 구현 | ✅ |
| route.ts knowledge_query 라우팅 연결 | ✅ |
| knowledge_mode 답변 3문장 최적화 | ✅ |
| related_questions JSON 반환 구조 구현 | ✅ |
| AIChatBot.tsx suggestedReplies 상태 관리 | ✅ |
| PRD v4.0 Conversational RAG UX 설계 | ✅ |
| PRD v4.0 연구기반 UX 전략 (섹션8) | ✅ |
| 연구 문서 (RAG 프로액티브 대화) | ✅ |

---

## 진행 중인 것
- `feature/pdf-knowledge-rag` 브랜치 개발 중
- 빌드 통과 / Firestore 연결 정상 / 환경변수 완비

---

## 다음 할 일
1. **연관 질문 버튼 동적 생성 구현 (ProMISe)** ← 다음 세션 시작점
   - `route.ts` related_questions → AIChatBot.tsx 버튼 렌더링 연결
   - SmartOptions 확장 또는 별도 RelatedQuestions 컴포넌트 신규 생성
2. CHI 2024 타이밍 전략 — 입력 완료 직후 검증 멘트 삽입
3. BANT Hot Lead 감지 → consumerGrouping.ts 확장
4. Zero-step 예약 자동 입력
5. feature/pdf-knowledge-rag → ver20 머지
6. Cloud Run 재배포
7. PDF 추가 적재 (기술사양서 등)

---

## 주요 파일 위치
```text
/Users/zart/Library/Mobile Documents/com~apple~CloudDocs/프로젝트/창호/
├── window-estimate-system/         # Next.js 프로젝트
│   ├── src/
│   │   ├── app/api/chat/route.ts   # 챗봇 API (핵심)
│   │   ├── components/
│   │   │   ├── AIChatBot.tsx       # 챗봇 UI (핵심)
│   │   │   ├── SmartOptions.tsx    # 버튼 옵션
│   │   │   └── QuoteCard.tsx       # 견적 카드
│   │   └── lib/
│   │       ├── ragEngine.ts        # Firestore 벡터 검색
│   │       ├── intentClassifier.ts
│   │       ├── consumerGrouping.ts
│   │       └── quoteLevelEngine.ts
│   ├── scripts/                    # PDF 파이프라인
│   │   ├── parse_pdf.py
│   │   ├── chunk.py
│   │   ├── embed_upload.py
│   │   └── test_search.py
│   └── .env.local                  # 환경변수
└── docs/
    ├── context.md                  # 이 파일
    ├── PRD_v4.0_PDF_RAG_Integration.md
    ├── firestore_setup.md
    └── RAG_기반_프로액티브_대화_시스템_연구.md
```

---

## 참고 URL
- 운영 URL: https://window-estimate-747058361639.asia-northeast3.run.app
- GitHub: https://github.com/kangHo-Jun/Window
- Firestore: https://console.cloud.google.com/firestore?project=stacking-492708
