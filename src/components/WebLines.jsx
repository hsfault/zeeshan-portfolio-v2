import { useEffect, useMemo, useRef, useState } from "react";
import { seededRandom } from "../utils/random";

const BAND_VH = 1.4; // each band of strands is 1.4 screens tall

/* one band: a long strand shot across, a tether from an impact point, sometimes a crossing strand.
   All coordinates are % of the band, so it scales to any screen. */
function buildBand(i) {
  const r = seededRandom(101 + i * 17);
  const lines = [];
  const splats = [];

  // 1) a strand shot clean across the page
  const a = 8 + r() * 30;
  const b = a + 35 + r() * 35;
  lines.push(r() > 0.5 ? { x1: -5, y1: a, x2: 105, y2: b, kind: "across" } : { x1: -5, y1: b, x2: 105, y2: a, kind: "across" });

  // 2) an impact point near one edge, with tethers running back off-screen
  const left = r() > 0.5;
  const sx = left ? 5 + r() * 16 : 79 + r() * 16;
  const sy = 28 + r() * 44;
  const rays = Array.from({ length: 10 }, (_, k) => ({
    a: (k / 10) * Math.PI * 2 + (r() - 0.5) * 0.4,
    len: 10 + r() * 18,
  }));
  splats.push({ x: sx, y: sy, s: 0.85 + r() * 0.5, rays });

  lines.push({ x1: sx, y1: sy, x2: left ? 30 + r() * 50 : 20 + r() * 50, y2: -6, kind: "tether" });
  lines.push({ x1: sx, y1: sy, x2: left ? 55 + r() * 50 : -5 + r() * 40, y2: 106, kind: "tether" });
  if (r() > 0.5) {
    lines.push({ x1: sx, y1: sy, x2: left ? 105 : -5, y2: sy + (r() - 0.5) * 36, kind: "tether" });
  }

  // 3) sometimes a second strand crossing the first
  if (r() > 0.45) {
    const c = 22 + r() * 56;
    lines.push({ x1: 105, y1: c - 22 - r() * 16, x2: -5, y2: c + 22 + r() * 16, kind: "across" });
  }

  return { lines, splats };
}

export default function WebLines() {
  const ref = useRef(null);
  const [bands, setBands] = useState({ count: 0, h: 0 });

  // how many bands fit the page — re-measured if the page grows or the window resizes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const h = Math.round(window.innerHeight * BAND_VH);
      const count = Math.max(1, Math.ceil(el.offsetHeight / h));
      setBands((prev) => (prev.count === count && prev.h === h ? prev : { count, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const data = useMemo(() => Array.from({ length: bands.count }, (_, i) => buildBand(i)), [bands.count]);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {data.map((band, bi) => (
        <svg
          key={bi}
          className="absolute left-0 w-full overflow-visible"
          style={{ top: bi * bands.h, height: bands.h }}
        >
          <defs>
            {band.lines.map((l, li) => (
              <linearGradient
                key={li}
                id={`wl-${bi}-${li}`}
                gradientUnits="userSpaceOnUse"
                x1={`${l.x1}%`}
                y1={`${l.y1}%`}
                x2={`${l.x2}%`}
                y2={`${l.y2}%`}
              >
                {l.kind === "tether" ? (
                  <>
                    <stop offset="0" stopColor="#dfe7ff" stopOpacity="0.8" />
                    <stop offset="0.45" stopColor="#8fb0ff" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#2f6bff" stopOpacity="0" />
                  </>
                ) : (
                  <>
                    <stop offset="0" stopColor="#8fb0ff" stopOpacity="0" />
                    <stop offset="0.18" stopColor="#8fb0ff" stopOpacity="0.5" />
                    <stop offset="0.5" stopColor="#dfe7ff" stopOpacity="0.75" />
                    <stop offset="0.82" stopColor="#2f6bff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#2f6bff" stopOpacity="0" />
                  </>
                )}
              </linearGradient>
            ))}
          </defs>

          {/* strands: soft glow underneath, crisp line on top */}
          {band.lines.map((l, li) => (
            <g key={li}>
              <line
                x1={`${l.x1}%`}
                y1={`${l.y1}%`}
                x2={`${l.x2}%`}
                y2={`${l.y2}%`}
                stroke={`url(#wl-${bi}-${li})`}
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.18"
              />
              <line
                x1={`${l.x1}%`}
                y1={`${l.y1}%`}
                x2={`${l.x2}%`}
                y2={`${l.y2}%`}
                stroke={`url(#wl-${bi}-${li})`}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* impact splats where a web shot hit */}
          {band.splats.map((s, si) => (
            <svg key={si} x={`${s.x}%`} y={`${s.y}%`} overflow="visible">
              <g transform={`scale(${s.s})`}>
                {s.rays.map((ray, ri) => (
                  <line
                    key={ri}
                    x1="0"
                    y1="0"
                    x2={Math.cos(ray.a) * ray.len}
                    y2={Math.sin(ray.a) * ray.len}
                    stroke="rgba(170,195,255,0.6)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                ))}
                <circle r="13" fill="none" stroke="rgba(47,107,255,0.45)" strokeWidth="1.2" />
                <circle r="4.5" fill="#e0142c" />
              </g>
            </svg>
          ))}
        </svg>
      ))}
    </div>
  );
}