// Evaluated-chunk bitset of one 32×32-chunk region, row-major (L0-strf-e002).
// An optimisation, not a correctness guard (L0-strf-d001).

export const REGION_CHUNKS = 32;
export const REGION_BITS = REGION_CHUNKS * REGION_CHUNKS;
const BYTES = REGION_BITS / 8;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Floor modulo: chunk -1 is local 31 of region -1, not local -1. */
const mod = (n: number, m: number): number => ((n % m) + m) % m;

export const regionOf = (chunk: number): number => Math.floor(chunk / REGION_CHUNKS);

export const bitIndex = (cx: number, cz: number): number =>
  mod(cz, REGION_CHUNKS) * REGION_CHUNKS + mod(cx, REGION_CHUNKS);

// The BDS script sandbox has no Buffer, and btoa/atob are not part of the
// documented @minecraft/server surface, so base64 is done by hand.
function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? ALPHABET[n & 63] : "=";
  }
  return out;
}

function fromBase64(text: string, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let j = 0;
  for (let i = 0; i < text.length; i += 4) {
    let n = 0;
    for (let k = 0; k < 4; k++) {
      const ch = text[i + k];
      const v = ch === undefined || ch === "=" ? 0 : ALPHABET.indexOf(ch);
      if (v < 0) throw new Error(`bitset: bad base64 character "${ch}"`);
      n = (n << 6) | v;
    }
    for (const byte of [(n >> 16) & 255, (n >> 8) & 255, n & 255]) {
      if (j < length) bytes[j++] = byte;
    }
  }
  return bytes;
}

export class ChunkBitset {
  private readonly bytes: Uint8Array;

  constructor(bytes?: Uint8Array) {
    this.bytes = bytes ?? new Uint8Array(BYTES);
  }

  static decode(text: string | undefined): ChunkBitset {
    return new ChunkBitset(text === undefined || text === "" ? undefined : fromBase64(text, BYTES));
  }

  /** Empty string for an all-zero set: most shards hold records long before bits. */
  encode(): string {
    return this.count() === 0 ? "" : toBase64(this.bytes);
  }

  has(cx: number, cz: number): boolean {
    const i = bitIndex(cx, cz);
    return (this.bytes[i >> 3] & (1 << (i & 7))) !== 0;
  }

  set(cx: number, cz: number): void {
    const i = bitIndex(cx, cz);
    this.bytes[i >> 3] |= 1 << (i & 7);
  }

  count(): number {
    let n = 0;
    for (const byte of this.bytes) {
      for (let b = byte; b !== 0; b &= b - 1) n++;
    }
    return n;
  }
}
