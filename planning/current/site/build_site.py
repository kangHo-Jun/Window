"""
시안(mockups/) → 공개용 사이트(public/) 만들기. 시안 파일은 고치지 않는다.

실행:
    python3 build_site.py
올리기 (Firebase):
    npx -y firebase-tools deploy --only hosting --project gen-lang-client-0916174774

하는 일
- window-intro-prototype.html → index.html. 인트로는 INTRO 안으로 고정하고 A~L 선택·다시 보기 버튼을 뺀다.
- 아직 자료가 없는 자리('자료 준비 중', 내부 확인 메모)는 화면에서 뺀다.
- cases.html, privacy.html, data/, 필요한 사진·영상만 복사한다.
- 검색 등록용 머리 정보(canonical·링크 미리보기·회사 정보), robots.txt, sitemap.xml, media/og.jpg 를 만든다.
시안을 고친 뒤 다시 실행하면 된다. 바꿀 곳을 못 찾으면 멈추고 알려 준다.
"""
import datetime
import pathlib
import re
import shutil

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent / 'mockups'
OUT = HERE / 'public'
INTRO = 'O'          # 창틀 액자 안 (영상은 M안의 선명 보정본 intro_m 을 쓴다)
INTRO_MEDIA = 'intro_m'
SITE = 'https://win.daesan.ai'
GOOGLE_VERIFY = ''   # 구글 서치 콘솔 'HTML 태그' 확인 값(content)
NAVER_VERIFY = '369f06160be208f6a51c44947a2247c0c6a9b1ea'    # 네이버 서치어드바이저 'HTML 태그' 확인 값(content)
DESC = 'LX 창호는 대산 창호 전담 직원이 상담합니다. 현장 자재까지 한곳에서 함께 준비하세요.'


def sub(text, pattern, repl, count=1, flags=re.S):
    new, n = re.subn(pattern, repl, text, flags=flags)
    if n != count:
        raise SystemExit(f'바꿀 곳을 {n}곳 찾음(기대 {count}곳): {pattern[:70]}')
    return new


def seo_head(path, title, desc):
    """검색·링크 미리보기용 머리 정보"""
    url = SITE + path
    tags = [f'<link rel="canonical" href="{url}">',
            f'<meta property="og:type" content="website">',
            f'<meta property="og:site_name" content="대산">',
            f'<meta property="og:title" content="{title}">',
            f'<meta property="og:description" content="{desc}">',
            f'<meta property="og:url" content="{url}">',
            f'<meta property="og:image" content="{SITE}/media/og.jpg">',
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">',
            '<meta name="twitter:card" content="summary_large_image">']
    if GOOGLE_VERIFY:
        tags.append(f'<meta name="google-site-verification" content="{GOOGLE_VERIFY}">')
    if NAVER_VERIFY:
        tags.append(f'<meta name="naver-site-verification" content="{NAVER_VERIFY}">')
    return '\n'.join(tags) + '\n'


ORG_LD = '''<script type="application/ld+json">
{"@context":"https://schema.org","@type":"HomeAndConstructionBusiness","name":"(주)대산","url":"https://win.daesan.ai/",
"description":"LX 창호 상담·공급과 현장 자재(목자재·단열재·도어·석고보드)를 함께 준비하는 건축자재 회사",
"telephone":"+82-31-388-3833","faxNumber":"+82-31-429-0447","email":"sales@daesan.biz","logo":"https://win.daesan.ai/media/og.jpg",
"address":{"@type":"PostalAddress","streetAddress":"관악대로 279","addressLocality":"안양시 동안구","addressRegion":"경기도","addressCountry":"KR"},
"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:00","closes":"17:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"08:00","closes":"12:00"}]}
</script>
'''


