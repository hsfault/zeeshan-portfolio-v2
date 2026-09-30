/* ============================================================
   SITE THEME — "suit-tech", built from the hero's 3D art.
   Change colours here and every section follows.
   (Filename kept as Comic.jsx so existing imports still work.)
   ============================================================ */

export const RED = "#ff2d4b"; // neon — the emblem's glowing edges
export const BLUE = "#2f6bff"; // volt — web pulses and floor rings
export const DEEP_BLUE = "#1f3fae";
export const NIGHT = "#050507"; // void — page + navbar
export const PANEL = "#0c0c12"; // graphite
export const PANEL_2 = "#121219";
export const METAL = "#17171d"; // the emblem's body
export const SILK = "#c9ccd6"; // web strands / secondary text
export const EDGE = "rgba(201,204,214,0.14)";
export const TEXT = "#e6e7ee";
export const DARK = "#050507";

export const hexA = (hex, a) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* graphite panel: silk edge, neon hairline across the top, soft glow */
export const panelStyle = (accent = RED, glow = RED) => ({
  backgroundColor: PANEL,
  backgroundImage: `linear-gradient(90deg, ${accent}, transparent 55%)`,
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 1px",
  border: `1px solid ${EDGE}`,
  boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 40px ${hexA(glow, 0.08)}`,
});

/* HUD marker: red dot · spaced mono caps · trailing hairline */
export function ChapterTab({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.45em] sm:text-[11px] ${className}`}
      style={{ color: SILK }}
    >
      <span className="size-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 10px ${RED}` }} />
      {children}
      <span className="h-px w-10" style={{ background: `linear-gradient(90deg, ${RED}, transparent)` }} />
    </span>
  );
}

/* title made of the emblem's material: dark metal, neon edge, glow */
export function ComicTitle({ children, size = "clamp(3rem, 8vw, 7rem)", as: Tag = "h2", className = "" }) {
  return (
    <Tag
      className={`whitespace-nowrap font-hero font-bold uppercase leading-none tracking-[0.03em] ${className}`}
      style={{
        fontSize: size,
        paddingBlock: "0.08em",
        color: "transparent",
        backgroundImage: "linear-gradient(180deg, #454654 0%, #1e1e27 46%, #101016 54%, #2c2d3a 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextStroke: `1px ${RED}`,
        filter: `drop-shadow(0 0 14px ${hexA(RED, 0.45)})`,
      }}
    >
      {children}
    </Tag>
  );
}

/* message panel (formerly a speech bubble) */
export function SpeechBubble({ children, className = "" }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ background: PANEL_2, border: `1px solid ${EDGE}`, borderLeft: `2px solid ${BLUE}` }}
    >
      {children}
    </div>
  );
}

/* hexagonal status tag (formerly a starburst) */
const HEX = "50,3 94,27 94,73 50,97 6,73 6,27";

export function Burst({ children, color = RED, className = "" }) {
  return (
    <span className={`relative grid place-items-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ filter: `drop-shadow(0 0 8px ${hexA(color, 0.6)})` }}
        aria-hidden="true"
      >
        <polygon points={HEX} fill={hexA(color, 0.12)} stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="relative font-mono text-[10px] font-bold uppercase tracking-[0.2em] sm:text-[11px]" style={{ color: TEXT }}>
        {children}
      </span>
    </span>
  );
}

/* the navbar's hexagon button, reusable */
export function HexButton({ children, onClick, href, className = "" }) {
  const inner = (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 176 44" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          points="14,1 162,1 175,22 162,43 14,43 1,22"
          fill={hexA(RED, 0.06)}
          stroke={RED}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="transition-[fill] duration-300 group-hover:fill-[rgba(255,45,75,0.22)]"
        />
      </svg>
      <span className="relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: TEXT }}>
        {children}
      </span>
    </>
  );
  const cls = `group relative grid h-11 min-w-48 place-items-center px-6 ${className}`;
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* clearer names for new code */
export const NEON = RED;
export const VOLT = BLUE;
export const MetalTitle = ComicTitle;
export const HudLabel = ChapterTab;
export const HudTag = Burst;
export const MessagePanel = SpeechBubble;