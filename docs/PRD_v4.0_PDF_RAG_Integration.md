# PRD v4.0 — PDF 지식 베이스 통합형 하이브리드 RAG

> **버전:** 4.0 | **작성일:** 2026-04-29 | **최종수정:** 2026-04-29  
> **브랜치:** `feature/pdf-knowledge-rag`  
> **핵심 가치:** AI는 상담 전문가로, 코드는 정밀 계산기로. 비정형 PDF 데이터를 통해 상담의 '전문적 근거'를 확보한다.

---

## 1. 개요 및 목적

### 1.1 배경

현재 ver20 시스템은 CSV 기반 정형 데이터로 견적을 산출하고, Gemini가 대화를 주도한다.  
그러나 소비자가 "이 창호가 왜 좋은가요?", "열관류율이 뭔가요?" 같은 **전문 지식 질문**을 할 때,  
AI가 근거 없이 답변하거나 할루시네이션을 일으키는 구조적 한계가 있다.

### 1.2 목적

| 현재 (ver20) | 목표 (v4.0) |
|---|---|
| CSV 기반 견적 계산 | CSV + PDF 하이브리드 지식 검색 |
| 경험적 답변 | 제품 카탈로그·기술 사양 근거 기반 답변 |
| Google Sheets 상담 저장 | Firestore 통합 저장 |
| 단순 견적기 | **전문 창호 컨설턴트 AI** |

### 1.3 핵심 원칙

- **가격은 반드시 코드(CSV 엔진)에서만 산출** — Gemini가 가격을 직접 생성하는 것을 금지
- **PDF 지식은 상담·진단 답변 보강에만 활용**
- **기존 State Machine·QuoteCard 구조를 해치지 않음**
- **Google Cloud 생태계 완전 통일** — Cloud Run + Firestore + 기존 서비스 계정 재사용

---

## 2. 사전 준비 사항 (Prerequisites)

### 2.1 기술 스택

| 역할 | 도구 | 선택 이유 |
|---|---|---|
| PDF 파서 | LlamaParse (1순위) / `pymupdf` (무료 대안) | 표(Table) 구조를 Markdown으로 보존 |
| 임베딩 모델 | `text-embedding-004` (Google) | 한국어 전문 용어 이해도 높음 / 768차원 |
| Vector DB + 저장소 | **Firestore Native Vector Search** | 하이브리드 쿼리 + Google 생태계 완전 통일 |
| LLM | `gemini-2.5-flash` | 기존 연결 유지, 저비용 고성능 |

### 2.2 Firestore 선택 근거

> Firestore는 `VectorValue` 타입 필드와 전용 벡터 인덱스를 통해 Native Vector Search를 지원한다 (2024 GA).

| 강점 | 설명 |
|---|---|
| **Native Vector Search** | K-NN / ANN 알고리즘으로 수만 건에서도 밀리초(ms) 단위 유사도 검색 |
| **하이브리드 쿼리** | 브랜드·날짜 등 일반 필터 + 벡터 검색을 **단일 쿼리**로 처리 |
| **데이터 응집성** | CSV `product_id` + 벡터를 같은 문서에 통합 저장 → 매핑 테이블 별도 관리 불필요 |
| **Cloud Run 시너지** | 동일 서비스 계정(`loading-sheet@stacking-492708`) 재사용, 추가 인증 설정 없음 |
| **현실적 규모** | 창호 지식 DB는 수천 건 수준 → Firestore 성능으로 충분 |

### 2.3 Firestore 벡터 스펙

| 항목 | 스펙 | 적합성 |
|---|---|---|
| 최대 벡터 차원 | 2,048 | ✅ (`text-embedding-004` = 768차원) |
| 필터 + 벡터 동시 쿼리 | 지원 | ✅ |
| 예상 문서 수 (창호 지식) | 수천 건 | ✅ 충분 |

### 2.4 준비 데이터 (Knowledge Base)

