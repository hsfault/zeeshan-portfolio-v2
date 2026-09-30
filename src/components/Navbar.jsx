import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, MotionConfig } from "framer-motion";
import { getLenis, scrollToId } from "../hooks/useLenis";
import { navLinks, profile } from "../data/content";
import SpiderMark from "./svg/SpiderMark";

const NEON = "#ff2d4b";
const EASE = [0.76, 0, 0.24, 1];
const DUR = 0.85;

const LINKS = [{ id: "home", label: "Home" }, ...navLinks];

const RAIL_W = 190;
const CUT = 26;

/* ---------- geometry ---------- */
function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

function barBox(w) {
  const width = Math.min(1180, w - 64);
  const L = (w - width) / 2;
  return { L, R: L + width, T: 14, B: 66 };
}

function railBox(w, h) {
  const H = Math.min(540, h - 40);
  const xL = w - RAIL_W;
  const Y0 = h / 2 - H / 2;
  return { xL, Y0, Y1: Y0 + H, H };
}

/* Both shapes use six points in the same clockwise order,
   so the path can morph smoothly from one to the other. */
function framePath(rail, w, h) {
  let pts;
  if (!rail) {
    const { L, R, T, B } = barBox(w);
    const d = 42;
    pts = [[L, T], [R, T], [R - d, B], [(L + R) / 2, B], [L + d, B], [L + d / 2, (T + B) / 2]];
  } else {
    const { xL, Y0, Y1 } = railBox(w, h);
    pts = [[xL + CUT, Y0], [w + 4, Y0], [w + 4, Y1], [xL + CUT, Y1], [xL, Y1 - CUT], [xL, Y0 + CUT]];
  }
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + " Z";
}

/* ---------- pieces ---------- */
function HireHex({ onClick, wide = false }) {
  return (
    <motion.button
      layoutId={wide ? undefined : "nav-hire"}
      type="button"
      onClick={onClick}
      className={`group relative grid h-9 place-items-center ${wide ? "h-12 w-full" : "w-36"}`}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 144 36" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          points="10,1 134,1 143,18 134,35 10,35 1,18"
          fill="rgba(255,45,75,0.06)"
          stroke={NEON}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="transition-[fill] duration-300 group-hover:fill-[rgba(255,45,75,0.22)]"
        />
      </svg>
      <span className="relative flex items-center gap-2 font-body text-[11px] uppercase tracking-[0.22em] text-white">
        Hire me <span style={{ color: NEON }}>→</span>
      </span>
    </motion.button>
  );
}

