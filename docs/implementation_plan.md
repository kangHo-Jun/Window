# Hugreen 직접 SYNC 완전 구현 계획

## 목표

Hugreen 웹사이트([https://www.hugreen.kr/sync/creation](https://www.hugreen.kr/sync/creation))의 "직접SYNC" 프로세스를 **빠짐없이 완전히 재현**하여, 사용자가 아파트 평형별로 공간을 선택하고, 각 공간마다 창호 제품과 사이즈를 입력하여 정확한 견적을 산출받을 수 있는 웹 애플리케이션을 구현합니다. 

---

## 사용자 검토 필요 사항

> [!IMPORTANT]
> **주요 변경 사항**
> - 기존 구현은 Step 4에서 제품 선택 후 바로 결과 페이지로 이동했으나, 실제 Hugreen 사이트는 **각 공간마다 제품 선택 + 사이즈 입력**을 순차적으로 진행합니다.
> - 공간 선택 제한(최대 2개)을 제거하고 **전체 선택 및 중복 선택** 가능하도록 변경합니다.
> - 50평대 옵션 추가로 총 **8가지 평형 조합** (20/30/40/50평대 x 확장형/비확장형)을 지원합니다.

> [!WARNING]
> **백엔드 연동 필요**
> - PDF 저장 및 공유 기능은 서버 측 처리가 필요합니다.
> - 정확한 가격 계산 로직은 실제 제품 데이터베이스와 연동되어야 합니다.

---

## 제안된 변경 사항

### 1. 애플리케이션 구조

#### [MODIFY] [direct-sync.html](file:///Users/zart/Documents/창호/direct-sync.html)

**주요 수정 사항:**

- **Step 1 (주거형태)**: 아파트만 선택 가능하도록 단순화
- **Step 2 (평형 선택)**: 8가지 조합 지원
  - 20평대 확장형 / 20평대 비확장형
  - 30평대 확장형 / 30평대 비확장형
  - 40평대 확장형 / 40평대 비확장형
  - 50평대 확장형 / 50평대 비확장형
- **Step 3 (공간 선택)**: 평형별 동적 공간 리스트 + 전체 선택 기능
- **Step 4 (제품 및 사이즈 입력)**: 선택된 각 공간마다 순차적으로 진행
  - 상단에 선택된 공간 탭 표시 (예: 거실 | 안방 | 침실1)
  - 현재 공간에 대한 제품 선택
  - 제품 선택 후 사이즈 입력 폼 표시 (가로 W x 세로 H, mm 단위)
  - "다음 공간" 버튼으로 순차 진행
- **Step 5 (결과 페이지)**: 전체 선택 내역 + 총 예상 가격 + PDF/공유 버튼

---

#### [MODIFY] [direct-sync.css](file:///Users/zart/Documents/창호/direct-sync.css)

**추가 스타일:**

- **공간 탭 네비게이션**: Step 4에서 선택된 공간을 탭 형태로 표시
  - 완료된 공간: 체크 아이콘 + 녹색 배경
  - 현재 공간: 강조 색상 (파란색/보라색)
  - 미완료 공간: 회색 배경
- **사이즈 입력 폼**: 가로/세로 입력 필드 + 단위 표시 (mm)
- **전체 선택 버튼**: Step 3에서 "전체 선택" 체크박스 스타일
- **PDF/공유 버튼**: 결과 페이지 하단에 아이콘 버튼

---

#### [MODIFY] [direct-sync.js](file:///Users/zart/Documents/창호/direct-sync.js)

**상태 관리 구조 변경:**

```javascript
const state = {
    currentStep: 1,
    housingType: '아파트', // 고정값
    sizeType: null,        // '20평대', '30평대', '40평대', '50평대'
    expansionType: null,   // '확장형', '비확장형'
    selectedSpaces: [],    // ['거실', '안방', '침실1', ...]
    spaceProducts: {},     // { '거실': { product: 'xxx', width: 3000, height: 2000 }, ... }
    currentSpaceIndex: 0   // Step 4에서 현재 진행 중인 공간 인덱스
};
```

**주요 로직 변경:**

1. **Step 2 초기화**
   - 8가지 평형 조합 버튼 렌더링
   - 선택 시 `sizeType`과 `expansionType` 동시 설정

2. **Step 3 초기화**
   - 평형별 공간 데이터 매핑:
     ```javascript
     const spacesByType = {
         '20평대-비확장형': ['거실', '안방', '침실1', '침실2', '주방', '다용도실', '앞발코니', '뒷발코니'],
         '20평대-확장형': ['거실', '안방', '침실1', '침실2', '주방', '다용도실', '안방발코니', '터닝도어'],
         '30평대-비확장형': ['거실', '안방', '침실1', '침실2', '알파룸', '주방', '다용도실', '앞발코니', '뒷발코니'],
         '30평대-확장형': ['거실', '안방', '침실1', '침실2', '알파룸', '주방', '다용도실', '안방발코니', '터닝도어'],
         '40평대-비확장형': ['거실', '안방', '침실1', '침실2', '침실3', '주방', '다용도실', '드레스룸', '발코니(전체)'],
         '40평대-확장형': ['거실', '안방', '침실1', '침실2', '침실3', '주방', '다용도실', '드레스룸', '안방발코니', '터닝도어'],
         '50평대-비확장형': ['거실', '안방', '침실1', '침실2', '침실3', '침실4', '주방', '다용도실', '드레스룸', '서재', '발코니'],
         '50평대-확장형': ['거실', '안방', '침실1', '침실2', '침실3', '침실4', '주방', '다용도실', '드레스룸', '서재', '안방발코니', '터닝도어']
     };
     ```
   - "전체 선택" 체크박스 구현
   - 중복 선택 가능 (체크박스 방식)

3. **Step 4 초기화 및 진행**
   - 선택된 공간 배열을 순회하며 각 공간마다:
     - 상단 탭에 공간 이름 표시 (완료/진행중/대기 상태 구분)
     - 현재 공간명 표시 (예: "거실의 창호를 선택해주세요")
     - 제품 선택 옵션 렌더링
     - 제품 선택 시 사이즈 입력 폼 활성화
     - "다음 공간" 버튼 클릭 시:
       - 입력값 검증 (제품 선택 + 사이즈 입력 필수)
       - `spaceProducts` 객체에 저장
       - `currentSpaceIndex++`
       - 다음 공간으로 이동 또는 결과 페이지로 이동

4. **Step 5 (결과 페이지)**
   - 선택 요약 테이블:
     | 공간 | 제품 | 사이즈 (W x H) | 단가 |
     |------|------|----------------|------|
     | 거실 | 자동환기창 | 3000 x 2000mm | 1,200,000원 |
     | 안방 | 이중창 | 2000 x 1500mm | 800,000원 |
   - 총 예상 가격 계산 및 표시
   - **PDF 저장 버튼**: 견적서 PDF 생성 (jsPDF 라이브러리 사용)
   - **공유 버튼**: 현재 선택 내역을 URL 파라미터로 인코딩하여 공유 링크 생성

---

### 2. 평형별 공간 데이터 정의

#### 20평대 비확장형
거실, 안방, 침실1, 침실2, 주방, 다용도실, 앞발코니, 뒷발코니

#### 20평대 확장형
거실, 안방, 침실1, 침실2, 주방, 다용도실, 안방발코니, 터닝도어

#### 30평대 비확장형
거실, 안방, 침실1, 침실2, 알파룸, 주방, 다용도실, 앞발코니, 뒷발코니

#### 30평대 확장형
거실, 안방, 침실1, 침실2, 알파룸, 주방, 다용도실, 안방발코니, 터닝도어

#### 40평대 비확장형
거실, 안방, 침실1, 침실2, 침실3, 주방, 다용도실, 드레스룸, 발코니(전체)

#### 40평대 확장형
거실, 안방, 침실1, 침실2, 침실3, 주방, 다용도실, 드레스룸, 안방발코니, 터닝도어

#### 50평대 비확장형
거실, 안방, 침실1, 침실2, 침실3, 침실4, 주방, 다용도실, 드레스룸, 서재, 발코니

#### 50평대 확장형
거실, 안방, 침실1, 침실2, 침실3, 침실4, 주방, 다용도실, 드레스룸, 서재, 안방발코니, 터닝도어

---

### 3. 제품 데이터 구조

```javascript
const products = [
    {
        id: 'auto-ventilation',
        name: '자동환기창',
        category: '이중창',
        basePrice: 1200000,
        image: '/path/to/image1.png',
        description: '자동 환기 시스템이 내장된 고급 이중창'
    },
    {
        id: 'double-window',
        name: '일반 이중창',
        category: '이중창',
        basePrice: 800000,
        image: '/path/to/image2.png',
        description: '단열 성능이 우수한 기본 이중창'
    },
    {
        id: 'sliding-door',
        name: '슬라이딩 도어',
        category: '도어',
        basePrice: 1500000,
        image: '/path/to/image3.png',
        description: '공간 활용도가 높은 슬라이딩 도어'
    },
    {
        id: 'folding-door',
        name: '폴딩 도어',
        category: '도어',
        basePrice: 1800000,
        image: '/path/to/image4.png',
        description: '개방감이 뛰어난 폴딩 도어'
    }
    // ... 추가 제품
];
```

---

### 4. 가격 계산 로직

```javascript
function calculateTotalPrice(spaceProducts) {
    let total = 0;
    
    for (const [space, data] of Object.entries(spaceProducts)) {
        const product = products.find(p => p.id === data.product);
        const area = (data.width / 1000) * (data.height / 1000); // m² 단위로 변환
        const itemPrice = product.basePrice * area;
        total += itemPrice;
    }
    
    // 시공비 추가 (총액의 20%)
    const installationFee = total * 0.2;
    
    return {
        subtotal: total,
        installationFee: installationFee,
        total: total + installationFee
    };
}
```

---

### 5. PDF 저장 기능

#### [NEW] PDF 생성 라이브러리 추가

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
```

#### PDF 생성 함수

```javascript
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 제목
    doc.setFontSize(20);
    doc.text('창호 견적서', 105, 20, { align: 'center' });
    
    // 기본 정보
    doc.setFontSize(12);
    doc.text(`평형: ${state.sizeType} ${state.expansionType}`, 20, 40);
    doc.text(`견적일: ${new Date().toLocaleDateString('ko-KR')}`, 20, 50);
    
    // 테이블 데이터
    const tableData = Object.entries(state.spaceProducts).map(([space, data]) => {
        const product = products.find(p => p.id === data.product);
        const size = `${data.width} x ${data.height}mm`;
        const area = ((data.width / 1000) * (data.height / 1000)).toFixed(2);
        const price = (product.basePrice * parseFloat(area)).toLocaleString('ko-KR');
        
        return [space, product.name, size, area + 'm²', price + '원'];
    });
    
    // 테이블 생성
    doc.autoTable({
        startY: 60,
        head: [['공간', '제품', '사이즈', '면적', '금액']],
        body: tableData,
        theme: 'grid'
    });
    
    // 총액
    const pricing = calculateTotalPrice(state.spaceProducts);
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.text(`소계: ${pricing.subtotal.toLocaleString('ko-KR')}원`, 20, finalY);
    doc.text(`시공비 (20%): ${pricing.installationFee.toLocaleString('ko-KR')}원`, 20, finalY + 10);
    doc.setFontSize(14);
    doc.text(`총 예상 금액: ${pricing.total.toLocaleString('ko-KR')}원`, 20, finalY + 25);
    
    // 저장
    doc.save(`창호견적서_${state.sizeType}_${new Date().getTime()}.pdf`);
}
```

---

### 6. 공유 기능

#### URL 인코딩 방식

```javascript
function generateShareLink() {
    const data = {
        size: state.sizeType,
        expansion: state.expansionType,
        spaces: state.spaceProducts
    };
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('공유 링크가 클립보드에 복사되었습니다!');
    });
    
    return shareUrl;
}

