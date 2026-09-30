import { useMemo } from "react";
import { motion } from "framer-motion";

export default function WebPattern({
  size = 600,
  spokes = 16,
  rings = 9,
  sag = 0.12,
  strokeWidth = 1,
  className = "",
  animate = false,
  delay = 0,
  duration = 1.4,
}) {
  const { spokePaths, ringPaths } = useMemo(() => {
    const c = size / 2;
    const r = size / 2;
    const step = (Math.PI * 2) / spokes;
    const angles = Array.from({ length: spokes }, (_, i) => i * step);
    const pt = (a, rad) => [c + Math.cos(a) * rad, c + Math.sin(a) * rad];

    const spokePaths = angles.map((a) => {
      const [x, y] = pt(a, r);
      return `M${c} ${c} L${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    const ringPaths = Array.from({ length: rings }, (_, i) => {
      const rad = r * ((i + 1) / rings);
      let d = "";
      angles.forEach((a, j) => {
        const [x1, y1] = pt(a, rad);
        const [x2, y2] = pt(a + step, rad);
        const [cx, cy] = pt(a + step / 2, rad * (1 - sag));
        if (j === 0) d += `M${x1.toFixed(1)} ${y1.toFixed(1)} `;
        d += `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
      });
      return d;
    });

    return { spokePaths, ringPaths };
  }, [size, spokes, rings, sag]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      {spokePaths.map((d, i) =>
        animate ? (
          <motion.path
            key={`s${i}`}
            d={d}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: delay + i * 0.03, duration: duration * 0.5, ease: "easeOut" }}
          />
        ) : (
          <path key={`s${i}`} d={d} vectorEffect="non-scaling-stroke" />
        )
      )}
      {ringPaths.map((d, i) =>
        animate ? (
          <motion.path
            key={`r${i}`}
            d={d}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: delay + duration * 0.4 + i * 0.07, duration: duration * 0.6, ease: "easeInOut" }}
          />
        ) : (
          <path key={`r${i}`} d={d} vectorEffect="non-scaling-stroke" />
        )
      )}
    </svg>
  );
}