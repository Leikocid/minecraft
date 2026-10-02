// Legendaries against what the UFO Magnet does to the world, ahead of the
// magnet itself: a lethal fall from the hover height (L0-lgnd-ac22) and a
// holder teleported away and back (L0-lgnd-r016 §3, L0-lgnd-as15).
//
// The fall is the magnet's release reproduced by hand: the player is lifted 37
// blocks, held there by teleport, and let go — 33 fall damage on BDS 1.26.51.1
// (U2, probe/ufo-magnet). The oracle reads ids and generations off the stacks
// and the world ledger itself, so a loss return (gen + 1) cannot pass for
// death retention, and retention cannot pass for a loss return.

import {
  type Container,
  type Dimension,
  type Entity,
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { ORBITAL_CANNON, SCYTHE_OF_CALAMITY, WEB_SWORD, type LegendaryDef, genLedgerKey, isLegendaryStack } from "../legendary/registry";
import type { Mark } from "../legendary/rules";
import * as state from "../legendary/state";

const STRUCTURE = "andrew:platform";

const log = (msg: string): void => console.warn(`[gametest] ufo ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** The world ledger's generation of `id`, read without src/legendary (absent = 0). */
function ledgerGen(def: LegendaryDef, id: string): number {
  const raw = world.getDynamicProperty(genLedgerKey(def, id));
  return typeof raw === "number" ? raw : 0;
}

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

/** Every stack the player holds: inventory, then the off hand. */
function carried(player: Player): ItemStack[] {
  const container = inventoryOf(player);
  const stacks: ItemStack[] = [];
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack !== undefined) stacks.push(stack);
  }
  const offhand = state.offhandOf(player);
  if (offhand !== undefined) stacks.push(offhand);
  return stacks;
}

/** The generations of every copy of instance `id` among `stacks`. */
function gensOf(def: LegendaryDef, stacks: ItemStack[], id: string): number[] {
  return stacks.flatMap((stack) => {
    const mark = state.isItemOf(def, stack) ? state.getMark(def, stack) : undefined;
    return mark?.id === id ? [mark.gen] : [];
  });
}

function itemsNear(dimension: Dimension, at: Vector3, radius: number): Entity[] {
  return dimension.getEntities({ type: "minecraft:item", location: at, maxDistance: radius });
}

function stacksOf(entities: Entity[]): ItemStack[] {
  return entities.flatMap((e) => {
    const stack = e.isValid ? e.getComponent("minecraft:item")?.itemStack : undefined;
    return stack === undefined ? [] : [stack];
  });
}

/** Records what the modules under test print, so a missing line is an observation, not an inference. */
function captureWarnings(): { lines: string[]; stop(): void } {
  const original = console.warn;
  const lines: string[] = [];
  console.warn = (...args: unknown[]): void => {
    lines.push(args.map(String).join(" "));
    original(...args);
  };
  return { lines, stop: () => void (console.warn = original) };
}

// ------------------------------------------------ L0-lgnd-ac22: a magnet-height fall death keeps every legendary

const FALL_STAND: Vector3 = { x: 3, y: 2, z: 3 };

/** U2: 37 up is the hover height whose fall killed the probe's players. */
const LIFT_BLOCKS = 37;

/** How long the lifted player is held by teleport before the release. */
const HOLD_TICKS = 20;

/** A 37-block fall lands in about 40 ticks; this is the bound for "it died". */
const FALL_DEADLINE_TICKS = 160;

/** Past two 40-tick loss-recovery checks, so a loss return would have landed. */
const DEATH_SETTLE_TICKS = 100;

/** Twice the retention sweep radius: also sees what the sweep left behind. */
const GROUND_RADIUS = 16;

const FALL_HELD: ReadonlyArray<{ def: LegendaryDef; where: "offhand" | number }> = [
  { def: WEB_SWORD, where: "offhand" },
  { def: SCYTHE_OF_CALAMITY, where: 1 },
  { def: ORBITAL_CANNON, where: 2 },
];

registerAsync("andrew", "legendary_ufo_fall_death_keeps", async (test: Test): Promise<void> => {
  const player: SimulatedPlayer = test.spawnSimulatedPlayer(FALL_STAND, "ufo_faller", GameMode.Survival);
  await test.idle(4);

  const container = inventoryOf(player);
  container.setItem(0, new ItemStack("minecraft:iron_ingot", 1));
  player.selectedSlotIndex = 0;
  const marks = new Map<LegendaryDef, Mark>();
  for (const { def, where } of FALL_HELD) {
    const mark = state.makeMark("admin", player);
    marks.set(def, mark);
    const stack = state.markItem(def, new ItemStack(def.itemId, 1), mark);
    if (where === "offhand") {
      const put = player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, stack);
      test.assert(put === true, `the off hand refused the marked ${def.itemId}`);
    } else {
      container.setItem(where, stack);
    }
  }
  await test.idle(4);
  for (const { def } of FALL_HELD) {
    const id = (marks.get(def) as Mark).id;
    test.assert(gensOf(def, carried(player), id).join() === "0", `the marked ${def.itemId} is not held once at gen 0 before the lift`);
  }
  test.assert(container.getItem(0)?.typeId === "minecraft:iron_ingot", "the iron ingot is not in the main hand");

  const hurts: number[] = [];
  let death: { cause: string; at: Vector3; tick: number } | undefined;
  const hurtSub = world.afterEvents.entityHurt.subscribe((event) => {
    const hurt: Entity | undefined = event.hurtEntity;
    if (hurt !== undefined && hurt.id === player.id && event.damageSource.cause === "fall") hurts.push(event.damage);
  });
  const dieSub = world.afterEvents.entityDie.subscribe((event) => {
    const dead: Entity | undefined = event.deadEntity;
    if (dead !== undefined && dead.id === player.id) {
      death = { cause: event.damageSource.cause, at: dead.location, tick: system.currentTick };
    }
  });

  let groundAtDeath = "not measured";
  let ingotDropped = false;
  try {
    const pad = player.location;
    const hold = { x: pad.x, y: pad.y + LIFT_BLOCKS, z: pad.z };
    for (let t = 0; t < HOLD_TICKS; t++) {
      player.teleport(hold);
      await test.idle(1);
    }
    const released = system.currentTick;
    for (let t = 0; t < FALL_DEADLINE_TICKS && death === undefined; t++) await test.idle(1);
    test.assert(death !== undefined, `the player did not die within ${FALL_DEADLINE_TICKS} ticks of the release (fall damage [${hurts.join(" ")}])`);
    const died = death as NonNullable<typeof death>;
    log(`fall: released at ${fmt(hold)}, died ${died.tick - released} ticks later at ${fmt(died.at)}, cause ${died.cause}, fall damage [${hurts.join(" ")}]`);
    test.assert(died.cause === "fall", `the player died of ${died.cause}, not of the fall`);

    // Before the respawn: the vanilla drop is still on the ground, the sweep has run.
    await test.idle(5);
    const ground = stacksOf(itemsNear(player.dimension, died.at, GROUND_RADIUS));
    ingotDropped = ground.some((s) => s.typeId === "minecraft:iron_ingot");
    groundAtDeath = ground.map((s) => s.typeId).join(" ") || "nothing";

    player.respawn();
    await test.idle(DEATH_SETTLE_TICKS);

    const held = carried(player);
    const legendaries = held.filter((s) => isLegendaryStack(s)).length;
    const groundAfter = stacksOf(itemsNear(player.dimension, died.at, GROUND_RADIUS));
    const rows = FALL_HELD.map(({ def }) => {
      const mark = marks.get(def) as Mark;
      return {
        def,
        held: gensOf(def, held, mark.id),
        ground: gensOf(def, groundAfter, mark.id).length,
        ledger: ledgerGen(def, mark.id),
        pending: state.readPending(def, player).length,
        owed: (state.readOwed(def)[player.id] ?? []).length,
      };
    });
    log(
      `fall RESULT ground at death [${groundAtDeath}]; after respawn ${legendaries} legendary stack(s) held; ` +
        rows.map((r) => `${r.def.itemId} held gens [${r.held.join(" ")}] ground ${r.ground} ledger ${r.ledger} pending ${r.pending} owed ${r.owed}`).join("; ")
    );
    test.assert(ingotDropped, `the iron ingot was not dropped at the death spot (ground: ${groundAtDeath})`);
    for (const r of rows) {
      test.assert(r.held.join() === "0", `${r.def.itemId}: held at gens [${r.held.join(" ")}] after respawn, expected once at gen 0`);
      test.assert(r.ledger === 0, `${r.def.itemId}: the ledger moved to gen ${r.ledger}, so it came back as a loss, not retained`);
      test.assert(r.ground === 0, `${r.def.itemId}: ${r.ground} item entities lie at the fall spot`);
      test.assert(r.pending === 0 && r.owed === 0, `${r.def.itemId}: a return is still outstanding (pending ${r.pending}, owed ${r.owed})`);
    }
    test.assert(legendaries === FALL_HELD.length, `${legendaries} legendary stacks held after respawn, expected exactly ${FALL_HELD.length}`);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(hurtSub);
    world.afterEvents.entityDie.unsubscribe(dieSub);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ L0-lgnd-r016 §3 / as15: a teleported holder keeps its legendary recoverable

const OWNER_STAND: Vector3 = { x: 1, y: 2, z: 1 };
const HOLDER_AT: Vector3 = { x: 5, y: 2, z: 5 };

/** "Teleported 40 blocks and back" (L0-lgnd-r016 §3 criterion). */
const AWAY_BLOCKS = 40;

/** Inside the 3 s recovery deadline the loss scenarios hold. */
const RETURN_DEADLINE_TICKS = 100;

interface Holder {
  /** Puts the marked stack into the holder; returns how. */
  load(test: Test, owner: SimulatedPlayer, holder: Entity, stack: ItemStack): Promise<string>;
  /** Whether the holder still has the legendary, and how that was read. */
  holds(holder: Entity, def: LegendaryDef, id: string): { holds: boolean; how: string };
}

/** A minecart's container, read slot by slot through isLegendaryStack (as15 §1). */
const MINECART: Holder = {
  async load(_test, _owner, holder, stack) {
    const container = holder.getComponent("minecraft:inventory")?.container;
    if (container === undefined) throw new Error(`${holder.typeId} has no readable container`);
    container.setItem(0, stack);
    container.setItem(1, new ItemStack("minecraft:iron_ingot", 3));
    return `container.setItem, ${container.size} slots`;
  },
  holds(holder, def, id) {
    const container = holder.getComponent("minecraft:inventory")?.container;
    if (container === undefined) return { holds: false, how: "no container" };
    const flagged: string[] = [];
    let found = false;
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (!isLegendaryStack(stack)) continue;
      flagged.push(`${slot}:${stack?.typeId}`);
      const mark = state.isItemOf(def, stack) ? state.getMark(def, stack) : undefined;
      if (mark?.id === id && mark.gen === 0) found = true;
    }
    return { holds: found && flagged.length === 1, how: `isLegendaryStack flags slots [${flagged.join(" ")}]` };
  },
};

function hasItemInHand(holder: Entity, itemId: string): boolean {
  const at = holder.location;
  try {
    const selector = `@e[type=${holder.typeId},x=${at.x},y=${at.y},z=${at.z},r=0.6,hasitem={item=${itemId},location=slot.weapon.mainhand}]`;
    return holder.dimension.runCommand(`testfor ${selector}`).successCount > 0;
  } catch {
    return false;
  }
}

/** An armour stand's hand: no script inventory, read through hasitem (as15 §2). */
const ARMOR_STAND: Holder = {
  async load(test, owner, holder, stack) {
    const equippable = holder.getComponent(EntityComponentTypes.Equippable);
    if (equippable !== undefined && equippable.setEquipment(EquipmentSlot.Mainhand, stack)) {
      return "equippable.setEquipment";
    }
    // No equippable on the stand: the owner hands it over the way a player does.
    const back = owner.location;
    owner.teleport({ x: holder.location.x - 1.5, y: holder.location.y, z: holder.location.z });
    inventoryOf(owner).setItem(0, stack);
    owner.selectedSlotIndex = 0;
    await test.idle(2);
    owner.lookAtEntity(holder);
    let tries = 0;
    let said = "";
    while (tries < 10 && !hasItemInHand(holder, stack.typeId)) {
      tries++;
      try {
        said = String(owner.interactWithEntity(holder));
      } catch (err) {
        said = `threw ${errText(err)}`;
      }
      await test.idle(2);
    }
    owner.teleport(back);
    return `equippable ${equippable === undefined ? "absent" : "refused"}; interactWithEntity x${tries} (${said})`;
  },
  holds(holder, def) {
    const holds = hasItemInHand(holder, def.itemId);
    return { holds, how: `hasitem ${def.itemId} in slot.weapon.mainhand: ${holds}` };
  },
};

function holderScenario(name: string, ownerName: string, holderType: string, holder: Holder, def: LegendaryDef): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const owner = test.spawnSimulatedPlayer(OWNER_STAND, ownerName, GameMode.Survival);
    const entity = test.spawn(holderType, HOLDER_AT);
    await test.idle(4);
    const warnings = captureWarnings();
    let spilled: Entity | undefined;
    try {
      const mark = state.makeMark("admin", owner);
      const how = await holder.load(test, owner, entity, state.markItem(def, new ItemStack(def.itemId, 1), mark));
      const loaded = holder.holds(entity, def, mark.id);
      log(`${name}: loaded via ${how}; ${loaded.how}`);
      test.assert(loaded.holds, `the ${holderType} does not hold the marked ${def.itemId} (${loaded.how}; via ${how})`);
      test.assert(gensOf(def, carried(owner), mark.id).length === 0, `the owner still carries the ${def.itemId} it handed over`);

      // The magnet's move, both ways: away by teleport, held, and back.
      const start = entity.location;
      const away = { x: start.x, y: start.y + AWAY_BLOCKS, z: start.z };
      for (let t = 0; t < 10; t++) {
        entity.teleport(away);
        await test.idle(1);
      }
      const reached = entity.location;
      entity.teleport(start);
      entity.clearVelocity();
      await test.idle(5);
      const back = holder.holds(entity, def, mark.id);
      log(`${name}: away at ${fmt(reached)}, back at ${fmt(entity.location)}; ${back.how}`);
      test.assert(Math.abs(reached.y - away.y) < 1, `the ${holderType} did not reach ${fmt(away)} (at ${fmt(reached)})`);
      test.assert(back.holds, `after the round trip the ${holderType} no longer holds the ${def.itemId} (${back.how})`);

      // Destroyed: its contents spill as item entities recovery must pick up.
      const at = entity.location;
      const killed = entity.kill();
      let spillGens: number[] = [];
      for (let t = 0; t < 20 && spilled === undefined; t++) {
        await test.idle(1);
        spilled = itemsNear(test.getDimension(), at, 6).find((e) => gensOf(def, stacksOf([e]), mark.id).length > 0);
      }
      spillGens = spilled === undefined ? [] : gensOf(def, stacksOf([spilled]), mark.id);
      const watching = warnings.lines.some((l) => l.includes(`watching ${def.itemId} id ${mark.id}`));
      log(`${name}: kill() -> ${killed}; spilled copy ${spilled === undefined ? "none" : `at ${fmt(spilled.location)} gens [${spillGens.join(" ")}]`}; recovery watching: ${watching}`);
      test.assert(spilled !== undefined, `destroying the ${holderType} spilled no item entity carrying ${def.itemId} id ${mark.id}`);
      test.assert(spillGens.join() === "0", `the spilled ${def.itemId} carries gens [${spillGens.join(" ")}], expected 0`);
      test.assert(watching, `recovery never started watching the spilled ${def.itemId} id ${mark.id}`);

      // And lost: what the loss mechanism must hand back. Below the floor only
      // after it was watched on the pad (legendary_returns_from_void).
      await test.idle(3);
      const floor = test.getDimension().heightRange.min;
      (spilled as Entity).teleport({ x: at.x, y: floor - 8, z: at.z });
      let held: number[] = [];
      for (let t = 0; t < RETURN_DEADLINE_TICKS && held.length === 0; t++) {
        await test.idle(1);
        held = gensOf(def, carried(owner), mark.id);
      }
      await test.idle(5);
      held = gensOf(def, carried(owner), mark.id);
      const ground = gensOf(def, stacksOf(itemsNear(test.getDimension(), at, 32)), mark.id);
      const loss = warnings.lines.filter((l) => l.includes(`id ${mark.id}`) && l.includes("now gen"));
      log(`${name} RESULT owner holds gens [${held.join(" ")}], ledger ${ledgerGen(def, mark.id)}, ground [${ground.join(" ")}]; loss line: ${loss[0] ?? "none"}`);
      test.assert(held.join() === "1", `the owner holds ${def.itemId} id ${mark.id} at gens [${held.join(" ")}], expected once at gen 1`);
      test.assert(ledgerGen(def, mark.id) === 1, `the ledger is at gen ${ledgerGen(def, mark.id)}, expected 1`);
      test.assert(ground.length === 0, `${ground.length} copies of ${def.itemId} id ${mark.id} still lie around`);
      // Which loss it reads as is a race between the engine's kill below the
      // floor and the 40-tick check: "fell into the Void" or "vanished from the ground".
      test.assert(loss.length === 1, `expected one loss return for id ${mark.id}, got: ${loss.join(" | ") || "none"}`);
    } finally {
      warnings.stop();
      if (entity.isValid) entity.remove();
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(400)
    .tag("andrew");
}

holderScenario("legendary_ufo_holder_chest_minecart", "ufo_chest_cart", "minecraft:chest_minecart", MINECART, WEB_SWORD);
holderScenario("legendary_ufo_holder_hopper_minecart", "ufo_hopper_cart", "minecraft:hopper_minecart", MINECART, ORBITAL_CANNON);
holderScenario("legendary_ufo_holder_armor_stand", "ufo_stand", "minecraft:armor_stand", ARMOR_STAND, SCYTHE_OF_CALAMITY);

// as15 §4 measured: a holder that goes into the Void itself. Same contract as
// the other probes — it passes when the measurement completed, and the answer
// is the "void probe RESULT" line. On BDS 1.26.51.1 both holders are removed
// about 20 ticks below the floor with no entityDie and no spill, so what they
// held is never seen by recovery: r016 §3 is what keeps the magnet out of it.
registerAsync("andrew", "probe_ufo_holder_void", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(OWNER_STAND, "ufo_void_owner", GameMode.Survival);
  const cart = test.spawn("minecraft:chest_minecart", HOLDER_AT);
  const stand = test.spawn("minecraft:armor_stand", { x: 5, y: 2, z: 1 });
  await test.idle(4);
  const warnings = captureWarnings();
  const events: string[] = [];
  const ids = new Set([cart.id, stand.id]);
  const dieSub = world.afterEvents.entityDie.subscribe((e) => {
    const dead: Entity | undefined = e.deadEntity;
    if (dead !== undefined && ids.has(dead.id)) events.push(`t${system.currentTick} die ${dead.typeId} (${e.damageSource.cause})`);
  });
  const removeSub = world.beforeEvents.entityRemove.subscribe((e) => {
    if (ids.has(e.removedEntity.id)) events.push(`t${system.currentTick} removed ${e.removedEntity.typeId}`);
  });
  const spawnSub = world.afterEvents.entitySpawn.subscribe((e) => {
    if (e.entity.isValid && e.entity.typeId === "minecraft:item") {
      events.push(`t${system.currentTick} item ${e.entity.getComponent("minecraft:item")?.itemStack.typeId} at ${fmt(e.entity.location)}`);
    }
  });
  try {
    const wsMark = state.makeMark("admin", owner);
    const scMark = state.makeMark("admin", owner);
    await MINECART.load(test, owner, cart, state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), wsMark));
    await ARMOR_STAND.load(test, owner, stand, state.markItem(SCYTHE_OF_CALAMITY, new ItemStack(SCYTHE_OF_CALAMITY.itemId, 1), scMark));
    const loaded = `cart ${MINECART.holds(cart, WEB_SWORD, wsMark.id).holds}, stand ${ARMOR_STAND.holds(stand, SCYTHE_OF_CALAMITY, scMark.id).holds}`;
    const floor = test.getDimension().heightRange.min;
    for (const e of [cart, stand]) e.teleport({ x: e.location.x, y: floor - 8, z: e.location.z });
    events.push(`t${system.currentTick} both teleported to y=${floor - 8}`);
    await test.idle(RETURN_DEADLINE_TICKS + 100);
    const ws = gensOf(WEB_SWORD, carried(owner), wsMark.id);
    const sc = gensOf(SCYTHE_OF_CALAMITY, carried(owner), scMark.id);
    const recovery = warnings.lines.filter((l) => l.includes("legendary recovery:") && (l.includes(wsMark.id) || l.includes(scMark.id)));
    log(
      `void probe RESULT loaded ${loaded}; cart ${cart.isValid ? "still there" : "gone"}, stand ${stand.isValid ? "still there" : "gone"}; ` +
        `owner holds Web Sword gens [${ws.join(" ")}], Scythe gens [${sc.join(" ")}]; events: ${events.join(" | ")}; recovery: ${recovery.join(" | ") || "none"}`
    );
  } finally {
    warnings.stop();
    world.afterEvents.entityDie.unsubscribe(dieSub);
    world.beforeEvents.entityRemove.unsubscribe(removeSub);
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    for (const e of [cart, stand]) if (e.isValid) e.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(500)
  .tag("andrew");
