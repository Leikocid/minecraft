// Whose binding it is (spec v3 §7; C-45, L0-pear-ru01, L0-pear-ent2): a binding is honoured only for its binder, in the
// life it was made in. Every death of a player starts a new life epoch, so all of that player's bindings — in the
// inventory, a chest, on the ground, in a stranger's hand — go void at once, with no search. Values in, values out: no
// engine call, so tests/pearl-owner.test.mjs bundles this file with esbuild.

import { type Binding, counterOf } from "./bind-rules";

/** The player using a rod: `Player.id` and the life epoch read from `andrew:life_epoch` (missing = 0). */
export interface Holder {
  id: string;
  epoch: number;
}

/**
 * What a bound rod means to the player using it:
 * - `honoured`: the binder, in the life the binding was made in — the use is a trip;
 * - `unbound`: no whole record on the rod;
 * - `foreign`: somebody else's binding — the rod is unbound for this holder, the use is a vanilla cast;
 * - `past-life`: the binder after a death — the same as foreign.
 */
export type Honour = "honoured" | "unbound" | "foreign" | "past-life";

export function honourOf(binding: Binding | undefined, holder: Holder): Honour {
  if (binding === undefined) return "unbound";
  if (binding.owner !== holder.id) return "foreign";
  if (binding.epoch !== holder.epoch) return "past-life";
  return "honoured";
}

export function isHonoured(binding: Binding | undefined, holder: Holder): boolean {
  return honourOf(binding, holder) === "honoured";
}

/** The epoch a death writes: one past the stored one, read the way a binding reads it (bind.ts `lifeEpochOf`). */
export function nextLifeEpoch(stored: unknown): number {
  return counterOf(stored) + 1;
}

/** A trip started in life `startEpoch` goes on only while the traveller is still in that life; a death aborts it. */
export function tripSurvives(startEpoch: number, currentEpoch: number): boolean {
  return startEpoch === currentEpoch;
}
