# I안 고급화: 아파트 한 세대(안방·작은방·거실)를 천장 없이 짓고, LX 시스템창호 형태의 창과
# Poly Haven(CC0) 가구·재질·하늘로 꾸며 정지 화면을 렌더한다.
# 실행: blender -b -P build_apartment.py -- --shot aerial|window|open|anim [--engine eevee|cycles] [--res 960x540] [--samples 128]
# anim: 조립·카메라 이동 영상(PNG 연속 이미지 → renders/anim_<engine>/)
import bpy, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, 'assets', 'polyhaven')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
opt = {'shot': 'aerial', 'engine': 'eevee', 'res': '960x540', 'samples': '128', 'out': os.path.join(HERE, 'renders'),
       'hdri': 'sunset_jhbcentral', 'yaw': '345', 'tilt': '-20'}   # 창밖: 도심 옥상 해 질 녘(고층 전망)
opt['style'] = 'i'
for i in range(0, len(args) - 1, 2):
    opt[args[i].lstrip('-')] = args[i + 1]
SHOT = opt['shot']
# style k: 거실 창 3짝·샴페인 베이지, 창밖은 호수·산 자연 전망 (사용자 참고 이미지 기준, 2026-10-22)
# style lx: LX 창호 장점(확 트인 뷰·넓은 공간감·고급 디자인) 강조 — 벽 가득 슬림 3짝 창, 밝은 타일·우물천장, 강한 햇빛 (2026-10-22)
STYLE_LX = opt['style'] == 'lx'
STYLE_K = opt['style'] in ('k', 'lx')   # 3짝 샴페인 창 계열
# --view hanriver: 창밖을 직접 지은 한강 뷰로 (city_view.py), --viewvar a|b|c
CITY_VIEW = opt.get('view') == 'hanriver'
if CITY_VIEW and '--hdri' not in args:
    opt['hdri'] = 'kloofendal_48d_partly_cloudy_puresky'
    opt['tilt'] = opt['tilt'] if '--tilt' in args else '0'
if STYLE_K and not CITY_VIEW:
    for k_, v_ in {'hdri': 'cayley_lookout', 'yaw': '0', 'tilt': '-6'}.items():
        if f'--{k_}' not in args:
            opt[k_] = v_

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------- 치수 (미터) ----------------
UW, UD = 11.0, 7.6          # 세대 가로(x)·세로(y). y=0 이 거실 큰 창이 있는 뒷벽(바깥쪽)
H = 2.4                     # 천장고
T, TI = 0.22, 0.12          # 바깥벽·안벽 두께
SLAB = 0.28                 # 바닥 슬래브 두께(단면으로 보임)
LOW = 0.35                  # 앞·오른쪽 바깥벽은 낮게 잘라 안을 보이게
PART_X = 4.2                # 방/거실 경계
PART_Y = 3.6                # 안방/작은방 경계

# 창 자리
WIN_MASTER = dict(wall='back', a=0.9, b=2.9, zs=0.9, zh=2.1)       # 안방
WIN_SMALL = dict(wall='left', a=4.4, b=6.2, zs=0.9, zh=2.1)        # 작은방
WIN_LIVING = dict(wall='back', a=4.9, b=10.4, zs=0.04, zh=2.32)    # 거실 (바닥까지 내려오는 리프트&슬라이드)
if STYLE_LX:   # 거실 벽을 거의 다 채우는 창, 하부 레일은 바닥에 묻힌 듯 낮게 (확 트인 뷰·넓은 공간감)
    WIN_LIVING = dict(wall='back', a=4.55, b=10.8, zs=0.015, zh=2.3)


# ---------------- 재질 ----------------
def principled(name, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, **extra):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    for k, v in extra.items():
        b.inputs[k].default_value = v
    return m


