import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useInView, useMotionValue } from "framer-motion";
import { services } from "../data/content";
import { scrollToId } from "../hooks/useLenis";
import { RED, PANEL, EDGE, TEXT, SILK, hexA, HudLabel, MetalTitle, HexButton, panelStyle } from "../components/Comic";

const N = services.length;
const STEP = 360 / N;
const AUTO_EVERY = 4500; // ms between auto-rotations
const IDLE_BEFORE_AUTO = 7000; // pause auto-rotate this long after any interaction

const mod = (a, n) => ((a % n) + n) % n;
const pad = (n) => String(n).padStart(2, "0");

/* chamfered cartridge shape — clip and outline share the same polygon */
const CLIP = "polygon(10% 0, 90% 0, 100% 3.5%, 100% 96.5%, 90% 100%, 10% 100%, 0 96.5%, 0 3.5%)";
const OUTLINE = "10,0 90,0 100,6 100,164 90,170 10,170 0,164 0,6";

function useMedia(query) {
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export default function Services() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.3 });
  const sm = useMedia("(min-width: 640px)");

  const W = sm ? 170 : 118;
  const H = sm ? 290 : 210;
  const R = sm ? 250 : 165;

  const [turn, setTurn] = useState(0); // unbounded, so the drum always takes the short way
  const active = mod(turn, N);
  const lastInteract = useRef(0);
  const rot = useMotionValue(0);

  useEffect(() => {
    const c = animate(rot, -turn * STEP, { type: "spring", stiffness: 60, damping: 15 });
    return () => c.stop();
  }, [turn, rot]);

  // slow auto-rotate while on screen, until someone interacts
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      if (performance.now() - lastInteract.current > IDLE_BEFORE_AUTO) setTurn((t) => t + 1);
    }, AUTO_EVERY);
    return () => clearInterval(id);
  }, [inView]);

  const go = (delta) => {
    lastInteract.current = performance.now();
    setTurn((t) => t + delta);
  };

  const pick = (i) => {
    const half = Math.floor(N / 2);
    const d = mod(i - active + half, N) - half;
    if (d) go(d);
    else lastInteract.current = performance.now();
  };

  const s = services[active];

  return (
    <section
      id="services"
      ref={sectionRef}
      className="night relative z-10 scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 md:py-28 lg:pr-56"
    >
      <div className="halftone-red pointer-events-none absolute -left-40 bottom-0 size-[620px] opacity-20" />

      <div className="relative mx-auto max-w-6xl 2xl:max-w-[1680px]">
        <motion.header
          className="max-w-3xl"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HudLabel>05 — Services</HudLabel>
          <MetalTitle className="mt-4">Services</MetalTitle>
          <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "rgba(201,204,214,0.75)" }}>
            My loadout. <span style={{ color: TEXT }}>Pick a cartridge</span> — each one loads a different way I can help.
          </p>
        </motion.header>

        <div className="mt-12 grid items-center gap-14 lg:grid-cols-2">
          {/* ---------- the drum ---------- */}
          <div>
            <motion.div
              className="relative mx-auto flex w-full justify-center"
              style={{ height: H + 70, perspective: 1100, touchAction: "pan-y" }}
              onPanEnd={(e, info) => {
                if (Math.abs(info.offset.x) > 40) go(info.offset.x < 0 ? 1 : -1);
              }}
            >
              {/* floor ring under the drum */}
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 h-12 w-[78%] -translate-x-1/2 rounded-[50%]"
                style={{
                  border: `1px solid ${hexA(RED, 0.35)}`,
                  background: `radial-gradient(ellipse, ${hexA(RED, 0.25)}, transparent 70%)`,
                }}
              />

              <motion.div
                className="absolute left-1/2 top-[42%]"
                style={{ width: W, height: H, x: "-50%", y: "-50%", rotateY: rot, transformStyle: "preserve-3d" }}
              >
                {services.map((sv, i) => {
                  const rel = mod(i - active, N);
                  const dist = Math.min(rel, N - rel);
                  const on = dist === 0;
                  return (
                    <button
                      key={sv.code}
                      type="button"
                      onClick={() => pick(i)}
                      aria-label={sv.title}
                      aria-pressed={on}
                      className="absolute inset-0"
                      style={{
                        transform: `rotateY(${i * STEP}deg) translateZ(${R}px)`,
                        opacity: [1, 0.45, 0.18][dist] ?? 0.18,
                        transition: "opacity 0.5s ease",
                      }}
                    >
                      <span
                        className="absolute inset-0"
                        style={{
                          clipPath: CLIP,
                          background: on ? `linear-gradient(180deg, ${hexA(RED, 0.22)}, ${PANEL} 55%)` : PANEL,
                        }}
                      />
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 170" preserveAspectRatio="none" aria-hidden="true">
                        <polygon
                          points={OUTLINE}
                          fill="none"
                          stroke={on ? RED : "rgba(201,204,214,0.28)"}
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      <span className="absolute inset-x-0 top-4 text-center font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: SILK }}>
                        S/{pad(i + 1)}
                      </span>

                      {/* energy core */}
                      <span
                        className="absolute left-1/2 top-[18%] h-[40%] w-[2px] -translate-x-1/2 overflow-hidden"
                        style={{
                          background: on ? hexA(RED, 0.35) : "rgba(201,204,214,0.12)",
                          boxShadow: on ? `0 0 14px ${RED}` : "none",
                        }}
                      >
                        {on && (
                          <motion.span
                            className="absolute inset-x-0 h-1/3"
                            style={{ background: `linear-gradient(to bottom, transparent, ${RED}, transparent)` }}
                            animate={{ y: ["-100%", "300%"] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          />
                        )}
                      </span>

                      <span
                        className="absolute inset-x-0 bottom-12 text-center font-hero text-3xl font-bold tracking-[0.04em] sm:text-4xl"
                        style={{ color: on ? TEXT : SILK, textShadow: on ? `0 0 16px ${hexA(RED, 0.55)}` : "none" }}
                      >
                        {sv.code}
                      </span>
                      <span
                        className="absolute inset-x-3 bottom-4 text-center font-mono text-[8px] uppercase leading-tight tracking-[0.2em] sm:text-[9px]"
                        style={{ color: "rgba(201,204,214,0.6)" }}
                      >
                        {sv.title}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* controls */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous service"
                className="grid size-11 place-items-center transition-colors hover:border-[#ff2d4b]"
                style={{ border: `1px solid ${EDGE}`, color: TEXT }}
              >
                ←
              </button>
              <div className="flex">
                {services.map((sv, i) => (
                  <button
                    key={sv.code}
                    type="button"
                    onClick={() => pick(i)}
                    aria-label={`Show ${sv.title}`}
                    className="grid h-11 w-7 place-items-center"
                  >
                    <span
                      className="h-[3px] w-5 transition-colors duration-300"
                      style={{
                        background: i === active ? RED : EDGE,
                        boxShadow: i === active ? `0 0 8px ${RED}` : "none",
                      }}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next service"
                className="grid size-11 place-items-center transition-colors hover:border-[#ff2d4b]"
                style={{ border: `1px solid ${EDGE}`, color: TEXT }}
              >
                →
              </button>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: "rgba(201,204,214,0.45)" }}>
              Drag, swipe or tap a cartridge
            </p>
          </div>

          {/* ---------- the loaded cartridge ---------- */}
          <div className="relative" style={panelStyle(RED, RED)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="p-7 sm:p-9"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* loading strip */}
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: SILK }}>
                  <span>Loading cartridge</span>
                  <span className="relative h-px flex-1" style={{ background: EDGE }}>
                    <motion.span
                      className="absolute inset-0 origin-left"
                      style={{ background: RED, boxShadow: `0 0 8px ${RED}` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </span>
                  <span style={{ color: RED }}>
                    {pad(active + 1)}/{pad(N)}
                  </span>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.35 }}
                >
                  <h3 className="mt-6 font-hero text-3xl font-bold uppercase leading-[1.05] tracking-[0.02em] sm:text-4xl 2xl:text-5xl" style={{ color: TEXT }}>
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed sm:text-base" style={{ color: "rgba(201,204,214,0.8)" }}>
                    {s.blurb}
                  </p>

                  <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: RED }}>
                    What you get
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {s.deliverables.map((d, i) => (
                      <motion.li
                        key={d}
                        className="flex items-start gap-3 text-[15px]"
                        style={{ color: TEXT }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.06, duration: 0.3 }}
                      >
                        <span className="mt-[3px] text-[11px]" style={{ color: RED }}>▸</span>
                        {d}
                      </motion.li>
                    ))}
                  </ul>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-5 pt-6" style={{ borderTop: `1px solid ${EDGE}` }}>
                    <ul className="flex flex-wrap gap-2">
                      {s.stack.map((t) => (
                        <li
                          key={t}
                          className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                          style={{ border: `1px solid ${EDGE}`, color: SILK }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                    <HexButton onClick={() => scrollToId("signal")}>
                      Start this <span aria-hidden="true" style={{ color: RED }}>→</span>
                    </HexButton>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}