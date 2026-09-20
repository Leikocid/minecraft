# Andrew — Minecraft Bedrock Add-On

## 1. Что это

Это Bedrock-аддон `andrew` для игры Minecraft Bedrock Edition.

**Целевые версии:**
- Игра: **1.26.51** (iPad)
- Script API (`@minecraft/server`): **2.10.0**
- Bedrock Dedicated Server в Docker: **1.26.51.1**
- Минимальная версия движка в пакетах: **[1, 26, 50]**

Все версии зафиксированы в `scripts/targets.mjs` — единственный источник истины. Манифесты и конфигурация Docker синхронизируются с этим файлом.

## 2. Требования

- **Node.js** версии 20 или выше
- **Docker** (установлен и запущен)
- **iPad** с установленной Minecraft Bedrock Edition 1.26.51 (для финальной проверки; на Mac Bedrock не доступен)

Цикл разработки:
1. Сборка и статическая проверка на Mac
2. Загрузка пакета в BDS в Docker (проверка логов)
3. Визуальная проверка на iPad

## 3. Команды

### Подготовка и проверка кода

```bash
npm ci
```
Установка зависимостей (чистая установка, как в CI).

```bash
npm run typecheck
```
Проверка типов TypeScript против `@minecraft/server`. Успех — без ошибок компиляции.

```bash
npm test
```
Запуск unit-тестов (`node:test`). Успех — все тесты проходят.

### Сборка

```bash
npm run build
```
Собирает `.mcaddon` в `dist/andrew.mcaddon`: компилирует TypeScript, валидирует JSON манифестов и предметов, упаковывает пакеты. Успех — файл `dist/andrew.mcaddon` существует и архив корректен.

```bash
npm run validate
```
Валидирует JSON манифестов и файлы определений предметов без сборки архива. Успех — вывод `Validation passed` без ошибок.

```bash
npm run build:clean-clone
```
Собирает `.mcaddon` из чистого клона репозитория (в отдельной директории). Проверяет, что процесс воспроизводим и не зависит от состояния рабочей копии. Успех — файл собран без ошибок, архив корректен.

### Сервер BDS в Docker

```bash
npm run bds:check
```
Одноразовая проверка: запускает BDS в Docker, загружает пакет, читает лог на наличие ошибок манифеста/зависимостей и выполнения скриптов, останавливает контейнер. Успех — в логе нет ошибок `manifest`, `dependency`, и скрипт выполнился (найдена строка от `console.warn` или успешное событие).

```bash
npm run bds:up
```
Запускает BDS в фоне как LAN-сервер (порт 19132/UDP). Пакет предварительно загруженного мира `andrew` включён. Успех — контейнер запущен, iPad может присоединиться к серверу по LAN (см. раздел 4).

```bash
npm run bds:down
```
Останавливает и удаляет контейнер BDS. Успех — контейнер остановлен, `docker ps` не показывает `andrew-bds`.

```bash
npm run bds:logs
```
Выводит логи работающего контейнера BDS в реальном времени. Используйте для отладки; нажмите Ctrl+C для выхода. Успех — видны логи инициализации и событий.

## 4. iPad: проверка на устройстве

### Доставка .mcaddon

1. **По AirDrop:**
   - На Mac: откройте `dist/andrew.mcaddon` в Finder, кликните правой кнопкой → `AirDrop` → выберите iPad.
   - На iPad: примите файл в Файлах или сразу откроется Minecraft.

2. **Через Файлы:**
   - Скопируйте `dist/andrew.mcaddon` в облачное хранилище (iCloud Drive, Google Drive) или синхронизируйте через Finder.
   - На iPad откройте Файлы, найдите файл, тапните и выберите «Открыть в Minecraft».

### Включение пакетов в мире

1. Запустите Minecraft на iPad.
2. Создайте новый мир или откройте существующий.
3. В меню настроек мира:
   - **Behavior Packs**: добавьте «Andrew BP» (behavior pack).
   - **Resource Packs**: добавьте «Andrew RP» (resource pack).
   - Убедитесь, что оба пакета отмечены как включённые (галочка).
4. Сохраните настройки и войдите в мир.

### Проверка логов (Content Log GUI)

