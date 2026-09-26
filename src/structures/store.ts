// Key/value persistence under the structure registry. The engine binding takes
// the world as an argument instead of importing it, so node tests run the same
// code over MemoryStore with no @minecraft/server stub.

/** strf-p006 Q8: one dynamic property holds at most 32 767 characters. */
export const KEY_CHAR_LIMIT = 32767;

/** Split point for a long value; 80 % of the limit, as L0-strf-e002 prescribes. */
export const PART_CHARS = Math.floor(KEY_CHAR_LIMIT * 0.8);

export interface KeyValueStore {
  get(key: string): string | undefined;
  set(key: string, value: string | undefined): void;
  keys(): string[];
  /** Bytes the backing store reports, or undefined when it cannot measure. */
  totalBytes(): number | undefined;
}

/** The slice of `World` the store uses; `world` satisfies it structurally. */
export interface DynamicPropertyHost {
  getDynamicProperty(key: string): unknown;
  setDynamicProperty(key: string, value?: string): void;
  getDynamicPropertyIds(): string[];
  getDynamicPropertyTotalByteCount(): number;
}

export class DynamicPropertyStore implements KeyValueStore {
  constructor(private readonly host: DynamicPropertyHost) {}

  get(key: string): string | undefined {
    const v = this.host.getDynamicProperty(key);
    return typeof v === "string" ? v : undefined;
  }

  set(key: string, value: string | undefined): void {
    if (value !== undefined && value.length > KEY_CHAR_LIMIT) {
      throw new Error(`store: ${key} is ${value.length} chars, over the ${KEY_CHAR_LIMIT} per-key limit`);
    }
    this.host.setDynamicProperty(key, value);
  }

  keys(): string[] {
    return this.host.getDynamicPropertyIds();
  }

  totalBytes(): number {
    return this.host.getDynamicPropertyTotalByteCount();
  }
}

export class MemoryStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  writes = 0;

  get(key: string): string | undefined {
    return this.data.get(key);
  }

  set(key: string, value: string | undefined): void {
    if (value !== undefined && value.length > KEY_CHAR_LIMIT) {
      throw new Error(`store: ${key} is ${value.length} chars, over the ${KEY_CHAR_LIMIT} per-key limit`);
    }
    this.writes++;
    if (value === undefined) this.data.delete(key);
    else this.data.set(key, value);
  }

  keys(): string[] {
    return [...this.data.keys()];
  }

  totalBytes(): undefined {
    return undefined;
  }
}

/** Continuation parts of a long value live at `<key>:1`, `<key>:2`, … */
const partKey = (key: string, n: number): string => `${key}:${n}`;

/**
 * Write a value of any length. A value over PART_CHARS becomes
 * `#<parts>|<first part>` plus continuation keys; the registry's JSON always
 * starts with "{", so the "#" header cannot be mistaken for a short value.
 * Stale continuation keys from a longer earlier value are removed.
 */
export function writeLong(store: KeyValueStore, key: string, value: string | undefined): void {
  const previous = partCount(store.get(key));
  if (value === undefined) {
    store.set(key, undefined);
    for (let n = 1; n < previous; n++) store.set(partKey(key, n), undefined);
    return;
  }
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += PART_CHARS) parts.push(value.slice(i, i + PART_CHARS));
  if (parts.length <= 1) {
    store.set(key, value);
  } else {
    // Continuations first: a reader that sees the new header must find its parts.
    for (let n = 1; n < parts.length; n++) store.set(partKey(key, n), parts[n]);
    store.set(key, `#${parts.length}|${parts[0]}`);
  }
  for (let n = Math.max(parts.length, 1); n < previous; n++) store.set(partKey(key, n), undefined);
}

export function readLong(store: KeyValueStore, key: string): string | undefined {
  const head = store.get(key);
  if (head === undefined || !head.startsWith("#")) return head;
  const bar = head.indexOf("|");
  const count = Number(head.slice(1, bar));
  let out = head.slice(bar + 1);
  for (let n = 1; n < count; n++) {
    const part = store.get(partKey(key, n));
    if (part === undefined) throw new Error(`store: ${key} is missing part ${n} of ${count}`);
    out += part;
  }
  return out;
}

function partCount(head: string | undefined): number {
  if (head === undefined) return 0;
  if (!head.startsWith("#")) return 1;
  return Number(head.slice(1, head.indexOf("|")));
}
