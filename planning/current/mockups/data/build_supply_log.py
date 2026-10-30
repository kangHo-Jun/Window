"""
'대산 기존 창호 성과정리.xlsx' → data/supply-log.js (사례 페이지 '납품 현장 기록')

실행 (엑셀을 고친 뒤 다시 돌리면 된다):
    python3 build_supply_log.py

화면에 내보내는 것: 시기(월), 현장 표시 이름, 지역, 현장 유형, 발주 횟수, 업체 기호(A, B…)
내보내지 않는 것: 금액, 업체 이름, 비고(개인 메모)
업체 기호는 '같은 업체가 여러 현장을 맡겼다'를 세기 위한 것이다. 이름과 연결하는 표는 만들지 않는다.
"""
import json
import pathlib
import openpyxl

HERE = pathlib.Path(__file__).resolve().parent
XLSX = HERE.parents[4] / '대산 기존 창호 성과정리.xlsx'   # /Users/zart/Projects/창호/
OUT = HERE / 'supply-log.js'

# 엑셀 현장명 → (화면 이름, 지역, 현장 유형, 작업 메모)
# 회사·가게 이름이 그대로인 현장은 일반 이름으로 바꾼다.
# 지역·유형은 엑셀 현장명에 드러난 것만 쓴다. 알 수 없으면 지역은 '' (화면에 안 나옴), 유형은 '기타'.
SITES = {
    '새댁김치':               ('업무 시설 현장',             '', '상업·업무 시설', ''),
    '남양주 한신':            ('남양주 한신',                '경기 남양주', '아파트', ''),
    '잠실 리센츠':            ('잠실 리센츠',                '서울 송파', '아파트', ''),
    '수원 광교 이편한세상':     ('수원 광교 e편한세상',         '경기 수원', '아파트', ''),
    '대명철강 신축':           ('서산 신축 건물',             '충남 서산', '신축', ''),
    '서산집수리':             ('서산 주택 집수리',            '충남 서산', '단독주택', ''),
    '충주 신니면 현장직송':     ('충주 신니면 현장',            '충북 충주', '기타', '현장 직송'),
    '광명 KBS우성':           ('광명 KBS우성',               '경기 광명', '아파트', ''),
    '둔촌 푸르지오':           ('둔촌 푸르지오',              '서울 강동', '아파트', ''),
    '잠실 엘스':              ('잠실 엘스',                 '서울 송파', '아파트', ''),
    '서초':                  ('서초 현장',                 '서울 서초', '기타', '터닝도어 납품'),
    '용인 푸른마을 푸르지오':    ('용인 푸른마을 푸르지오',        '경기 용인', '아파트', ''),
    '가양 우성':              ('가양 우성',                 '서울 강서', '아파트', ''),
    '서초 방배 래미안아트힐':    ('방배 래미안아트힐',           '서울 서초', '아파트', ''),
    '해미천막사':             ('서산 해미 상가',             '충남 서산', '상업·업무 시설', '납품'),
    '새마을집수리':            ('주택 집수리',               '', '단독주택', ''),
    '안양 은하수 신성':        ('안양 은하수 신성',            '경기 안양', '아파트', ''),
    '부천 소사성당':           ('부천 소사성당',              '경기 부천', '종교 시설', ''),
    '중랑구 신내동성':         ('신내 동성',                 '서울 중랑', '아파트', ''),
    '과천 래미안에코팰리스':     ('과천 래미안에코팰리스',        '경기 과천', '아파트', ''),
    '서산 삼성아파트':         ('서산 삼성아파트',             '충남 서산', '아파트', ''),
    '방배 서리풀이편한':        ('방배 서리풀 e편한세상',        '서울 서초', '아파트', ''),
    '지음공간':              ('인테리어 현장',               '', '기타', ''),
    '한신빌라':              ('한신빌라',                  '', '빌라/연립', ''),
    '여주 현진에버빌':         ('여주 현진에버빌',             '경기 여주', '아파트', ''),
    '충남 서산시 센스빌':       ('서산 센스빌',               '충남 서산', '기타', ''),
    '의왕 청계사':            ('의왕 청계사',               '경기 의왕', '종교 시설', ''),
    '홍제 한양':              ('홍제 한양',                 '서울 서대문', '아파트', ''),
    '충남 신세계하우징':        ('충남 현장',                 '충남', '기타', ''),
    '상암 월드컵파크':          ('상암 월드컵파크',            '서울 마포', '아파트', ''),
}


def main():
    ws = openpyxl.load_workbook(XLSX, data_only=True).active
    rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if r[1] and r[2] and r[3]]
    codes, sites = {}, {}
    for _, date, partner, site, *_ in rows:
        code = codes.setdefault(partner, chr(ord('A') + len(codes)))
        if site not in SITES:
            raise SystemExit(f'SITES 표에 없는 현장: {site} — 화면 이름·지역·유형을 정해 표에 추가하세요')
        s = sites.setdefault(site, {'first': date, 'last': date, 'orders': 0, 'partners': set()})
        s['first'], s['last'] = min(s['first'], date), max(s['last'], date)
        s['orders'] += 1
        s['partners'].add(code)

    log = []
    for site, s in sorted(sites.items(), key=lambda kv: kv[1]['last'], reverse=True):
        name, region, kind, work = SITES[site]
        log.append({'month': s['last'].strftime('%Y.%m'), 'place': name, 'region': region, 'siteType': kind,
                    'work': work, 'orders': s['orders'], 'by': ''.join(sorted(s['partners']))})

    first, last = min(r[1] for r in rows), max(r[1] for r in rows)
    head = ('// 자동 생성 파일 — 직접 고치지 말고 build_supply_log.py 를 고쳐 다시 실행한다\n'
            f'// 원본: 대산 기존 창호 성과정리.xlsx ({len(rows)}건). 금액·업체 이름·비고는 넣지 않는다\n')
    body = 'window.DAESAN_SUPPLY_LOG = ' + json.dumps(
        {'from': first.strftime('%Y.%m'), 'to': last.strftime('%Y.%m'), 'sites': log},
        ensure_ascii=False, indent=1) + ';\n'
    OUT.write_text(head + body, encoding='utf-8')
    print(f'{OUT.name}: 현장 {len(log)}곳, 발주 {len(rows)}건, 업체 {len(codes)}곳')


if __name__ == '__main__':
    main()
