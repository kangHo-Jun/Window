# Google Sheets API 연동 가이드

이 가이드는 Hugreen 창호 견적 시스템에서 Google Sheets API를 사용하여 제품 및 가격 데이터를 외부화하는 방법을 설명합니다.

---

## 목차
1. [Google Sheets 준비](#1-google-sheets-준비)
2. [Google Cloud Console에서 API 키 생성](#2-google-cloud-console에서-api-키-생성)
3. [config.js 설정](#3-configjs-설정)
4. [테스트 및 검증](#4-테스트-및-검증)
5. [문제 해결](#5-문제-해결)

---

## 1. Google Sheets 준비

### 1.1 새 Google Sheets 생성

1. [Google Sheets](https://sheets.google.com) 접속
2. **빈 스프레드시트** 생성
3. 스프레드시트 이름: `Hugreen_창호_DB`

### 1.2 시트 1: 제품 정보 (products)

**시트 이름 변경**: 하단 탭 이름을 `products`로 변경

**헤더 (1행)**:
```
product_id | product_name | category | description
```

**샘플 데이터**:
```
product_id          | product_name                        | category    | description
auto-ventilation    | 침실용 창+발코니 이중창+거실 이중창   | 이중창      | 자동 환기 시스템이 내장된 고급 이중창
sliding-door        | 복도 창+거실 가벽 슬라이딩             | 슬라이딩    | 공간 활용도가 높은 슬라이딩 도어
double-window       | 안방+거실+발코니 이중창+발코니         | 이중창      | 단열 성능이 우수한 기본 이중창
folding-door        | 거실용 폴딩도어 스마트발코니           | 폴딩도어    | 개방감이 뛰어난 폴딩 도어
```

**CSV 파일 가져오기 (선택)**:
1. `docs/products_db_sample.csv` 파일 열기
2. 내용 복사
3. Google Sheets에서 **파일 > 가져오기 > 업로드 > 붙여넣기**

### 1.3 시트 2: 가격 정보 (prices)

**새 시트 추가**: 하단 `+` 버튼 클릭하여 시트 추가, 이름을 `prices`로 변경

**헤더 (1행)**:
```
product_id | width_min | width_max | height_min | height_max | price
```

**샘플 데이터**:
```
product_id          | width_min | width_max | height_min | height_max | price
auto-ventilation    | 500       | 1500      | 500        | 1200       | 800000
auto-ventilation    | 1501      | 2500      | 500        | 1200       | 1200000
auto-ventilation    | 2501      | 3500      | 500        | 1200       | 1600000
...
```

**CSV 파일 가져오기 (선택)**:
1. `docs/price_db_sample.csv` 파일 열기
2. 내용 복사
3. Google Sheets의 `prices` 시트에서 **파일 > 가져오기 > 업로드 > 붙여넣기**

### 1.4 스프레드시트 공개 설정

**중요**: API 키 방식을 사용하려면 스프레드시트를 공개로 설정해야 합니다.

1. 우측 상단 **공유** 버튼 클릭
2. **일반 액세스** 섹션에서 **제한됨** → **링크가 있는 모든 사용자** 선택
3. 권한: **뷰어** (읽기 전용)
4. **완료** 클릭

### 1.5 스프레드시트 ID 복사

브라우저 주소창에서 스프레드시트 ID를 복사합니다.

```
https://docs.google.com/spreadsheets/d/[여기가 SPREADSHEET_ID]/edit
```

예시:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                      ↑
                        이 부분이 SPREADSHEET_ID입니다
```

**복사한 ID 저장**: 메모장에 저장해두세요.

---

## 2. Google Cloud Console에서 API 키 생성

### 2.1 Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 2.2 새 프로젝트 생성

1. 상단 프로젝트 선택 드롭다운 클릭
2. **새 프로젝트** 클릭
3. 프로젝트 이름: `Hugreen-Window-Estimator`
4. **만들기** 클릭
5. 프로젝트가 생성되면 해당 프로젝트로 전환

### 2.3 Google Sheets API 활성화

1. 좌측 메뉴 **API 및 서비스 > 라이브러리** 클릭
2. 검색창에 `Google Sheets API` 입력
3. **Google Sheets API** 선택
4. **사용** 버튼 클릭

### 2.4 API 키 생성

1. 좌측 메뉴 **API 및 서비스 > 사용자 인증 정보** 클릭
2. 상단 **+ 사용자 인증 정보 만들기** 클릭
3. **API 키** 선택
4. API 키가 생성됨 → **복사** 버튼 클릭하여 클립보드에 복사
5. **키 제한** 클릭 (보안 강화)

### 2.5 API 키 제한 설정 (권장)

**애플리케이션 제한사항**:
- **HTTP 리퍼러** 선택
- 웹사이트 제한사항 추가:
  ```
  http://localhost:8000/*
  https://yourdomain.com/*
  ```

**API 제한사항**:
- **키 제한** 선택
- **Google Sheets API** 체크
- **저장** 클릭

**복사한 API 키 저장**: 메모장에 저장해두세요.

---

## 3. config.js 설정

### 3.1 config.js 파일 열기

```bash
code /Users/zart/Documents/창호/config.js
```

### 3.2 설정 값 입력

```javascript
const GOOGLE_SHEETS_CONFIG = {
    // 1단계에서 복사한 API 키
    API_KEY: 'AIzaSyD...[복사한 API 키 입력]',

    // 2단계에서 복사한 스프레드시트 ID
    SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',

    // 시트 이름 (변경하지 않았으면 그대로 사용)
    SHEETS: {
        PRODUCTS: 'products',
        PRICES: 'prices'
    }
};
```

### 3.3 저장

`Cmd + S` (Mac) 또는 `Ctrl + S` (Windows)

---

## 4. 테스트 및 검증

### 4.1 로컬 서버 실행

```bash
cd /Users/zart/Documents/창호
python3 -m http.server 8000
```

### 4.2 브라우저에서 확인

```
http://localhost:8000/direct-sync.html
```

### 4.3 개발자 도구 확인

1. **F12** 키를 눌러 개발자 도구 열기
2. **Console** 탭 선택
3. 다음 메시지 확인:
   ```
   데이터 로드 완료: { products: Array(4), priceTable: Array(28) }
   ```

### 4.4 API 오류 확인

만약 다음과 같은 오류가 발생하면:

**오류 1: API 키가 잘못됨**
```
HTTP error! status: 400
```
→ config.js의 API_KEY를 다시 확인

**오류 2: 스프레드시트 ID가 잘못됨**
```
HTTP error! status: 404
```
→ config.js의 SPREADSHEET_ID를 다시 확인

**오류 3: 스프레드시트가 비공개**
```
HTTP error! status: 403
```
→ Google Sheets 공유 설정을 "링크가 있는 모든 사용자"로 변경

**오류 4: 시트 이름이 잘못됨**
```
Unable to parse range: ...
```
→ 시트 이름이 정확히 `products`와 `prices`인지 확인

---

## 5. 문제 해결

### 5.1 데이터가 로드되지 않음

**확인 사항**:
1. 브라우저 콘솔에서 네트워크 오류 확인
2. API 키와 스프레드시트 ID가 올바른지 확인
3. Google Sheets가 공개로 설정되어 있는지 확인
4. Google Sheets API가 활성화되어 있는지 확인

**해결 방법**:
- 브라우저 캐시 삭제 후 재시도
- API 키를 새로 생성하여 교체
- 스프레드시트 공유 설정 재확인

### 5.2 일부 데이터만 로드됨

**확인 사항**:
1. CSV 헤더가 정확히 일치하는지 확인
2. 데이터에 빈 행이나 빈 셀이 없는지 확인
3. 데이터 타입이 올바른지 확인 (숫자 필드에 텍스트가 들어가지 않았는지)

**해결 방법**:
- Google Sheets에서 데이터 정렬 및 필터링
- 빈 행 삭제
- 숫자 필드를 숫자 형식으로 변환

### 5.3 폴백 데이터 사용 중

콘솔에 다음 메시지가 표시되면:
```
데이터 로드 실패, 기본 데이터 사용
```

이는 Google Sheets API 연결이 실패하여 하드코딩된 기본 데이터를 사용 중임을 의미합니다.

**해결 방법**:
1. 네트워크 연결 확인
2. API 키 및 스프레드시트 ID 재확인
3. 브라우저 개발자 도구에서 정확한 오류 메시지 확인

---

## 6. 데이터 업데이트 방법

### 6.1 제품 추가

1. Google Sheets의 `products` 시트 열기
2. 마지막 행에 새 제품 정보 입력
3. 웹사이트 새로고침 (데이터가 자동으로 업데이트됨)

### 6.2 가격 변경

1. Google Sheets의 `prices` 시트 열기
2. 해당 행의 `price` 열 값 수정
3. 웹사이트 새로고침

### 6.3 실시간 반영

Google Sheets API는 캐싱되지 않으므로, 스프레드시트를 수정하면 웹사이트 새로고침 시 즉시 반영됩니다.

---

## 7. 보안 고지

### 7.1 API 키 보호

- **절대 GitHub에 업로드하지 마세요**: `.gitignore`에 `config.js` 추가
- **환경 변수 사용 권장**: 프로덕션 환경에서는 환경 변수로 관리

### 7.2 .gitignore 설정

`.gitignore` 파일에 추가:
```
config.js
```

### 7.3 config.js.example 생성

```javascript
// config.js.example
const GOOGLE_SHEETS_CONFIG = {
    API_KEY: 'YOUR_API_KEY_HERE',
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
    SHEETS: {
        PRODUCTS: 'products',
        PRICES: 'prices'
    }
};
```

팀원들은 `config.js.example`을 복사하여 `config.js`로 이름을 변경하고 자신의 API 키를 입력합니다.

---

## 8. 추가 기능

### 8.1 데이터 검증

`config.js`에 데이터 검증 함수가 포함되어 있습니다:
- 제품 ID 중복 확인
- 가격 범위 유효성 검사
- 필수 필드 누락 확인

### 8.2 오류 처리

API 연결 실패 시 자동으로 기본 데이터를 사용하여 서비스 중단을 방지합니다.

---

## 9. 참고 자료

- [Google Sheets API 문서](https://developers.google.com/sheets/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 키 관리 가이드](https://cloud.google.com/docs/authentication/api-keys)

---

## 완료!

이제 Hugreen 창호 견적 시스템이 Google Sheets를 통해 제품 및 가격 데이터를 동적으로 관리합니다. 🎉

데이터를 수정하려면 Google Sheets만 업데이트하면 되며, 코드 변경 없이 즉시 반영됩니다.
