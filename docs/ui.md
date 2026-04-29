# UI 설계 명세서 — Hugreen 창호 자동 견적 시스템

작성일: 2026-04-23  
기준 버전: MVP 프로토타입 (direct-sync.html / direct-sync.js / direct-sync.css)

---

## 1. UI 개요 및 목표

**서비스 성격**: 소비자가 상담 없이 스스로 창호 가견적을 완료하고, 전문가 상담으로 자연스럽게 전환되는 셀프 견적 퍼널

**UI 목표**:
- 비전문가도 4단계 만에 완료 (마찰 최소화)
- 각 단계에서 선택 가능한 것만 활성화 (에러 방지)
- 공간별 진행 상태를 시각적으로 명확히 표시 (완료/현재/대기)
- 결과 페이지에서 상담 전환 유도

**참조 원본**: Hugreen 공식 사이트 `https://www.hugreen.kr/sync/creation`

---

## 2. 페이지 구조

단일 HTML 파일(SPA) 구조. URL은 고정, 콘텐츠만 교체.

```
[Header]
  └─ 로고(Hugreen®) + 네비게이션(PRODUCT / BRAND / CS CENTER)

[Progress Bar]
  └─ 01 주거형태 → 02 평형 → 03 공간 → 04 제품

[Form Container]  ← 단계별 콘텐츠 교체 영역
  ├─ Step 1: 주거형태 선택
  ├─ Step 2: 평형 + 확장 여부 선택
  ├─ Step 3: 공간 선택 (동적 렌더링)
  ├─ Step 4: 공간별 제품/사이즈 입력 (동적 렌더링)
  └─ Result: 선택 내역 테이블 + 가격 요약 + 상담 배너

[Footer]
  └─ 개인정보취급방침 / 이용약관 / 사이트맵 / 고객센터
```

단계 전환 애니메이션: `fadeIn` 0.5s (opacity 0→1, translateY 20px→0)

---

## 3. 컴포넌트 목록

| 컴포넌트 | 위치 | 유형 |
|---------|------|------|
| ProgressBar | 전체 상단 고정 | 정적 HTML |
| OptionButton | Step 1~3 | 선택 버튼 (selected 상태) |
| SelectAllCheckbox | Step 3 | 체크박스 + 레이블 |
| SpaceTab | Step 4 | 탭 (completed / current / pending 3상태) |
| ProductCard | Step 4 | 카드형 선택 (선택 시 사이즈 폼 노출) |
| SizeInputSection | Step 4 | 가로/세로 mm 입력 폼 |
| ResultTable | Result | 공간별 선택 내역 테이블 (동적 생성) |
| PriceSummary | Result | 소계/시공비/합계 3행 요약 (동적 생성) |
| ConsultationBanner | Result | 상담사 이미지 + CTA 배너 |
| PDFButton / ShareButton | Result | 액션 버튼 쌍 |
| Toast | 전역 | 우상단 슬라이드인 알림 |

---

## 4. 각 페이지별 상세 UI 스펙

### 4.1 Step 1 — 주거형태

- 상태: "아파트" 버튼이 진입 즉시 `selected` 상태로 자동 설정
- 다른 버튼 없음 (현재 아파트만 지원)
- Next 버튼 항상 활성 (아파트 자동 선택이므로)
- Next 버튼 전체 너비 (뒤로가기 없음)

### 4.2 Step 2 — 평형 선택

구성:
1. **평형 섹션**: 20평 / 30평 / 40평 / 50평 (4-column 그리드)
2. **확장 여부 섹션**: 확장형 / 비확장형 (2-column 그리드)

버튼 동작:
- 평형과 확장 여부 **둘 다 선택**해야 Next 활성화
- 각 섹션 내 단일 선택 (re-click 시 같은 항목 다시 선택)
- 뒤로가기 버튼: Step 1로 이동

조합: 4평형 × 2확장형 = 총 8가지 `typeKey` 생성  
예시: `'30평대-확장형'`, `'40평대-비확장형'`

### 4.3 Step 3 — 창호 자동 구성 확인 (스마트 세팅)

동적 렌더링 (renderStep3):
- Step 2에서 선택한 평형 및 확장 여부(typeKey)를 바탕으로 `db_configurations_v2.csv`를 조회하여 최적화된 표준 창호 목록을 자동 렌더링
- 사용자 편의성 극대화: 사용자가 공간을 일일이 매핑할 필요 없이, 시스템이 공간별 창호 스펙을 제시
- 변경이 필요 없는 경우 즉시 '가견적 산출'로 넘어가도록 직관적인 버튼 라우팅 제공
- **휴그린 SYNC 참고**: 사용자의 선택 피로도를 줄이기 위해 초기값을 제공하고, 원하는 부분만 수정하도록 구성

### 4.4 Step 4 — 세부 커스터마이징 (필요한 경우)

초기 자동 구성에서 특정 공간의 제품을 변경하거나 사이즈, 수량을 조정하고자 할 때 사용하는 UI.

