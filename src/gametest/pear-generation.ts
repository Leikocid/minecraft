// PEAR-GEN-01 on BDS 1.26.51.1 (spec v3 §7–§8; L0-xcx34, L0-pear-ru03): a plate broken and put back, blown up,
// knocked off its support or crushed by a piston is not the plate a rod was bound to, even when the same type stands
// there again; a /setblock to another type is caught by the type; a hundred presses change nothing; the store of
// generations empties as bindings end. The "[pear-gen] … RESULT" lines are quoted in src/pearl/README.md.

import {
  BlockPermutation,
  BlockVolume,
  type Container,
  Direction,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { bindStats, bindingOf } from "../pearl/bind";
import { BINDING_KEYS, type Binding, HOOK_ID, isPlateType } from "../pearl/bind-rules";
import { PISTON_SETTLE_TICKS, genStats, plateCheck, plateGenerationNow, registerPearlGeneration, watchedNow } from "../pearl/generation";
import { honours } from "../pearl/generation-rules";
import { makePearlRod } from "../pearl/item";
import { LORE_TITLE, LORE_UNBOUND, MARK_KEY } from "../pearl/item-rules";

// The release pack arms the same module and cannot see a SimulatedPlayer; this copy is the one the scenarios drive,
// with its own world dynamic properties (each pack has its own). pear-bind.ts arms this pack's binding.
registerPearlGeneration();

const STRUCTURE = "andrew:platform";
const STONE_PLATE = "minecraft:stone_pressure_plate";
const OAK_PLATE = "minecraft:wooden_pressure_plate";
const ROD_SLOT = 0;
const TOOL_SLOT = 1;
const PLATE_SLOT = 2;

/** The caster on the platform edge, the plate field in front of it (relative y=1 is the floor), and the aim. */
const CAST_FROM: Vector3 = { x: 3, y: 2, z: 0 };
const FIELD_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const FIELD_MAX: Vector3 = { x: 6, y: 2, z: 6 };
const FLOOR_MIN: Vector3 = { x: 0, y: 1, z: 0 };
const FLOOR_MAX: Vector3 = { x: 6, y: 1, z: 6 };
const AIM: Vector3 = { x: 3.5, y: 2, z: 5.5 };

/** A SimulatedPlayer accepts a rod use about every 11 ticks and drops the rest; a cast is judged by its evidence. */
const BIND_WAIT_TICKS = 14;
const CAST_TRIES = 8;

const log = (msg: string): void => console.warn(`[pear-gen] ${msg}`);
const short = (id: string | undefined): string => (id ?? "-").replace("minecraft:", "");
const v3 = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const below = (c: Vector3): Vector3 => ({ x: c.x, y: c.y - 1, z: c.z });

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

async function survivor(test: Test, at: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  return p;
}

function fill(test: Test, min: Vector3, max: Vector3, typeId: string): void {
  test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation(min), test.worldBlockLocation(max)), typeId);
}

function typeAt(test: Test, worldAt: Vector3): string {
  try {
    return test.getDimension().getBlock(worldAt)?.typeId ?? "unloaded";
  } catch {
    return "out-of-range";
  }
}

const rel = (test: Test, worldAt: Vector3): string => v3(test.relativeBlockLocation(worldAt));

function rodSlotOf(p: Player, rodId: string): number {
  const inv = inventoryOf(p);
  for (let slot = 0; slot < inv.size; slot++) if (inv.getItem(slot)?.getDynamicProperty(MARK_KEY) === rodId) return slot;
  return -1;
}

const rodOf = (p: Player, rodId: string): ItemStack | undefined => {
  const slot = rodSlotOf(p, rodId);
  return slot < 0 ? undefined : inventoryOf(p).getItem(slot);
};

const bindingText = (test: Test, b: Binding | undefined): string =>
  b === undefined ? "none" : `${short(b.type)}@rel${rel(test, b.pos)} gen=${b.gen}`;

/** What the teleport decides about this binding now: the verdict, and whether the trip would go. */
function trip(b: Binding): string {
  const v = plateCheck(b);
  return `${v} -> ${honours(v) ? "TRIP" : "NO TRIP"}`;
}

