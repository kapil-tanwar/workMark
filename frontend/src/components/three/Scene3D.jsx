import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useTheme, usePrefersReducedMotion } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const HeroScene = lazy(() => import("./HeroScene"));
const WaveScene = lazy(() => import("./WaveScene"));

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

/**
 * Lazy, safe wrapper for decorative 3D scenes.
 *  - loads three.js only when mounted (own chunk)
 *  - pauses rendering when off-screen / tab hidden
 *  - renders a single static frame under prefers-reduced-motion
 *  - silently falls back to the CSS backdrop if WebGL is unavailable
 */
export function Scene3D({ variant = "hero", className, stage = false }) {
  const theme = useTheme();
  const reduced = usePrefersReducedMotion();
  const host = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const [ok] = useState(() => typeof document !== "undefined" && webglOk());
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    const onMove = (e) => {
      if (reduced) return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => { scrollRef.current = window.scrollY; };
    const onResize = () => setSmall(window.innerWidth < 768);
    onResize();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  if (!ok) return null;
  const active = visible && tabVisible;
  const Scene = variant === "wave" ? WaveScene : HeroScene;

  return (
    <div ref={host} aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <Suspense fallback={null}>
        <Scene theme={theme} active={active} reduced={reduced} pointer={pointer} scrollRef={scrollRef} small={small} stage={stage} />
      </Suspense>
    </div>
  );
}