**기 주요 UI 컴포넌트**:
1. **이미지 카드 형태의 옵션 (Image Cards)**: 
   - 텍스트만이 아닌 직관적인 형태의 제품 카드 (BEST 뱃지, 외관 이미지, 텍스트) 제공. 선택 시 `#10b981` 초록 테두리
2. **토글 버튼 (Toggles)**: 
   - 종류(이중창, 단창 등) 변경이나 확장/비확장 개별 공간 전환을 위한 스위치 형태 제공
3. **+- 버튼 컨트롤 (Stepper)**: 
   - 가로/세로 사이즈 증감 및 수량(개수) 변경 시, 키보드 입력뿐만 아니라 직관적인 좌우 +/- 버튼을 배치하여 모바일 접근성 향상

이 과정을 마친 후 또는 통과한 후 최종 [결과 보기] (showResult) 로 이동.

### 4.5 Result — 결과 페이지

구성 (위→아래):
1. **타이틀**: "나만의 창·작품 SYNC" (테두리 박스)
2. **헤딩**: "고객님의 창·작품 SYNC 결과입니다."
3. **선택 요약**: `#N평대 #아파트 #확장형/비확장형` (파란색)
4. **결과 테이블** (동적 생성): 공간 / 제품 / 사이즈(WxH) / 면적(m²) / 금액
5. **가격 요약** (동적 생성): 소계 / 시공비(20%) / 총 예상 금액(파란색 강조)
6. **총 예상 가격** (정적): `.price-amount` — 동적 계산값으로 덮어씀
7. **액션 버튼**: PDF 저장(빨강) + 공유하기(파란색)
8. **안내 문구**: "현장 여건에 따라 금액이 달라질 수 있습니다"
9. **상담 배너**: 어두운 배경(`#2c3e50`), 상담사 이미지(150×200) + CTA

---

## 5. 디자인 시스템

### 5.1 색상

| 용도 | 값 | 사용처 |
|------|----|--------|
| Primary Blue | `#3b82f6` | 현재 탭, 포커스, 링크, 공유버튼, 가격 하이라이트 |
| Dark Blue | `#1d4ed8` | 배경 그라디언트 끝색 |
| Success Green | `#10b981` | 완료 탭, 선택된 공간/제품, 상담 버튼 |
| Danger Red | `#ef4444` | PDF 버튼, BEST 뱃지(`#e74c3c`) |
| Dark Charcoal | `#333` / `#2c3e50` | 선택 버튼 배경, 상담 배너 배경, 로고 |
| Light Gray | `#f0f0f0` / `#f8f9fa` | 대기 탭, 배경 섹션 |
| Border Gray | `#e0e0e0` | 기본 버튼 테두리, 구분선 |
| Text Primary | `#333` | 기본 텍스트 |
| Text Secondary | `#666` / `#999` | 보조 텍스트, 비활성 |

### 5.2 폰트

- **패밀리**: Noto Sans KR (Google Fonts, weights: 300/400/500/700)
- **스케일**:
  | 용도 | 크기 | 굵기 |
  |------|------|------|
  | 로고 | 24px | 700 |
  | 폼 타이틀 | 28px | 700 |
  | Step 설명 | 24px | 700 |
  | 결과 헤딩 | 28px | 700 |
  | 총 가격 | 36px | 700 |
  | 총 금액(요약) | 24px | 700 |
  | 섹션 레이블 | 16px | 600 |
  | 본문/버튼 | 16px | 500~700 |
  | 보조 텍스트 | 12~14px | 400~500 |

### 5.3 간격 및 레이아웃

- **컨테이너 최대폭**: 1400px (body), 900px (main-content)
- **Header 패딩**: `20px 60px`
- **Main 패딩**: `60px` (데스크탑), `30px 20px` (모바일)
- **Form 컨테이너**: `padding 50px`, `border-radius 20px`, `box-shadow 0 10px 40px rgba(0,0,0,0.1)`
- **버튼 패딩**: `20px` (option-btn), `18px` (next/back-btn), `10px 20px` (탭)
- **그리드 갭**: `15px` (옵션), `20px` (제품카드), `8px` (공간탭)
- **Border radius**: `8px` (버튼/인풋), `12px` (카드/패널), `20px` (폼컨테이너)

### 5.4 전환 효과

- 버튼 hover: `transform: translateY(-2px)`, `transition: all 0.3s`
- 현재 탭: `transform: translateY(-2px)` 고정
- 단계 전환: `fadeIn` 0.5s (opacity + translateY)
- Toast: `slideIn` / `slideOut` 0.3s (translateX 400px)

---

## 6. 반응형 기준

**브레이크포인트**: `max-width: 768px` (단일 기준)

| 속성 | 데스크탑 | 모바일(≤768px) |
|------|---------|--------------|
| main-content 패딩 | `60px` | `30px 20px` |
| form-container 패딩 | `50px` | `30px 20px` |
| option-grid 컬럼 | 4열 | 2열 |
| product-grid 컬럼 | 2열 | 1열 |
| consultation-banner 방향 | 가로(flex row) | 세로(flex column) + 텍스트 중앙 정렬 |

