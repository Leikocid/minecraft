---
type: "raw-fragment"
node_id: "underwaterbowfinalspecv3ruen-part-4"
source_channel: "raw-import"
level: null
aliases: ["underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen"]
is_a: ["raw-fragment"]
priority: 650
size_chars: 4437
tags: ["integration", "migration", "api", "digest"]
source: "docs/Underwater_Bow_Final_Spec_v3_RU_EN.docx"
embed_lines: "163-203"
embed_slice: "5-45"
---
# 7. Привязка и телепортация

- Состояние «не привязана»: обычный заброс поплавка; удочкой можно рыбачить. Когда поплавок попадает именно в существующую нажимную плиту любого ванильного типа, запомнить измерение, точные координаты и тип/идентичность блока, а также UUID игрока, который привязал удочку. Поплавок немедленно убрать, удочку визуально вернуть в обычное положение.

- Состояние «привязана»: следующее использование этой удочки ТЕМ ЖЕ живым игроком инициирует телепортацию к запомненной плите вместо нового заброса. Без ограничений расстояния; допустимы удалённые чанки. Перед перемещением убедиться, что плита по-прежнему существует на тех же координатах и что есть безопасное место для игрока над ней или рядом.

- После УСПЕШНОЙ телепортации привязка стирается: для повторного перемещения нужно вновь попасть поплавком в плиту. Если плита сломана/заменена --- привязка недействительна, телепортации нет, требуется новая привязка.

- При смерти привязавшего игрока все его активные привязки этого предмета сбрасываются, даже если предмет позже поднимет другой игрок. Передача/выбрасывание не дают другому игроку права использовать чужую привязку: необходима собственная новая привязка. Сам предмет выпадает по обычным правилам мира, не имеет защиты легендарного предмета.

- При невозможности загрузить удалённый чанк или найти безопасную точку не телепортировать в опасное место; сообщить об ошибке, не заявлять об успешном переносе. Успешная привязка должна сохраняться при перезапуске мира, если игрок жив и плита существует; техническую реализуемость стабильным API проверить.

- Только плиты, в которые действительно попал поплавок; обычное взаимодействие с другими блоками не привязывает. Другие измерения: переход разрешён лишь при наличии надёжной поддержки межпространственной телепортации и загрузки назначения, иначе явно сообщить об ограничении, не имитировать успех.

# 8. Дополнительные приёмочные тесты

- Рецепт с жемчугом над удочкой выдаёт предмет, доступен многократно; прочность не расходуется.

- Попадание поплавком на каждую ванильную нажимную плиту создаёт привязку; следующее использование переносит к плите и очищает привязку.

- Повторное использование после телепортации снова забрасывает поплавок; сломанная/заменённая плита не телепортирует.

- Смерть владельца сбрасывает привязку; другой игрок не может воспользоваться прежней привязкой после передачи или подбора.

- Очень дальние координаты не имеют искусственного лимита; незагруженный чанк обрабатывается безопасно.

- Обычная рыбалка без привязки работает, а сохранение/загрузка мира не повреждает предмет.

ENGLISH --- v3 addendum: Pearl Rod

# 6. Item and crafting

Pearl Rod (Russian name: «Перовый сокровятель») is a non-legendary fishing-rod variant: unlimited crafting, infinite durability, transferable and droppable. It behaves like a normal fishing rod when unbound. Craft in a 3×3 grid: Ender Pearl in top-middle, Fishing Rod in center, all other cells empty; output one Pearl Rod. The spoken ingredient "ender feather" is interpreted as Ender Pearl and should be confirmed if a different ingredient was intended.

# 7. Binding and teleportation

- Unbound: cast and fish normally. When the bobber actually strikes any vanilla pressure plate, record the exact block position, dimension, block identity/type, and binding player UUID; retract the bobber immediately.

- Bound: the next use by the same living player teleports them to a safe location at or beside that plate, instead of casting. No arbitrary distance limit. Validate that the original plate still exists and the destination is safe.

- Clear the binding immediately after a successful teleport. To teleport again, the player must cast at a pressure plate again. A destroyed/replaced plate invalidates the binding and prevents teleportation.

- On the binding player's death, invalidate their bindings even if another player picks up the dropped item. Item transfer must not allow use of someone else's active binding; the recipient must bind it afresh.

- If destination chunks cannot be loaded or no safe arrival point exists, fail safely and report the limitation. Persist valid binding state across world reloads where supported. Cross-dimension use requires reliable supported teleport and destination loading; otherwise report the limitation instead of claiming success.

# 8. Additional acceptance tests

- Unlimited craft, correct grid, no durability loss.