#### 비정형 데이터 (PDF) — 우선순위 순
1. LX지인 제품 카탈로그 (창호 라인업, 특징)
2. 시공 지침서 (설치 방법, 주의사항)
3. 기술 사양서 (열관류율, 기밀성, 수밀성 수치)
4. KCC글라스 비교 자료
5. 에너지 절약 관련 인증 자료

#### 정형 데이터 (기존 CSV → Firestore 점진적 통합)
- `db_products_v2.csv` — 제품 목록
- `db_prices_v2.csv` — 가격 테이블
- `db_configurations_v2.csv` — 공간 구성 매핑
- `db_margins.csv` — 마진율

> CSV는 초기에 유지하되, Firestore 문서로 점진적 통합 가능.

---

## 3. 시스템 아키텍처

### 3.1 전체 흐름 (Hybrid RAG)

```
사용자 입력
    │
    ▼
┌─────────────────────────────┐
│      Intent Router          │  ← intentClassifier.ts 확장
│  (의도 분류: 견적 / 상담)     │
└─────────────────────────────┘
    │                    │
    ▼                    ▼
[견적 요청]          [지식/상담 요청]
    │                    │
    ▼                    ▼
State Manager        Firestore
& Quote Calculator   Native Vector Search
(기존 코드 유지)          │
    │            (필터 + 벡터 단일 쿼리)
    │                    │
    │             HybridRetriever
    │             (관련 PDF 청크 반환)
    │                    │
    └────────┬───────────┘
             ▼
         Gemini 2.5-flash
         (최종 답변 생성)
             │
             ▼
    사용자 응답 + Firestore 상담 저장
```

### 3.2 Firestore 하이브리드 쿼리 — Pinecone 대비 우위

```typescript
// ❌ Pinecone 방식 (2단계 — 코드 복잡)
// ① 벡터 검색 → 후보 100개 추출
// ② 코드에서 브랜드/날짜 필터링 → 최종 3개

// ✅ Firestore 방식 (1단계 — 단순)
const results = await db.collection("window_knowledge")
  .where("brand", "==", "LX지인")
  .where("year", ">=", 2024)
  .findNearest("embedding", queryVector, {
    limit: 3,
    distanceMeasure: "COSINE",
  });
// → "LX지인 AND 2024년 이후 출시 중 성능 좋은 것"을 단일 호출로 처리
```

### 3.3 데이터 저장소 구분

| 데이터 유형 | 저장소 | 검색 방식 |
|---|---|---|
| 가격 / 규격 (정형) | CSV (기존 유지) | 키워드 매칭 |
| 상담 가이드 / 제품 특징 (비정형) | Firestore `window_knowledge` | Native Vector Search |
| 상담 이력 / 견적 데이터 | Firestore `consultations` | 문서 쿼리 |
| 진단 지식 DB | `창호_진단_지식DB.md` (기존) | 프롬프트 직접 주입 |

---

## 4. 데이터 파이프라인

### 4.1 PDF 처리 — Layout-aware Parsing

```
PDF 원본
  │
  ▼
LlamaParse / pymupdf
  │  (표 구조 → Markdown table 변환)
  ▼
Markdown 텍스트
  │
  ▼
청크 분할 (Chunking)
  │  · 청크 크기: 512 토큰
  │  · 오버랩: 50 토큰
  │  · 표 단위는 분리하지 않음 (표 무결성 보존)
  ▼
text-embedding-004 임베딩 (768차원)
  │
  ▼
Firestore 적재
  (컬렉션: "window_knowledge")
```

> ⚠️ **핵심 품질 체크포인트**: 열관류율·기밀성 등 성능 수치가 담긴 표가  
> 파싱 후에도 올바른 Markdown table로 변환되었는지 반드시 육안 검수.

### 4.2 Firestore 문서 스키마