미정의 (향후 대응 필요):
- space-tabs 줄바꿈 처리 (`flex-wrap: wrap` 적용됨, 탭 개수 많을 때 높이 증가)
- size-input-grid: 2열 → 1열 전환 미정의
- progress-bar 모바일 텍스트 잘림 미정의

---

## 7. 동적 위젯 스펙

### 7.1 SpaceTab 위젯

**생성 시점**: Step 4 진입 / 공간 이동 시마다 `renderStep4()` 호출

**상태 전이**:
```
pending → current (이전 공간 완료 후 진입)
current → completed (사이즈 저장 완료 후 다음 이동)
completed → current (탭 클릭으로 재진입)
```

**데이터 흐름**:
- 탭 클릭 → `saveCurrentSpaceData()` → `state.currentSpaceIndex = index` → `renderStep4()`
- 다음 공간 → `state.spaceProducts[space] = { product, width, height }` → `renderStep4()`
- 복원: `restoreSpaceData(space)` → DOM 업데이트 + `validateStep4Input()`

**저장 조건** (saveCurrentSpaceData):
- 제품 선택됨 AND 가로 500~10000 AND 세로 500~5000

### 7.2 ResultTable 위젯

**생성 시점**: `showResult()` 호출 시 `renderResultTable(pricing)` 실행

**삽입 위치**: `.price-section` 앞 (`insertBefore`)

**데이터 소스**: `calculateTotalPrice(state.spaceProducts)` 반환값
- `pricing.items[]`: 공간명, 제품명, 가로, 세로, 면적(m²), 금액
- `pricing.subtotal`: 소계
- `pricing.installationFee`: 시공비 (소계 × 20%, 반올림)
- `pricing.total`: 최종 합계

**가격 조회 로직** (`getPriceFromRange`):
- `priceTable` 배열에서 `productId` + `widthMin ≤ W ≤ widthMax` + `heightMin ≤ H ≤ heightMax` 매칭
- 범위 없음 → fallback 1,000,000원

### 7.3 Toast 위젯

**노출 시점**:
- 데이터 로딩 시작 / 완료 / 실패
- 제품 미선택 / 사이즈 미입력 / 범위 오류
- PDF 저장 완료 / 오류
- 공유 링크 복사 완료 / 오류
- 공유 링크 복원 완료 / 오류

**위치**: `position: fixed`, 우상단 `top: 20px / right: 20px`  
**자동 소멸**: 3초 후 slideOut 애니메이션 후 DOM 제거

### 7.4 PDF 생성 (jsPDF + AutoTable)

출력 구성:
1. 제목: `Hugreen Window Estimate` (center, 20pt)
2. 기본 정보: Pyeong / Expansion / Date (12pt)
3. 테이블: Space / Product / Size / Area / Price
   - 헤더 배경: `#3b82f6` / 교대행: `#f8fafc`
4. 합계: Subtotal / Installation Fee (20%) / Total
5. 주석: 현장 여건 안내 + 연락처

파일명: `Hugreen_Estimate_{sizeType}_{timestamp}.pdf`

한글 제약: jsPDF 기본 폰트가 한글 미지원 → **모든 텍스트 영문 출력**

### 7.5 공유 링크 (Base64 인코딩)

인코딩: `btoa(encodeURIComponent(JSON.stringify(shareData)))`  
복원: `JSON.parse(decodeURIComponent(atob(data)))`  
파라미터: `?data=<encoded>`

포함 데이터: `housingType`, `sizeType`, `expansionType`, `selectedSpaces`, `spaceProducts`

공유 링크 진입 시: `loadFromShareLink()` → 전체 state 복원 → `showResult()` 직행

---

## 8. 구현 순서 (Next.js 마이그레이션 기준)

### Phase 1: 기반 설정
1. Next.js 16.1 + TypeScript + Tailwind CSS 프로젝트 초기화
2. shadcn/ui 설치 및 디자인 토큰 설정 (색상 변수 매핑)
3. Google Fonts (Noto Sans KR) 설정
4. 기본 레이아웃 컴포넌트 (Header, Footer, Container)

### Phase 2: 정적 컴포넌트
5. ProgressBar 컴포넌트 (4단계, active 상태)
6. OptionButton 컴포넌트 (selected 상태)
7. ProductCard 컴포넌트 (선택/미선택/BEST 배지)
8. Toast 컴포넌트 + 훅 (`useToast`)

### Phase 3: 스텝 구현
9. Step 1 페이지 (아파트 자동 선택)
10. Step 2 페이지 (평형 + 확장 여부, React Hook Form + Zod)
11. Step 3 페이지 (공간 선택, 평형별 동적 렌더링, 전체 선택)
12. Step 4 페이지 (SpaceTab + ProductCard + SizeInput, 상태 관리)

