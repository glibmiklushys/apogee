import { SHIP } from "./constants";
import type { Ship, Vec2 } from "./types";

export function wrapAngle(angle: number): number {
  let a = (angle + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
}

export function shipVertices(ship: Ship): [Vec2, Vec2, Vec2] {
  const { x, y, angle } = ship;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const toWorld = (rx: number, fx: number): Vec2 => ({
    x: x + rx * cos + fx * sin,
    y: y + rx * sin - fx * cos,
  });
  return [
    toWorld(0, SHIP.nose),
    toWorld(-SHIP.halfW, -SHIP.tail),
    toWorld(SHIP.halfW, -SHIP.tail),
  ];
}

export function segmentIntersection(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 | null {
  const d1x = b.x - a.x;
  const d1y = b.y - a.y;
  const d2x = d.x - c.x;
  const d2y = d.y - c.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / denom;
  const u = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + t * d1x, y: a.y + t * d1y };
}