```typescript
// 컬렉션: window_knowledge (지식 벡터)
{
  id: "lx_catalog_chunk_042",

  // 정형 필드 (필터링용)
  brand: "LX지인",                          // LX지인 | KCC글라스 | 기타
  category: "product_spec",               // product_spec | install_guide | energy | comparison
  product_id: "LX_001",                   // CSV product_id와 직접 연결
  year: 2025,
  source: "LX지인_제품카탈로그_2025.pdf",
  page: 12,

  // 비정형 필드 (벡터 검색용)
  chunk_text: "수퍼세이브 시리즈는 열관류율 0.9W/m²K를 달성하여...",
  embedding: VectorValue([...]),           // 768차원 벡터

  // 메타
  created_at: Timestamp,
}

// 컬렉션: consultations (상담 이력 — Google Sheets 대체)
{
  id: "auto",
  customer_name: "홍길동",
  pyeong: "30평대",
  housing_type: "아파트",
  quote_level: 2,
  estimated_price: { lx: 8500000, kcc: 7200000, budget: 5800000 },
  consumer_group: "가성비추구형",
  needs_human: false,
  fallback_count: 1,
  created_at: Timestamp,
}
```

---

## 5. 모듈 설계

### 5.1 확장 대상 파일

#### `ragEngine.ts` — HybridRetriever 클래스로 확장

```typescript
class HybridRetriever {
  // 1. Firestore Native Vector Search (필터 + 벡터 단일 쿼리)
  async searchVectorDB(
    query: string,
    filters?: { brand?: string; category?: string; year?: number },
    topK: number = 3
  ): Promise<Chunk[]> {
    const queryVector = await embed(query); // text-embedding-004
    return await db.collection("window_knowledge")
      .where("brand", "==", filters?.brand ?? "LX지인")
      .findNearest("embedding", queryVector, {
        limit: topK,
        distanceMeasure: "COSINE",
      });
  }

  // 2. CSV에서 정형 데이터 조회 (기존 로직 유지)
  async searchCSV(productId: string): Promise<ProductData>

  // 3. 두 결과를 병합하여 컨텍스트 구성
  async retrieve(query: string, fields: StateFields): Promise<RAGContext>
}
```

#### `intentClassifier.ts` — 견적 vs 상담 분류 강화

```typescript
type Intent =
  | "quote_request"      // 가견적 요청 → CSV 엔진
  | "knowledge_query"    // 전문 지식 질문 → Firestore Vector Search
  | "diagnosis"          // 불편사항 진단 → 기존 진단 flow
  | "consultation"       // 상담 연결 요청
  | "small_talk"         // 잡담 → 페르소나 응답
```

#### `route.ts` — 라우팅 로직 추가

```typescript
const intent = await classifyIntent(userMessage);

if (intent === "knowledge_query") {
  const chunks = await hybridRetriever.searchVectorDB(userMessage, {
    brand: fields.brand ?? "LX지인",
  });
  prompt = buildRAGPrompt(chunks, conversationHistory, fields);
} else {
  // 기존 견적 flow 유지
}

// 상담 저장: Sheets → Firestore
await saveConsultation(fields, quoteResult); // consultations 컬렉션
```

### 5.2 Prompt 가드레일 (가격 생성 금지)

```
[시스템 프롬프트 추가 섹션]

너는 아래 PDF 지식을 바탕으로 전문적인 창호 상담을 제공한다.

[Firestore 검색 결과]
{retrieved_chunks}

[절대 규칙]
- 가격, 견적 금액은 절대 직접 생성하지 않는다.
- 가격 관련 질문은 반드시 "정확한 가견적은 제가 계산해 드릴게요"로 유도한다.
- 검색 결과에 없는 수치(열관류율, 인증등급 등)는 추측하지 않는다.
```

---

## 6. 단계별 로드맵

### 1단계 — 데이터화

