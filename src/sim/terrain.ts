import type { Pad, TerrainSegment, Vec2 } from "./types";

const EPS = 0.51;

export function padForSegment(a: Vec2, b: Vec2, pads: Pad[]): Pad | null {
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  for (const pad of pads) {
    if (
      Math.abs(left - pad.x0) < EPS &&
      Math.abs(right - pad.x1) < EPS &&
      Math.abs(a.y - pad.y) < EPS &&
      Math.abs(b.y - pad.y) < EPS
    ) {
      return pad;
    }
  }
  return null;
}

export function terrainSegments(terrain: Vec2[], pads: Pad[]): TerrainSegment[] {
  const segs: TerrainSegment[] = [];
  for (let i = 0; i < terrain.length - 1; i++) {
    const a = terrain[i];
    const b = terrain[i + 1];
    segs.push({ a, b, pad: padForSegment(a, b, pads) });
  }
  return segs;
}

export function sampleTerrain(
  terrain: Vec2[],
  pads: Pad[],
  x: number,
): { y: number; pad: Pad | null } | null {
  if (terrain.length < 2) return null;
  const first = terrain[0];
  const last = terrain[terrain.length - 1];
  if (x < first.x || x > last.x) return null;
  for (let i = 0; i < terrain.length - 1; i++) {
    const a = terrain[i];
    const b = terrain[i + 1];
    if (x >= a.x && x <= b.x) {
      const span = b.x - a.x;
      const t = span < 1e-9 ? 0 : (x - a.x) / span;
      return { y: a.y + t * (b.y - a.y), pad: padForSegment(a, b, pads) };
    }
  }
  return { y: last.y, pad: null };
}

export function groundY(terrain: Vec2[], pads: Pad[], x: number): number | null {
  return sampleTerrain(terrain, pads, x)?.y ?? null;
}
