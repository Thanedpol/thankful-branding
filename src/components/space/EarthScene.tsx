"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import EarthPlaceholder from "./EarthPlaceholder";

/**
 * The hero's planet, in real 3D.
 *
 * - Surface: NASA Blue Marble (day) and Black Marble 2016 (city lights),
 *   blended across a day/night terminator, with lights tinted gold.
 * - Atmosphere: an additive Fresnel shell, plus a rim term on the surface.
 * - Orbits: tilted circles in 3D, so depth testing alone makes them pass
 *   behind the planet and in front of it. Glow is faked with an additive
 *   halo tube around each thin core — no post-processing, which keeps the
 *   canvas transparent over the page's starfield.
 * - A light network between Asian cities rides on the surface, with pulses
 *   travelling along each arc.
 */

const SUN = new THREE.Vector3(-1, 0.45, -0.35).normalize(); // low on the left, slightly behind
const GOLD = new THREE.Color("#ffcf73");
const DEG = Math.PI / 180;

/** lat/lon → point on a unit sphere, matching THREE.SphereGeometry's UVs. */
function latLon(lat: number, lon: number, r = 1) {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = (90 - lat) * DEG;
  return new THREE.Vector3(
    -Math.cos(phi) * Math.sin(theta) * r,
    Math.cos(theta) * r,
    Math.sin(phi) * Math.sin(theta) * r
  );
}

/** Soft round glow, generated once — used for every sparkle and pulse. */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.18, "rgba(255,236,190,0.85)");
    grad.addColorStop(0.45, "rgba(255,190,90,0.25)");
    grad.addColorStop(1, "rgba(255,170,60,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
}

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const earthFragment = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec3 n = normalize(vNormalW);
    float ndl = dot(n, sunDir);
    float dayMix = smoothstep(-0.18, 0.32, ndl);

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;

    // Black Marble paints land a dim blue and cities bright; pull the cities
    // out and recolour them gold, keep the blue as a faint night-side map.
    float lum = dot(night, vec3(0.299, 0.587, 0.114));
    float lights = smoothstep(0.26, 0.62, lum);
    // the day map, dimmed and pushed blue, keeps continents legible at night
    vec3 nightBase = day * vec3(0.22, 0.36, 0.78) * 0.62 + vec3(0.02, 0.07, 0.2);
    vec3 nightCol = nightBase
                  + night * vec3(0.30, 0.45, 1.0) * 0.35
                  + vec3(1.0, 0.70, 0.32) * lights * 2.1;

    vec3 dayCol = day * (0.22 + 0.9 * max(ndl, 0.0));
    dayCol = mix(dayCol, dayCol * vec3(0.72, 0.9, 1.3), 0.35); // cooler, like the mockup

    vec3 col = mix(nightCol, dayCol, dayMix);

    // atmosphere scattering toward the limb
    float fres = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 2.6);
    col += vec3(0.25, 0.6, 1.0) * fres * 1.45;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const atmoVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmoFragment = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float i = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
    gl_FragColor = vec4(0.32, 0.66, 1.0, 1.0) * i * 1.7;
  }