| 작업 | 완료 기준 |
|---|---|
| PDF 원본 5종 수집 | 파일 확보 |
| LlamaParse로 Markdown 변환 | 표 구조 무결성 검수 완료 |
| Firestore 프로젝트 설정 (`stacking-492708`) | 컬렉션 생성 + 벡터 인덱스 설정 완료 |
| 임베딩 + Firestore 적재 스크립트 작성 | 전체 청크 업로드 완료 |
| 검색 품질 테스트 | 쿼리 10개 기준 정확도 ≥ 80% |

### 2단계 — 라우팅 고도화

| 작업 | 완료 기준 |
|---|---|
| `intentClassifier.ts` 확장 | 견적/상담 분류 정확도 ≥ 90% |
| `ragEngine.ts` HybridRetriever 구현 | Firestore 벡터 조회 동작 확인 |
| `route.ts` 라우팅 + Firestore 저장 통합 | 기존 견적 flow 영향 없음 검증 |
| 가드레일 프롬프트 적용 | 가격 직접 생성 0건 확인 |

### 3단계 — 에이전틱 상담

| 작업 | 완료 기준 |
|---|---|
| 진단 스텝에서 Firestore 지식 활용 역질문 구현 | 불편사항 → PDF 근거 답변 확인 |
| QuoteCard에 "전문가 한마디" 섹션 추가 | PDF 출처 표시 포함 |
| Google Sheets → Firestore 상담 저장 전환 | 데이터 정합성 확인 |
| Cloud Run `ver20` 재배포 | 운영 URL 정상 동작 확인 |

---

## 7. 리스크 및 대응

| 리스크 | 가능성 | 대응 |
|---|---|---|
| LlamaParse 비용 초과 | 중 | PDF 5종 이후 추가분은 `pymupdf` 무료 대안 사용 |
| Firestore 벡터 인덱스 설정 복잡도 | 저 | GCP 콘솔 GUI로 설정 가능, 문서화 예정 |
| 기존 견적 flow 깨짐 | 저 | feature 브랜치에서 충분히 검증 후 main 병합 |
| PDF 표 파싱 실패 | 고 | 파싱 후 육안 검수 의무화, 실패 시 수동 Markdown 작성 |
| 할루시네이션 (수치 오류) | 중 | 가드레일 프롬프트 + "검색 결과에 없으면 모른다" 명시 |
| Sheets → Firestore 마이그레이션 오류 | 저 | 병행 운영 후 검증 완료 시 Sheets 비활성화 |

---

## 8. 검증 체크리스트

### 1단계 완료 전 필수 확인
- [ ] PDF 5종 파싱 완료 및 표 구조 육안 검수
- [ ] Firestore `window_knowledge` 컬렉션 적재 완료 (청크 수 확인)
- [ ] 벡터 인덱스 생성 완료 (`embedding` 필드)
- [ ] 하이브리드 쿼리 테스트 10개 실행 및 결과 검토

### 2단계 완료 전 필수 확인
- [ ] 기존 견적 flow (Smart Lego + Chat) 정상 동작 확인
- [ ] QuoteCard 금액 표시 정확도 유지 확인
- [ ] 가격 직접 생성 케이스 0건 확인
- [ ] Firestore `consultations` 저장 정상 동작 확인

### 3단계 완료 전 필수 확인
- [ ] 운영 URL 전 기능 통합 테스트
- [ ] Firestore 데이터 확인 (GCP 콘솔)
- [ ] Cloud Run 배포 성공

---

## 9. 연관 문서

| 문서 | 위치 |
|---|---|
| 현재 컨텍스트 | `docs/context.md` |
| 기존 PRD v2.0 | `docs/PRD_v2.0_봇고도화_final.md` |
| 브랜드 보이스 | `docs/brand_voice_지인이.md` |
| 창호 진단 지식DB | `docs/창호_진단_지식DB.md` |
| 구글런 설정 | `docs/구글런설정.md` |
| AGENTS 룰 | `AGENTS.md` |

---

*© 2026 Daesan Woodland AI Project. Confidential.*
