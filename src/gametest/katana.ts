// The Dragon Katana ability on a real engine (L0-katn-ac03, L0-katn-ac04): the
// jump, its cooldown, the clamp, a wall, liquids, suffocation, a boxed-in
// refusal, untouched blocks and the off hand. src/gametest/main.ts arms its
// own copy of src/katana: the release pack cannot read a SimulatedPlayer.
//
// Every scenario builds its arena east of the 7×7 platform and puts back each
// cell it touched: `gametest clearall` resets only the platform. Every press is
// repeated until its input event is seen — SimulatedPlayer swallows every
// second use (CNTR-XCX14).

import {
  type Block,
  BlockPermutation,
  Direction,
  EntityComponentTypes,
  EntityDamageCause,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector2,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { clearCooldown, startCooldown } from "../legendary/cooldown";
import { DRAGON_KATANA, SCYTHE_OF_CALAMITY, cooldownKey } from "../legendary/registry";
import { type Activation, observeActivations } from "../katana";

const STRUCTURE = "andrew:platform";
const PREFIX = "kata_";
const SLOT = 0;
/** The jumper's feet cell, on the platform floor; it faces +x down the runway. */
const START: Vector3 = { x: 2, y: 2, z: 3 };
const FLOOR_Y = 1;
const CD_KEY = cooldownKey(DRAGON_KATANA.abilityKey);
/** T05: the cooldown left right after a jump (katn-ac03). */
const COOLDOWN_LEFT_MS: readonly [number, number] = [29_500, 30_000];
/** Positions are single-precision; a 20.0-block move reads back up to this much over. */
const FLOAT32_SLACK = 1e-4;
const SUFFOCATION_WATCH_TICKS = 40;

const log = (msg: string): void => console.warn(`[gametest] katana ${msg}`);
const f3 = (v: Vector3): string => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
const cellKey = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
/** The cell the feet stand in; a float32 y a hair under the floor top still counts as on it. */
const feetCell = (p: Player): Vector3 => ({ x: Math.floor(p.location.x), y: Math.floor(p.location.y + 1e-3), z: Math.floor(p.location.z) });
const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err)).split("\n")[0];

// ---------------------------------------------------------------- witnesses

type Input = "before.itemUse" | "itemUse" | "itemStartUseOn" | "before.interactWithBlock" | "interactWithBlock" | "swing";

interface Raised {
  kind: Input;
  tick: number;
  detail: string;
}

const inputs = new Map<string, Raised[]>();

function witness(player: Player | undefined, kind: Input, detail: string): void {
  if (player === undefined || !player.isValid || !player.name.startsWith(PREFIX)) return;
  const list = inputs.get(player.id) ?? [];
  list.push({ kind, tick: system.currentTick, detail });
  inputs.set(player.id, list);
}

world.beforeEvents.itemUse.subscribe((e) => witness(e.source, "before.itemUse", e.itemStack.typeId));
world.afterEvents.itemUse.subscribe((e) => witness(e.source, "itemUse", e.itemStack.typeId));
world.afterEvents.itemStartUseOn.subscribe((e) => witness(e.source, "itemStartUseOn", e.itemStack?.typeId ?? "empty"));
world.beforeEvents.playerInteractWithBlock.subscribe((e) =>
  witness(e.player, "before.interactWithBlock", `${e.itemStack?.typeId ?? "empty"} first=${e.isFirstEvent}`)
);
world.afterEvents.playerInteractWithBlock.subscribe((e) => witness(e.player, "interactWithBlock", e.itemStack?.typeId ?? "empty"));
world.afterEvents.playerSwingStart.subscribe((e) => witness(e.player, "swing", `${e.swingSource} ${e.heldItemStack?.typeId ?? "empty"}`));

const inputsOf = (player: Player): Raised[] => inputs.get(player.id) ?? [];

/** An activation and what the player read in its tick, right after the teleport and the cooldown. */
interface Seen {
  activation: Activation;
  tick: number;
  feet: Vector3;
  head: Vector3;
  rotation: Vector2;
  cooldown: unknown;
  now: number;
}

const seen: Seen[] = [];

observeActivations((activation) => {
  const p = activation.player;
  if (!p.name.startsWith(PREFIX)) return;
  seen.push({
    activation,
    tick: system.currentTick,
    feet: { ...p.location },
    head: { ...p.getHeadLocation() },
    rotation: { ...p.getRotation() },
    cooldown: p.getDynamicProperty(CD_KEY),
    now: Date.now(),
  });
});

