---
type: "raw-fragment"
node_id: "fourstructuresspecruencopy-part-8"
source_channel: "raw-import"
level: null
aliases: ["fourstructuresspecruencopy-part-8", "fourstructuresspecruencopy"]
is_a: ["raw-fragment"]
priority: 530
size_chars: 5562
tags: ["architecture", "infrastructure", "performance", "api"]
source: "docs/Four_Structures_Spec_RU_EN_copy.docx"
embed_lines: "463-523"
embed_slice: "7-67"
---
- Windmill: Overworld only; normal 1% per suitable dry land chunk; fixed \~15×15×30 building on \~35×35 fixed field layout; 25 fixed chests (5/8/12); 3 vanilla-like spawners by floor (Zombie Villager, Zombie, iron-axe Vindicator); 10 one-time persistent sun-immune field Zombie Villagers; abandoned stone/wood aesthetic with vines and cobwebs.

- Spawn-area Windmill: exactly one guaranteed per new world. Search 5×5 chunks around world spawn first, then nearest valid location up to 500 blocks. If no naturally flat site exists, prepare/level a dry site while preserving detected structures and existing spawners. Smooth terrain edges; do not fill deep caves wholesale.

- Airship: Overworld only; independent 2% per suitable land chunk plus a separate linked attempt for every Windmill at 40--100 blocks. Fixed \~15×7×10--12 modern gray concrete design; no decay; decorative upper oval; lower hull has 4 rooms + central corridor, 10 chests, one iron-axe Vindicator spawner.

- Airship altitude: entire footprint over land; bottom at least 40 blocks above the highest terrain point beneath the footprint, with target clearance 40--70 where possible; reject if world ceiling prevents fit.

- Loot: 5--12 fill attempts per chest; each attempt selects at most one category using the relative weights in section 3. Same table for both structures. Golden Apple category max once per chest; diamonds may repeat. Equipment is iron 80% / diamond 20%; enchanted gear uses compatible vanilla enchants, no curses.

- Persistence: generated loot never refreshes; destroyed chests/spawners/blocks never regenerate; one-time Windmill guards never respawn. Structures rotate randomly by 0/90/180/270 degrees.

- Implementation: prefer stable Bedrock APIs, no Experiments. If an exact rule is impossible with stable APIs, use the closest stable approximation without changing the core gameplay and document the deviation.

# 13. Маленький город Вардена / Mini Warden City

Этот раздел является нормативным дополнением к общей спецификации. При конфликте с более ранними черновыми решениями правила ниже имеют приоритет.

## 13.1. Назначение, размер и образ / Identity, size and theme

- Компактная пользовательская структура в стиле vanilla Ancient City, а не уменьшенная поблочная копия полного ванильного города.

- Примерный footprint: около 30×30 блоков; высота около 10--15 блоков. Контур может быть нерегулярным внутри фиксированного шаблона.

- Один фиксированный дизайн с случайным поворотом 0° / 90° / 180° / 270° при генерации.

- Визуальная палитра и атмосфера должны явно напоминать Ancient City: deepslate-архитектура, Sculk, Sculk Veins, Sculk Sensors, Sculk Shriekers и подходящие ванильные декоративные элементы.

- Структура почти полностью тёмная. Допускается лишь небольшое количество Soul Lanterns и Soul Torches в фиксированных местах, прежде всего около проходов и центральной зоны. Освещение не должно лишать структуру мрачной атмосферы.

## 13.2. Генерация и глубина / Generation and depth

- Измерение: только Overworld.

- Шанс кандидата: 5% на подходящий чанк. Если 5% бросок успешен, но место не подходит, генерация отменяется без переноса в соседний чанк.

- Город не генерируется под океанами, реками и другими крупными водными поверхностями. Поверхностная точка над структурой должна находиться на суше.

- Вертикальная позиция случайна: верхняя часть структуры должна находиться примерно в диапазоне Y = −35...−45. Конкретный Y выбирается отдельно для каждого экземпляра.

- Кандидат отменяется при физическом пересечении с обнаруженной ванильной или пользовательской структурой, включая настоящий Ancient City. Уже существующие структуры ради Mini Warden City не повреждаются.

## 13.3. Поверхностная метка / Surface marker

- Прямо над центром каждого Mini Warden City на фактической поверхности создаётся нерегулярная скалковая метка примерно 5×5 из Sculk/Sculk Vein.

- Метка служит только ориентиром и не создаёт готовую шахту, лестницу или вертикальный тоннель.

- Геометрия города и метки должна быть согласована так, чтобы игрок, начав копать вертикально вниз примерно из центра метки, гарантированно попал внутрь структуры.

- Метка должна размещаться только на допустимой суше и не должна использоваться для разрушения другой сгенерированной структуры.

## 13.4. Центральный зал / Central hall

- В центре находится выраженный главный зал, визуально отсылающий к центральной части настоящего Ancient City.

- В центральном зале расположен декоративный монумент/рамка из Reinforced Deepslate примерно 5 блоков шириной и 6--7 блоков высотой.

- Монумент полностью декоративный: не активируется, не является порталом и не телепортирует игрока.

- В центральной зоне находятся ровно 3 из 10 сундуков.

- Один из двух естественных Sculk Shriekers расположен возле центрального зала/монумента.

## 13.5. Скалк и Warden / Sculk and Warden behavior

- В структуре ровно 2 естественно сгенерированных Sculk Shriekers в фиксированных позициях: один возле центрального зала, второй в дальней части города.

- Оба должны вести себя как естественно сгенерированные vanilla Sculk Shriekers и участвовать в обычной механике предупреждений/вызова Warden настолько точно, насколько это позволяет стабильная Bedrock-реализация.

- Warden заранее не создаётся и не является постоянным охранником структуры. Его появление возможно только через обычную механику Sculk Shrieker.

- Sculk Sensors, Sculk Veins и другие подходящие скалковые элементы размещаются по всей структуре в фиксированном шаблоне; Sensors могут встречаться заметно чаще двух Shriekers.