# PRD ver20 - RAG AI 창호 상담 챗봇

> ver10 유지 + 대화형 입력을 AI 챗봇으로 업그레이드

---

## 1. 개요

### 목적
- ver10의 대화형 3문항 폼을 RAG 기반 AI 챗봇으로 교체
- 자연어 자유 대화로 창호 상담 및 가견적 자동 산출
- 소비자 신뢰 획득 → 상담 전화 유도

### 범위
- 변경: `QuoteFormChat.tsx` → AI 챗봇으로 교체
- 유지: 레고식 입력 / 결과 출력 / PDF / Google Sheets 연동

---

## 2. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| AI 모델 | Google Gemini 1.5 Flash | 무료 티어, 빠른 응답 |
| API 호출 | Next.js API Route | 기존 스택 통일 |
| RAG 지식DB | 기존 CSV 파일 활용 | 별도 DB 불필요 |
| UI | shadcn/ui + Tailwind | 기존 스택 통일 |
| 브랜치 | `ver20` | ver10 안정 유지 |

---

## 3. 시스템 아키텍처

```
사용자 자연어 입력
      ↓
QuoteFormChat.tsx (AI 챗봇 UI)
      ↓
/api/chat/route.ts (Next.js API)
      ↓
RAG 처리:
  db_products_v2.csv
  db_prices_v2.csv
  db_configurations_v2.csv
      ↓
Gemini 1.5 Flash API
      ↓
AI 답변 + 가견적 JSON 반환
      ↓
기존 결과 출력 (3사 비교표 / PDF / 상담 연결)
```

---

## 4. 구현 범위

### 4-1. 새로 만들 파일

| 파일 | 역할 |
|------|------|
| `src/app/api/chat/route.ts` | Gemini API 호출 + RAG 처리 |
| `src/components/AIChatBot.tsx` | 챗봇 UI 컴포넌트 |
| `src/lib/ragEngine.ts` | CSV → 프롬프트 변환 로직 |
| `src/types/chat.ts` | 채팅 관련 타입 정의 |

### 4-2. 수정할 파일

| 파일 | 변경 내용 |
|------|------|
| `src/components/QuoteFormChat.tsx` | AIChatBot으로 교체 |
| `src/app/page.tsx` | ver20 분기 처리 |
| `.env.local` | GEMINI_API_KEY 추가 |

---

## 5. AI 챗봇 대화 흐름

```
AI: 안녕하세요! 창호 전문 상담 AI입니다.
    어떤 공간의 창호를 교체하고 싶으신가요?

고객: 30평 아파트 거실 창문 바꾸고 싶어요

AI: 30평 아파트 거실이군요!
    확장형인가요, 비확장형인가요?

고객: 확장형이요. 예산은 300만원 정도요

AI: 네, 확인했습니다.
    [가견적 카드 출력]
    - LX지인: 320만원 (1등급)
    - KCC: 270만원 (2등급)
    - 기타: 210만원 (3등급)
    
    더 자세한 상담을 원하시면 아래 버튼을 눌러주세요.
    [전문가 상담 신청]
```

---

## 6. RAG 엔진 설계

### 지식DB 구성
```
db_products_v2.csv   → 제품 정보 (브랜드/등급/사이즈)
db_prices_v2.csv     → 가격 정보 (사이즈별 단가)
db_configurations_v2.csv → 평형별 표준 구성
```

### 프롬프트 구성
```
시스템 프롬프트:
- 역할: LX지인 창호 대리점 AI 상담원
- 말투: 친근하고 전문적
- 목적: 가견적 제공 후 상담 전화 유도
- 제약: 지식DB 외 정보 사용 금지

RAG 컨텍스트:
- 관련 제품 정보 (필터링된 CSV 데이터)
- 대화 히스토리 (최근 5턴)

사용자 입력:
- 자연어 질문
```

---

## 7. API 설계

### POST /api/chat

**Request:**
```json
{
  "message": "30평 아파트 거실 창호 견적 알고 싶어요",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "reply": "AI 답변 텍스트",
  "quoteData": {
    "type": "ai",
    "data": {
      "pyeong": "30",
      "expansion": "확장형",
      "space": "거실",
      "budget": 3000000
    }
  },
  "showResult": true
}
```

---

## 8. UI 컴포넌트 설계

### AIChatBot.tsx
```
┌─────────────────────────────┐
│ 🤖 창호 AI 상담원            │
├─────────────────────────────┤
│ [AI 말풍선]                  │
│ 안녕하세요! 어떤 창호를...    │
│                              │
│           [고객 말풍선]       │
│           30평 아파트요       │
│                              │
│ [AI 말풍선]                  │
│ 확장형인가요?                 │
│ [확장형] [비확장형]           │
├─────────────────────────────┤
│ [입력창] [전송 버튼]          │
└─────────────────────────────┘
```

### 주요 기능
- 말풍선 UI (좌: AI / 우: 고객)
- 빠른 답변 버튼 (선택지 제공)
- 타이핑 인디케이터 (AI 응답 중)
- 가견적 카드 인라인 출력
- 대화 히스토리 유지

---

## 9. 환경변수

```
# .env.local 추가
GEMINI_API_KEY=your_gemini_api_key
```

---

## 10. 개발 순서

```
1. git checkout -b ver20
2. GEMINI_API_KEY 발급 (Google AI Studio)
3. src/lib/ragEngine.ts 구현
4. src/app/api/chat/route.ts 구현
5. src/components/AIChatBot.tsx 구현
6. QuoteFormChat.tsx 교체
7. 테스트 및 검증
8. Cloud Run ver20 배포
```

---

## 11. 완료 조건 (검증 기준)

| 항목 | 기준 |
|------|------|
| 자연어 대화 | 3턴 이내 가견적 산출 |
| RAG 정확도 | 지식DB 기반 답변 |
| 응답 속도 | 3초 이내 |
| 결과 연동 | 3사 비교표 정상 출력 |
| npm run build | 에러 없음 |

---

## 12. 주의사항

- API Key 하드코딩 금지 → `.env.local` 사용
- CSV 전체를 프롬프트에 넣지 말 것 → 관련 데이터만 필터링
- 대화 히스토리 최대 5턴 유지 (토큰 절약)
- 한글 주석 필수
- ver10 코드 건드리지 말 것