// 페이지 로드 시 URL 파라미터 확인
function loadFromShareLink() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    
    if (data) {
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(data)));
            // state 복원
            state.sizeType = decoded.size;
            state.expansionType = decoded.expansion;
            state.spaceProducts = decoded.spaces;
            state.selectedSpaces = Object.keys(decoded.spaces);
            
            // 결과 페이지로 바로 이동
            showStep(5);
        } catch (e) {
            console.error('공유 링크 로드 실패:', e);
        }
    }
}
```

---

## 검증 계획

### 자동화된 테스트

#### 브라우저 테스트 시나리오

**시나리오 1: 20평대 확장형 - 전체 공간 선택**
1. Step 1: 아파트 선택 (자동)
2. Step 2: "20평대 확장형" 선택
3. Step 3: "전체 선택" 체크
4. Step 4: 각 공간(거실, 안방, 침실1, 침실2, 주방, 다용도실, 안방발코니, 터닝도어)마다:
   - 제품 선택
   - 사이즈 입력 (랜덤 값)
   - "다음 공간" 클릭
5. Step 5: 결과 확인 + PDF 저장 + 공유 링크 생성

**시나리오 2: 50평대 비확장형 - 부분 선택**
1. Step 2: "50평대 비확장형" 선택
2. Step 3: 거실, 안방, 침실1, 서재만 선택
3. Step 4: 선택된 4개 공간에 대해 제품/사이즈 입력
4. Step 5: 결과 확인

**시나리오 3: 공유 링크 복원**
1. 시나리오 1 완료 후 공유 링크 생성
2. 새 탭에서 공유 링크 열기
3. 자동으로 결과 페이지 표시 확인

---

### 수동 검증

#### 기능 체크리스트

- [ ] 8가지 평형 조합 모두 정상 작동
- [ ] 평형별 공간 리스트 정확히 표시
- [ ] 전체 선택 기능 정상 작동
- [ ] Step 4에서 공간 탭 네비게이션 정상 작동
- [ ] 사이즈 입력 검증 (숫자만 입력, 최소/최대값)
- [ ] 가격 계산 정확성
- [ ] PDF 생성 및 다운로드
- [ ] 공유 링크 생성 및 복원
- [ ] 뒤로 가기 버튼 (각 단계에서)
- [ ] 모바일 반응형 레이아웃

#### UI/UX 검증

- [ ] 공간 탭 상태 표시 (완료/진행중/대기)
- [ ] 사이즈 입력 폼 UX (단위 표시, 플레이스홀더)
- [ ] 결과 페이지 테이블 가독성
- [ ] PDF 출력물 품질
- [ ] 로딩 인디케이터 (PDF 생성 중)

---

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 애니메이션, 반응형 디자인
- **Vanilla JavaScript**: ES6+, 모듈 패턴, 상태 관리

### 외부 라이브러리
- **Google Fonts**: Noto Sans KR
- **jsPDF**: PDF 생성
- **jsPDF-AutoTable**: PDF 테이블 생성

### 개발 도구
- **브라우저 DevTools**: 디버깅 및 테스트
- **Python HTTP Server**: 로컬 개발 서버

---

## 구현 순서

### Phase 1: 기본 구조 수정 (1-2시간)
1. Step 2 평형 선택 UI 수정 (8가지 조합)
2. Step 3 공간 데이터 매핑 및 전체 선택 기능
3. 상태 관리 구조 변경

### Phase 2: Step 4 재구현 (2-3시간)
4. 공간 탭 네비게이션 UI 구현
5. 순차 진행 로직 구현
6. 사이즈 입력 폼 및 검증

### Phase 3: 결과 페이지 개선 (1-2시간)
7. 선택 요약 테이블 렌더링
8. 가격 계산 로직 구현
9. 결과 페이지 UI 개선

### Phase 4: PDF 및 공유 기능 (2-3시간)
10. jsPDF 라이브러리 통합
11. PDF 생성 함수 구현
12. 공유 링크 생성 및 복원 로직

### Phase 5: 테스트 및 최적화 (1-2시간)
13. 브라우저 자동화 테스트 작성
14. 버그 수정 및 UX 개선
15. 모바일 반응형 최적화

**예상 총 소요 시간: 7-12시간**

---

## 실행 방법

### 로컬 개발 서버 실행

```bash
cd "/Users/zart/Documents/창호"
python3 -m http.server 8000
```

브라우저에서 접속:
```
http://localhost:8000/direct-sync.html
```

### 프로덕션 배포 시

- 정적 파일 호스팅 (Netlify, Vercel, GitHub Pages)
- 또는 웹 서버 (Nginx, Apache)에 배포

---

## 참고 자료

### Hugreen 사이트 분석 결과

실제 사이트 분석을 통해 확인된 프로세스:

1. **Step 1**: 주거형태 선택 (아파트/빌라/주택/기타)
2. **Step 2**: 평형 및 확장 여부 선택 (20/30/40평대 확인, 50평대는 사이트 업데이트에 따라 추가 필요)
3. **Step 3**: 공간 선택 (평형별 동적 리스트, 전체 선택 가능)
4. **Step 4**: 각 공간마다 순차적으로:
   - 상단 탭에 선택된 공간 표시
   - 현재 공간의 제품 선택
   - 제품 선택 후 사이즈 입력 (가로 W x 세로 H, mm)
   - "다음" 버튼으로 다음 공간 또는 결과 페이지로 이동
5. **Step 5**: 최종 견적 확인

### 스크린샷 참고

브라우저 분석 중 캡처된 스크린샷:
- [인트로 페이지](file:///Users/zart/.gemini/antigravity/brain/2e87683e-016b-488e-bc68-4197d2666768/intro_page_1769047196104.png)
- [Step 1: 주거형태](file:///Users/zart/.gemini/antigravity/brain/2e87683e-016b-488e-bc68-4197d2666768/step1_housing_type_1769047215347.png)
- [Step 2: 평형 선택](file:///Users/zart/.gemini/antigravity/brain/2e87683e-016b-488e-bc68-4197d2666768/step2_size_type_1769047245388.png)
- [Step 3: 공간 선택 (20평대 확장형)](file:///Users/zart/.gemini/antigravity/brain/2e87683e-016b-488e-bc68-4197d2666768/step3_spaces_20_expanded_1769047283780.png)
- [Step 4: 제품 및 사이즈 입력](file:///Users/zart/.gemini/antigravity/brain/2e87683e-016b-488e-bc68-4197d2666768/step4_product_size_input_1769048365616.png)
- [Step 4: 다중 공간 선택](file:///Users/zart/.gemini/antigravity/brain/2e87683e-016b-488e-bc68-4197d2666768/step4_multi_spaces_selection_1769048669181.png)

---

## 결론

이 구현 계획은 Hugreen의 "직접SYNC" 프로세스를 **완전히 재현**하며, 사용자 요구사항을 모두 반영합니다:

✅ 아파트만 선택 가능  
✅ 8가지 평형 조합 (20/30/40/50평대 x 확장/비확장)  
✅ 평형별 정확한 공간 리스트  
✅ 전체 선택 및 중복 선택 가능  
✅ 각 공간마다 제품 선택 + 사이즈 입력  
✅ 순차적 진행 (공간 탭 네비게이션)  
✅ 총 예상 가격 산출  
✅ PDF 저장 기능  
✅ 공유 기능  

실제 구현 시 이 계획서를 기반으로 단계별로 진행하며, 각 Phase마다 테스트를 통해 품질을 검증합니다.

##추가
- 실제 제품 DB는 구글시트에 저장 할 것이다(필요한 DB샘플파일을 만들어붜)
- 가격은 구글시트에 저장 할 것이다(필요한 DB샘플파일을 만들어붜 예:A창 (3000-3100)* (2000-2100) 300만원)git commit -m 'feat: 1단계 완료 by Claude (Gemini로 인계 준비)'