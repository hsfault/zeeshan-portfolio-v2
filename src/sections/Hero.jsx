import { lazy, Suspense, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { scrollToId } from "../hooks/useLenis";
import { RED, TEXT, SILK, HexButton } from "../components/Comic";

const HeroScene = lazy(() => import("../components/three/HeroScene"));

const OUT = [0.22, 1, 0.36, 1];

/* PORTFOLIO in the emblem's material — dark metal, neon edge, glow */
const METAL_TITLE = {
  color: "transparent",
  backgroundImage: "linear-gradient(180deg, #4a4b5a 0%, #1f1f28 46%, #0f0f15 54%, #2d2e3b 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextStroke: `0.09vw ${RED}`,
  filter: "drop-shadow(0 0 1.2vw rgba(255,45,75,0.45)) drop-shadow(0 0 3vw rgba(47,107,255,0.16))",
};

const T = { scene: 0, word: 2.4, sides: 3.0, chrome: 3.3 };

const SKILLS = [
  "React", "Vite", "Tailwind CSS", "Framer Motion", "Next.js",
  "WordPress", "UI Design", "C++", "Python",
];

function Marquee({ ready }) {
  const row = [...SKILLS, ...SKILLS];
  return (
    <motion.div
      className="absolute bottom-0 left-0 z-30 w-full overflow-hidden py-2.5"
      style={{ background: "rgba(5,5,7,0.92)", borderTop: "1px solid rgba(255,45,75,0.35)" }}
      initial={{ opacity: 0, y: 30 }}
      animate={ready ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: T.chrome, ease: OUT }}
    >
      <motion.div
        className="flex w-max whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {row.map((s, i) => (
          <span key={i} className="flex items-center font-mono text-[11px] uppercase tracking-[0.3em] sm:text-xs" style={{ color: SILK }}>
            <span className="px-5">{s}</span>
            <span className="text-[8px] leading-none" style={{ color: RED }}>◆</span>
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function Hero({ ready }) {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const wordY = useTransform(scrollYProgress, [0, 1], [0, 170]);

  return (
    <section id="home" ref={sectionRef} className="relative isolate min-h-svh overflow-hidden bg-[#050507]">
      <h1 className="sr-only">Zeeshan Ahmad — Freelance Web Developer</h1>

      {/* 3D scene — untouched */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: T.scene }}
      >
        <Suspense fallback={null}>
          <HeroScene ready={ready} active={ready && inView} />
        </Suspense>
      </motion.div>

      {/* faint radar rings + soft light pools (static) */}
      <motion.div
        className="speed-lines pointer-events-none absolute inset-0 z-[1]"
        style={{
          maskImage: "radial-gradient(circle at 50% 50%, transparent 12%, #000 55%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent 12%, #000 55%, transparent 90%)",
        }}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: T.word }}
      />
      <div className="halftone-red pointer-events-none absolute -left-40 -top-40 z-[1] size-[560px] opacity-40" />
      <div className="halftone-blue pointer-events-none absolute -bottom-40 -right-40 z-[1] size-[620px] opacity-40" />

      {/* PORTFOLIO */}
      <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
        <motion.p
          aria-hidden="true"
          className="whitespace-nowrap font-hero font-bold uppercase leading-none tracking-[0.04em]"
          style={{ y: wordY, fontSize: "16vw", paddingBlock: "0.1em", willChange: "transform", ...METAL_TITLE }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={ready ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.1, delay: T.word, ease: OUT }}
        >
          PORTFOLIO
        </motion.p>
      </div>

      {/* friendly neighborhood line */}
      <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] z-30 flex justify-center px-6">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: -16 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: T.sides, ease: OUT }}
        >
          <motion.span
            className="block h-7 w-px origin-top"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(201,204,214,0.7))" }}
            initial={{ scaleY: 0 }}
            animate={ready ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: T.sides - 0.2, ease: OUT }}
          />
          <span className="mb-3 size-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
          <p className="text-center font-body text-[11px] font-light uppercase tracking-[0.5em] sm:text-sm md:text-base" style={{ color: TEXT }}>
            Your friendly neighborhood <span style={{ color: RED }}>developer</span>
          </p>
        </motion.div>
      </div>

      {/* now */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 z-30 flex justify-center px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: T.sides + 0.15, ease: OUT }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.6em]" style={{ color: RED }}>
            02 — Now
          </p>
          <p className="mt-2 font-body text-xs font-light uppercase tracking-[0.42em] sm:text-sm md:text-base" style={{ color: TEXT }}>
            BSCS at UCP · building ARIA, a desktop AI assistant
          </p>
        </motion.div>
      </div>

      {/* left tagline */}
      <div className="pointer-events-none absolute left-8 top-1/2 z-30 hidden -translate-y-1/2 lg:block xl:left-14">
        <motion.div
          className="flex items-stretch gap-6"
          initial={{ opacity: 0, x: -20 }}
          animate={ready ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, delay: T.sides + 0.3, ease: OUT }}
        >
          <div className="relative w-px" style={{ background: "rgba(201,204,214,0.25)" }}>
            <span className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
            <span className="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full" style={{ background: SILK }} />
          </div>
          <p className="py-2 font-body text-xs font-light uppercase leading-[2.2] tracking-[0.55em]" style={{ color: TEXT }}>
            Building<br />the web<br />one line<br />at a time
          </p>
        </motion.div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40"
        style={{ background: "linear-gradient(to top, #050507 30%, transparent)" }}
      />

      {/* status */}
      <motion.div
        className="absolute bottom-28 left-8 z-30 hidden items-center gap-3 lg:flex xl:left-14"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, delay: T.chrome }}
      >
        <motion.span
          className="size-1.5 rounded-full"
          style={{ background: RED, boxShadow: `0 0 8px ${RED}` }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: SILK }}>
          Open for work
        </span>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="absolute right-8 top-[62%] z-30 hidden lg:block xl:right-14"
        initial={{ opacity: 0, x: 20 }}
        animate={ready ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: T.chrome + 0.1, ease: OUT }}
      >
        <HexButton onClick={() => scrollToId("missions")}>
          See the work <span aria-hidden="true" style={{ color: RED }}>→</span>
        </HexButton>
      </motion.div>

      <Marquee ready={ready} />
    </section>
  );
}