/*
 * 대산 시공 사례 목록 — cases.html 이 이 목록을 읽어 카드와 상세를 만든다.
 * 사례를 추가할 때는 아래 '대산 사례 양식'을 복사해 맨 위에 붙이고 칸을 채운다. 위에 있을수록 먼저 보인다.
 *
 * 칸 설명 (비워 두면 화면에 나오지 않는다)
 *   id        주소 뒤에 붙는 이름. 영문·숫자·하이픈. 예: 'jamsil-ricenz-2026'  → cases.html#jamsil-ricenz-2026
 *   source    'daesan' = 대산 시공·납품 현장, 'lx' = LX 공식 시공 사례 (대산 현장이 아님을 화면에 표시)
 *   draft     true 면 '자료 준비 중' 표시 (사진·내용을 아직 받지 못한 현장)
 *   title     카드 제목. 예: '확장 거실 발코니창 전체 교체'
 *   place     현장 이름. 동·호수는 쓰지 않는다
 *   size      평형. 예: '34평'
 *   siteType  '아파트' · '빌라/연립' · '단독주택' · '상가' 중 하나 (필터로 쓰인다)
 *   products  제품 종류 목록. 예: ['발코니창', '분합창']
 *   models    모델명 목록. 예: ['F-265', 'F-230W']
 *   scope     작업 범위. 예: '거실·안방 발코니창, 주방 분합창'
 *   role      대산이 맡은 일. 예: '창호 납품·실측, 타일·도기 자재 함께 공급'
 *   period    공정 기간. 예: '실측부터 설치까지 3주'
 *   partner   함께한 업체(게시 동의를 받은 경우만). LX 사례는 원 시공업체
 *   summary   사례 설명 2~3문장
 *   note      '이런 현장이라면' 상담 관점 1~2문장
 *   photos    사진 목록. kind: 'after'(시공 후) · 'before'(시공 전) · 'detail'(디테일). 첫 사진이 카드 표지
 *             사진은 가로 1000px 이하 JPG로 줄여 media/cases/ 에 넣는다 (README 참고)
 *   sourceUrl 원문 주소 (LX 사례)
 *   region    지역. 예: '서울 송파'
 *   ref       대산 사례에 붙이는 '완성되면 이런 모습' LX 공식 사례 id (이 현장 사진이 아님을 표시)
 *   logPlace  아래 '납품 현장 기록'의 현장 이름. 같으면 기록에 '사진 보기' 링크가 붙는다
 *   사진은 build_daesan_photos.py 가 시공사진 폴더에서 골라 줄여 넣는다
 *
 * 대산 사례 양식 ↓
 * {
 *   id: '', source: 'daesan', title: '', place: '', size: '', siteType: '아파트',
 *   products: [], models: [], scope: '', role: '', period: '', partner: '',
 *   summary: '', note: '',
 *   photos: [ { src: 'media/cases/파일이름.jpg', kind: 'after', alt: '' } ]
 * },
 */