def textured(name, folder, scale, tint=(1, 1, 1), rough_mult=1.0):
    """Poly Haven 재질(색·노멀·거칠기)을 박스 좌표로 입힌다."""
    m = principled(name)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    d = os.path.join(PH, folder)
    files = os.listdir(d)

    def img(key, non_color=False):
        f = next((x for x in files if key in x.lower()), None)
        if not f:
            return None
        n = nt.nodes.new('ShaderNodeTexImage')
        n.image = bpy.data.images.load(os.path.join(d, f))
        n.projection = 'BOX'
        n.projection_blend = 0.2
        if non_color:
            n.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
        return n

    diff = img('diff')
    if diff:
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        mix.inputs[7].default_value = (*tint, 1)
        nt.links.new(diff.outputs['Color'], mix.inputs[6])
        nt.links.new(mix.outputs[2], b.inputs['Base Color'])
    rough = img('rough', True)
    if rough:
        mt = nt.nodes.new('ShaderNodeMath')
        mt.operation = 'MULTIPLY'
        mt.inputs[1].default_value = rough_mult
        nt.links.new(rough.outputs['Color'], mt.inputs[0])
        nt.links.new(mt.outputs[0], b.inputs['Roughness'])
    nor = img('nor_gl', True)
    if nor:
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = 0.6
        nt.links.new(nor.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m


M_FLOOR = textured('floor', 'laminate_floor_02', 0.55, tint=(1.0, 0.97, 0.93), rough_mult=0.9)
M_WALL = principled('plaster', (0.9, 0.875, 0.835), 0.92)              # 따뜻한 흰 벽 (질감 없이 깨끗하게)
if STYLE_LX:
    M_WALL = principled('plaster_lx', (0.88, 0.85, 0.8), 0.9)           # 크림 화이트 (햇빛 받은 면과 대비가 나게)
    # 밝은 베이지 대형 타일(600×1200): 은은한 광택으로 햇빛을 되비쳐 공간 전체가 환해진다
    M_FLOOR = principled('tile_lx', (0.76, 0.71, 0.63), 0.22)
    _ft = M_FLOOR.node_tree
    _br = _ft.nodes.new('ShaderNodeTexBrick')
    _br.offset = 0.5
    _br.inputs['Color1'].default_value = (0.77, 0.72, 0.64, 1)
    _br.inputs['Color2'].default_value = (0.74, 0.69, 0.61, 1)
    _br.inputs['Mortar'].default_value = (0.66, 0.62, 0.56, 1)
    _br.inputs['Scale'].default_value = 1.0
    _br.inputs['Mortar Size'].default_value = 0.003
    _br.inputs['Brick Width'].default_value = 1.2
    _br.inputs['Row Height'].default_value = 0.6
    _tc = _ft.nodes.new('ShaderNodeTexCoord')
    _ft.links.new(_tc.outputs['Object'], _br.inputs['Vector'])
    _ft.links.new(_br.outputs['Color'], _ft.nodes['Principled BSDF'].inputs['Base Color'])
    M_LED = bpy.data.materials.new('cove_led')                            # 우물천장 간접 조명 띠
    M_LED.use_nodes = True
    _lb = M_LED.node_tree.nodes['Principled BSDF']
    _lb.inputs['Emission Color'].default_value = (1.0, 0.95, 0.86, 1)
    _lb.inputs['Emission Strength'].default_value = 2.5
M_CUT = principled('cut', (0.95, 0.94, 0.91), 0.85)                    # 벽 윗면·슬래브 단면
M_DARK = principled('lx_charcoal', (0.035, 0.038, 0.042), 0.32, 0.65)   # 거실 리프트&슬라이드 프레임
M_CHAMP = principled('lx_champagne', (0.62, 0.55, 0.45), 0.3, 0.55)     # K: 샴페인 베이지 알루미늄 프레임
M_CHAMP_LX = principled('lx_champagne_light', (0.78, 0.72, 0.62), 0.25, 0.6)   # lx: 더 밝은 샴페인 (햇빛에 은은히 빛남)
M_WHITE = principled('lx_white', (0.86, 0.86, 0.84), 0.28)               # 방 틸트&턴 프레임
M_HANDLE = principled('handle', (0.55, 0.56, 0.57), 0.25, 1.0)
M_GLASS = principled('glass', (0.92, 0.96, 0.97), 0.0, **{'Transmission Weight': 1.0, 'IOR': 1.45})
# 유리가 햇빛(그림자 광선)을 막지 않게: 그림자 계산에서는 투명하게 처리해야 실내 바닥에 창 그림자가 떨어진다
_gt = M_GLASS.node_tree
_lp, _tr, _mx = _gt.nodes.new('ShaderNodeLightPath'), _gt.nodes.new('ShaderNodeBsdfTransparent'), _gt.nodes.new('ShaderNodeMixShader')
_gt.links.new(_lp.outputs['Is Shadow Ray'], _mx.inputs['Fac'])
_gt.links.new(_gt.nodes['Principled BSDF'].outputs['BSDF'], _mx.inputs[1])
_gt.links.new(_tr.outputs['BSDF'], _mx.inputs[2])
_gt.links.new(_mx.outputs['Shader'], _gt.nodes['Material Output'].inputs['Surface'])
M_RUG = principled('rug', (0.6, 0.56, 0.49), 1.0)
M_FABRIC = principled('sofa_fabric', (0.84, 0.8, 0.73), 1.0, **{'Sheen Weight': 0.4})
M_LINEN = principled('linen', (0.9, 0.88, 0.83), 0.9)
M_DUVET = principled('duvet', (0.78, 0.74, 0.66), 0.95)
M_OAK = principled('oak', (0.45, 0.32, 0.21), 0.55)
M_GROUND = principled('ground', (0.9, 0.87, 0.82), 1.0)


# ---------------- 기본 도형 ----------------
def box(name, x0, y0, z0, x1, y1, z1, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.object
    o.name = name
    o.scale = (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0))
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth() if False else None
    return o


def bevel(o, w=0.006):
    m = o.modifiers.new('bevel', 'BEVEL')
    m.width = w
    m.segments = 2
    return o


def wall(name, axis, at, a0, a1, t, h, openings=(), outward=-1):
    """axis 'x': y=at 위치에서 x 방향 벽, 'y': x=at 위치에서 y 방향 벽. 창 자리는 비워 둔다."""
    segs, cur = [], a0
    for o in sorted(openings, key=lambda o: o['a']):
        segs.append((cur, o['a'], 0, h))
        if o['zs'] > 0:
            segs.append((o['a'], o['b'], 0, o['zs']))
        if o['zh'] < h:
            segs.append((o['a'], o['b'], o['zh'], h))
        cur = o['b']
    segs.append((cur, a1, 0, h))
    w0, w1 = sorted((at, at + outward * t))
    for i, (u0, u1, z0, z1) in enumerate(segs):
        if u1 - u0 < 1e-4 or z1 - z0 < 1e-4:
            continue
        if axis == 'x':
            box(f'{name}_{i}', u0, w0, z0, u1, w1, z1, M_WALL)
        else:
            box(f'{name}_{i}', w0, u0, z0, w1, u1, z1, M_WALL)


# ---------------- 세대 짓기 ----------------
box('slab', -T, -T, -SLAB, UW + T, UD + T, 0, M_CUT)
floor = box('floor', 0, 0, -0.002, UW, UD, 0.004, M_FLOOR)
wall('back', 'x', 0, -T, UW + T, T, H, [WIN_MASTER, WIN_LIVING])
wall('left', 'y', 0, 0, UD, T, H, [WIN_SMALL])
# 내려다보는 장면은 앞·오른쪽 벽을 낮게 자르고 천장을 없앤다. 실내 장면은 천장까지 막아 진짜 방처럼
INTERIOR = SHOT in ('window', 'open', 'hero')   # hero: 랜딩 배경용 장면
# lx 영상: 처음엔 잘린 모형처럼 보이다가, 거실로 내려오면 앞·오른쪽 벽이 올라오고 천장이 내려와 실내가 완성된다
ANIM_LX = SHOT == 'anim' and STYLE_LX
_before = set(bpy.data.objects)
wall('front', 'x', UD, -T, UW + T, T, H if (INTERIOR or ANIM_LX) else LOW, outward=1)
wall('right', 'y', UW, 0, UD, T, H if (INTERIOR or ANIM_LX) else LOW, outward=1)
RISE_OBJS = [o for o in bpy.data.objects if o not in _before]
_before = set(bpy.data.objects)
if INTERIOR or ANIM_LX:
    if STYLE_LX:
        # 우물천장: 거실 가운데를 한 단 올리고, 단 경계를 따라 간접 조명 띠
        cx0, cx1, cy0, cy1 = 5.0, 10.4, 0.8, 6.8
        box('ceiling_rooms', -T, -T, H, PART_X, UD + T, H + 0.2, M_WALL)
        box('ceiling_b0', PART_X, -T, H, UW + T, cy0, H + 0.2, M_WALL)
        box('ceiling_b1', PART_X, cy1, H, UW + T, UD + T, H + 0.2, M_WALL)
        box('ceiling_b2', PART_X, cy0, H, cx0, cy1, H + 0.2, M_WALL)
        box('ceiling_b3', cx1, cy0, H, UW + T, cy1, H + 0.2, M_WALL)
        box('ceiling_recess', cx0, cy0, H + 0.16, cx1, cy1, H + 0.3, M_WALL)
        for n, (a0, b0, a1, b1) in {'s': (cx0, cy0, cx1, cy0 + 0.03), 'n': (cx0, cy1 - 0.03, cx1, cy1),
                                     'w': (cx0, cy0, cx0 + 0.03, cy1), 'e': (cx1 - 0.03, cy0, cx1, cy1)}.items():
            box(f'cove_{n}', a0, b0, H + 0.13, a1, b1, H + 0.16, M_LED)
    else:
        box('ceiling', -T, -T, H, UW + T, UD + T, H + 0.2, M_WALL)
CEIL_OBJS = [o for o in bpy.data.objects if o not in _before]
wall('part_v', 'y', PART_X, 0, UD, TI, H, [dict(a=2.3, b=3.2, zs=0, zh=2.1), dict(a=5.6, b=6.5, zs=0, zh=2.1)], outward=1)
wall('part_h', 'x', PART_Y, 0, PART_X, TI, H, outward=1)


# ---------------- LX 형태 창 ----------------
def window(spec, kind, open_amount=0.0, open_leaves=None):
    """kind 'lift_slide': 차콜 두 짝 미닫이(거실), 'lift_slide3': 샴페인 세 짝(양옆 좁고 가운데 넓음, K),
    'tilt_turn': 흰색 한 짝(방). open_amount 0~1: 창짝을 옆으로 민 정도"""
    a, b, zs, zh = spec['a'], spec['b'], spec['zs'], spec['zh']
    mat = {'lift_slide': M_DARK, 'lift_slide3': M_CHAMP_LX if STYLE_LX else M_CHAMP}.get(kind, M_WHITE)
    slim = kind.startswith('lift_slide')
    parts = {'frame': [], 'leaves': [], 'room': (0, 1, 0) if spec['wall'] == 'back' else (1, 0, 0),
             'along': (1, 0, 0) if spec['wall'] == 'back' else (0, 1, 0)}   # room: 실내 쪽 방향, along: 벽 방향
    f = 0.06 if slim else 0.07          # 창틀 폭 (슬림)
    s = 0.05 if slim else 0.065         # 창짝 테 폭
    if STYLE_LX and kind == 'lift_slide3':   # 더 가는 프레임으로 유리 면을 최대로
        f, s = 0.045, 0.034
    d = 0.11                                            # 창 깊이
    objs = []

    def place(x0, x1, z0, z1, d0, d1, m, name):
        # 창 평면 좌표(u: 벽 방향, z: 높이, d: 벽 두께 방향 0=실내면) → 세계 좌표
        if spec['wall'] == 'back':
            o = box(name, x0, -d1, z0, x1, -d0, z1, m)
        else:
            o = box(name, -d1, x0, z0, -d0, x1, z1, m)
        objs.append(o)
        return o

    mid = T / 2 - d / 2
    for n, (x0, x1, z0, z1) in {'top': (a, b, zh - f, zh), 'bot': (a, b, zs, zs + f),
                                 'l': (a, a + f, zs, zh), 'r': (b - f, b, zs, zh)}.items():
        parts['frame'].append(bevel(place(x0, x1, z0, z1, mid, mid + d, mat, f'frame_{n}'), 0.004))

    inner = b - a - 2 * f
    if kind == 'lift_slide3':           # 양옆 좁은 창짝 + 가운데 넓은 창짝, 세 레일에 엇갈려 끼워진다
        widths, dirs, depths = [inner * .22, inner * .56, inner * .22], [-1, 1, 1], [0.0, 0.03, 0.06]
    elif kind == 'lift_slide':
        widths, dirs, depths = [inner / 2] * 2, [-1, 1], [0.015, 0.055]
    else:
        widths, dirs, depths = [inner], [1], [0.015]
    leaves = len(widths)
    for i in range(leaves):
        iw = widths[i]
        amount = open_leaves[i] if open_leaves else open_amount       # open_leaves: 창짝마다 따로 연 정도
        slide = dirs[i] * amount * (iw - 0.02)
        x0 = a + f + sum(widths[:i]) + slide - (0.03 if i else 0)
        x1 = x0 + iw + (0.03 if leaves > 1 else 0)
        depth = mid + depths[i]
        z0, z1 = zs + f, zh - f
        leaf = {'sash': [], 'travel': iw - 0.02, 'dir': dirs[i]}
        for n, (u0, u1, v0, v1) in {'t': (x0, x1, z1 - s, z1), 'b': (x0, x1, z0, z0 + s),
                                     'l': (x0, x0 + s, z0, z1), 'r': (x1 - s, x1, z0, z1)}.items():
            leaf['sash'].append(bevel(place(u0, u1, v0, v1, depth, depth + 0.045, mat, f'sash{i}_{n}'), 0.003))
        leaf['glass'] = place(x0 + s, x1 - s, z0 + s, z1 - s, depth + 0.02, depth + 0.026, M_GLASS, f'glass{i}')
        if kind == 'lift_slide3':      # 세 짝: 양옆 창짝의 바깥쪽 테에만 손잡이 (참고 이미지처럼)
            hx = None if i == 1 else (x0 + s * 0.5 if i == 0 else x1 - s * 0.5)
        else:                          # 손잡이: 맞닿는 쪽 테
            hx = (x1 - s * 0.5) if (i == 0) else (x0 + s * 0.5)
        hz = (z0 + z1) / 2
        leaf['handle'] = None if hx is None else place(hx - 0.012, hx + 0.012, hz - 0.11, hz + 0.11, depth - 0.035, depth, M_HANDLE, f'handle{i}')
        parts['leaves'].append(leaf)
    return parts


W_MASTER = window(WIN_MASTER, 'tilt_turn')
W_SMALL = window(WIN_SMALL, 'tilt_turn')
# hero(배경): 가운데 창짝만 열고 양옆 창짝·창틀은 남겨 '창호'가 화면에 보이게
HERO_OPEN = [0.0, 1.0, 0.0] if (SHOT == 'hero' and STYLE_K) else None
W_LIVING = window(WIN_LIVING, 'lift_slide3' if STYLE_K else 'lift_slide',
                  open_amount=0.92 if SHOT == 'open' else 0.0, open_leaves=HERO_OPEN)


# ---------------- 가구 (Poly Haven) ----------------
def import_model(mid, loc, rot_z=0.0, scale=1.0):
    d = os.path.join(PH, mid)
    path = next(os.path.join(d, f) for f in os.listdir(d) if f.endswith('.gltf'))
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(f'{mid}_root', None)
    scene.collection.objects.link(root)
    for o in new:
        if o.parent is None:
            o.parent = root
    root.location = loc
    root.rotation_euler = (0, 0, rot_z)
    root.scale = (scale,) * 3
    return root


# 거실: 소파가 창을 바라보고, 그 앞에 러그·커피 테이블, 창가에 라운지 체어와 화분
if STYLE_LX:   # 옅은 러그 하나 (문구 자리인 왼쪽은 비운다)
    box('rug', 4.6, 1.6, 0.004, 7.0, 4.0, 0.012, principled('rug_lx', (0.8, 0.77, 0.7), 1.0))
elif SHOT != 'hero':   # 배경 장면은 문구 자리(왼쪽 아래)를 비우려고 러그·커피 테이블을 뺀다
    box('rug', 5.9, 2.4, 0.004, 9.5, 5.2, 0.016, M_RUG)
# 모던 패브릭 소파 (직접 모델링: 낮은 등받이·둥근 모서리, 크림색). lx는 오른쪽 앞에 두어 왼쪽 문구 자리를 비운다
SX, SY = (5.7, 3.3) if STYLE_LX else (7.7, 5.9)   # lx: 화면 오른쪽 앞(카메라가 -y를 보므로 x가 작을수록 오른쪽)
bevel(box('sofa_base', SX - 1.3, SY - 0.45, 0.08, SX + 1.3, SY + 0.5, 0.36, M_FABRIC), 0.06)
for i in (-1, 0, 1):
    bevel(box(f'sofa_seat{i}', SX + i * 0.78 - 0.38, SY - 0.48, 0.36, SX + i * 0.78 + 0.38, SY + 0.22, 0.5, M_FABRIC), 0.07)
    bevel(box(f'sofa_back{i}', SX + i * 0.78 - 0.38, SY + 0.18, 0.36, SX + i * 0.78 + 0.38, SY + 0.48, 0.8, M_FABRIC), 0.09)
for side in (-1, 1):
    bevel(box(f'sofa_arm{side}', SX + side * 1.3 - 0.16, SY - 0.45, 0.08, SX + side * 1.3 + 0.16, SY + 0.5, 0.62, M_FABRIC), 0.08)
for x in (SX - 1.32, SX + 1.24):
    for y in (SY - 0.4, SY + 0.42):
        box('sofa_leg', x, y, 0, x + 0.06, y + 0.06, 0.08, M_OAK)
if SHOT != 'hero' and not STYLE_LX:
    import_model('modern_coffee_table_01', (7.7, 3.7, 0))
if SHOT != 'hero' and not STYLE_LX:   # 배경 장면에서는 문구 자리를 가리는 가죽 의자를 뺀다
    import_model('mid_century_lounge_chair', (9.7, 2.2, 0), rot_z=math.radians(200))
if STYLE_LX:   # 소파 옆 낮은 사이드 테이블 + 화병만
    pass   # 소품 없이 비워 둔다 (넓은 공간감)
else:
    import_model('side_table_01', (9.6, 5.7, 0))
    import_model('ceramic_vase_02', (9.6, 5.7, 0.55))
    import_model('potted_plant_01', (5.3, 0.75, 0))
    import_model('potted_plant_04', (10.5, 0.8, 0), scale=1.3)
# 안방: 침대(낮은 원목 프레임 + 매트리스 + 이불)
box('bed_frame', 0.8, 0.5, 0.0, 2.9, 2.6, 0.28, M_OAK)
bevel(box('mattress', 0.85, 0.55, 0.28, 2.85, 2.55, 0.5, M_LINEN), 0.04)
bevel(box('duvet', 0.84, 1.3, 0.5, 2.86, 2.56, 0.56, M_DUVET), 0.03)
bevel(box('headboard', 0.8, 0.42, 0.0, 2.9, 0.52, 1.05, M_OAK), 0.01)
import_model('potted_plant_04', (3.6, 3.1, 0), scale=1.1)
# 작은방: 책상
box('desk', 0.35, 4.5, 0.72, 0.95, 6.1, 0.76, M_OAK)
box('desk_leg1', 0.4, 4.55, 0, 0.45, 4.6, 0.72, M_OAK)
box('desk_leg2', 0.4, 6.0, 0, 0.45, 6.05, 0.72, M_OAK)


# ---------------- 빛·하늘 ----------------
world = bpy.data.worlds.new('sky')
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
env = wn.new('ShaderNodeTexEnvironment')
hdri = opt['hdri']
env.image = bpy.data.images.load(os.path.join(PH, hdri, next(f for f in os.listdir(os.path.join(PH, hdri)) if f.endswith('.hdr'))))
wmap = wn.new('ShaderNodeMapping')
wmap.inputs['Rotation'].default_value = (math.radians(float(opt['tilt'])), 0, math.radians(float(opt['yaw'])))   # yaw: 스카이라인 방향, tilt: 지평선 높이
world.node_tree.links.new(wn.new('ShaderNodeTexCoord').outputs['Generated'], wmap.inputs['Vector'])
world.node_tree.links.new(wmap.outputs['Vector'], env.inputs['Vector'])
bg = wn['Background']
bg.inputs['Strength'].default_value = 0.9
SKY_MIX = None
if SHOT in ('aerial', 'anim'):
    # 내려다보는 장면은 하늘·도시를 비추지 않고 따뜻한 미색 바탕만 보이게 (조명은 HDRI 그대로)
    lp = wn.new('ShaderNodeLightPath')
    plain = wn.new('ShaderNodeBackground')
    plain.inputs['Color'].default_value = (0.93, 0.9, 0.85, 1)
    mix = wn.new('ShaderNodeMixShader')
    world.node_tree.links.new(env.outputs['Color'], bg.inputs['Color'])
    SKY_MIX = wn.new('ShaderNodeMath')            # 카메라 광선이면 미색 바탕 × 비율 (애니메이션에서 1 → 0)
    SKY_MIX.operation = 'MULTIPLY'
    SKY_MIX.inputs[1].default_value = 1.0
    world.node_tree.links.new(lp.outputs['Is Camera Ray'], SKY_MIX.inputs[0])
    world.node_tree.links.new(SKY_MIX.outputs[0], mix.inputs['Fac'])
    world.node_tree.links.new(bg.outputs['Background'], mix.inputs[1])
    world.node_tree.links.new(plain.outputs['Background'], mix.inputs[2])
    world.node_tree.links.new(mix.outputs['Shader'], wn['World Output'].inputs['Surface'])
    GROUND = box('ground', -40, -40, -SLAB - 0.02, 40, 40, -SLAB, M_GROUND)   # 그림자를 받는 바닥
    GROUND.visible_transmission = False   # 유리 너머로는 바닥 대신 도시가 보이게
    GROUND.visible_glossy = False
else:
    world.node_tree.links.new(env.outputs['Color'], bg.inputs['Color'])

# 해 질 녘 햇빛: 하늘 자료(노을)에 맞춰 낮고 따뜻한 빛이 거실 창으로 깊숙이 들어와 마루에 창 그림자를 길게 떨어뜨린다
bpy.ops.object.light_add(type='SUN')
sun = bpy.context.object
sun.data.energy = 3.0 if STYLE_K else 2.6
sun.data.angle = math.radians(1.5)
sun.data.color = (1.0, 0.94, 0.86) if STYLE_K else (1.0, 0.8, 0.6)     # K: 맑은 오후 / I: 해 질 녘
sun.rotation_euler = (math.radians(55 if STYLE_K else 66), 0, math.radians(-28))
CITY_OBJS = []
if CITY_VIEW:
    _before = set(bpy.data.objects)
    exec(open(os.path.join(HERE, 'city_view.py'), encoding='utf-8').read())
    CITY_OBJS = [o for o in bpy.data.objects if o not in _before]
if STYLE_LX:   # 창을 정면으로 통과해 밝은 타일 바닥에 큰 빛 면과 창틀 그림자를 길게 드리우는 오후 햇빛
    sun.data.energy = float(opt.get('sun', '12'))
    # 실내를 비추는 하늘빛은 줄여 햇빛 면이 또렷하게, 눈(카메라·유리 너머)으로 보이는 하늘은 밝게
    _lp2 = wn.new('ShaderNodeLightPath')
    _seen = wn.new('ShaderNodeMath'); _seen.operation = 'ADD'
    world.node_tree.links.new(_lp2.outputs['Is Camera Ray'], _seen.inputs[0])
    _nd = wn.new('ShaderNodeMath'); _nd.operation = 'LESS_THAN'; _nd.inputs[1].default_value = 0.5   # 아직 벽·바닥에 튀지 않은 광선만
    world.node_tree.links.new(_lp2.outputs['Diffuse Depth'], _nd.inputs[0])
    _tr2 = wn.new('ShaderNodeMath'); _tr2.operation = 'MULTIPLY'
    world.node_tree.links.new(_lp2.outputs['Is Transmission Ray'], _tr2.inputs[0])
    world.node_tree.links.new(_nd.outputs[0], _tr2.inputs[1])
    world.node_tree.links.new(_tr2.outputs[0], _seen.inputs[1])
    _cl = wn.new('ShaderNodeMath'); _cl.operation = 'MINIMUM'; _cl.inputs[1].default_value = 1.0
    world.node_tree.links.new(_seen.outputs[0], _cl.inputs[0])
    _st = wn.new('ShaderNodeMath'); _st.operation = 'MULTIPLY_ADD'
    _st.inputs[1].default_value = float(opt.get('skyseen', '1.1'))    # 보이는 하늘 = 0.45 + 1.1
    _st.inputs[2].default_value = float(opt.get('skyfill', '0.08'))   # 비추는 하늘
    world.node_tree.links.new(_cl.outputs[0], _st.inputs[0])
    world.node_tree.links.new(_st.outputs[0], bg.inputs['Strength'])
    sun.data.angle = math.radians(0.8)
    sun.data.color = (1.0, 0.96, 0.9)
    sun.rotation_euler = (math.radians(float(opt.get('sunx', '60'))), 0, math.radians(float(opt.get('sunz', '-45'))))


# ---------------- 카메라 ----------------
def camera(loc, target, lens):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.data.lens = lens
    tgt = bpy.data.objects.new('cam_target', None)
    scene.collection.objects.link(tgt)
    tgt.location = target
    c = cam.constraints.new('TRACK_TO')
    c.target = tgt
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'
    scene.camera = cam
    return cam


if SHOT in ('aerial', 'anim'):
    CAM = camera((UW + 9.5, UD + 10.5, 11.5), (UW / 2 + 0.3, UD / 2 - 0.6, 0.2), 38)
elif SHOT == 'window':
    camera((7.6, 7.25, 1.45), (7.65, 0.0, 1.15), 22)
elif SHOT == 'open':   # 창 바로 앞에서 열린 창 너머 풍경
    camera((7.65, 2.6, 1.35), (7.65, -6.0, 1.3), 26)
else:   # hero: --cam x,y,z --look x,y,z --lens N 으로 구도를 정한다
    vec = lambda k, d: tuple(float(v) for v in opt.get(k, d).split(','))
    camera(vec('cam', '7.4,5.2,1.3'), vec('look', '7.4,-5,1.45'), float(opt.get('lens', '24')))
if INTERIOR and SHOT != 'hero':   # 배경은 전체가 또렷해야 하므로 초점 흐림 없음
    # 실내 사진처럼 창틀에 초점을 두고 창밖은 살짝 흐리게 (옥상 설비 같은 잡다한 부분이 덜 보이게)
    cam = scene.camera.data
    cam.dof.use_dof = True
    cam.dof.focus_distance = 7.25 if SHOT == 'window' else 2.7
    cam.dof.aperture_fstop = 2.2


# ---------------- 애니메이션: 창호 조립 + 카메라 이동 (30fps, 5초) ----------------
FPS, END = 30, 150
if SHOT == 'anim':
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 1, END
    V = Vector

    def key(o, f, loc=None, rot=None, hide=None, ease='BEZIER'):
        if loc is not None:
            o.location = loc
            o.keyframe_insert('location', frame=f)
        if rot is not None:
            o.rotation_euler = rot
            o.keyframe_insert('rotation_euler', frame=f)
        if hide is not None:
            o.hide_render = hide
            o.hide_viewport = hide
            o.keyframe_insert('hide_render', frame=f)
            o.keyframe_insert('hide_viewport', frame=f)

    def appear(o, f):   # f 전까지는 보이지 않다가 f부터 등장
        if f > 1:
            key(o, 1, hide=True)
        key(o, f, hide=False)

    def fly_in(o, f0, f1, offset, overshoot=None):
        """offset만큼 떨어진 곳에서 날아와 제자리에 박힌다. overshoot: 제자리를 살짝 지나쳤다 돌아오는 '착'"""
        home = o.location.copy()
        appear(o, f0)
        key(o, f0, loc=home + V(offset))
        if STYLE_LX:
            # lx: 되튕김 없이 부드럽게 안착 (위에서 내려다볼 때 2~3픽셀 되튕김이 떨림처럼 보였음).
            # 날아오는 동안은 그림자를 만들지 않아, 낮은 햇빛에 길게 늘어진 그림자가 바닥에서 깜빡이지 않게
            o.visible_shadow = False
            o.keyframe_insert('visible_shadow', frame=1)
            o.keyframe_insert('visible_shadow', frame=f1 - 1)
            o.visible_shadow = True
            o.keyframe_insert('visible_shadow', frame=f1)
        elif overshoot:
            key(o, f1 - 3, loc=home - V(offset).normalized() * overshoot)
        key(o, f1, loc=home)

    def assemble(w, f0):
        """창틀 → 유리 → 창짝 → 손잡이 '딸깍'. 끝나는 프레임을 돌려준다"""
        room, along = V(w['room']), V(w['along'])
        for i, o in enumerate(w['frame']):                          # 창틀: 방 쪽 위에서 날아와 벽에 박힘
            fly_in(o, f0 + i * 2, f0 + 12 + i * 2, room * 1.1 + V((0, 0, 0.5)), overshoot=0.03)
        for j, lf in enumerate(w['leaves']):
            g0 = f0 + 10 + j * 3
            fly_in(lf['glass'], g0, g0 + 10, V((0, 0, 1.2)))         # 유리: 위에서 미끄러져 내려옴
            side = along * lf['dir'] * 0.9 if len(w['leaves']) > 1 else room * 0.7
            for o in lf['sash']:                                     # 창짝: 옆(또는 방 쪽)에서 레일로 끼워짐
                fly_in(o, g0 + 6, g0 + 18, side, overshoot=0.025)
            h = lf['handle']                                         # 손잡이: 90° 누워 있다가 '딸깍' 세워짐
            if h is None:
                continue
            appear(h, g0 + 18)
            ax = 1 if w['room'][0] == 0 else 0                       # 벽 법선 축으로 회전
            r0 = [0, 0, 0]; r0[ax] = math.radians(90)
            r1 = [0, 0, 0]; r1[ax] = math.radians(-12)
            key(h, g0 + 18, rot=r0)
            key(h, g0 + 22, rot=r1)
            key(h, g0 + 24, rot=(0, 0, 0))
        return f0 + 10 + 3 * len(w['leaves']) + 24

    assemble(W_MASTER, 10)          # 안방
    assemble(W_SMALL, 24)           # 작은방
    done = assemble(W_LIVING, 62)   # 거실: 카메라가 다가가는 동안

    # 카메라: 내려다본 전체 → 천천히 다가감 → 거실 안으로 내려와 큰 창 정면 → 열린 창 쪽으로 밀고 나감
    tgt = CAM.constraints['Track To'].target
    shots = [  # (프레임, 카메라 위치, 바라보는 점, 렌즈)
        (1, (UW + 9.5, UD + 10.5, 11.5), (UW / 2 + 0.3, UD / 2 - 0.6, 0.2), 38),
        (42, (UW + 8.4, UD + 9.2, 10.2), (UW / 2 + 0.6, UD / 2 - 0.9, 0.3), 38),
        (78, (11.2, 9.0, 4.2), (7.65, 1.2, 0.9), 30),
        (108, (7.65, 3.7, 1.3), (7.65, -4.0, 1.2), 26),
        (END, (7.65, 1.3, 1.3), (7.65, -6.0, 1.3), 26),
    ]
    if STYLE_LX:   # 창 앞까지 내려왔다가, 가운데 창이 열리면 뒤로 물러나 환한 거실 전체(배경 구도 hero_lx)에서 멈춘다
        shots = [   # 42프레임 중간 키를 빼서 1.4초 무렵 속도가 '턱' 바뀌지 않고 한 번에 매끄럽게 내려온다
            (1, (UW + 9.5, UD + 10.5, 11.5), (UW / 2 + 0.3, UD / 2 - 0.6, 0.2), 38),
            (80, (9.0, 6.6, 2.2), (7.65, 0.5, 1.0), 26),
            (104, (7.6, 3.4, 1.3), (7.6, -4.0, 1.3), 24),
            (118, (7.6, 3.4, 1.3), (7.6, -4.0, 1.3), 24),
            (END, (7.6, 6.5, 1.25), (7.6, -3.0, 1.3), 22),
        ]
    for f, loc, look, lens in shots:
        key(CAM, f, loc=loc)
        key(tgt, f, loc=look)
        CAM.data.lens = lens
        CAM.data.keyframe_insert('lens', frame=f)

    # 거실 창이 다 조립되면 두 창짝이 벽 속으로 미끄러져 열린다 (리프트&슬라이드)
    OPEN0 = max(done + 6, 116)
    if STYLE_LX:   # lx: 가운데 큰 창짝만 열고 양옆 창짝은 남겨 창호가 보이게 (배경과 같은 상태로 끝남)
        OPEN0 = max(done + 4, 106)
    for lf in (W_LIVING['leaves'][1:2] if STYLE_LX else W_LIVING['leaves']):
        for o in lf['sash'] + [lf['glass']] + ([lf['handle']] if lf['handle'] else []):
            home = o.location.copy()
            key(o, OPEN0, loc=home)
            key(o, OPEN0 + 24, loc=home + V(W_LIVING['along']) * lf['dir'] * lf['travel'])

    # 카메라가 방 안으로 내려오면 바닥 그림자판을 끄고, 창이 열릴 때 바깥 하늘·도시가 보이게 바꾼다
    key(GROUND, 96, hide=False)
    key(GROUND, 97, hide=True)
    SKY_MIX.inputs[1].default_value = 1.0
    SKY_MIX.inputs[1].keyframe_insert('default_value', frame=100)
    SKY_MIX.inputs[1].default_value = 0.0
    SKY_MIX.inputs[1].keyframe_insert('default_value', frame=112)

    if ANIM_LX:
        # 앞·오른쪽 벽은 바닥 위 낮은 높이에서 시작해 위로 늘어나고, 천장은 위에서 내려와 덮인다.
        # (예전엔 벽을 슬래브 밑에 묻었는데, 묻힌 면이 슬래브 옆면과 겹쳐 테두리가 번지고 깜빡였음)
        for o in RISE_OBJS:
            zmin = min((o.matrix_world @ V(c)).z for c in o.bound_box)
            scene.cursor.location = (o.location.x, o.location.y, zmin)
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.origin_set(type='ORIGIN_CURSOR')       # 기준점을 벽 밑면으로
            o.scale = (1, 1, LOW / H)
            o.keyframe_insert('scale', frame=1)
            o.keyframe_insert('scale', frame=94)
            o.scale = (1, 1, 1)
            o.keyframe_insert('scale', frame=110)
        # 바깥 도시 모형은 거실에 들어서기 전까지 카메라에 직접 보이지 않게 (모형 너머 허공에 떠 보였음).
        # 유리 너머로 보이는 풍경(투과 광선)은 그대로라 창 안쪽 장면에는 영향 없음
        for o in CITY_OBJS:
            o.visible_camera = False
            o.keyframe_insert('visible_camera', frame=1)
            o.keyframe_insert('visible_camera', frame=95)
            o.visible_camera = True
            o.keyframe_insert('visible_camera', frame=96)
        for o in CEIL_OBJS:
            home = o.location.copy()
            key(o, 1, hide=True)
            key(o, 90, hide=False)
            key(o, 90, loc=home + V((0, 0, 2.6)))
            key(o, 110, loc=home)
        # 노출: 모형(밖) 0.35 → 실내 완성 후 배경과 같은 밝기
        scene.view_settings.exposure = 0.35
        scene.view_settings.keyframe_insert('exposure', frame=96)
        scene.view_settings.exposure = float(opt.get('exposure', '0.7'))
        scene.view_settings.keyframe_insert('exposure', frame=112)


# ---------------- 렌더 설정 ----------------
rx, ry = map(int, opt['res'].split('x'))
scene.render.resolution_x, scene.render.resolution_y = rx, ry
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Base Contrast' if STYLE_LX else 'AgX - Medium High Contrast'
if not ANIM_LX:
    scene.view_settings.exposure = (float(opt.get('exposure', '0.7')) if STYLE_LX else (0.45 if CITY_VIEW else 0.9)) if INTERIOR else 0.35
if opt['engine'] == 'cycles':
    scene.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for dv in prefs.devices:
        dv.use = True
    scene.cycles.device = 'GPU'
    scene.cycles.samples = int(opt['samples'])
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
else:
    scene.render.engine = 'BLENDER_EEVEE'
    ee = scene.eevee
    for attr, val in [('use_raytracing', True), ('use_shadows', True), ('taa_render_samples', 32)]:
        if hasattr(ee, attr):
            setattr(ee, attr, val)

if opt.get('analyze'):   # 렌더 없이 카메라 움직임만 프레임별로 출력 (떨림 점검용)
    for f in range(scene.frame_start, scene.frame_end + 1):
        scene.frame_set(f)
        m = scene.camera.matrix_world
        fwd = -m.col[2].xyz
        up = m.col[1].xyz
        print('CAM', f, *(f'{v:.9f}' for v in (*m.translation, *fwd, *up)), f'{scene.camera.data.lens:.4f}')
    raise SystemExit
os.makedirs(opt['out'], exist_ok=True)
if SHOT == 'anim':
    if 'frames' in opt:   # 예: --frames 1-150 / 100-150 (일부만 다시 렌더)
        scene.frame_start, scene.frame_end = map(int, opt['frames'].split('-'))
    scene.render.image_settings.file_format = 'PNG'
    scene.render.use_overwrite = False     # 중간에 멈춰도 다시 실행하면 이미 렌더된 프레임은 건너뛴다
    scene.render.use_placeholder = True
    scene.render.filepath = os.path.join(opt['out'], f'anim_{opt["engine"]}' + ('_lx' if STYLE_LX else '_k' if STYLE_K else ''), '')
    bpy.ops.render.render(animation=True)
    print('SAVED', scene.render.filepath)
else:
    scene.render.filepath = os.path.join(opt['out'], opt.get('name', f'{SHOT}_{opt["engine"]}') + '.png')
    bpy.ops.render.render(write_still=True)
    print('SAVED', scene.render.filepath)
