import { useEffect } from "react";
import Lenis from "lenis";

let instance = null;

export const getLenis = () => instance;

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export default function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    instance = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, [enabled]);
}