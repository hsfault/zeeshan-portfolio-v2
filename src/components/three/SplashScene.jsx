import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { seededRandom } from "../../utils/random";
import { clamp01, damp, easeOutCubic } from "./utils";

/* Picks the display font from src/assets/fonts/ — Chakra Petch first, then anything else found. */
const FONT_FILES = import.meta.glob("../../assets/fonts/*.{ttf,otf,woff}", {
  eager: true,
  query: "?url",
  import: "default",
});
const FONT_ENTRIES = Object.entries(FONT_FILES);
const heroFontUrl = (
  FONT_ENTRIES.find(([path]) => /chakra/i.test(path)) ||
  FONT_ENTRIES.find(([path]) => /bangers|spider/i.test(path)) ||
  FONT_ENTRIES[0] ||
  []
)[1];
if (!heroFontUrl) {
  console.warn("[SplashScene] No font found in src/assets/fonts — using the default font.");
}

const SILK = new THREE.Color(0.95, 0.95, 1.0);
const FRESH = new THREE.Color(0.35, 0.65, 3.4);
const PULSE = new THREE.Color(3.0, 0.12, 0.22);
const SPOKE_END = 0.22;
const easeInCubic = (x) => x * x * x;

/* ---------------- web geometry ---------------- */
function buildWeb({ spokes = 18, R = 5.2, turns = 11, innerR = 0.55, seed = 3, depth = 1.2 }) {
  const rand = seededRandom(seed);
  const step = (Math.PI * 2) / spokes;
  const angles = Array.from({ length: spokes }, (_, i) => i * step + (rand() - 0.5) * 0.08);
  const lens = angles.map(() => R * (0.92 + rand() * 0.16));
  const zAt = (r) => -Math.pow(r / R, 2) * depth;

  const spiral = (s) => {
    const theta = s * turns * Math.PI * 2;
    const f = (theta / step) % 1;
    const r = (R * 0.9 * (1 - s) + innerR * s) * (1 - 0.07 * Math.sin(Math.PI * f));
    return [Math.cos(theta) * r, Math.sin(theta) * r];
  };

  const pos = [];
  const order = [];
  const dist = [];
  const push = (x, y, o) => {
    const r = Math.hypot(x, y);
    pos.push(x, y, zAt(r));
    order.push(o);
    dist.push(r / R);
  };

  const SEG = 10;
  angles.forEach((a, i) => {
    const base = (i / spokes) * SPOKE_END;
    const span = SPOKE_END / spokes;
    for (let s = 0; s < SEG; s++) {
      const t0 = s / SEG;
      const t1 = (s + 1) / SEG;
      push(Math.cos(a) * lens[i] * t0, Math.sin(a) * lens[i] * t0, base + span * t0);
      push(Math.cos(a) * lens[i] * t1, Math.sin(a) * lens[i] * t1, base + span * t1);
    }
  });

  const total = turns * spokes * 6;
  const dOrder = (1 - SPOKE_END) / total;
  let prev = spiral(0);
  for (let k = 1; k <= total; k++) {
    const s = k / total;
    const p = spiral(s);
    const o = SPOKE_END + (1 - SPOKE_END) * s;
    push(prev[0], prev[1], o - dOrder);
    push(p[0], p[1], o);
    prev = p;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aOrder", new THREE.Float32BufferAttribute(order, 1));
  geo.setAttribute("aDist", new THREE.Float32BufferAttribute(dist, 1));

  const head = (p, out) => {
    if (p <= 0) return out.set(0, 0, 0);
    if (p < SPOKE_END) {
      const f = (p / SPOKE_END) * spokes;
      const i = Math.min(Math.floor(f), spokes - 1);
      const r = lens[i] * (f - i);
      return out.set(Math.cos(angles[i]) * r, Math.sin(angles[i]) * r, zAt(r));
    }
    const [x, y] = spiral(clamp01((p - SPOKE_END) / (1 - SPOKE_END)));
    return out.set(x, y, zAt(Math.hypot(x, y)));
  };

  return { geo, head };
}

/* ---------------- shaders ---------------- */
const webVertex = /* glsl */ `
  attribute float aOrder;
  attribute float aDist;
  varying float vOrder;
  varying float vDist;
  void main() {
    vOrder = aOrder;
    vDist = aDist;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const webFragment = /* glsl */ `
  uniform float uProgress;
  uniform float uPulse;
  uniform float uOpacity;
  uniform vec3 uSilk;
  uniform vec3 uFresh;
  uniform vec3 uPulseCol;
  varying float vOrder;
  varying float vDist;
  void main() {
    if (vOrder > uProgress) discard;
    float fresh = exp(-(uProgress - vOrder) * 60.0);
    float core = pow(1.0 - clamp(vDist, 0.0, 1.0), 3.0);
    vec3 col = uSilk * (0.5 + 0.3 * core) + uFresh * fresh * 2.2 + uPulseCol * uPulse * (1.2 + core);
    float a = uOpacity * (0.55 + 0.45 * fresh) * (1.0 - smoothstep(0.85, 1.1, vDist) * 0.6);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

const sparkVertex = /* glsl */ `
  uniform float uPixelRatio;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 46.0 * uPixelRatio;
  }
`;

const sparkFragment = /* glsl */ `
  uniform vec3 uCol;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.2);
    float core = smoothstep(0.12, 0.0, d);
    gl_FragColor = vec4(uCol * glow + vec3(core * 2.0), glow);
    #include <colorspace_fragment>
  }
`;

function makeWebMaterial(opacity) {
  return new THREE.ShaderMaterial({
    vertexShader: webVertex,
    fragmentShader: webFragment,
    uniforms: {
      uProgress: { value: 0 },
      uPulse: { value: 0 },
      uOpacity: { value: opacity },
      uSilk: { value: SILK.clone() },
      uFresh: { value: FRESH.clone() },
      uPulseCol: { value: PULSE.clone() },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ---------------- scene ---------------- */
function Scene({ progress, diveStart }) {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const fontSize = aspect < 1 ? 1.25 * aspect * 1.15 : 1.25;

  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const front = useMemo(() => buildWeb({ seed: 3 }), []);
  const mid = useMemo(() => buildWeb({ seed: 9, spokes: 14, turns: 8, R: 7 }), []);
  const back = useMemo(() => buildWeb({ seed: 17, spokes: 12, turns: 7, R: 9 }), []);

  const frontMat = useMemo(() => makeWebMaterial(1), []);
  const midMat = useMemo(() => makeWebMaterial(0), []);
  const backMat = useMemo(() => makeWebMaterial(0), []);

  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
    return g;
  }, []);
  const sparkMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sparkVertex,
        fragmentShader: sparkFragment,
        uniforms: { uCol: { value: new THREE.Color(0.5, 0.8, 3.4) }, uPixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(
    () => () => {
      [front.geo, mid.geo, back.geo, sparkGeo].forEach((g) => g.dispose());
      [frontMat, midMat, backMat, sparkMat].forEach((m) => m.dispose());
    },
    [front, mid, back, sparkGeo, frontMat, midMat, backMat, sparkMat]
  );

  const frontGroup = useRef();
  const midGroup = useRef();
  const backGroup = useRef();
  const spark = useRef();
  const text = useRef();
  const glow = useRef();
  const bounds = useRef(null);
  const headVec = useMemo(() => new THREE.Vector3(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const camStart = useRef(null);

  useFrame((state, delta) => {
    const p = progress.get();
    const time = state.clock.elapsedTime;

    let diveT = -1;
    let pulse = 0;
    if (diveStart.current) {
      diveT = (performance.now() - diveStart.current) / 1000;
      pulse = Math.sin(clamp01(diveT / 0.45) * Math.PI);
    }

    frontMat.uniforms.uProgress.value = p;
    frontMat.uniforms.uPulse.value = pulse;
    midMat.uniforms.uProgress.value = 1;
    midMat.uniforms.uOpacity.value = 0.3 * clamp01(p * 1.6);
    midMat.uniforms.uPulse.value = pulse * 0.5;
    backMat.uniforms.uProgress.value = 1;
    backMat.uniforms.uOpacity.value = 0.15 * clamp01(p * 1.6);
    backMat.uniforms.uPulse.value = pulse * 0.3;

    if (frontGroup.current) frontGroup.current.rotation.z = time * 0.02;
    if (midGroup.current) midGroup.current.rotation.z = -time * 0.015;
    if (backGroup.current) backGroup.current.rotation.z = time * 0.01;

    if (spark.current) {
      front.head(p, headVec);
      spark.current.position.copy(headVec);
      spark.current.visible = p > 0.001 && p < 0.999;
      sparkMat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }

    // PORTFOLIO + its glow wipe in left -> right
    const reveal = easeOutCubic(clamp01((p - 0.1) / 0.55));
    const on = reveal > 0.001 ? 1 : 0;
    const b = bounds.current;
    const clip = b
      ? [b[0] - 0.4, b[1] - 1, b[0] - 0.4 + (b[2] - b[0] + 0.8) * reveal, b[3] + 1]
      : null;

    if (text.current) {
      if (clip) text.current.clipRect = clip;
      text.current.fillOpacity = on;
      text.current.outlineOpacity = on;
    }
    if (glow.current) {
      if (clip) glow.current.clipRect = clip;
      glow.current.outlineOpacity = on * 0.7;
    }

    const cam = state.camera;
    if (diveT >= 0) {
      if (!camStart.current) camStart.current = cam.position.clone();
      const k = easeInCubic(clamp01((diveT - 0.3) / 1.1));
      const center = Math.min(1, k * 3);
      cam.position.set(
        THREE.MathUtils.lerp(camStart.current.x, 0, center),
        THREE.MathUtils.lerp(camStart.current.y, 0, center),
        THREE.MathUtils.lerp(camStart.current.z, -18, k)
      );
      cam.fov = THREE.MathUtils.lerp(42, 105, k);
      cam.updateProjectionMatrix();
      cam.lookAt(cam.position.x, cam.position.y, cam.position.z - 10);
    } else {
      camTarget.set(
        pointer.current.x * 0.6 + Math.sin(time * 0.35) * 0.25,
        pointer.current.y * 0.4 + Math.cos(time * 0.3) * 0.15,
        9.5 - p * 1.2
      );
      cam.position.lerp(camTarget, damp(delta, 2));
      cam.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <group ref={backGroup} position={[0, 0, -14]}>
        <lineSegments geometry={back.geo} material={backMat} />
      </group>
      <group ref={midGroup} position={[0, 0, -7]}>
        <lineSegments geometry={mid.geo} material={midMat} />
      </group>
      <group ref={frontGroup}>
        <lineSegments geometry={front.geo} material={frontMat} />
        <points ref={spark} geometry={sparkGeo} material={sparkMat} />
      </group>

      <Suspense fallback={null}>
        {/* soft neon glow behind the letters */}
        <Text
          ref={glow}
          font={heroFontUrl}
          fontSize={fontSize}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.55]}
          letterSpacing={0.06}
          fillOpacity={0}
          outlineWidth={0.05}
          outlineBlur={0.14}
          outlineColor="#ff2d4b"
          outlineOpacity={0}
        >
          PORTFOLIO
        </Text>
        {/* dark metal letters with a thin neon edge — the emblem's material */}
        <Text
          ref={text}
          font={heroFontUrl}
          fontSize={fontSize}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.6]}
          color="#1c1c24"
          letterSpacing={0.06}
          outlineWidth={0.014}
          outlineColor="#ff5a70"
          fillOpacity={0}
          outlineOpacity={0}
          onSync={(mesh) => {
            bounds.current = mesh.textRenderInfo?.blockBounds || null;
          }}
        >
          PORTFOLIO
        </Text>
      </Suspense>
    </>
  );
}

export default function SplashScene({ progress, diveStart, onReady }) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 0, 9.5], fov: 42, near: 0.05, far: 60 }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050507");
        onReady?.();
      }}
    >
      <Scene progress={progress} diveStart={diveStart} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={1.15} radius={0.7} />
        <Vignette offset={0.2} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}