const seenBy = (player: Player): Seen[] => seen.filter((s) => s.activation.player.id === player.id);

// ---------------------------------------------------------------- presses

type Press =
  | { kind: "use" }
  | { kind: "useOn"; block: Vector3; face: Direction }
  | { kind: "interactWithBlock"; block: Vector3; face: Direction }
  | { kind: "interact" };

const EXPECTED: Partial<Record<Press["kind"], Input>> = { use: "itemUse", useOn: "itemStartUseOn" };

function fire(player: SimulatedPlayer, p: Press): boolean {
  switch (p.kind) {
    case "use":
      return player.useItemInSlot(player.selectedSlotIndex);
    case "useOn":
      return player.useItemInSlotOnBlock(player.selectedSlotIndex, p.block, p.face);
    case "interactWithBlock":
      return player.interactWithBlock(p.block, p.face);
    case "interact":
      return player.interact();
  }
}

/** Performs `p` until its input event is seen; returns the tick of that event. */
async function press(test: Test, player: SimulatedPlayer, p: Press): Promise<number> {
  const expected = EXPECTED[p.kind];
  if (expected === undefined) throw new Error(`press ${p.kind}: no input event is known for it`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const from = inputsOf(player).length;
    fire(player, p);
    for (let t = 0; t < 4; t++) {
      await test.idle(1);
      const hit = inputsOf(player)
        .slice(from)
        .find((e) => e.kind === expected);
      if (hit !== undefined) return hit.tick;
    }
    await test.idle(1);
  }
  throw new Error(`${player.name} ${p.kind}: no ${expected} after 3 attempts — the press never reached the handlers`);
}

// ---------------------------------------------------------------- arena

type States = Record<string, string | number | boolean>;

/** Every cell a scenario writes, with what it held before, so `restore` can put it back. */
class Arena {
  private readonly saved = new Map<string, { at: Vector3; permutation: BlockPermutation }>();

  constructor(private readonly test: Test) {}

  private blockAt(rel: Vector3): Block {
    const at = this.test.worldBlockLocation(rel);
    const block = this.test.getDimension().getBlock(at);
    if (block === undefined) throw new Error(`arena cell ${cellKey(rel)} is not loaded`);
    return block;
  }

  set(rel: Vector3, id: string, states?: States): void {
    const block = this.blockAt(rel);
    const k = cellKey(block.location);
    if (!this.saved.has(k)) this.saved.set(k, { at: block.location, permutation: block.permutation });
    if (!block.permutation.matches(id, states)) block.setPermutation(BlockPermutation.resolve(id, states));
  }

  fill(from: Vector3, to: Vector3, id: string, states?: States): void {
    for (let x = from.x; x <= to.x; x++)
      for (let y = from.y; y <= to.y; y++) for (let z = from.z; z <= to.z; z++) this.set({ x, y, z }, id, states);
  }

  /** Puts back every saved cell; each cell in its own try, so one failure does not strand the rest. */
  restore(): string[] {
    const failures: string[] = [];
    const dim = this.test.getDimension();
    for (const { at, permutation } of this.saved.values()) {
      try {
        dim.getBlock(at)?.setPermutation(permutation);
      } catch (err) {
        failures.push(`${cellKey(at)}: ${errText(err)}`);
      }
    }
    return failures;
  }
}

/** A stone floor at y=1 and clear air above it over x 0..`toX`, z `z0`..`z1`. */
function runway(arena: Arena, toX: number, z0 = 0, z1 = 6, height = 6): void {
  arena.fill({ x: 0, y: FLOOR_Y, z: z0 }, { x: toX, y: FLOOR_Y, z: z1 }, "minecraft:stone");
  arena.fill({ x: 0, y: FLOOR_Y + 1, z: z0 }, { x: toX, y: FLOOR_Y + height, z: z1 }, "minecraft:air");
}

/** Every block in the box as typeId plus its states (T10). */
function snapshot(test: Test, from: Vector3, to: Vector3): Map<string, string> {
  const out = new Map<string, string>();
  const dim = test.getDimension();
  for (let x = from.x; x <= to.x; x++)
    for (let y = from.y; y <= to.y; y++)
      for (let z = from.z; z <= to.z; z++) {
        const block = dim.getBlock(test.worldBlockLocation({ x, y, z }));
        out.set(cellKey({ x, y, z }), block === undefined ? "unloaded" : `${block.typeId}${JSON.stringify(block.permutation.getAllStates())}`);
      }
  return out;
}

