// PEAR-ITEM-01 on BDS 1.26.51.1 (spec v3 §6, §8 bullets 1 and 6; L0-pear-ac01): the shipped recipe yields a marked
// vanilla rod with no limit, shifted layouts craft nothing, a hundred casts leave the durability full, and an unbound
// Pearl Rod catches fish like a plain rod. The "[pear-item] … RESULT" lines are quoted in src/pearl/README.md.

import {
  BlockPermutation,
  type Container,
  type Entity,
  type EntitySpawnAfterEvent,
  EnchantmentType,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { isPearlRodStack, itemStats, registerPearlItem } from "../pearl/item";
import { HAND_CHECK_TICKS, LORE_TITLE, LORE_UNBOUND, MARK_KEY, ROD_ID, ROD_NAME, TOKEN_ID } from "../pearl/item-rules";

// The release pack arms the same module and cannot read a SimulatedPlayer (C-2); this copy is the one the scenarios
// drive, through the same subscriptions a human's craft and casts go through.
registerPearlItem();

const STRUCTURE = "andrew:platform";
const HOOK = "minecraft:fishing_hook";
const PEARL = "minecraft:ender_pearl";
const ROD_SLOT = 0;

const log = (msg: string): void => console.warn(`[pear-item] ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const f2 = (n: number): string => n.toFixed(2);

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

function damageOf(stack: ItemStack | undefined): number | undefined {
  return stack?.getComponent("minecraft:durability")?.damage;
}

function rodText(s: ItemStack | undefined): string {
  if (s === undefined) return "empty";
  const d = s.getComponent("minecraft:durability");
  const enchants = s.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  const mark = s.maxAmount === 1 ? s.getDynamicProperty(MARK_KEY) : undefined;
  return (
    `${short(s.typeId)} mark=${String(mark)} name=${s.nameTag ?? "none"} lore=[${s.getLore().join("|")}] ` +
    `damage=${d?.damage ?? "-"}/${d?.maxDurability ?? "-"} enchants=[${enchants.map((e) => `${e.type.id}${e.level}`).join(",")}]`
  );
}

/** Hands `p` a craft token in ROD_SLOT, selected, and waits for the swap to put a Pearl Rod there. */
async function pearlRodFromToken(test: Test, p: SimulatedPlayer): Promise<void> {
  p.setItem(new ItemStack(TOKEN_ID, 1), ROD_SLOT, true);
  for (let t = 0; t < 10 && !isPearlRodStack(inventoryOf(p).getItem(ROD_SLOT)); t++) await test.idle(1);
  test.assert(isPearlRodStack(inventoryOf(p).getItem(ROD_SLOT)), `${p.name}: the token in slot ${ROD_SLOT} was not swapped for a Pearl Rod`);
}

/** Hooks by caster name, from `entitySpawn` (the owner is readable at +0, probe Q3). */
class HookLog {
  readonly byOwner = new Map<string, Entity[]>();
  private readonly sub: (ev: EntitySpawnAfterEvent) => void;

  constructor() {
    this.sub = world.afterEvents.entitySpawn.subscribe((ev) => {
      if (ev.entity.typeId !== HOOK) return;
      const owner = ev.entity.getComponent("minecraft:projectile")?.owner;
      const name = owner?.isValid === true && owner.typeId === "minecraft:player" ? (owner as Player).name : "?";
      const list = this.byOwner.get(name) ?? [];
      list.push(ev.entity);
      this.byOwner.set(name, list);
    });
  }

  count(p: Player): number {
    return this.byOwner.get(p.name)?.length ?? 0;
  }

  last(p: Player): Entity | undefined {
    const list = this.byOwner.get(p.name);
    return list?.[list.length - 1];
  }

  close(): void {
    world.afterEvents.entitySpawn.unsubscribe(this.sub);
  }
}

// ------------------------------------------------------------- the recipe, on a Crafter

// The crafter's front faces south (+z), straight at the player one block away; the pulse comes from its west side.
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };
const SETTLE_TICKS = 20;

type Grid = ReadonlyArray<readonly [number, string]>;
/** The shipped pattern [" P ", " R ", "   "]: pearl in slot 1, rod in slot 4 (slots row by row, 0–8). */
const DECLARED: Grid = [
  [1, PEARL],
  [4, ROD_ID],
];

function placeCrafter(test: Test): void {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
}

function loadGrid(test: Test, grid: Grid): void {
  const at = test.worldBlockLocation(CRAFTER);
  for (let slot = 0; slot < 9; slot++) {
    const item = grid.find(([s]) => s === slot)?.[1] ?? "minecraft:air";
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${item} 1`;
    test.assert(test.getDimension().runCommand(cmd).successCount > 0, `${cmd} failed`);
  }
}

