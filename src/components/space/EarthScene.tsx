"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import EarthPlaceholder from "./EarthPlaceholder";

/**
 * The hero's planet, in real 3D.
 *
 * - Surface: NASA Blue Marble Next Generation for January, April, July and
 *   October, cross-faded by day of year, so snow cover and vegetation follow
 *   the seasons. Black Marble 2016 supplies the city lights.
 * - Sunlight: computed from a simulated date and time — solar declination for
 *   the season, subsolar longitude for the hour — and applied in the planet's
 *   own frame, so day and night stay geographically right however the
 *   visitor spins the globe.
 * - Interaction: drag with the left button (or a finger, horizontally) to turn
 *   the globe freely in any direction, with inertia when released.
 * - Orbits are real circles in 3D, so depth testing alone sends them behind the
 *   planet and back in front. Glow is an additive halo rather than
 *   post-processing, which keeps the canvas transparent over the starfield.
 * - Meteors streak past and can slip behind the planet.
 */

const GOLD = new THREE.Color("#ffcf73");
const DEG = Math.PI / 180;
const OBLIQUITY = 23.44;

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

// ─── Simulated sky clock ──────────────────────────────────────────────────────

export type SkyMode = "lapse" | "now" | "winter" | "spring" | "summer" | "autumn";

/** Mid-month day-of-year for each season's showcase date. */
const SEASON_DOY: Record<"winter" | "spring" | "summer" | "autumn", number> = {
  winter: 15, // 15 Jan
  spring: 105, // 15 Apr
  summer: 196, // 15 Jul
  autumn: 288, // 15 Oct
};
/** The four textures are anchored at these days of the year. */
const TEX_DOY = [15, 105, 196, 288];

interface SkyState {
  mode: SkyMode;
  doy: number; // 0–365
  utcHours: number; // 0–24
  thaiDay: boolean;
}

function realNow() {
  const d = new Date();
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const doy = (d.getTime() - start) / 86400000;
  return { doy, utcHours: d.getUTCHours() + d.getUTCMinutes() / 60 };
}

/** Where the sun is overhead, as a direction in the planet's own frame. */
function subsolar(doy: number, utcHours: number, out: THREE.Vector3) {
  const decl = -OBLIQUITY * Math.cos(((2 * Math.PI) / 365) * (doy + 10));
  const lon = -15 * (utcHours - 12);
  return out.copy(latLon(decl, lon)).normalize();
}

/** Which two seasonal textures to blend today, and by how much. */
function seasonBlend(doy: number): [number, number, number] {
  for (let i = 0; i < 3; i++) {
    const a = TEX_DOY[i];
    const b = TEX_DOY[i + 1];
    if (doy >= a && doy < b) return [i, i + 1, (doy - a) / (b - a)];
  }
  // October → January, wrapping through the new year
  const a = TEX_DOY[3];
  const b = TEX_DOY[0] + 365;
  const d = doy < TEX_DOY[0] ? doy + 365 : doy;
  return [3, 0, (d - a) / (b - a)];
}

// ─── Shared glow sprite ───────────────────────────────────────────────────────

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

