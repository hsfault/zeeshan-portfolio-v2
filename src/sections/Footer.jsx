import { useEffect, useRef, useState } from "react";
import { motion, animate, useMotionValue, useScroll, useTransform } from "framer-motion";
import { getLenis, scrollToId } from "../hooks/useLenis";
import { navLinks, profile } from "../data/content";
import SpiderMark from "../components/svg/SpiderMark";
import { RED, EDGE, TEXT, SILK, hexA } from "../components/Comic";

const THREAD = 110; // how far the spider lowers itself

/* live local time in Gujranwala */
function useLocalTime() {
  const fmt = () =>
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" });
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const SOCIALS = [
  { label: "GitHub", href: profile.github },
  { label: "Instagram", href: profile.instagram },
  { label: "Email", href: `mailto:${profile.email}` },
];

export default function Footer() {
  const ref = useRef(null);
  const time = useLocalTime();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });

  // the sign-off name fills with the emblem's material as you reach the bottom
  const fill = useTransform(scrollYProgress, [0.2, 0.95], ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]);

  // the spider lowers as you arrive; `lift` zips it back up on click
  const lift = useMotionValue(0);
  const threadScale = useTransform([scrollYProgress, lift], ([p, l]) => Math.max(0, p) * (1 - l));
  const spiderY = useTransform([scrollYProgress, lift], ([p, l]) => Math.max(0, p) * THREAD * (1 - l) - 22 - l * 30);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const zipUp = () => {
    animate(lift, 1, { duration: 0.35, ease: [0.5, 0, 0.9, 0.4] }).then(() => {
      toTop();
      setTimeout(() => lift.set(0), 1500);
    });
  };

  return (
    <footer
      ref={ref}
      className="relative z-10 overflow-hidden px-4 pb-8 pt-28 sm:px-6 lg:pr-56"
      style={{ background: "#050507", borderTop: `1px solid ${EDGE}` }}
    >
      <div className="halftone-red pointer-events-none absolute -bottom-40 left-1/2 size-[700px] -translate-x-1/2 opacity-20" />

      {/* the spider — back to top */}
      <div className="absolute right-6 top-0 z-10 w-11 sm:right-10 lg:right-64">
        <motion.span
          className="absolute left-1/2 top-0 w-px origin-top -translate-x-1/2"
          style={{
            height: THREAD,
            scaleY: threadScale,
            background: "linear-gradient(to bottom, rgba(201,204,214,0.1), rgba(201,204,214,0.7))",
          }}
        />
        <motion.button
          type="button"
          onClick={zipUp}
          aria-label="Back to top"
          className="absolute left-0 top-0 grid size-11 place-items-center"
          style={{ y: spiderY }}
          whileHover={{ scale: 1.15 }}
        >
          <span className="rotate-180">
            <SpiderMark size={24} />
          </span>
        </motion.button>
      </div>

      <div className="relative mx-auto max-w-6xl 2xl:max-w-[1680px]">
        {/* info row */}
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: RED }}>
              Navigate
            </p>
            <ul className="mt-4 grid gap-1">
              {navLinks.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(l.id)}
                    className="min-h-9 font-mono text-[11px] uppercase tracking-[0.25em] transition-colors hover:text-[#ff2d4b]"
                    style={{ color: SILK }}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: RED }}>
              Elsewhere
            </p>
            <ul className="mt-4 grid gap-1">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center font-mono text-[11px] uppercase tracking-[0.25em] transition-colors hover:text-[#ff2d4b]"
                    style={{ color: SILK }}
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: RED }}>
              Local time
            </p>
            <p className="mt-3 font-hero text-4xl font-bold tracking-[0.04em]" style={{ color: TEXT }}>
              {time} <span className="font-mono text-xs font-normal tracking-[0.3em]" style={{ color: SILK }}>PKT</span>
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "rgba(201,204,214,0.5)" }}>
              {profile.location}
            </p>
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: SILK }}>
              <motion.span
                className="size-1.5 rounded-full"
                style={{ background: RED, boxShadow: `0 0 8px ${RED}` }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              Available for work
            </p>
          </div>
        </div>

        {/* the sign-off — outline, filling with metal + neon as you arrive */}
        <div className="relative mt-20 select-none" aria-hidden="true">
          <p
            className="whitespace-nowrap font-hero font-bold uppercase leading-none tracking-[0.03em]"
            style={{
              fontSize: "clamp(2.4rem, 9vw, 11rem)",
              color: "transparent",
              WebkitTextStroke: "1px rgba(201,204,214,0.22)",
            }}
          >
            Zeeshan Ahmad
          </p>
          <motion.p
            className="absolute inset-0 whitespace-nowrap font-hero font-bold uppercase leading-none tracking-[0.03em]"
            style={{
              fontSize: "clamp(2.4rem, 9vw, 11rem)",
              clipPath: fill,
              color: "transparent",
              backgroundImage: "linear-gradient(180deg, #4a4b5a 0%, #1f1f28 46%, #0f0f15 54%, #2d2e3b 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextStroke: `1px ${RED}`,
              filter: `drop-shadow(0 0 12px ${hexA(RED, 0.45)})`,
            }}
          >
            Zeeshan Ahmad
          </motion.p>
        </div>

        {/* bottom row */}
        <div
          className="mt-10 flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center"
          style={{ borderTop: `1px solid ${EDGE}` }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "rgba(201,204,214,0.45)" }}>
            © {new Date().getFullYear()} {profile.name} · Built with React, Vite & Three.js
          </p>
          <button
            type="button"
            onClick={toTop}
            className="min-h-11 font-mono text-[10px] uppercase tracking-[0.3em] transition-colors hover:text-[#ff2d4b]"
            style={{ color: SILK }}
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}