/** World dynamic properties of the generation store in this pack. */
const storeKeys = (): string[] => world.getDynamicPropertyIds().filter((k) => k.startsWith("andrew:pg"));

/**
 * Fills the field with `plateType`, casts a fresh (or the given) rod from `slot` until it binds, then clears every
 * other plate cell by setType — the bound plate itself is never touched.
 */
async function bindOnField(test: Test, p: SimulatedPlayer, plateType: string, slot = ROD_SLOT, rod: ItemStack = makePearlRod()): Promise<{ rodId: string; b: Binding }> {
  const rodId = String(rod.getDynamicProperty(MARK_KEY));
  fill(test, FIELD_MIN, FIELD_MAX, plateType);
  p.setItem(rod, slot, true);
  await test.idle(2);
  // The rod may still carry an earlier binding: only a bind counted after this cast is this cast's.
  const binds0 = bindStats.binds;
  const missed: string[] = [];
  let b: Binding | undefined;
  for (let tries = 0; tries < CAST_TRIES && b === undefined; tries++) {
    // A SimulatedPlayer's Instant look drifts level within ~28 ticks, and a use the binder makes of a rod still bound
    // is a trip that throws no hook: aim again before every use, and take back a hook that did not bind, so the next
    // use casts instead of reeling.
    p.lookAtLocation(AIM, LookDuration.Instant);
    await test.idle(2);
    p.useItemInSlot(slot);
    for (let t = 0; t < BIND_WAIT_TICKS && b === undefined; t++) {
      await test.idle(1);
      if (bindStats.binds > binds0) b = bindingOf(rodOf(p, rodId));
    }
    if (b !== undefined) break;
    const hooks = test.getDimension().getEntities({ type: HOOK_ID }).filter((h) => h.getComponent("minecraft:projectile")?.owner?.id === p.id);
    missed.push(hooks.length === 0 ? "no hook" : hooks.map((h) => `hook@rel${rel(test, h.location)}`).join("+"));
    for (const h of hooks) h.remove();
  }
  if (b === undefined) throw new Error(`${p.name}: no binding after ${CAST_TRIES} casts onto ${short(plateType)}: [${missed.join(", ")}]`);
  const dim = test.getDimension();
  for (let x = FIELD_MIN.x; x <= FIELD_MAX.x; x++) {
    for (let z = FIELD_MIN.z; z <= FIELD_MAX.z; z++) {
      const at = test.worldBlockLocation({ x, y: FIELD_MIN.y, z });
      if (at.x === b.pos.x && at.y === b.pos.y && at.z === b.pos.z) continue;
      dim.getBlock(at)?.setType("minecraft:air");
    }
  }
  await test.idle(1);
  return { rodId, b };
}

/** Counts of the observed events the scenario saw, by kind, for cells it cares about. */
class Witness {
  readonly lines: string[] = [];
  private readonly undo: Array<() => void> = [];

  constructor(test: Test) {
    const a = world.afterEvents;
    const note = (what: string, at: Vector3): void => {
      this.lines.push(`+${system.currentTick} ${what}@rel${rel(test, at)}`);
    };
    const br = a.playerBreakBlock.subscribe((e) => note(`break:${short(e.brokenBlockPermutation.type.id)}`, e.block.location));
    this.undo.push(() => a.playerBreakBlock.unsubscribe(br));
    const pl = a.playerPlaceBlock.subscribe((e) => note(`place:${short(e.block.typeId)}`, e.block.location));
    this.undo.push(() => a.playerPlaceBlock.unsubscribe(pl));
    const ex = a.blockExplode.subscribe((e) => note(`explode:${short(e.explodedBlockPermutation.type.id)}`, e.block.location));
    this.undo.push(() => a.blockExplode.unsubscribe(ex));
    const pi = a.pistonActivate.subscribe((e) => {
      let moved: string;
      try {
        moved = e.piston.getAttachedBlocksLocations().map((l) => rel(test, l)).join(" ");
      } catch (err) {
        moved = `threw:${err instanceof Error ? err.message : String(err)}`;
      }
      let state: string;
      try {
        state = `${e.piston.state}/moving=${e.piston.isMoving}`;
      } catch {
        state = "unreadable";
      }
      note(`piston:${e.isExpanding ? "out" : "in"}:${state}[${moved}]`, e.block.location);
    });
    this.undo.push(() => a.pistonActivate.unsubscribe(pi));
  }

