// The Underwater Bow's armed charge (spec v3 §1; L0-xcx33, L0-xasm38, L0-uwbw-parm, L0-uwbw-phit, R-uwbw-001,
// R-uwbw-003). Sneak + the start of Use arms it; the first arrow fired after that carries it; a successful hit on a
// living target is set to exactly 14 before armour (storm/damage.ts setHit), plays one strike with no damage, lights
// Super Fire for 5 s (fire.ts) and only then starts the 30 s cooldown. A miss costs nothing. Rules without the engine:
// ability-rules.ts. Why the gesture is this one and what is not covered: README.md next to this file.

import {
  type Dimension,
  type Entity,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityHurtAfterEvent,
  type EntityHurtBeforeEvent,
  type EntityRemoveAfterEvent,
  type EntitySpawnAfterEvent,
  EquipmentSlot,
  GameMode,
  type ItemStack,
  Player,
  type ProjectileHitBlockAfterEvent,
  type ProjectileHitEntityAfterEvent,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { remainingMs, startCooldown } from "../legendary/cooldown";
import { heldLegendaries } from "../legendary/hands";
import { hudMessage, registerArmedState } from "../legendary/hud";
import { UNDERWATER_BOW } from "../legendary/registry";
import { setHit } from "../storm/damage";
import { playStrikes } from "../storm/visuals";
import {
  ARMED_DAMAGE,
  type ArmDecision,
  ArmedShotBook,
  type ChargeState,
  type HitSkip,
  LANDING_TICKS,
  LandingBook,
  REFUSAL_HINT_TICKS,
  type SetPlanKind,
  armDecision,
  armedHitSkip,
  armedKey,
  chargeState,
  isCharge,
  landedHit,
} from "./ability-rules";
import { SUPER_FIRE_SECONDS, igniteSuperFire } from "./fire";

export { ARMED_COOLDOWN_TICKS, ARMED_DAMAGE, type ArmDecision, type ChargeState } from "./ability-rules";

const ARROW_ID = "minecraft:arrow";
const ABILITY = UNDERWATER_BOW.abilityKey;
/** One strike per successful hit, on the visuals interval's next step (as the trident's). */
const STRIKE_DELAYS: readonly number[] = [0];
const ARM_SOUND = "random.orb";

export type MissReason = HitSkip | "block" | "entity" | "removed" | "vanished" | "expired" | "not-landed" | "refused";

export type UbowAbilityReport =
  | { type: "press"; tick: number; playerId: string; via: "use" | "block"; decision: ArmDecision; sneaking: boolean; cooldownMs: number }
  | { type: "mark"; tick: number; playerId: string; arrowId: string }
  | { type: "hit"; tick: number; playerId: string; targetId: string; arrowId: string; skip: HitSkip | undefined; plan: SetPlanKind; read: number; goal: number; set: number | undefined }
  | {
      type: "spent";
      tick: number;
      playerId: string;
      targetId: string;
      arrowId: string;
      plan: SetPlanKind;
      /** The after-event's damage; undefined when a lethal hit was settled without one. */
      landed: number | undefined;
      cooldown: boolean;
      superFire: boolean;
      strikes: number;
    }
  | { type: "miss"; tick: number; playerId: string; arrowId: string; why: MissReason };

export type UbowAbilityObserver = (report: UbowAbilityReport) => void;

/** A rewritten armed hit waiting for its after-event. */
interface Landing {
  arrowId: string;
  shooterId: string;
  shooter: Player | undefined;
  target: Entity;
  targetId: string;
  plan: SetPlanKind;
  dimension: Dimension;
  foot: Vector3;
  flash: Vector3;
}

/** The world ledger as read so far: an absent entry is read from the world on first use. */
const charges = new Map<string, boolean>();
const shots = new ArmedShotBook();
const arrows = new Map<string, Entity>();
const landing = new LandingBook<Landing>();
const observers: UbowAbilityObserver[] = [];
const handledAt = new Map<string, number>();
const hintedAt = new Map<string, number>();
let registered = false;

const log = (msg: string): void => console.warn(`[andrew] ub ability: ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined ? "-" : n.toFixed(2));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function observeUbowAbility(observer: UbowAbilityObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

function emit(report: UbowAbilityReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`observer threw for ${report.type}: ${errText(err)}`);
    }
  }
}

/** Whether the player with this id holds a charge. Readable in before-events. */
export function ubowChargeOf(playerId: string): boolean {
  const cached = charges.get(playerId);
  if (cached !== undefined) return cached;
  let on = false;
  try {
    on = isCharge(world.getDynamicProperty(armedKey(playerId)));
  } catch (err) {
    log(`charge of ${playerId} not read: ${errText(err)}`);
    return false;
  }
  charges.set(playerId, on);
  return on;
}

/** Writes the world ledger. Not from a before-event: callers there defer it. */
function persist(playerId: string, on: boolean): void {
  charges.set(playerId, on);
  world.setDynamicProperty(armedKey(playerId), on ? true : undefined);
}

/** Drops a charge without a hit: the operator's and the scenarios' clean-up, never a gameplay path. */
export function dropUbowCharge(playerId: string): void {
  persist(playerId, false);
}

export function ubowChargeState(player: Player): ChargeState {
  return chargeState(ubowChargeOf(player.id), remainingMs(player, ABILITY));
}

/** A live copy in the main hand: the bow draws from there only, and a stale copy is no bow (R-lgnd-005). */
function bowInMainHand(player: Player): boolean {
  return heldLegendaries(player).some((held) => held.def === UNDERWATER_BOW && held.slot === EquipmentSlot.Mainhand);
}

/** Has health, is not inanimate (an armour stand has health 6) and is not a Creative or Spectator player. */
function living(entity: Entity): boolean {
  try {
    if (entity instanceof Player) {
      const mode = entity.getGameMode();
      if (mode === GameMode.Creative || mode === GameMode.Spectator) return false;
    }
    return entity.getComponent(EntityComponentTypes.Health) !== undefined && !entity.matches({ families: ["inanimate"] });
  } catch {
    return false;
  }
}

/** One press can raise more than one before-event in a tick; the second finds the tick claimed. */
function claimTick(playerId: string, now: number): boolean {
  if (handledAt.get(playerId) === now) return false;
  handledAt.set(playerId, now);
  return true;
}

/**
 * The gesture (L0-xcx33 default): a Use of the bow while sneaking. Read in the press's before-event, hands and sneak
 * live, so no after-handler of another module has moved anything yet; the draw is never cancelled. The cache takes
 * the charge at once, so even a one-tick draw's arrow carries it; the ledger write waits for system.run.
 */
function onPress(player: Player | undefined, stack: ItemStack | undefined, via: "use" | "block"): void {
  if (player === undefined || stack?.typeId !== UNDERWATER_BOW.itemId) return;
  const now = system.currentTick;
  let playerId: string;
  let decision: ArmDecision;
  let sneaking = false;
  let cooldownMs = 0;
  try {
    playerId = player.id;
    if (!claimTick(playerId, now)) return;
    sneaking = player.isSneaking;
    cooldownMs = remainingMs(player, ABILITY);
    decision = armDecision({ bowInMainHand: bowInMainHand(player), sneaking, armed: ubowChargeOf(playerId), cooldownMs });
  } catch (err) {
    log(`press not read: ${errText(err)}`);
    return;
  }
  if (decision === "not-bow") return;
  emit({ type: "press", tick: now, playerId, via, decision, sneaking, cooldownMs });
  if (decision === "arm") {
    charges.set(playerId, true);
    system.run(() => {
      try {
        persist(playerId, true);
        if (player.isValid) player.playSound(ARM_SOUND, { pitch: 0.6, volume: 0.8 });
      } catch (err) {
        log(`charge of ${playerId} not saved: ${errText(err)}`);
      }
    });
    log(`${player.name} armed (${via})`);
  } else if (decision === "refused") {
    const last = hintedAt.get(playerId);
    if (last !== undefined && now - last < REFUSAL_HINT_TICKS) return;
    hintedAt.set(playerId, now);
    log(`${player.name} refused: ${Math.ceil(cooldownMs / 1000)} s of cooldown left`);
    system.run(() => {
      try {
        const message = player.isValid ? hudMessage(player) : undefined;
        if (message !== undefined) player.onScreenDisplay.setActionBar(message);
      } catch {
        // the HUD loop shows the cooldown on its next pass anyway
      }
    });
  }
}

function dropShot(arrowId: string): string | undefined {
  arrows.delete(arrowId);
  return shots.resolve(arrowId);
}

function miss(arrowId: string, why: MissReason): void {
  const shooterId = dropShot(arrowId);
  if (shooterId === undefined) return;
  log(`armed arrow ${arrowId} of ${shooterId} missed (${why}): the charge stays`);
  emit({ type: "miss", tick: system.currentTick, playerId: shooterId, arrowId, why });
}

const landingFor = (arrowId: string): boolean => landing.has((rec) => rec.arrowId === arrowId);

/** Settles an armed arrow that hit something or went away: unless a landing still waits for it, it missed. */
function settleArrow(arrowId: string, why: MissReason): void {
  if (shots.shooterOf(arrowId) === undefined || landingFor(arrowId)) return;
  miss(arrowId, why);
}

function sweep(now: number): void {
  for (const arrowId of shots.sweep(now)) {
    arrows.delete(arrowId);
    log(`armed arrow ${arrowId} expired unresolved: the charge stays`);
  }
}

/**
 * The arrow spawns in the release tick, its owner and the owner's main hand readable (probe-ubow row 1). An armed
 * arrow that left the loaded world without a hit event frees its shooter here, at their next shot.
 */
function onSpawn(event: EntitySpawnAfterEvent): void {
  const arrow = event.entity;
  try {
    if (!arrow.isValid || arrow.typeId !== ARROW_ID) return;
    const owner = arrow.getComponent(EntityComponentTypes.Projectile)?.owner;
    if (!(owner instanceof Player) || !owner.isValid || !bowInMainHand(owner)) return;
    const now = system.currentTick;
    sweep(now);
    const pending = shots.pendingOf(owner.id);
    if (pending !== undefined && arrows.get(pending)?.isValid !== true && !landingFor(pending)) miss(pending, "vanished");
    if (!shots.marks(owner.id, ubowChargeOf(owner.id), now)) return;
    shots.mark(arrow.id, owner.id, now);
    arrows.set(arrow.id, arrow);
    log(`${owner.name}'s arrow ${arrow.id} carries the charge`);
    emit({ type: "mark", tick: now, playerId: owner.id, arrowId: arrow.id });
  } catch (err) {
    log(`arrow spawn not read: ${errText(err)}`);
  }
}

