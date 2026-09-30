import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { skills, skillSectors } from "../data/content";
import SpiderMark from "../components/svg/SpiderMark";
import { RED, BLUE, PANEL, EDGE, TEXT, SILK, hexA, HudLabel, MetalTitle, panelStyle } from "../components/Comic";

const SPOKES = 24;
const PER_SECTOR = SPOKES / 4;
const RINGS = [0.16, 0.3, 0.44, 0.58, 0.72, 0.86, 1];
const SAG = 0.92;
const RADIUS_FRAC = 0.43;
const SPIDER_SPEED = 1.1;
const WIND_EVERY = 6;
const SENSE_TIME = 2.4;

const LEVEL_LABEL = { 1: "Daily driver", 2: "Confident", 3: "Exploring" };
const LEVEL_RINGS = { 1: [2, 1], 2: [4, 3], 3: [5, 5] };

const angleOf = (j) => -Math.PI / 2 + (j * Math.PI * 2) / SPOKES;
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

function wave(x, y, t, impulses) {
  let w = 0;
  for (let i = 0; i < impulses.length; i++) {
    const im = impulses[i];
    const age = t - im.t0;
    if (age < 0 || age > 2.4) continue;
    const d = Math.hypot(x - im.x, y - im.y);
    if (d > age * 1.6) continue;
    w += im.amp * Math.exp(-age * 2.4) * Math.exp(-d * 2.2) * Math.sin(d * 26 - age * 30);
  }
  return w;
}