window.DAESAN_CASES = [
  // ---------- 대산 현장: 사진을 받으면 위 양식으로 여기에 추가 ----------
  // (사진 없는 납품 기록은 엑셀에서 자동으로 만든 supply-log.js 가 '납품 현장 기록'으로 보여 준다)
  {
    id: 'ds-ricenz-209', source: 'daesan', title: '한강 야경을 그대로 담은 거실 창', place: '잠실 리센츠', region: '서울 송파', siteType: '아파트',
    scope: '거실 발코니 창, 방 창', role: '창호 공급', period: '2025년 11~12월 시공', ref: 'case-7699', logPlace: '잠실 리센츠',
    summary: '한강을 마주한 고층 세대의 창호를 교체했습니다. 설치를 마친 밤, 새 창 너머로 한강과 도심 야경이 넓게 들어옵니다.',
    note: '전망이 좋은 고층은 창을 나누는 선이 적을수록 시야가 시원합니다. 창 크기와 짝 수, 여닫는 방향을 현장에서 함께 정합니다.',
    photos: [
      { src: 'media/cases/ds-ricenz-209-0.jpg', kind: 'after', alt: '잠실 리센츠 시공 후 창' },
      { src: 'media/cases/ds-ricenz-209-1.jpg', kind: 'detail', alt: '잠실 리센츠 창호 시공 현장' },
      { src: 'media/cases/ds-ricenz-209-2.jpg', kind: 'detail', alt: '잠실 리센츠 창호 시공 현장' },
      { src: 'media/cases/ds-ricenz-209-3.jpg', kind: 'detail', alt: '잠실 리센츠 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-seoripul', source: 'daesan', title: '숲이 창 가득 들어오는 집', place: '방배 서리풀 e편한세상', region: '서울 서초', siteType: '아파트',
    scope: '거실·방 창, 욕실 창', role: '창호 공급', period: '2026년 6~7월 시공', ref: 'case-6384', logPlace: '방배 서리풀 e편한세상',
    summary: '창밖이 숲으로 둘러싸인 세대입니다. 창호를 바꾸자 방마다 초록 풍경이 액자처럼 담깁니다.',
    note: '녹지를 마주한 창은 열어 두는 시간이 많습니다. 방충망과 손잡이 위치, 환기 방식을 함께 확인합니다.',
    photos: [
      { src: 'media/cases/ds-seoripul-0.jpg', kind: 'after', alt: '방배 서리풀 e편한세상 시공 후 창' },
      { src: 'media/cases/ds-seoripul-1.jpg', kind: 'detail', alt: '방배 서리풀 e편한세상 창호 시공 현장' },
      { src: 'media/cases/ds-seoripul-2.jpg', kind: 'detail', alt: '방배 서리풀 e편한세상 창호 시공 현장' },
      { src: 'media/cases/ds-seoripul-3.jpg', kind: 'detail', alt: '방배 서리풀 e편한세상 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-bisan', source: 'daesan', title: '살던 집 그대로, 창만 새로', place: '비산 롯데캐슬', region: '경기 안양', siteType: '아파트',
    scope: '거실 발코니 창, 방·주방 창', role: '창호 공급', period: '2026년 10월 시공', ref: 'case-6024',
    summary: '가구와 살림이 있는 상태에서 창호를 교체한 현장입니다. 거실과 방, 주방 창까지 바꾼 뒤 바로 생활을 이어 갑니다.',
    note: '살면서 바꾸는 집은 가구 이동과 보양, 작업 시간을 미리 맞추는 것이 중요합니다. 교체할 창과 일정을 함께 정리합니다.',
    photos: [
      { src: 'media/cases/ds-bisan-0.jpg', kind: 'after', alt: '비산 롯데캐슬 시공 후 창' },
      { src: 'media/cases/ds-bisan-1.jpg', kind: 'detail', alt: '비산 롯데캐슬 창호 시공 현장' },
      { src: 'media/cases/ds-bisan-2.jpg', kind: 'detail', alt: '비산 롯데캐슬 창호 시공 현장' },
      { src: 'media/cases/ds-bisan-3.jpg', kind: 'detail', alt: '비산 롯데캐슬 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-sangam', source: 'daesan', title: '노을과 숲을 들인 거실 창', place: '상암 월드컵파크', region: '서울 마포', siteType: '아파트',
    scope: '거실 발코니 창, 방 창', role: '창호 공급', period: '2026년 9월 시공', ref: 'case-6281', logPlace: '상암 월드컵파크',
    summary: '숲과 하늘이 함께 보이는 세대입니다. 새 창으로 바꾸니 해 질 무렵 풍경이 거실 가득 들어옵니다.',
    note: '서향·남서향 거실은 햇빛과 열기를 함께 생각해야 합니다. 유리 사양과 창 구성을 현장 방향에 맞춰 검토합니다.',
    photos: [
      { src: 'media/cases/ds-sangam-0.jpg', kind: 'after', alt: '상암 월드컵파크 시공 후 창' },
      { src: 'media/cases/ds-sangam-1.jpg', kind: 'detail', alt: '상암 월드컵파크 창호 시공 현장' },
      { src: 'media/cases/ds-sangam-2.jpg', kind: 'detail', alt: '상암 월드컵파크 창호 시공 현장' },
      { src: 'media/cases/ds-sangam-3.jpg', kind: 'detail', alt: '상암 월드컵파크 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-artheal', source: 'daesan', title: '산자락 풍경을 넓게 담은 거실', place: '방배 래미안아트힐', region: '서울 서초', siteType: '아파트',
    scope: '거실 발코니 창, 방 창', role: '창호 공급', period: '2026년 4월 시공', ref: 'case-8203', logPlace: '방배 래미안아트힐',
    summary: '산과 도로가 내려다보이는 세대의 창을 교체했습니다. 넓은 거실 창으로 봄 풍경이 시원하게 들어옵니다.',
    note: '큰길에 가까운 세대는 소음도 함께 살펴야 합니다. 창의 구성과 유리를 현장 여건에 맞춰 고릅니다.',
    photos: [
      { src: 'media/cases/ds-artheal-0.jpg', kind: 'after', alt: '방배 래미안아트힐 시공 후 창' },
      { src: 'media/cases/ds-artheal-1.jpg', kind: 'detail', alt: '방배 래미안아트힐 창호 시공 현장' },
      { src: 'media/cases/ds-artheal-2.jpg', kind: 'detail', alt: '방배 래미안아트힐 창호 시공 현장' },
      { src: 'media/cases/ds-artheal-3.jpg', kind: 'detail', alt: '방배 래미안아트힐 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-els', source: 'daesan', title: '도심 전망을 시원하게', place: '잠실 엘스', region: '서울 송파', siteType: '아파트',
    scope: '거실·방 창, 욕실 창', role: '창호 공급', period: '2026년 3월 시공', ref: 'case-8149', logPlace: '잠실 엘스',
    summary: '도심 빌딩이 펼쳐지는 고층 세대입니다. 거실과 방 창을 바꿔 전망을 더 밝고 깔끔하게 담았습니다.',
    note: '도심 고층은 바람과 소음, 전망을 함께 고려합니다. 창 크기와 개폐 방식을 방마다 나누어 확인합니다.',
    photos: [
      { src: 'media/cases/ds-els-0.jpg', kind: 'after', alt: '잠실 엘스 시공 후 창' },
      { src: 'media/cases/ds-els-1.jpg', kind: 'detail', alt: '잠실 엘스 창호 시공 현장' },
      { src: 'media/cases/ds-els-2.jpg', kind: 'detail', alt: '잠실 엘스 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-hyunjin', source: 'daesan', title: '거실부터 방까지 집 전체 창 교체', place: '여주 현진에버빌', region: '경기 여주', siteType: '아파트',
    scope: '거실 발코니 창, 방·주방 창', role: '창호 공급', period: '2026년 9월 시공', ref: 'case-6384', logPlace: '여주 현진에버빌',
    summary: '거실 큰 창부터 방과 주방 창까지 한 번에 바꾼 현장입니다. 집 안 어디서나 밝은 바깥 풍경이 들어옵니다.',
    note: '집 전체 교체는 창마다 크기와 용도가 달라 견적 항목이 많습니다. 실측 때 창별로 정리해 한 번에 안내합니다.',
    photos: [
      { src: 'media/cases/ds-hyunjin-0.jpg', kind: 'after', alt: '여주 현진에버빌 시공 후 창' },
      { src: 'media/cases/ds-hyunjin-1.jpg', kind: 'detail', alt: '여주 현진에버빌 창호 시공 현장' },
      { src: 'media/cases/ds-hyunjin-2.jpg', kind: 'detail', alt: '여주 현진에버빌 창호 시공 현장' },
      { src: 'media/cases/ds-hyunjin-3.jpg', kind: 'detail', alt: '여주 현진에버빌 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-hongje', source: 'daesan', title: '발코니와 방 창을 함께', place: '홍제 한양', region: '서울 서대문', siteType: '아파트',
    scope: '발코니 창, 방 창, 다용도실 창', role: '창호 공급', period: '2026년 9월 시공', ref: 'case-6281', logPlace: '홍제 한양',
    summary: '발코니와 방, 다용도실 창을 함께 교체했습니다. 오래된 창을 걷어 내니 방이 한결 밝아졌습니다.',
    note: '발코니 창과 안쪽 창을 함께 바꾸면 단열 효과를 더 크게 볼 수 있습니다. 어느 창을 먼저 바꿀지 함께 정합니다.',
    photos: [
      { src: 'media/cases/ds-hongje-0.jpg', kind: 'after', alt: '홍제 한양 시공 후 창' },
      { src: 'media/cases/ds-hongje-1.jpg', kind: 'detail', alt: '홍제 한양 창호 시공 현장' },
      { src: 'media/cases/ds-hongje-2.jpg', kind: 'detail', alt: '홍제 한양 창호 시공 현장' },
      { src: 'media/cases/ds-hongje-3.jpg', kind: 'detail', alt: '홍제 한양 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-namyangju', source: 'daesan', title: '탁 트인 시내 전망의 새 창', place: '남양주 한신', region: '경기 남양주', siteType: '아파트',
    scope: '발코니 창, 방 창', role: '창호 공급', period: '2025년 11월 시공', ref: 'case-7699', logPlace: '남양주 한신',
    summary: '시내와 산 능선이 보이는 세대입니다. 발코니와 방 창을 바꿔 전망을 넓게 열었습니다.',
    note: '꺾인 발코니처럼 창이 여러 면에 있는 현장은 면마다 크기와 여닫는 방향을 나누어 확인합니다.',
    photos: [
      { src: 'media/cases/ds-namyangju-0.jpg', kind: 'after', alt: '남양주 한신 시공 후 창' },
      { src: 'media/cases/ds-namyangju-1.jpg', kind: 'detail', alt: '남양주 한신 창호 시공 현장' },
      { src: 'media/cases/ds-namyangju-2.jpg', kind: 'detail', alt: '남양주 한신 창호 시공 현장' },
      { src: 'media/cases/ds-namyangju-3.jpg', kind: 'detail', alt: '남양주 한신 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-gwangmyeong', source: 'daesan', title: '단지 풍경이 밝게 들어오는 거실', place: '광명 KBS우성', region: '경기 광명', siteType: '아파트',
    scope: '거실·방 창, 욕실 문', role: '창호 공급', period: '2026년 2월 시공', ref: 'case-8203', logPlace: '광명 KBS우성',
    summary: '거실과 방 창, 욕실 문까지 함께 바꾼 현장입니다. 인테리어 공사 중에 창호를 먼저 설치했습니다.',
    note: '인테리어와 함께 진행하는 현장은 창호 설치 시점을 공정표에 맞추는 것이 중요합니다. 일정에 맞춰 공급을 조율합니다.',
    photos: [
      { src: 'media/cases/ds-gwangmyeong-0.jpg', kind: 'after', alt: '광명 KBS우성 시공 후 창' },
      { src: 'media/cases/ds-gwangmyeong-1.jpg', kind: 'detail', alt: '광명 KBS우성 창호 시공 현장' },
      { src: 'media/cases/ds-gwangmyeong-2.jpg', kind: 'detail', alt: '광명 KBS우성 창호 시공 현장' },
      { src: 'media/cases/ds-gwangmyeong-3.jpg', kind: 'detail', alt: '광명 KBS우성 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-ricenz-243', source: 'daesan', title: '같은 단지에서 이어진 교체', place: '잠실 리센츠', region: '서울 송파', siteType: '아파트',
    scope: '거실 발코니 창, 방 창', role: '창호 공급', period: '2026년 1월 시공', ref: 'case-7699',
    summary: '앞서 시공한 잠실 리센츠의 다른 세대입니다. 같은 단지에서 다시 맡겨 주신 현장으로, 거실과 방 창을 교체했습니다.',
    note: '같은 단지는 창 크기와 구조가 비슷해 실측과 일정 준비가 빠릅니다. 이전 현장 자료를 참고해 안내합니다.',
    photos: [
      { src: 'media/cases/ds-ricenz-243-0.jpg', kind: 'after', alt: '잠실 리센츠 시공 후 창' },
      { src: 'media/cases/ds-ricenz-243-1.jpg', kind: 'detail', alt: '잠실 리센츠 창호 시공 현장' },
      { src: 'media/cases/ds-ricenz-243-2.jpg', kind: 'detail', alt: '잠실 리센츠 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-eunhasu', source: 'daesan', title: '리모델링과 함께한 창호', place: '안양 은하수 신성', region: '경기 안양', siteType: '아파트',
    scope: '거실·방 창', role: '창호 공급', period: '2026년 5~6월 시공', ref: 'case-8149', logPlace: '안양 은하수 신성',
    summary: '집 전체 리모델링 중에 창호를 함께 바꾼 현장입니다. 철거가 끝난 뒤 새 창을 먼저 세웠습니다.',
    note: '전체 리모델링은 철거 후 창호를 먼저 설치하면 이후 공정이 수월합니다. 공사 순서에 맞춰 일정을 잡습니다.',
    photos: [
      { src: 'media/cases/ds-eunhasu-0.jpg', kind: 'after', alt: '안양 은하수 신성 시공 후 창' },
      { src: 'media/cases/ds-eunhasu-1.jpg', kind: 'detail', alt: '안양 은하수 신성 창호 시공 현장' }
    ]
  },
  {
    id: 'ds-seosan', source: 'daesan', title: '연립주택 발코니 창 교체', place: '서산 한신연립', region: '충남 서산', siteType: '빌라/연립',
    scope: '발코니 문, 방 창', role: '창호 공급', period: '2026년 8월 시공', ref: 'case-6024', logPlace: '한신빌라',
    summary: '오래된 연립주택의 발코니 문과 방 창을 교체했습니다. 지방 현장도 같은 방식으로 공급합니다.',
    note: '빌라·연립은 창 크기가 세대마다 달라 실측이 꼭 필요합니다. 현장 위치를 알려 주시면 가능한 일정을 안내합니다.',
    photos: [
      { src: 'media/cases/ds-seosan-0.jpg', kind: 'after', alt: '서산 한신연립 시공 후 창' },
      { src: 'media/cases/ds-seosan-1.jpg', kind: 'detail', alt: '서산 한신연립 창호 시공 현장' }
    ]
  },

  // ---------- LX Z:IN 공식 시공 사례 (출처: lxzin.com, 원 시공업체 표시) ----------
  {
    id: 'case-6384', source: 'lx', title: '공원 풍경을 담은 거실', place: '서대문 독립문극동', size: '32평', siteType: '아파트',
    products: ['LX Z:IN 뷰프레임'], scope: '발코니 확장 거실 창', partner: '행복한집짓기',
    summary: '발코니를 확장한 거실에 뷰프레임을 적용한 사례입니다. 창밖 녹지와 밝은 실내가 자연스럽게 이어집니다.',
    note: '확장부 창의 크기와 개폐 방식, 외부와 맞닿는 부분의 단열 계획을 함께 검토합니다.',
    photos: [
      { src: 'media/cases/lx-6384-cover-0.jpg', kind: 'after', alt: '서대문 독립문극동 확장 거실 창' },
      { src: 'media/cases/lx-6384-after-1.jpg', kind: 'after', alt: '서대문 독립문극동 시공 후' },
      { src: 'media/cases/lx-6384-after-2.jpg', kind: 'after', alt: '서대문 독립문극동 시공 후' },
      { src: 'media/cases/lx-6384-before-3.jpg', kind: 'before', alt: '서대문 독립문극동 시공 전' }
    ],
    sourceUrl: 'https://www.lxzin.com/styling/expert-style/detail/6384'
  },
  {
    id: 'case-8149', source: 'lx', title: '소음 고민에서 시작한 창호 교체', place: '안양 한승미메이드', size: '34평', siteType: '아파트',
    products: ['LX Z:IN 뷰프레임'], scope: '거실 창 교체', partner: '누아디자인',
    summary: '외부 기찻길 소음을 고려해 뷰프레임으로 교체한 사례입니다. 거실 창의 구성과 창가 마감을 볼 수 있습니다.',
    note: '창이 향하는 방향과 주변 소음, 기존 창의 상태를 확인한 뒤 유리와 창호 구성을 검토합니다.',
    photos: [
      { src: 'media/cases/lx-8149-cover-0.jpg', kind: 'after', alt: '안양 한승미메이드 거실 창' },
      { src: 'media/cases/lx-8149-after-1.jpg', kind: 'after', alt: '안양 한승미메이드 시공 후' },
      { src: 'media/cases/lx-8149-after-2.jpg', kind: 'after', alt: '안양 한승미메이드 시공 후' }
    ],
    sourceUrl: 'https://www.lxzin.com/styling/expert-style/detail/8149'
  },
  {
    id: 'case-6281', source: 'lx', title: '햇살이 머무는 확장부', place: '구리 토평동 e편한세상', size: '33평', siteType: '아파트',
    products: ['LX Z:IN 뷰프레임(베젤리스)'], scope: '거실 확장부 창', partner: '주식회사 조우',
    summary: '거실 확장부에 베젤리스 디자인의 뷰프레임을 적용한 사례입니다. 창가 식탁과 넓은 유리면이 만드는 공간감을 볼 수 있습니다.',
    note: '베젤리스 디자인의 적용 모델과 창 크기, 유리 사양을 현장 조건에 맞춰 확인합니다.',
    photos: [
      { src: 'media/cases/lx-6281-cover-0.jpg', kind: 'after', alt: '구리 토평동 e편한세상 확장부 창' },
      { src: 'media/cases/lx-6281-after-1.jpg', kind: 'after', alt: '구리 토평동 e편한세상 시공 후' },
      { src: 'media/cases/lx-6281-after-2.jpg', kind: 'after', alt: '구리 토평동 e편한세상 시공 후' },
      { src: 'media/cases/lx-6281-before-3.jpg', kind: 'before', alt: '구리 토평동 e편한세상 시공 전' }
    ],
    sourceUrl: 'https://www.lxzin.com/styling/expert-style/detail/6281'
  },
  {
    id: 'case-6024', source: 'lx', title: '창가에 더한 작은 휴식 공간', place: '해운대 좌동 삼성아파트', size: '32평', siteType: '아파트',
    products: ['LX Z:IN 뷰프레임'], scope: '확장 거실 창', partner: '재경디자인',
    summary: '확장한 거실에 뷰프레임을 적용하고 창가 쪽에 홈 바를 구성한 사례입니다. 창 주변의 사용 동선과 채광을 볼 수 있습니다.',
    note: '창 앞 가구 배치와 손잡이 위치, 환기 동선을 함께 확인합니다. 자동환기는 별도 옵션으로 공급 가능 여부를 확인합니다.',
    photos: [
      { src: 'media/cases/lx-6024-cover-0.jpg', kind: 'after', alt: '해운대 좌동 삼성아파트 창가' },
      { src: 'media/cases/lx-6024-after-1.jpg', kind: 'after', alt: '해운대 좌동 삼성아파트 시공 후' },
      { src: 'media/cases/lx-6024-after-2.jpg', kind: 'after', alt: '해운대 좌동 삼성아파트 시공 후' },
      { src: 'media/cases/lx-6024-before-3.jpg', kind: 'before', alt: '해운대 좌동 삼성아파트 시공 전' }
    ],
    sourceUrl: 'https://www.lxzin.com/styling/expert-style/detail/6024'
  },
  {
    id: 'case-8203', source: 'lx', title: '간결한 창으로 정돈한 거실', place: '동대문 장안현대홈타운3차', size: '30평', siteType: '아파트',
    products: ['LX Z:IN 뷰프레임'], scope: '발코니 확장, 거실 창', partner: '돋움디자인',
    summary: '발코니 확장과 뷰프레임 시공을 함께 진행한 사례입니다. 밝은 거실과 슬림한 창을 전후 사진으로 비교할 수 있습니다.',
    note: '확장 여부와 실내 마감 계획에 맞춰 창의 구성과 연결부를 검토합니다.',
    photos: [
      { src: 'media/cases/lx-8203-cover-0.jpg', kind: 'after', alt: '동대문 장안현대홈타운3차 거실 창' },
      { src: 'media/cases/lx-8203-after-1.jpg', kind: 'after', alt: '동대문 장안현대홈타운3차 시공 후' },
      { src: 'media/cases/lx-8203-after-2.jpg', kind: 'after', alt: '동대문 장안현대홈타운3차 시공 후' },
      { src: 'media/cases/lx-8203-before-3.jpg', kind: 'before', alt: '동대문 장안현대홈타운3차 시공 전' }
    ],
    sourceUrl: 'https://www.lxzin.com/styling/expert-style/detail/8203'
  },
  {
    id: 'case-7699', source: 'lx', title: '넓은 공간을 잇는 창', place: '부산 우동 동경위너스', size: '65평', siteType: '빌라/연립',
    products: ['LX Z:IN 뷰프레임'], scope: '여러 면의 거실 창', partner: '재경디자인',
    summary: '여러 방향의 창과 슬림한 창호 디자인이 돋보이는 사례입니다. 넓은 거실에서 창의 배치가 만드는 시야를 볼 수 있습니다.',
    note: '창이 여러 면에 있는 현장은 면별 크기와 방향, 여닫는 위치를 나누어 확인합니다.',
    photos: [
      { src: 'media/cases/lx-7699-cover-0.jpg', kind: 'after', alt: '부산 우동 동경위너스 거실 창' },
      { src: 'media/cases/lx-7699-after-1.jpg', kind: 'after', alt: '부산 우동 동경위너스 시공 후' },
      { src: 'media/cases/lx-7699-after-2.jpg', kind: 'after', alt: '부산 우동 동경위너스 시공 후' },
      { src: 'media/cases/lx-7699-before-3.jpg', kind: 'before', alt: '부산 우동 동경위너스 시공 전' }
    ],
    sourceUrl: 'https://www.lxzin.com/styling/expert-style/detail/7699'
  }
];