### Phase 4: 결과 및 부가 기능
13. Result 페이지 (ResultTable + PriceSummary + ConsultationBanner)
14. 가격 계산 로직 서버 API Route화 (`/api/calculate`)
15. PDF 생성 (한글 폰트 해결: noto-sans-kr woff2 embed 또는 서버사이드 생성)
16. 공유 링크 (URL state 인코딩)

### Phase 5: 데이터 연동 및 완성
17. Google Sheets API 연동 (서버사이드 API Route, 환경변수)
18. 이미지 자산 교체 (로컬 절대경로 → public/ 또는 CDN)
19. 반응형 보완 (모바일 미정의 영역)
20. 인증 시스템 (NextAuth / Clerk) — 선택적

---

## 현재 프로토타입 알려진 UI 버그

| 심각도 | 항목 | 위치 | 수정 방법 |
|--------|------|------|---------|
| 🔴 Critical | 제품 이미지 깨짐 | direct-sync.html:120~139 | `src` → 상대경로 또는 CDN URL |
| 🔴 Critical | 상담사 이미지 깨짐 | direct-sync.html:192 | 동일 |
| 🟡 Minor | 총 가격 하드코딩 잔존 | direct-sync.html:179 | `.price-section` 하드코딩 제거 |
| 🟡 Minor | PDF 한글 깨짐 | direct-sync.js:684 | 영문 유지 또는 폰트 embed |
| 🟡 Minor | 모바일 탭 레이아웃 미정의 | direct-sync.css | 탭 overflow-x scroll 또는 2행 처리 |

---

## 9. 옵션B — 대화형 입력 UI 스펙

### 9.1 개요

기존 폼 방식(옵션A)의 대안. 카카오톡 채팅 인터페이스를 모방하여 질문-답변 대화 흐름으로 입력을 유도한다. 친밀감을 높이고 이탈률을 낮추는 것이 목적.

**진입 경로**: 메인 랜딩 → "대화로 견적내기" 버튼 → 대화형 UI

### 9.2 레이아웃

```
┌─────────────────────────────────────┐
│ [Hugreen 로고]            [닫기 ✕]  │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │  ← AI 말풍선 (좌측)
│  │ 안녕하세요! 어떤 공간의│           │
│  │ 창호를 바꾸실 건가요?  │           │
│  └──────────────────────┘           │
│  🤖 Hugreen AI  10:32              │
│                                     │
│              ┌──────────────────┐   │  ← 사용자 답변 (우측)
│              │ 거실이요         │   │
│              └──────────────────┘   │
│                         나  10:33  │
│                                     │
│  [빠른 답변 버튼 영역]               │
│  [거실] [안방] [침실] [발코니] [기타] │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 직접 입력...          [전송] │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 9.3 말풍선 스타일 스펙

**AI 말풍선 (좌측)**:
```css
.bubble-ai {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px 18px 18px 18px;  /* 좌상단 각진 모서리 */
  padding: 12px 16px;
  max-width: 75%;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  color: #1f2937;
}
```

**사용자 말풍선 (우측)**:
```css
.bubble-user {
  background: #fee500;              /* 카카오 노랑 */
  border-radius: 18px 4px 18px 18px; /* 우상단 각진 모서리 */
  padding: 12px 16px;
  max-width: 75%;
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
  align-self: flex-end;
}
```

**아바타**:
- AI: 36px 원형 이미지 또는 Hugreen 로고 아이콘, 말풍선 좌하단
- 사용자: 표시 없음

**타임스탬프**: `font-size: 11px`, `color: #9ca3af`, 말풍선 하단 외부

### 9.4 순차 등장 애니메이션

3개 질문이 순서대로 등장. 이전 답변 완료 후 다음 질문 노출.

```
Q1 등장 (0ms)         → 타이핑 인디케이터 1.2s → 말풍선 fadeIn
사용자 답변 완료
Q2 등장 (500ms 딜레이) → 타이핑 인디케이터 1.0s → 말풍선 fadeIn
사용자 답변 완료
Q3 등장 (500ms 딜레이) → 타이핑 인디케이터 0.8s → 말풍선 fadeIn
```

**타이핑 인디케이터** (말풍선 등장 전):
```css
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 4px 18px 18px 18px;
}
.typing-dot {
  width: 8px; height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typingBounce 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30%           { transform: translateY(-6px); }
}
```

**말풍선 등장 애니메이션**:
```css
@keyframes bubbleFadeIn {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.bubble-ai { animation: bubbleFadeIn 0.25s ease-out; }
```

### 9.5 3개 질문 시나리오

| 순서 | AI 질문 | 입력 방식 |
|------|---------|---------|
| Q1 | "안녕하세요! 어느 공간의 창호를 교체하실 예정인가요?" | 빠른 답변 버튼 |
| Q2 | "현재 아파트 평형이 어떻게 되시나요?" | 빠른 답변 버튼 |
| Q3 | "확장형과 비확장형 중 어떤 구조인가요?" | 빠른 답변 버튼 |

3개 완료 → "견적을 계산하고 있어요..." 로딩 애니메이션 → 결과 카드 노출

