# Poly Haven(CC0) 자료 내려받기. 하늘(HDRI)·재질·가구 모델을 assets/polyhaven/<id>/ 에 저장한다.
# 실행: python3 -I tools/fetch_polyhaven.py
import json, os, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'polyhaven')
UA = {'User-Agent': 'daesan-intro-prototype'}

HDRIS = {'shanghai_riverside': '2k', 'kloofendal_48d_partly_cloudy_puresky': '2k',
         'sunset_jhbcentral': '4k',   # 도심 옥상 해 질 녘: 고층 전망용
         'montorfano': '4k', 'cayley_lookout': '4k'}   # 호수·산 자연 전망 후보 (K안)
TEXTURES = {'laminate_floor_02': '2k', 'white_plaster_02': '1k'}
MODELS = ['sofa_03', 'modern_coffee_table_01', 'mid_century_lounge_chair', 'side_table_01',
          'potted_plant_01', 'potted_plant_04', 'ceramic_vase_02', 'decorative_book_set_01']


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r:
        return json.load(r)


def save(url, path):
    if os.path.exists(path):
        return 0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(path, 'wb') as f:
        data = r.read()
        f.write(data)
    return len(data)


total = 0
for hid, res in HDRIS.items():
    f = get_json(f'https://api.polyhaven.com/files/{hid}')['hdri'][res]['hdr']
    total += save(f['url'], os.path.join(ROOT, hid, f'{hid}_{res}.hdr'))

for tid, res in TEXTURES.items():
    files = get_json(f'https://api.polyhaven.com/files/{tid}')
    for key in ['Diffuse', 'nor_gl', 'Rough']:
        if key in files:
            f = files[key][res]['jpg']
            total += save(f['url'], os.path.join(ROOT, tid, os.path.basename(f['url'])))

for mid in MODELS:
    files = get_json(f'https://api.polyhaven.com/files/{mid}')
    if 'gltf' not in files:   # glTF가 없는 모델은 건너뛴다 (.blend는 스크립트가 들어 있을 수 있어 쓰지 않음)
        print('skip (no glTF):', mid)
        continue
    g = files['gltf']['1k']['gltf']
    base = os.path.join(ROOT, mid)
    total += save(g['url'], os.path.join(base, os.path.basename(g['url'])))
    for rel, inc in g.get('include', {}).items():   # 텍스처 등 glTF가 참조하는 파일
        total += save(inc['url'], os.path.join(base, rel))

print(f'downloaded {total / 1e6:.1f} MB into {ROOT}')
