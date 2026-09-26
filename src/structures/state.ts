// Init-state machine of a structure instance (L0-strf-r008). Pure: no engine
// calls, so node tests bundle it without a @minecraft/server stub.

export type InitState = "planned" | "placed" | "looted" | "guarded" | "done" | "failed";

/** One-letter codes stored in the registry; `planned`/`placed` differ by case. */
export type StateCode = "p" | "P" | "l" | "g" | "d" | "f";

export type InitStep = "place" | "loot" | "guard" | "finish";

export const INIT_ORDER: readonly InitState[] = ["planned", "placed", "looted", "guarded", "done"];

/** Each step runs only while the record is in exactly this state. */
export const STEP_FROM: Readonly<Record<InitStep, InitState>> = {
  place: "planned",
  loot: "placed",
  guard: "looted",
  finish: "guarded",
};

export const STEP_TO: Readonly<Record<InitStep, InitState>> = {
  place: "placed",
  loot: "looted",
  guard: "guarded",
  finish: "done",
};

const TO_CODE: Readonly<Record<InitState, StateCode>> = {
  planned: "p",
  placed: "P",
  looted: "l",
  guarded: "g",
  done: "d",
  failed: "f",
};

const FROM_CODE: Readonly<Record<StateCode, InitState>> = {
  p: "planned",
  P: "placed",
  l: "looted",
  g: "guarded",
  d: "done",
  f: "failed",
};

export const encodeState = (s: InitState): StateCode => TO_CODE[s];

export function decodeState(code: string): InitState {
  const s = FROM_CODE[code as StateCode];
  if (s === undefined) throw new Error(`unknown init state code "${code}"`);
  return s;
}

export const canRun = (state: InitState, step: InitStep): boolean => state === STEP_FROM[step];

/**
 * `failed` is reachable only before the guards exist: once `guarded` is set it
 * is never reset (§6), and failing a guarded instance would be such a reset.
 */
export const canFail = (state: InitState): boolean =>
  state === "planned" || state === "placed" || state === "looted";

/** True once the instance has passed through `guarded`, whatever came after. */
export const guardsSpawned = (state: InitState): boolean => state === "guarded" || state === "done";