function onHurtBefore(event: EntityHurtBeforeEvent): void {
  if (shots.size === 0 || event.damageSource.cause !== EntityDamageCause.projectile) return;
  let arrowId: string | undefined;
  let flash: Vector3 | undefined;
  try {
    const projectile = event.damageSource.damagingProjectile;
    arrowId = projectile?.id;
    flash = projectile === undefined ? undefined : { ...projectile.location };
  } catch {
    return;
  }
  const shooterId = shots.shooterOf(arrowId);
  if (arrowId === undefined || shooterId === undefined) return;
  const target = event.hurtEntity;
  const now = system.currentTick;
  let targetId: string;
  try {
    targetId = target.id;
  } catch {
    return;
  }
  const read = event.damage;
  const skip = armedHitSkip({
    cause: event.damageSource.cause,
    armedShot: true,
    self: targetId === shooterId,
    living: () => living(target),
    cancelled: event.cancel,
    read,
  });
  if (skip !== undefined) {
    emit({ type: "hit", tick: now, playerId: shooterId, targetId, arrowId, skip, plan: "none", read, goal: 0, set: undefined });
    miss(arrowId, skip);
    return;
  }
  const set = setHit(event, ARMED_DAMAGE, { causes: [EntityDamageCause.projectile] });
  emit({ type: "hit", tick: now, playerId: shooterId, targetId, arrowId, skip: undefined, plan: set.plan, read, goal: set.goal, set: set.set });
  if (set.plan === "none") {
    miss(arrowId, "not-landed");
    return;
  }
  const damaging = event.damageSource.damagingEntity;
  let rec: Landing;
  try {
    const foot = { ...target.location };
    rec = {
      arrowId,
      shooterId,
      shooter: damaging instanceof Player && damaging.id === shooterId ? damaging : undefined,
      target,
      targetId,
      plan: set.plan,
      dimension: target.dimension,
      foot,
      flash: flash ?? foot,
    };
  } catch (err) {
    log(`armed hit on ${targetId} not recorded: ${errText(err)}`);
    miss(arrowId, "not-landed");
    return;
  }
  landing.expect(targetId, now, rec);
  system.runTimeout(() => settleLanding(rec), LANDING_TICKS + 1);
}

