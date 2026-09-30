import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { projects } from "../data/content";
import { getLenis, scrollToId } from "../hooks/useLenis";
import { RED, BLUE, EDGE, TEXT, SILK, hexA, HudLabel, MetalTitle, HexButton } from "../components/Comic";

const SEG_VH = 85; // scroll length per project
const pad = (n) => String(n).padStart(2, "0");
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const initials = (t) =>
  t
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w[0] || ""))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/* the blade shape: top-left and bottom-right corners sliced off */
const SHARD = "polygon(0 6%, 6% 0, 100% 0, 100% 90%, 94% 100%, 0 100%)";
const SHARD_PTS = "0,6 6,0 100,0 100,90 94,100 0,100";
const MEDIA_CLIP = "polygon(0 9%, 5% 0, 100% 0, 100% 100%, 0 100%)";

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

/* ---------------- media ---------------- */

function Backdrop({ children }) {
  return (
    <div
      className="relative h-full w-full"
      style={{
        background: `radial-gradient(circle at 72% 28%, ${hexA(RED, 0.2)}, transparent 60%), radial-gradient(circle at 18% 90%, ${hexA(BLUE, 0.18)}, transparent 55%), #08080c`,
      }}
    >
      <div className="speed-lines absolute inset-0" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(${EDGE} 1px, transparent 1px), linear-gradient(90deg, ${EDGE} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {children}
    </div>
  );
}

/* plays only while its project is the one in front of you */
function ReelVideo({ src, poster, playing, onError, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing]);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      onError={onError}
      className={className}
      aria-hidden="true"
    />
  );
}

