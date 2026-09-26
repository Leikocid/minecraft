// scripts/lib/nbt.mjs — little-endian NBT, checked against hand-written bytes
// (so a reader and writer that agree on a wrong byte order cannot both pass)
// and by a full round trip over every supported tag.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TAG_COMPOUND,
  TAG_INT,
  TAG_LIST,
  TAG_STRING,
  byte,
  byteArray,
  compound,
  double,
  float,
  int,
  intArray,
  list,
  long,
  readNbt,
  short,
  string,
  toPlain,
  writeNbt,
} from '../scripts/lib/nbt.mjs';

test('writes little-endian bytes exactly', () => {
  const buf = writeNbt(compound('', [int('a', 0x01020304), short('b', -2), string('s', 'é')]));
  const expected = Buffer.from([
    0x0a, 0x00, 0x00, // compound, name ""
    0x03, 0x01, 0x00, 0x61, 0x04, 0x03, 0x02, 0x01, // int "a" = 0x01020304
    0x02, 0x01, 0x00, 0x62, 0xfe, 0xff, // short "b" = -2
    0x08, 0x01, 0x00, 0x73, 0x02, 0x00, 0xc3, 0xa9, // string "s" = "é": uint16 LE byte length, UTF-8
    0x00, // end
  ]);
  assert.deepStrictEqual(buf, expected);
});

test('round-trips a compound with every supported tag', () => {
  const tag = compound('root', [
    byte('byte', -128),
    short('short', 32767),
    int('int', -2147483648),
    long('long', 9223372036854775807n),
    float('float', 1.5),
    double('double', Math.PI),
    byteArray('byte_array', [0, 1, 255]),
    string('string', 'Кирка шахтёра ⛏'),
    string('empty', ''),
    list('ints', TAG_INT, [1, -1, 65536]),
    list('strings', TAG_STRING, ['a', 'б']),
    list('empty_list', 0, []),
    list('nested', TAG_LIST, [
      { elementType: TAG_INT, items: [7] },
      { elementType: TAG_INT, items: [] },
    ]),
    list('compounds', TAG_COMPOUND, [[int('x', 1)], []]),
    compound('inner', [compound('deeper', [byte('flag', 1)])]),
    intArray('int_array', [0, -1, 2147483647]),
  ]);

  const buf = writeNbt(tag);
  const { tag: back, end } = readNbt(buf, 0);

  assert.strictEqual(end, buf.length, 'reader consumes every byte');
  assert.deepStrictEqual(back, tag, 'every tag type and value survives');
  assert.deepStrictEqual(writeNbt(back), buf, 're-serialising gives identical bytes');

  const plain = toPlain(back);
  assert.strictEqual(plain.long, 9223372036854775807n);
  assert.strictEqual(plain.string, 'Кирка шахтёра ⛏');
  assert.deepStrictEqual(plain.byte_array, [0, 1, 255]);
  assert.strictEqual(plain.inner.deeper.flag, 1);
});

test('rejects a string longer than the uint16 length prefix', () => {
  assert.throws(() => writeNbt(string('s', 'x'.repeat(65536))), /65535/);
});
