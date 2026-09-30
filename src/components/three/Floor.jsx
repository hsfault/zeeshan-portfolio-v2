import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easeOutCubic, phase } from "./utils";

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const poolFragment = /* glsl */ `
  uniform vec3 uCol;
  uniform float uI;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float g = pow(1.0 - smoothstep(0.0, 0.5, d), 2.4);
    gl_FragColor = vec4(uCol * g, g * uI);
    #include <colorspace_fragment>
  }
`;

const streakFragment = /* glsl */ `
  uniform vec3 uCol;
  uniform float uI;
  varying vec2 vUv;
  void main() {
    float across = pow(1.0 - abs(vUv.x * 2.0 - 1.0), 2.0);
    float along = pow(vUv.y, 1.6);
    float g = across * along;
    gl_FragColor = vec4(uCol * g, g * uI);
    #include <colorspace_fragment>
  }
`;

const RINGS = [
  { r: 2.2, w: 0.02, arc: Math.PI * 2, speed: 0 },
  { r: 3.6, w: 0.012, arc: Math.PI * 1.35, speed: 0.08 },
  { r: 5.8, w: 0.022, arc: Math.PI * 2, speed: 0 },
  { r: 8.6, w: 0.012, arc: Math.PI * 0.9, speed: -0.05 },
];

const STREAKS = [
  { x: -0.7, w: 0.14 },
  { x: 0, w: 0.22 },
  { x: 0.75, w: 0.12 },
];

export default function Floor({ getT, y = -2.2 }) {
  const ringRefs = useRef([]);

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.3, 0.6, 3.0),
        toneMapped: false,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    []
  );

  const makeGlow = (frag, col) =>
    new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: frag,
      uniforms: { uCol: { value: col }, uI: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

  const poolMat = useMemo(() => makeGlow(poolFragment, new THREE.Color(2.2, 0.1, 0.18)), []);
  const streakMat = useMemo(() => makeGlow(streakFragment, new THREE.Color(2.2, 0.1, 0.18)), []);

  useEffect(
    () => () => {
      ringMat.dispose();
      poolMat.dispose();
      streakMat.dispose();
    },
    [ringMat, poolMat, streakMat]
  );

  useFrame((state, delta) => {
    const t = getT();
    RINGS.forEach((ring, i) => {
      const el = ringRefs.current[i];
      if (!el) return;
      const k = easeOutCubic(phase(t, 1.6 + i * 0.12, 1));
      el.scale.setScalar(Math.max(k, 0.001));
      if (ring.speed) el.rotation.z += delta * ring.speed;
    });
    const glow = phase(t, 1.8, 1.2);
    const pulse = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 1.6);
    poolMat.uniforms.uI.value = glow * 0.9 * pulse;
    streakMat.uniforms.uI.value = glow * 0.55;
  });

  return (
    <group position={[0, y, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#060608" metalness={0.7} roughness={0.32} />
      </mesh>

      {RINGS.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => (ringRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position-y={0.005 + i * 0.002}
          material={ringMat}
        >
          <ringGeometry args={[ring.r, ring.r + ring.w, 160, 1, 0, ring.arc]} />
        </mesh>
      ))}

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0.4]} material={poolMat}>
        <planeGeometry args={[9, 9]} />
      </mesh>

      {STREAKS.map((s, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[s.x, 0.015, 2.8]} material={streakMat}>
          <planeGeometry args={[s.w, 6]} />
        </mesh>
      ))}
    </group>
  );
}