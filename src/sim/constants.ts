export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;

export const SHIP = {
  nose: 16,
  tail: 10,
  halfW: 8,
} as const;

/** Radians per second. */
export const ROT_SPEED = 2.5;

/** Acceleration along the nose, px/s². */
export const THRUST = 125;

/** Fuel units burned per second while thrusting. */
export const BURN_RATE = 20;

export const LAND_MAX_VY = 40;
export const LAND_MAX_VX = 28;
export const LAND_MAX_ANGLE = 0.2;

export const SOFT_VY = 16;
export const SOFT_VX = 10;
export const SOFT_ANGLE = 0.08;