`;

function Earth({ glow }: { glow: THREE.Texture }) {
  const [day, night] = useLoader(THREE.TextureLoader, ["/space/earth-day.jpg", "/space/earth-night.jpg"]);
  const spin = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    for (const t of [day, night]) {
      t.anisotropy = 8;
      t.wrapS = THREE.RepeatWrapping;
    }
    return new THREE.ShaderMaterial({
      uniforms: { dayMap: { value: day }, nightMap: { value: night }, sunDir: { value: SUN } },
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
    });
  }, [day, night]);

  // Bring Thailand round to face the viewer on load.
  const startY = Math.PI / 2 - ((100.5 + 180) / 360) * Math.PI * 2;

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.035;
  });

  return (
    <group rotation={[0.18, 0, -0.22]}>
      <group ref={spin} rotation={[0, startY, 0]}>
        <mesh material={material}>
          <sphereGeometry args={[1, 96, 96]} />
        </mesh>
        <CityNetwork glow={glow} />
      </group>
      <mesh scale={1.13}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={atmoVertex}
          fragmentShader={atmoFragment}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

const CITIES: Record<string, [number, number]> = {
  bangkok: [13.75, 100.5],
  tokyo: [35.7, 139.7],
  seoul: [37.6, 127.0],
  shanghai: [31.2, 121.5],
  hongkong: [22.3, 114.2],
  singapore: [1.35, 103.8],
  jakarta: [-6.2, 106.8],
  delhi: [28.6, 77.2],
  dubai: [25.2, 55.3],
  sydney: [-33.9, 151.2],
};
const LINKS: [string, string][] = [
  ["bangkok", "tokyo"],
  ["bangkok", "singapore"],
  ["bangkok", "delhi"],
  ["bangkok", "shanghai"],
  ["singapore", "sydney"],
  ["delhi", "dubai"],
  ["shanghai", "seoul"],
  ["hongkong", "jakarta"],
];

/** Great-circle arcs lifted off the surface, each with a travelling pulse. */
function CityNetwork({ glow }: { glow: THREE.Texture }) {
  const arcs = useMemo(
    () =>
      LINKS.map(([a, b]) => {
        const p = latLon(...CITIES[a]);
        const q = latLon(...CITIES[b]);
        const lift = 0.08 + p.angleTo(q) * 0.18;
        const pts = Array.from({ length: 48 }, (_, i) => {
          const t = i / 47;
          return new THREE.Vector3().copy(p).lerp(q, t).normalize().multiplyScalar(1.004 + Math.sin(t * Math.PI) * lift);
        });
        const curve = new THREE.CatmullRomCurve3(pts);
        return { curve, geo: new THREE.TubeGeometry(curve, 64, 0.0035, 6, false) };
      }),
    []
  );
  const pulses = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    arcs.forEach((a, i) => {
      const s = pulses.current[i];
      if (s) s.position.copy(a.curve.getPointAt((t * 0.22 + i * 0.37) % 1));
    });
  });

  return (
    <group>
      {arcs.map((a, i) => (
        <mesh key={i} geometry={a.geo}>
          <meshBasicMaterial color={GOLD} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      {Object.values(CITIES).map(([lat, lon], i) => (
        <sprite key={`c${i}`} position={latLon(lat, lon, 1.01)} scale={0.06}>
          <spriteMaterial map={glow} color={GOLD} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
        </sprite>
      ))}
      {arcs.map((_, i) => (
        <sprite key={`p${i}`} ref={(el) => void (pulses.current[i] = el)} scale={0.075}>
          <spriteMaterial map={glow} color="#fff3d6" blending={THREE.AdditiveBlending} depthWrite={false} transparent />
        </sprite>
      ))}
    </group>
  );
}

const ORBITS = [
  { r: 1.32, tilt: [66, 0, -16], speed: 0.05, dots: 2, dashed: false },
  { r: 1.46, tilt: [60, 0, 20], speed: -0.035, dots: 1, dashed: false },
  { r: 1.6, tilt: [70, 0, 6], speed: 0.03, dots: 2, dashed: true },
  { r: 1.22, tilt: [52, 0, -40], speed: -0.045, dots: 1, dashed: true },
  { r: 1.66, tilt: [64, 0, 30], speed: 0.025, dots: 2, dashed: false },
];

function Orbit({ r, tilt, speed, dots, dashed, glow }: (typeof ORBITS)[number] & { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);

  const { core, halo, dotted } = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    const pts3 = curve.getPoints(256).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const path = new THREE.CatmullRomCurve3(pts3, true);
    const dottedGeo = new THREE.BufferGeometry().setFromPoints(
      pts3.filter((_, i) => i % 3 === 0)
    );
    return {
      core: new THREE.TubeGeometry(path, 256, 0.0042, 6, true),
      halo: new THREE.TubeGeometry(path, 256, 0.022, 8, true),
      dotted: dottedGeo,
    };
  }, [r]);

  useFrame(({ clock }, dt) => {
    if (group.current) group.current.rotation.z += dt * speed * 0.4; // slow precession
    const t = clock.elapsedTime;
    sprites.current.forEach((s, i) => {
      if (!s) return;
      const a = t * speed * 6 + (i / dots) * Math.PI * 2;
      s.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    });
  });

  return (
    <group rotation={tilt.map((d) => d * DEG) as [number, number, number]}>
      <group ref={group}>
        {dashed ? (
          <points geometry={dotted}>
            <pointsMaterial color={GOLD} size={0.018} transparent opacity={0.85} depthWrite={false} />
          </points>
        ) : (
          <>
            <mesh geometry={core}>
              <meshBasicMaterial color={GOLD} transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <mesh geometry={halo}>
              <meshBasicMaterial color="#ffb347" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </>
        )}
        {Array.from({ length: dots }, (_, i) => (
          <sprite key={i} ref={(el) => void (sprites.current[i] = el)} scale={0.16}>
            <spriteMaterial map={glow} color="#fff1cf" blending={THREE.AdditiveBlending} depthWrite={false} transparent />
          </sprite>
        ))}
      </group>
    </group>
  );
}

function Moon() {
  const map = useLoader(THREE.TextureLoader, "/space/moon.jpg");
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.position.set(1.42 + Math.sin(t * 0.15) * 0.05, -1.0 + Math.sin(t * 0.25) * 0.05, 0.7);
      ref.current.rotation.y += 0.0015;
    }
  });
  return (
    <mesh ref={ref} scale={0.24}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

function SmallPlanet() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 0.5) * 0.05;
  });
  return (
    <mesh ref={ref} position={[-1.45, 1.4, -0.4]} scale={0.13}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#9aaad0" roughness={0.85} />
    </mesh>
  );
}

/** The bright flare sitting on the planet's upper rim in the mockup. */
function Flare({ glow }: { glow: THREE.Texture }) {
  const ref = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(0.55 + Math.sin(clock.elapsedTime * 1.3) * 0.05);
  });
  return (
    <sprite ref={ref} position={[-0.32, 1.02, 0.25]}>
      <spriteMaterial map={glow} color="#fff0d0" blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.9} />
    </sprite>
  );
}

function Scene({ onReady }: { onReady: () => void }) {
  const glow = useGlowTexture();
  // Runs once the textures have resolved, i.e. the first real frame is ready.
  useEffect(onReady, [onReady]);
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={SUN.clone().multiplyScalar(10)} intensity={2.2} />
      <directionalLight position={[3, 1.5, 6]} intensity={0.9} color="#cfe0ff" />
      <Earth glow={glow} />
      {ORBITS.map((o, i) => (
        <Orbit key={i} {...o} glow={glow} />
      ))}
      <Moon />
      <SmallPlanet />
      <Flare glow={glow} />
    </>
  );
}

/** WebGL can be missing or blocked; fall back to the placeholder rather than a blank hole. */
class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}


export default function EarthScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  const markReady = useMemo(() => () => setReady(true), []);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = wrap.current;
    if (!el) return;
    // Stop rendering when scrolled away or the tab is hidden.
    let visible = true;
    const sync = () => setActive(visible && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={wrap} className="relative aspect-square w-full">
      {!ready && <EarthPlaceholder />}
      <GLBoundary fallback={<EarthPlaceholder />}>
        <Canvas
          flat
          linear
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 5.6], fov: 38 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          frameloop={reduced ? "demand" : active ? "always" : "never"}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <Suspense fallback={null}>
            <Scene onReady={markReady} />
          </Suspense>
        </Canvas>
      </GLBoundary>
    </div>
  );
}
