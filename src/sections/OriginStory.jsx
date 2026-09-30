import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import SuitReveal from "../components/SuitReveal";
import { RED, NIGHT, SILK, TEXT, EDGE, ChapterTab, panelStyle } from "../components/Comic";

const LAYOUT = {
  huge: { card: "min(780px, 46%)", photo: "min(62vw, 122svh)" },
  xxl: { card: "min(640px, 48%)", photo: "min(60vw, 112svh)" },
  wide: { card: "min(560px, 52%)", photo: "min(56vw, 100svh)" },
};
const RAIL_CLEAR = 220;
const PHOTO_LIFT = "7svh";

const PIN_HEIGHT = { wide: "250svh", narrow: "210svh" };
const FILL_START = 0.06;
const FILL_END = 0.8;

const TITLE_A = "EVERY HERO STARTS";
const TITLE_B = "SOMEWHERE";
const BODY = [
  { text: "I'm Zeeshan — a BSCS student at UCP Gujranwala who wrote his first line of C++ in 2024 and fell for the web a year later. Today I build fast, animated, mobile-first sites with React, Vite and Tailwind for clients, and I'm building " },
  { text: "ARIA", accent: true },
  { text: ", my own desktop AI assistant." },
];
const SIGN = "— Zeeshan \"Leo\" Ahmad · Gujranwala, PK";

const countChars = (s) => [...s.replace(/ /g, "")].length;
const TOTAL =
  countChars(TITLE_A) + countChars(TITLE_B) + BODY.reduce((n, b) => n + countChars(b.text), 0) + countChars(SIGN);

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/* faint silk outline -> lit, per letter */
const INK_CSS = `
.of-ch{color:transparent;-webkit-text-stroke:var(--of-stroke,1px) rgba(201,204,214,.22);transition:color .2s ease,-webkit-text-stroke-color .2s ease,text-shadow .2s ease}
.of-ch.on{color:#e6e7ee;-webkit-text-stroke-color:transparent}
.of-ch.accent.on{color:#ff2d4b;text-shadow:0 0 14px rgba(255,45,75,.45)}
.of-ch.dim.on{color:rgba(201,204,214,.6)}
.of-ch.head{-webkit-text-stroke-color:#2f6bff;text-shadow:0 0 12px rgba(47,107,255,.85)}
.of-body{--of-stroke:.7px}
.of-sign{--of-stroke:.6px}
`;

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

