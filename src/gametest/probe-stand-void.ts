// CX-lgnd-14: an armour stand holding a marked legendary falls into the Void
// through a hole in the floor. Same contract as probe_ufo_holder_void — it
// passes when the measurement completed, and the answers are the
// "STAND-VOID ... RESULT" lines, which docs/feedback/diagnose-CNTR-LGND-CX14-AA.repro.sh
// turns into exit codes.
//
//   left  falls and is left alone: the window below the floor, and whether the
//         shipped recovery returns what it held.
//   first killed on the first tick it is seen below the floor.
//   late  killed 10 ticks after it was first seen below the floor.
//   band  (probe_item_floor_band) a marked item last seen within one block
//         above the floor, then gone.
//
// The two legendary_stand_* scenarios at the bottom assert what the stand
// watcher in src/legendary/recovery.ts must and must not do.

import { BlockVolume, type CommandResult, Entity, GameMode, ItemStack, type Player, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { standWatchState } from "../legendary/recovery";
import { ORBITAL_CANNON, SCYTHE_OF_CALAMITY, WEB_SWORD, type LegendaryDef, defForStack, genLedgerKey } from "../legendary/registry";
import type { Mark } from "../legendary/rules";
import * as state from "../legendary/state";

const log = (msg: string): void => console.warn(`[gametest] STAND-VOID ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

const HELD_KEY = "andrew:probe_stand_holds";

/** How long after the stand vanished the recovery gets to return what it held: two 40-tick checks and then some. */
const SETTLE_TICKS = 200;

/** Upper bound for a stand to reach the floor and vanish below it. */
const FALL_DEADLINE_TICKS = 200;

interface Stand {
  name: "left" | "first" | "late";
  cell: Vector3;
  def: LegendaryDef;
  killAfter: number | undefined;
  entity?: Entity;
  mark?: Mark;
  path: string[];
  firstBelow?: number;
  lastValid?: number;
  killed?: string;
}

function hasItemInHand(dimensionEntity: Entity, at: Vector3, itemId: string): string {
  try {
    const selector = `@e[type=minecraft:armor_stand,x=${at.x},y=${at.y},z=${at.z},r=0.6,hasitem={item=${itemId},location=slot.weapon.mainhand}]`;
    return String(dimensionEntity.dimension.runCommand(`testfor ${selector}`).successCount > 0);
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

function ledgerGen(def: LegendaryDef, id: string): number {
  const raw = world.getDynamicProperty(genLedgerKey(def, id));
  return typeof raw === "number" ? raw : 0;
}

function carried(player: Player): ItemStack[] {
  const container = player.getComponent("minecraft:inventory")?.container;
  const stacks: ItemStack[] = [];
  for (let slot = 0; container !== undefined && slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack !== undefined) stacks.push(stack);
  }
  return stacks;
}

function gensOf(def: LegendaryDef, stacks: ItemStack[], id: string): number[] {
  return stacks.flatMap((stack) => {
    const mark = state.isItemOf(def, stack) ? state.getMark(def, stack) : undefined;
    return mark?.id === id ? [mark.gen] : [];
  });
}

/** The owner hands `stack` to the stand the way a player does: the stand has no equippable. */
async function handOver(test: Test, owner: SimulatedPlayer, stand: Entity, stack: ItemStack): Promise<string> {
  const back = owner.location;
  owner.teleport({ x: stand.location.x - 1.5, y: stand.location.y, z: stand.location.z });
  owner.getComponent("minecraft:inventory")?.container.setItem(0, stack);
  owner.selectedSlotIndex = 0;
  await test.idle(2);
  owner.lookAtEntity(stand);
  let tries = 0;
  while (tries < 10 && hasItemInHand(stand, stand.location, stack.typeId) !== "true") {
    tries++;
    owner.interactWithEntity(stand);
    await test.idle(2);
  }
  owner.teleport(back);
  return `interactWithEntity x${tries}, hasitem ${hasItemInHand(stand, stand.location, stack.typeId)}`;
}

registerAsync("andrew", "probe_stand_void", async (test: Test): Promise<void> => {
  const dimension = test.getDimension();
  const floor = dimension.heightRange.min;
  const owner = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "stand_void_owner", GameMode.Survival);
  const stands: Stand[] = [
    { name: "left", cell: { x: 5, y: 2, z: 1 }, def: SCYTHE_OF_CALAMITY, killAfter: undefined, path: [] },
    { name: "first", cell: { x: 5, y: 2, z: 5 }, def: WEB_SWORD, killAfter: 0, path: [] },
    { name: "late", cell: { x: 1, y: 2, z: 5 }, def: ORBITAL_CANNON, killAfter: 10, path: [] },
  ];
  for (const s of stands) s.entity = test.spawn("minecraft:armor_stand", s.cell);
  await test.idle(4);

  const byId = new Map<string, Stand>();
  for (const s of stands) byId.set((s.entity as Entity).id, s);
  const events: string[] = [];
  const interactSub = world.afterEvents.playerInteractWithEntity.subscribe((e) => {
    const s = e.target?.isValid ? byId.get(e.target.id) : undefined;
    if (s === undefined) return;
    const before = e.beforeItemStack;
    const def = defForStack(before);
    const mark = def === undefined || before === undefined ? undefined : state.getMark(def, before);
    let written = "nothing to write";
    if (def !== undefined && mark !== undefined) {
      try {
        e.target.setDynamicProperty(HELD_KEY, `${def.itemId} ${mark.id} ${mark.gen}`);
        written = "wrote the mark on the stand";
      } catch (err) {
        written = `setDynamicProperty threw ${errText(err)}`;
      }
    }
    events.push(`t${system.currentTick} ${s.name} interact: before ${before?.typeId ?? "empty"} mark ${mark === undefined ? "none" : `${mark.id}/${mark.gen}`}, after ${e.itemStack?.typeId ?? "empty"}; ${written}`);
  });
  const removeSub = world.beforeEvents.entityRemove.subscribe((e) => {
    const s = byId.get(e.removedEntity.id);
    if (s === undefined) return;
    const gone = e.removedEntity;
    let dp: string;
    try {
      dp = String(gone.getDynamicProperty(HELD_KEY));
    } catch (err) {
      dp = `threw ${errText(err)}`;
    }
    events.push(`t${system.currentTick} ${s.name} entityRemove at ${fmt(gone.location)}: dynamic property "${dp}", hasitem in the before-event: ${hasItemInHand(gone, gone.location, s.def.itemId)}`);
  });
  const dieSub = world.afterEvents.entityDie.subscribe((e) => {
    const s = e.deadEntity?.id === undefined ? undefined : byId.get(e.deadEntity.id);
    if (s !== undefined) events.push(`t${system.currentTick} ${s.name} entityDie (${e.damageSource.cause})`);
  });
  const spawnSub = world.afterEvents.entitySpawn.subscribe((e) => {
    if (!e.entity.isValid || e.entity.typeId !== "minecraft:item") return;
    const stack = e.entity.getComponent("minecraft:item")?.itemStack;
    const def = defForStack(stack);
    const mark = def === undefined || stack === undefined ? undefined : state.getMark(def, stack);
    if (def === undefined) return;
    const at = e.entity.location;
    const loaded = (y: number): string => {
      try {
        return String(e.entity.dimension.isChunkLoaded({ x: at.x, y, z: at.z }));
      } catch (err) {
        return `threw ${errText(err)}`;
      }
    };
    events.push(
      `t${system.currentTick} item ${def.itemId} mark ${mark === undefined ? "none" : `${mark.id}/${mark.gen}`} at ${fmt(at)} (y ${at.y}); ` +
        `isChunkLoaded there ${loaded(at.y)}, at the floor ${loaded(floor)}`
    );
  });
  const original = console.warn;
  const warned: string[] = [];
  console.warn = (...args: unknown[]): void => {
    warned.push(args.map(String).join(" "));
    original(...args);
  };

  try {
    for (const s of stands) {
      const stand = s.entity as Entity;
      s.mark = state.makeMark("admin", owner);
      const how = await handOver(test, owner, stand, state.markItem(s.def, new ItemStack(s.def.itemId, 1), s.mark));
      log(`${s.name}: ${s.def.itemId} id ${s.mark.id} handed over (${how}); owner carries gens [${gensOf(s.def, carried(owner), s.mark.id).join(" ")}]`);
    }
    await test.idle(20);

    // A 1x1 shaft from the platform down through the bedrock under each stand.
    for (const s of stands) {
      const top = test.worldLocation({ x: s.cell.x, y: s.cell.y - 1, z: s.cell.z });
      dimension.fillBlocks(new BlockVolume({ x: top.x, y: floor, z: top.z }, top), "minecraft:air");
    }
    const opened = system.currentTick;
    events.push(`t${opened} shafts opened to y=${floor}`);

    for (let t = 0; t < FALL_DEADLINE_TICKS && stands.some((s) => s.entity?.isValid); t++) {
      await test.idle(1);
      const now = system.currentTick;
      for (const s of stands) {
        const stand = s.entity as Entity;
        if (!stand.isValid) continue;
        let at: Vector3;
        try {
          at = stand.location;
        } catch {
          continue;
        }
        s.lastValid = now;
        if (at.y >= floor) {
          if (t % 5 === 0) s.path.push(`t${now} y=${at.y.toFixed(1)}`);
          continue;
        }
        if (s.firstBelow === undefined) s.firstBelow = now;
        const seen = dimension.getEntities({ type: "minecraft:armor_stand" }).some((e) => e.id === stand.id);
        s.path.push(`t${now} y=${at.y.toFixed(1)} hasitem=${hasItemInHand(stand, at, s.def.itemId)} getEntities=${seen}`);
        if (s.killAfter !== undefined && s.killed === undefined && now - s.firstBelow >= s.killAfter) {
          try {
            s.killed = `t${now} kill() -> ${stand.kill()} at ${fmt(at)}`;
          } catch (err) {
            s.killed = `t${now} kill() threw ${errText(err)}`;
          }
        }
      }
    }
    await test.idle(SETTLE_TICKS);

    const held = carried(owner);
    for (const s of stands) {
      const mark = s.mark as Mark;
      const loss = warned.filter((l) => l.includes("legendary recovery:") && l.includes(mark.id));
      const window = s.firstBelow === undefined || s.lastValid === undefined ? "never below the floor" : `${s.lastValid - s.firstBelow + 1} ticks`;
      log(
        `${s.name} RESULT ${s.def.itemId} id ${mark.id}: owner holds gens [${gensOf(s.def, held, mark.id).join(" ")}], ledger ${ledgerGen(s.def, mark.id)}; ` +
          `stand ${(s.entity as Entity).isValid ? "still there" : "gone"}, below the floor from t${s.firstBelow ?? "-"}, last valid t${s.lastValid ?? "-"} (window ${window}); ` +
          `kill: ${s.killed ?? "not killed"}; recovery: ${loss.join(" | ") || "none"}; path: ${s.path.join(", ")}`
      );
    }
    log(`events: ${events.join(" | ")}`);
  } finally {
    console.warn = original;
    world.afterEvents.playerInteractWithEntity.unsubscribe(interactSub);
    world.beforeEvents.entityRemove.unsubscribe(removeSub);
    world.afterEvents.entityDie.unsubscribe(dieSub);
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    for (const s of stands) if (s.entity?.isValid) s.entity.remove();
  }
  test.succeed();
})
  .structureName("andrew:platform")
  .maxTicks(700)
  .tag("andrew");

// The floor band: a marked item entity recovery last saw less than one block
// above the floor (mid-fall in the End, where the floor is open), then gone.
// Held there by teleport in a shaft through the bedrock until a 40-tick check
// has recorded it, then removed.
registerAsync("andrew", "probe_item_floor_band", async (test: Test): Promise<void> => {
  const dimension = test.getDimension();
  const floor = dimension.heightRange.min;
  const owner = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "floor_band_owner", GameMode.Survival);
  await test.idle(4);
  const top = test.worldLocation({ x: 5, y: 1, z: 5 });
  dimension.fillBlocks(new BlockVolume({ x: top.x, y: floor, z: top.z }, top), "minecraft:air");
  const band = { x: top.x + 0.5, y: floor + 0.5, z: top.z + 0.5 };
  const mark = state.makeMark("admin", owner);
  const item = dimension.spawnItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark), band);
  const original = console.warn;
  const warned: string[] = [];
  console.warn = (...args: unknown[]): void => {
    warned.push(args.map(String).join(" "));
    original(...args);
  };
  try {
    let held = "not measured";
    for (let t = 0; t < 50; t++) {
      item.teleport(band);
      item.clearVelocity();
      await test.idle(1);
      held = item.isValid ? fmt(item.location) : "gone";
    }
    item.remove();
    const removed = system.currentTick;
    await test.idle(120);
    const loss = warned.filter((l) => l.includes("legendary recovery:") && l.includes(mark.id));
    log(
      `band RESULT ${WEB_SWORD.itemId} id ${mark.id}: owner holds gens [${gensOf(WEB_SWORD, carried(owner), mark.id).join(" ")}], ledger ${ledgerGen(WEB_SWORD, mark.id)}; ` +
        `held at ${held} (floor ${floor}), removed t${removed}; recovery: ${loss.join(" | ") || "none"}`
    );
  } finally {
    console.warn = original;
    if (item.isValid) item.remove();
  }
  test.succeed();
})
  .structureName("andrew:platform")
  .maxTicks(300)
  .tag("andrew");

const ARMOR_STAND = "minecraft:armor_stand";

interface HandCase {
  name: "marked" | "iron" | "unmarked";
  cell: Vector3;
  stack: ItemStack;
  entity?: Entity;
}

/**
 * Three stands fall into the Void: one holding a marked Scythe, one an iron
 * sword, one an unmarked Web Sword copy. kill() on a stand raises no entityDie
 * (probe_stand_void), so whether the add-on killed one is read from its spill:
 * a killed stand drops what it holds as item entities, a stand the engine
 * removes drops nothing. The release pack runs the same watcher and reads
 * armour stands, so either pack may be the one that kills.
 */
registerAsync("andrew", "legendary_stand_void_hands", async (test: Test): Promise<void> => {
  const dimension = test.getDimension();
  const floor = dimension.heightRange.min;
  const owner = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "stand_hands_owner", GameMode.Survival);
  const mark = state.makeMark("admin", owner);
  const cases: HandCase[] = [
    { name: "marked", cell: { x: 5, y: 2, z: 1 }, stack: state.markItem(SCYTHE_OF_CALAMITY, new ItemStack(SCYTHE_OF_CALAMITY.itemId, 1), mark) },
    { name: "iron", cell: { x: 5, y: 2, z: 5 }, stack: new ItemStack("minecraft:iron_sword", 1) },
    { name: "unmarked", cell: { x: 1, y: 2, z: 5 }, stack: new ItemStack(WEB_SWORD.itemId, 1) },
  ];
  for (const c of cases) c.entity = test.spawn(ARMOR_STAND, c.cell);
  await test.idle(4);

  const wsLedger = (): string[] => world.getDynamicPropertyIds().filter((k) => k.startsWith(genLedgerKey(WEB_SWORD, "")));
  const ledgerBefore = new Set(wsLedger());
  const spills: Array<{ typeId: string; markId: string | undefined }> = [];
  const spawnSub = world.afterEvents.entitySpawn.subscribe((e) => {
    if (!e.entity.isValid || e.entity.typeId !== "minecraft:item") return;
    const stack = e.entity.getComponent("minecraft:item")?.itemStack;
    if (stack === undefined) return;
    const def = defForStack(stack);
    spills.push({ typeId: stack.typeId, markId: def === undefined ? undefined : state.getMark(def, stack)?.id });
  });
  const original = console.warn;
  const warned: string[] = [];
  console.warn = (...args: unknown[]): void => {
    warned.push(args.map(String).join(" "));
    original(...args);
  };

  try {
    for (const c of cases) {
      const how = await handOver(test, owner, c.entity as Entity, c.stack);
      test.assert(how.endsWith("hasitem true"), `the ${c.name} stand does not hold ${c.stack.typeId} (${how})`);
    }
    await test.idle(20);
    for (const c of cases) {
      const top = test.worldLocation({ x: c.cell.x, y: c.cell.y - 1, z: c.cell.z });
      dimension.fillBlocks(new BlockVolume({ x: top.x, y: floor, z: top.z }, top), "minecraft:air");
    }
    for (let t = 0; t < FALL_DEADLINE_TICKS && cases.some((c) => c.entity?.isValid); t++) await test.idle(1);
    await test.idle(120);

    const held = carried(owner);
    const gens = gensOf(SCYTHE_OF_CALAMITY, held, mark.id);
    const returns = warned.filter((l) => l.includes("legendary recovery:") && l.includes(mark.id) && l.includes("now gen"));
    const kills = warned.filter((l) => l.includes("an armour stand below the floor"));
    const spilled = (typeId: string): number => spills.filter((s) => s.typeId === typeId).length;
    const newLedger = wsLedger().filter((k) => !ledgerBefore.has(k));
    log(
      `hands RESULT marked ${SCYTHE_OF_CALAMITY.itemId} id ${mark.id}: owner holds gens [${gens.join(" ")}], ledger ${ledgerGen(SCYTHE_OF_CALAMITY, mark.id)}, ` +
        `${returns.length} return line(s), ${spills.filter((s) => s.markId === mark.id).length} marked spill(s); ` +
        `iron: ${spilled("minecraft:iron_sword")} iron sword spill(s); unmarked: owner holds ${held.filter((s) => s.typeId === WEB_SWORD.itemId).length} ${WEB_SWORD.itemId}, ` +
        `${spilled(WEB_SWORD.itemId)} spill(s), new ledger keys [${newLedger.join(" ")}]; stands gone: ${cases.map((c) => `${c.name} ${!c.entity?.isValid}`).join(", ")}; ` +
        `this pack's watcher: ${kills.join(" | ") || "no kill"}`
    );
    for (const c of cases) test.assert(!(c.entity as Entity).isValid, `the ${c.name} stand is still in the world`);
    test.assert(gens.length === 1 && gens[0] === 1, `owner holds Scythe gens [${gens.join(" ")}] after its stand fell into the Void`);
    test.assert(ledgerGen(SCYTHE_OF_CALAMITY, mark.id) === 1, `Scythe ledger at ${ledgerGen(SCYTHE_OF_CALAMITY, mark.id)}, not 1`);
    test.assert(returns.length === 1, `${returns.length} return lines for the Scythe: ${returns.join(" | ")}`);
    test.assert(spills.filter((s) => s.markId === mark.id).length === 1, "the killed stand did not spill the marked Scythe exactly once");
    test.assert(spilled("minecraft:iron_sword") === 0, "the iron-sword stand was killed: its sword spilled");
    test.assert(held.every((s) => s.typeId !== WEB_SWORD.itemId), "an unmarked Web Sword copy came back to the owner");
    test.assert(newLedger.length === 0, `an unmarked copy wrote Web Sword ledger keys [${newLedger.join(" ")}]`);
  } finally {
    console.warn = original;
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    for (const c of cases) if (c.entity?.isValid) c.entity.remove();
  }
  test.succeed();
})
  .structureName("andrew:platform")
  .maxTicks(700)
  .tag("andrew");