### 9.6 빠른 답변 버튼 위젯

**위치**: 채팅 입력창 바로 위 고정 영역

**구조**:
```html
<div class="quick-reply-container">
  <button class="quick-reply-btn">거실</button>
  <button class="quick-reply-btn">안방</button>
  <button class="quick-reply-btn">침실</button>
  <button class="quick-reply-btn">발코니</button>
  <button class="quick-reply-btn other">기타 직접 입력</button>
</div>
```

**스타일**:
```css
.quick-reply-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}
.quick-reply-btn {
  padding: 8px 16px;
  background: white;
  border: 1.5px solid #3b82f6;
  color: #3b82f6;
  border-radius: 20px;          /* pill 형태 */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.quick-reply-btn:hover,
.quick-reply-btn:active {
  background: #3b82f6;
  color: white;
}
.quick-reply-btn.other {
  border-color: #9ca3af;
  color: #6b7280;
}
```

**동작**:
- 클릭 → 해당 텍스트가 사용자 말풍선으로 채팅창에 삽입
- 버튼 영역 사라짐 (다음 질문 등장까지 숨김)
- "기타 직접 입력" → 텍스트 입력창 포커스 이동

---

## 10. 요구사항 폼 UI 스펙

### 10.1 개요

견적 계산 완료 후 또는 상담 신청 전 단계에서 노출. 소비자의 구체적 요구사항을 수집하여 상담사에게 전달하고 맞춤 제안에 활용.

### 10.2 폼 레이아웃

```
[제목] "조금 더 알려주시면 더 정확한 견적을 드릴 수 있어요"
[부제] 선택사항 · 작성 시 상담 품질이 높아집니다

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  예산 범위          [슬라이더]
  단열 성능 우선순위  [별점 선택]
  소음 차단 우선순위  [별점 선택]
  희망 시공 시기     [월 선택 드롭다운]
  건물 연식          [연도 입력 or 슬라이더]
  특이사항           [텍스트에어리어]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[건너뛰기]          [작성 완료 →]
```

### 10.3 각 항목 상세 스펙

#### 예산 범위
- **컴포넌트**: 듀얼 핸들 범위 슬라이더
- **범위**: 100만원 ~ 3,000만원 (50만원 단위)
- **기본값**: 500만원 ~ 1,500만원
- **표시**: 슬라이더 위 말풍선으로 선택값 실시간 표시
  ```
  500만원 ──●────────────●── 1,500만원
             ↑현재값      ↑현재값
  ```
- **색상**: 선택 구간 `#3b82f6`, 비선택 구간 `#e5e7eb`
- **핸들**: 20px 원형, 흰색 + 파란 테두리, 드래그 시 `box-shadow 0 0 0 4px rgba(59,130,246,0.2)`

#### 단열 성능 우선순위
- **컴포넌트**: 5점 별점 선택기
- **레이블**: "단열 성능이 얼마나 중요한가요?"
- **별 스타일**: 비선택 `#e5e7eb`, 선택 `#f59e0b` (앰버), 크기 32px
- **hover**: 해당 별까지 전체 앰버색으로 미리보기
- **보조 텍스트**: 1점 "보통", 3점 "중요", 5점 "매우 중요"

#### 소음 차단 우선순위
- 단열 성능과 동일한 별점 컴포넌트
- **레이블**: "소음 차단이 얼마나 중요한가요?"
- 두 별점 항목은 2열 그리드로 나란히 배치 (모바일: 1열)

#### 희망 시공 시기
- **컴포넌트**: 월 선택 pill 버튼 그룹 (12개)
- **레이아웃**: 4열 그리드 × 3행
  ```
  [1월] [2월] [3월] [4월]
  [5월] [6월] [7월] [8월]
  [9월] [10월] [11월] [12월]
  ```
- 선택 색상: `#10b981` (초록) — "이 달에 공사 가능해요" 뉘앙스
- 복수 선택 허용
- 추가 옵션: "미정" 버튼 (선택 시 나머지 해제)

#### 건물 연식
- **컴포넌트**: 연도 입력 필드 + 자동 계산 표시
- **입력**: `<input type="number" placeholder="예: 2005">` — 4자리 연도
- **자동 표시**: 입력값으로부터 "건축 후 N년" 실시간 계산
  ```
  2005  →  건축 후 21년
  ```
- **색상 피드백**:
  - 15년 미만: `#10b981` "비교적 최신 건물"
  - 15~25년: `#f59e0b` "노후화 진행 중"
  - 25년 초과: `#ef4444` "단열 교체 효과 큼"
- 이 값은 난방비 절감 계산기(섹션 12)와 연동됨

#### 특이사항
- **컴포넌트**: `<textarea>`
- **높이**: 기본 80px, 입력에 따라 auto-resize (최대 160px)
- **placeholder**: "예: 층간소음이 심해요 / 창문이 결로가 자주 생겨요 / 시공 전날 짐 이동 필요해요"
- **글자수 카운터**: 우하단 `0 / 200자` 실시간 표시
- **테두리**: 기본 `#e5e7eb`, 포커스 `#3b82f6`, 200자 초과 `#ef4444`

