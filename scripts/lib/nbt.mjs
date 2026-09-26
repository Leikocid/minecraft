// Uncompressed little-endian NBT, the flavour Bedrock uses for .mcstructure
// and level.dat. A .mcstructure is a bare root tag; level.dat prefixes it with
// an 8-byte header (format version, payload length) that callers handle.
//
// Tags are { type, name, value } rather than plain objects so a
// parse -> edit -> serialise round trip preserves every type exactly: guessing
// a type (int vs short, byte vs bool) corrupts fields the engine reads back.
//
// Payload shapes by type:
//   BYTE/SHORT/INT/FLOAT/DOUBLE -> number      LONG -> bigint
//   STRING -> string                            BYTE_ARRAY -> Buffer
//   INT_ARRAY/LONG_ARRAY -> number[]/bigint[]   LIST -> { elementType, items }
//   COMPOUND -> [{ type, name, value }, ...]    (order is preserved)

export const TAG_END = 0;
export const TAG_BYTE = 1;
export const TAG_SHORT = 2;
export const TAG_INT = 3;
export const TAG_LONG = 4;
export const TAG_FLOAT = 5;
export const TAG_DOUBLE = 6;
export const TAG_BYTE_ARRAY = 7;
export const TAG_STRING = 8;
export const TAG_LIST = 9;
export const TAG_COMPOUND = 10;
export const TAG_INT_ARRAY = 11;
export const TAG_LONG_ARRAY = 12;

/**
 * Parse one named tag starting at `start`.
 * @returns {{ tag: { type: number, name: string, value: unknown }, end: number }}
 */
export function readNbt(buf, start = 0) {
  let off = start;

  const readString = () => {
    const len = buf.readUInt16LE(off);
    off += 2;
    const s = buf.toString('utf8', off, off + len);
    off += len;
    return s;
  };

  const readPayload = (type) => {
    switch (type) {
      case TAG_BYTE: return buf.readInt8(off++);
      case TAG_SHORT: { const v = buf.readInt16LE(off); off += 2; return v; }
      case TAG_INT: { const v = buf.readInt32LE(off); off += 4; return v; }
      case TAG_LONG: { const v = buf.readBigInt64LE(off); off += 8; return v; }
      case TAG_FLOAT: { const v = buf.readFloatLE(off); off += 4; return v; }
      case TAG_DOUBLE: { const v = buf.readDoubleLE(off); off += 8; return v; }
      case TAG_BYTE_ARRAY: {
        const n = buf.readInt32LE(off);
        off += 4;
        const v = Buffer.from(buf.subarray(off, off + n));
        off += n;
        return v;
      }
      case TAG_STRING: return readString();
      case TAG_LIST: {
        const elementType = buf.readUInt8(off++);
        const n = buf.readInt32LE(off);
        off += 4;
        const items = [];
        for (let i = 0; i < n; i++) items.push(readPayload(elementType));
        return { elementType, items };
      }
      case TAG_COMPOUND: {
        const entries = [];
        for (;;) {
          const t = buf.readUInt8(off++);
          if (t === TAG_END) break;
          entries.push({ type: t, name: readString(), value: readPayload(t) });
        }
        return entries;
      }
      case TAG_INT_ARRAY: {
        const n = buf.readInt32LE(off);
        off += 4;
        const items = [];
        for (let i = 0; i < n; i++) { items.push(buf.readInt32LE(off)); off += 4; }
        return items;
      }
      case TAG_LONG_ARRAY: {
        const n = buf.readInt32LE(off);
        off += 4;
        const items = [];
        for (let i = 0; i < n; i++) { items.push(buf.readBigInt64LE(off)); off += 8; }
        return items;
      }
      default: throw new Error(`unsupported NBT tag ${type} at offset ${off - 1}`);
    }
  };

  const type = buf.readUInt8(off++);
  const name = readString();
  const value = readPayload(type);
  return { tag: { type, name, value }, end: off };
}