function diff(before: Map<string, string>, after: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [k, v] of before) if (after.get(k) !== v) out.push(`${k}: ${v} -> ${after.get(k) ?? "missing"}`);
  return out;
}

// ---------------------------------------------------------------- the jumper

function equippable(player: Player) {
  const component = player.getComponent(EntityComponentTypes.Equippable);
  if (component === undefined) throw new Error(`${player.name} has no equippable component`);
  return component;
}

interface Hands {
  main?: string;
  off?: string;
}

/** A Survival jumper on START holding `hands` (the Katana in the main hand by default), ready. */
async function jumper(test: Test, name: string, hands: Hands = { main: DRAGON_KATANA.itemId }): Promise<SimulatedPlayer> {
  const player = test.spawnSimulatedPlayer(START, `${PREFIX}${name}`, GameMode.Survival);
  await test.idle(4);
  player.selectedSlotIndex = SLOT;
  if (hands.main !== undefined) player.setItem(new ItemStack(hands.main, 1), SLOT, true);
  if (hands.off !== undefined) {
    test.assert(equippable(player).setEquipment(EquipmentSlot.Offhand, new ItemStack(hands.off, 1)), `the off hand refused ${hands.off}`);
  }
  clearCooldown(player, DRAGON_KATANA.abilityKey);
  await test.idle(2);
  return player;
}

/**
 * Turns the jumper so its view ray from getHeadLocation() passes through the
 * test-relative point `at`. lookAtLocation aims from a higher eye than
 * getHeadLocation() reports (1.62 against 1.52 on 1.26.51.1), so a plain look
 * at a floor block 19 out makes the ray land on the block before it: the first
 * look measures that eye, the second aims from it.
 */
async function aim(test: Test, player: SimulatedPlayer, at: Vector3): Promise<void> {
  player.lookAtLocation(at);
  await test.idle(4);
  const head = test.relativeLocation(player.getHeadLocation());
  const view = player.getViewDirection();
  const flat = Math.hypot(view.x, view.z);
  if (flat < 1e-6) return;
  const lookEye = at.y - (view.y / flat) * Math.hypot(at.x - head.x, at.z - head.z);
  const lift = lookEye - head.y;
  if (Math.abs(lift) < 1e-4) return;
  player.lookAtLocation({ x: at.x, y: at.y + lift, z: at.z });
  await test.idle(4);
}

/** A point 30 blocks out from the head along yaw `deg` from +x toward +z, level. */
function levelAim(test: Test, player: Player, deg: number): Vector3 {
  const head = test.relativeLocation(player.getHeadLocation());
  const r = (deg * Math.PI) / 180;
  return { x: head.x + 30 * Math.cos(r), y: head.y, z: head.z + 30 * Math.sin(r) };
}

function viewHit(test: Test, player: Player): string {
  const hit = player.getBlockFromViewDirection({ maxDistance: 64 });
  return hit === undefined ? "none" : `${hit.block.typeId}@${cellKey(test.relativeBlockLocation(hit.block.location))} ${hit.face}`;
}

/** The single activation `player` made since `before` activations; fails the test otherwise. */
function onlyJump(test: Test, player: Player, before: number, label: string): Seen {
  const made = seenBy(player).slice(before);
  test.assert(made.length === 1, `${label}: ${made.length} activations, expected one`);
  test.assert(made[0].activation.jumped, `${label}: the activation refused (feet ${made[0].activation.plan.feet === undefined ? "none" : f3(made[0].activation.plan.feet)})`);
  return made[0];
}

function describe(test: Test, s: Seen): string {
  const a = s.activation;
  const rel = test.relativeLocation(s.feet);
  return (
    `slot=${a.slot} stoppedBy=${a.plan.stoppedBy} face=${a.plan.hitFace ?? "-"} endpoint=${f3(test.relativeLocation(a.plan.endpoint))} ` +
    `feet=${f3(rel)} headMoved=${len(sub(s.head, a.plan.head)).toFixed(6)} yaw ${a.rotation.y.toFixed(3)}->${s.rotation.y.toFixed(3)} ` +
    `pitch ${a.rotation.x.toFixed(3)}->${s.rotation.x.toFixed(3)}`
  );
}

