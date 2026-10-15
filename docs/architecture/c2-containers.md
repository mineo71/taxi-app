# C2 — Container diagram: система замовлення таксі

Систему розкрито на окремі застосунки й сервіси, кожен зі своєю технологією: мобільні клієнти, шлюз, сервіс реального часу, чотири внутрішні сервіси та три сховища.

**Контейнер** у C4 — це не Docker, а окремо запущена одиниця, всередині якої виконується код або зберігаються дані. Критерій простий: якщо щось можна зупинити й перезапустити незалежно від решти — це окремий контейнер. Застосунок на телефоні — теж контейнер. Бібліотека чи модуль усередині процесу контейнером не є.

```mermaid
flowchart TB
  passenger["<b>Пасажир</b><br/>[Person]"]
  driver["<b>Водій</b><br/>[Person]"]
  operator["<b>Оператор підтримки</b><br/>[Person]"]

  subgraph boundary["Система замовлення таксі [Software System]"]
    direction TB
    passengerApp["<b>Застосунок пасажира</b><br/>[Container: Flutter]<br/><br/>Замовлення поїздки, карта, оплата, оцінка"]
    driverApp["<b>Застосунок водія</b><br/>[Container: Flutter]<br/><br/>Прийом замовлень, навігація, заробіток"]
    adminApp["<b>Панель адміністратора</b><br/>[Container: React]<br/><br/>Модерація водіїв, тарифи, аналітика"]

    gateway["<b>API Gateway</b><br/>[Container: Node.js]<br/><br/>Єдина точка входу: автентифікація,<br/>перевірка прав, маршрутизація запитів"]
    realtime["<b>Сервіс реального часу</b><br/>[Container: Node.js, WebSocket]<br/><br/>Передає позицію авто на карту пасажира"]

    orders["<b>Сервіс замовлень</b><br/>[Container: Node.js]<br/><br/>Життєвий цикл поїздки<br/>і розрахунок вартості"]
    matching["<b>Сервіс підбору водіїв</b><br/>[Container: Go]<br/><br/>Знаходить найближче вільне авто"]
    payment["<b>Сервіс оплати</b><br/>[Container: Node.js]<br/><br/>Списання коштів, чеки, повернення"]
    notify["<b>Сервіс сповіщень</b><br/>[Container: Node.js]<br/><br/>Сповіщення на телефон<br/>і коди підтвердження"]

    db[("<b>Основна база даних</b><br/>[Container: PostgreSQL]<br/><br/>Користувачі, поїздки, тарифи")]
    redis[("<b>Кеш і географічний індекс</b><br/>[Container: Redis]<br/><br/>Позиції вільних водіїв")]
    kafka[("<b>Черга повідомлень</b><br/>[Container: Kafka]<br/><br/>Обмін подіями між сервісами")]
  end

  maps["<b>Картографічний сервіс</b><br/>[External Software System]"]
  smsPush["<b>Сервіс сповіщень і коротких повідомлень</b><br/>[External Software System]"]
  gatewayPay["<b>Платіжний шлюз</b><br/>[External Software System]"]

  passenger -- "Замовляє поїздку<br/>[HTTPS / JSON]" --> passengerApp
  driver -- "Приймає замовлення<br/>[HTTPS / JSON]" --> driverApp
  operator -- "Керує системою<br/>[HTTPS / JSON]" --> adminApp

  passengerApp -- "Викликає запити<br/>[HTTPS / JSON]" --> gateway
  driverApp -- "Викликає запити<br/>[HTTPS / JSON]" --> gateway
  adminApp -- "Викликає запити<br/>[HTTPS / JSON]" --> gateway
  driverApp -- "Надсилає позицію<br/>[WebSocket]" --> realtime
  realtime -- "Передає позицію авто<br/>[WebSocket]" --> passengerApp

  gateway -- "Створює і веде поїздку<br/>[gRPC]" --> orders
  gateway -- "Надсилає коди входу<br/>[gRPC]" --> notify
  orders -- "Запитує водія<br/>[gRPC]" --> matching
  orders -- "Ініціює оплату<br/>[gRPC]" --> payment

  orders -- "Читає і записує дані<br/>[SQL / TCP]" --> db
  orders -- "Публікує події поїздки<br/>[Kafka protocol]" --> kafka
  matching -- "Шукає найближчих водіїв<br/>[Redis protocol]" --> redis
  realtime -- "Оновлює позиції водіїв<br/>[Redis protocol]" --> redis
  notify -- "Читає події<br/>[Kafka protocol]" --> kafka
  payment -- "Читає події<br/>[Kafka protocol]" --> kafka

  orders -- "Запитує маршрут<br/>[HTTPS / REST]" --> maps
  notify -- "Надсилає сповіщення і коди<br/>[HTTPS / REST]" --> smsPush
  payment -- "Списує кошти<br/>[HTTPS / REST]" --> gatewayPay

  classDef person fill:#08427b,stroke:#052e56,color:#ffffff
  classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef store fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef external fill:#8a8a8a,stroke:#6b6b6b,color:#ffffff
  class passenger,driver,operator person
  class passengerApp,driverApp,adminApp,gateway,realtime,orders,matching,payment,notify container
  class db,redis,kafka store
  class maps,smsPush,gatewayPay external
  style boundary fill:none,stroke:#0b4884,stroke-dasharray:6 4
```

