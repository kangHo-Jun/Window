# Hugreen 창호 견적 시스템 (Direct Sync)

창호 제품을 선택하고 실시간 견적을 받을 수 있는 웹 기반 견적 시스템입니다.

---

## 주요 기능

- ✅ **4단계 견적 프로세스**: 주거형태 → 평형 선택 → 공간 선택 → 제품 선택
- ✅ **평형별 공간 자동 매핑**: 20평대~50평대, 확장형/비확장형
- ✅ **실시간 가격 계산**: 가로/세로 범위에 따른 자동 가격 산출
- ✅ **PDF 견적서 생성**: jsPDF-AutoTable을 사용한 전문 견적서
- ✅ **공유 링크 기능**: Base64 인코딩을 통한 견적 공유
- ✅ **Google Sheets 연동**: 제품/가격 DB 외부화
- ✅ **뒤로 가기 버튼**: 모든 단계에서 이전 단계로 이동 가능

---

## 시작하기

### 1. 로컬 서버 실행

```bash
cd /Users/zart/Documents/창호
python3 -m http.server 8000
```

### 2. 브라우저에서 접속

```
http://localhost:8000/direct-sync.html
```

---

## Google Sheets 연동 설정 (선택 사항)

Google Sheets를 사용하여 제품 및 가격 데이터를 외부에서 관리할 수 있습니다.

### 빠른 설정 가이드

1. **config.js 파일 생성**:
   ```bash
   cp config.js.example config.js
   ```

2. **Google Sheets API 설정**:
   - [상세 가이드 보기](docs/google_sheets_setup_guide.md)

3. **config.js 파일 수정**:
   ```javascript
   const GOOGLE_SHEETS_CONFIG = {
       API_KEY: 'YOUR_API_KEY_HERE',
       SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
       SHEETS: {
           PRODUCTS: 'products',
           PRICES: 'prices'
       }
   };
   ```

4. **Google Sheets 준비**:
   - `docs/products_db_sample.csv` 및 `docs/price_db_sample.csv` 파일을 Google Sheets에 가져오기
   - 시트 이름을 `products`와 `prices`로 설정
   - 스프레드시트를 "링크가 있는 모든 사용자"로 공유 설정

### 폴백 모드

Google Sheets 연동이 실패하면 자동으로 하드코딩된 기본 데이터를 사용합니다.

---

## 프로젝트 구조

```
창호/
├── direct-sync.html       # 메인 HTML 파일
├── direct-sync.js         # 메인 JavaScript 로직
├── direct-sync.css        # 스타일시트
├── config.js              # Google Sheets API 설정 (gitignore)
├── config.js.example      # 설정 예시 파일
├── .gitignore             # Git 무시 파일 목록
├── README.md              # 이 파일
└── docs/
    ├── implementation_plan.md           # 구현 계획서
    ├── google_sheets_setup_guide.md     # Google Sheets 연동 가이드
    ├── phase4_verification.md           # Phase 4 검증 문서
    ├── phase5_tab_interaction_test.md   # Phase 5 테스트 문서
    ├── products_db_sample.csv           # 제품 DB 샘플
    └── price_db_sample.csv              # 가격 DB 샘플
```

---

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **PDF 생성**: jsPDF + jsPDF-AutoTable
- **API 연동**: Google Sheets API v4
- **로컬 서버**: Python HTTP Server

---

## 개발 단계별 구현 내역

### Phase 1: HTML 구조 설계 ✅
- 4단계 스텝 네비게이션
- 반응형 레이아웃

### Phase 2: Step별 로직 구현 ✅
- Step 1: 아파트 자동 선택
- Step 2: 평형 + 확장형 분리 선택
- Step 3: 동적 공간 리스트
- Step 4: 제품 선택 + 사이즈 입력

### Phase 3: 스타일링 ✅
- 모던 UI/UX 디자인
- 공간 탭 네비게이션
- 제품 카드 레이아웃

### Phase 4: PDF & 공유 기능 ✅
- 가격 계산 로직 (범위 기반)
- PDF 견적서 생성
- 공유 링크 생성/복원

### Phase 5: 탭 인터랙션 ✅
- 완료된 탭 클릭 가능
- 데이터 보존 및 복원
- 뒤로 가기 버튼

### Phase 6: Google Sheets 연동 ✅
- API 키 기반 인증
- 제품/가격 DB 외부화
- 폴백 모드 구현

---

## 사용 방법

### 1. 견적 작성

1. **Step 1**: 아파트 선택 (자동 선택됨)
2. **Step 2**: 평형 선택 (20/30/40/50평) + 확장형 선택
3. **Step 3**: 공간 선택 (평형에 따라 자동 생성)
4. **Step 4**: 각 공간의 제품 및 사이즈 입력

### 2. 견적서 다운로드

- **PDF 저장** 버튼 클릭
- 자동으로 견적서 PDF 다운로드

### 3. 견적 공유

- **공유하기** 버튼 클릭
- 클립보드에 공유 링크 복사됨
- 링크를 다른 사람에게 전송

### 4. 뒤로 가기

- 각 단계에서 **이전** 버튼 클릭
- 입력한 데이터는 자동 저장됨

---

## 데이터 관리

### Google Sheets 사용 시

1. Google Sheets에서 데이터 수정
2. 웹사이트 새로고침
3. 변경사항 즉시 반영

### 로컬 데이터 사용 시

`direct-sync.js` 파일에서 `products` 및 `priceTable` 배열을 직접 수정

---

## 문제 해결

### 데이터가 로드되지 않음

**브라우저 콘솔 확인**:
```
F12 → Console 탭
```

**일반적인 오류**:
- `API 키 오류 (400)`: config.js의 API_KEY 확인
- `스프레드시트 없음 (404)`: SPREADSHEET_ID 확인
- `권한 없음 (403)`: Google Sheets 공유 설정 확인

### Step 3에서 공간이 표시되지 않음

**확인 사항**:
- 브라우저 콘솔에서 `renderStep3 호출:` 로그 확인
- `spacesByType` 키가 올바른지 확인 (예: `30평대-확장형`)

### PDF 생성 실패

**확인 사항**:
- jsPDF 라이브러리가 로드되었는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

---

## 보안

### API 키 보호

- **절대 GitHub에 업로드하지 마세요**
- `.gitignore`에 `config.js` 추가됨
- `config.js.example`을 복사하여 사용

### HTTPS 사용 권장

프로덕션 환경에서는 HTTPS를 사용하여 API 키 노출 방지

---

## 라이선스

이 프로젝트는 Hugreen 내부 사용을 위한 것입니다.

---

## 지원

문제가 발생하면 다음을 확인하세요:

1. [Google Sheets 설정 가이드](docs/google_sheets_setup_guide.md)
2. [구현 계획서](docs/implementation_plan.md)
3. [Phase 4 검증 문서](docs/phase4_verification.md)

---

## 업데이트 내역

### v1.0.0 (2026-01-23)
- ✅ Phase 1~6 모든 기능 구현 완료
- ✅ Google Sheets API 연동
- ✅ 뒤로 가기 버튼 추가
- ✅ 평형/확장형 분리 UI 개선

---

## 다음 단계 (선택 사항)

- [ ] 모바일 반응형 최적화
- [ ] 로딩 애니메이션 추가
- [ ] 사용자 입력 유효성 검사 강화
- [ ] 다국어 지원 (영어)
- [ ] 관리자 대시보드

---

**🎉 Hugreen 창호 견적 시스템이 성공적으로 구현되었습니다!**
