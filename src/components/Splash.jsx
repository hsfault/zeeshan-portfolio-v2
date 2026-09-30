import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion, animate, useMotionValue, useMotionValueEvent } from "framer-motion";

const SplashScene = lazy(() => import("./three/SplashScene"));

const RED = "#ff2d4b";
const SILK = "#c9ccd6";
const LOAD_TIME = 3.0;
const DIVE_MS = 1500;

function Counter({ progress, hidden }) {
  const numRef = useRef(null);
  const labelRef = useRef(null);

  useMotionValueEvent(progress, "change", (v) => {
    const n = Math.round(v * 100);
    if (numRef.current) numRef.current.textContent = String(n);
    if (labelRef.current) labelRef.current.textContent = n >= 100 ? "Ready" : "Weaving";
  });

  return (
    <motion.div
      className="pointer-events-none absolute bottom-6 right-5 z-10 text-right sm:bottom-10 sm:right-10"
      initial={{ opacity: 0, y: 16 }}
      animate={hidden ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: hidden ? 0 : 0.3 }}
    >
      <p ref={labelRef} className="font-mono text-[10px] uppercase tracking-[0.45em] sm:text-xs" style={{ color: SILK }}>
        Weaving
      </p>
      <p
        className="font-hero text-7xl font-bold leading-none tracking-[0.02em] sm:text-8xl md:text-9xl"
        style={{ color: "#e6e7ee", textShadow: "0 0 26px rgba(255,45,75,0.5)" }}
      >
        <span ref={numRef}>0</span>
        <span className="align-top text-3xl sm:text-4xl" style={{ color: RED }}>
          %
        </span>
      </p>
      <div className="ml-auto mt-3 h-px w-32 sm:w-48" style={{ background: "rgba(201,204,214,0.15)" }}>
        <motion.div
          className="h-full origin-left"
          style={{ scaleX: progress, background: RED, boxShadow: `0 0 10px ${RED}` }}
        />
      </div>
    </motion.div>
  );
}

export default function Splash({ onComplete }) {
  const progress = useMotionValue(0);
  const [phase, setPhase] = useState("load");
  const [sceneReady, setSceneReady] = useState(false);

  const diveStart = useRef(null);
  const started = useRef(false);
  const diving = useRef(false);
  const loader = useRef(null);
  const timers = useRef([]);
  const done = useRef(onComplete);
  done.current = onComplete;

  const dive = useCallback(() => {
    if (diving.current) return;
    diving.current = true;
    diveStart.current = performance.now();
    setPhase("dive");
    timers.current.push(setTimeout(() => done.current(), DIVE_MS));
  }, []);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    loader.current = animate(progress, 1, {
      duration: LOAD_TIME,
      ease: [0.45, 0.05, 0.3, 1],
      onComplete: () => timers.current.push(setTimeout(dive, 250)),
    });
  }, [progress, dive]);

  useEffect(() => {
    const fallback = setTimeout(start, 2500);
    return () => {
      clearTimeout(fallback);
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (loader.current) {
        loader.current.stop();
        loader.current = null;
        started.current = false;
      }
    };
  }, [start]);

  const onReady = useCallback(() => {
    setSceneReady(true);
    start();
  }, [start]);

  const skip = () => {
    loader.current?.stop();
    started.current = true;
    progress.set(1);
    dive();
  };

  const diveOn = phase === "dive";

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-[#050507]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: sceneReady ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <Suspense fallback={null}>
          <SplashScene progress={progress} diveStart={diveStart} onReady={onReady} />
        </Suspense>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-x-5 top-5 flex justify-between font-mono text-[10px] uppercase tracking-[0.4em] sm:inset-x-10 sm:top-8"
        style={{ color: "rgba(201,204,214,0.5)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: diveOn ? 0 : 1 }}
        transition={{ duration: 0.5, delay: diveOn ? 0 : 0.4 }}
      >
        <span className="flex items-center gap-2">
          <motion.span
            className="size-1.5 rounded-full"
            style={{ background: RED, boxShadow: `0 0 8px ${RED}` }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          Spinning the web
        </span>
        <span className="hidden sm:inline">Zeeshan · Portfolio</span>
      </motion.div>

      <Counter progress={progress} hidden={diveOn} />

      <motion.button
        type="button"
        onClick={skip}
        className="absolute bottom-6 left-5 z-10 min-h-11 font-mono text-[10px] uppercase tracking-[0.35em] transition hover:text-[#e6e7ee] sm:bottom-10 sm:left-10 sm:text-xs"
        style={{ color: "rgba(201,204,214,0.5)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: diveOn ? 0 : 1 }}
        transition={{ delay: diveOn ? 0 : 1, duration: 0.5 }}
      >
        Skip
      </motion.button>

      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle, rgba(255,45,75,0.28), transparent 65%)" }}
        initial={{ opacity: 0 }}
        animate={diveOn ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 bg-[#050507]"
        initial={{ opacity: 0 }}
        animate={{ opacity: diveOn ? 1 : 0 }}
        transition={{ duration: 0.35, delay: diveOn ? DIVE_MS / 1000 - 0.4 : 0 }}
      />
    </motion.div>
  );
}