function TopContent({ w, active, go }) {
  const { L, R, T, B } = barBox(w);
  return (
    <div
      className="fixed z-[45] flex items-center"
      style={{ left: L + 44, width: R - L - 88, top: T, height: B - T }}
    >
      <button type="button" onClick={() => go("home")} className="flex h-11 items-center gap-3" aria-label="Back to top">
        <motion.span layoutId="nav-mark" className="block">
          <SpiderMark size={30} />
        </motion.span>
        <span className="hidden font-body text-[15px] font-light uppercase tracking-[0.4em] text-white xl:inline">
          Zeeshan
        </span>
      </button>

      <ul className="mx-auto flex h-full items-center">
        {LINKS.map((l) => {
          const isActive = active === l.id;
          return (
            <li key={l.id} className="h-full">
              <button
                type="button"
                onClick={() => go(l.id)}
                className={`relative flex h-full items-center px-2.5 font-body text-[11px] uppercase tracking-[0.2em] transition-colors xl:px-4 ${
                  isActive ? "text-[#ff2d4b]" : "text-white/70 hover:text-white"
                }`}
              >
                <motion.span layoutId={`nav-link-${l.id}`} className="block">
                  {l.label}
                </motion.span>
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2.5 bottom-0 h-[2px] xl:inset-x-4"
                    style={{ background: NEON, boxShadow: `0 0 10px ${NEON}` }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <HireHex onClick={() => go("signal")} />
    </div>
  );
}

function RailContent({ w, h, active, go }) {
  const { xL, Y0, H } = railBox(w, h);
  return (
    <nav
      className="fixed z-[45] flex flex-col"
      style={{ left: xL + 30, top: Y0 + 30, width: RAIL_W - 40, height: H - 60 }}
      aria-label="Sections"
    >
      <button type="button" onClick={() => go("home")} className="grid h-12 w-12 place-items-center" aria-label="Back to top">
        <motion.span layoutId="nav-mark" className="block">
          <SpiderMark size={38} />
        </motion.span>
      </button>

      <ul className="relative mt-5 flex flex-col gap-1.5 pl-6">
        <span className="absolute bottom-[18px] left-[3px] top-[18px] w-px" style={{ background: "rgba(255,45,75,0.4)" }} />
        {LINKS.map((l) => {
          const isActive = active === l.id;
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => go(l.id)}
                className={`relative flex h-9 items-center font-body text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive ? "text-[#ff2d4b]" : "text-white/70 hover:text-white"
                }`}
              >
                <span
                  className="absolute -left-6 top-1/2 size-[7px] -translate-y-1/2 rounded-full border bg-[#040407]"
                  style={{ borderColor: "rgba(255,45,75,0.7)" }}
                />
                {isActive && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute -left-6 top-1/2 size-[7px] -translate-y-1/2 rounded-full"
                    style={{ background: NEON, boxShadow: `0 0 10px ${NEON}` }}
                  />
                )}
                <motion.span layoutId={`nav-link-${l.id}`} className="block">
                  {l.label}
                </motion.span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto">
        <HireHex onClick={() => go("signal")} />
      </div>
    </nav>
  );
}

/* ---------- main ---------- */
export default function Navbar() {
  const { w, h } = useViewport();
  const desktop = w >= 1024;

  const [rail, setRail] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  // hysteresis: go to the rail at 75% of the hero, come back at 60%, so it never flickers
  useEffect(() => {
    const check = () => {
      const hero = document.getElementById("home");
      const hH = hero ? hero.offsetHeight : window.innerHeight;
      const y = window.scrollY;
      setRail((prev) => (prev ? y > hH * 0.6 : y > hH * 0.75));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // scroll-spy
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
  }, [open]);

  useEffect(() => {
    if (desktop) setOpen(false);
  }, [desktop]);

  const go = (id) => {
    setOpen(false);
    getLenis()?.start();
    scrollToId(id);
  };

  /* ---------- desktop ---------- */
  if (desktop) {
    const d = framePath(rail, w, h);
    return (
      <MotionConfig transition={{ duration: DUR, ease: EASE }}>
        <LayoutGroup id="nav">
          {/* the frame — one path that morphs between bar and rail */}
          <motion.svg
            className="pointer-events-none fixed inset-0 z-40"
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            aria-hidden="true"
          >
            <motion.path
              initial={false}
              animate={{ d }}
              fill="none"
              stroke={NEON}
              strokeWidth="6"
              strokeOpacity="0.12"
            />
            <motion.path
              initial={false}
              animate={{ d }}
              fill="rgba(4,4,7,0.92)"
              stroke="rgba(255,45,75,0.65)"
              strokeWidth="1"
            />
          </motion.svg>

          {rail ? (
            <RailContent w={w} h={h} active={active} go={go} />
          ) : (
            <TopContent w={w} active={active} go={go} />
          )}
        </LayoutGroup>
      </MotionConfig>
    );
  }

  /* ---------- mobile / tablet ---------- */
  return (
    <>
      <motion.div
        className="fixed inset-x-3 top-3 z-[45] h-14"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 0 L100 0 L96 56 L4 56 Z"
            fill="rgba(4,4,7,0.92)"
            stroke="rgba(255,45,75,0.65)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="relative flex h-full items-center justify-between px-6">
          <button type="button" onClick={() => go("home")} className="flex h-11 items-center gap-2.5" aria-label="Back to top">
            <SpiderMark size={24} />
            <span className="font-body text-[13px] font-light uppercase tracking-[0.35em] text-white">Zeeshan</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="relative flex size-11 flex-col items-end justify-center gap-[5px]"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <motion.span
              className="block h-px bg-white"
              animate={open ? { width: 20, rotate: 45, y: 6 } : { width: 20, rotate: 0, y: 0 }}
            />
            <motion.span
              className="block h-px bg-white/60"
              animate={open ? { width: 0, opacity: 0 } : { width: 13, opacity: 1 }}
            />
            <motion.span
              className="block h-px"
              style={{ background: NEON }}
              animate={open ? { width: 20, rotate: -45, y: -6 } : { width: 16, rotate: 0, y: 0 }}
            />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[42] overflow-hidden bg-[#040407]"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="absolute inset-y-0 right-6 w-px" style={{ background: "rgba(255,45,75,0.25)" }} />

            <ul className="relative mt-28 flex flex-col gap-1 pl-14 pr-8">
              <span className="absolute bottom-6 left-[35px] top-6 w-px" style={{ background: "rgba(255,45,75,0.4)" }} />
              {LINKS.map((l, i) => {
                const isActive = active === l.id;
                return (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.05, duration: 0.4 }}
                  >
                    <button
                      type="button"
                      onClick={() => go(l.id)}
                      className={`relative flex min-h-13 w-full items-center py-3 font-body text-lg uppercase tracking-[0.25em] ${
                        isActive ? "text-[#ff2d4b]" : "text-white/80"
                      }`}
                    >
                      <span
                        className="absolute -left-[24px] top-1/2 size-[9px] -translate-y-1/2 rounded-full border"
                        style={{
                          borderColor: NEON,
                          background: isActive ? NEON : "#040407",
                          boxShadow: isActive ? `0 0 10px ${NEON}` : "none",
                        }}
                      />
                      {l.label}
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              className="absolute inset-x-8 bottom-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <HireHex wide onClick={() => go("signal")} />
              <a
                href={`mailto:${profile.email}`}
                className="mt-4 flex min-h-11 items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/45"
              >
                {profile.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}