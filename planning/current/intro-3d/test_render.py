# Blender 시험 렌더: 방 하나 + 창 하나 + 햇빛. 렌더 엔진·GPU(Metal) 동작과 속도 확인용.
# 실행: blender -b -P test_render.py -- <출력 폴더>
import bpy, sys, time, os

out_dir = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.dirname(__file__)
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, color, rough=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    return m


def box(name, size, loc, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    o.data.materials.append(material)
    return o


plaster = mat('plaster', (0.86, 0.82, 0.76), 0.9)
wood = mat('wood', (0.55, 0.40, 0.27), 0.5)
frame = mat('frame', (0.05, 0.055, 0.06), 0.35)

# 바닥·천장·뒷벽(창 구멍 = 벽 4조각)
box('floor', (6, 5, 0.1), (0, 0, -0.05), wood)
box('ceiling', (6, 5, 0.1), (0, 0, 2.75), plaster)
box('wall_l', (1.5, 0.2, 2.7), (-2.25, 2.5, 1.35), plaster)
box('wall_r', (1.5, 0.2, 2.7), (2.25, 2.5, 1.35), plaster)
box('wall_top', (3, 0.2, 0.5), (0, 2.5, 2.45), plaster)
box('wall_bot', (3, 0.2, 0.1), (0, 2.5, 0.05), plaster)
box('side_l', (0.2, 5, 2.7), (-3, 0, 1.35), plaster)
box('side_r', (0.2, 5, 2.7), (3, 0, 1.35), plaster)
# 창틀 (차콜 슬림)
for n, s, l in [('f_top', (3, 0.12, 0.06), (0, 2.5, 2.17)), ('f_bot', (3, 0.12, 0.06), (0, 2.5, 0.13)),
                ('f_l', (0.06, 0.12, 2.1), (-1.47, 2.5, 1.15)), ('f_r', (0.06, 0.12, 2.1), (1.47, 2.5, 1.15)),
                ('f_mid', (0.05, 0.12, 2.1), (0, 2.5, 1.15))]:
    box(n, s, l, frame)

# 햇빛 + 하늘
bpy.ops.object.light_add(type='SUN', location=(3, 8, 6))
sun = bpy.context.object
sun.data.energy = 4
sun.data.angle = 0.05
sun.rotation_euler = (1.1, 0, 2.6)
world = bpy.data.worlds.new('sky')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.75, 0.85, 1.0, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0

# 카메라
bpy.ops.object.camera_add(location=(-1.6, -2.2, 1.4), rotation=(1.45, 0, -0.45))
scene.camera = bpy.context.object
scene.camera.data.lens = 24

scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.view_settings.view_transform = 'AgX'

results = []
for engine in ['BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'CYCLES']:
    try:
        scene.render.engine = engine
    except TypeError:
        continue
    if engine == 'CYCLES':
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = 'GPU'
        scene.cycles.samples = 64
        scene.cycles.use_denoising = True
    scene.render.filepath = os.path.join(out_dir, f'test_{engine.lower()}.png')
    t = time.time()
    bpy.ops.render.render(write_still=True)
    results.append(f'{engine}: {time.time() - t:.1f}s')

print('RENDER_RESULTS', ' | '.join(results))
