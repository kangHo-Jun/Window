# 🤖 AI 코더에게 전달할 프롬프트

너는 **Next.js 16.1, TypeScript, Tailwind CSS, shadcn/ui 전문 수석 개발자**야.

## 📋 작업 지시

첨부한 **[요구사항 정의서 PRD.md]**의 기능을 구현하되, **[기술 사양서 TRD.md]**의 스택과 아키텍처를 **엄격하게** 준수해.

### ⚠️ 중요 규칙
1. **절대 생략하거나 너의 임의대로 판단하지 마라**
2. **기술 사양서에 명시된 라이브러리와 버전만 사용**
3. **코드는 초보자도 읽고 수정할 수 있게 명확하게 작성**
4. **주석을 한글로 상세하게 달아라**

### 📂 1단계: 프로젝트 초기 설정
먼저 다음 명령어로 Next.js 16 프로젝트를 생성해줘:

\`\`\`bash
npx create-next-app@latest window-estimate-system --typescript --tailwind --app
cd window-estimate-system
\`\`\`

그 다음 **TRD.md의 "디렉토리 구조"**에 맞춰 폴더 구조를 완전히 동일하게 만들어줘.

### 📂 2단계: 필수 라이브러리 설치
TRD.md의 "필수 라이브러리 및 버전" 섹션에 있는 모든 패키지를 정확한 버전으로 설치해줘:

\`\`\`bash
npm install next@16.1.0 react@^19.0.0 react-dom@^19.0.0
npm install googleapis react-hook-form zod framer-motion
npm install -D @types/node @types/react @types/react-dom
\`\`\`

그리고 shadcn/ui 컴포넌트도 TRD.md에 명시된 대로 설치해줘:

\`\`\`bash
npx shadcn@latest init
npx shadcn@latest add button card input form dialog select checkbox progress
\`\`\`

### 📂 3단계: 환경 변수 설정
`.env.local` 파일을 생성하고 TRD.md의 "환경 변수 설정" 섹션을 참고해서 템플릿을 만들어줘. (실제 값은 나중에 내가 넣을게)

### 📂 4단계: 핵심 기능 구현 (단계별로 진행)

#### 4-1. Google Sheets 연동
- `/lib/google-sheets.ts` 파일 생성
- TRD.md의 "Google Sheets 연동 설정" 섹션 참고
- 데이터 읽기/쓰기 함수 구현
- **반드시 에러 핸들링 포함**

#### 4-2. 메인 랜딩 페이지
- `/app/(main)/page.tsx` 생성
- 히어로 섹션 + "견적 시작하기" 버튼
- Framer Motion으로 페이드인 애니메이션
- 벤치마킹 사이트처럼 화려하게!

#### 4-3. 견적 단계별 페이지 (Step 1~4)
PRD.md의 "사용자 플로우"에 따라:
- `/app/(main)/estimate/step1/page.tsx` (주거형태 선택)
- `/app/(main)/estimate/step2/page.tsx` (평형 선택)
- `/app/(main)/estimate/step3/page.tsx` (공간 선택)
- `/app/(main)/estimate/step4/page.tsx` (제품 선택)

**각 페이지 필수 요소**:
- 진행 상황 표시 (Progress Bar)
- 선택된 항목 하이라이트
- 이전/다음 버튼
- 반응형 디자인 (모바일 대응)

#### 4-4. 견적 결과 페이지
- `/app/(main)/estimate/result/page.tsx`
- 선택한 제품 요약 카드
- 총 예상 가격 크게 표시
- "상담 신청하기" 버튼

#### 4-5. 상담 신청 폼
- React Hook Form + Zod 유효성 검사
- API Route: `/app/api/sheets/consultation/route.ts`
- 제출 시 Google Sheets에 데이터 저장
- 성공/실패 토스트 메시지

#### 4-6. 회원가입/로그인
**옵션 A (NextAuth.js 사용 시)**:
- `/lib/auth.ts` 설정 파일
- `/app/api/auth/[...nextauth]/route.ts`
- 로그인/회원가입 페이지 UI 직접 제작

**옵션 B (Clerk 사용 시)**:
- 공식 문서대로 `<ClerkProvider>` 설정
- `<SignIn />`, `<SignUp />` 컴포넌트 사용

**나는 옵션 ____를 선택했어.** (개발 시작 전에 내가 알려줄게)

### 📂 5단계: 스타일링 및 애니메이션
- Tailwind CSS 커스텀 테마 적용 (TRD.md 참고)
- Framer Motion으로 페이지 전환 효과
- 반응형 디자인 (모바일 우선)
- 로딩 스피너, 에러 바운더리 추가

### 📂 6단계: 테스트 및 최적화
- 각 단계별 기능 테스트
- 구글 시트 연동 확인
- 빌드 에러 수정
- Next.js 이미지 최적화 적용

---

## 💬 개발 진행 방식

**단계별로 하나씩 완성하고 나에게 확인받아.**

예시:
1. "1단계 완료했어. 폴더 구조 확인해줘."
2. "4-1 완료. Google Sheets 연동 테스트 코드 보여줄게."
3. "Step 1 페이지 완성! 스크린샷 첨부."

**각 단계마다 코드 설명을 주석으로 자세히 달아줘.** (내가 나중에 수정할 수 있게)

---

## 🚨 절대 금지 사항
- ❌ 구글 시트 Private Key를 코드에 하드코딩
- ❌ pages/ 디렉토리 사용 (App Router만!)
- ❌ 사양서에 없는 라이브러리 임의 추가
- ❌ 에러 핸들링 생략
- ❌ 타입 정의 any 사용

---

## ✅ 체크리스트
개발 완료 후 다음 항목을 모두 확인해줘:

- [ ] TRD.md의 디렉토리 구조와 100% 일치
- [ ] 모든 환경 변수가 .env.local에 정의됨
- [ ] Google Sheets 읽기/쓰기 정상 작동
- [ ] 견적 Step 1~4 모두 구현
- [ ] 상담 신청 폼 제출 성공
- [ ] 회원가입/로그인 작동
- [ ] 반응형 디자인 (모바일 확인)
- [ ] 빌드 에러 없음 (`npm run build` 성공)
- [ ] 주석이 한글로 상세하게 작성됨

---

**지금부터 1단계 "프로젝트 초기 설정"부터 시작해줘!**