def build_index():
    s = (SRC / 'window-intro-prototype.html').read_text(encoding='utf-8')
    s = sub(s, r'<title>.*?</title>', '<title>대산 | LX 창호 상담·시공 사례</title>\n'
            f'<meta name="description" content="{DESC}">\n' + seo_head('/', '대산 | LX 창호 상담·시공 사례', DESC) + ORG_LD.rstrip('\n'))
    # 인트로: L안 고정, 시안용 버튼 제거
    s = sub(s, r"setVariant\(\(params\.get\('v'\) \|\| 'A'\)\.toUpperCase\(\)\);", f"setVariant('{INTRO}');")
    s = sub(s, r'<div class="switcher" id="switcher".*?</div>\n', '')
    s = sub(s, r'<button class="replay" id="replay"[^>]*>.*?</button>\n', '')
    s = sub(s, r"document\.getElementById\('replay'\)\.addEventListener", "document.getElementById('replay')?.addEventListener")
    s = sub(s, r'\s*<span class="photo-label">.*?</span>', '')
    s = sub(s, r"document\.querySelector\('\.photo-label'\)\.hidden = (true|false);", '', count=2)
    # 시공 사례: 시안의 대산 현장 카드 3개를 그대로 쓴다
    s = s.replace('<a class="btn btn-line btn-sm" href="cases.html">시공 사례 전체 보기 →</a>',
                  '<a class="btn btn-primary" href="cases.html">시공 사례 보기 →</a>')
    # 남은 '자료 준비 중' 표시와 내부 메모
    s = sub(s, r'\s*<span class="tbd">대상·제외 품목.*?</span>', '')
    s = sub(s, r' <span class="tbd">(비용·지역·일정 조건|전달 방식·소요 기간)</span>', '', count=2)
    s = sub(s, r'\s*<p class="note">시공·A/S 문의 창구는.*?</p>', '')
    # 상담 창구: 전화는 실제 번호, 카카오톡은 채널이 생기면 넣는다
    s = sub(s, r'<div class="channel"><b>전화 상담</b><span class="tbd">.*?</span></div>',
            '<a class="channel" href="tel:031-388-3833"><b>전화 상담</b><span>031-388-3833 · 평일 08~17시, 토 08~12시</span></a>')
    s = sub(s, r'\s*<div class="channel"><b>카카오톡 상담</b><span class="tbd">.*?</span></div>', '')
    s = sub(s, r'전화와 카카오톡으로 문의하거나', '전화로 문의하거나')
    s = sub(s, r'전화·카카오톡 상담은 그대로', '전화 상담은 그대로')
    s = s.replace('전화·카카오톡으로 문의해 주세요', '전화(031-388-3833)로 문의해 주세요')
    s = sub(s, r'<br>카카오톡 상담 · <a href="privacy.html"', '<br><a href="privacy.html"')
    s = sub(s, r'\s*<!-- 초안\(2026-10-26\).*?-->', '')
    if 'class="tbd"' in s or 'class="ph"' in s or '카카오톡' in s:
        raise SystemExit('index.html 에 자료 준비 중 표시나 카카오톡 문구가 남아 있습니다')
    return s


def build_cases():
    s = (SRC / 'cases.html').read_text(encoding='utf-8')
    d = '대산이 LX 창호를 공급한 실제 현장 사진과 현장 정보, LX Z:IN 공식 시공 사례를 함께 볼 수 있습니다.'
    s = sub(s, r'(<title>.*?</title>)', r'\1\n' + f'<meta name="description" content="{d}">\n' + seo_head('/cases.html', '시공 사례 | 대산', d).rstrip('\n'))
    return s.replace('window-intro-prototype.html', './')


def build_privacy():
    s = (SRC / 'privacy.html').read_text(encoding='utf-8')
    s = sub(s, r'\s*<p class="note">시안 초안입니다.*?</p>', '')
    s = s.replace('window-intro-prototype.html', './')
    s = sub(s, r'(<title>.*?</title>)', r'\1\n' + f'<link rel="canonical" href="{SITE}/privacy.html">')
    if 'class="tbd"' in s:
        raise SystemExit('privacy.html 에 빈칸이 남아 있습니다')
    return s


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / 'media').mkdir(parents=True)
    (OUT / 'index.html').write_text(build_index(), encoding='utf-8')
    (OUT / 'cases.html').write_text(build_cases(), encoding='utf-8')
    (OUT / 'privacy.html').write_text(build_privacy(), encoding='utf-8')
    shutil.copytree(SRC / 'data', OUT / 'data', ignore=shutil.ignore_patterns('*.py', '*.md'))
    shutil.copytree(SRC / 'media' / 'cases', OUT / 'media' / 'cases')
    shutil.copytree(SRC / 'media' / 'lx', OUT / 'media' / 'lx')
    name = INTRO_MEDIA
    for f in (SRC / 'media').glob(f'{name}_*'):
        shutil.copy2(f, OUT / 'media' / f.name)
    # 검색 사이트 소유 확인 파일(site/static/)은 그대로 복사
    for f in (HERE / 'static').glob('*'):
        shutil.copy2(f, OUT / f.name)
    # 검색 등록: 링크 미리보기 그림, robots.txt, sitemap.xml
    from PIL import Image
    im = Image.open(SRC / 'media' / f'{name}_last.jpg').convert('RGB')
    w, h = im.size
    ch = round(w * 630 / 1200)
    im.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).resize((1200, 630)).save(OUT / 'media' / 'og.jpg', quality=85)
    (OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n', encoding='utf-8')
    today = datetime.date.today().isoformat()
    urls = ''.join(f'  <url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod></url>\n' for u in ('/', '/cases.html', '/privacy.html'))
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n', encoding='utf-8')
    files = [p for p in OUT.rglob('*') if p.is_file()]
    print(f'public/: 파일 {len(files)}개, {sum(p.stat().st_size for p in files) / 1e6:.1f}MB')


if __name__ == '__main__':
    main()
