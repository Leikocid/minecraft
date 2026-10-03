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

import { BlockVolume, type Entity, GameMode, ItemStack, type Player, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
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