1. В игре откройте **Настройки** (Settings).
2. Выберите **Creator** → **Activate Command Block Output** (если нужна сборка команд).
3. Для просмотра логов скрипта:
   - Откройте **Настройки** → **Creator** → включите **Content Log**.
   - На экране появится лог в реальном времени (белый текст на полупрозрачном фоне).
   - Используйте его для отладки ошибок скриптов и импорта пакетов.

### Подключение к серверу на Mac по LAN

Чтобы присоединиться с iPad к BDS, запущённому на Mac:

1. На Mac запустите `npm run bds:up`.
2. Узнайте IP-адрес Mac:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Нужен адрес в виде `192.168.x.x` или `10.0.x.x`.
3. На iPad откройте Minecraft и выберите **Play** → **Servers**.
4. Нажмите **Add Server** и введите:
   - **Server Name**: `Andrew BDS` (любое имя)
   - **Server Address**: IP-адрес Mac из шага 2
   - **Port**: `19132`
5. Нажмите **Play** → присоедините к серверу.
6. Сервер загружает пакеты автоматически при входе.

## 5. Ошибки версии или зависимостей

Если при импорте `.mcaddon` на iPad или в BDS появляется ошибка вроде:
- `Unsupported version: ...`
- `Missing dependency: @minecraft/server ...`
- `Pack format version mismatch`

**Правило:** прочитайте текст ошибки полностью и откорректируйте целевые версии в `scripts/targets.mjs`, затем пересоберите:

1. Откройте `scripts/targets.mjs`.
2. Обновите одну из трёх констант:
   - `MIN_ENGINE_VERSION` — если ошибка про версию движка
   - `SERVER_API_VERSION` — если ошибка про `@minecraft/server`
   - `BDS_VERSION` — если ошибка в Docker про версию сервера
3. Запустите `npm ci && npm run build` и повторите проверку.

**Важно:** не включайте Beta или Preview API (`-beta.N`, `-preview.N`) для облегчения ошибок. Это скроет реальную несовместимость вместо её исправления. Целевые версии должны точно совпадать с тем, что установлено на устройстве.

## 6. Структура проекта

```
.
├── README.md                       Этот файл
├── package.json                    Зависимости и npm-скрипты
├── tsconfig.json                   Настройки TypeScript
├── scripts/
│   ├── targets.mjs                 Единственный источник версий (MIN_ENGINE_VERSION, SERVER_API_VERSION, BDS_VERSION)
│   ├── build.mjs                   Сборка .mcaddon
│   ├── validate.mjs                Валидация JSON
│   ├── build-clean-clone.sh        Сборка из чистого клона
│   ├── bds-check.mjs               Проверка BDS и логов
│   └── bds.sh                      Управление Docker контейнером BDS (up/down/logs)
├── src/
│   └── main.ts                     Точка входа скрипта TypeScript
├── tests/
│   └── *.test.mjs                  Unit-тесты
├── packs/
│   ├── behavior/
│   │   ├── manifest.json           Manifest behaviour pack
│   │   ├── items/                  Определения кастомных предметов
│   │   ├── recipes/                Рецепты крафта
│   │   ├── scripts/                Собранный вывод TypeScript (gitignored)
│   │   └── texts/                  Локализация (en_US.lang, ru_RU.lang)
│   └── resource/
│       ├── manifest.json           Manifest resource pack
│       ├── textures/               Иконки и текстуры
│       ├── texts/                  Локализация (en_US.lang, ru_RU.lang)
│       └── particles/              (если есть кастомные частицы)
├── dist/                           Выходная папка (gitignored)
│   └── andrew.mcaddon              Собранный архив с обоими пакетами
├── docker/
│   └── bds/
│       ├── compose.yaml            Docker Compose для BDS
│       ├── server.properties       Настройки сервера
│       └── data/                   Директория сервера (gitignored)
└── .gitignore                      Исключения из git (node_modules/, dist/, docker/bds/data/)
```

**Ключевые файлы:**
- `scripts/targets.mjs` — обновляйте версии только здесь
- `packs/behavior/manifest.json` и `packs/resource/manifest.json` — синхронизируются с `targets.mjs` при сборке
- `src/main.ts` — основной скрипт; компилируется в `packs/behavior/scripts/main.js`
- `.mcaddon` — это обычный ZIP-архив с обоими пакетами; можно распаковать для отладки

---

**Начало работы:** `npm ci && npm run build && npm run bds:check` запустит полный цикл сборки и проверки на Mac и в Docker.
