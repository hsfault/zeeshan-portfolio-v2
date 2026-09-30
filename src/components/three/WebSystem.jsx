import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { damp, phase } from "./utils";
import { seededRandom } from "../../utils/random";

const vertex = /* glsl */ `
  attribute float aDist;
  attribute float aRand;
  varying float vDist;
  varying float vRand;
  void main() {
    vDist = aDist;
    vRand = aRand;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uRed;
  uniform vec3 uBlue;
  varying float vDist;
  varying float vRand;
  void main() {
    float reveal = 1.0 - smoothstep(uReveal - 0.08, uReveal, vDist);
    if (reveal <= 0.001) discard;

    float wave  = fract(vDist * 1.4 - uTime * 0.2 + vRand * 0.15);
    float pulse = exp(-pow((wave - 0.5) * 16.0, 2.0));
    float core  = pow(1.0 - clamp(vDist, 0.0, 1.0), 4.0);
    float front = exp(-pow((vDist - uReveal) * 18.0, 2.0));

    vec3 silk = vec3(0.78, 0.8, 0.9);
    vec3 col = silk * 0.5 + uBlue * (pulse * 0.7 + front * 1.8) + uRed * core * 1.3;
    float fade = 1.0 - smoothstep(0.7, 1.15, vDist);
    float alpha = reveal * fade * (0.2 + pulse * 0.4 + core * 0.45 + front);

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

function buildWeb({ spokes, rings, R, seed }) {
  const rand = seededRandom(seed);
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + (rand() - 0.5) * 0.14);
  const pos = [];
  const dist = [];
  const rnd = [];
  const zAt = (d) => -0.3 - d * 1.4;
  const push = (x, y, d, r) => {
    pos.push(x, y, zAt(d));
    dist.push(d);
    rnd.push(r);
  };

  angles.forEach((a) => {
    const r = rand();
    const len = R * (0.85 + rand() * 0.3);
    const segs = 12;
    for (let s = 0; s < segs; s++) {
      const d0 = s / segs;
      const d1 = (s + 1) / segs;
      push(Math.cos(a) * len * d0, Math.sin(a) * len * d0, (d0 * len) / R, r);
      push(Math.cos(a) * len * d1, Math.sin(a) * len * d1, (d1 * len) / R, r);
    }
  });

  for (let k = 0; k < rings; k++) {
    const rad = R * Math.pow((k + 1) / rings, 1.25) * 0.95;
    for (let i = 0; i < spokes; i++) {
      if (rand() < 0.08) continue;
      const a0 = angles[i];
      const a1 = i === spokes - 1 ? angles[0] + Math.PI * 2 : angles[i + 1];
      const r = rand();
      const sag = 0.8 + rand() * 0.1;
      const p0 = [Math.cos(a0) * rad, Math.sin(a0) * rad];
      const p1 = [Math.cos(a1) * rad, Math.sin(a1) * rad];
      const am = (a0 + a1) / 2;
      const c = [Math.cos(am) * rad * sag, Math.sin(am) * rad * sag];
      let prev = p0;
      const segs = 8;
      for (let s = 1; s <= segs; s++) {
        const t = s / segs;
        const it = 1 - t;
        const x = it * it * p0[0] + 2 * it * t * c[0] + t * t * p1[0];
        const y = it * it * p0[1] + 2 * it * t * c[1] + t * t * p1[1];
        push(prev[0], prev[1], Math.hypot(prev[0], prev[1]) / R, r);
        push(x, y, Math.hypot(x, y) / R, r);
        prev = [x, y];
      }
    }
  }

  for (let s = 0; s < 10; s++) {
    push(0, s * 1.1, (s * 1.1) / R, 0.5);
    push(0, (s + 1) * 1.1, ((s + 1) * 1.1) / R, 0.5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aDist", new THREE.Float32BufferAttribute(dist, 1));
  geo.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd, 1));
  return geo;
}

export default function WebSystem({
  getT,
  pointer,
  position = [0, 1.9, -0.4],
  spokes = 12,
  rings = 7,
  radius = 7.2,
}) {
  const group = useRef();
  const geo = useMemo(() => buildWeb({ spokes, rings, R: radius, seed: 5 }), [spokes, rings, radius]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uRed: { value: new THREE.Color(2.6, 0.1, 0.18) },
          uBlue: { value: new THREE.Color(0.3, 0.6, 3.0) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

  useFrame((state, delta) => {
    const t = getT();
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uReveal.value = phase(t, 1.0, 1.8) * 1.35;
    if (group.current) {
      const k = damp(delta, 1.8);
      group.current.rotation.y += (pointer.current.x * 0.12 - group.current.rotation.y) * k;
      group.current.rotation.x += (-pointer.current.y * 0.06 - group.current.rotation.x) * k;
    }
  });

  return (
    <group ref={group} position={position}>
      <lineSegments geometry={geo} material={mat} />
    </group>
  );
}