/** Item entities the crafter ejects, by tick. */
class Ejections {
  readonly items: Array<{ tick: number; typeId: string; e: Entity }> = [];
  private readonly sub: (ev: EntitySpawnAfterEvent) => void;

  constructor() {
    this.sub = world.afterEvents.entitySpawn.subscribe((ev) => {
      if (ev.entity.typeId !== "minecraft:item" || !ev.entity.isValid) return;
      const s = ev.entity.getComponent("minecraft:item")?.itemStack;
      this.items.push({ tick: system.currentTick, typeId: s?.typeId ?? "?", e: ev.entity });
    });
  }

  since(tick: number): string[] {
    return this.items.filter((i) => i.tick >= tick).map((i) => short(i.typeId));
  }

  close(): void {
    world.afterEvents.entitySpawn.unsubscribe(this.sub);
  }
}

registerAsync("andrew", "pear_item_craft_unlimited", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const p = await survivor(test, STAND, "pi_crafter");
  // The crafter's token is picked up in the tick it is ejected, so its item entity is already gone in entitySpawn:
  // a craft is counted where the token arrives, in the inventory.
  let arrivals = 0;
  const sub = world.afterEvents.playerInventoryItemChange.subscribe((ev) => {
    if (ev.player?.name === p.name && ev.itemStack?.typeId === TOKEN_ID) arrivals++;
  });
  const swaps0 = itemStats.swaps;
  try {
    for (const label of ["first", "second", "third"]) {
      const before = arrivals;
      loadGrid(test, DECLARED);
      test.pulseRedstone(POWER, 2);
      await test.idle(SETTLE_TICKS);
      log(`craft ${label} RESULT tokens arrived=${arrivals - before}`);
    }
  } finally {
    world.afterEvents.playerInventoryItemChange.unsubscribe(sub);
  }

  const inv = inventoryOf(p);
  const rods: ItemStack[] = [];
  let tokens = 0;
  let plain = 0;
  for (let slot = 0; slot < inv.size; slot++) {
    const s = inv.getItem(slot);
    if (s === undefined) continue;
    if (s.typeId === TOKEN_ID) tokens += s.amount;
    else if (isPearlRodStack(s)) rods.push(s);
    else if (s.typeId === ROD_ID) plain++;
  }
  for (const [i, s] of rods.entries()) log(`craft rod ${i + 1} RESULT ${rodText(s)}`);
  const marks = new Set(rods.map((s) => String(s.getDynamicProperty(MARK_KEY))));
  log(
    `craft RESULT tokens arrived=${arrivals} swaps=${itemStats.swaps - swaps0} pearl_rods=${rods.length} distinct_marks=${marks.size} ` +
      `tokens_left=${tokens} plain_rods=${plain}`
  );

  test.assert(arrivals === 3, `the shipped recipe crafted ${arrivals} time(s) out of three`);
  test.assert(tokens === 0, `${tokens} token(s) left in the inventory, not swapped`);
  test.assert(plain === 0, `${plain} plain rod(s) in the inventory: a token became an unmarked rod`);
  test.assert(rods.length === 3, `3 crafts but ${rods.length} Pearl Rod(s)`);
  test.assert(marks.size === rods.length, `${rods.length} rods share ${marks.size} mark(s)`);
  for (const s of rods) {
    test.assert(s.nameTag === ROD_NAME, `name ${String(s.nameTag)}, expected ${ROD_NAME}`);
    test.assert(s.getLore().join("|") === `${LORE_TITLE}|${LORE_UNBOUND}`, `lore [${s.getLore().join("|")}]`);
    test.assert(damageOf(s) === 0, `a fresh Pearl Rod has damage ${String(damageOf(s))}`);
    const enchants = s.getComponent("minecraft:enchantable")?.getEnchantments().length ?? 0;
    test.assert(enchants === 0, `a fresh Pearl Rod carries ${enchants} enchantment(s)`);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

/** Layouts that must not craft. Each is the same two items, moved off the declared cells. */
const SHIFTED: ReadonlyArray<{ label: string; grid: Grid }> = [
  { label: "left(0,3)", grid: [[0, PEARL], [3, ROD_ID]] },
  { label: "right(2,5)", grid: [[2, PEARL], [5, ROD_ID]] },
  { label: "down(4,7)", grid: [[4, PEARL], [7, ROD_ID]] },
  { label: "down_left(3,6)", grid: [[3, PEARL], [6, ROD_ID]] },
  { label: "down_right(5,8)", grid: [[5, PEARL], [8, ROD_ID]] },
  { label: "pearl_below_rod(1=rod,4=pearl)", grid: [[1, ROD_ID], [4, PEARL]] },
  { label: "diagonal(0=pearl,4=rod)", grid: [[0, PEARL], [4, ROD_ID]] },
  { label: "side_by_side(3=pearl,4=rod)", grid: [[3, PEARL], [4, ROD_ID]] },
];

registerAsync("andrew", "pear_item_grid_shifted", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const ejections = new Ejections();
  const results = new Map<string, string[]>();
  try {
    await test.idle(2);
    const layouts = [{ label: "declared(1,4)", grid: DECLARED }, ...SHIFTED, { label: "declared_again(1,4)", grid: DECLARED }];
    for (const { label, grid } of layouts) {
      const from = system.currentTick;
      loadGrid(test, grid);
      test.pulseRedstone(POWER, 2);
      await test.idle(12);
      const got = ejections.since(from);
      results.set(label, got);
      log(`grid ${label} RESULT crafter ejected=[${got.join(",") || "nothing"}]`);
      for (const i of ejections.items) if (i.tick >= from && i.e.isValid) i.e.remove();
      await test.idle(4);
    }
  } finally {
    ejections.close();
  }
  const crafted = (label: string): boolean => (results.get(label) ?? []).includes(short(TOKEN_ID));
  test.assert(crafted("declared(1,4)"), "control: the declared layout crafted no token — the recipe did not load");
  test.assert(crafted("declared_again(1,4)"), "control: the declared layout stopped crafting after the shifted ones");
  const leaked = SHIFTED.filter((l) => (results.get(l.label) ?? []).length > 0).map((l) => `${l.label}=[${results.get(l.label)?.join(",")}]`);
  log(`grid RESULT shifted layouts that crafted: ${leaked.length === 0 ? `none of ${SHIFTED.length}` : leaked.join(" ")}`);
  log(
    "grid RESULT the inventory 2x2 grid is not reachable by script (no SimulatedPlayer crafting UI); measured instead: " +
      "Bedrock keeps the blank third row and column of the 3x3 pattern, which needs three rows, so the 2x2 grid cannot hold it — " +
      "the 2x2 check stays an iPad item"
  );
  test.assert(leaked.length === 0, `shifted layouts crafted: ${leaked.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------------------- durability: a hundred casts

const CASTS = 100;
/** Two lanes on the platform floor, cast from its near edge; aims are relative (SimulatedPlayer.lookAtLocation). */
const LANE_A: Vector3 = { x: 1, y: 2, z: 0 };
const LANE_B: Vector3 = { x: 5, y: 2, z: 0 };
const AIM_A: Vector3 = { x: 1.5, y: 2, z: 5.5 };
const AIM_B: Vector3 = { x: 5.5, y: 2, z: 5.5 };
/** A use a SimulatedPlayer drops shows as no new hook, or a hook still out, this many ticks later. */
const USE_EVIDENCE_TICKS = 6;
const USE_TRIES = 10;

interface Lane {
  p: SimulatedPlayer;
  casts: number;
  reels: number;
  calls: number;
  dropped: number;
}

/** One cast and one reel, each retried until the hook shows it happened. */
async function castAndReel(test: Test, lane: Lane, hooks: HookLog): Promise<void> {
  for (let tries = 0; ; tries++) {
    const before = hooks.count(lane.p);
    lane.calls++;
    lane.p.useItemInSlot(ROD_SLOT);
    for (let t = 0; t < USE_EVIDENCE_TICKS && hooks.count(lane.p) === before; t++) await test.idle(1);
    if (hooks.count(lane.p) > before) break;
    lane.dropped++;
    if (tries >= USE_TRIES) throw new Error(`${lane.p.name}: no hook after ${USE_TRIES} uses`);
  }
  lane.casts++;
  const hook = hooks.last(lane.p);
  await test.idle(4);
  for (let tries = 0; hook?.isValid === true; tries++) {
    lane.calls++;
    lane.p.useItemInSlot(ROD_SLOT);
    for (let t = 0; t < USE_EVIDENCE_TICKS && hook.isValid; t++) await test.idle(1);
    if (!hook.isValid) break;
    lane.dropped++;
    if (tries >= USE_TRIES) throw new Error(`${lane.p.name}: the hook is still out after ${USE_TRIES} uses`);
  }
  lane.reels++;
}

registerAsync("andrew", "pear_item_hundred_casts", async (test: Test): Promise<void> => {
  const a = await survivor(test, LANE_A, "pi_pearl");
  const b = await survivor(test, LANE_B, "pi_plain");
  await pearlRodFromToken(test, a);
  b.setItem(new ItemStack(ROD_ID, 1), ROD_SLOT, true);
  await test.idle(2);
  a.lookAtLocation(AIM_A, LookDuration.Instant);
  b.lookAtLocation(AIM_B, LookDuration.Instant);
  await test.idle(2);
  const markA = String(inventoryOf(a).getItem(ROD_SLOT)?.getDynamicProperty(MARK_KEY));

  const hooks = new HookLog();
  // The plain rod's first cycles, event by event: when the reel's damage lands against its use and its hook.
  const t0 = system.currentTick;
  const trace: string[] = [];
  const note = (what: string): void => {
    if (trace.length < 40) trace.push(`+${system.currentTick - t0}:${what}`);
  };
  const useSub = world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.source?.name === b.name) note(`use(d=${String(damageOf(inventoryOf(b).getItem(ROD_SLOT)))})`);
  });
  const hookIdsB = new Set<string>();
  const spawnSub = world.afterEvents.entitySpawn.subscribe((ev) => {
    if (ev.entity.typeId === HOOK && hooks.last(b)?.id === ev.entity.id) {
      hookIdsB.add(ev.entity.id);
      note("hook");
    }
  });
  const removeSub = world.afterEvents.entityRemove.subscribe((ev) => {
    if (hookIdsB.has(ev.removedEntityId)) note("hook_removed");
  });
  let prevB = 0;
  let worstA = 0;
  let wornTicksA = 0;
  const sampler = system.runInterval(() => {
    const dA = damageOf(inventoryOf(a).getItem(ROD_SLOT)) ?? -1;
    if (dA > 0) wornTicksA++;
    worstA = Math.max(worstA, dA);
    const dB = damageOf(inventoryOf(b).getItem(ROD_SLOT)) ?? 0;
    if (dB !== prevB) note(`damage ${prevB}->${dB}`);
    prevB = dB;
  }, 1);
  const repairs0 = itemStats.repairsAfterUse;
  const inEvent0 = itemStats.repairsInEvent;
  const hand0 = itemStats.repairsOnHandCheck;
  const laneA: Lane = { p: a, casts: 0, reels: 0, calls: 0, dropped: 0 };
  const laneB: Lane = { p: b, casts: 0, reels: 0, calls: 0, dropped: 0 };
  const endOfCycleA: number[] = [];
  try {
    await Promise.all([
      (async () => {
        for (let i = 0; i < CASTS; i++) {
          await castAndReel(test, laneA, hooks);
          await test.idle(2);
          endOfCycleA.push(damageOf(inventoryOf(a).getItem(ROD_SLOT)) ?? -1);
        }
      })(),
      (async () => {
        for (let i = 0; i < CASTS; i++) await castAndReel(test, laneB, hooks);
      })(),
    ]);
    await test.idle(4);
  } finally {
    system.clearRun(sampler);
    world.afterEvents.itemUse.unsubscribe(useSub);
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    world.afterEvents.entityRemove.unsubscribe(removeSub);
    hooks.close();
  }
  const rodA = inventoryOf(a).getItem(ROD_SLOT);
  const rodB = inventoryOf(b).getItem(ROD_SLOT);
  const nonZero = endOfCycleA.filter((d) => d !== 0).length;
  log(`casts RESULT plain first cycles: ${trace.join(" ")}`);
  log(
    `casts RESULT pearl: casts=${laneA.casts} reels=${laneA.reels} hooks=${hooks.count(a)} uses=${laneA.calls} dropped=${laneA.dropped} ` +
      `end_of_cycle_nonzero=${nonZero}/${endOfCycleA.length} worn_ticks=${wornTicksA} worst=${worstA} ` +
      `repairs_in_event=${itemStats.repairsInEvent - inEvent0} repairs_after_use=${itemStats.repairsAfterUse - repairs0} ` +
      `repairs_on_hand_check=${itemStats.repairsOnHandCheck - hand0} rod: ${rodText(rodA)}`
  );
  log(
    `casts RESULT plain (control): casts=${laneB.casts} reels=${laneB.reels} hooks=${hooks.count(b)} uses=${laneB.calls} dropped=${laneB.dropped} ` +
      `rod: ${rodText(rodB)}`
  );
  test.assert(laneA.casts === CASTS && hooks.count(a) === CASTS, `the Pearl Rod cast ${hooks.count(a)} hook(s), not ${CASTS}`);
  test.assert(laneB.casts === CASTS && hooks.count(b) === CASTS, `the plain rod cast ${hooks.count(b)} hook(s), not ${CASTS}`);
  test.assert(rodA !== undefined && isPearlRodStack(rodA), `the Pearl Rod is gone or unmarked after ${CASTS} casts: ${rodText(rodA)}`);
  test.assert(String(rodA?.getDynamicProperty(MARK_KEY)) === markA, "the Pearl Rod's mark changed over the casts");
  test.assert(damageOf(rodA) === 0, `the Pearl Rod's damage is ${String(damageOf(rodA))} after ${CASTS} casts`);
  test.assert(nonZero === 0, `the Pearl Rod read worn at the end of ${nonZero} cycle(s)`);
  test.assert((damageOf(rodB) ?? 0) > 0, "control: the plain rod took no damage over the same casts — the casts never reeled");

  // The hand check alone: no use at all, both rods worn by a write.
  const handRepairs0 = itemStats.repairsOnHandCheck;
  for (const p of [a, b]) {
    const s = inventoryOf(p).getItem(ROD_SLOT);
    const d = s?.getComponent("minecraft:durability");
    if (s === undefined || d === undefined) continue;
    d.damage = 50;
    inventoryOf(p).setItem(ROD_SLOT, s);
  }
  let back = -1;
  for (let t = 1; t <= HAND_CHECK_TICKS + 2; t++) {
    await test.idle(1);
    if (back < 0 && damageOf(inventoryOf(a).getItem(ROD_SLOT)) === 0) back = t;
  }
  log(
    `hand_check RESULT pearl damage 50 -> 0 at +${back} (repairs_on_hand_check +${itemStats.repairsOnHandCheck - handRepairs0}); ` +
      `plain stays ${String(damageOf(inventoryOf(b).getItem(ROD_SLOT)))}`
  );
  test.assert(back > 0, `the hand check left the Pearl Rod at ${String(damageOf(inventoryOf(a).getItem(ROD_SLOT)))}`);
  test.assert(damageOf(inventoryOf(b).getItem(ROD_SLOT)) === 50, "control: the hand check repaired a plain rod");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(5000)
  .tag("andrew");

// ------------------------------------------------------------- unbound: it fishes

/**
 * One pool for both lanes, one block deep, running past the platform's far edge on a floor laid there: a hook that
 * lands against a wall reads as stuck in a block (a reel costs 2 and nothing bites), so the pool is long enough for
 * the hook to land in open water.
 */
const POOL_MIN: Vector3 = { x: 1, y: 2, z: 2 };
const POOL_MAX: Vector3 = { x: 5, y: 2, z: 10 };
const RIM_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const RIM_MAX: Vector3 = { x: 6, y: 2, z: 11 };
/** The platform floor ends at z=6; relative y=1 past it is air. */
const OUTER_FLOOR_MIN: Vector3 = { x: 0, y: 1, z: 7 };
const OUTER_FLOOR_MAX: Vector3 = { x: 6, y: 1, z: 11 };
const FISH_A: Vector3 = { x: 1, y: 2, z: 0 };
const FISH_B: Vector3 = { x: 5, y: 2, z: 0 };
const FISH_AIM_A: Vector3 = { x: 1.5, y: 2, z: 6.5 };
const FISH_AIM_B: Vector3 = { x: 5.5, y: 2, z: 6.5 };
/** A hook left this long without a bite is reeled in and cast again. */
const BITE_WAIT_TICKS = 1200;
const FISH_DEADLINE_TICKS = 4000;
/** A bite pulls the bobber under: this far below its floating height, or this fast downwards. */
const BITE_DROP = 0.3;
const BITE_SPEED = -0.25;

function eachCell(min: Vector3, max: Vector3, fn: (at: Vector3) => void): void {
  for (let x = min.x; x <= max.x; x++) for (let y = min.y; y <= max.y; y++) for (let z = min.z; z <= max.z; z++) fn({ x, y, z });
}

function setRel(test: Test, at: Vector3, typeId: string): void {
  test.getDimension().getBlock(test.worldBlockLocation(at))?.setType(typeId);
}

function buildPool(test: Test): void {
  eachCell(OUTER_FLOOR_MIN, OUTER_FLOOR_MAX, (at) => setRel(test, at, "minecraft:stone"));
  eachCell(RIM_MIN, RIM_MAX, (at) => {
    const inPool = at.x >= POOL_MIN.x && at.x <= POOL_MAX.x && at.z >= POOL_MIN.z && at.z <= POOL_MAX.z;
    setRel(test, at, inPool ? "minecraft:water" : "minecraft:stone");
  });
}

function clearPool(test: Test): void {
  eachCell(RIM_MIN, RIM_MAX, (at) => setRel(test, at, "minecraft:air"));
  eachCell(OUTER_FLOOR_MIN, OUTER_FLOOR_MAX, (at) => setRel(test, at, "minecraft:air"));
}

function nonRodItems(p: Player): number {
  const inv = inventoryOf(p);
  let n = 0;
  for (let slot = 0; slot < inv.size; slot++) {
    const s = inv.getItem(slot);
    if (s !== undefined && s.typeId !== ROD_ID) n += s.amount;
  }
  return n;
}

interface Catch {
  caught: string;
  attempts: number;
  ticks: number;
}

/** Loot and experience the engine spawns around a reeled hook. */
class Spawns {
  readonly items: Array<{ tick: number; at: Vector3; what: string }> = [];
  private readonly sub: (ev: EntitySpawnAfterEvent) => void;

  constructor() {
    this.sub = world.afterEvents.entitySpawn.subscribe((ev) => {
      const e = ev.entity;
      if (!e.isValid || (e.typeId !== "minecraft:item" && e.typeId !== "minecraft:xp_orb")) return;
      const what = e.typeId === "minecraft:item" ? short(e.getComponent("minecraft:item")?.itemStack.typeId ?? "?") : "xp";
      this.items.push({ tick: system.currentTick, at: e.location, what });
    });
  }

  near(at: Vector3, from: number, radius: number): string[] {
    return this.items
      .filter((i) => i.tick >= from && Math.hypot(i.at.x - at.x, i.at.y - at.y, i.at.z - at.z) <= radius)
      .map((i) => i.what);
  }

  close(): void {
    world.afterEvents.entitySpawn.unsubscribe(this.sub);
  }
}

async function fishUntilCatch(test: Test, p: SimulatedPlayer, hooks: HookLog, spawns: Spawns, label: string): Promise<Catch> {
  const dim = test.getDimension();
  const start = system.currentTick;
  let attempts = 0;
  while (system.currentTick - start < FISH_DEADLINE_TICKS) {
    attempts++;
    const before = hooks.count(p);
    p.useItemInSlot(ROD_SLOT);
    for (let t = 0; t < USE_EVIDENCE_TICKS && hooks.count(p) === before; t++) await test.idle(1);
    const hook = hooks.last(p);
    if (hook === undefined || hooks.count(p) === before) {
      await test.idle(6);
      continue;
    }
    await test.idle(20);
    if (!hook.isValid) {
      log(`fish ${label} #${attempts} hook gone while settling`);
      continue;
    }
    const rest = hook.location;
    const cell = dim.getBlock({ x: Math.floor(rest.x), y: Math.floor(rest.y), z: Math.floor(rest.z) })?.typeId ?? "unloaded";
    if (cell !== "minecraft:water") {
      // A short cast onto the rim: nothing bites out of water, so it is reeled in and cast again at once.
      log(`fish ${label} #${attempts} hook in ${short(cell)} at ${f2(test.relativeLocation(rest).x)},${f2(test.relativeLocation(rest).z)}, cast again`);
      for (let tries = 0; tries < 3 && hook.isValid; tries++) {
        p.useItemInSlot(ROD_SLOT);
        for (let t = 0; t < USE_EVIDENCE_TICKS && hook.isValid; t++) await test.idle(1);
      }
      await test.idle(12);
      continue;
    }
    const samples: string[] = [];
    const ys: number[] = [];
    let minVy = 0;
    let maxDrop = 0;
    let bite = "";
    const watchFrom = system.currentTick;
    while (system.currentTick - watchFrom < BITE_WAIT_TICKS && hook.isValid) {
      const y = hook.location.y;
      const vy = hook.getVelocity().y;
      const top = ys.length >= 10 ? Math.max(...ys.slice(-10)) : undefined;
      const drop = top === undefined ? 0 : top - y;
      minVy = Math.min(minVy, vy);
      maxDrop = Math.max(maxDrop, drop);
      samples.push(`${f2(y - rest.y)}/${f2(vy)}`);
      if (samples.length > 20) samples.shift();
      if (top !== undefined && (drop > BITE_DROP || vy < BITE_SPEED)) {
        bite = `bite at +${system.currentTick - watchFrom} drop=${f2(drop)} vy=${f2(vy)} last20(dy/vy)=[${samples.join(" ")}]`;
        break;
      }
      ys.push(y);
      await test.idle(1);
    }
    const held = nonRodItems(p);
    const reelAt = system.currentTick;
    const reelFrom = hook.isValid ? hook.location : rest;
    let reeled = !hook.isValid;
    for (let tries = 0; tries < 3 && !reeled; tries++) {
      p.useItemInSlot(ROD_SLOT);
      for (let t = 0; t < 3 && hook.isValid; t++) await test.idle(1);
      reeled = !hook.isValid;
    }
    let caught = "";
    for (let t = 0; t < 60 && caught === ""; t++) {
      await test.idle(1);
      if (nonRodItems(p) > held) {
        const inv = inventoryOf(p);
        for (let slot = 0; slot < inv.size; slot++) {
          const s = inv.getItem(slot);
          if (s !== undefined && s.typeId !== ROD_ID) caught = `${short(s.typeId)}×${s.amount}`;
        }
        caught = `${caught} picked up +${system.currentTick - reelAt}`;
      }
    }
    const spawned = spawns.near(reelFrom, reelAt, 6);
    log(
      `fish ${label} #${attempts} hook in ${short(cell)} at ${f2(test.relativeLocation(rest).x)},${f2(test.relativeLocation(rest).z)} ` +
        `watched ${system.currentTick - watchFrom} min_vy=${f2(minVy)} max_drop=${f2(maxDrop)} ${bite || "no bite seen"} ` +
        `reeled=${reeled} spawned_at_hook=[${spawned.join(",")}] damage=${String(damageOf(inventoryOf(p).getItem(ROD_SLOT)))} -> ${caught || "nothing caught"}`
    );
    if (caught !== "") return { caught, attempts, ticks: system.currentTick - start };
    await test.idle(12);
  }
  return { caught: "", attempts, ticks: system.currentTick - start };
}

registerAsync("andrew", "pear_item_fishes_unbound", async (test: Test): Promise<void> => {
  buildPool(test);
  const a = await survivor(test, FISH_A, "pi_fisher_pearl");
  const b = await survivor(test, FISH_B, "pi_fisher_plain");
  await pearlRodFromToken(test, a);
  b.setItem(new ItemStack(ROD_ID, 1), ROD_SLOT, true);
  await test.idle(2);
  a.lookAtLocation(FISH_AIM_A, LookDuration.Instant);
  b.lookAtLocation(FISH_AIM_B, LookDuration.Instant);
  await test.idle(2);
  const markA = String(inventoryOf(a).getItem(ROD_SLOT)?.getDynamicProperty(MARK_KEY));
  const hooks = new HookLog();
  const spawns = new Spawns();
  let pearl: Catch;
  let plain: Catch;
  try {
    [pearl, plain] = await Promise.all([fishUntilCatch(test, a, hooks, spawns, "pearl"), fishUntilCatch(test, b, hooks, spawns, "plain")]);
    await test.idle(4);
  } finally {
    spawns.close();
    hooks.close();
    clearPool(test);
  }
  const rodA = inventoryOf(a).getItem(ROD_SLOT);
  const rodB = inventoryOf(b).getItem(ROD_SLOT);
  const keysA = rodA?.getDynamicPropertyIds().sort().join(",") ?? "-";
  log(`fish RESULT pearl: ${pearl.caught || "NOTHING"} in ${pearl.attempts} cast(s), ${pearl.ticks} ticks; rod: ${rodText(rodA)} dynamic_properties=[${keysA}]`);
  log(`fish RESULT plain (control): ${plain.caught || "NOTHING"} in ${plain.attempts} cast(s), ${plain.ticks} ticks; rod: ${rodText(rodB)}`);
  test.assert(plain.caught !== "", `control: the plain rod caught nothing in ${plain.attempts} cast(s) — the pool does not fish`);
  test.assert(pearl.caught !== "", `the Pearl Rod caught nothing in ${pearl.attempts} cast(s) while the plain rod caught ${plain.caught}`);
  test.assert(rodA !== undefined && isPearlRodStack(rodA), `the Pearl Rod lost its mark while fishing: ${rodText(rodA)}`);
  test.assert(String(rodA?.getDynamicProperty(MARK_KEY)) === markA, "the Pearl Rod's mark changed while fishing");
  test.assert(keysA === MARK_KEY, `the unbound Pearl Rod carries more than its mark: [${keysA}]`);
  test.assert(rodA?.getLore().join("|") === `${LORE_TITLE}|${LORE_UNBOUND}`, `lore [${rodA?.getLore().join("|")}]`);
  test.assert(damageOf(rodA) === 0, `the Pearl Rod's damage is ${String(damageOf(rodA))} after the catch`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(5000)
  .tag("andrew");
