// The Dragon Katana's one-shot fall protection on a real engine (L0-katn-ac05:
// T11, T11 at height, T12, expiry, the in-test negative control; L0-katn-r006).
// The jumper stands on a one-block perch over a stone floor and jumps level
// into the air, so B is the cap point straight above the floor. SimulatedPlayers
// regenerate, so damage is read from entityHurt, never from health.

import {
  BlockPermutation,
  Difficulty,
  type Entity,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityDieAfterEvent,
  type EntityHurtAfterEvent,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { clearCooldown } from "../legendary/cooldown";
import { DRAGON_KATANA, cooldownKey } from "../legendary/registry";
import { type Activation, observeActivations } from "../katana";
import { FALL_FLAG_MS, SAFE_DROP, fallFlagCount, fallWatchRunning, hasFallFlag, setFallWatch } from "../katana/fall";

const STRUCTURE = "andrew:platform";
const PREFIX = "katf_";
const SLOT = 0;
const START: Vector3 = { x: 2, y: 2, z: 3 };
const FLOOR_Y = 1;
/** The perch column; a level jump east from it ends over the floor patch. */
const PERCH = { x: 2, z: 3 };
const PATCH_FROM: Vector3 = { x: 14, y: FLOOR_Y, z: 0 };
const PATCH_TO: Vector3 = { x: 26, y: FLOOR_Y, z: 6 };
/** T11: an air point 15 blocks above stone (katn-ac05). */
const T11_DROP = 15;
/** T11 at height: a 20-block cap point over a 30-block drop, at 4 HP (katn-ac05). */
const HIGH_DROP = 30;
/**
 * Fast enough for a look-ahead of 5. From 152 the first reset comes ~4.8 up,
 * a drop that hurts from rest, so the second reset must follow (README, C-16).
 */
const DEEP_DROP = 152;
const LOW_HEALTH = 4;
/** T12: the ordinary drop after the flag is gone, and the least damage it must deal (katn-ac05). */
const T12_DROP = 10;
const T12_MIN_DAMAGE = 6;
/** How late after `until` the flag may still be seen: the watcher runs once a tick and a tick may lag. */
const EXPIRY_SLACK_MS = 2_000;
const MOB_HIT = 4;
const CD_KEY = cooldownKey(DRAGON_KATANA.abilityKey);

const log = (msg: string): void => console.warn(`[gametest] katana-fall ${msg}`);
const f2 = (v: number): string => v.toFixed(2);
const cellKey = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

// ---------------------------------------------------------------- witnesses

interface Hurt {
  cause: string;
  damage: number;
  tick: number;
  /** Whether the hurt player carried a fall flag when the event arrived. */
  flagged: boolean;
  by: string;
}

/** Every hurt and death of `player` until `stop()`. */
class Witness {
  readonly hurts: Hurt[] = [];
  readonly deaths: string[] = [];
  private readonly hurtSub: (e: EntityHurtAfterEvent) => void;
  private readonly dieSub: (e: EntityDieAfterEvent) => void;

  constructor(player: Player) {
    this.hurtSub = world.afterEvents.entityHurt.subscribe((e) => {
      if (e.hurtEntity.id !== player.id) return;
      this.hurts.push({
        cause: e.damageSource.cause,
        damage: e.damage,
        tick: system.currentTick,
        flagged: hasFallFlag(player),
        by: e.damageSource.damagingEntity?.typeId ?? "-",
      });
    });
    this.dieSub = world.afterEvents.entityDie.subscribe((e) => {
      if (e.deadEntity.id === player.id) this.deaths.push(e.damageSource.cause);
    });
  }

  since(tick: number, cause?: string): Hurt[] {
    return this.hurts.filter((h) => h.tick >= tick && (cause === undefined || h.cause === cause));
  }

  stop(): void {
    world.afterEvents.entityHurt.unsubscribe(this.hurtSub);
    world.afterEvents.entityDie.unsubscribe(this.dieSub);
  }
}

const show = (hurts: Hurt[]): string => `[${hurts.map((h) => `${h.cause}:${f2(h.damage)}${h.flagged ? "(flag)" : ""}`).join(" ")}]`;

/** Activations of this file's jumpers, with what the engine said in the jump tick and the two after it. */
interface Jump {
  activation: Activation;
  tick: number;
  now: number;
  after: string[];
}

const jumps: Jump[] = [];

observeActivations((activation) => {
  const p = activation.player;
  if (!p.name.startsWith(PREFIX)) return;
  const jump: Jump = { activation, tick: system.currentTick, now: Date.now(), after: [] };
  jumps.push(jump);
  const sample = (): void => {
    if (!p.isValid) return;
    jump.after.push(`+${system.currentTick - jump.tick} onGround=${p.isOnGround} vy=${f2(p.getVelocity().y)} flag=${hasFallFlag(p)}`);
  };
  sample();
  for (let t = 1; t <= 6; t++) system.runTimeout(sample, t);
});

const jumpsOf = (player: Player): Jump[] => jumps.filter((j) => j.activation.player.id === player.id);

// ---------------------------------------------------------------- arena

/** Every cell a scenario writes, with what it held before, so `restore` can put it back. */
class Arena {
  private readonly saved = new Map<string, { at: Vector3; permutation: BlockPermutation }>();

  constructor(private readonly test: Test) {}

  set(rel: Vector3, id: string): void {
    const at = this.test.worldBlockLocation(rel);
    const block = this.test.getDimension().getBlock(at);
    if (block === undefined) throw new Error(`arena cell ${cellKey(rel)} is not loaded`);
    if (!this.saved.has(cellKey(at))) this.saved.set(cellKey(at), { at, permutation: block.permutation });
    if (!block.permutation.matches(id)) block.setPermutation(BlockPermutation.resolve(id));
  }

  fill(from: Vector3, to: Vector3, id: string): void {
    for (let x = from.x; x <= to.x; x++) for (let y = from.y; y <= to.y; y++) for (let z = from.z; z <= to.z; z++) this.set({ x, y, z }, id);
  }

  restore(): string[] {
    const failures: string[] = [];
    for (const { at, permutation } of this.saved.values()) {
      try {
        this.test.getDimension().getBlock(at)?.setPermutation(permutation);
      } catch (err) {
        failures.push(`${cellKey(at)}: ${String(err)}`);
      }
    }
    return failures;
  }
}

/** A stone floor under every landing point, with clear air above it. */
function floorPatch(arena: Arena): void {
  arena.fill(PATCH_FROM, PATCH_TO, "minecraft:stone");
  arena.fill({ ...PATCH_FROM, y: FLOOR_Y + 1 }, { ...PATCH_TO, y: FLOOR_Y + 6 }, "minecraft:air");
}

const floorTop = (test: Test): number => test.worldLocation({ x: 0, y: FLOOR_Y + 1, z: 0 }).y;

// ---------------------------------------------------------------- the jumper

async function jumper(test: Test, name: string): Promise<SimulatedPlayer> {
  const player = test.spawnSimulatedPlayer(START, `${PREFIX}${name}`, GameMode.Survival);
  await test.idle(4);
  player.selectedSlotIndex = SLOT;
  player.setItem(new ItemStack(DRAGON_KATANA.itemId, 1), SLOT, true);
  clearCooldown(player, DRAGON_KATANA.abilityKey);
  await test.idle(2);
  return player;
}

/** Puts the jumper, ready and facing east, on a one-block perch `drop` above the floor. */
async function perch(test: Test, arena: Arena, player: SimulatedPlayer, drop: number): Promise<void> {
  arena.set({ x: PERCH.x, y: FLOOR_Y + drop, z: PERCH.z }, "minecraft:stone");
  clearCooldown(player, DRAGON_KATANA.abilityKey);
  player.extinguishFire();
  player.teleport(test.worldLocation({ x: PERCH.x + 0.5, y: FLOOR_Y + drop + 1, z: PERCH.z + 0.5 }), { rotation: { x: 0, y: -90 } });
  await test.idle(4);
  // Level, a hair up: the endpoint's feet cell stays the perch's level (src/gametest/katana.ts aim()).
  const head = test.relativeLocation(player.getHeadLocation());
  const at = { x: head.x + 30, y: head.y + 0.3, z: head.z };
  player.lookAtLocation(at);
  await test.idle(4);
  const eye = test.relativeLocation(player.getHeadLocation());
  const view = player.getViewDirection();
  const flat = Math.hypot(view.x, view.z);
  const lift = at.y - (view.y / flat) * Math.hypot(at.x - eye.x, at.z - eye.z) - eye.y;
  if (Math.abs(lift) >= 1e-4) {
    player.lookAtLocation({ ...at, y: at.y + lift });
    await test.idle(4);
  }
}

/** Uses the Katana until an activation is seen (a SimulatedPlayer swallows every second use); it must be a jump. */
async function jump(test: Test, player: SimulatedPlayer, label: string): Promise<Jump> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const before = jumpsOf(player).length;
    player.useItemInSlot(SLOT);
    for (let t = 0; t < 4; t++) {
      await test.idle(1);
      const made = jumpsOf(player).slice(before);
      if (made.length > 0) {
        test.assert(made.length === 1 && made[0].activation.jumped, `${label}: ${made.length} activations, the first ${made[0].activation.jumped ? "jumped" : "refused"}`);
        return made[0];
      }
    }
    await test.idle(1);
  }
  throw new Error(`${label}: no Katana activation after 3 uses`);
}