function layoutSkills() {
  return skills.map((s) => {
    const sectorIndex = skillSectors.findIndex((sec) => sec.id === s.sector);
    const inSector = skills.filter((o) => o.sector === s.sector);
    const i = inSector.indexOf(s);
    const spoke = sectorIndex * PER_SECTOR + 1 + i;
    const ring = LEVEL_RINGS[s.level][i % 2];
    const a = angleOf(spoke);
    const r = RINGS[ring];
    return { ...s, sectorIndex, spoke, ring, x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

function buildRoute(from, to) {
  const hub = RINGS[0];
  const fr = Math.hypot(from.x, from.y);
  const fa = Math.atan2(from.y, from.x);
  const ta = Math.atan2(to.y, to.x);
  let da = ta - fa;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  if (fr < hub * 0.5 || Math.abs(da) < 0.05) return [{ x: to.x, y: to.y }];

  const pts = [{ x: Math.cos(fa) * hub, y: Math.sin(fa) * hub }];
  const steps = Math.max(2, Math.ceil(Math.abs(da) / 0.25));
  for (let i = 1; i <= steps; i++) {
    const a = fa + (da * i) / steps;
    pts.push({ x: Math.cos(a) * hub, y: Math.sin(a) * hub });
  }
  pts.push({ x: to.x, y: to.y });
  return pts;
}

function addSpoke(ctx, j, from, to, cx, cy, Rp, t, imp) {
  const a = angleOf(j);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const r = from + ((to - from) * i) / N;
    const x = c * r;
    const y = s * r;
    const w = wave(x, y, t, imp);
    const px = cx + (x - s * w) * Rp;
    const py = cy + (y + c * w) * Rp;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
}

function addRingGap(ctx, k, j, cx, cy, Rp, t, imp) {
  const r = RINGS[k];
  const a0 = angleOf(j);
  const a1 = angleOf(j + 1);
  const am = (a0 + a1) / 2;
  const p0x = Math.cos(a0) * r;
  const p0y = Math.sin(a0) * r;
  const p1x = Math.cos(a1) * r;
  const p1y = Math.sin(a1) * r;
  const qx = Math.cos(am) * r * SAG;
  const qy = Math.sin(am) * r * SAG;
  const M = 6;
  for (let m = 0; m <= M; m++) {
    const u = m / M;
    const iu = 1 - u;
    const x = iu * iu * p0x + 2 * iu * u * qx + u * u * p1x;
    const y = iu * iu * p0y + 2 * iu * u * qy + u * u * p1y;
    const len = Math.hypot(x, y) || 1;
    const w = wave(x, y, t, imp);
    const px = cx + (x + (x / len) * w) * Rp;
    const py = cy + (y + (y / len) * w) * Rp;
    if (m === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
}

/* silk strands, neon selection, volt spider-sense */
function drawWeb(ctx, S, t, reveal, imp, active, hoverSector, senseAge) {
  const cx = S / 2;
  const cy = S / 2;
  const Rp = S * RADIUS_FRAC;
  ctx.clearRect(0, 0, S, S);

  if (hoverSector !== null) {
    const a0 = angleOf(hoverSector * PER_SECTOR);
    const a1 = angleOf((hoverSector + 1) * PER_SECTOR);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, Rp * 1.04, a0, a1);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,45,75,0.07)";
    ctx.fill();
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(201,204,214,0.22)";
  ctx.beginPath();
  for (let j = 0; j < SPOKES; j++) addSpoke(ctx, j, 0, 1.04 * reveal, cx, cy, Rp, t, imp);
  ctx.stroke();

  for (let k = 0; k < RINGS.length; k++) {
    const vis = clamp01((reveal * 1.04 - RINGS[k]) / 0.15);
    if (vis <= 0) continue;
    ctx.globalAlpha = vis;
    ctx.beginPath();
    for (let j = 0; j < SPOKES; j++) addRingGap(ctx, k, j, cx, cy, Rp, t, imp);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = SILK;
  ctx.fill();

  if (active && reveal >= 1) {
    ctx.beginPath();
    addSpoke(ctx, active.spoke, 0, RINGS[active.ring], cx, cy, Rp, t, imp);
    addRingGap(ctx, active.ring, active.spoke - 1, cx, cy, Rp, t, imp);
    addRingGap(ctx, active.ring, active.spoke, cx, cy, Rp, t, imp);
    ctx.strokeStyle = "rgba(255,45,75,0.22)";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = RED;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    if (senseAge >= 0 && senseAge < SENSE_TIME) {
      const ax = cx + active.x * Rp;
      const ay = cy + active.y * Rp;
      const fade = 1 - senseAge / SENSE_TIME;
      for (let k = 0; k < 3; k++) {
        const age = senseAge - k * 0.3;
        if (age < 0) continue;
        const f = (age % 0.9) / 0.9;
        ctx.beginPath();
        ctx.arc(ax, ay, 10 + f * Rp * 0.22, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(47,107,255,${((1 - f) * 0.85 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}

export default function Arsenal() {
  const webRef = useRef(null);
  const canvasRef = useRef(null);
  const spiderRef = useRef(null);

  const entered = useInView(webRef, { once: true, amount: 0.35 });
  const visible = useInView(webRef, { amount: 0.05 });
  const reduce = useReducedMotion();

  const nodes = useMemo(layoutSkills, []);
  const [active, setActive] = useState(0);
  const [hoverSector, setHoverSector] = useState(null);

  const activeRef = useRef(null);
  const hoverRef = useRef(null);
  const impulses = useRef([]);
  const sizeRef = useRef(0);
  const revealStart = useRef(null);
  const senseStart = useRef(-100);
  const lastWind = useRef(0);
  const dirty = useRef(true);
  const spider = useRef({ pos: { x: 0, y: -1.3 }, route: [], angle: Math.PI / 2 });

  const now = () => performance.now() / 1000;

  const select = useCallback(
    (i) => {
      const n = nodes[i];
      setActive(i);
      activeRef.current = n;
      impulses.current.push({ x: n.x, y: n.y, t0: now(), amp: 0.03 });
      spider.current.route = buildRoute(spider.current.pos, n);
      dirty.current = true;
    },
    [nodes]
  );

  const pluckSector = (s) => {
    const a = angleOf(s * PER_SECTOR + PER_SECTOR / 2);
    impulses.current.push({ x: Math.cos(a) * 0.7, y: Math.sin(a) * 0.7, t0: now(), amp: 0.05 });
    const first = nodes.findIndex((n) => n.sectorIndex === s);
    if (first >= 0) select(first);
  };

  useEffect(() => {
    hoverRef.current = hoverSector;
    dirty.current = true;
  }, [hoverSector]);

  useEffect(() => {
    const el = webRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      const S = entry.contentRect.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = S;
      canvas.width = Math.round(S * dpr);
      canvas.height = Math.round(S * dpr);
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty.current = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!entered) return;
    revealStart.current = now();
    spider.current.pos = { x: 0, y: -1.3 };
    spider.current.route = [{ x: 0, y: 0 }];
    const t = setTimeout(() => select(0), 1700);
    return () => clearTimeout(t);
  }, [entered, select]);

  useEffect(() => {
    if (!entered || !visible) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let last = now();
    dirty.current = true;

    const placeSpider = (S) => {
      if (!spiderRef.current) return;
      const sp = spider.current;
      const Rp = S * RADIUS_FRAC;
      const px = S / 2 + sp.pos.x * Rp;
      const py = S / 2 + sp.pos.y * Rp;
      spiderRef.current.style.transform = `translate(${px}px, ${py}px) rotate(${(sp.angle * 180) / Math.PI + 90}deg)`;
    };

    const tick = () => {
      const t = now();
      const dt = Math.min(t - last, 0.05);
      last = t;
      const S = sizeRef.current;

      if (S > 0) {
        const reveal = easeOutCubic(clamp01((t - (revealStart.current ?? t)) / 1.4));

        if (!reduce && t - lastWind.current > WIND_EVERY) {
          lastWind.current = t;
          const a = Math.random() * Math.PI * 2;
          impulses.current.push({ x: Math.cos(a), y: Math.sin(a), t0: t, amp: 0.006 });
        }
        if (impulses.current.length) impulses.current = impulses.current.filter((im) => t - im.t0 < 2.5);

        const sp = spider.current;
        const moving = sp.route.length > 0;
        if (moving) {
          const tgt = sp.route[0];
          const dx = tgt.x - sp.pos.x;
          const dy = tgt.y - sp.pos.y;
          const dist = Math.hypot(dx, dy);
          const step = SPIDER_SPEED * dt;
          if (dist > 1e-4) sp.angle = Math.atan2(dy, dx);
          if (dist <= step) {
            sp.pos = { x: tgt.x, y: tgt.y };
            sp.route.shift();
            if (!sp.route.length) {
              impulses.current.push({ x: tgt.x, y: tgt.y, t0: t, amp: 0.014 });
              const a = activeRef.current;
              if (a && Math.abs(a.x - tgt.x) < 1e-6 && Math.abs(a.y - tgt.y) < 1e-6) senseStart.current = t;
            }
          } else {
            sp.pos = { x: sp.pos.x + (dx / dist) * step, y: sp.pos.y + (dy / dist) * step };
          }
        }

        const senseAge = t - senseStart.current;
        const needDraw = reveal < 1 || impulses.current.length > 0 || senseAge < SENSE_TIME || dirty.current;
        if (needDraw) {
          drawWeb(ctx, S, t, reveal, impulses.current, activeRef.current, hoverRef.current, senseAge);
          dirty.current = false;
        }
        if (moving || needDraw) placeSpider(S);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [entered, visible, reduce]);

  const skill = nodes[active];
  const bars = 4 - skill.level;

  return (
    <section id="skills" className="night relative z-10 scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 md:py-28 lg:pr-56">
      <div className="halftone-blue pointer-events-none absolute -right-40 top-20 size-[600px] opacity-25" />

      <div className="relative mx-auto max-w-6xl 2xl:max-w-[1680px]">
        <motion.header
          className="max-w-3xl"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HudLabel>02 — Skills</HudLabel>
          <MetalTitle className="mt-4">Skills</MetalTitle>
          <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "rgba(201,204,214,0.75)" }}>
            Everything I've caught in my web. The closer to the centre, the tighter the grip —{" "}
            <span style={{ color: TEXT }}>touch a thread and feel it tremble.</span>
          </p>
        </motion.header>

        <div className="mt-10 grid items-center gap-12 lg:mt-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] xl:gap-14">
          {/* the web */}
          <div ref={webRef} className="relative mx-auto aspect-square w-full max-w-[700px] 2xl:max-w-[820px]">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

            {skillSectors.map((sec, s) => {
              const a = angleOf(s * PER_SECTOR + PER_SECTOR / 2);
              const r = RADIUS_FRAC * 1.16;
              const right = Math.cos(a) >= 0;
              const on = skill.sectorIndex === s;
              return (
                <motion.button
                  key={sec.id}
                  type="button"
                  onClick={() => pluckSector(s)}
                  onMouseEnter={() => setHoverSector(s)}
                  onMouseLeave={() => setHoverSector(null)}
                  className="absolute z-10 flex min-h-11 items-center whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] transition-colors sm:text-[11px]"
                  style={{
                    left: `${50 + Math.cos(a) * r * 100}%`,
                    top: `${50 + Math.sin(a) * r * 100}%`,
                    transform: `translate(${right ? "-20%" : "-80%"}, -50%)`,
                    color: on ? RED : "rgba(201,204,214,0.55)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={entered ? { opacity: 1 } : {}}
                  transition={{ delay: 1.2 + s * 0.1, duration: 0.5 }}
                >
                  {sec.label}
                </motion.button>
              );
            })}

            {nodes.map((n, i) => {
              const on = i === active;
              return (
                <motion.button
                  key={n.name}
                  type="button"
                  onMouseEnter={() => select(i)}
                  onFocus={() => select(i)}
                  onClick={() => select(i)}
                  aria-label={`${n.name} — ${LEVEL_LABEL[n.level]}`}
                  aria-pressed={on}
                  className="absolute z-10 grid min-h-11 min-w-11 place-items-center"
                  style={{
                    left: `${50 + n.x * RADIUS_FRAC * 100}%`,
                    top: `${50 + n.y * RADIUS_FRAC * 100}%`,
                    x: "-50%",
                    y: "-50%",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={entered ? { opacity: 1, scale: 1 } : {}}
                  whileHover={{ scale: 1.1 }}
                  transition={{ delay: 1 + i * 0.05, type: "spring", stiffness: 260, damping: 18 }}
                >
                  <span
                    className="px-2 py-0.5 font-hero text-sm font-semibold uppercase tracking-[0.06em] transition-all duration-200 sm:px-2.5 sm:text-base lg:text-[17px]"
                    style={
                      on
                        ? {
                            background: hexA(RED, 0.16),
                            color: TEXT,
                            border: `1px solid ${RED}`,
                            boxShadow: `0 0 16px ${hexA(RED, 0.45)}`,
                          }
                        : { background: PANEL, color: TEXT, border: `1px solid ${EDGE}` }
                    }
                  >
                    {n.code}
                  </span>
                </motion.button>
              );
            })}

            <div
              ref={spiderRef}
              className="pointer-events-none absolute left-0 top-0 z-20 h-0 w-0"
              style={{ opacity: entered ? 1 : 0, transition: "opacity 0.4s", willChange: "transform" }}
            >
              <div className="absolute -translate-x-1/2 -translate-y-1/2">
                <SpiderMark size={26} />
              </div>
            </div>
          </div>

          {/* readout */}
          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative px-7 py-8 sm:px-9 sm:py-10" style={panelStyle(RED, RED)}>
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.45em] sm:text-[10px]" style={{ color: "rgba(201,204,214,0.55)" }}>
                <motion.span
                  className="size-1.5 rounded-full"
                  style={{ background: BLUE, boxShadow: `0 0 8px ${BLUE}` }}
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                Spider-sense · target locked
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: RED }}>
                    {skillSectors[skill.sectorIndex].label}
                  </p>
                  <h3 className="mt-2 font-hero text-4xl font-bold uppercase leading-[1.05] tracking-[0.02em] sm:text-5xl 2xl:text-6xl" style={{ color: TEXT }}>
                    {skill.name}
                  </h3>

                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex gap-1.5" aria-hidden="true">
                      {[0, 1, 2].map((b) => (
                        <span
                          key={b}
                          className="h-1.5 w-10 sm:w-12"
                          style={{
                            background: b < bars ? RED : EDGE,
                            boxShadow: b < bars ? `0 0 10px ${hexA(RED, 0.55)}` : "none",
                          }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: SILK }}>
                      {LEVEL_LABEL[skill.level]}
                    </span>
                  </div>

                  <p className="mt-6 text-[15px] leading-relaxed sm:text-base" style={{ color: "rgba(201,204,214,0.8)" }}>
                    {skill.note}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div
                className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-5 font-mono text-[10px] uppercase tracking-[0.35em]"
                style={{ borderTop: `1px solid ${EDGE}`, color: "rgba(201,204,214,0.5)" }}
              >
                <span>{nodes.length} skills in the web</span>
                <span className="hidden sm:inline">Hover · tap · pluck</span>
              </div>
            </div>

            <ul className="mt-7 grid gap-2.5 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "rgba(201,204,214,0.55)" }}>
              {[
                ["Inner web", "Daily driver", 1],
                ["Middle web", "Confident", 0.55],
                ["Outer web", "Exploring", 0.25],
              ].map(([zone, meaning, o]) => (
                <li key={zone} className="flex items-center gap-3">
                  <span className="size-1.5 rounded-full" style={{ background: RED, opacity: o, boxShadow: `0 0 8px ${hexA(RED, o)}` }} />
                  <span style={{ color: TEXT }}>{zone}</span>
                  <span style={{ color: "rgba(201,204,214,0.45)" }}>— {meaning}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}