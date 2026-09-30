export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 0..1 progress of a window that starts at `start` and lasts `duration` seconds */
export const phase = (t, start, duration) => clamp01((t - start) / duration);

export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

export const easeInOutCubic = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** frame-rate independent smoothing factor */
export const damp = (delta, speed) => 1 - Math.exp(-delta * speed);