import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  RED,
  BLUE,
  PANEL,
  PANEL_2,
  EDGE,
  TEXT,
  SILK,
  hexA,
  HudLabel,
  MetalTitle,
  HudTag,
  HexButton,
  panelStyle,
} from "../components/Comic";

const VIOLET = "#8b5cf6";
const CYAN = "#5ee7ff";
const ARIA_LINK = "#"; // TODO: repo, demo video or case study

const EMOTION_COLOR = {
  CONFIDENT: BLUE,
  THINKING: VIOLET,
  EXCITED: RED,
  CURIOUS: CYAN,
};

const SCRIPT = [
  {
    user: "Open VS Code and remind me what I was working on.",
    emotion: "CONFIDENT",
    reply: "Opening VS Code now. Last session you were polishing your portfolio's Skills section — want the notes?",
    tools: ['open_application("VS Code")', 'recall("last project")'],
  },
  {
    user: "Email the client the invoice from my Downloads.",
    emotion: "THINKING",
    reply: "Found invoice.pdf in Downloads and sent it with the attachment. Done.",
    tools: ['search_files("invoice")', "send_email(attachment=invoice.pdf)"],
  },
  {
    user: "Make me a neon city wallpaper.",
    emotion: "EXCITED",
    reply: "Ooh, fun one! Generated it and saved it to your Pictures folder.",
    tools: ['generate_image("neon city")', 'write_file("Pictures/neon-city.png")'],
  },
  {
    user: null,
    emotion: "CURIOUS",
    reply: "You've been quiet for a bit — want to pick up where we left off?",
    tools: ["proactive_idle()"],
  },
];

const CAPS = [
  ["Talks back", "Voice in and out, with emotion-matched speech."],
  ["Remembers you", "Long-term memory that survives restarts."],
  ["Does the work", "Opens apps, manages files, sends email and WhatsApp."],
  ["Feels things", "11 emotions driving a live, lip-synced Live2D avatar."],
  ["Never stalls", "Falls back across three AI models automatically."],
  ["Speaks up", "Checks in on her own when things go quiet."],
];

const STACK = ["Electron", "React", "Live2D", "FastAPI", "SQLite", "Edge TTS"];

