export default function Spider({ size = 48, className = "", eyeColor = "#22e4ff" }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M27 27 Q16 16 6 18" />
        <path d="M27 31 Q14 26 4 30" />
        <path d="M27 35 Q14 38 6 46" />
        <path d="M28 39 Q18 48 12 58" />
        <path d="M37 27 Q48 16 58 18" />
        <path d="M37 31 Q50 26 60 30" />
        <path d="M37 35 Q50 38 58 46" />
        <path d="M36 39 Q46 48 52 58" />
      </g>
      <ellipse cx="32" cy="38" rx="7" ry="9" fill="currentColor" />
      <circle cx="32" cy="26" r="5" fill="currentColor" />
      <circle cx="30" cy="25" r="1.2" fill={eyeColor} />
      <circle cx="34" cy="25" r="1.2" fill={eyeColor} />
    </svg>
  );
}