# 창밖 "한강 뷰"를 직접 짓는다: 강 수면 · 강변 공원 숲 · 흰 아파트 단지 · 옅은 산 능선 · 대기 뿌연 효과.
# build_apartment.py 안에서 exec 로 실행된다 (box·principled·scene·sun·opt 를 그대로 쓴다).
# 세대 바닥(z=0)은 약 20층 높이로 보고, 바깥 지면을 z=-60 에 둔다. 창은 y=0 벽에 있고 바깥은 y<0.
import random

VAR = opt.get('viewvar', 'a')   # a: 맑은 낮, b: 노을빛 오후, c: 녹지를 넓게
rnd = random.Random(7)
GZ = -60.0                       # 바깥 지면 높이
CX = 7.65                        # 거실 창 가운데 x
FOG = {'a': (0.80, 0.85, 0.90), 'b': (0.92, 0.84, 0.76), 'c': (0.80, 0.86, 0.88)}[VAR]
AIRY = opt.get('style') == 'lx'   # lx: 실내보다 살짝 밝게 날아간 뽀얀 대기감
if AIRY:
    FOG = (0.9, 0.93, 0.95)


def ext_mat(name, color, rough=0.8, bands=None, fog_far=3200.0, fog_max=0.7, glow=0.25):
    if AIRY:
        fog_far, fog_max, glow = fog_far * 0.8, min(0.88, fog_max + 0.15), glow + 0.35
    """바깥 풍경 재질: 멀수록 대기 색(FOG)으로 바래 보이게 한다. bands=(층 높이, 창 띠 색) 이면 층마다 창 띠"""
    m = principled(name, color, rough)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    col = None
    if bands:
        geo = nt.nodes.new('ShaderNodeNewGeometry')
        sep = nt.nodes.new('ShaderNodeSeparateXYZ')
        nt.links.new(geo.outputs['Position'], sep.inputs['Vector'])
        div = nt.nodes.new('ShaderNodeMath'); div.operation = 'DIVIDE'; div.inputs[1].default_value = bands[0]
        frac = nt.nodes.new('ShaderNodeMath'); frac.operation = 'FRACT'
        gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.55
        nt.links.new(sep.outputs['Z'], div.inputs[0])
        nt.links.new(div.outputs[0], frac.inputs[0])
        nt.links.new(frac.outputs[0], gt.inputs[0])
        mixb = nt.nodes.new('ShaderNodeMix'); mixb.data_type = 'RGBA'
        mixb.inputs[6].default_value = (*color, 1)
        mixb.inputs[7].default_value = (*bands[1], 1)
        nt.links.new(gt.outputs[0], mixb.inputs['Factor'])
        col = mixb.outputs[2]
    cam = nt.nodes.new('ShaderNodeCameraData')
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Max'].default_value = fog_far
    mr.inputs['To Max'].default_value = fog_max
    nt.links.new(cam.outputs['View Distance'], mr.inputs['Value'])
    mixf = nt.nodes.new('ShaderNodeMix'); mixf.data_type = 'RGBA'
    if col is not None:
        nt.links.new(col, mixf.inputs[6])
    else:
        mixf.inputs[6].default_value = (*color, 1)
    mixf.inputs[7].default_value = (*FOG, 1)
    nt.links.new(mr.outputs['Result'], mixf.inputs['Factor'])
    nt.links.new(mixf.outputs[2], b.inputs['Base Color'])
    # 그림자 쪽도 대기 빛으로 밝혀 멀리 있는 것이 납작하고 뿌옇게 보이게
    b.inputs['Emission Color'].default_value = (*FOG, 1)
    em = nt.nodes.new('ShaderNodeMath'); em.operation = 'MULTIPLY'; em.inputs[1].default_value = glow
    nt.links.new(mr.outputs['Result'], em.inputs[0])
    nt.links.new(em.outputs[0], b.inputs['Emission Strength'])
    return m


M_WATER = principled('han_water', (0.06, 0.09, 0.11), 0.03)
_wn = M_WATER.node_tree
_noise = _wn.nodes.new('ShaderNodeTexNoise'); _noise.inputs['Scale'].default_value = 0.08
_bump = _wn.nodes.new('ShaderNodeBump'); _bump.inputs['Strength'].default_value = 0.04
_wn.links.new(_noise.outputs['Fac'], _bump.inputs['Height'])
_wn.links.new(_bump.outputs['Normal'], _wn.nodes['Principled BSDF'].inputs['Normal'])

M_GRASS = ext_mat('park_grass', (0.22, 0.32, 0.14), 0.95)
M_TREE = ext_mat('park_tree', (0.14, 0.24, 0.10), 0.9)
M_BANK = ext_mat('river_bank', (0.62, 0.6, 0.55), 0.9)
M_TOWERS = [ext_mat(f'apt_tower{i}', c, 0.6, bands=(2.9, (0.32, 0.38, 0.44)))   # 흰·미색·옅은 회색 타워
            for i, c in enumerate([(0.82, 0.81, 0.78), (0.78, 0.76, 0.72), (0.72, 0.73, 0.74)])]
M_LOW = ext_mat('low_bldg', (0.8, 0.78, 0.74), 0.7, bands=(3.6, (0.36, 0.4, 0.45)))
M_MOUNT = ext_mat('mountain', (0.12, 0.22, 0.22), 0.95, fog_far=8000, fog_max=0.5, glow=0.1)
M_LAND = ext_mat('far_land', (0.45, 0.47, 0.42), 0.95)

