import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to dynamically load Locomotive Scroll (v5 modern ESM)
 * and provide buttery smooth scrolling, parallax, and scroll triggers.
 *
 * It cleans up gracefully on route change or component unmount.
 */
export function useLocomotiveScroll(options = {}) {
  const scrollRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    let isCancelled = false;
    let locomotiveInstance = null;

    async function init() {
      try {
        // Dynamically import LocomotiveScroll from CDN to ensure zero broken builds / npm permission blocks
        // locomotive-scroll v5 is native ESM with Lenis bundled under the hood
        const module = await import("https://cdn.jsdelivr.net/npm/locomotive-scroll@5.0.1/dist/locomotive-scroll.mjs");
        const LocomotiveScroll = module.default || module.LocomotiveScroll || module;

        if (isCancelled) return;

        locomotiveInstance = new LocomotiveScroll({
          lenisOptions: {
            wrapper: window,
            content: document.documentElement,
            lerp: 0.08,
            duration: 1.2,
            smoothWheel: true,
            smoothTouch: false,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.5,
            normalizeWheel: true,
            ...(options.lenisOptions || {}),
          },
          ...options,
        });

        scrollRef.current = locomotiveInstance;
      } catch (err) {
        console.warn("Locomotive Scroll initialization fallback:", err);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (locomotiveInstance && typeof locomotiveInstance.destroy === "function") {
        try {
          locomotiveInstance.destroy();
        } catch {
          // ignore cleanup issues
        }
      }
      scrollRef.current = null;
    };
  }, [location.pathname]);

  return scrollRef;
}