/** The drop under B, checked to be the cap point over the floor patch. */
function checkCapPoint(test: Test, j: Jump, drop: number, label: string): number {
  const plan = j.activation.plan;
  const feet = plan.feet as Vector3;
  const above = feet.y - floorTop(test);
  const moved = Math.hypot(feet.x - plan.origin.x, feet.y - plan.origin.y, feet.z - plan.origin.z);
  const rel = test.relativeLocation(feet);
  log(`${label} RESULT B=${f2(rel.x)},${f2(rel.y)},${f2(rel.z)} ${f2(above)} above the floor, moved ${f2(moved)}, trace stopped by ${plan.stoppedBy}`);
  test.assert(plan.stoppedBy === "range" && moved >= 19, `${label}: not a cap jump (stopped by ${plan.stoppedBy}, moved ${f2(moved)})`);
  test.assert(Math.abs(above - drop) < 0.01, `${label}: B is ${f2(above)} above the floor, not ${drop}`);
  test.assert(rel.x >= PATCH_FROM.x && rel.x <= PATCH_TO.x + 1, `${label}: B at x ${f2(rel.x)} is not over the floor patch`);
  return above;
}

interface Landing {
  ticks: number;
  /** Feet height above the floor at each mid-air stop: velocity zeroed between two falling ticks. */
  resets: number[];
}

