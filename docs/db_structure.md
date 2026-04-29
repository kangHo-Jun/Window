# Google Sheets DB 구조 설계서

작성일: 2026-04-23  
적용 시스템: 창호 자동 견적 시스템 (Next.js)  
스프레드시트명: `Hugreen_창호_DB`

---

## 목차
1. [시트 1 — 제품/가격 DB](#시트-1--제품가격-db)
2. [시트 2 — 평형별 표준 창호 구성](#시트-2--평형별-표준-창호-구성)
3. [시트 3 — 마진/시공비 설정](#시트-3--마진시공비-설정)
4. [시트 탭 설정 요약](#시트-탭-설정-요약)
5. [API 연동 설계](#api-연동-설계)
6. [데이터 입력 가이드](#데이터-입력-가이드)

---

## 시트 1 — 제품/가격 DB

**시트 탭명**: `products`

### 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `brand` | TEXT | ✅ | 브랜드명 (`LX지인` / `KCC글라스` / `기타`) |
| `product_id` | TEXT | ✅ | 고유 ID (영문+숫자, 하이픈 허용) |
| `product_name` | TEXT | ✅ | 제품 시리즈명 |
| `window_type` | TEXT | ✅ | 창호 유형 (`이중창` / `슬라이딩` / `폴딩도어` / `시스템창호`) |
| `width_min` | NUMBER | ✅ | 적용 가로 최솟값 (mm) |
| `width_max` | NUMBER | ✅ | 적용 가로 최댓값 (mm) |
| `height_min` | NUMBER | ✅ | 적용 세로 최솟값 (mm) |
| `height_max` | NUMBER | ✅ | 적용 세로 최댓값 (mm) |
| `unit_price` | NUMBER | ✅ | 단가 (원, VAT 별도) |
| `energy_grade` | TEXT | ✅ | 에너지 소비효율 등급 (`1등급` ~ `5등급`) |
| `noise_grade` | TEXT | ✅ | 소음 등급 (`T1` / `T2` / `T3`) |
| `as_warranty` | NUMBER | ✅ | A/S 보증기간 (년) |
| `description` | TEXT | - | 제품 특징 설명 (1~2줄) |
| `is_recommend` | BOOLEAN | - | 추천 여부 (`TRUE` / `FALSE`) |

### 샘플 데이터

#### LX지인 뷰프레임 시리즈

```
brand    | product_id         | product_name      | window_type | width_min | width_max | height_min | height_max | unit_price | energy_grade | noise_grade | as_warranty | description                        | is_recommend
---------|--------------------|--------------------|-------------|-----------|-----------|------------|------------|------------|--------------|-------------|-------------|-------------------------------------|-------------
LX지인   | lx-vf70-s         | 뷰프레임70 슬라이딩 | 슬라이딩    | 500       | 1500      | 500        | 1200       | 750000     | 2등급        | T2          | 5           | 기본형 슬라이딩. 발코니/주방 적용    | FALSE
LX지인   | lx-vf70-s         | 뷰프레임70 슬라이딩 | 슬라이딩    | 1501      | 2500      | 500        | 1200       | 1100000    | 2등급        | T2          | 5           | 기본형 슬라이딩. 발코니/주방 적용    | FALSE
LX지인   | lx-vf70-s         | 뷰프레임70 슬라이딩 | 슬라이딩    | 2501      | 4000      | 500        | 1200       | 1500000    | 2등급        | T2          | 5           | 기본형 슬라이딩. 발코니/주방 적용    | FALSE
LX지인   | lx-vf80-d         | 뷰프레임80 이중창  | 이중창      | 500       | 1500      | 500        | 1400       | 900000     | 1등급        | T2          | 7           | 단열 강화형. 거실/안방 표준 적용     | TRUE
LX지인   | lx-vf80-d         | 뷰프레임80 이중창  | 이중창      | 1501      | 2500      | 500        | 1400       | 1350000    | 1등급        | T2          | 7           | 단열 강화형. 거실/안방 표준 적용     | TRUE
LX지인   | lx-vf80-d         | 뷰프레임80 이중창  | 이중창      | 2501      | 4000      | 500        | 1400       | 1800000    | 1등급        | T2          | 7           | 단열 강화형. 거실/안방 표준 적용     | TRUE
LX지인   | lx-vf90-d         | 뷰프레임90 이중창  | 이중창      | 500       | 1500      | 500        | 1600       | 1100000    | 1등급        | T3          | 10          | 프리미엄 단열+방음. 침실 최적        | TRUE
LX지인   | lx-vf90-d         | 뷰프레임90 이중창  | 이중창      | 1501      | 2500      | 500        | 1600       | 1600000    | 1등급        | T3          | 10          | 프리미엄 단열+방음. 침실 최적        | TRUE
LX지인   | lx-vf90-d         | 뷰프레임90 이중창  | 이중창      | 2501      | 4000      | 500        | 1600       | 2200000    | 1등급        | T3          | 10          | 프리미엄 단열+방음. 침실 최적        | TRUE
LX지인   | lx-vf100-fd       | 뷰프레임100 폴딩   | 폴딩도어    | 1500      | 3000      | 2000       | 2800       | 2800000    | 1등급        | T2          | 10          | 발코니 확장형 폴딩도어. 개방감 극대  | FALSE
LX지인   | lx-vf100-fd       | 뷰프레임100 폴딩   | 폴딩도어    | 3001      | 5000      | 2000       | 2800       | 4200000    | 1등급        | T2          | 10          | 발코니 확장형 폴딩도어. 개방감 극대  | FALSE
LX지인   | lx-smartbalcony   | 스마트발코니       | 시스템창호  | 1500      | 3000      | 1200       | 2400       | 2200000    | 1등급        | T3          | 10          | 발코니 터닝도어 + 이중창 패키지      | TRUE
LX지인   | lx-smartbalcony   | 스마트발코니       | 시스템창호  | 3001      | 5000      | 1200       | 2400       | 3300000    | 1등급        | T3          | 10          | 발코니 터닝도어 + 이중창 패키지      | TRUE
```

#### KCC글라스 시리즈 (시장가 기준)

```
brand     | product_id        | product_name        | window_type | width_min | width_max | height_min | height_max | unit_price | energy_grade | noise_grade | as_warranty | description                      | is_recommend
----------|-------------------|--------------------|-------------|-----------|-----------|------------|------------|------------|--------------|-------------|-------------|-----------------------------------|-------------
KCC글라스  | kcc-ecosave-s     | 에코세이브 슬라이딩  | 슬라이딩    | 500       | 1500      | 500        | 1200       | 580000     | 2등급        | T1          | 3           | 보급형 슬라이딩. 가성비 중심        | FALSE
KCC글라스  | kcc-ecosave-s     | 에코세이브 슬라이딩  | 슬라이딩    | 1501      | 2500      | 500        | 1200       | 850000     | 2등급        | T1          | 3           | 보급형 슬라이딩. 가성비 중심        | FALSE
KCC글라스  | kcc-ecosave-s     | 에코세이브 슬라이딩  | 슬라이딩    | 2501      | 4000      | 500        | 1200       | 1150000    | 2등급        | T1          | 3           | 보급형 슬라이딩. 가성비 중심        | FALSE
KCC글라스  | kcc-supersave-d   | 수퍼세이브 이중창   | 이중창      | 500       | 1500      | 500        | 1400       | 720000     | 2등급        | T2          | 5           | 중급 이중창. 단열 기본 충족         | FALSE
KCC글라스  | kcc-supersave-d   | 수퍼세이브 이중창   | 이중창      | 1501      | 2500      | 500        | 1400       | 1050000    | 2등급        | T2          | 5           | 중급 이중창. 단열 기본 충족         | FALSE
KCC글라스  | kcc-supersave-d   | 수퍼세이브 이중창   | 이중창      | 2501      | 4000      | 500        | 1400       | 1400000    | 2등급        | T2          | 5           | 중급 이중창. 단열 기본 충족         | FALSE
KCC글라스  | kcc-premium-d     | 프리미엄 이중창     | 이중창      | 500       | 1500      | 500        | 1600       | 870000     | 1등급        | T2          | 5           | KCC 최상위. 단열 1등급             | FALSE
KCC글라스  | kcc-premium-d     | 프리미엄 이중창     | 이중창      | 1501      | 2500      | 500        | 1600       | 1280000    | 1등급        | T2          | 5           | KCC 최상위. 단열 1등급             | FALSE
KCC글라스  | kcc-premium-d     | 프리미엄 이중창     | 이중창      | 2501      | 4000      | 500        | 1600       | 1700000    | 1등급        | T2          | 5           | KCC 최상위. 단열 1등급             | FALSE
```

#### 기타 (시장 평균가)

```
brand | product_id       | product_name     | window_type | width_min | width_max | height_min | height_max | unit_price | energy_grade | noise_grade | as_warranty | description                   | is_recommend
------|------------------|--------------------|-------------|-----------|-----------|------------|------------|------------|--------------|-------------|-------------|--------------------------------|-------------
기타  | etc-standard-s   | 일반 슬라이딩      | 슬라이딩    | 500       | 1500      | 500        | 1200       | 420000     | 3등급        | T1          | 2           | 저가형 슬라이딩. 임시 교체용    | FALSE
기타  | etc-standard-s   | 일반 슬라이딩      | 슬라이딩    | 1501      | 2500      | 500        | 1200       | 620000     | 3등급        | T1          | 2           | 저가형 슬라이딩. 임시 교체용    | FALSE
기타  | etc-standard-s   | 일반 슬라이딩      | 슬라이딩    | 2501      | 4000      | 500        | 1200       | 840000     | 3등급        | T1          | 2           | 저가형 슬라이딩. 임시 교체용    | FALSE
기타  | etc-standard-d   | 일반 이중창        | 이중창      | 500       | 1500      | 500        | 1400       | 520000     | 3등급        | T1          | 2           | 저가형 이중창. 단열 기본 수준   | FALSE
기타  | etc-standard-d   | 일반 이중창        | 이중창      | 1501      | 2500      | 500        | 1400       | 760000     | 3등급        | T1          | 2           | 저가형 이중창. 단열 기본 수준   | FALSE
기타  | etc-standard-d   | 일반 이중창        | 이중창      | 2501      | 4000      | 500        | 1400       | 1020000    | 3등급        | T1          | 2           | 저가형 이중창. 단열 기본 수준   | FALSE
```

---

## 시트 2 — 평형별 표준 창호 구성

**시트 탭명**: `configurations`

### 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `config_id` | TEXT | ✅ | 구성 고유 ID (예: `apt-30-exp-livingroom`) |
| `pyeong` | NUMBER | ✅ | 평형 (`20` / `30` / `40` / `50`) |
| `expansion` | TEXT | ✅ | 확장 여부 (`확장형` / `비확장형`) |
| `space_name` | TEXT | ✅ | 공간명 (예: `거실`, `안방`, `침실1`) |
| `space_order` | NUMBER | ✅ | 공간 표시 순서 (1부터 시작) |
| `window_type` | TEXT | ✅ | 표준 창호 유형 (`이중창` / `슬라이딩` / `폴딩도어` / `시스템창호`) |
| `std_width` | NUMBER | ✅ | 표준 가로 사이즈 (mm) |
| `std_height` | NUMBER | ✅ | 표준 세로 사이즈 (mm) |
| `quantity` | NUMBER | ✅ | 기본 수량 (짝) |
| `recommend_product_id` | TEXT | - | 기본 추천 제품 ID (products 시트 참조) |
| `note` | TEXT | - | 공간별 특이사항 |

### 샘플 데이터

#### 20평 비확장형

```
config_id                  | pyeong | expansion | space_name | space_order | window_type | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|------------|-------------|-------------|-----------|------------|----------|----------------------|-----
apt-20-nexp-livingroom     | 20     | 비확장형   | 거실        | 1           | 슬라이딩    | 2400      | 2000       | 1        | lx-vf80-d            | 발코니 비확장 시 거실 외창
apt-20-nexp-masterroom     | 20     | 비확장형   | 안방        | 2           | 이중창      | 1600      | 1400       | 1        | lx-vf90-d            |
apt-20-nexp-bedroom1       | 20     | 비확장형   | 침실1       | 3           | 이중창      | 1200      | 1200       | 1        | lx-vf80-d            |
apt-20-nexp-bedroom2       | 20     | 비확장형   | 침실2       | 4           | 이중창      | 1200      | 1200       | 1        | lx-vf80-d            |
apt-20-nexp-kitchen        | 20     | 비확장형   | 주방        | 5           | 슬라이딩    | 1800      | 1200       | 1        | lx-vf70-s            |
apt-20-nexp-utility        | 20     | 비확장형   | 다용도실    | 6           | 슬라이딩    | 1200      | 1000       | 1        | lx-vf70-s            |
apt-20-nexp-frontbalcony   | 20     | 비확장형   | 앞발코니    | 7           | 슬라이딩    | 3000      | 1200       | 1        | lx-vf70-s            |
apt-20-nexp-rearbalcony    | 20     | 비확장형   | 뒷발코니    | 8           | 슬라이딩    | 2400      | 1200       | 1        | lx-vf70-s            |
```

#### 20평 확장형

```
config_id                  | pyeong | expansion | space_name  | space_order | window_type  | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|-------------|-------------|--------------|-----------|------------|----------|----------------------|-----
apt-20-exp-livingroom      | 20     | 확장형     | 거실         | 1           | 이중창       | 2800      | 2200       | 1        | lx-vf80-d            | 확장형 거실 외창
apt-20-exp-masterroom      | 20     | 확장형     | 안방         | 2           | 이중창       | 1600      | 1400       | 1        | lx-vf90-d            |
apt-20-exp-bedroom1        | 20     | 확장형     | 침실1        | 3           | 이중창       | 1200      | 1200       | 1        | lx-vf80-d            |
apt-20-exp-bedroom2        | 20     | 확장형     | 침실2        | 4           | 이중창       | 1200      | 1200       | 1        | lx-vf80-d            |
apt-20-exp-kitchen         | 20     | 확장형     | 주방         | 5           | 슬라이딩     | 1800      | 1200       | 1        | lx-vf70-s            |
apt-20-exp-utility         | 20     | 확장형     | 다용도실     | 6           | 슬라이딩     | 1200      | 1000       | 1        | lx-vf70-s            |
apt-20-exp-masterbalcony   | 20     | 확장형     | 안방발코니   | 7           | 시스템창호   | 2400      | 2000       | 1        | lx-smartbalcony      | 터닝도어 연계
apt-20-exp-turningdoor     | 20     | 확장형     | 터닝도어     | 8           | 폴딩도어     | 2400      | 2200       | 1        | lx-vf100-fd          |
```

#### 30평 비확장형

```
config_id                  | pyeong | expansion | space_name | space_order | window_type | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|------------|-------------|-------------|-----------|------------|----------|----------------------|-----
apt-30-nexp-livingroom     | 30     | 비확장형   | 거실        | 1           | 슬라이딩    | 3000      | 2000       | 1        | lx-vf80-d            |
apt-30-nexp-masterroom     | 30     | 비확장형   | 안방        | 2           | 이중창      | 1800      | 1400       | 1        | lx-vf90-d            |
apt-30-nexp-bedroom1       | 30     | 비확장형   | 침실1       | 3           | 이중창      | 1400      | 1200       | 1        | lx-vf80-d            |
apt-30-nexp-bedroom2       | 30     | 비확장형   | 침실2       | 4           | 이중창      | 1400      | 1200       | 1        | lx-vf80-d            |
apt-30-nexp-alpharoom      | 30     | 비확장형   | 알파룸      | 5           | 이중창      | 1200      | 1200       | 1        | lx-vf80-d            |
apt-30-nexp-kitchen        | 30     | 비확장형   | 주방        | 6           | 슬라이딩    | 2000      | 1200       | 1        | lx-vf70-s            |
apt-30-nexp-utility        | 30     | 비확장형   | 다용도실    | 7           | 슬라이딩    | 1400      | 1000       | 1        | lx-vf70-s            |
apt-30-nexp-frontbalcony   | 30     | 비확장형   | 앞발코니    | 8           | 슬라이딩    | 3600      | 1200       | 1        | lx-vf70-s            |
apt-30-nexp-rearbalcony    | 30     | 비확장형   | 뒷발코니    | 9           | 슬라이딩    | 2800      | 1200       | 1        | lx-vf70-s            |
```

#### 30평 확장형

```
config_id                  | pyeong | expansion | space_name  | space_order | window_type  | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|-------------|-------------|--------------|-----------|------------|----------|----------------------|-----
apt-30-exp-livingroom      | 30     | 확장형     | 거실         | 1           | 이중창       | 3400      | 2200       | 1        | lx-vf80-d            |
apt-30-exp-masterroom      | 30     | 확장형     | 안방         | 2           | 이중창       | 1800      | 1400       | 1        | lx-vf90-d            |
apt-30-exp-bedroom1        | 30     | 확장형     | 침실1        | 3           | 이중창       | 1400      | 1200       | 1        | lx-vf80-d            |
apt-30-exp-bedroom2        | 30     | 확장형     | 침실2        | 4           | 이중창       | 1400      | 1200       | 1        | lx-vf80-d            |
apt-30-exp-alpharoom       | 30     | 확장형     | 알파룸       | 5           | 이중창       | 1200      | 1200       | 1        | lx-vf80-d            |
apt-30-exp-kitchen         | 30     | 확장형     | 주방         | 6           | 슬라이딩     | 2000      | 1200       | 1        | lx-vf70-s            |
apt-30-exp-utility         | 30     | 확장형     | 다용도실     | 7           | 슬라이딩     | 1400      | 1000       | 1        | lx-vf70-s            |
apt-30-exp-masterbalcony   | 30     | 확장형     | 안방발코니   | 8           | 시스템창호   | 2800      | 2000       | 1        | lx-smartbalcony      |
apt-30-exp-turningdoor     | 30     | 확장형     | 터닝도어     | 9           | 폴딩도어     | 3000      | 2200       | 1        | lx-vf100-fd          |
```

#### 40평 비확장형

```
config_id                  | pyeong | expansion | space_name    | space_order | window_type | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|---------------|-------------|-------------|-----------|------------|----------|----------------------|-----
apt-40-nexp-livingroom     | 40     | 비확장형   | 거실           | 1           | 슬라이딩    | 3600      | 2200       | 1        | lx-vf80-d            |
apt-40-nexp-masterroom     | 40     | 비확장형   | 안방           | 2           | 이중창      | 2000      | 1600       | 1        | lx-vf90-d            |
apt-40-nexp-bedroom1       | 40     | 비확장형   | 침실1          | 3           | 이중창      | 1600      | 1400       | 1        | lx-vf80-d            |
apt-40-nexp-bedroom2       | 40     | 비확장형   | 침실2          | 4           | 이중창      | 1600      | 1400       | 1        | lx-vf80-d            |
apt-40-nexp-bedroom3       | 40     | 비확장형   | 침실3          | 5           | 이중창      | 1400      | 1200       | 1        | lx-vf80-d            |
apt-40-nexp-kitchen        | 40     | 비확장형   | 주방           | 6           | 슬라이딩    | 2200      | 1200       | 1        | lx-vf70-s            |
apt-40-nexp-utility        | 40     | 비확장형   | 다용도실       | 7           | 슬라이딩    | 1600      | 1000       | 1        | lx-vf70-s            |
apt-40-nexp-dressroom      | 40     | 비확장형   | 드레스룸       | 8           | 이중창      | 1200      | 1200       | 1        | lx-vf80-d            |
apt-40-nexp-balcony        | 40     | 비확장형   | 발코니(전체)   | 9           | 슬라이딩    | 4000      | 1200       | 1        | lx-vf70-s            |
```

#### 40평 확장형

```
config_id                  | pyeong | expansion | space_name    | space_order | window_type  | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|---------------|-------------|--------------|-----------|------------|----------|----------------------|-----
apt-40-exp-livingroom      | 40     | 확장형     | 거실           | 1           | 이중창       | 4000      | 2400       | 1        | lx-vf80-d            |
apt-40-exp-masterroom      | 40     | 확장형     | 안방           | 2           | 이중창       | 2000      | 1600       | 1        | lx-vf90-d            |
apt-40-exp-bedroom1        | 40     | 확장형     | 침실1          | 3           | 이중창       | 1600      | 1400       | 1        | lx-vf80-d            |
apt-40-exp-bedroom2        | 40     | 확장형     | 침실2          | 4           | 이중창       | 1600      | 1400       | 1        | lx-vf80-d            |
apt-40-exp-bedroom3        | 40     | 확장형     | 침실3          | 5           | 이중창       | 1400      | 1200       | 1        | lx-vf80-d            |
apt-40-exp-kitchen         | 40     | 확장형     | 주방           | 6           | 슬라이딩     | 2200      | 1200       | 1        | lx-vf70-s            |
apt-40-exp-utility         | 40     | 확장형     | 다용도실       | 7           | 슬라이딩     | 1600      | 1000       | 1        | lx-vf70-s            |
apt-40-exp-dressroom       | 40     | 확장형     | 드레스룸       | 8           | 이중창       | 1200      | 1200       | 1        | lx-vf80-d            |
apt-40-exp-masterbalcony   | 40     | 확장형     | 안방발코니     | 9           | 시스템창호   | 3200      | 2200       | 1        | lx-smartbalcony      |
apt-40-exp-turningdoor     | 40     | 확장형     | 터닝도어       | 10          | 폴딩도어     | 3600      | 2400       | 1        | lx-vf100-fd          |
```

#### 50평 비확장형

```
config_id                  | pyeong | expansion | space_name | space_order | window_type | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|------------|-------------|-------------|-----------|------------|----------|----------------------|-----
apt-50-nexp-livingroom     | 50     | 비확장형   | 거실        | 1           | 슬라이딩    | 4200      | 2400       | 1        | lx-vf80-d            |
apt-50-nexp-masterroom     | 50     | 비확장형   | 안방        | 2           | 이중창      | 2200      | 1600       | 1        | lx-vf90-d            |
apt-50-nexp-bedroom1       | 50     | 비확장형   | 침실1       | 3           | 이중창      | 1800      | 1400       | 1        | lx-vf80-d            |
apt-50-nexp-bedroom2       | 50     | 비확장형   | 침실2       | 4           | 이중창      | 1800      | 1400       | 1        | lx-vf80-d            |
apt-50-nexp-bedroom3       | 50     | 비확장형   | 침실3       | 5           | 이중창      | 1600      | 1400       | 1        | lx-vf80-d            |
apt-50-nexp-bedroom4       | 50     | 비확장형   | 침실4       | 6           | 이중창      | 1400      | 1200       | 1        | lx-vf80-d            |
apt-50-nexp-kitchen        | 50     | 비확장형   | 주방        | 7           | 슬라이딩    | 2400      | 1200       | 1        | lx-vf70-s            |
apt-50-nexp-utility        | 50     | 비확장형   | 다용도실    | 8           | 슬라이딩    | 1800      | 1000       | 1        | lx-vf70-s            |
apt-50-nexp-dressroom      | 50     | 비확장형   | 드레스룸    | 9           | 이중창      | 1400      | 1200       | 1        | lx-vf80-d            |
apt-50-nexp-study          | 50     | 비확장형   | 서재        | 10          | 이중창      | 1400      | 1200       | 1        | lx-vf80-d            |
apt-50-nexp-balcony        | 50     | 비확장형   | 발코니      | 11          | 슬라이딩    | 5000      | 1200       | 1        | lx-vf70-s            |
```

#### 50평 확장형

```
config_id                  | pyeong | expansion | space_name  | space_order | window_type  | std_width | std_height | quantity | recommend_product_id | note
---------------------------|--------|-----------|-------------|-------------|--------------|-----------|------------|----------|----------------------|-----
apt-50-exp-livingroom      | 50     | 확장형     | 거실         | 1           | 이중창       | 4800      | 2600       | 1        | lx-vf80-d            |
apt-50-exp-masterroom      | 50     | 확장형     | 안방         | 2           | 이중창       | 2200      | 1600       | 1        | lx-vf90-d            |
apt-50-exp-bedroom1        | 50     | 확장형     | 침실1        | 3           | 이중창       | 1800      | 1400       | 1        | lx-vf80-d            |
apt-50-exp-bedroom2        | 50     | 확장형     | 침실2        | 4           | 이중창       | 1800      | 1400       | 1        | lx-vf80-d            |
apt-50-exp-bedroom3        | 50     | 확장형     | 침실3        | 5           | 이중창       | 1600      | 1400       | 1        | lx-vf80-d            |
apt-50-exp-bedroom4        | 50     | 확장형     | 침실4        | 6           | 이중창       | 1400      | 1200       | 1        | lx-vf80-d            |
apt-50-exp-kitchen         | 50     | 확장형     | 주방         | 7           | 슬라이딩     | 2400      | 1200       | 1        | lx-vf70-s            |
apt-50-exp-utility         | 50     | 확장형     | 다용도실     | 8           | 슬라이딩     | 1800      | 1000       | 1        | lx-vf70-s            |
apt-50-exp-dressroom       | 50     | 확장형     | 드레스룸     | 9           | 이중창       | 1400      | 1200       | 1        | lx-vf80-d            |
apt-50-exp-study           | 50     | 확장형     | 서재         | 10          | 이중창       | 1400      | 1200       | 1        | lx-vf80-d            |
apt-50-exp-masterbalcony   | 50     | 확장형     | 안방발코니   | 11          | 시스템창호   | 3600      | 2400       | 1        | lx-smartbalcony      |
apt-50-exp-turningdoor     | 50     | 확장형     | 터닝도어     | 12          | 폴딩도어     | 4200      | 2600       | 1        | lx-vf100-fd          |
```

### configurations 시트 전체 행 수

| 평형 | 비확장형 | 확장형 | 소계 |
|------|---------|--------|------|
| 20평 | 8행 | 8행 | 16행 |
| 30평 | 9행 | 9행 | 18행 |
| 40평 | 9행 | 10행 | 19행 |
| 50평 | 11행 | 12행 | 23행 |
| **합계** | | | **76행** |

---

## 시트 3 — 마진/시공비 설정

**시트 탭명**: `margins`

### 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `brand` | TEXT | ✅ | 브랜드명 (`LX지인` / `KCC글라스` / `기타`) |
| `base_margin_rate` | NUMBER | ✅ | 기본 마진율 (소수점, 예: `0.30` = 30%) |
| `min_margin_rate` | NUMBER | ✅ | 최소 마진율 — 이 이하로 내리면 적자 |
| `max_margin_rate` | NUMBER | ✅ | 최대 마진율 — 경쟁력 상한선 |
| `installation_rate` | NUMBER | ✅ | 시공비율 (제품가 대비, 예: `0.20` = 20%) |
| `install_min_price` | NUMBER | ✅ | 시공비 최솟값 (원) — 소규모 공사 기준 |
| `discount_threshold` | NUMBER | - | 할인 적용 기준 금액 (원) |
| `discount_rate` | NUMBER | - | 할인율 (예: `0.05` = 5%) |
| `note` | TEXT | - | 비고 |

### 샘플 데이터

```
brand    | base_margin_rate | min_margin_rate | max_margin_rate | installation_rate | install_min_price | discount_threshold | discount_rate | note
---------|-----------------|-----------------|-----------------|-------------------|-------------------|--------------------|---------------|-----
LX지인   | 0.30            | 0.20            | 0.40            | 0.20              | 300000            | 5000000            | 0.05          | 500만 이상 시 5% 추가 할인 가능
KCC글라스 | 0.25            | 0.15            | 0.35            | 0.20              | 300000            | 4000000            | 0.03          | 400만 이상 시 3% 할인
기타      | 0.20            | 0.10            | 0.30            | 0.18              | 250000            | 3000000            | 0.00          | 할인 없음
```

### 마진/시공비 계산 공식

```
제품 원가 = unit_price × quantity
마진액    = 제품 원가 × base_margin_rate
시공비    = MAX(제품 원가 × installation_rate, install_min_price)
소계      = 제품 원가 + 마진액
총 견적가 = 소계 + 시공비

-- 대량 할인 적용 시 --
할인 대상 = 소계 ≥ discount_threshold
할인액    = 소계 × discount_rate
최종 견적 = 소계 - 할인액 + 시공비
```

---

## 시트 탭 설정 요약

| 탭 이름 | 행 수 (예상) | 헤더 행 | 데이터 시작 | 비고 |
|---------|------------|---------|------------|------|
| `products` | ~40행 | 1행 | 2행 | 제품/가격 DB |
| `configurations` | ~76행 | 1행 | 2행 | 평형별 표준 구성 |
| `margins` | 3행 | 1행 | 2행 | 마진/시공비 설정 |

**공유 설정**: 링크가 있는 모든 사용자 → 뷰어 (읽기 전용)  
**헤더 행 고정**: 각 시트 1행 고정 (행 고정 설정)  
**헤더 배경색**: `#3b82f6` (파랑) / 흰색 텍스트 — 시각적 구분

---

## API 연동 설계

### 호출 URL 패턴

```
https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{SHEET}!A:Z?key={API_KEY}
```

### 각 시트별 호출

```javascript
// 제품/가격 DB
fetchSheetData('products', 'A:N')

// 평형별 표준 구성
fetchSheetData('configurations', 'A:L')

// 마진/시공비
fetchSheetData('margins', 'A:I')
```

### 파싱 후 데이터 구조 (JavaScript)

```typescript
// products 시트 파싱 결과
type Product = {
  brand: 'LX지인' | 'KCC글라스' | '기타';
  productId: string;
  productName: string;
  windowType: string;
  widthMin: number;
  widthMax: number;
  heightMin: number;
  heightMax: number;
  unitPrice: number;
  energyGrade: string;
  noiseGrade: string;
  asWarranty: number;
  description: string;
  isRecommend: boolean;
};

// configurations 시트 파싱 결과
type Configuration = {
  configId: string;
  pyeong: 20 | 30 | 40 | 50;
  expansion: '확장형' | '비확장형';
  spaceName: string;
  spaceOrder: number;
  windowType: string;
  stdWidth: number;
  stdHeight: number;
  quantity: number;
  recommendProductId: string;
  note: string;
};

// margins 시트 파싱 결과
type Margin = {
  brand: string;
  baseMarginRate: number;
  minMarginRate: number;
  maxMarginRate: number;
  installationRate: number;
  installMinPrice: number;
  discountThreshold: number;
  discountRate: number;
  note: string;
};
```

### 캐싱 전략

```
로드 시점: 앱 초기화 시 1회 (DOMContentLoaded or Next.js getStaticProps)
캐시 TTL:  24시간 (가격 데이터는 자주 바뀌지 않음)
갱신 방법: 수동 새로고침 또는 관리자 API 호출
Fallback:  API 실패 시 하드코딩 기본값 사용 (현 프로토타입 방식 유지)
```

---

## 데이터 입력 가이드

### 우선순위별 입력 순서

```
1단계 (필수):  margins 시트 — 3행, 즉시 입력 가능
2단계 (필수):  products 시트 — LX지인 뷰프레임 시리즈 실단가 확인 후 입력
3단계 (필수):  configurations 시트 — 76행, products 입력 완료 후 작성
4단계 (선택):  KCC/기타 products 데이터 — 시장 조사 후 추가
```

### 실단가 확인 방법

- **LX지인 공식**: LX지인 대리점 B2B 가격표 (지역 영업담당자 요청)
- **KCC 시세**: KCC글라스 대리점 견적 또는 인터넷 시세 조사
- **기타**: 인터넷 최저가 + 20% 여유분 적용

### 주의사항

- `product_id` 는 영문 소문자 + 숫자 + 하이픈만 사용 (공백 금지)
- `unit_price` 는 VAT 제외 금액으로 입력
- `installation_rate` 는 별도 시공비 포함 시 낮게 조정 (기본값: `0.20`)
- 동일 제품의 사이즈별 가격은 `product_id` 동일, 범위만 다른 행으로 추가
- 모든 숫자 셀은 Google Sheets 서식을 **일반(숫자)** 으로 설정 (텍스트 서식 금지)
