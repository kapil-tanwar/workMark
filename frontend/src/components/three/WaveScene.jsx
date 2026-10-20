import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scenePalette } from "./palette";

const vert = /* glsl */ `
  uniform float uTime; uniform vec2 uMouse; uniform float uSize;
  varying float vH;
  void main() {
    vec3 p = position;
    float d = distance(p.xz, uMouse * 6.0);
    float h = sin(p.x * 0.7 + uTime * 0.55) * 0.35 + cos(p.z * 0.6 - uTime * 0.4) * 0.35;
    h += exp(-d * 0.55) * 0.55 * sin(uTime * 1.4 - d * 1.6);
    p.y += h; vH = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 + h * 0.6) * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */ `
  uniform vec3 uA; uniform vec3 uB; uniform float uOpacity; varying float vH;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float r = length(c);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.05, r) * uOpacity;
    gl_FragColor = vec4(mix(uA, uB, clamp(vH * 0.9 + 0.5, 0.0, 1.0)), a);
  }`;

function Field({ palette, mouse }) {
  const mat = useRef();
  const geo = useMemo(() => {
    const n = 56, pos = new Float32Array(n * n * 3);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const k = (i * n + j) * 3;
      pos[k] = (i / (n - 1) - 0.5) * 14; pos[k + 1] = 0; pos[k + 2] = (j / (n - 1) - 0.5) * 14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uSize: { value: 2.2 },
    uA: { value: new THREE.Color(palette.brand) }, uB: { value: new THREE.Color(palette.accent) },
    uOpacity: { value: palette.additive ? 0.95 : 0.7 },
  }), [palette]);

  useFrame((s, dt) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    uniforms.uMouse.value.x = THREE.MathUtils.damp(uniforms.uMouse.value.x, mouse.current.x, 3, dt);
    uniforms.uMouse.value.y = THREE.MathUtils.damp(uniforms.uMouse.value.y, -mouse.current.y, 3, dt);
  });

  return (
    <points geometry={geo} rotation={[0, 0.5, 0]}>
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag}
        transparent depthWrite={false} blending={palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending} />
    </points>
  );
}

export default function WaveScene({ theme, active, reduced, pointer, stage }) {
  // `stage` = rendered on the always-dark auth panel, so use the dark palette regardless of theme
  const palette = scenePalette[stage ? "dark" : theme] ?? scenePalette.dark;
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 4.2, 8.5], fov: 45 }}
      frameloop={active && !reduced ? "always" : "demand"}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }} style={{ background: "transparent" }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <Field palette={palette} mouse={pointer} />
    </Canvas>
  );
}