### 10.4 폼 액션 버튼

```css
/* 건너뛰기 */
.skip-btn {
  color: #9ca3af;
  background: transparent;
  border: none;
  text-decoration: underline;
  font-size: 14px;
  cursor: pointer;
}

/* 작성 완료 */
.submit-btn {
  background: #333;
  color: white;
  padding: 16px 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  transition: background 0.3s;
}
.submit-btn:hover { background: #3b82f6; }
```

---

## 11. 3사 비교표 UI 스펙

### 11.1 개요

결과 페이지 또는 요구사항 폼 제출 후 노출. LX지인 / KCC글라스 / 기타(현대L&C 등) 3사를 비교하여 Hugreen(LX지인) 선택을 자연스럽게 유도.

### 11.2 테이블 구조

| 비교 항목 | LX지인 | KCC글라스 | 기타브랜드 |
|-----------|--------|----------|----------|
| 단열 등급 | 1등급 | 1등급 | 2등급 |
| 소음 등급 | T3 | T2 | T1 |
| A/S 기간 | 10년 | 5년 | 3년 |
| 시공 기간 | 1~2일 | 2~3일 | 2~4일 |
| 가격대 | ●●●◌◌ | ●●◌◌◌ | ●◌◌◌◌ |
| 견적 포함 | ✓ | ✗ | ✗ |

### 11.3 컬럼 구성 및 강조

**컬럼 너비**: `LX지인 40% | KCC글라스 30% | 기타 30%`  
— 추천 컬럼이 더 넓어 시선 집중

**"우리 추천" 강조 표시**:
```css
.col-recommend {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
  border-left: 3px solid #3b82f6;
  border-right: 3px solid #3b82f6;
  position: relative;
}

/* 상단 배지 */
.col-recommend::before {
  content: '★ Hugreen 추천';
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  white-space: nowrap;
}
```

**브랜드별 색상**:
| 브랜드 | 컬럼 헤더 색 | 강조 색 |
|--------|------------|--------|
| LX지인 | `#3b82f6` (파랑) | `#eff6ff` 배경 |
| KCC글라스 | `#6b7280` (회색) | `#f9fafb` 배경 |
| 기타 | `#9ca3af` (연회색) | `#ffffff` 배경 |

### 11.4 행 스타일

```css
.compare-table th {
  padding: 16px 12px;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  border-bottom: 2px solid #e5e7eb;
}
.compare-table td {
  padding: 14px 12px;
  text-align: center;
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;
}
/* 교대행 */
.compare-table tbody tr:nth-child(even) td {
  background: rgba(0,0,0,0.02);
}
/* 추천 컬럼은 교대행 색 무시 */
.compare-table td.col-recommend {
  background: inherit;
}
```

### 11.5 가격 등급 표시 (도트 방식)

```
●●●◌◌  → 중상 (filled: #3b82f6, empty: #e5e7eb, size: 10px circle, gap: 3px)
●●◌◌◌  → 중
●◌◌◌◌  → 저
```

### 11.6 체크/X 표시

```css
.check-yes { color: #10b981; font-size: 18px; font-weight: 700; } /* ✓ */
.check-no  { color: #ef4444; font-size: 18px; }                   /* ✗ */
```

### 11.7 하단 CTA

```
[LX지인으로 상담 신청하기 →]   ← 파란 full-width 버튼
[다른 브랜드도 비교 견적 받기]  ← 텍스트 링크 (선택적)
```

---

## 12. 난방비 절감 계산기 UI 스펙

### 12.1 개요

건물 연식 입력값을 기반으로 창호 교체 후 예상 난방비 절감액을 시각적으로 보여주는 인터랙티브 위젯. 교체 결정을 촉진하는 설득 도구.

**노출 위치**: 요구사항 폼의 "건물 연식" 입력 완료 직후 인라인 노출 또는 결과 페이지 내 섹션

### 12.2 레이아웃

```
┌────────────────────────────────────────┐
│  💡 창호 교체 후 예상 절감 효과          │
│                                        │
│  건물 연식: [2005] (21년)               │
│                                        │
│  ┌────────────────────────────────┐    │
│  │  연간 난방비 절감              │    │
│  │                                │    │
│  │       ₩ 312,000               │    │  ← 카운트업 애니메이션
│  │                                │    │
│  │  월 평균 ₩ 26,000 절감         │    │
│  └────────────────────────────────┘    │
│                                        │
│  ████████████░░░░░  현재 대비 38% 절감  │  ← 프로그레스 바
│                                        │
│  10년 누적 절감액: ₩ 3,120,000         │
│  → 창호 교체 비용의 약 62% 회수 가능    │
│                                        │
└────────────────────────────────────────┘
```

### 12.3 절감액 계산 로직 (UI 표시 기준)