  text(filter?: (line: string) => boolean): string {
    const lines = filter === undefined ? this.lines : this.lines.filter(filter);
    return lines.length > 40 ? `${lines.slice(0, 40).join(" ")} … (${lines.length})` : lines.join(" ");
  }

  close(): void {
    for (const u of this.undo) u();
  }
}

/** The player puts a plate from `slot` on top of `supportRel`, looking at it first; retried past the use cooldown. */
async function placePlate(test: Test, p: SimulatedPlayer, slot: number, supportRel: Vector3, cell: Vector3, typeId: string): Promise<{ tries: number; placedIn: number }> {
  p.selectedSlotIndex = slot;
  p.lookAtBlock(supportRel);
  await test.idle(2);
  for (let tries = 1; tries <= 5; tries++) {
    p.useItemInSlotOnBlock(slot, supportRel, Direction.Up);
    const placedIn = await waitFor(test, 12, () => typeAt(test, cell) === typeId);
    if (placedIn >= 0) return { tries, placedIn };
  }
  return { tries: 5, placedIn: -1 };
}

async function waitFor(test: Test, ticks: number, done: () => boolean): Promise<number> {
  for (let t = 0; t <= ticks; t++) {
    if (done()) return t;
    await test.idle(1);
  }
  return -1;
}

// ------------------------------------------------------------- AC1: a player breaks the plate and places the same type

