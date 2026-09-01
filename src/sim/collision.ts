import { LAND_MAX_ANGLE, LAND_MAX_VX, LAND_MAX_VY, SHIP, SOFT_ANGLE, SOFT_VX, SOFT_VY } from "./constants";
import { segmentIntersection, shipVertices, wrapAngle } from "./geometry";
import { groundY, sampleTerrain, terrainSegments } from "./terrain";
import type { CrashReason, GameState, Pad, Ship } from "./types";

export type Contact =
  | { kind: "none" }
  | { kind: "land"; pad: Pad; soft: boolean; score: number }
  | { kind: "crash"; reason: CrashReason };

type Hit = { pad: Pad | null };

function collectHits(state: GameState): Hit[] {
  const verts = shipVertices(state.ship);
  const hits: Hit[] = [];
  const segs = terrainSegments(state.terrain, state.pads);

  for (const v of verts) {
    const sample = sampleTerrain(state.terrain, state.pads, v.x);
    if (sample && v.y >= sample.y) hits.push({ pad: sample.pad });
  }

  const centerSample = sampleTerrain(state.terrain, state.pads, state.ship.x);
  if (centerSample && state.ship.y >= centerSample.y) {
    hits.push({ pad: centerSample.pad });
  }

  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    for (const seg of segs) {
      if (segmentIntersection(a, b, seg.a, seg.b)) {
        hits.push({ pad: seg.pad });
      }
    }
  }

  return hits;
}

function outOfBounds(state: GameState): boolean {
  const { ship, worldWidth, worldHeight } = state;
  if (ship.x < 0 || ship.x > worldWidth || ship.y > worldHeight) return true;
  for (const v of shipVertices(ship)) {
    if (v.x < 0 || v.x > worldWidth || v.y > worldHeight) return true;
  }
  return false;
}

export function isSoftLanding(ship: Ship): boolean {
  return (
    Math.abs(ship.vy) <= SOFT_VY &&
    Math.abs(ship.vx) <= SOFT_VX &&
    Math.abs(wrapAngle(ship.angle)) <= SOFT_ANGLE
  );
}

export function isGentleLanding(ship: Ship): boolean {
  return (
    Math.abs(ship.vy) <= LAND_MAX_VY &&
    Math.abs(ship.vx) <= LAND_MAX_VX &&
    Math.abs(wrapAngle(ship.angle)) <= LAND_MAX_ANGLE
  );
}

export function landingScore(ship: Ship, pad: Pad, soft: boolean): number {
  const base = soft ? 250 : 100;
  const fuelPart = ship.fuel * (soft ? 3 : 1);
  return Math.round(pad.multiplier * base + fuelPart);
}

export function altitude(state: GameState): number {
  const gy = groundY(state.terrain, state.pads, state.ship.x);
  if (gy === null) return 0;
  const feet = state.ship.y + SHIP.tail * Math.cos(state.ship.angle);
  return Math.max(0, gy - feet);
}

export function evaluateContact(state: GameState): Contact {
  if (outOfBounds(state)) return { kind: "crash", reason: "bounds" };

  const hits = collectHits(state);
  if (hits.length === 0) return { kind: "none" };

  const pads = hits.map((h) => h.pad);
  const allPads = pads.every((p) => p !== null);
  const pad = pads.find((p): p is Pad => p !== null) ?? null;

  if (allPads && pad && isGentleLanding(state.ship)) {
    const soft = isSoftLanding(state.ship);
    return { kind: "land", pad, soft, score: landingScore(state.ship, pad, soft) };
  }

  if (!allPads || !pad) return { kind: "crash", reason: "terrain" };

  const tilted = Math.abs(wrapAngle(state.ship.angle)) > LAND_MAX_ANGLE;
  const fast =
    Math.abs(state.ship.vy) > LAND_MAX_VY || Math.abs(state.ship.vx) > LAND_MAX_VX;
  return { kind: "crash", reason: fast ? "speed" : tilted ? "attitude" : "terrain" };
}
