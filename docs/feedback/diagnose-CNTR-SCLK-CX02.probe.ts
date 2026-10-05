// CX-sclk-02 probe (L0-sclk-p001 Q5) on BDS 1.26.51.1: what a custom
// minecraft:shooter does on a release 1–40 ticks into the draw, how fast the
// arrow leaves at each draw, and what a script can read to tell an early
// release from a full one. Dev-only: docs/feedback/diagnose-CNTR-SCLK-CX02.repro.sh
// copies it into src/gametest/ and its items into packs/gametest/items/ for one run.

import { EnchantmentType, type Entity, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const SLOT = 0;
const AMMO_SLOT = 9;
const ARROW = "minecraft:arrow";
const HOLDS = [1, 2, 3, 5, 10, 15, 20, 24, 25, 26, 30, 40];
/** Held with no release: does max_draw_duration let go by itself? */
const AUTO_HOLD = 80;
const SETTLE = 8;

const log = (msg: string): void => console.warn(`[probe] SCX2 ${msg}`);
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const f2 = (n: number | undefined): string => (n === undefined ? "?" : n.toFixed(3));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

interface Variant {
  name: string;
  item: string;
  quickCharge?: number;
  /** Release ticks; HOLDS when absent. */
  holds?: readonly number[];
}

const VARIANTS: readonly Variant[] = [
  { name: "vanilla_bow", item: "minecraft:bow" },
  { name: "vanilla_crossbow", item: "minecraft:crossbow" },
  { name: "vanilla_crossbow_qc3", item: "minecraft:crossbow", quickCharge: 3 },
  { name: "cod", item: "andrew:probe_sx_cod" },
  { name: "cod_sp", item: "andrew:probe_sx_cod_sp" },
  { name: "bow_sp", item: "andrew:probe_sx_bow_sp" },
  { name: "bow", item: "andrew:probe_sx_bow" },
  { name: "cod_sp_ud25", item: "andrew:probe_sx_cod_sp_ud25" },
  { name: "cod_sp_qc3", item: "andrew:probe_sx_cod_sp", quickCharge: 3 },
  // A native draw cut to the Quick Charge III time (0.5 s): does it still gate, and can a
  // script read the loading draw's length to hold a non-QC player to 25 ticks?
  { name: "cod_md05", item: "andrew:probe_sx_cod_md05", holds: [1, 2, 5, 8, 9, 10, 11, 15, 25] },
  { name: "cod_md05_qc3", item: "andrew:probe_sx_cod_md05", quickCharge: 3, holds: [1, 2, 5, 8, 9, 10, 11, 15, 25] },
  { name: "bow_sp_qc3", item: "andrew:probe_sx_bow_sp", quickCharge: 3, holds: [1, 2, 3, 5, 10, 15, 20, 25] },
];

interface ArrowSeen {
  dt: number;
  owner: string;
  v0: number;
  v1?: number;
  /** |position(+2) − position(+1)|: the speed a script can recover without trusting getVelocity at spawn. */
  d12?: number;
  /** What ended the arrow before the probe removed it at +2: a hit or an engine removal. */
  fate?: string;
  spawnTick: number;
}

interface Phase {
  t0: number;
  events: string[];
  arrows: ArrowSeen[];
}

function ammo(p: SimulatedPlayer): number {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) return -1;
  let n = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s?.typeId === ARROW) n += s.amount;
  }
  return n;
}

function show(ph: Phase): string {
  const arrows = ph.arrows.map((a) => `+${a.dt} v0=${f2(a.v0)} v1=${f2(a.v1)} d12=${f2(a.d12)} owner=${a.owner} fate=${a.fate ?? "flying"}`).join("; ");
  return `ev=[${ph.events.join(" ")}] arrows=${ph.arrows.length}[${arrows}]`;
}

function weapon(v: Variant): { stack: ItemStack; enchant: string } {
  const stack = new ItemStack(v.item, 1);
  if (v.quickCharge === undefined) return { stack, enchant: "none" };
  const ench = stack.getComponent("minecraft:enchantable");
  if (ench === undefined) return { stack, enchant: "no enchantable component" };
  const e = { type: new EnchantmentType("quick_charge"), level: v.quickCharge };
  try {
    if (!ench.canAddEnchantment(e)) return { stack, enchant: `quick_charge ${v.quickCharge} refused by canAddEnchantment` };
    ench.addEnchantment(e);
    return { stack, enchant: `quick_charge ${v.quickCharge} added` };
  } catch (err) {
    return { stack, enchant: `quick_charge threw ${errText(err)}` };
  }
}