/** Counts suffocation hurts of `player` over the next `ticks`. */
async function suffocationOver(test: Test, player: Player, ticks: number): Promise<number> {
  let hurts = 0;
  const sub = world.afterEvents.entityHurt.subscribe((e) => {
    if (e.hurtEntity.id === player.id && e.damageSource.cause === EntityDamageCause.suffocation) hurts++;
  });
  try {
    await test.idle(ticks);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(sub);
  }
  return hurts;
}

/** Both cells a standing player occupies are air. */
function bodyCellsFree(test: Test, player: Player): string | undefined {
  const feet = feetCell(player);
  const dim = test.getDimension();
  for (const cell of [feet, { ...feet, y: feet.y + 1 }]) {
    const block = dim.getBlock(cell);
    if (block === undefined || !block.isAir) return `${cellKey(test.relativeBlockLocation(cell))} holds ${block?.typeId ?? "unloaded"}`;
  }
  return undefined;
}

/** A scenario body run with its arena and players cleaned up before the verdict. */
function scenario(name: string, maxTicks: number, body: (test: Test, arena: Arena, players: SimulatedPlayer[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const arena = new Arena(test);
    const players: SimulatedPlayer[] = [];
    try {
      await body(test, arena, players);
    } finally {
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
      const failures = arena.restore();
      if (failures.length > 0) log(`${name} RESTORE failed for ${failures.length} cells: ${failures.slice(0, 3).join("; ")}`);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

// ---------------------------------------------------------------- T05 + cooldown no-op (katn-ac03)

/** The floor block 19 ahead of the jumper's feet. */
const FLOOR_TARGET: Vector3 = { x: START.x + 19, y: FLOOR_Y, z: START.z };

/** T05: feet on top of the target (±0.5), same tick, rotation kept, 29.5–30 s left. Returns the failures. */
function judgeFloorJump(test: Test, s: Seen, inputTick: number): string[] {
  const failures: string[] = [];
  const top = test.worldLocation({ x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });
  const off = sub(s.feet, top);
  if (Math.abs(off.x) > 0.5 || Math.abs(off.y) > 0.5 || Math.abs(off.z) > 0.5) failures.push(`feet ${f3(off)} off the top of the target block`);
  if (s.tick !== inputTick || s.activation.tick !== inputTick) failures.push(`input tick ${inputTick}, activation tick ${s.activation.tick}, read tick ${s.tick}`);
  if (Math.abs(s.rotation.y - s.activation.rotation.y) > 0.01) failures.push(`yaw ${s.activation.rotation.y} -> ${s.rotation.y}`);
  const left = typeof s.cooldown === "number" ? s.cooldown - s.now : NaN;
  if (!(left >= COOLDOWN_LEFT_MS[0] && left <= COOLDOWN_LEFT_MS[1])) failures.push(`cooldown left ${left} ms`);
  return failures;
}

scenario("katana_floor_jump", 300, async (test, arena, players) => {
  runway(arena, 26);
  const player = await jumper(test, "floor");
  players.push(player);
  await aim(test, player, { x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });
  const aimed = viewHit(test, player);
  test.assert(aimed === `minecraft:stone@${cellKey(FLOOR_TARGET)} Up`, `the jumper does not look at the floor block 19 ahead: ${aimed}`);
  const yawBefore = player.getRotation().y;

  const tick = await press(test, player, { kind: "use" });
  const jump = onlyJump(test, player, 0, "T05");
  const failures = judgeFloorJump(test, jump, tick);
  if (Math.abs(yawBefore - jump.rotation.y) > 0.01) failures.push(`yaw before the press ${yawBefore}, after the jump ${jump.rotation.y}`);
  log(`T05 RESULT ${describe(test, jump)} inputTick=${tick} cooldownLeft=${(jump.cooldown as number) - jump.now} ms aimed=${aimed}`);
  test.assert(failures.length === 0, `T05: ${failures.join("; ")}`);

  // katn-ac03 "Cooldown no-op": 1 s later the press moves nothing and writes nothing.
  await test.idle(20);
  const cdBefore = player.getDynamicProperty(CD_KEY);
  const at = { ...player.location };
  await press(test, player, { kind: "use" });
  await test.idle(4);
  const cdAfter = player.getDynamicProperty(CD_KEY);
  const moved = len(sub(player.location, at));
  log(`T05 RESULT on cooldown: activations=${seenBy(player).length} moved=${moved} cooldown ${String(cdBefore)} -> ${String(cdAfter)}`);
  test.assert(seenBy(player).length === 1, "the press on cooldown reached the plan");
  test.assert(Object.is(cdBefore, cdAfter), `the press on cooldown rewrote the timer: ${String(cdBefore)} -> ${String(cdAfter)}`);
  test.assert(moved < 1e-6, `the press on cooldown moved the player by ${moved}`);
});

// ---------------------------------------------------------------- T06: the clamp (katn-ac03)

scenario("katana_open_air_clamp", 400, async (test, arena, players) => {
  runway(arena, 25, 0, 21, 5);
  const player = await jumper(test, "clamp");
  players.push(player);
  const start = { ...player.location };
  const results: string[] = [];
  for (const yaw of [0, 45]) {
    clearCooldown(player, DRAGON_KATANA.abilityKey);
    player.teleport(start, { rotation: { x: 0, y: -90 } });
    await test.idle(2);
    await aim(test, player, levelAim(test, player, yaw));
    const before = seenBy(player).length;
    await press(test, player, { kind: "use" });
    const jump = onlyJump(test, player, before, `yaw ${yaw}`);
    const moved = len(sub(jump.head, jump.activation.plan.head));
    log(`T06 RESULT yaw ${yaw}: ${describe(test, jump)}`);
    test.assert(jump.activation.plan.stoppedBy === "range", `yaw ${yaw}: the trace stopped at ${jump.activation.plan.stoppedBy}, not at the 20-block cap`);
    test.assert(moved >= 19 && moved <= 20 + FLOAT32_SLACK, `yaw ${yaw}: the head moved ${moved.toFixed(6)}, expected 19.0–20.0`);
    results.push(`${yaw}°=${moved.toFixed(6)}`);
  }
  log(`T06 RESULT head displacement ${results.join(" ")}`);
});

// ---------------------------------------------------------------- T07: a three-block stone wall (katn-ac04)

const WALL_NEAR_X = 12;

function wall(arena: Arena): void {
  arena.fill({ x: WALL_NEAR_X, y: FLOOR_Y + 1, z: 1 }, { x: WALL_NEAR_X + 2, y: FLOOR_Y + 5, z: 5 }, "minecraft:stone");
}

scenario("katana_wall", 300, async (test, arena, players) => {
  runway(arena, 22);
  wall(arena);
  const player = await jumper(test, "wall");
  players.push(player);
  const head = test.relativeLocation(player.getHeadLocation());
  await aim(test, player, { x: head.x + 15, y: head.y, z: head.z });
  await press(test, player, { kind: "use" });
  const jump = onlyJump(test, player, 0, "T07");
  const face = test.worldBlockLocation({ x: WALL_NEAR_X, y: 0, z: 0 }).x;
  const gap = face - jump.feet.x;
  log(`T07 RESULT ${describe(test, jump)} nearFaceMinusFeetX=${gap.toFixed(3)}`);
  test.assert(jump.activation.plan.stoppedBy === "block", `the trace stopped at ${jump.activation.plan.stoppedBy}, not at the wall`);
  test.assert(gap > 0, `the feet are at x ${jump.feet.x}, not in front of the wall's near face ${face}`);
  test.assert(gap <= 1.5, `the feet are ${gap.toFixed(3)} from the wall's near face, more than 1.5`);
});

// ---------------------------------------------------------------- T08: water and lava across the path (katn-ac04)

const CURTAIN_X = 9;
const CHANNEL_X = 22;
const LIQUID_TARGET: Vector3 = { x: 16, y: FLOOR_Y, z: 3 };

/**
 * A 2-thick, 3-high curtain of `liquid` sources across a walled channel. The
 * walls keep the flow inside cells the arena saved, so restore() takes all of it.
 */
function curtain(arena: Arena, liquid: string): void {
  runway(arena, CHANNEL_X);
  for (const z of [0, 6]) arena.fill({ x: 0, y: FLOOR_Y + 1, z }, { x: CHANNEL_X, y: FLOOR_Y + 4, z }, "minecraft:stone");
  arena.fill({ x: CURTAIN_X, y: FLOOR_Y + 1, z: 1 }, { x: CURTAIN_X + 1, y: FLOOR_Y + 3, z: 5 }, liquid);
}

function liquidLeft(test: Test, liquid: string): number {
  let left = 0;
  const dim = test.getDimension();
  for (let x = -1; x <= CHANNEL_X + 1; x++)
    for (let y = 0; y <= FLOOR_Y + 6; y++)
      for (let z = -1; z <= 7; z++) {
        const id = dim.getBlock(test.worldBlockLocation({ x, y, z }))?.typeId ?? "";
        if (id.endsWith(liquid)) left++;
      }
  return left;
}

function liquidScenario(name: string, liquid: "water" | "lava"): void {
  scenario(name, 300, async (test, arena, players) => {
    const player = await jumper(test, liquid);
    players.push(player);
    if (liquid === "lava") player.addEffect("fire_resistance", 600, { showParticles: false });
    let passed = false;
    try {
      curtain(arena, `minecraft:${liquid}`);
      await aim(test, player, { x: LIQUID_TARGET.x + 0.5, y: FLOOR_Y + 1, z: LIQUID_TARGET.z + 0.5 });
      const crossed = [CURTAIN_X, CURTAIN_X + 1].map((x) => test.getBlock({ x, y: FLOOR_Y + 1, z: 3 }).typeId);
      await press(test, player, { kind: "use" });
      const jump = onlyJump(test, player, 0, "T08");
      const curtainFar = test.worldBlockLocation({ x: CURTAIN_X + 2, y: 0, z: 0 }).x;
      log(`T08 RESULT ${liquid}: ${describe(test, jump)} curtain cells on the path ${crossed.join(",")}`);
      test.assert(crossed.every((id) => id === `minecraft:${liquid}`), `the ${liquid} curtain is not on the path: ${crossed.join(",")}`);
      test.assert(jump.activation.plan.hitFace === "Up", `the trace stopped at ${jump.activation.plan.stoppedBy}/${jump.activation.plan.hitFace ?? "-"}, not on the floor beyond the ${liquid}`);
      test.assert(jump.feet.x >= curtainFar, `the feet are at x ${jump.feet.x}, not beyond the ${liquid} (far face ${curtainFar})`);
      passed = true;
    } finally {
      // The flow stays inside the channel's saved cells; whatever is left would reach the next scenario.
      arena.restore();
      await test.idle(2);
      const left = liquidLeft(test, liquid);
      log(`T08 RESULT ${liquid}: ${left} ${liquid} cells left after the restore`);
      if (passed) test.assert(left === 0, `${left} ${liquid} cells outlived the restore`);
    }
  });
}

liquidScenario("katana_through_water", "water");
liquidScenario("katana_through_lava", "lava");

// ---------------------------------------------------------------- T09: no suffocation, and the boxed-in refusal (katn-ac04)

async function noSuffocation(test: Test, player: SimulatedPlayer, label: string): Promise<void> {
  const startCell = feetCell(player);
  await press(test, player, { kind: "use" });
  const jump = onlyJump(test, player, 0, label);
  const blocked = bodyCellsFree(test, player);
  const hurts = await suffocationOver(test, player, SUFFOCATION_WATCH_TICKS);
  const cell = feetCell(player);
  log(`T09 RESULT ${label}: ${describe(test, jump)} bodyCells=${blocked ?? "free"} suffocation=${hurts} cell=${cellKey(test.relativeBlockLocation(cell))}`);
  test.assert(blocked === undefined, `${label}: after the jump ${blocked}`);
  test.assert(hurts === 0, `${label}: ${hurts} suffocation hurts in ${SUFFOCATION_WATCH_TICKS} ticks`);
  test.assert(cellKey(cell) !== cellKey(startCell), `${label}: the player is still in its start cell`);
}

// A 1-high slit at head height through a 3-thick block: the endpoint lies in the slit.
scenario("katana_slit_no_suffocation", 300, async (test, arena, players) => {
  runway(arena, 22);
  wall(arena);
  for (const x of [WALL_NEAR_X, WALL_NEAR_X + 1]) arena.set({ x, y: FLOOR_Y + 2, z: 3 }, "minecraft:air");
  const player = await jumper(test, "slit");
  players.push(player);
  await aim(test, player, { x: WALL_NEAR_X + 2, y: FLOOR_Y + 2.5, z: 3.5 });
  await noSuffocation(test, player, "slit");
});

// A floor hit under a ceiling 1 block above the floor: the aimed feet cell has no head room.
scenario("katana_crawlspace_no_suffocation", 300, async (test, arena, players) => {
  runway(arena, 22);
  arena.fill({ x: WALL_NEAR_X, y: FLOOR_Y + 2, z: 0 }, { x: 20, y: FLOOR_Y + 4, z: 6 }, "minecraft:stone");
  const player = await jumper(test, "crawl");
  players.push(player);
  await aim(test, player, { x: 17.5, y: FLOOR_Y + 1, z: 3.5 });
  await noSuffocation(test, player, "crawlspace");
});

scenario("katana_boxed_refusal", 200, async (test, arena, players) => {
  const player = await jumper(test, "boxed");
  players.push(player);
  for (const y of [FLOOR_Y + 1, FLOOR_Y + 2]) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) arena.set({ x: START.x + dx, y, z: START.z + dz }, "minecraft:stone");
  }
  arena.set({ x: START.x, y: FLOOR_Y + 3, z: START.z }, "minecraft:stone");
  const head = test.relativeLocation(player.getHeadLocation());
  await aim(test, player, { x: head.x + 15, y: head.y, z: head.z });
  const at = { ...player.location };
  await press(test, player, { kind: "use" });
  await test.idle(4);
  const made = seenBy(player);
  const moved = len(sub(player.location, at));
  const cd = player.getDynamicProperty(CD_KEY);
  log(`T09 RESULT boxed: activations=${made.length} jumped=${made[0]?.activation.jumped} feet=${made[0]?.activation.plan.feet === undefined ? "none" : "planned"} moved=${moved} cooldown=${String(cd)}`);
  test.assert(made.length === 1, `${made.length} activations, expected the one refusal`);
  test.assert(!made[0].activation.jumped && made[0].activation.plan.feet === undefined, "the boxed-in press was not refused");
  test.assert(moved < 1e-6, `the refused press moved the player by ${moved}`);
  test.assert(cd === undefined, `the refused press wrote the cooldown: ${String(cd)}`);
});

// ---------------------------------------------------------------- T10: no block changes (katn-ac04)

const AREA_FROM: Vector3 = { x: -1, y: 0, z: -1 };
const AREA_TO: Vector3 = { x: 23, y: FLOOR_Y + 7, z: 7 };

scenario("katana_blocks_unchanged", 300, async (test, arena, players) => {
  runway(arena, 22);
  wall(arena);
  // Things the trace passes, on and off the path, and part-blocks beside it.
  arena.set({ x: 5, y: FLOOR_Y, z: 3 }, "minecraft:grass_block");
  arena.set({ x: 5, y: FLOOR_Y + 1, z: 3 }, "minecraft:short_grass");
  arena.set({ x: 6, y: FLOOR_Y, z: 2 }, "minecraft:grass_block");
  arena.set({ x: 6, y: FLOOR_Y + 1, z: 2 }, "minecraft:poppy");
  arena.set({ x: 7, y: FLOOR_Y + 2, z: 3 }, "minecraft:web");
  arena.set({ x: 8, y: FLOOR_Y + 1, z: 3 }, "minecraft:white_carpet");
  arena.set({ x: 9, y: FLOOR_Y + 1, z: 5 }, "minecraft:oak_slab", { "minecraft:vertical_half": "bottom" });
  arena.set({ x: 10, y: FLOOR_Y + 1, z: 1 }, "minecraft:oak_fence");
  arena.set({ x: 11, y: FLOOR_Y + 1, z: 5 }, "minecraft:glass");
  const player = await jumper(test, "blocks");
  players.push(player);
  const head = test.relativeLocation(player.getHeadLocation());
  await aim(test, player, { x: head.x + 15, y: head.y, z: head.z });
  const before = snapshot(test, AREA_FROM, AREA_TO);
  await press(test, player, { kind: "use" });
  const jump = onlyJump(test, player, 0, "T10");
  const now = diff(before, snapshot(test, AREA_FROM, AREA_TO));
  await test.idle(10);
  const later = diff(before, snapshot(test, AREA_FROM, AREA_TO));
  log(`T10 RESULT ${describe(test, jump)} cells=${before.size} changed right after=${now.length} after 10 ticks=${later.length}`);
  test.assert(now.length === 0 && later.length === 0, `blocks changed: ${[...now, ...later].slice(0, 4).join("; ")}`);
});

// ---------------------------------------------------------------- off hand (katn-ac03, spec §9)

/**
 * L0-lgnd-as07 / L0-lgnd-r004 measured: with the main hand empty no press
 * raises an input event, so nothing can cast the off-hand Katana. The RESULT
 * line records what each press raised; the scenario fails if one casts it.
 */
scenario("katana_empty_main_no_cast", 400, async (test, arena, players) => {
  runway(arena, 26);
  arena.set({ x: START.x + 1, y: FLOOR_Y + 1, z: START.z + 1 }, "minecraft:noteblock");
  const player = await jumper(test, "emptymain", { off: DRAGON_KATANA.itemId });
  players.push(player);
  await aim(test, player, { x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });
  const floor = { x: START.x + 1, y: FLOOR_Y, z: START.z };
  const noteblock = { x: START.x + 1, y: FLOOR_Y + 1, z: START.z + 1 };
  const presses: Array<[string, Press]> = [
    ["useItemInSlot", { kind: "use" }],
    ["useItemInSlotOnBlock floor", { kind: "useOn", block: floor, face: Direction.Up }],
    ["interactWithBlock floor", { kind: "interactWithBlock", block: floor, face: Direction.Up }],
    ["interactWithBlock noteblock", { kind: "interactWithBlock", block: noteblock, face: Direction.West }],
    ["interact", { kind: "interact" }],
  ];
  const at = { ...player.location };
  const lines: string[] = [];
  let raisedAny = 0;
  for (const [label, p] of presses) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const from = inputsOf(player).length;
      let returned: string;
      try {
        returned = String(fire(player, p));
      } catch (err) {
        returned = `threw ${errText(err)}`;
      }
      await test.idle(3);
      const raised = inputsOf(player).slice(from);
      raisedAny += raised.length;
      lines.push(`${label}#${attempt} returned=${returned} raised=[${raised.map((e) => `${e.kind}(${e.detail})`).join(" ")}]`);
    }
  }
  const made = seenBy(player).length;
  const moved = len(sub(player.location, at));
  log(`EMPTY-MAIN RESULT activations=${made} moved=${moved.toFixed(6)} events=${raisedAny}: ${lines.join("; ")}`);
  test.assert(made === 0 && moved < 1e-6, `an empty main hand cast the off-hand Katana (${made} activations, moved ${moved})`);
});

