import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type { GameState, Pad, Ship, Vec2 } from "./types";

function flying(
  level: number,
  gravity: number,
  ship: Ship,
  terrain: Vec2[],
  pads: Pad[],
): GameState {
  return {
    status: "flying",
    ship,
    terrain,
    pads,
    gravity,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    level,
    score: 0,
    soft: false,
    crashReason: null,
    padMultiplier: 0,
  };
}

export function createLevel(level: number): GameState {
  const id = Math.min(3, Math.max(1, Math.floor(level)));
  if (id === 1) return levelOne();
  if (id === 2) return levelTwo();
  return levelThree();
}

function levelOne(): GameState {
  const pads: Pad[] = [
    { x0: 170, x1: 360, y: 478, multiplier: 1 },
    { x0: 530, x1: 680, y: 452, multiplier: 2 },
    { x0: 820, x1: 910, y: 468, multiplier: 4 },
  ];
  const terrain: Vec2[] = [
    { x: 0, y: 428 },
    { x: 72, y: 392 },
    { x: 128, y: 456 },
    { x: 170, y: 478 },
    { x: 360, y: 478 },
    { x: 410, y: 418 },
    { x: 468, y: 328 },
    { x: 508, y: 398 },
    { x: 530, y: 452 },
    { x: 680, y: 452 },
    { x: 738, y: 372 },
    { x: 792, y: 408 },
    { x: 820, y: 468 },
    { x: 910, y: 468 },
    { x: 960, y: 430 },
  ];
  return flying(
    1,
    34,
    { x: 108, y: 64, vx: 12, vy: 0, angle: 0.08, fuel: 150 },
    terrain,
    pads,
  );
}

function levelTwo(): GameState {
  const pads: Pad[] = [
    { x0: 188, x1: 308, y: 492, multiplier: 2 },
    { x0: 608, x1: 708, y: 502, multiplier: 4 },
  ];
  const terrain: Vec2[] = [
    { x: 0, y: 410 },
    { x: 88, y: 268 },
    { x: 150, y: 448 },
    { x: 188, y: 492 },
    { x: 308, y: 492 },
    { x: 372, y: 350 },
    { x: 448, y: 236 },
    { x: 518, y: 318 },
    { x: 572, y: 468 },
    { x: 608, y: 502 },
    { x: 708, y: 502 },
    { x: 768, y: 388 },
    { x: 848, y: 302 },
    { x: 960, y: 438 },
  ];
  return flying(
    2,
    50,
    { x: 470, y: 52, vx: -8, vy: 4, angle: -0.06, fuel: 125 },
    terrain,
    pads,
  );
}

function levelThree(): GameState {
  const pads: Pad[] = [
    { x0: 132, x1: 208, y: 512, multiplier: 3 },
    { x0: 488, x1: 548, y: 508, multiplier: 5 },
  ];
  const terrain: Vec2[] = [
    { x: 0, y: 470 },
    { x: 58, y: 338 },
    { x: 102, y: 498 },
    { x: 132, y: 512 },
    { x: 208, y: 512 },
    { x: 268, y: 292 },
    { x: 332, y: 198 },
    { x: 392, y: 306 },
    { x: 448, y: 486 },
    { x: 488, y: 508 },
    { x: 548, y: 508 },
    { x: 610, y: 270 },
    { x: 688, y: 186 },
    { x: 748, y: 328 },
    { x: 808, y: 476 },
    { x: 868, y: 392 },
    { x: 960, y: 452 },
  ];
  return flying(
    3,
    64,
    { x: 792, y: 48, vx: -14, vy: 2, angle: 0.12, fuel: 110 },
    terrain,
    pads,
  );
}