for (const v of VARIANTS) {
  registerAsync("andrew", `probe_sclk_cx02_${v.name}`, async (test: Test): Promise<void> => {
    // Relative y=1 is the platform's stone floor: a player spawned there suffocates by tick ~210.
    const p = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 3 }, `scx2_${v.name}`, GameMode.Survival);
    let cur: Phase | undefined;
    const tracked: Entity[] = [];
    const onItem =
      (kind: string) =>
      (e: { source: { id: string }; itemStack?: ItemStack; useDuration?: number }): void => {
        if (cur === undefined || e.source.id !== p.id) return;
        const ud = e.useDuration === undefined ? "" : ` ud=${e.useDuration}`;
        cur.events.push(`${kind}@+${system.currentTick - cur.t0}${ud}`);
      };
    const startSub = world.afterEvents.itemStartUse.subscribe(onItem("start"));
    const releaseSub = world.afterEvents.itemReleaseUse.subscribe(onItem("release"));
    const stopSub = world.afterEvents.itemStopUse.subscribe(onItem("stop"));
    const completeSub = world.afterEvents.itemCompleteUse.subscribe(onItem("complete"));
    const useSub = world.afterEvents.itemUse.subscribe(onItem("use"));
    const spawnSub = world.afterEvents.entitySpawn.subscribe((e) => {
      const a = e.entity;
      if (cur === undefined || !a.isValid || a.typeId !== ARROW) return;
      const owner = a.getComponent("minecraft:projectile")?.owner;
      const near = len({ x: a.location.x - p.location.x, y: a.location.y - p.location.y, z: a.location.z - p.location.z }) < 4;
      if (owner?.id !== p.id && !near) return;
      const seen: ArrowSeen = {
        dt: system.currentTick - cur.t0,
        owner: owner === undefined ? "undefined" : owner.id === p.id ? "self" : owner.typeId,
        v0: len(a.getVelocity()),
        spawnTick: system.currentTick,
      };
      cur.arrows.push(seen);
      tracked.push(a);
      fates.set(a.id, seen);
      let p1: Vector3 | undefined;
      system.runTimeout(() => {
        if (!a.isValid) return;
        seen.v1 = len(a.getVelocity());
        p1 = { ...a.location };
      }, 1);
      system.runTimeout(() => {
        if (!a.isValid || p1 === undefined) return;
        const p2 = a.location;
        seen.d12 = len({ x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z });
        fates.delete(a.id);
        a.remove();
      }, 2);
    });
    const fates = new Map<string, ArrowSeen>();
    const fate = (id: string, what: string): void => {
      const seen = fates.get(id);
      if (seen !== undefined && seen.fate === undefined) seen.fate = `${what}@+${system.currentTick - seen.spawnTick}`;
    };
    const hitBlockSub = world.afterEvents.projectileHitBlock.subscribe((e) => fate(e.projectile.id, `hit-block ${e.getBlockHit().block.typeId}`));
    const hitEntitySub = world.afterEvents.projectileHitEntity.subscribe((e) => {
      const hit = e.getEntityHit().entity;
      fate(e.projectile.id, `hit-entity ${hit?.id === p.id ? "shooter" : (hit?.typeId ?? "?")}`);
    });
    const removeSub = world.afterEvents.entityRemove.subscribe((e) => fate(e.removedEntityId, "removed"));
    const harm: string[] = [];
    const hurtSub = world.afterEvents.entityHurt.subscribe((e) => {
      if (e.hurtEntity.id === p.id) harm.push(`hurt ${e.damageSource.cause} ${e.damage.toFixed(1)} by ${e.damageSource.damagingEntity?.typeId ?? "-"} @${system.currentTick}`);
    });
    const dieSub = world.afterEvents.entityDie.subscribe((e) => {
      if (e.deadEntity.id === p.id) harm.push(`DIED ${e.damageSource.cause} by ${e.damageSource.damagingEntity?.typeId ?? "-"} @${system.currentTick}`);
    });
    const begin = (): Phase => {
      cur = { t0: system.currentTick, events: [], arrows: [] };
      return cur;
    };
    // A use right after a one-tick use returns false and starts nothing (seen on all nine
    // variants); a second call one tick later starts it. t0 is the call that started.
    const startUse = async (ph: Phase): Promise<number> => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        ph.t0 = system.currentTick;
        if (p.useItemInSlot(SLOT)) return attempt;
        await test.idle(1);
      }
      return 0;
    };
    const state = (): string => `hp=${p.getComponent("minecraft:health")?.currentValue ?? "?"} gm=${p.getGameMode()} y=${(p.location.y - test.worldLocation({ x: 0, y: 2, z: 0 }).y).toFixed(2)}`;
    try {
      const { stack, enchant } = weapon(v);
      p.setItem(stack, SLOT, true);
      p.getComponent("minecraft:inventory")?.container?.setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
      await test.idle(10);
      p.lookAtLocation(test.worldLocation({ x: 60, y: 3.62, z: 3.5 }));
      await test.idle(2);
      log(`${v.name} item=${v.item} enchant=${enchant} ammo=${ammo(p)} ${state()}`);

      const fired: string[] = [];
      for (const hold of [...(v.holds ?? HOLDS), AUTO_HOLD]) {
        const a0 = ammo(p);
        const harmed = harm.length;
        const shot = begin();
        const started = await startUse(shot);
        await test.idle(hold);
        const inUse = p.stopUsingItem() !== undefined;
        await test.idle(1);
        const a1now = ammo(p);
        await test.idle(SETTLE - 1);
        const a1 = ammo(p);
        // A tap after every shot: a crossbow-like item fires a loaded charge on it.
        const tap = begin();
        const tapStarted = await startUse(tap);
        await test.idle(1);
        p.stopUsingItem();
        await test.idle(SETTLE);
        cur = undefined;
        const a2 = ammo(p);
        log(
          `${v.name} hold=${hold === AUTO_HOLD ? `${hold}(no release)` : hold} startedOnTry=${started} stopFoundInUse=${inUse} ` +
            `shot: ${show(shot)} ammo ${a0}->${a1now}(+1)->${a1} | tap: startedOnTry=${tapStarted} ${show(tap)} ammo ${a1}->${a2} | ${state()}` +
            (harm.length > harmed ? ` HARM=[${harm.slice(harmed).join("; ")}]` : "")
        );
        fired.push(`${hold}:${shot.arrows.length}${shot.arrows.length > 0 ? `@${f2(shot.arrows[0].v0)}` : ""}+tap${tap.arrows.length}`);
        if (a2 < 1) {
          p.getComponent("minecraft:inventory")?.container?.setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
          log(`${v.name} refilled ammo after hold=${hold}`);
        }
        if (p.getComponent("minecraft:inventory")?.container?.getItem(SLOT)?.typeId !== v.item) {
          log(`${v.name} the weapon left slot ${SLOT} after hold=${hold}: re-equipped`);
          p.setItem(weapon(v).stack, SLOT, true);
        }
      }
      log(`${v.name} RESULT hold:arrows@v0+tap -> ${fired.join(" ")} | harm total ${harm.length}: [${harm.join("; ")}]`);
      test.assert(p.isValid, `${v.name}: the shooter is gone`);
    } finally {
      cur = undefined;
      world.afterEvents.itemStartUse.unsubscribe(startSub);
      world.afterEvents.itemReleaseUse.unsubscribe(releaseSub);
      world.afterEvents.itemStopUse.unsubscribe(stopSub);
      world.afterEvents.itemCompleteUse.unsubscribe(completeSub);
      world.afterEvents.itemUse.unsubscribe(useSub);
      world.afterEvents.entitySpawn.unsubscribe(spawnSub);
      world.afterEvents.projectileHitBlock.unsubscribe(hitBlockSub);
      world.afterEvents.projectileHitEntity.unsubscribe(hitEntitySub);
      world.afterEvents.entityRemove.unsubscribe(removeSub);
      world.afterEvents.entityHurt.unsubscribe(hurtSub);
      world.afterEvents.entityDie.unsubscribe(dieSub);
      for (const a of tracked) if (a.isValid) a.remove();
      if (p.isValid) test.removeSimulatedPlayer(p);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(2400)
    .tag("andrew");
}
