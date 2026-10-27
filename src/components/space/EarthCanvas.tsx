"use client";

import { useRef } from "react";
import { useAnimationLoop } from "./useAnimationLoop";

/**
 * A procedurally generated Earth that genuinely rotates.
 *
 * A wrap-around equirectangular "map" is generated once from fractal noise
 * (continents + clustered city lights). Each frame, every pixel of the disc
 * looks up its longitude in that map shifted by the current rotation, so the
 * surface turns on its axis instead of the whole picture spinning in-plane.
 * The sphere geometry (latitude, base longitude, lighting) is precomputed per
 * pixel, which keeps the per-frame work to a table lookup and a colour mix.
 */

const TEX_W = 512;
const TEX_H = 256;
const RES = 360; // internal resolution; CSS scales it to fit
const TILT = (-23.4 * Math.PI) / 180; // axial tilt, leaning like the real thing
const SPIN = 7; // map texels per second

function rng(seed: number) {
  // mulberry32 — the same planet on every load, not a new one per visit
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value-noise octave that wraps horizontally, so the seam at 180° is invisible. */
function makeOctave(cellsX: number, cellsY: number, rand: () => number) {
  const lat = new Float32Array(cellsX * (cellsY + 1));
  for (let i = 0; i < lat.length; i++) lat[i] = rand();
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const x = u * cellsX;
    const y = v * cellsY;
    const x0 = Math.floor(x);
    const y0 = Math.min(cellsY - 1, Math.floor(y));
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const xa = ((x0 % cellsX) + cellsX) % cellsX;
    const xb = (xa + 1) % cellsX;
    const at = (cx: number, cy: number) => lat[cy * cellsX + cx];
    const top = at(xa, y0) + (at(xb, y0) - at(xa, y0)) * fx;
    const bot = at(xa, y0 + 1) + (at(xb, y0 + 1) - at(xa, y0 + 1)) * fx;
    return top + (bot - top) * fy;
  };
}

function buildMap() {
  const rand = rng(20260912);
  const shape = [6, 12, 24, 48, 96].map((c) => makeOctave(c, c / 2, rand));
  const towns = makeOctave(40, 20, rand);
  const land = new Float32Array(TEX_W * TEX_H);
  const lights = new Float32Array(TEX_W * TEX_H);

  for (let y = 0; y < TEX_H; y++) {
    const v = y / TEX_H;
    const polar = Math.abs(v - 0.5) * 2; // 0 at the equator, 1 at the poles
    for (let x = 0; x < TEX_W; x++) {
      const u = x / TEX_W;
      let n = 0;
      let amp = 0.5;
      let norm = 0;
      for (const oct of shape) {
        n += oct(u, v) * amp;
        norm += amp;
        amp *= 0.5;
      }
      n /= norm;
      // fewer, smaller continents near the poles
      const coast = 0.5 + polar * polar * 0.12;
      const l = Math.max(0, Math.min(1, (n - coast) * 14 + 0.5));
      const i = y * TEX_W + x;
      land[i] = l;
      if (l > 0.6) {
        const cluster = towns(u, v);
        if (cluster > 0.45 && rand() < 0.22 + (cluster - 0.45) * 1.4) {
          lights[i] = 0.4 + rand() * 0.6;
        }
      }
    }
  }
  return { land, lights };
}

export default function EarthCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useAnimationLoop(ref, () => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = RES;
    canvas.height = RES;

    const { land, lights } = buildMap();
    const img = ctx.createImageData(RES, RES);
    const px = img.data;

    // Sun low on the upper left, so the terminator runs down the middle and the
    // right half shows its city lights — the look of the mockup.
    const L = [-0.82, -0.32, 0.47];
    const ln = Math.hypot(L[0], L[1], L[2]);
    const [lx, ly, lz] = [L[0] / ln, L[1] / ln, L[2] / ln];

    // Per-pixel sphere geometry, computed once.
    const pIndex: number[] = [];
    const pRow: number[] = [];
    const pLon: number[] = [];
    const pDay: number[] = [];
    const pRim: number[] = [];
    const pSpec: number[] = [];
    const pEdge: number[] = [];
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);

    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const nx = ((x + 0.5) / RES) * 2 - 1;
        const ny = ((y + 0.5) / RES) * 2 - 1;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        const tx = nx * cosT - ny * sinT;
        const ty = nx * sinT + ny * cosT;
        const lat = Math.asin(Math.max(-1, Math.min(1, -ty)));
        const lon = Math.atan2(tx, nz);
        const ndl = nx * lx + ny * ly + nz * lz;
        const day = Math.max(0, Math.min(1, ndl * 1.9 + 0.05));
        // Blinn-ish highlight: half-vector between the light and the viewer
        const hx = lx;
        const hy = ly;
        const hz = lz + 1;
        const hn = Math.hypot(hx, hy, hz);
        const spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hn), 40);

        pIndex.push((y * RES + x) * 4);
        pRow.push(Math.min(TEX_H - 1, Math.floor((0.5 - lat / Math.PI) * TEX_H)) * TEX_W);
        pLon.push((lon / (2 * Math.PI) + 0.5) * TEX_W);
        pDay.push(day);
        pRim.push(Math.pow(1 - nz, 2.6));
        pSpec.push(spec);
        pEdge.push(Math.max(0, Math.min(1, (1 - Math.sqrt(r2)) * (RES / 2) * 1.5)));
      }
    }

    const count = pIndex.length;
    let rot = 0;

    const frame = (dt: number) => {
      rot = (rot + dt * SPIN) % TEX_W;
      for (let k = 0; k < count; k++) {
        let u = (pLon[k] + rot) | 0;
        if (u >= TEX_W) u -= TEX_W;
        const t = pRow[k] + u;
        const l = land[t];
        const city = lights[t];
        const day = pDay[k];
        const night = 1 - day;

        // ocean and land, each blended between their night and day tones
        const oR = 3 + 12 * day;
        const oG = 10 + 52 * day;
        const oB = 34 + 120 * day;
        const gR = 10 + 42 * day;
        const gG = 22 + 88 * day;
        const gB = 42 + 92 * day;
        let r = oR + (gR - oR) * l;
        let g = oG + (gG - oG) * l;
        let b = oB + (gB - oB) * l;

        // city lights glow gold on the night side, faintly through the day
        const glow = city * (0.12 + night * 1.15);
        r += 255 * glow;
        g += 190 * glow;
        b += 95 * glow;

        // atmosphere: cyan haze thickening toward the limb
        const rim = pRim[k];
        r += 70 * rim;
        g += 165 * rim;
        b += 255 * rim;

        // sun glint off open water only
        const s = pSpec[k] * (1 - l) * 0.55;
        r += 200 * s;
        g += 225 * s;
        b += 255 * s;

        const i = pIndex[k];
        px[i] = r > 255 ? 255 : r;
        px[i + 1] = g > 255 ? 255 : g;
        px[i + 2] = b > 255 ? 255 : b;
        px[i + 3] = pEdge[k] * 255;
      }
      ctx.putImageData(img, 0, 0);
    };

    return { frame };
  });

  return <canvas ref={ref} aria-hidden className={`h-full w-full ${className}`} />;
}
