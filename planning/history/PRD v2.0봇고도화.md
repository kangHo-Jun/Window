# PRD v3.0 - RAG AI 창호 상담 챗봇 (안정형)

> v2 개선 + 운영 안정성 확보 + 책임 분리 구조 확정

---

# 1. 핵심 원칙 (절대 규칙)

## 1.1 역할 분리 (중요)
- AI = 정보 추출 / 대화
- CODE = 견적 계산

❗ AI가 가격 생성 금지

---

## 1.2 견적 생성 조건
아래 조건 충족 시에만 견적 생성

- 평형 (pyeong)
- 공간 (space)
- 확장 여부 (expansion)

부족 시:
→ 질문 우선

---

## 1.3 RAG 규칙
- 전체 CSV 입력 금지
- Top-K만 사용 (5~10개)
- 필터 → 유사도 → 정렬 → 선택

---

# 2. 시스템 아키텍처


사용자 입력
↓
AIChatBot.tsx
↓
State Manager (중간 레이어)
↓
/api/chat/route.ts
↓
RAG Engine
↓
Gemini API (AI 역할 제한)
↓
구조화 데이터 반환
↓
Quote Calculator (코드)
↓
결과 UI 출력


---

# 3. 상태 관리 설계 (핵심)

## 3.1 상태 구조

```ts
type QuoteState = {
  pyeong?: number
  space?: string
  expansion?: "확장형" | "비확장형"
  budget?: number
  brandPreference?: string
}
3.2 상태 흐름
AI → 사용자 입력 분석
누락 값 확인
부족하면 질문
모두 채워지면 견적 생성
3.3 상태 업데이트 방식
AI 응답 → JSON 추출
기존 state와 merge
4. RAG 엔진 설계
4.1 데이터 구조
db_products_v2.csv
db_prices_v2.csv
db_configurations_v2.csv
4.2 처리 흐름
1. 키워드 추출 (space, size, brand 등)
2. 1차 필터링 (포함 단어)
3. 2차 유사도 계산 (string match)
4. 점수 정렬
5. Top-K 선택 (5~10개)
6. 프롬프트 구성
4.3 출력 형태
{
  "products": [...Top-K],
  "prices": [...관련 가격],
  "config": [...]
}
5. AI 역할 정의
5.1 입력
사용자 메시지
상태 정보
RAG 결과
5.2 출력 (반드시 JSON 포함)
{
  "reply": "자연어 응답",
  "extracted": {
    "pyeong": 30,
    "space": "거실",
    "expansion": "확장형",
    "budget": 3000000
  },
  "intent": "collect_info | ready_to_quote"
}
5.3 금지사항
가격 생성 금지
DB 없는 정보 생성 금지
확정되지 않은 정보 추측 금지
6. 견적 계산 로직 (핵심 분리)
6.1 입력
QuoteState + RAG 결과
6.2 처리
평형 → 표준 구성 매핑
공간 → 창호 타입 결정
확장 여부 → 면적 보정
가격 DB → 단가 적용
6.3 출력
{
  "lx": 3200000,
  "kcc": 2700000,
  "etc": 2100000
}
7. API 설계
POST /api/chat
Request
{
  "message": "...",
  "state": {},
  "history": []
}
Response
{
  "reply": "...",
  "state": {},
  "needMoreInfo": true,
  "quote": null
}

또는

{
  "reply": "...",
  "state": {},
  "needMoreInfo": false,
  "quote": {
    "lx": 3200000,
    "kcc": 2700000
  }
}
8. UI 구조
AIChatBot.tsx
기능
채팅 UI
상태 기반 질문 유도
빠른 선택 버튼
견적 카드 출력
UX 규칙
질문 최소화 (필수 정보만)
선택 버튼 제공 (확장형/비확장형)
견적 즉시 시각화
9. 개발 순서
1. state 구조 구현
2. ragEngine.ts 구현
3. quoteCalculator.ts 구현 (핵심)
4. api/chat/route.ts 구현
5. AIChatBot.tsx 구현
6. 통합 테스트
10. 완료 조건
항목	기준
상태 정확도	누락 없이 채워짐
견적 일관성	동일 입력 동일 결과
응답 속도	3초 이내
RAG 정확도	관련 데이터만 사용
11. 금지사항 (실패 방지)
AI가 가격 계산하는 구조
CSV 전체 프롬프트 입력
state 없이 견적 생성
조건 미충족 상태 견적 출력
12. 향후 고도화
단계 2
embedding 기반 검색
단계 3
상담 로그 분석
추천 모델 개선
단계 4
개인화 견적
최종 요약

👉 이 시스템은

AI = 상담원
코드 = 계산기

👉 이 구조가 깨지면 실패한다

---

# 구현 완료 (2026-04-28~29)

## 1. Gemini 주도 대화 재설계
- 순서강제 로직 전면 제거
- Gemini가 질문/버튼 동시 결정
- 응답 형식: `{"reply":"...","options":[...]}`

## 2. 절충형 Gemini 호출 전략
- fast-path: 단순입력 (숫자/버튼/이름)
- Gemini 호출: 맥락판단/추천/불편사항
- 토큰 효율 + 응답속도 균형

## 3. 공간 다중선택 + 크기 인라인 선택
- 평형별 공간 자동 나열 (DB 기반)
- 공간+크기(소/중/대) 한 화면 동시 선택
- `fields.spaces[]` 배열 저장

## 4. 불편사항 심층진단 flow
- 불편사항 버튼 클릭 → 즉시 심층진단 진입
- `diagnosisStep 0→1→2`
  - `0`: 공통질문 (연식)
  - `1`: 맞춤질문 (불편사항별)
  - `2`: 진단결과 출력 (수치 포함)
- 질문 최대 2개 강제
- 빠른 가견적 버튼 항상 노출

## 5. 창호 진단 지식DB RAG 구현
- `창호_진단_지식DB.md` 작성
- Gemini 시스템 프롬프트 주입
- 연식별 열관류율/차음등급/난방비 절감 수치 반영

## 6. DB 보강
- `db_space_size.csv`
- `db_preference_rules.csv`
- `db_product_scores.csv`
- `db_space_products.csv`
- `db_options.csv`

---

# 남은 작업

1. Cloud Run 재배포 및 운영 검증
2. PDF 레포트 심층진단 결과 반영
3. Google Sheets 심층진단 데이터 저장
4. GitHub Cloud Build 자동배포 연결