/* ---------------- the live console ---------------- */
function Console({ active }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [typed, setTyped] = useState("");
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ cpu: 0.18, ram: 0.42 });

  const sc = SCRIPT[step % SCRIPT.length];
  const color = EMOTION_COLOR[sc.emotion];
  const speaking = phase === "typing";
  const replied = phase === "typing" || phase === "done";
  const shownEmotion = replied ? sc.emotion : "THINKING";
  const orbColor = replied ? color : VIOLET;

  useEffect(() => {
    if (!active) return;
    const timers = [];
    let typer;

    setTyped("");
    setPhase(sc.user ? "user" : "thinking");
    timers.push(setTimeout(() => setPhase("thinking"), sc.user ? 800 : 0));

    timers.push(
      setTimeout(() => {
        setPhase("typing");
        sc.tools.forEach((t, i) =>
          timers.push(setTimeout(() => setLog((l) => [...l.slice(-3), { id: `${step}-${i}`, t }]), i * 450))
        );
        let n = 0;
        typer = setInterval(() => {
          n += 2;
          setTyped(sc.reply.slice(0, n));
          if (n >= sc.reply.length) {
            clearInterval(typer);
            setPhase("done");
            timers.push(setTimeout(() => setStep((s) => s + 1), 2600));
          }
        }, 28);
      }, sc.user ? 1900 : 1100)
    );

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(typer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, active]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setStats({ cpu: 0.12 + Math.random() * (speaking ? 0.5 : 0.25), ram: 0.4 + Math.random() * 0.12 }),
      1300
    );
    return () => clearInterval(id);
  }, [active, speaking]);

  return (
    <div className="relative" style={panelStyle(VIOLET, VIOLET)}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${EDGE}` }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: "rgba(201,204,214,0.55)" }}>
          ARIA // NEXIA OS
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: CYAN }}>
          <motion.span
            className="size-1.5 rounded-full"
            style={{ background: CYAN, boxShadow: `0 0 8px ${CYAN}` }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          Online
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* presence */}
        <div className="flex items-center gap-5">
          <div className="relative grid size-20 shrink-0 place-items-center">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: `1.5px solid ${orbColor}` }}
              animate={speaking ? { scale: [1, 1.3], opacity: [0.8, 0] } : { scale: 1, opacity: 0.35 }}
              transition={speaking ? { duration: 0.9, repeat: Infinity } : { duration: 0.3 }}
            />
            <motion.span
              className="size-14 rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 30%, rgba(223,231,255,0.5), ${orbColor} 45%, #050507 100%)`,
                boxShadow: `0 0 30px ${orbColor}`,
                transition: "background 0.5s ease, box-shadow 0.5s ease",
              }}
              animate={speaking ? { scale: [1, 1.08, 0.97, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, repeat: speaking ? Infinity : 0 }}
            />
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: "rgba(201,204,214,0.45)" }}>
              Emotion
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={shownEmotion}
                className="font-hero text-2xl font-bold tracking-[0.08em] sm:text-3xl"
                style={{ color: orbColor, textShadow: `0 0 16px ${hexA(orbColor, 0.5)}` }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {shownEmotion}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="ml-auto hidden h-10 items-center gap-1 sm:flex" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <motion.span
                key={i}
                className="h-full w-1 origin-center rounded-full"
                style={{ background: orbColor }}
                animate={speaking ? { scaleY: [0.2, 0.5 + ((i * 37) % 50) / 100, 0.25, 0.9, 0.2] } : { scaleY: 0.15 }}
                transition={speaking ? { duration: 0.7 + (i % 3) * 0.15, repeat: Infinity } : { duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* chat */}
        <div className="mt-5 flex h-[250px] flex-col justify-end gap-3 overflow-hidden sm:h-[230px]">
          <AnimatePresence mode="popLayout">
            {sc.user && phase !== "idle" && (
              <motion.div
                key={`u-${step}`}
                className="ml-auto max-w-[85%] px-4 py-2.5 text-[14px] leading-relaxed"
                style={{ background: PANEL_2, border: `1px solid ${EDGE}`, borderRight: `2px solid ${SILK}`, color: TEXT }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {sc.user}
              </motion.div>
            )}

            {(phase === "thinking" || replied) && (
              <motion.div
                key={`a-${step}`}
                className="max-w-[88%] px-4 py-2.5 text-[14px] leading-relaxed"
                style={{ background: PANEL, border: `1px solid ${EDGE}`, borderLeft: `2px solid ${orbColor}`, color: TEXT }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {phase === "thinking" ? (
                  <span className="flex items-center gap-1.5 py-1" aria-label="ARIA is thinking">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="size-1.5 rounded-full"
                        style={{ background: VIOLET }}
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                      />
                    ))}
                  </span>
                ) : (
                  <>
                    <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: orbColor }}>
                      [{sc.emotion}]
                    </span>
                    {typed}
                    {phase === "typing" && (
                      <motion.span
                        className="ml-0.5 inline-block h-4 w-[2px] align-middle"
                        style={{ background: orbColor }}
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* tool calls + stats */}
        <div className="mt-5 grid gap-4 pt-4 sm:grid-cols-[minmax(0,1fr)_140px]" style={{ borderTop: `1px solid ${EDGE}` }}>
          <div className="min-h-[76px]">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: "rgba(201,204,214,0.45)" }}>
              Tool calls
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {log.map((entry) => (
                  <motion.li
                    key={entry.id}
                    className="truncate"
                    style={{ color: SILK }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span style={{ color: VIOLET }}>›</span> <span style={{ color: CYAN }}>{entry.t}</span>{" "}
                    <span style={{ color: BLUE }}>✓</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          <div className="space-y-2.5">
            {[
              ["CPU", stats.cpu, BLUE],
              ["RAM", stats.ram, VIOLET],
            ].map(([label, v, c]) => (
              <div key={label}>
                <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: "rgba(201,204,214,0.5)" }}>
                  <span>{label}</span>
                  <span>{Math.round(v * 100)}%</span>
                </div>
                <div className="mt-1 h-1" style={{ background: EDGE }}>
                  <div
                    className="h-full origin-left"
                    style={{
                      transform: `scaleX(${v})`,
                      background: c,
                      boxShadow: `0 0 8px ${hexA(c, 0.6)}`,
                      transition: "transform 0.8s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- section ---------------- */
export default function AriaSpotlight() {
  const consoleRef = useRef(null);
  const inView = useInView(consoleRef, { amount: 0.35 });

  return (
    <section id="aria" className="night relative z-10 scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 md:py-28 lg:pr-56">
      <div
        className="pointer-events-none absolute -left-40 top-1/3 size-[620px] opacity-30"
        style={{ background: `radial-gradient(circle, ${hexA(VIOLET, 0.35)}, transparent 65%)` }}
      />

      <div className="relative mx-auto max-w-6xl 2xl:max-w-[1680px]">
        <motion.header
          className="max-w-3xl"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HudLabel>04 — Side Mission</HudLabel>
          <MetalTitle className="mt-4">ARIA</MetalTitle>
          <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "rgba(201,204,214,0.75)" }}>
            Autonomous Reasoning & Intelligence Agent — the desktop AI assistant I'm building.{" "}
            <span style={{ color: TEXT }}>Watch her work:</span>
          </p>
        </motion.header>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:gap-14">
          <motion.div
            ref={consoleRef}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Console active={inView} />
          </motion.div>

          <div className="grid gap-10">
            <motion.div
              className="relative px-7 py-8 sm:px-8"
              style={panelStyle(RED, RED)}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <HudLabel>What she can do</HudLabel>

              <ul className="mt-6 grid gap-4">
                {CAPS.map(([title, text], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="pt-1 font-mono text-[11px] tracking-[0.15em]" style={{ color: RED }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-hero text-lg font-semibold uppercase tracking-[0.04em]" style={{ color: TEXT }}>
                        {title}
                      </p>
                      <p className="text-[14px] leading-relaxed" style={{ color: "rgba(201,204,214,0.7)" }}>
                        {text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <ul className="mt-7 flex flex-wrap gap-2 pt-6" style={{ borderTop: `1px solid ${EDGE}` }}>
                {STACK.map((s) => (
                  <li
                    key={s}
                    className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ border: `1px solid ${EDGE}`, color: SILK }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* NEXUS teaser */}
            <motion.div
              className="relative flex items-center gap-6 px-7 py-6"
              style={panelStyle(BLUE, BLUE)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: "rgba(201,204,214,0.45)" }}>
                  Project NEXIA
                </p>
                <p
                  className="mt-1 font-hero text-4xl font-bold uppercase tracking-[0.06em]"
                  style={{ color: TEXT, textShadow: `0 0 18px ${hexA(BLUE, 0.6)}` }}
                >
                  Nexus
                </p>
                <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "rgba(201,204,214,0.7)" }}>
                  Her counterpart. Currently in the lab.
                </p>
              </div>
              <HudTag className="ml-auto size-20 shrink-0" color={BLUE}>
                Soon
              </HudTag>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}