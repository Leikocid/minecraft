---
type: "raw-fragment"
node_id: "ufomagnetspecv1ruen-part-4"
source_channel: "raw-import"
level: null
aliases: ["ufomagnetspecv1ruen-part-4", "ufomagnetspecv1ruen"]
is_a: ["raw-fragment"]
priority: 590
size_chars: 3410
tags: ["digest", "requirements", "security"]
source: "docs/UFO_Magnet_Spec_v1_RU_EN.docx"
embed_lines: "188-244"
embed_slice: "6-62"
---
-----------------------------------------------------------------------
  Key / Meaning           RU                      EN
  ----------------------- ----------------------- -----------------------
  Arrival                 В небе НЛО!             A UFO is in the sky!

  Shot down               %s сбил НЛО!            %s shot down the UFO!
  -----------------------------------------------------------------------

# 13. Acceptance tests / Приёмочные тесты

1.  First arrival happens 10--20 minutes after the first player joins; each next one exactly 15 minutes after departure or shoot-down; the timer survives a server restart.

2.  The saucer appears 90 blocks out, reaches the hover point (centre + 40, at most ceiling − 15) in 20 s, the magnet lasts 60 s, departure 15 s, then the saucer is gone.

3.  No event in the Nether or the End; no event while no player is in the Overworld; at most one saucer in the world.

4.  A Survival player holding iron in the main or off hand inside the zone is lifted under the saucer and held there.

5.  A player with iron only in the inventory or worn armour is not pulled.

6.  Dropping the iron item (or switching to a non-iron slot) stops the pull at once; the player falls and the dropped item is pulled.

7.  On release a player held at the hover height takes vanilla fall damage (dies from full height); a player released near the ground takes none.

8.  At most 10 non-player elements are pulled, chosen by priority: ground items, container stacks, mobs/minecarts, built blocks, ore; nearest first within a class.

9.  Iron stacks are extracted from chests, double chests, barrels, hoppers, furnaces, shulker boxes and the other listed containers; non-iron contents stay.

10. A pulled block becomes air and exactly one item of its own; a door goes as a whole; ore yields one raw iron; blocks resting on it pop by vanilla rules; a hopper with contents keeps its place and only its iron stacks are taken.

11. Ore 20 blocks underground flies up through stone.

12. An iron golem, a minecart and a mob wearing iron armour are pulled; a mob without iron is not.

13. Legendary weapons are never pulled.

14. On release every pulled thing falls with vanilla physics.

15. An Orbital Cannon charge passing through the hull shoots the saucer down in any phase: magnet off, things fall, the saucer falls and explodes without block damage, 8 diamonds and 1 totem drop, the broadcast names the shooter.

16. Nothing but the Cannon damages the saucer or the beam.

17. /andrew:ufo come\|stop\|enable\|disable work for operators only; disable persists across restart.

18. After a restart mid-event no saucer or beam remains in the world.

# 14. Definition of Done

- Работает на актуальной стабильной Minecraft Bedrock без экспериментов.

- Все приёмочные тесты, проверяемые на BDS, автоматизированы в GameTest.

- На iPad проверено глазами: тарелку видно на подлёте, луч полупрозрачный и виден целиком, притяжение игрока плавное, облако железа видно, падение после отключения.

- Событие не роняет TPS: стоимость шага в тике с тарелкой измерена и записана.

# 15. Приоритеты агента / Agent priorities

При конфликте: (1) не дюпать предметы и не повреждать мир, (2) правильная игровая логика, (3) мультиплеер, (4) визуальная точность.

If they conflict, prioritize: (1) no duplication or world corruption, (2) correct gameplay, (3) multiplayer, (4) visual fidelity.
