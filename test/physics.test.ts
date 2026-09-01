import { describe, expect, it } from "vitest";
import {
  BURN_RATE,
  createLevel,
  LAND_MAX_VY,
  SHIP,
  step,
  ZERO_INPUT,
} from "../src/sim";
import type { GameState, Pad, Ship, Vec2 } from "../src/sim";

function sand(over: { ship?: Partial<Ship>; gravity?: number; pads?: Pad[]; terrain?: Vec2[] } = {}): GameState {
  const terrain: Vec2[] = over.terrain ?? [
    { x: 0, y: 200 },
    { x: 80, y: 200 },
    { x: 220, y: 200 },
    { x: 400, y: 200 },
  ];
  const pads: Pad[] = over.pads ?? [{ x0: 80, x1: 220, y: 200, multiplier: 2 }];
  const ship: Ship = {
    x: 150,
    y: 40,
    vx: 0,
    vy: 0,
    angle: 0,
    fuel: 100,
    ...over.ship,
  };
  return {
    status: "flying",
    ship,
    terrain,
    pads,
    gravity: over.gravity ?? 40,
    worldWidth: 400,
    worldHeight: 300,
    level: 1,
    score: 0,
    soft: false,
    crashReason: null,
    padMultiplier: 0,
  };
}

describe("step", () => {
  it("gravity increases vy", () => {
    const before = sand({ gravity: 50 });
    const after = step(before, ZERO_INPUT, 0.2);
    expect(after.ship.vy).toBeGreaterThan(before.ship.vy);
    expect(after.ship.vy).toBeCloseTo(10, 8);
    expect(after.status).toBe("flying");
  });

  it("pad landing with slow speed succeeds", () => {
    const startY = 200 - SHIP.tail - 3;
    const before = sand({
      ship: { x: 150, y: startY, vx: 0, vy: 12, angle: 0, fuel: 40 },
    });
    const after = step(before, ZERO_INPUT, 0.3);
    expect(after.status).toBe("landed");
    expect(after.score).toBeGreaterThan(0);
    expect(after.padMultiplier).toBe(2);
    expect(after.ship.vx).toBe(0);
    expect(after.ship.vy).toBe(0);
  });

  it("fast impact crashes", () => {
    const startY = 200 - SHIP.tail - 3;
    const before = sand({
      ship: { x: 150, y: startY, vx: 0, vy: LAND_MAX_VY + 40, angle: 0, fuel: 40 },
    });
    const after = step(before, ZERO_INPUT, 0.2);
    expect(after.status).toBe("crashed");
    expect(after.crashReason).toBe("speed");
    expect(after.score).toBe(0);
  });

  it("thrust reduces fuel", () => {
    const before = sand({ ship: { fuel: 80 }, gravity: 0 });
    const after = step(before, { rotateLeft: false, rotateRight: false, thrust: true }, 0.5);
    expect(after.ship.fuel).toBeLessThan(before.ship.fuel);
    expect(after.ship.fuel).toBeCloseTo(80 - BURN_RATE * 0.5, 8);
    expect(after.ship.vy).toBeLessThan(0);
  });
});

describe("contact", () => {
  it("rock is a crash even when slow and upright", () => {
    const startY = 200 - SHIP.tail - 2;
    const before = sand({
      ship: { x: 40, y: startY, vx: 0, vy: 8, angle: 0, fuel: 20 },
    });
    const after = step(before, ZERO_INPUT, 0.3);
    expect(after.status).toBe("crashed");
    expect(after.crashReason).toBe("terrain");
  });

  it("a tilted pad touch crashes on attitude", () => {
    const startY = 200 - SHIP.tail - 2;
    const before = sand({
      ship: { x: 150, y: startY, vx: 0, vy: 10, angle: 0.55, fuel: 20 },
    });
    const after = step(before, ZERO_INPUT, 0.3);
    expect(after.status).toBe("crashed");
    expect(after.crashReason).toBe("attitude");
  });

  it("does not move after a landing", () => {
    const startY = 200 - SHIP.tail - 3;
    const landed = step(
      sand({ ship: { x: 150, y: startY, vx: 0, vy: 10, angle: 0, fuel: 30 } }),
      ZERO_INPUT,
      0.3,
    );
    expect(landed.status).toBe("landed");
    const later = step(landed, { rotateLeft: true, rotateRight: false, thrust: true }, 1);
    expect(later).toBe(landed);
  });
});

describe("levels", () => {
  it("starts each mare above the ground", () => {
    for (const id of [1, 2, 3]) {
      const s = createLevel(id);
      expect(s.level).toBe(id);
      expect(s.status).toBe("flying");
      expect(s.pads.length).toBeGreaterThanOrEqual(2);
      const grounded = step(
        { ...s, ship: { ...s.ship, vx: 0, vy: 0, angle: 0, y: s.ship.y } },
        ZERO_INPUT,
        0.01,
      );
      expect(grounded.status).toBe("flying");
    }
  });
});
