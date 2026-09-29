#!/usr/bin/env node
// The L0-xcx6 invariant as an executable check over the KV node files:
// `wrdn` and `bast` cite `strf-*`/`loot-*` by id, name their probe items, and
// carry none of the restatements L0-adr-body voids. Exit 1 while any holds.
// Usage: node docs/feedback/diagnose-CNTR-XCX6-AA.check.mjs [nodes-dir]
// The default is the checkout's .ai/context; the live KV is the project root's
// .ai/context/analysis/nodes and can lag or lead a worktree copy.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? ".ai/context/analysis/nodes";
const files = readdirSync(dir);
const subtree = (b) => files.filter((f) => f.startsWith(`${b}__`) || f.startsWith(`${b}-`));
const text = (f) => readFileSync(join(dir, f), "utf8");

/** Lines matching `re` across a body subtree, as `file:line: text`. */
function hits(body, re) {
  const out = [];
  for (const f of subtree(body)) {
    text(f).split("\n").forEach((l, i) => {
      if (re.test(l)) out.push(`${f}:${i + 1}: ${l.slice(0, 140)}`);
    });
  }
  return out;
}

const ID = /\b(strf|loot)-[a-z]?\d{2,3}\b/;
const PROBE = /strf-p006|probe item|probe Q\d|пункт[а-я]* зонда/i;

// The control proves the instrument sees ids at all: wind and airs comply.
const control = ["wind", "airs"].map((b) => [b, hits(b, ID).length]);
let failed = false;
let blind = false;
for (const [b, n] of control) {
  console.log(`control ${b}: ${n} line(s) citing strf-/loot- ids`);
  if (n === 0) blind = true;
}
if (subtree("wrdn").length === 0 || subtree("bast").length === 0) blind = true;
if (blind) {
  console.log("BLIND: the control or a subject subtree is empty; this directory cannot answer");
  process.exit(2);
}

// L0-adr-body Decision 2: each restating clause cites its governing contract.
// A clause file that is gone no longer restates anything and passes.
const GEN = /strf-r00[12]|strf-p001/;
const INIT = /strf-r008|strf-p004|adr-strs/;
const LOOT = /loot-(p002|r006|r007)/;
const crosswalk = [
  ["wrdn-rul1", GEN], ["bast-r001", GEN], ["bast-p001", GEN],
  ["wrdn-rul7", INIT], ["bast-r006", INIT], ["bast-p002", INIT], ["bast-as03", INIT],
  ["wrdn-ent1", /strf-e002|strf-r008/], ["bast-ent1", /strf-e002|strf-r008/],
  ["bast-r005", /strf-r009/],
  ["wrdn-rul6", LOOT], ["wrdn-ad01", LOOT], ["bast-r003", LOOT], ["bast-ad02", LOOT],
  ["wrdn-ad02", /adr-strc/], ["bast-ad01", /adr-strc/],
];
for (const [node, re] of crosswalk) {
  const f = files.find((x) => x.startsWith(`${node}__`));
  if (f === undefined) {
    console.log(`PASS ${node}: absent`);
    continue;
  }
  const ok = re.test(text(f));
  console.log(`${ok ? "PASS" : "FAIL"} ${node} cites ${re.source}`);
  if (!ok) failed = true;
}

const must = [
  ["wrdn names its probe items (strf-p006)", "wrdn", PROBE],
  ["bast names its probe items (strf-p006)", "bast", PROBE],
  ["bast knows the pending deferral (strf-r002 §2, strf-r007)", "bast", /pending|strf-r007/],
];
const mustNot = [
  ["bast links phantom siblings L0-mill / L0-arsh", "bast", /L0-mill|L0-arsh/],
  ["bast keys generation off world-generation/chunk-load events", "bast", /world-generation\/(chunk-)?load|chunk is generated\/loaded/i],
  ["bast keeps its own init marker (bast-as03)", "bast", /initiali[sz]ation (flag|marker)/i],
  ["bast entities keep per-object init flags", "bast", /initialized_flag|filled_flag|spawned_once_flag/],
  ["wrdn entities keep their own init/loot state", "wrdn", /`filled` — boolean|idempotency checks on every subsequent chunk load/],
  ["wrdn treats L0-xcx4 as open", "wrdn", /xcx4[^\n]*(still open|unresolved|both apply)|(still open|unresolved)[^\n]*xcx4/],
];

for (const [label, body, re] of must) {
  const n = hits(body, re).length;
  console.log(`${n > 0 ? "PASS" : "FAIL"} ${label}: ${n} line(s)`);
  if (n === 0) failed = true;
}
for (const [label, body, re] of mustNot) {
  const h = hits(body, re);
  console.log(`${h.length === 0 ? "PASS" : "FAIL"} no: ${label}: ${h.length} line(s)`);
  for (const l of h) console.log(`    ${l}`);
  if (h.length > 0) failed = true;
}
process.exit(failed ? 1 : 0);