export default function OriginStory() {
  const pinRef = useRef(null);
  const charRefs = useRef([]);
  const filled = useRef(0);
  const head = useRef(-1);

  const huge = useMedia("(min-width: 1800px)");
  const xxl = useMedia("(min-width: 1536px)");
  const wide = useMedia("(min-width: 1024px)");
  const coarse = useMedia("(pointer: coarse)");
  const tier = huge ? LAYOUT.huge : xxl ? LAYOUT.xxl : wide ? LAYOUT.wide : null;

  const shown = useInView(pinRef, { once: true, amount: 0.15 });

  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  const readBar = useTransform(scrollYProgress, [FILL_START, FILL_END], [0, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, FILL_START + 0.06], [1, 0]);

  const apply = (p) => {
    const refs = charRefs.current;
    const target = Math.round(clamp01((p - FILL_START) / (FILL_END - FILL_START)) * TOTAL);
    const cur = filled.current;
    if (target > cur) for (let i = cur; i < target; i++) refs[i]?.classList.add("on");
    else if (target < cur) for (let i = target; i < cur; i++) refs[i]?.classList.remove("on");
    if (head.current >= 0) refs[head.current]?.classList.remove("head");
    if (target > 0 && target < TOTAL) {
      refs[target]?.classList.add("head");
      head.current = target;
    } else {
      head.current = -1;
    }
    filled.current = target;
  };

  useMotionValueEvent(scrollYProgress, "change", apply);
  useEffect(() => {
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let n = 0;
  const letters = (text, extra = "") =>
    text.split(" ").map((word, wi, arr) => (
      <Fragment key={wi}>
        {word && (
          <span className="inline-block whitespace-nowrap">
            {[...word].map((c) => {
              const i = n++;
              return (
                <span key={i} ref={(el) => (charRefs.current[i] = el)} className={`of-ch ${extra}`}>
                  {c}
                </span>
              );
            })}
          </span>
        )}
        {wi < arr.length - 1 ? " " : null}
      </Fragment>
    ));

  const photo = (
    <SuitReveal coarse={coarse} radius={wide ? 220 : 150} fade={NIGHT} hintClassName="text-[#c9ccd6]/70" />
  );

  return (
    <section id="origin" className="night relative z-10">
      <style>{INK_CSS}</style>

      <div ref={pinRef} className="relative" style={{ height: wide ? PIN_HEIGHT.wide : PIN_HEIGHT.narrow }}>
        <div className="sticky top-0 h-svh overflow-hidden">
          <div className="halftone-red pointer-events-none absolute -left-40 top-[5%] size-[560px] opacity-25" />
          {tier && <div className="halftone-blue pointer-events-none absolute bottom-0 right-[8%] size-[640px] opacity-20" />}

          {tier && (
            <motion.div
              className="absolute z-0"
              style={{
                width: tier.photo,
                right: `calc(${RAIL_CLEAR}px - 0.09 * ${tier.photo})`,
                bottom: PHOTO_LIFT,
              }}
              initial={{ opacity: 0, y: 80 }}
              animate={shown ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {photo}
            </motion.div>
          )}

          <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl items-center px-4 sm:px-6 lg:pr-56 2xl:max-w-[1680px]">
            <motion.div
              className="pointer-events-auto relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-[3%] lg:max-w-none"
              style={tier ? { width: tier.card } : undefined}
              initial={{ opacity: 0, y: 40 }}
              animate={shown ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="relative px-7 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10 min-[1800px]:px-14 min-[1800px]:pb-12 min-[1800px]:pt-12"
                style={panelStyle(RED, RED)}
              >
                {/* reading progress */}
                <span className="absolute bottom-8 left-0 top-8 w-px" style={{ background: EDGE }}>
                  <motion.span
                    className="absolute inset-0 origin-top"
                    style={{ scaleY: readBar, background: RED, boxShadow: `0 0 8px ${RED}` }}
                  />
                </span>

                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <ChapterTab>01 — Origin</ChapterTab>
                  <span className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: "rgba(201,204,214,0.45)" }}>
                    2024 → Now
                  </span>
                </div>

                <h2 className="relative mt-6 font-hero text-4xl font-bold uppercase leading-[1.02] tracking-[0.02em] sm:text-5xl 2xl:text-6xl min-[1800px]:text-7xl">
                  {letters(TITLE_A)}
                  <br />
                  {letters(TITLE_B, "accent")}
                </h2>

                <p className="of-body relative mt-5 text-[15px] leading-relaxed sm:text-base 2xl:text-lg min-[1800px]:mt-7 min-[1800px]:text-xl min-[1800px]:leading-[1.75]">
                  {BODY.map((seg, si) => (
                    <Fragment key={si}>{letters(seg.text, seg.accent ? "accent" : "")}</Fragment>
                  ))}
                </p>

                <p
                  className="of-sign relative mt-7 pt-5 font-mono text-[10px] uppercase tracking-[0.3em] min-[1800px]:mt-9 min-[1800px]:pt-6 min-[1800px]:text-xs"
                  style={{ borderTop: `1px solid ${EDGE}` }}
                >
                  {letters(SIGN, "dim")}
                </p>
              </div>

              <motion.p
                className="mt-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em]"
                style={{ opacity: hintOpacity, color: SILK }}
              >
                Scroll to read
                <motion.span style={{ color: RED }} animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                  ↓
                </motion.span>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>

      {!tier && (
        <motion.div
          className="relative mx-auto w-full max-w-xl px-4 pb-12"
          style={{ color: TEXT }}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {photo}
        </motion.div>
      )}
    </section>
  );
}