function onHurtAfter(event: EntityHurtAfterEvent): void {
  if (landing.size === 0 || event.damageSource.cause !== EntityDamageCause.projectile) return;
  let targetId: string;
  try {
    targetId = event.hurtEntity.id;
  } catch {
    return;
  }
  const rec = landing.take(targetId, system.currentTick);
  if (rec === undefined) return;
  if (landedHit(rec.plan, event.damage)) spend(rec, event.damage);
  else miss(rec.arrowId, "not-landed");
}

/** A landing whose after-event never came: a lethal hit still counts (its overkill runs regardless), any other missed. */
function settleLanding(rec: Landing): void {
  if (!landing.takeIf(rec.targetId, rec)) return;
  if (landedHit(rec.plan, undefined)) spend(rec, undefined);
  else miss(rec.arrowId, "not-landed");
}

function shooterOf(rec: Landing): Player | undefined {
  if (rec.shooter?.isValid === true) return rec.shooter;
  try {
    const found = world.getEntity(rec.shooterId);
    return found instanceof Player && found.isValid ? found : undefined;
  } catch {
    return undefined;
  }
}

/**
 * R-uwbw-001's successful hit, in one synchronous block (L0-uwbw-phit): the charge is spent, the cooldown starts, one
 * strike is drawn and Super Fire is lit. A shooter who left the game keeps no cooldown: it lives on the player.
 */