registerAsync("andrew", "pear_gen_player_replace", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pg_replace");
  const w = new Witness(test);
  try {
    const { rodId, b } = await bindOnField(test, p, STONE_PLATE);
    const cellRel = test.relativeBlockLocation(b.pos);
    log(`replace bound RESULT ${bindingText(test, b)} world_gen=${plateGenerationNow(b.dim, b.pos)} trip=${trip(b)}`);
    test.assert(b.gen >= 1 && plateGenerationNow(b.dim, b.pos) === b.gen, `the binding did not claim a generation: ${bindingText(test, b)}`);
    test.assert(honours(plateCheck(b)), `an untouched plate already refuses: ${trip(b)}`);

    // 1. The player breaks the plate with a pickaxe, then places a stone plate from their hand on the same support.
    const bumps0 = genStats.bumps;
    p.setItem(new ItemStack("minecraft:diamond_pickaxe", 1), TOOL_SLOT, true);
    await test.idle(2);
    p.lookAtBlock(cellRel);
    p.breakBlock(cellRel);
    const brokeIn = await waitFor(test, 100, () => !isPlateType(typeAt(test, b.pos)));
    p.stopBreakingBlock();
    // The after-event lands after the tick the block turned to air.
    const bumpIn = await waitFor(test, 5, () => genStats.bumps > bumps0);
    const afterBreak = { type: typeAt(test, b.pos), gen: plateGenerationNow(b.dim, b.pos), bumps: genStats.bumps - bumps0 };
    p.setItem(new ItemStack(STONE_PLATE, 4), PLATE_SLOT, true);
    const { tries: placed, placedIn } = await placePlate(test, p, PLATE_SLOT, below(cellRel), b.pos, STONE_PLATE);
    const v1 = plateCheck(b);
    log(
      `replace break+place RESULT broke_in=${brokeIn} bump_in=${bumpIn} after_break=${short(afterBreak.type)} gen=${afterBreak.gen} bumps=${afterBreak.bumps} ` +
        `place_tries=${placed} placed_in=${placedIn} cell_now=${short(typeAt(test, b.pos))} world_gen=${plateGenerationNow(b.dim, b.pos)} ` +
        `rod_gen=${b.gen} trip=${trip(b)} events=[${w.text()}]`
    );
    test.assert(brokeIn >= 0, "the player never broke the plate");
    test.assert(afterBreak.bumps >= 1 && afterBreak.gen === 0, `the break did not end the generation (bumps ${afterBreak.bumps}, gen ${afterBreak.gen})`);
    test.assert(placedIn >= 0, `the player's plate never appeared (cell ${typeAt(test, b.pos)})`);
    test.assert(typeAt(test, b.pos) === b.type, "the plate put back is not the recorded type: this would prove nothing");
    test.assert(v1 === "replaced", `a broken and re-placed stone plate reads ${v1}`);

    // 2. The rod binds the new plate: a new generation, and the old record stays refused.
    const rod = rodOf(p, rodId);
    test.assert(rod !== undefined, "the rod left the inventory");
    if (rod === undefined) return;
    const second = await bindOnField(test, p, STONE_PLATE, ROD_SLOT, rod);
    const b2 = second.b;
    log(`replace rebind RESULT ${bindingText(test, b2)} same_cell=${v3(b2.pos) === v3(b.pos)} old=${trip(b)} new=${trip(b2)}`);
    test.assert(b2.gen > b.gen, `the new binding's generation ${b2.gen} is not later than ${b.gen}`);
    test.assert(!honours(plateCheck(b)) && honours(plateCheck(b2)), `old ${trip(b)}, new ${trip(b2)}`);

    // 3. The place path alone: the plate goes by a command (seen by nothing), then the player places the same type.
    const bumps1 = genStats.bumps;
    test.getDimension().runCommand(`setblock ${b2.pos.x} ${b2.pos.y} ${b2.pos.z} air`);
    await test.idle(2);
    const afterCommand = { verdict: plateCheck(b2), gen: plateGenerationNow(b2.dim, b2.pos), bumps: genStats.bumps - bumps1 };
    const { tries: placed2, placedIn: placed2In } = await placePlate(test, p, PLATE_SLOT, below(test.relativeBlockLocation(b2.pos)), b2.pos, STONE_PLATE);
    const placeBumpIn = await waitFor(test, 5, () => genStats.bumps > bumps1);
    const v3b = plateCheck(b2);
    log(
      `replace place-only RESULT after_setblock_air verdict=${afterCommand.verdict} gen=${afterCommand.gen} bumps=${afterCommand.bumps} ` +
        `place_tries=${placed2} placed_in=${placed2In} bump_in=${placeBumpIn} world_gen=${plateGenerationNow(b2.dim, b2.pos)} trip=${trip(b2)} events=[${w.text((l) => l.includes("place"))}]`
    );
    test.assert(afterCommand.bumps === 0 && afterCommand.gen === b2.gen, "a command removal moved the generation: nothing should observe it");
    test.assert(afterCommand.verdict === "missing", `no plate reads ${afterCommand.verdict}`);
    test.assert(placed2In >= 0, `the player's plate never appeared after ${placed2} tries`);
    test.assert(v3b === "replaced", `a plate placed by the player into a watched cell reads ${v3b}`);
  } finally {
    w.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------------------- AC2: /setblock to another type; the recorded limitation

registerAsync("andrew", "pear_gen_setblock_other_type", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pg_setblock");
  const dim = test.getDimension();
  try {
    const { b } = await bindOnField(test, p, STONE_PLATE);
    const at = `${b.pos.x} ${b.pos.y} ${b.pos.z}`;
    const bumps0 = genStats.bumps;
    const steps: Array<[string, string, string]> = [
      ["oak plate", `setblock ${at} ${OAK_PLATE}`, "other-type"],
      ["stone block", `setblock ${at} minecraft:stone`, "missing"],
      ["air", `setblock ${at} air`, "missing"],
      ["heavy weighted plate", `setblock ${at} minecraft:heavy_weighted_pressure_plate`, "other-type"],
    ];
    log(`setblock bound RESULT ${bindingText(test, b)} trip=${trip(b)}`);
    test.assert(honours(plateCheck(b)), "the untouched plate refuses before any command");
    for (const [label, cmd, want] of steps) {
      const ok = dim.runCommand(cmd).successCount;
      await test.idle(2);
      const v = plateCheck(b);
      log(`setblock ${label} RESULT success=${ok} cell=${short(typeAt(test, b.pos))} world_gen=${plateGenerationNow(b.dim, b.pos)} rod_gen=${b.gen} trip=${trip(b)}`);
      test.assert(ok === 1, `${cmd} did not run`);
      test.assert(v === want, `${label}: ${v}, want ${want}`);
    }
    test.assert(genStats.bumps === bumps0 && plateGenerationNow(b.dim, b.pos) === b.gen, "a command moved the generation: the type check alone must have caught these");

    // The limitation (L0-xcx34): a stone plate put back by command is indistinguishable from the one bound.
    dim.runCommand(`setblock ${at} air`);
    dim.runCommand(`setblock ${at} ${STONE_PLATE}`);
    await test.idle(2);
    const v = plateCheck(b);
    log(`setblock LIMITATION RESULT same type put back by command: cell=${short(typeAt(test, b.pos))} world_gen=${plateGenerationNow(b.dim, b.pos)} rod_gen=${b.gen} trip=${trip(b)}`);
    test.assert(v === "same", `the documented limitation no longer holds (${v}): update src/pearl/README.md`);
  } finally {
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------------------- AC3: explosion, broken support, piston

/** Puts the floor and the bound plate back by setType: nothing that a script sees as a replacement. */
function restore(test: Test, b: Binding): void {
  fill(test, FLOOR_MIN, FLOOR_MAX, "minecraft:stone");
  fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  test.getDimension().getBlock(b.pos)?.setType(b.type);
}

registerAsync("andrew", "pear_gen_explosion_support_piston", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pg_blast");
  const dim = test.getDimension();
  const w = new Witness(test);
  const results: string[] = [];
  try {
    // 1. TNT two cells from the plate.
    const one = await bindOnField(test, p, STONE_PLATE);
    const b = one.b;
    const bumps0 = genStats.bumps;
    const tntAt = test.worldLocation({ x: test.relativeBlockLocation(b.pos).x + 0.5, y: 2, z: test.relativeBlockLocation(b.pos).z + 2.5 });
    const tnt = dim.spawnEntity("minecraft:tnt", tntAt);
    tnt.clearVelocity();
    const blewIn = await waitFor(test, 120, () => !tnt.isValid);
    await test.idle(2);
    const blast = { cell: typeAt(test, b.pos), support: typeAt(test, below(b.pos)), gen: plateGenerationNow(b.dim, b.pos), bumps: genStats.bumps - bumps0 };
    restore(test, b);
    p.teleport(test.worldLocation({ x: CAST_FROM.x + 0.5, y: CAST_FROM.y, z: CAST_FROM.z + 0.5 }));
    await test.idle(2);
    const vBlast = plateCheck(b);
    const blastLine =
      `explosion RESULT blew_in=${blewIn} after: cell=${short(blast.cell)} support=${short(blast.support)} gen=${blast.gen} bumps=${blast.bumps}; ` +
      `put back: cell=${short(typeAt(test, b.pos))} world_gen=${plateGenerationNow(b.dim, b.pos)} rod_gen=${b.gen} trip=${trip(b)} ` +
      `events_at_cell=[${w.text((l) => l.includes(`@rel${rel(test, b.pos)}`) || l.includes(`@rel${rel(test, below(b.pos))}`))}]`;
    log(blastLine);
    results.push(blastLine);
    test.assert(blewIn >= 0, "the TNT never went off");
    test.assert(!isPlateType(blast.cell), `the plate survived the blast (${blast.cell}): nothing was replaced`);
    test.assert(blast.bumps >= 1 && blast.gen === 0, `the explosion did not end the generation (bumps ${blast.bumps}, gen ${blast.gen})`);
    test.assert(typeAt(test, b.pos) === b.type && vBlast === "replaced", `blown up and put back: ${vBlast}`);

    // 2. The player breaks the support block under the plate; the plate pops off.
    const two = await bindOnField(test, p, OAK_PLATE, ROD_SLOT, rodOf(p, one.rodId));
    const b2 = two.b;
    const bumps1 = genStats.bumps;
    p.setItem(new ItemStack("minecraft:diamond_pickaxe", 1), TOOL_SLOT, true);
    await test.idle(2);
    const supportRel = below(test.relativeBlockLocation(b2.pos));
    p.lookAtBlock(supportRel);
    p.breakBlock(supportRel);
    const supportIn = await waitFor(test, 100, () => typeAt(test, below(b2.pos)) === "minecraft:air");
    p.stopBreakingBlock();
    await waitFor(test, 5, () => genStats.bumps > bumps1);
    const popped = { cell: typeAt(test, b2.pos), gen: plateGenerationNow(b2.dim, b2.pos), bumps: genStats.bumps - bumps1 };
    restore(test, b2);
    await test.idle(2);
    const vSupport = plateCheck(b2);
    const supportLine =
      `support RESULT broke_in=${supportIn} after: cell=${short(popped.cell)} gen=${popped.gen} bumps=${popped.bumps}; put back: cell=${short(typeAt(test, b2.pos))} ` +
      `support=${short(typeAt(test, below(b2.pos)))} world_gen=${plateGenerationNow(b2.dim, b2.pos)} rod_gen=${b2.gen} trip=${trip(b2)} events=[${w.text((l) => l.includes("break"))}]`;
    log(supportLine);
    results.push(supportLine);
    test.assert(supportIn >= 0, "the player never broke the support");
    test.assert(!isPlateType(popped.cell), `the plate stayed on a broken support (${popped.cell})`);
    test.assert(popped.bumps >= 1 && popped.gen === 0, `the broken support did not end the generation (bumps ${popped.bumps}, gen ${popped.gen})`);
    test.assert(typeAt(test, b2.pos) === b2.type && vSupport === "replaced", `support broken and put back: ${vSupport}`);

    // 3. A piston under the support, facing up, pushes the support into the plate's cell.
    p.selectedSlotIndex = ROD_SLOT;
    const three = await bindOnField(test, p, STONE_PLATE, ROD_SLOT, rodOf(p, one.rodId));
    const b3 = three.b;
    const bumps2 = genStats.bumps;
    const checks0 = genStats.pistonChecks;
    const pistonAt = { x: b3.pos.x, y: b3.pos.y - 2, z: b3.pos.z };
    const powerAt = { x: pistonAt.x + 1, y: pistonAt.y, z: pistonAt.z };
    dim.getBlock(pistonAt)?.setPermutation(BlockPermutation.resolve("minecraft:piston", { facing_direction: 1 }));
    await test.idle(2);
    dim.getBlock(powerAt)?.setType("minecraft:redstone_block");
    const samples: string[] = [];
    for (let t = 1; t <= 8 + PISTON_SETTLE_TICKS; t++) {
      await test.idle(1);
      samples.push(`+${t}:${short(typeAt(test, b3.pos))}/${short(typeAt(test, below(b3.pos)))}/gen${plateGenerationNow(b3.dim, b3.pos)}`);
      if (t >= 8 && genStats.bumps > bumps2) break;
    }
    const crushed = { cell: typeAt(test, b3.pos), gen: plateGenerationNow(b3.dim, b3.pos), bumps: genStats.bumps - bumps2, checks: genStats.pistonChecks - checks0 };
    dim.getBlock(powerAt)?.setType("minecraft:air");
    await test.idle(4 + PISTON_SETTLE_TICKS);
    dim.getBlock(pistonAt)?.setType("minecraft:air");
    restore(test, b3);
    await test.idle(2);
    const vPiston = plateCheck(b3);
    const pistonLine =
      `piston RESULT samples(cell/support/gen)=[${samples.join(" ")}] after: cell=${short(crushed.cell)} gen=${crushed.gen} bumps=${crushed.bumps} ` +
      `checks=${crushed.checks}; put back: cell=${short(typeAt(test, b3.pos))} world_gen=${plateGenerationNow(b3.dim, b3.pos)} rod_gen=${b3.gen} trip=${trip(b3)} ` +
      `events=[${w.text((l) => l.includes("piston"))}]`;
    log(pistonLine);
    results.push(pistonLine);
    test.assert(!isPlateType(crushed.cell), `the piston did not take the plate (${crushed.cell})`);
    test.assert(crushed.bumps >= 1 && crushed.gen === 0, `the piston did not end the generation (bumps ${crushed.bumps}, gen ${crushed.gen})`);
    test.assert(typeAt(test, b3.pos) === b3.type && vPiston === "replaced", `crushed by a piston and put back: ${vPiston}`);
  } finally {
    w.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    fill(test, FLOOR_MIN, FLOOR_MAX, "minecraft:stone");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

// ------------------------------------------------------------- AC4: a hundred presses are not a replacement

const PRESSES = 100;
const PRESSER_OFF: Vector3 = { x: 0.5, y: 2, z: 0.5 };

const signalOf = (test: Test, at: Vector3): number => {
  const s = test.getDimension().getBlock(at)?.permutation.getState("redstone_signal");
  return typeof s === "number" ? s : -1;
};

registerAsync("andrew", "pear_gen_hundred_presses", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pg_press_owner");
  const presser = await survivor(test, PRESSER_OFF, "pg_presser");
  const w = new Witness(test);
  try {
    const { rodId, b } = await bindOnField(test, p, STONE_PLATE);
    const bumps0 = genStats.bumps;
    const on = test.worldLocation({ x: test.relativeBlockLocation(b.pos).x + 0.5, y: 2, z: test.relativeBlockLocation(b.pos).z + 0.5 });
    const off = test.worldLocation(PRESSER_OFF);
    let presses = 0;
    let downTicks = 0;
    let upTicks = 0;
    const signals = new Set<number>();
    for (let i = 0; i < PRESSES; i++) {
      presser.teleport(on);
      const down = await waitFor(test, 10, () => signalOf(test, b.pos) > 0);
      signals.add(signalOf(test, b.pos));
      presser.teleport(off);
      const up = await waitFor(test, 40, () => signalOf(test, b.pos) === 0);
      if (down < 0 || up < 0) {
        log(`presses press ${i + 1}: down=${down} up=${up} signal=${signalOf(test, b.pos)}`);
        break;
      }
      presses++;
      downTicks += down;
      upTicks += up;
    }
    const v = plateCheck(b);
    const rodNow = bindingOf(rodOf(p, rodId));
    log(
      `presses RESULT ${presses} presses of ${short(b.type)}@rel${rel(test, b.pos)} signals=[${[...signals].join(",")}] mean_down=${(downTicks / Math.max(1, presses)).toFixed(1)} ` +
        `mean_release=${(upTicks / Math.max(1, presses)).toFixed(1)} bumps=${genStats.bumps - bumps0} world_gen=${plateGenerationNow(b.dim, b.pos)} rod_gen=${rodNow?.gen} ` +
        `cell=${short(typeAt(test, b.pos))} trip=${trip(b)} events=[${w.text()}]`
    );
    test.assert(presses === PRESSES, `only ${presses} presses registered on the plate`);
    test.assert(genStats.bumps === bumps0, "a press moved the generation");
    test.assert(rodNow !== undefined && rodNow.gen === b.gen, "the rod's binding changed");
    test.assert(v === "same", `an untouched plate pressed ${presses} times reads ${v}`);
  } finally {
    w.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(5000)
  .tag("andrew");

// ------------------------------------------------------------- AC6: the store empties as bindings end

/** Clears the binding the way the teleport does: the six properties gone, the lore reset, the stack put back. */
function clearBinding(p: Player, rodId: string): boolean {
  const slot = rodSlotOf(p, rodId);
  if (slot < 0) return false;
  const inv = inventoryOf(p);
  const stack = inv.getItem(slot);
  if (stack === undefined) return false;
  for (const key of BINDING_KEYS) stack.setDynamicProperty(key, undefined);
  stack.setLore([LORE_TITLE, LORE_UNBOUND]);
  inv.setItem(slot, stack);
  return true;
}

const watchedText = (test: Test): string =>
  watchedNow()
    .map((c) => `rel${rel(test, c.pos)} gen=${c.gen} rods=${Object.keys(c.record.rods).length}${c.record.pinned ? " pinned" : ""}`)
    .join("; ") || "empty";

registerAsync("andrew", "pear_gen_store_pruned", async (test: Test): Promise<void> => {
  const a = await survivor(test, CAST_FROM, "pg_store_a");
  const lines: string[] = [];
  const say = (line: string): void => {
    lines.push(line);
    log(`store ${line}`);
  };
  try {
    for (const k of storeKeys()) if (k !== "andrew:pg_seq") world.setDynamicProperty(k, undefined);
    // Two rods of one player on one plate.
    const r1 = await bindOnField(test, a, STONE_PLATE, 0);
    const r2 = await bindOnField(test, a, STONE_PLATE, 1);
    say(`two rods RESULT rod1=${bindingText(test, r1.b)} rod2=${bindingText(test, r2.b)} watched=[${watchedText(test)}]`);
    test.assert(r1.b.gen === r2.b.gen && v3(r1.b.pos) === v3(r2.b.pos), "the second rod did not share the plate's generation");
    test.assert(watchedNow().length === 1 && Object.keys(watchedNow()[0].record.rods).length === 2, `watched: ${watchedText(test)}`);

    // The teleport clears rod 1 in its slot: the plate is still held by rod 2.
    const rel0 = genStats.releases;
    test.assert(clearBinding(a, r1.rodId), "rod 1 not found to clear");
    await test.idle(2);
    say(`clear rod1 RESULT rod1=${bindingText(test, bindingOf(rodOf(a, r1.rodId)))} releases=${genStats.releases - rel0} watched=[${watchedText(test)}]`);
    test.assert(genStats.releases - rel0 === 1 && watchedNow().length === 1, `after clearing rod 1: ${watchedText(test)}`);

    // Rod 2 cleared too: nobody is bound to the plate, and its entry is gone.
    const pruned0 = genStats.pruned;
    test.assert(clearBinding(a, r2.rodId), "rod 2 not found to clear");
    await test.idle(2);
    say(`clear rod2 RESULT pruned=${genStats.pruned - pruned0} world_gen=${plateGenerationNow(r2.b.dim, r2.b.pos)} watched=[${watchedText(test)}] keys=[${storeKeys().join(",")}]`);
    test.assert(watchedNow().length === 0 && plateGenerationNow(r2.b.dim, r2.b.pos) === 0, `the plate nobody is bound to is still watched: ${watchedText(test)}`);
    test.assert(storeKeys().every((k) => k === "andrew:pg_seq"), `left over: ${storeKeys().join(",")}`);

    // An overwrite: rod 1 on a plate, then on an oak plate elsewhere; the first plate goes.
    const r3 = await bindOnField(test, a, STONE_PLATE, 0, rodOf(a, r1.rodId));
    a.lookAtLocation({ x: 3.5, y: 2, z: 3.2 }, LookDuration.Instant);
    fill(test, FIELD_MIN, FIELD_MAX, OAK_PLATE);
    test.getDimension().getBlock(r3.b.pos)?.setType(STONE_PLATE);
    let r4: Binding | undefined;
    for (let tries = 0; tries < CAST_TRIES && (r4 === undefined || v3(r4.pos) === v3(r3.b.pos)); tries++) {
      a.useItemInSlot(0);
      for (let t = 0; t < BIND_WAIT_TICKS; t++) {
        await test.idle(1);
        const now = bindingOf(rodOf(a, r1.rodId));
        if (now !== undefined && now.gen !== r3.b.gen) {
          r4 = now;
          break;
        }
      }
    }
    await test.idle(2);
    say(`overwrite RESULT from ${bindingText(test, r3.b)} to ${bindingText(test, r4)} old_world_gen=${plateGenerationNow(r3.b.dim, r3.b.pos)} watched=[${watchedText(test)}]`);
    test.assert(r4 !== undefined && v3(r4.pos) !== v3(r3.b.pos), `the overwrite did not land on another plate: ${bindingText(test, r4)}`);
    test.assert(plateGenerationNow(r3.b.dim, r3.b.pos) === 0 && watchedNow().length === 1, `after the overwrite: ${watchedText(test)}`);

    // The binder dies: every cell only they were bound to goes.
    const owner0 = genStats.ownerPrunes;
    a.kill();
    const goneIn = await waitFor(test, 20, () => watchedNow().length === 0);
    say(`death RESULT gone_in=${goneIn} owner_prunes=${genStats.ownerPrunes - owner0} watched=[${watchedText(test)}] keys=[${storeKeys().join(",")}]`);
    test.assert(goneIn >= 0, `the dead binder's plate is still watched: ${watchedText(test)}`);
  } finally {
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  log(`store RESULT ${lines.length} steps`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");
