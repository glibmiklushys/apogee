import { BURN_RATE, ROT_SPEED, SHIP, THRUST } from "./constants";
import { evaluateContact } from "./collision";
import { wrapAngle } from "./geometry";
import type { GameState, Input } from "./types";

export const ZERO_INPUT: Input = {
  rotateLeft: false,
  rotateRight: false,
  thrust: false,
};

export function step(state: GameState, input: Input, dt: number): GameState {
  if (state.status !== "flying") return state;
  if (!(dt > 0)) return state;

  const ship = { ...state.ship };

  if (input.rotateLeft) ship.angle -= ROT_SPEED * dt;
  if (input.rotateRight) ship.angle += ROT_SPEED * dt;
  ship.angle = wrapAngle(ship.angle);

  const thrusting = input.thrust && ship.fuel > 0;
  if (thrusting) {
    ship.vx += Math.sin(ship.angle) * THRUST * dt;
    ship.vy -= Math.cos(ship.angle) * THRUST * dt;
    ship.fuel = Math.max(0, ship.fuel - BURN_RATE * dt);
  }

  ship.vy += state.gravity * dt;
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  const next: GameState = { ...state, ship };
  const contact = evaluateContact(next);

  if (contact.kind === "none") return next;

  if (contact.kind === "land") {
    const restedY = contact.pad.y - SHIP.tail * Math.cos(ship.angle);
    return {
      ...next,
      status: "landed",
      soft: contact.soft,
      score: contact.score,
      padMultiplier: contact.pad.multiplier,
      crashReason: null,
      ship: { ...ship, vx: 0, vy: 0, y: restedY, fuel: ship.fuel },
    };
  }

  return {
    ...next,
    status: "crashed",
    crashReason: contact.reason,
    score: 0,
    soft: false,
    padMultiplier: 0,
  };
}
