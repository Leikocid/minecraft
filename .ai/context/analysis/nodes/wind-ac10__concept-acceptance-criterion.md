---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac10"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-10 · Vines and cobwebs present, main route never blocked"
aliases: ["L0-wind-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 404
tags: ["is_a:acceptance-criterion", "spec-test:21", "verify:unit", "verify:ipad", "decay"]
level: 2
---
# AC-wind-10 · Vines and cobwebs present, main route never blocked

**Spec:** test 21, §4.2.

GIVEN the template
THEN (unit) there are vines on exterior walls and inside, cobwebs on every floor with floor 3 having the most
AND no cobweb, vine or solid block occupies a route cell (`L0-wind-g007`)
AND (iPad) a player walks from the door to the top floor and opens all 25 chests without breaking anything.
