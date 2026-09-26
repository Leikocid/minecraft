---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac06"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 524
tags: ["is_a:acceptance-criterion", "verify:bds", "crash-resume"]
level: 2
---
**AC-strf-06 · A crash mid-init resumes without duplicates** (`L0-strf-p003`, `-p004`)

GIVEN a test hook that stops the server immediately after (a) the `planned` write, (b) `place`, (c) half the chests are filled, (d) half the guards are spawned, WHEN the server restarts and a player returns, THEN the instance reaches `done` with exactly the spec's chest count filled (each chest's contents equal the deterministic expectation for its seed) and exactly the spec's guard count tagged `andrew:guard:<id>`.
**Verify:** bds.
