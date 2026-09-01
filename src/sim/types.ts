export type Vec2 = {
  x: number;
  y: number;
};

export type Input = {
  rotateLeft: boolean;
  rotateRight: boolean;
  thrust: boolean;
};

export type Pad = {
  x0: number;
  x1: number;
  y: number;
  multiplier: number;
};

export type Ship = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
};

export type Status = "flying" | "landed" | "crashed";

export type CrashReason = "terrain" | "speed" | "attitude" | "bounds";

export type GameState = {
  status: Status;
  ship: Ship;
  terrain: Vec2[];
  pads: Pad[];
  gravity: number;
  worldWidth: number;
  worldHeight: number;
  level: number;
  score: number;
  soft: boolean;
  crashReason: CrashReason | null;
  padMultiplier: number;
};

export type TerrainSegment = {
  a: Vec2;
  b: Vec2;
  pad: Pad | null;
};