```javascript
// 연식별 단열 손실률 가정 (UI용 추정치)
function estimateSavings(buildYear) {
  const age = new Date().getFullYear() - buildYear;
  let savingsRate;
  if (age < 10)       savingsRate = 0.15;  // 15% 절감
  else if (age < 20)  savingsRate = 0.28;  // 28% 절감
  else if (age < 30)  savingsRate = 0.38;  // 38% 절감
  else                savingsRate = 0.48;  // 48% 절감

  const avgHeatingCost = 820000;           // 연평균 난방비 기준 (30평 기준)
  const annualSaving = Math.round(avgHeatingCost * savingsRate);
  return {
    annualSaving,
    monthlySaving: Math.round(annualSaving / 12),
    savingsRate,
    tenYearSaving: annualSaving * 10
  };
}
```

### 12.4 숫자 카운트업 애니메이션

연식 입력 완료(blur 이벤트 또는 변경 감지) 시 트리거.

```javascript
function animateCount(targetEl, targetValue, duration = 1200) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutQuart
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + (targetValue - start) * eased);
    targetEl.textContent = '₩ ' + current.toLocaleString('ko-KR');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
```

**동작 타이밍**:
1. 연식 입력 → 500ms 딜레이
2. 절감액 카드 `fadeIn` (opacity 0→1, 0.4s)
3. 카운트업 시작 (0 → 목표값, 1.2s, easeOutQuart)
4. 프로그레스바 width 애니메이션 동시 진행 (`transition: width 1.2s ease-out`)

### 12.5 프로그레스바 스타일

```css
.savings-bar-track {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin: 12px 0;
}
.savings-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
  border-radius: 6px;
  width: 0%;                          /* JS로 목표값 설정 */
  transition: width 1.2s ease-out;
}
```

### 12.6 전체 카드 스타일

```css
.savings-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
  border: 1.5px solid #10b981;
  border-radius: 16px;
  padding: 28px;
  margin: 20px 0;
}
.savings-amount {
  font-size: 40px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;  /* 숫자 너비 고정으로 흔들림 방지 */
}
.savings-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}
.ten-year-note {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #cbd5e1;
  font-size: 13px;
  color: #475569;
}
.ten-year-note strong {
  color: #3b82f6;
  font-weight: 700;
}
```

---

## 13. 메인 랜딩 페이지 UI 스펙

### 13.1 개요

서비스 진입점. 브랜드 신뢰를 형성하고 옵션A(폼 견적) / 옵션B(대화형 견적) 두 경로로 분기.

**URL**: `/` (루트) 또는 `/sync`

### 13.2 페이지 구조

```
[Header]
  ├─ 로고
  ├─ 네비게이션
  └─ "상담 신청" CTA 버튼 (우상단)

[히어로 섹션]

[신뢰 지표 섹션]

[옵션A/B 진입 섹션]

[난방비 계산기 티저]

[후기/사례 섹션] (선택적)

[Footer]
```

### 13.3 히어로 섹션

**배경**: 풀스크린 이미지 또는 영상 (고급스러운 창호 시공 현장)  
대안: 블루 그라디언트 + 창호 일러스트 (현재 프로토타입과 동일)

```
┌─────────────────────────────────────────────┐
│                                             │
│    나만의 창·작품 SYNC                       │  h1, 48px, 700, white
│    대화 없이 5분 만에 내 집 창호 견적          │  p, 20px, 300, rgba(255,255,255,0.85)
│                                             │
│    ┌──────────────────┐  ┌──────────────┐   │
│    │  폼으로 견적내기  │  │ 대화로 견적내기│   │
│    └──────────────────┘  └──────────────┘   │
│                                             │
│    ↓ 아래로 스크롤하여 더 알아보기            │  scroll indicator
└─────────────────────────────────────────────┘
```

**히어로 최소 높이**: `100vh` (또는 `min-height: 600px`)

**옵션 진입 버튼 스타일**:
```css
/* 옵션A — 폼 견적 (기본, 어두운 배경) */
.hero-btn-a {
  background: white;
  color: #333;
  border: none;
  padding: 18px 40px;
  font-size: 17px;
  font-weight: 700;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}
.hero-btn-a:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

/* 옵션B — 대화형 (카카오 연상, 노란색 accent) */
.hero-btn-b {
  background: #fee500;
  color: #1f2937;
  border: none;
  padding: 18px 40px;
  font-size: 17px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.hero-btn-b::before { content: '💬'; font-size: 20px; }
.hero-btn-b:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(254,229,0,0.4);
}
```

**스크롤 인디케이터**:
```css
.scroll-indicator {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
}
.scroll-arrow {
  width: 20px; height: 20px;
  border-right: 2px solid rgba(255,255,255,0.6);
  border-bottom: 2px solid rgba(255,255,255,0.6);
  transform: rotate(45deg);
  animation: scrollBounce 1.5s infinite;
}
@keyframes scrollBounce {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50%       { transform: rotate(45deg) translateY(6px); }
}
```

### 13.4 신뢰 지표 섹션

**레이아웃**: 4열 그리드 (모바일: 2열)

