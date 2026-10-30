# I안 고급화 — Blender 렌더 작업 폴더

I안(아파트 한 세대 3D에서 창호 조립 → 거실 창으로 랜딩 진입)을 Blender 사전 렌더 영상으로 만들기 위한 작업 폴더다.

## 파일

| 경로 | 내용 |
|---|---|
| `build_apartment.py` | 아파트 한 세대·창호·가구·빛·카메라를 코드로 짓고 정지 화면을 렌더 |
| `tools/fetch_polyhaven.py` | Poly Haven 자료 내려받기 |
| `test_render.py`, `test/` | Blender 설치 직후 엔진·GPU 시험 |
| `renders/` | 미리보기 렌더 / `renders/final/` 분위기 정지 화면 |
| `assets/polyhaven/` | 내려받은 자료 (아래 출처) |

## 실행

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P build_apartment.py -- --shot aerial --engine cycles --samples 160 --res 1600x900
```

`--shot`: `aerial`(내려다본 전체) · `window`(거실 창 앞) · `open`(열린 창 너머) · `anim`(조립·카메라 이동 5초 영상, `--frames 100-150`으로 일부만 렌더 가능)

영상 묶기: `ffmpeg -framerate 30 -i renders/<폴더>/anim_<engine>/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 out.mp4`
`--engine`: `eevee`(빠른 미리보기) · `cycles`(고품질, Metal GPU)
`--style`: `i`(기본: 차콜 2짝, 도심 해 질 녘) · `k`(샴페인 3짝, 호수·산 자연 전망, 맑은 오후)

## 자료 출처 (모두 CC0, Poly Haven)

- 하늘: `sunset_jhbcentral`(I: 고층 도심 해 질 녘), `cayley_lookout`(K: 호수·산), `montorfano`(K 후보), `shanghai_riverside`, `kloofendal_48d_partly_cloudy_puresky`
- 재질: `laminate_floor_02`
- 가구: `modern_coffee_table_01`, `mid_century_lounge_chair`, `side_table_01`, `potted_plant_01`, `potted_plant_04`, `ceramic_vase_02`
- 소파·침대·책상·창호는 직접 모델링. 창호는 LX Z:IN 시스템창호 목록의 형태(차콜 슬림 리프트&슬라이드, 흰색 틸트&턴)만 참고했고 LX 사진·로고·도면은 쓰지 않았다.

## 남은 과제

- 창밖 풍경: `sunset_jhbcentral`로 고층 느낌은 냈지만 해외의 오래된 도심이다. 한국 고급 아파트 전망으로는 실제 전망 사진(권한 확인된 것)이 더 낫다. 방향·높이는 `--yaw`(기본 345)·`--tilt`(기본 -20)로 조정.
- PC 가로 고품질 영상 완료: `renders/final_anim/intro_i_1280x720.mp4`·`.webm`. 휴대폰 세로판, 웹 인트로 연결이 남음.
- 렌더할 때 출력을 `| head`로 자르지 말 것(파이프가 닫히면 Blender가 중간에 종료됨). 로그 파일로 돌린다.