# 지면·강·강변
box('city_land', CX - 6000, -9000, GZ - 1, CX + 6000, -60, GZ, M_LAND)
RB = -520                                                                                 # 강 건너 둑 위치
box('near_park', CX - 6000, -160, GZ, CX + 6000, -60, GZ + 0.2, M_GRASS)
box('han_river', CX - 6000, RB, GZ + 0.1, CX + 6000, -160, GZ + 0.2, M_WATER)
far_park_w = 140 if VAR == 'c' else 70
box('far_bank', CX - 6000, RB - 15, GZ, CX + 6000, RB, GZ + 1.2, M_BANK)                  # 둑·강변길
box('far_park', CX - 6000, RB - 15 - far_park_w, GZ, CX + 6000, RB - 15, GZ + 1.0, M_GRASS)


# 강변 공원 숲: 나무 한 그루를 공원 띠에 수백 개 흩뿌린다
def scatter_trees(name, y0, y1, count, size):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=(0, 0, -500))
    tree = bpy.context.object
    tree.name = f'{name}_tree'
    tree.scale = (1, 1, 1.25)
    tree.data.materials.append(M_TREE)
    tree.hide_render = False
    bpy.ops.mesh.primitive_plane_add(size=1, location=(CX, (y0 + y1) / 2, GZ + 1.0))
    strip = bpy.context.object
    strip.name = f'{name}_strip'
    strip.scale = (12000, abs(y1 - y0), 1)
    bpy.ops.object.transform_apply(scale=True)
    ps = strip.modifiers.new(f'{name}_ps', 'PARTICLE_SYSTEM').particle_system.settings
    ps.type = 'HAIR'
    ps.count = count
    ps.hair_length = 1
    ps.render_type = 'OBJECT'
    ps.instance_object = tree
    ps.particle_size = size
    ps.size_random = 0.55
    ps.use_advanced_hair = True
    ps.use_rotations = True
    ps.rotation_mode = 'GLOB_Z'
    strip.show_instancer_for_render = False
    tree.location = (0, 0, -500)          # 원본은 화면 밖에
    return strip


scatter_trees('far', RB - 15 - far_park_w, RB - 18, 6500 if VAR == 'c' else 3800, 9.0)

# 아파트 단지: 강 건너에 흰 타워들이 겹겹이 (참고 이미지처럼 20~35층)
y_front = RB - 15 - far_park_w - 30
rows = [(y_front, 0.0), (y_front - 120, 25.0), (y_front - 240, 10.0), (y_front - 380, 40.0)]
hmin, hmax = (55, 95) if VAR == 'c' else (60, 110)
for r, (yr, xoff) in enumerate(rows):
    x = CX - 1700 + xoff
    while x < CX + 1700:
        w = rnd.uniform(28, 46)
        if rnd.random() < 0.12:                 # 가끔 낮고 넓은 건물(학교·병원 같은)
            h, w2 = rnd.uniform(18, 32), rnd.uniform(80, 140)
            box(f'low_{r}_{x:.0f}', x, yr - 28, GZ, x + w2, yr, GZ + h, M_LOW)
            x += w2 + rnd.uniform(15, 30)
            continue
        h = rnd.uniform(hmin, hmax) + r * 6
        box(f'apt_{r}_{x:.0f}', x, yr - 14, GZ, x + w, yr, GZ + h, rnd.choice(M_TOWERS))
        x += w + rnd.uniform(14, 34)

# 뒤쪽 산 능선: 위 가장자리가 들쭉날쭉한 세로 막을 여러 겹 세운다. 멀수록 높고 옅게 (참고 이미지의 겹친 산)
import bmesh


def ridge(name, y, base_h, amp, seed, width=9000, steps=220, fog_far=7000, fog_max=0.55):
    r = random.Random(seed)
    waves = [(r.uniform(300, 1400), r.uniform(0, 6.28), r.uniform(0.3, 1.0)) for _ in range(5)]
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    tops, bots = [], []
    for k in range(steps + 1):
        x = CX - width / 2 + width * k / steps
        h = base_h + amp * sum(a * math.sin(x / L + ph) for L, ph, a in waves) / 3
        tops.append(bm.verts.new((x, y, GZ + max(h, 20))))
        bots.append(bm.verts.new((x, y, GZ - 5)))
    for k in range(steps):
        bm.faces.new((bots[k], bots[k + 1], tops[k + 1], tops[k]))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    o.data.materials.append(ext_mat(f'{name}_mat', (0.13, 0.22, 0.22), 0.95, fog_far=fog_far, fog_max=fog_max, glow=0.12))
    return o


ridge('ridge_far', -5200, 420, 260, 3, fog_far=6500, fog_max=0.72)
ridge('ridge_mid', -3800, 300, 200, 11, fog_far=6500, fog_max=0.6)
ridge('ridge_near', -2600, 170, 130, 23, fog_far=6500, fog_max=0.5)

# 빛: 변형별로 햇빛 색·높이 (lx는 build_apartment.py에서 따로 정한다)
if AIRY:
    pass
elif VAR == 'b':
    sun.data.color = (1.0, 0.78, 0.56)
    sun.data.energy = 3.4
    sun.rotation_euler = (math.radians(72), 0, math.radians(-28))
else:
    sun.data.color = (1.0, 0.95, 0.88)
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(-20))
