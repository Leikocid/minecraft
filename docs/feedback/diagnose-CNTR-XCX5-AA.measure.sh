#!/usr/bin/env bash
# Measurements behind docs/feedback/diagnose-CNTR-XCX5-AA.md (L0-xcx5).
#   measure.sh          print every number the claim rests on; exit 0
#   measure.sh header   exit 1 unless the visible header names all four structures
#   measure.sh dupes <.ai/context>   every KV line restating the claim or its numbers
# Needs pandoc and unzip; run from the repository root.
set -uo pipefail

if [ "${1:-}" = dupes ]; then
  cd "$2/analysis" || exit 2
  echo "== the claim by address (L0-xcx5, drafts wording)"
  grep -rn -E 'xcx5|earlier drafts|черновы' . | grep -v '^\./nodes/xcx5__' | cut -c1-220
  echo "== by number: City ≈30×30 / 31×13×31 (shipped 63×20×63)"
  grep -rn -E '30 ?[×x] ?30|31 ?[×x] ?(13|31)|62 ?[×x] ?62' . | grep -v '^\./nodes/xcx5__' | cut -c1-220
  echo "== by number: Airship ≈15×7×10–12 / 28×11×7 / 25–30 (shipped 75×18×13)"
  grep -rn -E '15 ?[×x] ?7|28 ?[×x] ?(7|11)|25[–-]30 блоков' . | cut -c1-220
  echo "== by number: shipped sizes recorded anywhere in KV"
  grep -rn -E '75 ?[×x] ?(18|13)|63 ?[×x] ?(20|63)' . | cut -c1-220 || echo "  none"
  echo "== by number: spawn Windmill 50 % / 100 %"
  grep -rn -E 'old 50 ?%|прежний 50' . | cut -c1-220
  exit 0
fi
D=docs/Four_Structures_Spec_RU_EN_copy.docx
T=$(pandoc "$D" -t plain --wrap=none)
M=$(pandoc "$D" -t markdown --wrap=none | sed 's/\\//g; s/---*/–/g')
H=$(printf '%s\n' "$T" | sed -n 1p)

if [ "${1:-}" = header ]; then
  echo "visible header: $H"
  for s in Windmill Airship Warden Bastion; do
    printf '%s' "$H" | grep -q "$s" && echo "  names $s" || { echo "  does NOT name $s"; miss=1; }
  done
  exit "${miss:-0}"
fi

sec() { printf '%s\n' "$M" | awk -v a="^# $1\\\\." -v b="^# $2\\\\." '$0 ~ a {f=1; next} $0 ~ b {f=0} f'; }
nums() { grep -oE '[−-]?[0-9]+([–-][0-9]+)?(×[0-9]+([–-][0-9]+)?)*%?' | sort -u; }

echo "sha1: $(shasum "$D" | cut -d' ' -f1)"
echo "visible header (line 1): $H"
echo "docProps title:   $(unzip -p "$D" docProps/core.xml | grep -oE '<dc:title>[^<]*' | cut -d'>' -f2)"
echo "docProps subject: $(unzip -p "$D" docProps/core.xml | grep -oE '<dc:subject>[^<]*' | cut -d'>' -f2)"
echo "§1 table columns: $(printf '%s\n' "$M" | grep -m1 'Параметр / Parameter' | grep -oE '\*\*[^*]+\*\*' | tr '\n' ' ')"
echo "lines saying 'четыр…' (four): $(printf '%s\n' "$T" | grep -c 'четыр')"
printf '%s\n' "$T" | grep -n -E 'прежний 50%|20×20 заменяет|более ранними черновыми|equally normative'

# without -Mutf8 the en dash in the pattern stays three bytes and never matches decoded input, so table rules count as prose
echo "§2–§6 body lines / of them with no Cyrillic letter (table rules excluded): $(printf '%s\n' "$M" | awk '/^# 2\./{f=1} /^# 7\./{f=0} f && !/^#/ && NF' | perl -CSD -Mutf8 -ne 'next if /^[\s\-–]*$/; $n++; $e++ unless /\p{Cyrillic}/; END { printf "%d / %d", $n, $e }')"
echo "§12 lines naming Warden/Bastion: $(sec 12 13 | grep -ciE 'warden|bastion')"
body=$(printf '%s\n' "$M" | awk '/^# 12\./{exit} {print}')
n=0; miss=""; for x in $(sec 12 13 | nums); do n=$((n+1)); printf '%s\n' "$body" | grep -qF -- "$x" || miss="$miss $x"; done
echo "§12 numbers: $n, absent from §1–§11:${miss:- none}"
body=$(printf '%s\n' "$M" | awk '/^# 13\./{f=1} /^# 16\./{f=0} f')
n=0; miss=""; for x in $(printf '%s\n' "$M" | awk '/^# 16\./{f=1; next} f' | nums); do n=$((n+1)); printf '%s\n' "$body" | grep -qF -- "$x" || miss="$miss $x"; done
echo "§16 numbers: $n, absent from §13–§15 as one token:${miss:- none}"

echo "Four Structures docx paths ever in git: $(git log --all --format= --name-only -- '*.docx' | grep -i four_structures | sort -u | tr '\n' ' ')"
echo "shipped sizes [x, y, z]:"
grep -h -E '(AIRSHIP|BASTION|WARDEN_CITY|WINDMILL)_SIZE: Point' src/structures/templates/*.ts | sed 's/^/  /'
grep -h 'export const PLOT' src/structures/templates/windmill-fields.ts | sed 's/^/  /'
echo "shipped chances:"; sed -n '/^export const CHANCES/,/^}/p' src/structures/config.ts | grep -E '^\s+[a-z_]+:' | sed 's/^ */  /'
echo "spawn Windmill chance roll in spawn-search.ts: $(grep -cE 'Math\.random|chance' src/structures/spawn-search.ts)"
echo "size history (git, first commit carrying each value):"
for f in airship warden-city; do
  for h in $(git log --reverse --format=%h -- "src/structures/templates/${f}.ts"); do
    s=$(git show "${h}:src/structures/templates/${f}.ts" | grep -m1 -oE '[A-Z_]+_SIZE: Point = \[[0-9, ]+\]')
    echo "  $h $(git log -1 --format=%ad --date=short "$h") $s"
  done | awk '!seen[$3 $4 $5 $6 $7 $8 $9]++'
done
node --test tests/structures-sizes.test.mjs 2>&1 | grep -E '^(✔|✖|ℹ (pass|fail))'
