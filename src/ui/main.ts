import {
  altitude,
  createLevel,
  step,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  wrapAngle,
  ZERO_INPUT,
} from "../sim";
import type { GameState, Input } from "../sim";
import { drawWorld } from "./draw";

const keys: Input = { ...ZERO_INPUT };
let pointerThrust = false;
let pointerLeft = false;
let pointerRight = false;

let state: GameState = createLevel(1);
let runScore = 0;
let lastLanding = 0;
let scoredThisLand = false;
let advanceTimer: number | null = null;
let lastTs = 0;
let ctx: CanvasRenderingContext2D | null = null;

const els = {
  clock: null as HTMLElement | null,
  status: null as HTMLElement | null,
  alt: null as HTMLElement | null,
  speed: null as HTMLElement | null,
  fuel: null as HTMLElement | null,
  angle: null as HTMLElement | null,
  next: null as HTMLButtonElement | null,
  levels: [] as HTMLButtonElement[],
};

function inputNow(): Input {
  return {
    rotateLeft: keys.rotateLeft || pointerLeft,
    rotateRight: keys.rotateRight || pointerRight,
    thrust: keys.thrust || pointerThrust,
  };
}

function clearAdvance(): void {
  if (advanceTimer !== null) {
    window.clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function setLevel(level: number, resetRun: boolean): void {
  clearAdvance();
  if (resetRun) runScore = 0;
  lastLanding = 0;
  scoredThisLand = false;
  state = createLevel(level);
  syncChrome();
}

function maybeScore(): void {
  if (state.status === "landed" && !scoredThisLand) {
    scoredThisLand = true;
    lastLanding = state.score;
    runScore += state.score;
    if (state.level < 3) {
      clearAdvance();
      advanceTimer = window.setTimeout(() => setLevel(state.level + 1, false), 2800);
    }
  }
}

function statusLine(): { text: string; cls: string } {
  if (state.status === "flying") {
    return {
      text: "Hold the nose up. Gold is the only ground that will take you.",
      cls: "",
    };
  }
  if (state.status === "landed") {
    const next =
      state.level < 3 ? " Next mare in a moment — or pick a level." : " The run is complete.";
    const kind = state.soft ? "Soft contact." : "Contact.";
    return { text: `${kind} ${state.score} on ×${state.padMultiplier}.${next}`, cls: "ok" };
  }
  const why =
    state.crashReason === "speed"
      ? "Too fast for the pad."
      : state.crashReason === "attitude"
        ? "Attitude was not level."
        : state.crashReason === "bounds"
          ? "You left the mare."
          : "You hit the rock.";
  return { text: `${why} R to try the same slope.`, cls: "warn" };
}

function fmt(n: number): string {
  return Math.round(n).toString();
}

function syncChrome(): void {
  if (!els.clock || !els.status || !els.alt || !els.speed || !els.fuel || !els.angle) return;

  const heading = state.level === 3 ? "Apogee" : `Level ${state.level}`;
  els.clock.innerHTML = `<strong>${heading}</strong>run ${fmt(runScore)}${lastLanding ? ` · last ${fmt(lastLanding)}` : ""}`;

  const line = statusLine();
  els.status.textContent = line.text;
  els.status.className = `status ${line.cls}`.trim();

  const spd = Math.hypot(state.ship.vx, state.ship.vy);
  const deg = (wrapAngle(state.ship.angle) * 180) / Math.PI;
  const alt = altitude(state);

  els.alt.textContent = fmt(alt);
  els.speed.textContent = fmt(spd);
  els.fuel.textContent = fmt(state.ship.fuel);
  els.angle.textContent = `${deg >= 0 ? "+" : ""}${fmt(deg)}°`;

  els.fuel.className = state.ship.fuel < 25 ? "low" : "";
  els.speed.className = spd > 40 ? "low" : spd < 18 ? "good" : "";
  els.angle.className = Math.abs(deg) > 12 ? "low" : Math.abs(deg) < 6 ? "good" : "";

  for (const btn of els.levels) {
    btn.classList.toggle("active", Number(btn.dataset.level) === state.level);
  }
  if (els.next) {
    els.next.disabled = !(state.status === "landed" && state.level < 3);
  }
}

function fitCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(WORLD_WIDTH * dpr);
  canvas.height = Math.round(WORLD_HEIGHT * dpr);
  const next = canvas.getContext("2d");
  if (!next) throw new Error("canvas");
  next.setTransform(dpr, 0, 0, dpr, 0, 0);
  return next;
}

function bindHold(button: HTMLElement, set: (on: boolean) => void): void {
  const down = (e: PointerEvent) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    button.classList.add("held");
    set(true);
  };
  const up = () => {
    button.classList.remove("held");
    set(false);
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
}

function onKey(e: KeyboardEvent, down: boolean): void {
  const code = e.code;
  if (code === "ArrowLeft" || code === "ArrowRight" || code === "ArrowUp" || code === "KeyX") {
    e.preventDefault();
  }
  if (code === "ArrowLeft") keys.rotateLeft = down;
  if (code === "ArrowRight") keys.rotateRight = down;
  if (code === "ArrowUp" || code === "KeyX") keys.thrust = down;
  if (down && code === "KeyR" && !e.repeat) {
    setLevel(state.level, false);
  }
}

function shell(): string {
  return `
    <header class="masthead">
      <div>
        <p class="brand">Apogee</p>
        <h1>Set down on the mare.</h1>
        <p class="lede">Rotate with left and right. Thrust with up or X. Land on a gold pad — slow, level, and upright. R restarts the slope. Three mares; gravity and the pads get meaner.</p>
      </div>
      <div class="clock" id="clock"></div>
    </header>
    <div class="toolbar">
      <button type="button" data-level="1">Level 1</button>
      <button type="button" data-level="2">Level 2</button>
      <button type="button" data-level="3">Level 3</button>
      <button type="button" data-act="restart">Restart</button>
      <button type="button" data-act="next" disabled>Next mare</button>
    </div>
    <p class="status" id="status"></p>
    <div class="stage">
      <canvas id="view" width="${WORLD_WIDTH}" height="${WORLD_HEIGHT}" aria-label="Lunar surface"></canvas>
    </div>
    <div class="hud">
      <span>Altitude</span><span id="hud-alt">0</span>
      <span>Speed</span><span id="hud-speed">0</span>
      <span>Fuel</span><span id="hud-fuel">0</span>
      <span>Angle</span><span id="hud-angle">0°</span>
    </div>
    <div class="touch">
      <button type="button" id="touch-left">Left</button>
      <button type="button" id="touch-thrust">Thrust</button>
      <button type="button" id="touch-right">Right</button>
      <button type="button" id="touch-restart" class="wide">Restart</button>
    </div>
  `;
}

function frame(ts: number): void {
  const dt = lastTs === 0 ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  const prev = state.status;
  if (dt > 0) state = step(state, inputNow(), dt);
  if (prev === "flying" && state.status === "landed") maybeScore();
  if (ctx) drawWorld(ctx, state, inputNow());
  syncChrome();
  requestAnimationFrame(frame);
}

export function boot(): void {
  const root = document.getElementById("app");
  if (!root) return;
  root.innerHTML = shell();

  const canvas = document.getElementById("view") as HTMLCanvasElement | null;
  if (!canvas) return;
  ctx = fitCanvas(canvas);
  window.addEventListener("resize", () => {
    if (canvas) ctx = fitCanvas(canvas);
  });

  els.clock = document.getElementById("clock");
  els.status = document.getElementById("status");
  els.alt = document.getElementById("hud-alt");
  els.speed = document.getElementById("hud-speed");
  els.fuel = document.getElementById("hud-fuel");
  els.angle = document.getElementById("hud-angle");
  els.next = root.querySelector('button[data-act="next"]');
  els.levels = Array.from(root.querySelectorAll<HTMLButtonElement>("button[data-level]"));

  for (const btn of els.levels) {
    btn.addEventListener("click", () => setLevel(Number(btn.dataset.level), true));
  }
  const restart = () => setLevel(state.level, false);
  root.querySelector('[data-act="restart"]')?.addEventListener("click", restart);
  document.getElementById("touch-restart")?.addEventListener("click", restart);
  els.next?.addEventListener("click", () => {
    if (state.status === "landed" && state.level < 3) setLevel(state.level + 1, false);
  });

  const left = document.getElementById("touch-left");
  const right = document.getElementById("touch-right");
  const thrust = document.getElementById("touch-thrust");
  if (left) bindHold(left, (on) => (pointerLeft = on));
  if (right) bindHold(right, (on) => (pointerRight = on));
  if (thrust) bindHold(thrust, (on) => (pointerThrust = on));

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  window.addEventListener("blur", () => {
    keys.rotateLeft = keys.rotateRight = keys.thrust = false;
    pointerLeft = pointerRight = pointerThrust = false;
  });

  syncChrome();
  requestAnimationFrame(frame);
}