## Склад діаграми

**Клієнтський ряд.** Три застосунки для трьох ролей: пасажирський і водійський на Flutter, адмінка на React. Вони окремі, бо сценарії принципово різні: водієві потрібне фонове відстеження позиції й робота офлайн, пасажирові — ні. Див. [ADR-0003](adr/0003-flutter-and-react-clients.md).

**API Gateway.** Єдина точка входу для всіх трьох клієнтів. Бере на себе те, що інакше довелося б дублювати в кожному сервісі: перевірку токена, права доступу, обмеження частоти запитів, маршрутизацію. Див. [ADR-0004](adr/0004-api-gateway-single-entry-point.md).

**Сервіс реального часу.** Винесений окремо від шлюзу. Звичайні запити живуть частки секунди, а WebSocket-з'єднання висить годинами, поки триває поїздка. Масштабуються вони теж по-різному: шлюз — за кількістю запитів, сервіс реального часу — за кількістю активних з'єднань. Див. [ADR-0005](adr/0005-separate-realtime-service.md).

**Чотири внутрішні сервіси.** Поділ іде за зонами відповідальності, а не за сутностями бази. Див. [ADR-0006](adr/0006-services-by-responsibility.md).

**Три сховища.** PostgreSQL — джерело істини: користувачі, поїздки, тарифи, платежі. Redis — позиції вільних водіїв, які змінюються кожні кілька секунд. Kafka — асинхронний обмін подіями між сервісами. Див. [ADR-0007](adr/0007-postgresql-as-source-of-truth.md), [ADR-0008](adr/0008-redis-geo-index-for-driver-positions.md), [ADR-0009](adr/0009-kafka-for-async-events.md).

## Контейнери

| Контейнер | Технологія | Відповідальність | Як масштабується | Вимоги |
|---|---|---|---|---|
| Застосунок пасажира | Flutter | Замовлення, карта, оплата, оцінка | — | FR-1 … FR-19 |
| Застосунок водія | Flutter | Прийом замовлень, навігація, заробіток | — | FR-20 … FR-28 |
| Панель адміністратора | React | Модерація, тарифи, аналітика | — | FR-29 … FR-34 |
| API Gateway | Node.js | Автентифікація, права, rate limiting, маршрутизація | За кількістю запитів | NFR-3, NFR-11, NFR-13, NFR-14 |
| Сервіс реального часу | Node.js, WebSocket | Позиція авто й статуси поїздки наживо | За кількістю активних з'єднань | FR-10, NFR-2 |
| Сервіс замовлень | Node.js | Життєвий цикл поїздки, вартість, скасування | За кількістю поїздок | FR-5, FR-9, FR-24, FR-37 |
| Сервіс підбору водіїв | Go | Пошук найближчого вільного авто | За кількістю пошуків | FR-22, FR-35, NFR-1 |
| Сервіс оплати | Node.js | Списання, чеки, повернення | За кількістю платежів | FR-15, FR-18, FR-32, NFR-12 |
| Сервіс сповіщень | Node.js | Push-сповіщення, коди підтвердження | За кількістю подій | FR-1, FR-14 |
| Основна база даних | PostgreSQL | Користувачі, поїздки, тарифи, платежі | Репліки для читання | NFR-10 |
| Кеш і геоіндекс | Redis | Позиції вільних водіїв | Кластер | NFR-1 |
| Черга повідомлень | Kafka | Події між сервісами | Партиції | NFR-8 |

Попередній рівень: [C1 — System Context](c1-system-context.md). Наступний рівень: [C3 — Components](c3-order-service.md).
