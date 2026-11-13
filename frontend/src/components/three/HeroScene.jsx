import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scenePalette } from "./palette";

function makeSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* Deterministic PRNG so the field is stable between renders */
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function Particles({ count, palette }) {
  const ref = useRef();
  const sprite = useMemo(makeSprite, []);
  const positions = useMemo(() => {
    const r = rng(42);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // flattened spiral disc
      const radius = 1.2 + Math.pow(r(), 0.7) * 5.4;
      const arm = (i % 3) * ((Math.PI * 2) / 3);
      const ang = radius * 0.9 + arm + (r() - 0.5) * 0.7;
      arr[i * 3] = Math.cos(ang) * radius;
      arr[i * 3 + 1] = (r() - 0.5) * 1.6 * (1 - radius / 8);
      arr[i * 3 + 2] = Math.sin(ang) * radius;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.035; });

  return (
    <points ref={ref} rotation={[0.35, 0, 0.12]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite} size={0.085} sizeAttenuation transparent depthWrite={false}
        color={palette.dust} opacity={palette.opacity}
        blending={palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

/* Concentric "time rings" — an abstract attendance clock */
function Rings({ palette, pointer, scrollRef }) {
  const group = useRef();
  const rings = useRef([]);
  const orbiters = useRef([]);
  const specs = useMemo(() => [
    { r: 1.15, t: 0.012, color: palette.brand, speed: 0.35, tilt: [1.2, 0, 0] },
    { r: 1.7, t: 0.01, color: palette.ink, speed: -0.22, tilt: [1.05, 0.25, 0.1] },
    { r: 2.25, t: 0.008, color: palette.accent, speed: 0.15, tilt: [1.3, -0.2, 0.3] },
  ], [palette]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // cursor-responsive tilt (damped) + scroll parallax
    const tx = pointer.current.y * 0.25 + scrollRef.current * 0.0006;
    const ty = pointer.current.x * 0.4;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, 3, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, 3, dt);
    g.position.y = Math.sin(t * 0.6) * 0.08 - scrollRef.current * 0.0012;
    rings.current.forEach((m, i) => { if (m) m.rotation.z += dt * specs[i].speed; });
    orbiters.current.forEach((m, i) => {
      if (!m) return;
      const s = specs[i];
      const a = t * (0.5 + i * 0.18) * (i % 2 ? -1 : 1) + i * 2.1;
      m.position.set(Math.cos(a) * s.r, Math.sin(a) * s.r, 0);
    });
  });

  return (
    <group ref={group} scale={0.82} position={[0.6, 0, 0]}>
      {specs.map((s, i) => (
        <group key={i} rotation={s.tilt}>
          <mesh ref={(el) => (rings.current[i] = el)}>
            <torusGeometry args={[s.r, s.t, 8, 140]} />
            <meshBasicMaterial color={s.color} transparent opacity={i === 0 ? 0.95 : 0.45} />
          </mesh>
          {/* tick marks on the ring give it a dial feel */}
          <mesh rotation={[0, 0, 0]} ref={(el) => (orbiters.current[i] = el)}>
            <sphereGeometry args={[0.07 + i * 0.01, 20, 20]} />
            <meshBasicMaterial color={s.color} />
          </mesh>
        </group>
      ))}
      {/* core */}
      <mesh>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshBasicMaterial color={palette.brand} wireframe transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshBasicMaterial color={palette.brand} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function Rig({ pointer }) {
  useFrame((state, dt) => {
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, pointer.current.x * 0.45, 2.5, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 0.4 + pointer.current.y * 0.3, 2.5, dt);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({ theme, active, reduced, pointer, scrollRef, small }) {
  const palette = scenePalette[theme] ?? scenePalette.light;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 6.4], fov: 42 }}
      frameloop={active && !reduced ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
    >
      <Rig pointer={pointer} />
      <Particles count={small ? 900 : 2200} palette={palette} />
      <Rings palette={palette} pointer={pointer} scrollRef={scrollRef} />
    </Canvas>
  );
}
