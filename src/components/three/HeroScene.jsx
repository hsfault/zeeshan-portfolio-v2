import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import Emblem from "./Emblem";
import WebSystem from "./WebSystem";
import Floor from "./Floor";
import { damp, easeInOutCubic, phase } from "./utils";

/* Emblem sits behind your head so the legs fan out around you.
   Nudge y or scale if it drifts on your screen. */
const EMBLEM = { position: [0, 1.45, 0.2], scale: 1.3 };
const WEB_CENTER = [0, 1.9, -0.4];
const LOOK_AT = new THREE.Vector3(0, 0.3, 0);

/* No MSAA anywhere — it was the most expensive part of the bloom pass */
const TIERS = {
  high: { dpr: [1, 1.25], bloom: true },
  low: { dpr: 1, bloom: false },
};

function Rig({ getT, pointer }) {
  const target = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const t = getT();
    const settle = easeInOutCubic(phase(t, 0, 3.2));
    const aspect = state.size.width / state.size.height;
    const zoomOut = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    const z = THREE.MathUtils.lerp(15, 9.5, settle) * zoomOut;
    const y = THREE.MathUtils.lerp(4.2, 0.9, settle);
    target.current.set(pointer.current.x * 0.9, y + pointer.current.y * 0.45, z);
    state.camera.position.lerp(target.current, damp(delta, 3));
    state.camera.lookAt(LOOK_AT);
  });
  return null;
}

export default function HeroScene({ ready, active }) {
  const [tier, setTier] = useState("high");
  const q = TIERS[tier];

  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const startRef = useRef(null);
  useEffect(() => {
    if (ready && startRef.current === null) startRef.current = performance.now();
  }, [ready]);
  const getT = useCallback(
    () => (startRef.current === null ? 0 : (performance.now() - startRef.current) / 1000),
    []
  );

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={q.dpr}
      camera={{ position: [0, 4.2, 15], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => gl.setClearColor("#030305")}
    >
      <PerformanceMonitor onDecline={() => setTier("low")} onFallback={() => setTier("low")} flipflops={2} />

      <fog attach="fog" args={["#030305", 12, 30]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 1.6, 3]} color="#ff2040" intensity={40} distance={14} decay={2} />
      <pointLight position={[0, -1.4, 2.5]} color="#ff1030" intensity={18} distance={10} decay={2} />
      <directionalLight position={[-5, 6, 4]} intensity={0.6} color="#c9ccff" />

      <Rig getT={getT} pointer={pointer} />
      <WebSystem getT={getT} pointer={pointer} position={WEB_CENTER} />
      <Emblem getT={getT} pointer={pointer} position={EMBLEM.position} scale={EMBLEM.scale} />
      <Floor getT={getT} />

      {q.bloom && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.95} radius={0.65} />
          <Vignette offset={0.25} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  );
}