function spend(rec: Landing, landed: number | undefined): void {
  dropShot(rec.arrowId);
  const now = system.currentTick;
  let cooldown = false;
  let superFire = false;
  try {
    persist(rec.shooterId, false);
  } catch (err) {
    charges.set(rec.shooterId, false);
    log(`spent charge of ${rec.shooterId} not saved: ${errText(err)}`);
  }
  const shooter = shooterOf(rec);
  try {
    if (shooter !== undefined) {
      startCooldown(shooter, ABILITY);
      cooldown = true;
    }
  } catch (err) {
    log(`cooldown of ${rec.shooterId} not started: ${errText(err)}`);
  }
  playStrikes(rec.dimension, rec.foot, rec.flash, STRIKE_DELAYS);
  try {
    superFire = igniteSuperFire(rec.target, SUPER_FIRE_SECONDS);
  } catch (err) {
    log(`super fire on ${rec.targetId} refused: ${errText(err)}`);
  }
  log(
    `armed hit by ${shooter?.name ?? rec.shooterId} on ${rec.targetId} (${rec.plan}, landed ${f2(landed)}): charge spent, ` +
      `cooldown ${cooldown ? "started" : "not started (shooter gone)"}, 1 strike, super fire ${superFire ? "lit" : "not lit"}`
  );
  emit({ type: "spent", tick: now, playerId: rec.shooterId, targetId: rec.targetId, arrowId: rec.arrowId, plan: rec.plan, landed, cooldown, superFire, strikes: STRIKE_DELAYS.length });
}

/**
 * A raised shield takes the arrow with no hurt event at all, while projectileHitEntity still comes (probe-ubow row 6):
 * this event alone never spends the charge, it only settles an arrow no landing claimed.
 */
function onHitEntity(event: ProjectileHitEntityAfterEvent): void {
  if (shots.size === 0) return;
  let arrowId: string;
  try {
    arrowId = event.projectile.id;
  } catch {
    return;
  }
  if (shots.shooterOf(arrowId) === undefined) return;
  system.runTimeout(() => settleArrow(arrowId, "entity"), LANDING_TICKS + 1);
}

function onHitBlock(event: ProjectileHitBlockAfterEvent): void {
  if (shots.size === 0) return;
  try {
    settleArrow(event.projectile.id, "block");
  } catch {
    // swept by age or at the shooter's next shot instead
  }
}

function onRemove(event: EntityRemoveAfterEvent): void {
  if (shots.size === 0 || event.typeId !== ARROW_ID) return;
  const arrowId = event.removedEntityId;
  if (shots.shooterOf(arrowId) === undefined) return;
  system.runTimeout(() => settleArrow(arrowId, "removed"), LANDING_TICKS + 1);
}

/** Subscribes the charge once and hands the HUD its third state. Must run at script load. */
export function registerUbowAbility(): void {
  if (registered) return;
  registered = true;
  registerArmedState(ABILITY, (player) => ubowChargeOf(player.id));
  // A SimulatedPlayer reaches a pack without @minecraft/server-gametest as undefined.
  world.beforeEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    onPress(player, event.itemStack, "use");
  });
  // A Use aimed at a block raises no itemUse for a custom item, only this and itemStartUseOn (CNTR-XCX14).
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const player: Player | undefined = event.player;
    onPress(player, event.itemStack, "block");
  });
  world.afterEvents.entitySpawn.subscribe(onSpawn);
  world.beforeEvents.entityHurt.subscribe(onHurtBefore);
  world.afterEvents.entityHurt.subscribe(onHurtAfter);
  world.afterEvents.projectileHitEntity.subscribe(onHitEntity);
  world.afterEvents.projectileHitBlock.subscribe(onHitBlock);
  world.afterEvents.entityRemove.subscribe(onRemove);
  console.warn("[andrew] underwater bow ability armed (sneak + Use arms; a hit spends: 14 before armour, 1 strike, super fire, 30 s)");
}
