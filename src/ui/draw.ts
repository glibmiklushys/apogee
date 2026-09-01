import { SHIP, WORLD_HEIGHT, WORLD_WIDTH } from "../sim/constants";
import { shipVertices } from "../sim/geometry";
import { terrainSegments } from "../sim/terrain";
import type { GameState, Input } from "../sim/types";

const SKY = "#0b0c0e";
const TEXT = "#ece6dc";
const GOLD = "#c6a572";
const MUTED = "#8a857b";
const ROCK = "#16171c";
const ROCK_LINE = "rgba(236, 230, 220, 0.14)";
const DANGER = "#b07068";
const FAINT = "rgba(236, 230, 220, 0.08)";

function starfield(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < 52; i++) {
    const x = ((i * 157 + 19) % WORLD_WIDTH) + 0.5;
    const y = ((i * 97 + 41) % 300) + 8;
    const g = 0.12 + ((i * 13) % 7) * 0.04;
    ctx.fillStyle = `rgba(236, 230, 220, ${g})`;
    const s = i % 9 === 0 ? 1.6 : 1;
    ctx.fillRect(x, y, s, s);
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, state: GameState): void {
  const pts = state.terrain;
  if (pts.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
  ctx.lineTo(0, WORLD_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = ROCK;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = ROCK_LINE;
  ctx.lineWidth = 1.25;
  ctx.stroke();

  for (const seg of terrainSegments(state.terrain, state.pads)) {
    if (!seg.pad) continue;
    const { a, b, pad } = seg;
    ctx.fillStyle = "rgba(198, 165, 114, 0.12)";
    ctx.fillRect(a.x, pad.y, b.x - a.x, 7);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(a.x, pad.y + 0.5);
    ctx.lineTo(b.x, pad.y + 0.5);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x + 0.5, pad.y - 4);
    ctx.lineTo(a.x + 0.5, pad.y + 6);
    ctx.moveTo(b.x - 0.5, pad.y - 4);
    ctx.lineTo(b.x - 0.5, pad.y + 6);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.font = "10px 'SF Mono', 'IBM Plex Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`×${pad.multiplier}`, (a.x + b.x) / 2, pad.y - 8);
  }
}

function drawShip(ctx: CanvasRenderingContext2D, state: GameState, thrusting: boolean): void {
  const { ship, status } = state;
  const verts = shipVertices(ship);

  if (thrusting && status === "flying" && ship.fuel > 0) {
    const tailX = ship.x - Math.sin(ship.angle) * (SHIP.tail + 2);
    const tailY = ship.y + Math.cos(ship.angle) * (SHIP.tail + 2);
    const fx = -Math.sin(ship.angle);
    const fy = Math.cos(ship.angle);
    const rx = Math.cos(ship.angle);
    const ry = Math.sin(ship.angle);
    ctx.beginPath();
    ctx.moveTo(tailX + fx * 2, tailY + fy * 2);
    ctx.lineTo(tailX + fx * 13 + rx * 4, tailY + fy * 13 + ry * 4);
    ctx.lineTo(tailX + fx * 13 - rx * 4, tailY + fy * 13 - ry * 4);
    ctx.closePath();
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  ctx.lineTo(verts[1].x, verts[1].y);
  ctx.lineTo(verts[2].x, verts[2].y);
  ctx.closePath();

  if (status === "crashed") ctx.fillStyle = DANGER;
  else if (status === "landed") ctx.fillStyle = GOLD;
  else ctx.fillStyle = TEXT;
  ctx.fill();

  ctx.strokeStyle = status === "crashed" ? "rgba(176, 112, 104, 0.7)" : "rgba(11, 12, 14, 0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function banner(state: GameState): string | null {
  if (state.status === "landed") {
    const kind = state.soft ? "Soft contact" : "Contact";
    return `${kind}  ·  ${state.score}  ·  ×${state.padMultiplier}`;
  }
  if (state.status === "crashed") {
    switch (state.crashReason) {
      case "speed":
        return "Too fast.";
      case "attitude":
        return "Not upright.";
      case "bounds":
        return "Left the mare.";
      default:
        return "The rock does not yield.";
    }
  }
  return null;
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  input: Input,
): void {
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const wash = ctx.createRadialGradient(WORLD_WIDTH / 2, 0, 40, WORLD_WIDTH / 2, 0, 420);
  wash.addColorStop(0, "rgba(198, 165, 114, 0.06)");
  wash.addColorStop(1, "rgba(198, 165, 114, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  starfield(ctx);
  drawTerrain(ctx, state);
  drawShip(ctx, state, input.thrust);

  ctx.strokeStyle = FAINT;
  ctx.strokeRect(0.5, 0.5, WORLD_WIDTH - 1, WORLD_HEIGHT - 1);

  const note = banner(state);
  if (note) {
    ctx.fillStyle = "rgba(11, 12, 14, 0.62)";
    ctx.fillRect(0, WORLD_HEIGHT / 2 - 28, WORLD_WIDTH, 56);
    ctx.fillStyle = state.status === "crashed" ? DANGER : GOLD;
    ctx.font = "16px 'Iowan Old Style', Palatino, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(note, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }

  ctx.fillStyle = MUTED;
  ctx.font = "10px 'Avenir Next', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("APOGEE", 16, 22);
}
