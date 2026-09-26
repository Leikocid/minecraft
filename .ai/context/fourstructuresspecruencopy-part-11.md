---
type: "raw-fragment"
node_id: "fourstructuresspecruencopy-part-11"
source_channel: "raw-import"
level: null
aliases: ["fourstructuresspecruencopy-part-11", "fourstructuresspecruencopy"]
is_a: ["raw-fragment"]
priority: 530
size_chars: 3837
tags: ["architecture", "migration", "performance"]
source: "docs/Four_Structures_Spec_RU_EN_copy.docx"
embed_lines: "663-702"
embed_slice: "5-44"
---
55. Проверить ровно 10 сундуков: 3 treasure-сундука в центре + 7 обычных бастионных сундуков по структуре.

56. Проверить случайно 2--4 Gold Blocks в сокровищнице.

57. Проверить первоначальную охрану: 7--10 Piglins + ровно 2 Piglin Brutes, без Hoglins; один Brute у сокровищницы.

58. Убить часть охраны, забрать золото/лут, изменить лаву и перезапустить сервер; ничего из этого не должно восстановиться.

59. Проверить отмену кандидата при пересечении с другой структурой.

# 15. Общие дополнения для четырёх структур / Four-structure shared addendum

- Случайный поворот 0/90/180/270 применяется ко всем четырём фиксированным шаблонам.

- Мельница и Дирижабль продолжают использовать общую пользовательскую loot system из раздела 3. Mini Warden City и Mini Bastion используют только соответствующие ванильные loot tables, описанные в разделах 13 и 14.

- Все четыре структуры должны сохранять состояние после рестартов и выгрузки чанков; разрушенные блоки, разграбленные сундуки и убитые одноразовые мобы не восстанавливаются.

- При физическом конфликте с другой обнаруженной структурой обычный кандидат Mini Warden City/Mini Bastion отменяется так же, как обычные кандидаты существующих структур. Никакого принудительного разрушения соседней структуры.

- Предпочитать стабильные Bedrock Add-On/Script API без Experiments. Если точное worldgen-поведение, естественный статус Sculk Shrieker или обнаружение всех пересечений невозможно реализовать стабильно, агент использует ближайшее стабильное приближение, не меняющее основной геймплей, и явно документирует отклонение.

# 16. English implementation addendum --- Mini structures

- Mini Warden City: Overworld only, 5% per suitable chunk, fixed \~30×30×10--15 Ancient-City-inspired template, random 0/90/180/270 rotation. Reject water-surface locations and structure overlaps. Randomize the structure so its top is approximately Y −35 to −45.

- Place an irregular \~5×5 Sculk/Sculk Vein surface marker directly above the city. Do not create a shaft. Digging vertically from roughly the marker center must lead into the structure.

- Mini Warden City has 10 fixed chests: 3 in the central hall and 7 distributed through ruins, niches and side rooms. All 10 use the vanilla Ancient City loot table, including its normal rare loot possibilities. Do not use the Windmill/Airship custom loot table.

- The central hall contains a decorative Reinforced Deepslate frame about 5 blocks wide and 6--7 blocks high. It is not a functional portal. Place exactly 2 naturally-behaving Sculk Shriekers: one near the central hall and one in a distant zone. Do not pre-spawn a Warden.

- Keep Mini Warden City mostly dark, with only sparse Soul Lanterns/Soul Torches and appropriate Sculk Sensors/Veins throughout.

- Mini Bastion: Nether only, 5% per suitable chunk in any Nether biome, fixed \~20×20×10--12 template with 2--3 coherent levels and random 0/90/180/270 rotation. Reject lava-ocean sites, unsuitable support and structure overlaps.

- Mini Bastion visually uses the Bastion Remnant blackstone family with visible gold accents. Its central lower treasure room is surrounded/approached by ordinary vanilla lava and can be reached through the lava area or from above.

- Mini Bastion has 10 fixed chests: 3 central treasure chests using vanilla Bastion treasure loot and 7 distributed chests using normal vanilla bastion loot. The treasure room also contains a random 2--4 Gold Blocks.

- On first initialization, spawn 7--10 regular Piglins and exactly 2 Piglin Brutes. No Hoglins. One Brute guards the treasure room and the other is elsewhere. These initial mobs are persistent until death and never respawn.

- For both mini structures, loot is one-time, player destruction is permanent, initialization is idempotent, and no automatic restoration occurs after restart/chunk unload.