function Preview({ p, playing }) {
  const [failed, setFailed] = useState(false);
  const media = p.media;

  if (media?.type === "video" && media.orientation !== "landscape" && !failed) {
    return (
      <Backdrop>
        <div className="absolute inset-0 grid place-items-center py-3">
          <div
            className="relative h-full overflow-hidden rounded-[16px]"
            style={{
              aspectRatio: "9 / 16",
              border: `1px solid ${hexA(RED, 0.55)}`,
              boxShadow: `0 0 28px ${hexA(RED, 0.25)}, 0 18px 40px rgba(0,0,0,0.6)`,
              background: "#050507",
            }}
          >
            <ReelVideo
              src={media.src}
              poster={media.poster}
              playing={playing}
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full" style={{ background: "rgba(201,204,214,0.25)" }} />
          </div>
        </div>
      </Backdrop>
    );
  }

  if (media?.type === "video" && media.orientation === "landscape" && !failed) {
    return (
      <ReelVideo
        src={media.src}
        poster={media.poster}
        playing={playing}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  if (media?.type === "image" && !failed) {
    return (
      <img
        src={media.src}
        alt={`${p.title} preview`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-top"
      />
    );
  }

  return (
    <Backdrop>
      <div className="absolute inset-0 grid place-items-center">
        <MetalTitle as="span" size="clamp(3.5rem, 6vw, 6rem)">
          {initials(p.title)}
        </MetalTitle>
      </div>
    </Backdrop>
  );
}

/* ---------------- one shard in 3D space ---------------- */
function Shard({ p, index, n, progress, gap, spread, width, active, canTilt }) {
  const side = index % 2 === 0 ? -1 : 1;

  // depth relative to the camera: 0 = right in front of you
  const z = useTransform(progress, (v) => v * (n - 1) * gap - index * gap);
  const opacity = useTransform(z, (d) => (d > 0 ? clamp01(1 - d / 380) : clamp01(1 + d / (gap * 2.2))));

  // mouse tilt + sheen (only on the card in front of you)
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 18 });
  const sry = useSpring(ry, { stiffness: 150, damping: 18 });
  const sheen = useRef(null);

  const onMove = (e) => {
    if (!active || !canTilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 14);
    rx.set((0.5 - py) * 10);
    if (sheen.current) {
      sheen.current.style.setProperty("--gx", `${px * 100}%`);
      sheen.current.style.setProperty("--gy", `${py * 100}%`);
    }
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      className="absolute top-1/2"
      style={{
        left: `calc(50% + ${side * spread}vw)`,
        width,
        x: "-50%",
        y: "-50%",
        z,
        opacity,
        rotateY: side * -9,
        transformStyle: "preserve-3d",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative"
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
      >
        {/* the shard surface (clip-path lives on its own layer so the 3D content isn't flattened) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: SHARD,
            background: `linear-gradient(170deg, ${hexA(RED, 0.16)} 0%, #0c0c12 38%, #0a0a0f 100%)`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon
            points={SHARD_PTS}
            fill="none"
            stroke={active ? RED : "rgba(201,204,214,0.25)"}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            style={{ transition: "stroke 0.4s ease" }}
          />
        </svg>
        <div
          ref={sheen}
          className="pointer-events-none absolute inset-0"
          style={{
            clipPath: SHARD,
            background: "radial-gradient(circle at var(--gx, 30%) var(--gy, 0%), rgba(201,204,214,0.12), transparent 45%)",
          }}
        />

        {/* layered content — each layer floats at a different depth */}
        <div className="relative p-4 sm:p-5" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="relative aspect-[16/9] overflow-hidden"
            style={{ clipPath: MEDIA_CLIP, transform: "translateZ(24px)" }}
          >
            <Preview p={p} playing={active} />
          </div>

          <div className="px-2 pb-3 pt-5 sm:px-3" style={{ transformStyle: "preserve-3d" }}>
            <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: SILK }}>
              <span>Mission {pad(index + 1)}</span>
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
                {p.status}
              </span>
            </div>

            <h3
              className="mt-3 font-hero text-3xl font-bold uppercase leading-[1.05] tracking-[0.02em] lg:text-4xl"
              style={{ color: TEXT, transform: "translateZ(44px)", textShadow: active ? `0 0 18px ${hexA(RED, 0.35)}` : "none" }}
            >
              {p.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(201,204,214,0.8)", transform: "translateZ(18px)" }}>
              {p.description}
            </p>

            <div className="mt-5 flex min-h-11 flex-wrap items-center justify-between gap-4" style={{ transform: "translateZ(34px)" }}>
              <ul className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t}
                    className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ border: `1px solid ${EDGE}`, color: SILK }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
              {p.link && (
                <HexButton href={p.link}>
                  Open file <span aria-hidden="true" style={{ color: RED }}>↗</span>
                </HexButton>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* HUD gate hanging between projects */
function Gate({ index, n, progress, gap }) {
  const z = useTransform(progress, (v) => v * (n - 1) * gap - index * gap + gap * 0.5);
  const opacity = useTransform(z, (d) => (d > 0 ? clamp01(1 - d / 500) * 0.8 : clamp01(0.7 + d / (gap * 2.5))));
  const corner = "absolute size-8 sm:size-12";
  const line = { borderColor: hexA(RED, 0.7) };
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ width: "88vw", height: "80vh", x: "-50%", y: "-50%", z, opacity, border: `1px solid ${hexA("#c9ccd6", 0.06)}` }}
    >
      <span className={`${corner} -left-px -top-px border-l border-t`} style={line} />
      <span className={`${corner} -right-px -top-px border-r border-t`} style={line} />
      <span className={`${corner} -bottom-px -left-px border-b border-l`} style={line} />
      <span className={`${corner} -bottom-px -right-px border-b border-r`} style={line} />
    </motion.div>
  );
}

/* ---------------- section ---------------- */
export default function Missions() {
  const n = projects.length;
  const wide = useMedia("(min-width: 1024px)");
  const fine = useMedia("(pointer: fine)");
  const reduce = useReducedMotion();

  const gap = wide ? 1000 : 900;
  const spread = wide ? 15 : 0;
  const width = wide ? "min(600px, 42vw)" : "min(560px, 88vw)";

  const sectionRef = useRef(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
    if (i !== activeRef.current) {
      activeRef.current = i;
      setActive(i);
    }
  });

  const jumpTo = (i) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const y = top + range * (i / (n - 1));
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const current = projects[active];

  return (
    <section
      id="missions"
      ref={sectionRef}
      className="night relative z-10"
      style={{ height: `${100 + (n - 1) * SEG_VH}svh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="halftone-red pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-15" />

        {/* the 3D world */}
        <div className="absolute inset-0" style={{ perspective: 1100, perspectiveOrigin: "50% 45%" }}>
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {projects.map((_, i) => (
              <Gate key={`g-${i}`} index={i} n={n} progress={scrollYProgress} gap={gap} />
            ))}
            {projects.map((p, i) => (
              <Shard
                key={p.title}
                p={p}
                index={i}
                n={n}
                progress={scrollYProgress}
                gap={gap}
                spread={spread}
                width={width}
                active={i === active}
                canTilt={fine && !reduce}
              />
            ))}
          </div>
        </div>

        {/* header */}
        <div className="pointer-events-none absolute left-4 top-20 z-20 sm:left-6 lg:left-10 lg:top-24">
          <HudLabel>03 — Missions</HudLabel>
          <MetalTitle className="mt-3" size="clamp(2.2rem, 4vw, 4rem)">
            Missions
          </MetalTitle>
        </div>

        {/* HUD: counter, current project, jump segments */}
        <div className="absolute bottom-6 left-4 z-20 sm:left-6 lg:bottom-10 lg:left-10">
          <div className="flex items-end gap-3">
            <MetalTitle as="span" size="clamp(2.6rem, 5vw, 4.5rem)">
              {pad(active + 1)}
            </MetalTitle>
            <span className="mb-2 font-mono text-xs tracking-[0.3em]" style={{ color: SILK }}>
              / {pad(n)}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={current.title}
              className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.35em] sm:block"
              style={{ color: SILK }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {current.title} · <span style={{ color: RED }}>{current.status}</span>
            </motion.p>
          </AnimatePresence>

          <div className="mt-3 flex">
            {projects.map((p, i) => (
              <button
                key={p.title}
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Go to ${p.title}`}
                className="grid h-11 w-7 place-items-center"
              >
                <span
                  className="h-[3px] w-5 transition-colors duration-300"
                  style={{ background: i === active ? RED : EDGE, boxShadow: i === active ? `0 0 8px ${RED}` : "none" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* CTA + hint */}
        <div className="absolute bottom-8 right-4 z-20 hidden flex-col items-end gap-3 sm:right-6 lg:right-60 lg:flex">
          <HexButton onClick={() => scrollToId("signal")}>
            Send a mission <span aria-hidden="true" style={{ color: RED }}>→</span>
          </HexButton>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: "rgba(201,204,214,0.45)" }}>
            Scroll to fly through ↓
          </span>
        </div>
      </div>
    </section>
  );
}