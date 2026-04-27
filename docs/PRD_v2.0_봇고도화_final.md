# PRD v2.0 봇고도화 Final

> ver20 RAG AI 창호 상담 챗봇 최종 기준 문서
> 현재 상태: Phase 2 완료, Phase 3 준비 중

---

## 1. 목표

창호 견적 챗봇을 단순 Q&A가 아니라
`공감 → 정보 수집 → 가견적 → 상담 연결` 흐름으로 고도화한다.

핵심 목표:
- 소비자가 사람 상담사와 대화하는 느낌 제공
- 최소 입력으로 빠른 가견적 제공
- 필요 시 심층 질문으로 정밀도 향상
- 운영자가 후속 상담하기 쉬운 데이터 구조 확보

---

## 2. 대화 원칙

### 브랜드 3축
- 전문성
- 단순명료
- 중립

### Conversational UX 원칙
- 모든 답변은 2~3문장 이내
- 한 번에 질문은 하나만
- 강제 순서보다 자연스러운 흐름 우선
- 소비자가 원할 때 빠르게 이탈 가능
- 사람 상담 연결 경로는 항상 열어둠

### Guided Selling Flow
- 최소 정보 3개 수집 후 빠른 가견적 제시
- 추가 정보가 쌓일수록 견적 품질 업그레이드
- 불확실하거나 실패가 반복되면 Human-in-the-Loop 전환

### Raw.Studio 반영 원칙
- 장황한 챗봇 문구 제거
- 버튼, 진행도, 결과물은 기능 중심으로 단순하게
- 시각 요소는 “지금 무엇을 할 수 있는지”를 분명히 보여준다

---

## 3. 현재 완료 상태

### 완료 항목
- ✅ Phase 1 - 페르소나 "지인이" 구현
- ✅ Phase 1 - 태도 감지 5가지 (`intentClassifier`)
- ✅ Phase 1 - Gemini 정보 추출 (2단계 호출)
- ✅ Phase 1 - fields 상태 주입 (중복 질문 방지)
- ✅ Phase 2 - 동적 질문 생성 (`dynamicQuestion`)
- ✅ Phase 2 - 진행도 바 (`ChatProgress`)
- ✅ Phase 2 - 스마트 버튼 (`SmartOptions`)
- ✅ Phase 2 - 3단계 심층 대화 로직
- ✅ Phase 2 - 통과/패스 처리 (`skipDetector`)
- ✅ Phase 2 - Sentiment Detection
- ✅ Phase 2 - Fallback Handling
- ✅ Phase 2 - 견적 레벨 시스템 (`quoteLevelEngine`)
- ✅ Phase 2 - 바로 가견적 버튼 (헤더 고정)
- ✅ Phase 2 - 이름 수집 → 개인화
- ✅ Phase 2 - Human-in-the-Loop 플래그
- ✅ Phase 2 - Clear Exit Paths
- ✅ 브랜드 3축 확정 (전문성+단순명료+중립)
- ✅ Brand Voice Guide 문서화
- ✅ Conversational UX 원칙 적용
- ✅ Guided Selling Flow 설계
- ✅ Raw.Studio 원칙 반영

### 구현 파일 기준 완료
- `src/lib/personaEngine.ts`
- `src/lib/intentClassifier.ts`
- `src/lib/dynamicQuestion.ts`
- `src/lib/sentimentDetector.ts`
- `src/lib/skipDetector.ts`
- `src/lib/quoteLevelEngine.ts`
- `src/app/api/chat/route.ts`
- `src/components/AIChatBot.tsx`
- `src/components/ChatProgress.tsx`
- `src/components/SmartOptions.tsx`
- `docs/brand_voice_지인이.md`

---

## 4. 현재 대화 구조

### 최소 정보 수집
- 주거형태
- 평형
- 확장여부

위 3개가 채워지면:
- 헤더 우측에 빠른 가견적 버튼 노출
- 소비자는 대화를 더 이어가거나 바로 견적으로 이동 가능

### 견적 레벨 시스템
- 레벨 1: `housingType + pyeong + expansion`
- 레벨 2: `+ space + age + problem`
- 레벨 3: `+ timing + floor + brandPreference + priority`

### 동적 오차율
- 레벨1 기본: `±30%`
- 레벨2 기본: `±15%`
- 레벨3 기본: `±5%`
- 핵심 필드 스킵당 `+10%`
- 보조 필드 스킵당 `+5%`

### 실패 처리
- 엉뚱한 답변 시 fallback
- 감정 상태에 따라 말투 조절
- 2회 이상 실패 시 Human-in-the-Loop 플래그 생성

---

## 5. 남은 개발 범위

### 개발할 것
- ⬜ Phase 3 - 가견적 인라인 카드 출력
- ⬜ Phase 3 - 레벨별 출력 품질 차별화
- ⬜ Phase 3 - 소비자 그룹화 (5가지)
- ⬜ Phase 3 - 맞춤 컨설팅 레포트 (PDF)
- ⬜ Phase 4 - 운영자 전략 카드
- ⬜ Phase 4 - Google Sheets 고도화
- ⬜ Phase 4 - ver20 Cloud Run 배포

---

## 6. 남은 품질 이슈

현재 구현은 Phase 2 기준으로 상당 부분 완성됐지만,
아래 항목은 최종 검증이 더 필요하다.

- Gemini 실연동 안정성
- 이름 수집 후 다음 질문 자연스러움
- 숫자 단독 입력의 문맥 인식
- fallback 이후 재질문 품질
- 스킵 처리와 실제 견적 정밀도의 일치성
- 브랜드 비교 시 중립적 표현 유지

---

## 7. 다음 단계 기준

### Phase 3 목표
- 대화 중간에 카드형 가견적을 자연스럽게 삽입
- 소비자에게 “지금 어느 수준의 견적인지” 직관적으로 전달
- 그룹 분류 기반으로 응답 방향 차별화

### Phase 4 목표
- 운영자가 상담 우선순위를 즉시 판단 가능
- Google Sheets에서 후속 상담 전략이 한눈에 보이도록 구조화
- Cloud Run 운영 배포까지 ver20 완결

---

## 8. 결론

ver20 챗봇은 현재
`페르소나 + 동적질문 + 감정감지 + 스킵처리 + 견적레벨 + fallback + 상담연결`
까지 완료된 상태다.

즉, Phase 2는 사실상 끝났고,
이제 남은 핵심은 Phase 3의 출력 품질 고도화와
Phase 4의 운영자 지원/배포 마무리다.
