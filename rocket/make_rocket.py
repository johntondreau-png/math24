"""Generate a support-free, 3D-printable display rocket as an STL.

Prints standing upright: the nozzle and fin bottoms sit flat on the bed, every
overhang is 45 degrees or gentler, so no supports are needed.

Usage:  python3 make_rocket.py [--scale 1.0] [--fins 4] [--out rocket.stl]
Requires: numpy, trimesh, manifold3d  (pip install trimesh manifold3d)
"""
import argparse
import numpy as np
import trimesh

# ---- Dimensions in mm (at scale 1.0) ----
BODY_R = 12.0          # body tube radius (24 mm diameter)
NOZZLE_EXIT_R = 9.0    # nozzle bell radius at the bed
NOZZLE_THROAT_R = 6.0
NOZZLE_H = 8.0
BOATTAIL_TOP = 14.0    # boattail cone 45deg from throat up to body
BODY_TOP = 105.0
NOSE_LEN = 45.0
RING_Z = 70.0          # decorative band
RING_R = 12.8
FIN_THICK = 2.4
FIN_SPAN_R = 30.0      # fin tip distance from axis
SEGMENTS = 128


def profile():
    """(r, z) outline of the revolved body, bottom to tip."""
    pts = [(0.0, 0.0), (NOZZLE_EXIT_R, 0.0)]
    # nozzle bell, narrowing upward (no overhang)
    for t in np.linspace(0, 1, 10)[1:]:
        r = NOZZLE_THROAT_R + (NOZZLE_EXIT_R - NOZZLE_THROAT_R) * (1 - t) ** 2
        pts.append((r, NOZZLE_H * t))
    # 45-degree boattail out to the body
    pts.append((BODY_R, BOATTAIL_TOP))
    # body with a chamfered decorative ring
    d = RING_R - BODY_R
    pts += [(BODY_R, RING_Z - d), (RING_R, RING_Z), (RING_R, RING_Z + 2), (BODY_R, RING_Z + 2 + d)]
    pts.append((BODY_R, BODY_TOP))
    # tangent ogive nose cone with a small blunt tip
    rho = (BODY_R ** 2 + NOSE_LEN ** 2) / (2 * BODY_R)
    for x in np.linspace(0, NOSE_LEN, 40)[1:-1]:
        r = np.sqrt(rho ** 2 - x ** 2) + BODY_R - rho
        pts.append((max(r, 0.6), BODY_TOP + x))
    pts.append((0.6, BODY_TOP + NOSE_LEN - 0.3))
    pts.append((0.0, BODY_TOP + NOSE_LEN))
    return np.array(pts)


def revolve(pts, n=SEGMENTS):
    rings, verts, faces = [], [], []
    for r, z in pts:
        if r == 0:
            rings.append([len(verts)])
            verts.append((0, 0, z))
        else:
            start = len(verts)
            a = np.linspace(0, 2 * np.pi, n, endpoint=False)
            verts += list(zip(r * np.cos(a), r * np.sin(a), np.full(n, z)))
            rings.append(list(range(start, start + n)))
    for lo, hi in zip(rings[:-1], rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            if len(lo) == 1:
                faces.append((lo[0], hi[j], hi[i]))
            elif len(hi) == 1:
                faces.append((lo[i], lo[j], hi[0]))
            else:
                faces += [(lo[i], lo[j], hi[j]), (lo[i], hi[j], hi[i])]
    m = trimesh.Trimesh(np.array(verts), np.array(faces), process=True)
    m.fix_normals()
    return m


def fin():
    """Trapezoidal fin: flat bottom on the bed, swept leading edge."""
    outline = [(4.0, 0.0), (FIN_SPAN_R, 0.0), (FIN_SPAN_R, 10.0), (BODY_R - 1, 42.0), (4.0, 42.0)]
    poly = trimesh.path.polygons.Polygon(outline)
    f = trimesh.creation.extrude_polygon(poly, FIN_THICK)  # polygon in XY, extruded along Z
    # map (x=r, y=z, z=thickness) -> (x=r, y=thickness, z=height)
    f.apply_transform(np.array([[1, 0, 0, 0], [0, 0, 1, -FIN_THICK / 2], [0, 1, 0, 0], [0, 0, 0, 1]]))
    return f


def portholes(count=3, z0=82.0, dz=0.0, radius=3.2, depth=0.8):
    holes = []
    for k in range(count):
        c = trimesh.creation.cylinder(radius=radius, height=4.0, sections=48)
        c.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
        c.apply_translation([BODY_R - depth + 2.0, 0, z0 - k * 9.0])
        holes.append(c)
    return trimesh.boolean.union(holes, engine="manifold")


def build(n_fins=4, scale=1.0):
    body = revolve(profile())
    parts = [body]
    for k in range(n_fins):
        f = fin()
        f.apply_transform(trimesh.transformations.rotation_matrix(2 * np.pi * k / n_fins + np.pi / n_fins, [0, 0, 1]))
        parts.append(f)
    rocket = trimesh.boolean.union(parts, engine="manifold")
    rocket = trimesh.boolean.difference([rocket, portholes()], engine="manifold")
    rocket.apply_scale(scale)
    return rocket


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--fins", type=int, default=4)
    ap.add_argument("--out", default="rocket.stl")
    a = ap.parse_args()
    m = build(a.fins, a.scale)
    m.export(a.out)
    ext = m.extents
    print(f"wrote {a.out}: {ext[0]:.1f} x {ext[1]:.1f} x {ext[2]:.1f} mm, "
          f"watertight={m.is_watertight}, volume={m.volume / 1000:.1f} cm^3, triangles={len(m.faces)}")