```
┌──────────┬──────────┬──────────┬──────────┐
│  15,000+ │  98%     │  4.9★    │  10년    │
│  시공 완료│ 고객 만족│  평균 평점│   A/S    │
└──────────┴──────────┴──────────┴──────────┘
```

**스타일**:
```css
.trust-section {
  padding: 60px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
.trust-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}
.trust-item {
  text-align: center;
}
.trust-number {
  font-size: 36px;
  font-weight: 700;
  color: #3b82f6;
  display: block;
  /* 스크롤 진입 시 카운트업 애니메이션 적용 */
}
.trust-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
}
```

**카운트업 트리거**: IntersectionObserver로 뷰포트 진입 시 실행

---

## 14. 상담 신청 폼 + PDF 다운로드 흐름

### 14.1 UX 개요

**핵심 원칙**: PDF는 무조건 무료 제공이 아닌, 연락처 입력 후 잠금 해제. 리드(lead) 확보가 목적.

**흐름**:
```
결과 페이지
  └─ "PDF 저장" 클릭
        └─ 연락처 입력 모달 노출
              └─ 이름 + 전화번호 입력
                    └─ [PDF 다운로드 + 상담 신청] 버튼
                          └─ PDF 생성 + 다운로드
                          └─ 리드 데이터 → Google Sheets 저장
                          └─ 감사 메시지 노출
```

### 14.2 잠금 해제 모달 스펙

**배경**: 반투명 오버레이 `rgba(0,0,0,0.5)`, 블러 `backdrop-filter: blur(4px)`

```
┌────────────────────────────────────────┐
│                               [✕]      │
│                                        │
│  📄  견적서가 준비되었어요              │
│                                        │
│  연락처를 남겨주시면 PDF를 바로         │
│  다운로드해 드립니다.                   │
│  전문가가 1일 내 연락드려요. 📞         │
│                                        │
│  이름  [____________________]          │
│  연락처 [010-____-____]                │
│                                        │
│  ☑ 개인정보 수집 및 이용 동의 (필수)   │
│                                        │
│  [PDF 다운로드 + 무료 상담 신청  →]    │
│                                        │
│  [이미 상담 신청을 했어요 → PDF만 받기] │  ← 텍스트 링크 (선택적)
└────────────────────────────────────────┘
```

**모달 스타일**:
```css
.lead-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.3s ease;
}
.lead-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: min(480px, calc(100vw - 40px));
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: modalSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 14.3 폼 필드 스펙

**이름**:
- `<input type="text" placeholder="홍길동">`
- 유효성: 2자 이상 한글 또는 영문
- 오류 메시지: "이름을 2자 이상 입력해주세요" (필드 하단, `#ef4444`)

**연락처**:
- `<input type="tel" placeholder="010-0000-0000">`
- 입력 시 자동 하이픈 삽입 (`010` → `010-` → `010-0000-` → `010-0000-0000`)
- 유효성: 010-XXXX-XXXX 패턴
- 포커스 시 키패드 자동 표시 (모바일 `inputmode="numeric"`)

**개인정보 동의**:
```css
.consent-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0;
}
.consent-checkbox {
  width: 18px; height: 18px;
  accent-color: #3b82f6;
  flex-shrink: 0;
  margin-top: 2px;
}
.consent-label {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}
.consent-label a {
  color: #3b82f6;
  text-decoration: underline;
}
```

### 14.4 제출 버튼 상태

| 상태 | 스타일 |
|------|--------|
| 미완성 (기본) | `background: #9ca3af`, `cursor: not-allowed` |
| 입력 완료 | `background: #333` → hover시 `#3b82f6` |
| 제출 중 | 버튼 내 스피너 + "처리 중..." 텍스트, `disabled` |
| 완료 | `background: #10b981` + "✓ 완료!" 텍스트 0.5s → 모달 닫힘 |

**스피너**:
```css
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### 14.5 제출 후 처리 흐름

```
1. 폼 유효성 통과
2. 버튼 → 로딩 상태
3. [병렬]
   a. PDF 생성 (jsPDF) + 자동 다운로드
   b. 리드 데이터 → POST /api/leads → Google Sheets 저장
4. 버튼 → 완료 상태 (0.8s)
5. 모달 닫힘 (fadeOut 0.3s)
6. Toast: "PDF가 다운로드되었습니다. 1일 내 연락드릴게요! 😊"
```

### 14.6 PDF 잠금 시각적 표현 (버튼 상태)

결과 페이지의 "PDF 저장" 버튼에 잠금 아이콘 추가:

```css
.pdf-btn::before {
  content: '🔒';  /* 잠금 상태 */
  font-size: 16px;
}
/* 연락처 입력 완료 후 잠금 해제 시 */
.pdf-btn.unlocked::before {
  content: '📄';  /* 문서 아이콘으로 교체 */
}
```

모달 진입 전 PDF 버튼 클릭 시: 버튼이 살짝 흔들리는 shake 애니메이션 후 모달 오픈:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}
.pdf-btn.shake { animation: shake 0.4s ease; }
```
