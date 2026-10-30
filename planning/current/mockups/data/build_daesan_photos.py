"""
'LX창호 업체현장별 시공사진' 폴더에서 고른 사진 → media/cases/ds-<사례id>-<n>.jpg

실행:
    python3 build_daesan_photos.py

PICK 의 번호는 현장 폴더 안 사진을 경로 순으로 정렬했을 때의 1부터 시작하는 순번이다.
첫 번호가 카드 표지. 업체 이름·동호수가 들어간 폴더 이름은 파일 이름에 남기지 않는다.
사진에 사람·개인 물건이 비치는 것은 고를 때 뺐다.
"""
import pathlib
import unicodedata
from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parents[4] / 'LX창호 업체현장별 시공사진'   # /Users/zart/Projects/창호/
OUT = HERE.parent / 'media' / 'cases'

# 사례 id: (현장 폴더를 찾는 글자, 고른 순번, 아래쪽 잘라낼 비율)
PICK = {
    'ds-ricenz-209':  ('잠실리센츠 209동', [4, 6, 13, 14], 0),
    'ds-seoripul':    ('방배서리풀', [9, 2, 6, 7], 0),
    'ds-bisan':       ('비산롯데캐슬', [1, 9, 10, 3], 0),
    'ds-sangam':      ('상암월드컵파크', [4, 2, 7, 3], 0),
    'ds-artheal':     ('래미안아트힐', [3, 4, 1, 7], 0),
    'ds-els':         ('잠실엘스', [5, 1, 3], 0),
    'ds-hyunjin':     ('현진에버빌', [8, 6, 7, 3], 0),
    'ds-hongje':      ('홍제한양', [5, 3, 8, 1], 0),
    'ds-namyangju':   ('한신 201동', [9, 2, 1, 5], 0),
    'ds-gwangmyeong': ('KSB우성', [7, 6, 4, 3], 0),
    'ds-ricenz-243':  ('잠실리센츠 243동', [8, 1, 3], .18),   # 아래쪽에 손가락이 찍혀 잘라 낸다
    'ds-eunhasu':     ('은하수신성', [7, 1], 0),
    'ds-seosan':      ('한신연립주택', [5, 3], 0),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    folders = [p for p in SRC.iterdir() if p.is_dir()]
    for cid, (key, nums, crop) in PICK.items():
        hit = [p for p in folders if key in unicodedata.normalize('NFC', p.name)]   # 맥 파일 이름은 자모가 나뉘어 저장된다
        if len(hit) != 1:
            raise SystemExit(f'{cid}: "{key}" 폴더를 {len(hit)}개 찾음')
        files = sorted(hit[0].rglob('*.jpg'))
        for i, n in enumerate(nums):
            im = ImageOps.exif_transpose(Image.open(files[n - 1])).convert('RGB')
            if crop:
                im = im.crop((0, 0, im.width, round(im.height * (1 - crop))))
            im.thumbnail((1200, 1200) if i == 0 else (900, 900))
            im.save(OUT / f'{cid}-{i}.jpg', quality=78, optimize=True, progressive=True)
        print(cid, len(nums))


if __name__ == '__main__':
    main()
