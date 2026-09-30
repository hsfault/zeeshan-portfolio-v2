import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { damp, easeOutCubic, phase } from "./utils";
import { seededRandom } from "../../utils/random";

const NEON = new THREE.Color(4.2, 0.22, 0.38);

/* original faceted arachnid — local units, roughly 3 wide x 3.4 tall */
const HEAD = [[0, 0.95], [0.2, 0.62], [0, 0.4], [-0.2, 0.62]];
const ABDOMEN = [[0, 0.36], [0.3, 0.05], [0.22, -0.55], [0, -1.3], [-0.22, -0.55], [-0.3, 0.05]];
const LEGS = [
  { pts: [[0.12, 0.62], [0.62, 1.25], [0.5, 2.05]], w: [0.12, 0.1, 0.015] },
  { pts: [[0.18, 0.48], [1.05, 0.98], [1.32, 1.62]], w: [0.12, 0.1, 0.015] },
  { pts: [[0.2, 0.3], [1.18, 0.02], [1.5, -0.72]], w: [0.12, 0.1, 0.015] },
  { pts: [[0.16, 0.12], [0.86, -0.6], [0.98, -1.62]], w: [0.12, 0.1, 0.015] },
];

const EXTRUDE = {
  depth: 0.1,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.028,
  bevelSegments: 1,
  curveSegments: 1,
};

function polygonShape(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

/* turns a polyline into a tapered solid limb */
function strokeShape(pts, widths) {
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(i - 1, 0)];
    const next = pts[Math.min(i + 1, pts.length - 1)];
    let dx = next[0] - prev[0];
    let dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const hw = widths[i] / 2;
    left.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
    right.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
  }
  return polygonShape([...left, ...right.reverse()]);
}

function buildParts() {
  const rand = seededRandom(21);
  const shapes = [polygonShape(HEAD), polygonShape(ABDOMEN)];
  LEGS.forEach(({ pts, w }) => {
    shapes.push(strokeShape(pts, w));
    shapes.push(strokeShape(pts.map(([x, y]) => [-x, y]), w));
  });

  return shapes.map((shape) => {
    const geo = new THREE.ExtrudeGeometry(shape, EXTRUDE);
    geo.translate(0, 0, -0.05);
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    const dir = new THREE.Vector2(c.x, c.y - 0.2);
    if (dir.lengthSq() < 1e-4) dir.set(0, 1);
    dir.normalize();
    return {
      geo,
      edges: new THREE.EdgesGeometry(geo, 20),
      from: new THREE.Vector3(dir.x * 3.2, dir.y * 3.2, 3 + rand() * 2),
      spin: (rand() - 0.5) * 1.6,
    };
  });
}

export default function Emblem({ getT, pointer, position = [0, 1.45, 0.2], scale = 1.3 }) {
  const group = useRef();
  const partRefs = useRef([]);
  const core = useRef();
  const assembled = useRef(false);

  const parts = useMemo(buildParts, []);
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#17171d",
        metalness: 0.9,
        roughness: 0.3,
        flatShading: true,
      }),
    []
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: NEON.clone(), toneMapped: false, transparent: true }),
    []
  );
  const coreMat = useMemo(() => new THREE.MeshBasicMaterial({ color: NEON.clone(), toneMapped: false }), []);

  useEffect(
    () => () => {
      parts.forEach((p) => {
        p.geo.dispose();
        p.edges.dispose();
      });
      bodyMat.dispose();
      edgeMat.dispose();
      coreMat.dispose();
    },
    [parts, bodyMat, edgeMat, coreMat]
  );

  useFrame((state, delta) => {
    const t = getT();
    const time = state.clock.elapsedTime;

    // fly-in assembly — skipped entirely once finished
    if (!assembled.current) {
      let allDone = true;
      parts.forEach((p, i) => {
        const el = partRefs.current[i];
        if (!el) return;
        const k = easeOutCubic(phase(t, 0.25 + i * 0.07, 1.1));
        if (k < 1) allDone = false;
        const inv = 1 - k;
        el.visible = k > 0.001;
        el.position.set(p.from.x * inv, p.from.y * inv, p.from.z * inv);
        el.rotation.z = p.spin * inv;
        el.scale.setScalar(0.5 + 0.5 * k);
      });
      if (allDone && t > 0) assembled.current = true;
    }

    // neon edges ignite after assembly, then breathe
    const glow = easeOutCubic(phase(t, 1.3, 0.9));
    const g = (0.25 + 0.75 * glow) * (0.88 + 0.12 * Math.sin(time * 2.4));
    edgeMat.color.setRGB(NEON.r * g, NEON.g * g, NEON.b * g);
    edgeMat.opacity = 0.35 + 0.65 * glow;
    if (core.current) core.current.scale.setScalar(0.001 + glow * (1 + 0.15 * Math.sin(time * 3)));

    // follow the mouse
    if (group.current) {
      const k = damp(delta, 2.5);
      group.current.rotation.y += (pointer.current.x * 0.35 - group.current.rotation.y) * k;
      group.current.rotation.x += (-pointer.current.y * 0.18 - group.current.rotation.x) * k;
      group.current.position.y = position[1] + Math.sin(time * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {parts.map((p, i) => (
        <group key={i} ref={(el) => (partRefs.current[i] = el)} visible={false}>
          <mesh geometry={p.geo} material={bodyMat} />
          <lineSegments geometry={p.edges} material={edgeMat} />
        </group>
      ))}
      <mesh ref={core} position={[0, 0.38, 0.12]} material={coreMat} scale={0.001}>
        <octahedronGeometry args={[0.1, 0]} />
      </mesh>
    </group>
  );
}