---
type: "concept-process"
node_id: "L0-infr-p004"
source_channel: "rollout"
analysis_version: 5
title: "Process: iPad delivery (two paths)"
aliases: ["L0-infr-p004"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 2188
tags: ["is_a:process"]
level: 2
---
# Process: iPad delivery (two paths)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]`

Two independent ways to get a build onto the iPad. Path (a) changes nothing on the Mac; path (b) is for fast iteration.

## (a) `.mcaddon` import (standard path)
1. `npm run build` → `dist/andrew.mcaddon`.
2. Transfer to iPad — AirDrop, or via Files (iCloud Drive/Google Drive/Finder sync) → "Open in Minecraft".
3. Minecraft imports both packs automatically.
4. **Same-UUID re-import caveat**: because behavior/resource pack uuids are constant (owned by PACK-01, never regenerated), re-importing the same-or-older version can show as a duplicate or fail to replace the old one. Fix: iPad Settings → Storage → delete "Andrew BP"/"Andrew RP" before re-importing.
5. Enable both packs in the world (Behavior Packs + Resource Packs, world settings).

## (b) LAN server (no re-import, for fast iteration)
The world runs on the Mac; the iPad adds the server once by address and every subsequent build is already installed on next join — no file transfer per iteration.
1. Mac: `npm run bds:up` — builds, installs into the world, starts Survival+cheats (auto-smelt can only be checked in Survival [C-9]), waits for a clean start, prints `ip:19132`. `detectLanIp()` reads `en0`/`en1` via `ipconfig getifaddr`; if it fails, the command warns and falls back to advertising the container address (which the iPad likely can't reach).
2. iPad: Play → Servers → Add Server → name, the printed IP, port `19132`.
3. Both devices must be on the same non-guest, non-cellular Wi-Fi.
4. Server pushes both packs to the iPad on join automatically — nothing to enable by hand.
5. `npm run bds:down` to stop/remove the container; `npm run bds:logs` to follow the running log.

## Transport
iPad client 1.26.51 connects over **RakNet UDP 19132** on join, despite BDS recommending NetherNet in its own log — `transport=raknet` is set accordingly. NetherNet ports (TCP 19132, UDP 19140-19149 gameplay, UDP 7551 LAN discovery) are published too. `server-udp-ports` is written as `<lan-ip>:19140-19149:19140-19149` so the server advertises the Mac's real LAN IP instead of its unreachable Docker-internal 172.x address.