/** Waits for the feet to rest on the floor, then 5 ticks more for late hurts. */
async function land(test: Test, player: Player, label: string, maxTicks = 300): Promise<Landing> {
  const top = floorTop(test);
  const resets: number[] = [];
  let lastVy = 0;
  for (let t = 0; t < maxTicks; t++) {
    if (!player.isValid) throw new Error(`${label}: the player is gone before landing`);
    const h = player.location.y - top;
    const vy = player.getVelocity().y;
    if (lastVy < -0.2 && Math.abs(vy) < 1e-3 && h > 0.05) resets.push(h);
    lastVy = vy;
    if (player.isOnGround && h < 0.05) {
      await test.idle(5);
      return { ticks: t, resets };
    }
    await test.idle(1);
  }
  throw new Error(`${label}: no landing in ${maxTicks} ticks (feet ${f2(player.location.y - top)} above the floor)`);
}

function healthOf(player: Player) {
  const health = player.getComponent(EntityComponentTypes.Health);
  if (health === undefined) throw new Error(`${player.name} has no health component`);
  return health;
}

/** Drops the player `drop` blocks with a plain teleport: no Katana, no flag. */
async function plainDrop(test: Test, player: Player, drop: number): Promise<void> {
  const loc = player.location;
  player.teleport({ x: loc.x, y: floorTop(test) + drop, z: loc.z });
  await test.idle(1);
}

