import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import heroBase from "../assets/hero-base.png";
import heroSuit from "../assets/hero-suit.png";

const RED = "#e0142c";

/* Measured from the two photos' face boxes. The origin sits on the face,
   so `scale` only grows the body — the face stays locked in place. */
const SUIT_FIT = { scale: 1.16, originX: 46.47, originY: 29.23, x: -0.47, y: 3.47 };

const isTouch = (e) => e.pointerType === "touch";

const inMask = (x, y, r) =>
  `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 54%, rgba(0,0,0,0.55) 78%, transparent 100%)`;
const outMask = (x, y, r) =>
  `radial-gradient(circle ${r}px at ${x}px ${y}px, transparent 46%, rgba(0,0,0,0.45) 74%, #000 100%)`;

export default function SuitReveal({
  radius = 220,
  coarse = false,
  fade = "#07080f",
  hintClassName = "text-white/70",
  className = "",
  style,
}) {
  const ref = useRef(null);
  const baseRef = useRef(null);
  const suitRef = useRef(null);
  const ringRef = useRef(null);
  const holdTimer = useRef(null);
  const raf = useRef(0);
  // current (x, y, r) and target (tx, ty, tr) of the reveal circle
  const s = useRef({ x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0, last: 0 });
  const [touched, setTouched] = useState(false);

  // decode the big suit photo once, up front, so the first reveal is instant
  useEffect(() => {
    const img = new Image();
    img.src = heroSuit;
    img.decode?.().catch(() => {});
  }, []);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(holdTimer.current);
    },
    []
  );

  /* write everything straight to the DOM — ring and suit always share the same numbers */
  const paint = () => {
    const { x, y, r } = s.current;
    const base = baseRef.current;
    const suit = suitRef.current;
    const ring = ringRef.current;
    if (!base || !suit || !ring) return;

    if (r < 0.5) {
      base.style.maskImage = "none";
      base.style.webkitMaskImage = "none";
      suit.style.maskImage = "none";
      suit.style.webkitMaskImage = "none";
      suit.style.opacity = "0";
      ring.style.opacity = "0";
      return;
    }

    const mo = outMask(x, y, r);
    const mi = inMask(x, y, r);
    base.style.maskImage = mo;
    base.style.webkitMaskImage = mo;
    suit.style.maskImage = mi;
    suit.style.webkitMaskImage = mi;
    suit.style.opacity = "1";
    ring.style.opacity = "1";
    ring.style.width = `${r}px`;
    ring.style.height = `${r}px`;
    ring.style.transform = `translate(${x - r / 2}px, ${y - r / 2}px)`;
  };

  /* tiny animation loop — only runs while the circle is moving, opening or closing */
  const loop = (now) => {
    const st = s.current;
    const dt = Math.min((now - (st.last || now)) / 1000, 0.05);
    st.last = now;
    const kp = 1 - Math.exp(-dt * 28); // position follows the cursor fast
    const kr = 1 - Math.exp(-dt * 14); // radius opens a little softer
    st.x += (st.tx - st.x) * kp;
    st.y += (st.ty - st.y) * kp;
    st.r += (st.tr - st.r) * kr;
    paint();

    const settled =
      Math.abs(st.tx - st.x) < 0.3 && Math.abs(st.ty - st.y) < 0.3 && Math.abs(st.tr - st.r) < 0.3;
    if (settled) {
      st.x = st.tx;
      st.y = st.ty;
      st.r = st.tr;
      st.last = 0;
      raf.current = 0;
      paint();
      return;
    }
    raf.current = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  };

  const local = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const openAt = (e) => {
    const p = local(e);
    if (!p) return;
    clearTimeout(holdTimer.current);
    const st = s.current;
    if (st.r < 0.5) {
      // open right under the cursor, never fly in from somewhere else
      st.x = p.x;
      st.y = p.y;
    }
    st.tx = p.x;
    st.ty = p.y;
    st.tr = radius;
    setTouched(true);
    kick();
  };

  const move = (e) => {
    const p = local(e);
    if (!p) return;
    const st = s.current;
    st.tx = p.x;
    st.ty = p.y;
    // mouse is over the photo but the circle is closed (e.g. scrolled in without moving) — open it
    if (!isTouch(e) && st.tr === 0) openAt(e);
    else kick();
  };

  const close = () => {
    s.current.tr = 0;
    kick();
  };

  const release = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(close, 1200);
  };

  return (
    <div
      ref={ref}
      onPointerEnter={(e) => !isTouch(e) && openAt(e)}
      onPointerMove={move}
      onPointerDown={openAt}
      onPointerLeave={(e) => !isTouch(e) && close()}
      onPointerUp={(e) => isTouch(e) && release()}
      onPointerCancel={release}
      className={`relative cursor-crosshair select-none ${coarse ? "touch-pan-y" : "touch-none"} ${className}`}
      style={style}
    >
      {/* base photo */}
      <div ref={baseRef}>
        <img src={heroBase} alt="Zeeshan Ahmad" draggable={false} className="block w-full select-none" />
      </div>

      {/* suit photo — always rendered and decoded, invisible until revealed */}
      <div ref={suitRef} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0 }}>
        <img
          src={heroSuit}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute left-0 top-0 w-full select-none"
          style={{
            transformOrigin: `${SUIT_FIT.originX}% ${SUIT_FIT.originY}%`,
            transform: `translate(${SUIT_FIT.x}%, ${SUIT_FIT.y}%) scale(${SUIT_FIT.scale})`,
          }}
        />
      </div>

      {/* cursor ring */}
      <span
        ref={ringRef}
        className="pointer-events-none absolute left-0 top-0 rounded-full border-2"
        style={{ opacity: 0, borderColor: "rgba(224,20,44,0.7)", willChange: "transform" }}
      />

      {fade && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: `linear-gradient(to top, ${fade} 10%, transparent)` }}
        />
      )}

      <motion.p
        className={`pointer-events-none absolute bottom-5 left-[58%] -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.35em] ${hintClassName}`}
        animate={touched ? { opacity: 0 } : { opacity: [0.35, 1, 0.35] }}
        transition={touched ? { duration: 0.4 } : { duration: 2.6, repeat: Infinity }}
      >
        {coarse ? "Tap to suit up" : (
          <>
            Hover to <span style={{ color: RED }}>suit up</span>
          </>
        )}
      </motion.p>
    </div>
  );
}