// L0-katn-r005 / L0-lgnd-r004: a ready main-hand legendary wins the press even
// when it then refuses; with the main hand on cooldown the off-hand Katana fires.
scenario("katana_offhand_behind_main", 300, async (test, arena, players) => {
  runway(arena, 26);
  const player = await jumper(test, "behind", { main: SCYTHE_OF_CALAMITY.itemId, off: DRAGON_KATANA.itemId });
  players.push(player);
  clearCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
  await aim(test, player, { x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });
  const at = { ...player.location };
  await press(test, player, { kind: "use" });
  await test.idle(2);
  const whileReady = seenBy(player).length;
  const moved = len(sub(player.location, at));
  log(`HANDS RESULT main Scythe ready: katana activations=${whileReady} moved=${moved.toFixed(6)}`);
  test.assert(whileReady === 0 && moved < 1e-6, `the off-hand Katana fired past a ready main-hand Scythe (${whileReady} activations, moved ${moved})`);

  startCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
  try {
    const tick = await press(test, player, { kind: "use" });
    const jump = onlyJump(test, player, 0, "main on cooldown");
    log(`HANDS RESULT main Scythe on cooldown: ${describe(test, jump)}`);
    test.assert(jump.activation.slot === EquipmentSlot.Offhand, `the Katana fired from ${jump.activation.slot}`);
    const failures = judgeFloorJump(test, jump, tick);
    test.assert(failures.length === 0, `off hand behind the Scythe: ${failures.join("; ")}`);
  } finally {
    clearCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
  }
});

// L0-katn-as02: a use on a block triggers the jump; the aim is still the view.
scenario("katana_use_on_block_aims_by_view", 300, async (test, arena, players) => {
  runway(arena, 25);
  const player = await jumper(test, "useon");
  players.push(player);
  await aim(test, player, levelAim(test, player, 0));
  const view = player.getViewDirection();
  const tap = { x: START.x + 1, y: FLOOR_Y, z: START.z };
  await press(test, player, { kind: "useOn", block: tap, face: Direction.Up });
  const jump = onlyJump(test, player, 0, "use on block");
  const dir = jump.activation.plan.dir;
  const turned = len(sub(dir, view));
  const fromTap = len(sub(jump.feet, test.worldLocation({ x: tap.x + 0.5, y: FLOOR_Y + 1, z: tap.z + 0.5 })));
  log(`USEON RESULT ${describe(test, jump)} viewBefore=${f3(view)} planDir=${f3(dir)} feetFromTappedBlock=${fromTap.toFixed(3)}`);
  test.assert(turned < 1e-3, `the jump followed ${f3(dir)}, not the view ${f3(view)}`);
  test.assert(fromTap > 15, `the player landed ${fromTap.toFixed(3)} from the tapped block: the block was the aim`);
});