/** A scenario body run with its arena, players and witnesses cleaned up before the verdict. */
function scenario(name: string, maxTicks: number, body: (test: Test, arena: Arena, players: SimulatedPlayer[], witnesses: Witness[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const arena = new Arena(test);
    const players: SimulatedPlayer[] = [];
    const witnesses: Witness[] = [];
    try {
      await body(test, arena, players, witnesses);
    } finally {
      setFallWatch(true);
      for (const w of witnesses) w.stop();
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

async function noFlagsLeft(test: Test, label: string): Promise<void> {
  await test.idle(2);
  test.assert(fallFlagCount() === 0, `${label}: ${fallFlagCount()} fall flags are left`);
  test.assert(!fallWatchRunning(), `${label}: the fall watcher still runs with no flag`);
}

// ---------------------------------------------------------------- T11, the negative control, T12

scenario("katana_fall_one_shot", 900, async (test, arena, players, witnesses) => {
  floorPatch(arena);
  const player = await jumper(test, "oneshot");
  players.push(player);
  const seen = new Witness(player);
  witnesses.push(seen);
  const propsBefore = new Set(player.getDynamicPropertyIds());
  test.assert(fallFlagCount() === 0 && !fallWatchRunning(), `before any jump: ${fallFlagCount()} flags, watcher running ${fallWatchRunning()}`);

  // Negative control: the same landing with the watcher off must hurt.
  setFallWatch(false);
  let control: Jump;
  try {
    await perch(test, arena, player, T11_DROP);
    control = await jump(test, player, "control");
    checkCapPoint(test, control, T11_DROP, "T11 control (watcher off)");
    const flaggedOff = hasFallFlag(player);
    const landing = await land(test, player, "control");
    const fall = seen.since(control.tick, EntityDamageCause.fall);
    log(`T11 control RESULT watcher off: flag armed=${flaggedOff} watcher running=${fallWatchRunning()} landed +${landing.ticks} resets=[${landing.resets.map(f2).join(" ")}] fall=${show(fall)}; after the jump ${control.after.join("; ")}`);
    test.assert(!fallWatchRunning(), "control: the watcher ran while switched off");
    test.assert(fall.length > 0 && fall.every((h) => h.damage > 0), `control: the unguarded ${T11_DROP}-block landing dealt no fall damage ${show(fall)} — the scenario cannot see the protection`);
  } finally {
    setFallWatch(true);
  }
  await noFlagsLeft(test, "after the control");

  // T11: the guarded landing.
  await perch(test, arena, player, T11_DROP);
  const guarded = await jump(test, player, "T11");
  checkCapPoint(test, guarded, T11_DROP, "T11");
  test.assert(hasFallFlag(player) && fallWatchRunning(), `T11: right after the jump flag=${hasFallFlag(player)} watcher=${fallWatchRunning()}`);
  const landing = await land(test, player, "T11");
  const fall = seen.since(guarded.tick, EntityDamageCause.fall);
  log(`T11 RESULT landed +${landing.ticks} resets=[${landing.resets.map(f2).join(" ")}] fall=${show(fall)} all=${show(seen.since(guarded.tick))} flags=${fallFlagCount()} watcher=${fallWatchRunning()}; after the jump ${guarded.after.join("; ")}`);
  test.assert(fall.length === 0, `T11: the guarded landing dealt fall damage ${show(fall)}`);
  await noFlagsLeft(test, "T11");

  // T12: the flag is spent; an ordinary drop hurts.
  const t12 = system.currentTick;
  await plainDrop(test, player, T12_DROP);
  const ordinary = await land(test, player, "T12");
  const hurt = seen.since(t12, EntityDamageCause.fall);
  log(`T12 RESULT ${T12_DROP}-block /tp drop landed +${ordinary.ticks} fall=${show(hurt)} flags=${fallFlagCount()}`);
  test.assert(hurt.some((h) => h.damage >= T12_MIN_DAMAGE && !h.flagged), `T12: the ordinary ${T12_DROP}-block drop dealt ${show(hurt)}, expected one fall hurt of ${T12_MIN_DAMAGE}+`);
  await noFlagsLeft(test, "T12");

  // Nothing about the flag is persisted: the only property the two jumps wrote is the cooldown.
  const added = player.getDynamicPropertyIds().filter((id) => !propsBefore.has(id));
  log(`T11 RESULT dynamic properties added by two jumps and landings: [${added.join(" ")}]`);
  log(`MEASURE T11 ${T11_DROP} up: watcher off fall ${show(seen.since(control.tick, EntityDamageCause.fall).filter((h) => h.tick < guarded.tick))}, guarded fall ${show(fall)} resets [${landing.resets.map(f2).join(" ")}]; T12 ${T12_DROP}-block fall ${show(hurt)}; dynamic properties added [${added.join(" ")}]`);
  test.assert(added.every((id) => id === CD_KEY), `dynamic properties written besides the cooldown: [${added.join(" ")}]`);
});

// ---------------------------------------------------------------- T11 at height (and faster)

scenario("katana_fall_at_height", 900, async (test, arena, players, witnesses) => {
  floorPatch(arena);
  const player = await jumper(test, "height");
  players.push(player);
  const seen = new Witness(player);
  witnesses.push(seen);
  for (const drop of [HIGH_DROP, DEEP_DROP]) {
    const label = `T11 at ${drop}`;
    await perch(test, arena, player, drop);
    healthOf(player).setCurrentValue(LOW_HEALTH);
    const j = await jump(test, player, label);
    checkCapPoint(test, j, drop, label);
    const landing = await land(test, player, label, 400);
    const fall = seen.since(j.tick, EntityDamageCause.fall);
    const hp = player.isValid ? healthOf(player).currentValue : NaN;
    log(`${label} RESULT health ${LOW_HEALTH} at the jump: landed +${landing.ticks} resets=[${landing.resets.map(f2).join(" ")}] fall=${show(fall)} deaths=[${seen.deaths.join(" ")}] health ${hp}; after the jump ${j.after.join("; ")}`);
    test.assert(seen.deaths.length === 0, `${label}: the player died (${seen.deaths.join(" ")})`);
    test.assert(fall.length === 0, `${label}: the guarded landing dealt fall damage ${show(fall)}`);
    test.assert(hp > 0, `${label}: health ${hp} after the landing`);
    const last = landing.resets[landing.resets.length - 1];
    test.assert(last !== undefined && last < SAFE_DROP, `${label}: the last reset left ${last === undefined ? "no reset" : f2(last)}, not under ${SAFE_DROP}`);
    if (drop === DEEP_DROP) test.assert(landing.resets.length === 2, `${label}: ${landing.resets.length} resets [${landing.resets.map(f2).join(" ")}], expected a second one`);
    log(`MEASURE ${label} at ${LOW_HEALTH} HP: fall ${show(fall)} resets [${landing.resets.map(f2).join(" ")}] deaths [${seen.deaths.join(" ")}] health after ${hp}`);
    await noFlagsLeft(test, label);
  }
});

// ---------------------------------------------------------------- expiry, and other damage under the flag

/** Holds the jumper in the air from the jump tick on, so no landing ends its flag. */
function levitateOnJump(player: Player): () => void {
  return observeActivations((a) => {
    if (a.player.id === player.id && a.jumped) a.player.addEffect("levitation", 600, { amplifier: 0, showParticles: false });
  });
}

const effectIds = (player: Player): string[] => player.getEffects().map((e) => e.typeId);

scenario("katana_fall_expiry_other_damage", 1200, async (test, arena, players, witnesses) => {
  const difficulty = world.getDifficulty();
  const leftovers: Entity[] = [];
  try {
    // A zombie is deleted on Peaceful, where the checks world runs.
    world.setDifficulty(Difficulty.Easy);
    floorPatch(arena);
    const player = await jumper(test, "expiry");
    players.push(player);
    const seen = new Witness(player);
    witnesses.push(seen);
    const zombie = test.spawnWithoutBehaviors("minecraft:zombie", { x: 24, y: FLOOR_Y + 1, z: 0 });
    leftovers.push(zombie);
    zombie.addEffect("fire_resistance", 2000, { showParticles: false });

    // Expiry, with a mob hit while the flag stands.
    await perch(test, arena, player, T11_DROP);
    let unhook = levitateOnJump(player);
    const held = await jump(test, player, "expiry");
    unhook();
    await test.idle(20);
    const effects = effectIds(player);
    test.assert(hasFallFlag(player), `expiry: no flag 20 ticks after the jump; after the jump ${held.after.join("; ")}`);
    test.assert(effects.every((id) => id === "minecraft:levitation"), `the flag came with effects [${effects.join(" ")}]`);
    const hitTick = system.currentTick;
    player.applyDamage(MOB_HIT, { cause: EntityDamageCause.entityAttack, damagingEntity: zombie });
    await test.idle(2);
    const hit = seen.since(hitTick, EntityDamageCause.entityAttack);
    log(`OTHER RESULT mob hit under the flag: ${show(hit)} by ${hit.map((h) => h.by).join(" ") || "-"}; effects [${effects.join(" ")}]`);
    test.assert(hit.some((h) => h.damage > 0 && h.flagged), `a zombie hit under the flag dealt ${show(hit)}`);

    let gone: { ms: number; onGround: boolean; height: number; inWater: boolean } | undefined;
    for (let t = 0; t < 300 && gone === undefined; t++) {
      await test.idle(1);
      if (!hasFallFlag(player)) {
        gone = { ms: Date.now() - held.now, onGround: player.isOnGround, height: player.location.y - floorTop(test), inWater: player.isInWater };
      }
    }
    log(`EXPIRY RESULT flag gone after ${gone?.ms ?? "never"} ms (bound ${FALL_FLAG_MS}): onGround=${gone?.onGround} inWater=${gone?.inWater} ${gone === undefined ? "" : f2(gone.height)} above the floor; watcher=${fallWatchRunning()}`);
    if (gone === undefined) throw new Error("expiry: the flag outlived 15 s in the air");
    test.assert(gone.ms >= FALL_FLAG_MS && gone.ms <= FALL_FLAG_MS + EXPIRY_SLACK_MS, `expiry: the flag went after ${gone.ms} ms, not at ${FALL_FLAG_MS}`);
    test.assert(!gone.onGround && !gone.inWater && gone.height > 2, "expiry: the flag went with the player landed, not by the bound");
    await noFlagsLeft(test, "expiry");

    // The expired flag protects nothing.
    player.removeEffect("levitation");
    const after = system.currentTick;
    await plainDrop(test, player, T12_DROP);
    await land(test, player, "after expiry");
    const fall = seen.since(after, EntityDamageCause.fall);
    log(`EXPIRY RESULT ${T12_DROP}-block drop after the expiry: fall=${show(fall)}`);
    test.assert(fall.some((h) => h.damage > 0), `after the expiry a ${T12_DROP}-block drop dealt ${show(fall)}`);

    // Lava under the flag.
    await perch(test, arena, player, T11_DROP);
    unhook = levitateOnJump(player);
    await jump(test, player, "lava");
    unhook();
    await test.idle(10);
    const loc = player.location;
    const body = test.relativeBlockLocation({ x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) });
    const cells = [0, 1, 2].map((dy) => ({ ...body, y: body.y + dy }));
    const flaggedAtLava = hasFallFlag(player);
    const lavaTick = system.currentTick;
    for (const c of cells) arena.set(c, "minecraft:lava");
    let burnt: Hurt[] = [];
    for (let t = 0; t < 40 && burnt.length === 0; t++) {
      await test.idle(1);
      burnt = seen.since(lavaTick, EntityDamageCause.lava);
    }
    for (const c of cells) arena.set(c, "minecraft:air");
    player.extinguishFire();
    player.removeEffect("levitation");
    player.teleport(test.worldLocation({ x: PERCH.x + 0.5, y: FLOOR_Y + 1, z: PERCH.z + 0.5 }));
    log(`OTHER RESULT lava under the flag (flag armed at the lava=${flaggedAtLava}): ${show(burnt)} all since=${show(seen.since(lavaTick))}`);
    test.assert(flaggedAtLava, "lava: the flag was not armed when the lava came");
    test.assert(burnt.some((h) => h.damage > 0), `lava under the flag dealt ${show(burnt)}`);
    log(`MEASURE expiry: flag gone after ${gone.ms} ms ${f2(gone.height)} up, then a ${T12_DROP}-block fall ${show(fall)}; under the flag: zombie hit ${show(hit)}, lava ${show(burnt)}`);
    await noFlagsLeft(test, "lava");
  } finally {
    world.setDifficulty(difficulty);
    for (const entity of leftovers) if (entity.isValid) entity.remove();
  }
});
