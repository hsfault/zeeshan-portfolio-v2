/* Same faceted geometry as the 3D emblem, flattened into an SVG mark.
   Legs are drawn thicker than the 3D version so they read at icon size. */

const HEAD = [[0, 0.95], [0.22, 0.62], [0, 0.38], [-0.22, 0.62]];
const ABDOMEN = [[0, 0.34], [0.32, 0.04], [0.24, -0.56], [0, -1.32], [-0.24, -0.56], [-0.32, 0.04]];
const LEGS = [
  { pts: [[0.12, 0.62], [0.62, 1.25], [0.5, 2.05]], w: [0.22, 0.18, 0.03] },
  { pts: [[0.18, 0.48], [1.05, 0.98], [1.32, 1.62]], w: [0.22, 0.18, 0.03] },
  { pts: [[0.2, 0.3], [1.18, 0.02], [1.5, -0.72]], w: [0.22, 0.18, 0.03] },
  { pts: [[0.16, 0.12], [0.86, -0.6], [0.98, -1.62]], w: [0.22, 0.18, 0.03] },
];

function strokePoints(pts, widths) {
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(i - 1, 0)];
    const next = pts[Math.min(i + 1, pts.length - 1)];
    let dx = next[0] - prev[0];
    let dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const hw = widths[i] / 2;
    left.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
    right.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
  }
  return [...left, ...right.reverse()];
}

// y is flipped because SVG's y axis points down
const toPath = (pts) =>
  "M" + pts.map(([x, y]) => `${x.toFixed(3)} ${(-y).toFixed(3)}`).join(" L") + " Z";

const PATHS = (() => {
  const shapes = [HEAD, ABDOMEN];
  LEGS.forEach(({ pts, w }) => {
    shapes.push(strokePoints(pts, w));
    shapes.push(strokePoints(pts.map(([x, y]) => [-x, y]), w));
  });
  return shapes.map(toPath);
})();

export default function SpiderMark({ size = 32, className = "", glow = true }) {
  return (
    <svg
      viewBox="-1.8 -2.2 3.6 4"
      width={size}
      height={(size * 4) / 3.6}
      className={className}
      style={glow ? { filter: "drop-shadow(0 0 4px rgba(255,45,75,0.65))" } : undefined}
      aria-hidden="true"
    >
      <g fill="#1c0609" stroke="#ff2d4b" strokeWidth="0.08" strokeLinejoin="round">
        {PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path d="M0 -0.52 L0.1 -0.4 L0 -0.28 L-0.1 -0.4 Z" fill="#ff2d4b" />
    </svg>
  );
}