// ─── Earth ────────────────────────────────────────────────────────────────────

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalO;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormalO = normal; // object space: lighting is tied to geography
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const earthFragment = /* glsl */ `
  uniform sampler2D dayA;
  uniform sampler2D dayB;
  uniform float seasonMix;
  uniform sampler2D nightMap;
  uniform vec3 sunLocal;
  varying vec2 vUv;
  varying vec3 vNormalO;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float ndl = dot(normalize(vNormalO), sunLocal);
    float dayMix = smoothstep(-0.12, 0.22, ndl);

    vec3 day = mix(texture2D(dayA, vUv).rgb, texture2D(dayB, vUv).rgb, seasonMix);
    vec3 night = texture2D(nightMap, vUv).rgb;

    // Black Marble paints land a dim blue and cities bright; pull the cities
    // out and recolour them gold. The dimmed day map keeps continents legible.
    float lum = dot(night, vec3(0.299, 0.587, 0.114));
    float lights = smoothstep(0.26, 0.62, lum);
    vec3 nightCol = day * vec3(0.20, 0.33, 0.74) * 0.55 + vec3(0.02, 0.06, 0.18)
                  + night * vec3(0.30, 0.45, 1.0) * 0.3
                  + vec3(1.0, 0.70, 0.32) * lights * 2.1;

    vec3 dayCol = day * (0.3 + 0.95 * max(ndl, 0.0));
    dayCol = mix(dayCol, dayCol * vec3(0.8, 0.95, 1.2), 0.25);

    vec3 col = mix(nightCol, dayCol, dayMix);

    // a warm band along the terminator — dawn and dusk
    float dusk = exp(-pow(ndl / 0.08, 2.0));
    col += vec3(1.0, 0.45, 0.15) * dusk * 0.18;

    float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 2.6);
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

interface DragState {
  q: THREE.Quaternion; // the visitor's rotation of the globe
  pendX: number; // pointer travel not yet applied, in px
  pendY: number;
  vx: number; // release velocity, rad/frame
  vy: number;
  active: boolean;
  resetting: boolean;
}

const BKK = latLon(13.75, 100.5).normalize();

function Earth({
  glow,
  sky,
  drag,
  still,
}: {
  glow: THREE.Texture;
  sky: React.MutableRefObject<SkyState>;
  drag: React.MutableRefObject<DragState>;
  still: boolean;
}) {
  const maps = useLoader(THREE.TextureLoader, [
    "/space/earth-01.jpg",
    "/space/earth-04.jpg",
    "/space/earth-07.jpg",
    "/space/earth-10.jpg",
    "/space/earth-night.jpg",
  ]);
  const user = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const sun = useMemo(() => new THREE.Vector3(), []);

  const material = useMemo(() => {
    for (const t of maps) t.anisotropy = 8;
    return new THREE.ShaderMaterial({
      uniforms: {
        dayA: { value: maps[0] },
        dayB: { value: maps[1] },
        seasonMix: { value: 0 },
        nightMap: { value: maps[4] },
        sunLocal: { value: sun },
      },
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
    });
  }, [maps, sun]);

  // Bring Thailand round to face the viewer on load.
  const startY = Math.PI / 2 - ((100.5 + 180) / 360) * Math.PI * 2;
  const axisX = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const axisY = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const step = useMemo(() => new THREE.Quaternion(), []);
  const identity = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, dt) => {
    const s = sky.current;
    if (!still) {
      if (s.mode === "lapse") {
        s.utcHours = (s.utcHours + dt * 1.5) % 24; // a day every 16 s
        s.doy = (s.doy + dt * (365 / 64)) % 365; // a year every 64 s
      } else if (s.mode === "now") {
        Object.assign(s, realNow());
      } else {
        s.utcHours = (s.utcHours + dt * 1.5) % 24; // season fixed, day/night keeps turning
      }
    }
    subsolar(s.doy, s.utcHours, sun);
    s.thaiDay = BKK.dot(sun) > 0;
    const [a, b, f] = seasonBlend(s.doy);
    material.uniforms.dayA.value = maps[a];
    material.uniforms.dayB.value = maps[b];
    material.uniforms.seasonMix.value = f;

    // Visitor rotation about screen-space axes, so a drag always turns the
    // globe the way the hand moves, at any orientation — 360° in every axis.
    const d = drag.current;
    let rx = 0;
    let ry = 0;
    if (d.active) {
      ry = d.pendX * 0.0065;
      rx = d.pendY * 0.0065;
      d.vx = ry;
      d.vy = rx;
      d.pendX = d.pendY = 0;
    } else if (Math.abs(d.vx) + Math.abs(d.vy) > 1e-5) {
      ry = d.vx;
      rx = d.vy;
      d.vx *= 0.94;
      d.vy *= 0.94;
    }
    if (rx || ry) {
      d.q.premultiply(step.setFromAxisAngle(axisY, ry));
      d.q.premultiply(step.setFromAxisAngle(axisX, rx));
    }
    if (d.resetting) {
      d.q.slerp(identity, Math.min(1, dt * 4));
      if (d.q.angleTo(identity) < 0.002) {
        d.q.identity();
        d.resetting = false;
      }
    }
    if (user.current) user.current.quaternion.copy(d.q);

    // A slow presentation spin, paused while the visitor has hold of the globe.
    if (spin.current && !still && !d.active) spin.current.rotation.y += dt * 0.03;
  });

  return (
    <group ref={user}>
      <group rotation={[0.18, 0, -0.22]}>
        <group ref={spin} rotation={[0, startY, 0]}>
          <mesh material={material}>
            <sphereGeometry args={[1, 96, 96]} />
          </mesh>
          <CityNetwork glow={glow} still={still} />
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
function CityNetwork({ glow, still }: { glow: THREE.Texture; still: boolean }) {
  const arcs = useMemo(
    () =>
      LINKS.map(([a, b]) => {
        const p = latLon(...CITIES[a]);
        const q = latLon(...CITIES[b]);
        const lift = 0.08 + p.angleTo(q) * 0.18;
        const pts = Array.from({ length: 48 }, (_, i) => {
          const t = i / 47;
          return new THREE.Vector3()
            .copy(p)
            .lerp(q, t)
            .normalize()
            .multiplyScalar(1.004 + Math.sin(t * Math.PI) * lift);
        });
        const curve = new THREE.CatmullRomCurve3(pts);
        return { curve, geo: new THREE.TubeGeometry(curve, 64, 0.0035, 6, false) };
      }),
    []
  );
  const pulses = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime;
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

// ─── Orbits, moon, planet, flare ──────────────────────────────────────────────

const ORBITS = [
  { r: 1.32, tilt: [66, 0, -16], speed: 0.05, dots: 2, dashed: false },
  { r: 1.46, tilt: [60, 0, 20], speed: -0.035, dots: 1, dashed: false },
  { r: 1.6, tilt: [70, 0, 6], speed: 0.03, dots: 2, dashed: true },
  { r: 1.22, tilt: [52, 0, -40], speed: -0.045, dots: 1, dashed: true },
  { r: 1.66, tilt: [64, 0, 30], speed: 0.025, dots: 2, dashed: false },
];

function Orbit({
  r,
  tilt,
  speed,
  dots,
  dashed,
  glow,
  still,
}: (typeof ORBITS)[number] & { glow: THREE.Texture; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);

  const { core, halo, dotted } = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    const pts3 = curve.getPoints(256).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const path = new THREE.CatmullRomCurve3(pts3, true);
    return {
      core: new THREE.TubeGeometry(path, 256, 0.0042, 6, true),
      halo: new THREE.TubeGeometry(path, 256, 0.022, 8, true),
      dotted: new THREE.BufferGeometry().setFromPoints(pts3.filter((_, i) => i % 3 === 0)),
    };
  }, [r]);

  useFrame(({ clock }, dt) => {
    if (still) return;
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
          <sprite
            key={i}
            ref={(el) => void (sprites.current[i] = el)}
            position={[Math.cos((i / dots) * Math.PI * 2) * r, Math.sin((i / dots) * Math.PI * 2) * r, 0]}
            scale={0.16}
          >
            <spriteMaterial map={glow} color="#fff1cf" blending={THREE.AdditiveBlending} depthWrite={false} transparent />
          </sprite>
        ))}
      </group>
    </group>
  );
}

function Moon({ still }: { still: boolean }) {
  const map = useLoader(THREE.TextureLoader, "/space/moon.jpg");
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (still || !ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.set(1.42 + Math.sin(t * 0.15) * 0.05, -1.0 + Math.sin(t * 0.25) * 0.05, 0.7);
    ref.current.rotation.y += 0.0015;
  });
  return (
    <mesh ref={ref} position={[1.42, -1.0, 0.7]} scale={0.24}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

function SmallPlanet({ still }: { still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current && !still) ref.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 0.5) * 0.05;
  });
  return (
    <mesh ref={ref} position={[-1.45, 1.4, -0.4]} scale={0.13}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#9aaad0" roughness={0.85} />
    </mesh>
  );
}

function Flare({ glow, still }: { glow: THREE.Texture; still: boolean }) {
  const ref = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    if (ref.current && !still) ref.current.scale.setScalar(0.55 + Math.sin(clock.elapsedTime * 1.3) * 0.05);
  });
  return (
    <sprite ref={ref} position={[-0.32, 1.02, 0.25]} scale={0.55}>
      <spriteMaterial map={glow} color="#fff0d0" blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.9} />
    </sprite>
  );
}

// ─── Meteors ──────────────────────────────────────────────────────────────────

const TRAIL = 18;

interface MeteorState {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  life: number; // 1 → 0
  alive: boolean;
}

/**
 * Shooting stars crossing the scene. Each aims at a point near the planet, so
 * it streaks across the disc or skims past it; depth testing lets part of a
 * trail slip behind the globe.
 */
function Meteors({ glow }: { glow: THREE.Texture }) {
  const pool = useMemo<MeteorState[]>(
    () =>
      Array.from({ length: 3 }, () => ({
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        speed: 0,
        life: 0,
        alive: false,
      })),
    []
  );
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const next = useRef(1.5);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    next.current -= dt;
    if (next.current <= 0) {
      next.current = 2.5 + Math.random() * 3.5;
      const m = pool.find((p) => !p.alive);
      if (m) {
        // start high on one side, aim through the planet's neighbourhood
        const side = Math.random() < 0.5 ? -1 : 1;
        m.pos.set(side * (2.6 + Math.random() * 0.6), 1.2 + Math.random() * 1.2, (Math.random() - 0.3) * 2.2);
        target.set((Math.random() - 0.5) * 1.4, (Math.random() - 0.6) * 1.2, (Math.random() - 0.5) * 1.6);
        m.dir.copy(target).sub(m.pos).normalize();
        m.speed = 4.2 + Math.random() * 1.6;
        m.life = 1;
        m.alive = true;
      }
    }

    pool.forEach((m, mi) => {
      if (m.alive) {
        m.pos.addScaledVector(m.dir, m.speed * dt);
        m.life -= dt * 0.62;
        if (m.life <= 0) m.alive = false;
      }
      for (let k = 0; k < TRAIL; k++) {
        const s = sprites.current[mi * TRAIL + k];
        if (!s) continue;
        s.visible = m.alive;
        if (!m.alive) continue;
        const f = k / TRAIL; // 0 = head
        s.position.copy(m.pos).addScaledVector(m.dir, -f * 0.75);
        s.scale.setScalar((k === 0 ? 0.13 : 0.075) * (1 - f * 0.7));
        (s.material as THREE.SpriteMaterial).opacity = Math.min(1, m.life * 2.2) * (1 - f);
      }
    });
  });

  return (
    <group>
      {pool.flatMap((_, mi) =>
        Array.from({ length: TRAIL }, (_, k) => (
          <sprite key={`${mi}-${k}`} ref={(el) => void (sprites.current[mi * TRAIL + k] = el)} visible={false}>
            <spriteMaterial
              map={glow}
              color={k === 0 ? "#ffffff" : "#ffe2b0"}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              transparent
            />
          </sprite>
        ))
      )}
    </group>
  );
}

// ─── Scene shell ──────────────────────────────────────────────────────────────

function Scene({
  onReady,
  sky,
  drag,
  still,
  onInvalidate,
}: {
  onReady: () => void;
  sky: React.MutableRefObject<SkyState>;
  drag: React.MutableRefObject<DragState>;
  still: boolean;
  onInvalidate: (fn: () => void) => void;
}) {
  const glow = useGlowTexture();
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => onInvalidate(invalidate), [invalidate, onInvalidate]);
  // Runs once the textures have resolved, i.e. the first real frame is ready.
  useEffect(onReady, [onReady]);
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-10, 4.5, -3.5]} intensity={2.2} />
      <directionalLight position={[3, 1.5, 6]} intensity={0.9} color="#cfe0ff" />
      <Earth glow={glow} sky={sky} drag={drag} still={still} />
      {ORBITS.map((o, i) => (
        <Orbit key={i} {...o} glow={glow} still={still} />
      ))}
      <Moon still={still} />
      <SmallPlanet still={still} />
      <Flare glow={glow} still={still} />
      {!still && <Meteors glow={glow} />}
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

// ─── Controls ─────────────────────────────────────────────────────────────────

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function seasonOf(month: number) {
  if (month === 11 || month <= 1) return "ฤดูหนาว";
  if (month <= 4) return "ฤดูใบไม้ผลิ";
  if (month <= 7) return "ฤดูร้อน";
  return "ฤดูใบไม้ร่วง";
}

function describe(s: SkyState) {
  const date = new Date(Date.UTC(2026, 0, 1) + s.doy * 86400000);
  const th = (s.utcHours + 7) % 24;
  const hh = String(Math.floor(th)).padStart(2, "0");
  const mm = String(Math.floor((th % 1) * 60)).padStart(2, "0");
  return {
    date: `${date.getUTCDate()} ${MONTHS_TH[date.getUTCMonth()]}`,
    time: `${hh}:${mm} น.`,
    season: seasonOf(date.getUTCMonth()),
  };
}

const MODES: { id: SkyMode; label: string }[] = [
  { id: "lapse", label: "▶ ไทม์แลปส์" },
  { id: "now", label: "● ตอนนี้" },
  { id: "winter", label: "❄ หนาว" },
  { id: "spring", label: "✿ ใบไม้ผลิ" },
  { id: "summer", label: "☀ ร้อน" },
  { id: "autumn", label: "❦ ใบไม้ร่วง" },
];

const INITIAL_SKY: SkyState = { mode: "lapse", doy: 15, utcHours: 5, thaiDay: true };

export default function EarthScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [mode, setMode] = useState<SkyMode>("lapse");
  const [label, setLabel] = useState(() => describe(INITIAL_SKY));
  const [thaiDay, setThaiDay] = useState(true);
  const [hinted, setHinted] = useState(false);

  const sky = useRef<SkyState>({ ...INITIAL_SKY });
  const drag = useRef<DragState>({
    q: new THREE.Quaternion(),
    pendX: 0,
    pendY: 0,
    vx: 0,
    vy: 0,
    active: false,
    resetting: false,
  });
  const last = useRef({ x: 0, y: 0 });
  const invalidateRef = useRef<() => void>(() => {});
  const onInvalidate = useCallback((fn: () => void) => {
    invalidateRef.current = fn;
  }, []);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    if (r) {
      // No time-lapse for visitors who asked for less motion: show the real sky.
      Object.assign(sky.current, { mode: "now" }, realNow());
      setMode("now");
    }
    const el = wrap.current;
    if (!el) return;
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

  // Mirror the simulated clock into the caption a few times a second.
  useEffect(() => {
    const id = window.setInterval(() => {
      setLabel(describe(sky.current));
      setThaiDay(sky.current.thaiDay);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  function choose(m: SkyMode) {
    setMode(m);
    const s = sky.current;
    s.mode = m;
    if (m === "now") Object.assign(s, realNow());
    else if (m !== "lapse") {
      s.doy = SEASON_DOY[m];
      if (reduced) s.utcHours = 5; // midday in Thailand
    }
    invalidateRef.current();
  }

  // ─ drag to rotate ─
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
    const d = drag.current;
    d.active = true;
    d.resetting = false;
    d.vx = d.vy = 0;
    setDragging(true);
    setHinted(true);
    if (e.pointerType === "mouse") e.preventDefault(); // no text selection while dragging
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.active) return;
    d.pendX += e.clientX - last.current.x;
    d.pendY += e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    if (!rotated) setRotated(true);
    invalidateRef.current();
  }
  function endDrag() {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
  }
  function resetView() {
    drag.current.resetting = true;
    drag.current.vx = drag.current.vy = 0;
    setRotated(false);
    invalidateRef.current();
  }

  const frameloop = !active ? "never" : reduced && !dragging ? "demand" : "always";

  return (
    <div className="w-full">
      <div
        ref={wrap}
        className={`relative aspect-square w-full select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        // Vertical swipes still scroll the page on touch screens; horizontal ones turn the globe.
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {!ready && <EarthPlaceholder />}
        <GLBoundary fallback={<EarthPlaceholder />}>
          <Canvas
            flat
            linear
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, 5.6], fov: 38 }}
            gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
            frameloop={frameloop}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <Suspense fallback={null}>
              <Scene onReady={markReady} sky={sky} drag={drag} still={reduced} onInvalidate={onInvalidate} />
            </Suspense>
          </Canvas>
        </GLBoundary>

        {ready && !hinted && (
          <p className="pointer-events-none absolute bottom-[4%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#050a18]/80 px-3 py-1 font-mono text-[11px] text-white/80 backdrop-blur-md">
            ⟲ ลากเพื่อหมุนโลกได้รอบทิศ
          </p>
        )}
        {rotated && (
          <button
            type="button"
            onClick={resetView}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute right-[4%] top-[4%] rounded-full border border-white/20 bg-[#050a18]/85 px-3 py-1.5 font-mono text-[11px] text-white/85 backdrop-blur-md transition-colors hover:border-white/50 hover:text-white"
          >
            ⟲ มุมเดิม
          </button>
        )}
      </div>

      {/* sky clock: season and time of day */}
      <div className="mx-auto mt-2 w-fit max-w-full rounded-2xl border border-white/10 bg-[#050a18]/85 px-3 py-2.5 backdrop-blur-md">
        <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="เลือกฤดูและเวลา">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                mode === m.id
                  ? "border-[#f5c45e]/70 bg-[#f5c45e]/15 text-[#ffd77a]"
                  : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center font-mono text-[11px] text-white/75">
          {label.date} · {label.time} เวลาไทย · {label.season} (ซีกโลกเหนือ) ·{" "}
          <span className={thaiDay ? "text-[#ffd77a]" : "text-[#9ec5ff]"}>
            {thaiDay ? "☀ กลางวันที่ไทย" : "☾ กลางคืนที่ไทย"}
          </span>
        </p>
      </div>
    </div>
  );
}