/** Serialise one named tag. */
export function writeNbt(tag) {
  const chunks = [];

  const writeString = (s) => {
    const b = Buffer.from(s, 'utf8');
    if (b.length > 0xffff) throw new Error(`NBT string longer than 65535 bytes: ${s.slice(0, 40)}…`);
    const h = Buffer.alloc(2);
    h.writeUInt16LE(b.length);
    chunks.push(h, b);
  };

  const writeLength = (n) => {
    const h = Buffer.alloc(4);
    h.writeInt32LE(n);
    chunks.push(h);
  };

  const writePayload = (type, value) => {
    switch (type) {
      case TAG_BYTE: { const b = Buffer.alloc(1); b.writeInt8(value); chunks.push(b); break; }
      case TAG_SHORT: { const b = Buffer.alloc(2); b.writeInt16LE(value); chunks.push(b); break; }
      case TAG_INT: { const b = Buffer.alloc(4); b.writeInt32LE(value); chunks.push(b); break; }
      case TAG_LONG: { const b = Buffer.alloc(8); b.writeBigInt64LE(value); chunks.push(b); break; }
      case TAG_FLOAT: { const b = Buffer.alloc(4); b.writeFloatLE(value); chunks.push(b); break; }
      case TAG_DOUBLE: { const b = Buffer.alloc(8); b.writeDoubleLE(value); chunks.push(b); break; }
      case TAG_BYTE_ARRAY: writeLength(value.length); chunks.push(Buffer.from(value)); break;
      case TAG_STRING: writeString(value); break;
      case TAG_LIST: {
        // An empty list still carries an element type; the engine accepts END.
        chunks.push(Buffer.from([value.elementType]));
        writeLength(value.items.length);
        for (const item of value.items) writePayload(value.elementType, item);
        break;
      }
      case TAG_COMPOUND: {
        for (const entry of value) {
          chunks.push(Buffer.from([entry.type]));
          writeString(entry.name);
          writePayload(entry.type, entry.value);
        }
        chunks.push(Buffer.from([TAG_END]));
        break;
      }
      case TAG_INT_ARRAY: {
        const b = Buffer.alloc(4 + value.length * 4);
        b.writeInt32LE(value.length, 0);
        value.forEach((v, i) => b.writeInt32LE(v, 4 + i * 4));
        chunks.push(b);
        break;
      }
      case TAG_LONG_ARRAY: {
        const b = Buffer.alloc(4 + value.length * 8);
        b.writeInt32LE(value.length, 0);
        value.forEach((v, i) => b.writeBigInt64LE(v, 4 + i * 8));
        chunks.push(b);
        break;
      }
      default: throw new Error(`unsupported NBT tag ${type}`);
    }
  };

  chunks.push(Buffer.from([tag.type]));
  writeString(tag.name);
  writePayload(tag.type, tag.value);
  return Buffer.concat(chunks);
}

// Named-tag constructors, so builders read as data rather than as { type: 3 }.
export const byte = (name, value) => ({ type: TAG_BYTE, name, value });
export const short = (name, value) => ({ type: TAG_SHORT, name, value });
export const int = (name, value) => ({ type: TAG_INT, name, value });
export const long = (name, value) => ({ type: TAG_LONG, name, value: BigInt(value) });
export const float = (name, value) => ({ type: TAG_FLOAT, name, value });
export const double = (name, value) => ({ type: TAG_DOUBLE, name, value });
export const byteArray = (name, value) => ({ type: TAG_BYTE_ARRAY, name, value: Buffer.from(value) });
export const string = (name, value) => ({ type: TAG_STRING, name, value });
export const list = (name, elementType, items) => ({ type: TAG_LIST, name, value: { elementType, items } });
export const compound = (name, entries) => ({ type: TAG_COMPOUND, name, value: entries });
export const intArray = (name, value) => ({ type: TAG_INT_ARRAY, name, value });

/** Look up a child of a compound tag (or a compound payload) by name. */
export function child(tagOrEntries, name) {
  const entries = Array.isArray(tagOrEntries) ? tagOrEntries : tagOrEntries.value;
  return entries.find((e) => e.name === name);
}

/**
 * Collapse a tag tree to plain JS for assertions and inspection. Lossy: tag
 * types are dropped, so never write the result back.
 */
export function toPlain(tag) {
  const plainPayload = (type, value) => {
    switch (type) {
      case TAG_COMPOUND:
        return Object.fromEntries(value.map((e) => [e.name, plainPayload(e.type, e.value)]));
      case TAG_LIST:
        return value.items.map((v) => plainPayload(value.elementType, v));
      case TAG_BYTE_ARRAY:
        return [...value];
      default:
        return value;
    }
  };
  return plainPayload(tag.type, tag.value);
}