/**
 * 50 stands stand above the floor for 200 ticks: the watcher follows them and
 * asks none of them anything. Every Entity.runCommand on an armour stand in this
 * pack is counted; a stand teleported below the floor is the control that the
 * count sees the watcher's questions. With no stand loaded, its interval stops.
 */
registerAsync("andrew", "legendary_stand_watch_idle", async (test: Test): Promise<void> => {
  const floor = test.getDimension().heightRange.min;
  const run = Entity.prototype.runCommand;
  let asked = 0;
  Entity.prototype.runCommand = function (this: Entity, command: string): CommandResult {
    if (this.typeId === ARMOR_STAND) asked++;
    return run.call(this, command);
  };
  const spawned: Entity[] = [];
  try {
    for (let i = 0; i < 50; i++) spawned.push(test.spawn(ARMOR_STAND, { x: i % 7, y: 2, z: Math.floor(i / 7) % 7 }));
    await test.idle(4);
    const armed = standWatchState();
    test.assert(armed.ticking && armed.stands >= 50, `the watcher follows ${armed.stands} stands, ticking ${armed.ticking}`);

    await test.idle(200);
    const quiet = asked;

    const control = spawned[0];
    control.teleport({ x: control.location.x, y: floor - 4, z: control.location.z });
    await test.idle(3);
    const below = asked - quiet;

    let leftovers = 0;
    for (const id of ["overworld", "nether", "the_end"]) {
      for (const e of world.getDimension(id).getEntities({ type: ARMOR_STAND })) {
        if (!spawned.some((s) => s.id === e.id)) leftovers++;
        e.remove();
      }
    }
    await test.idle(2);
    const idle = standWatchState();
    log(
      `idle RESULT 50 stands above the floor for 200 ticks: ${quiet} command(s); control below the floor: ${below} command(s); ` +
        `armed ${armed.stands} stands ticking ${armed.ticking}; after removal (${leftovers} leftover stand(s) from other tests): ${idle.stands} stands ticking ${idle.ticking}`
    );
    test.assert(quiet === 0, `${quiet} commands on stands above the floor`);
    test.assert(below > 0, "the control stand below the floor was never asked: the count does not see the watcher");
    test.assert(idle.stands === 0 && !idle.ticking, `with no stand loaded the watcher follows ${idle.stands}, ticking ${idle.ticking}`);
  } finally {
    Entity.prototype.runCommand = run;
    for (const s of spawned) if (s.isValid) s.remove();
  }
  test.succeed();
})
  .structureName("andrew:platform")
  .maxTicks(400)
  .tag("andrew");
