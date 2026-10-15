# Taxi App

Система замовлення таксі: застосунок пасажира, застосунок водія та панель адміністратора.

Репозиторій містить проєктну документацію (вимоги, архітектура, архітектурні рішення) і клікабельний прототип інтерфейсів.

## Структура

```
taxi-app/
├── apps/
│   ├── passenger/      прототип застосунку пасажира
│   ├── driver/         прототип застосунку водія
│   └── admin/          прототип панелі адміністратора
├── packages/
│   └── shared/         спільні тарифи, розрахунок вартості, стилі
├── services/           опис бекенд-сервісів (C2)
└── docs/
    ├── overview.md     бачення, ролі, межі MVP
    ├── requirements/   функціональні, нефункціональні вимоги, обмеження
    ├── project/        бюджет
    ├── architecture/   C4-модель (C1–C3) і ADR
    └── glossary.md
```

## Документація

| Розділ | Файл |
|---|---|
| Огляд проєкту | [docs/overview.md](docs/overview.md) |
| Функціональні вимоги | [docs/requirements/functional.md](docs/requirements/functional.md) |
| Нефункціональні вимоги | [docs/requirements/non-functional.md](docs/requirements/non-functional.md) |
| Обмеження | [docs/requirements/constraints.md](docs/requirements/constraints.md) |
| Бюджет | [docs/project/budget.md](docs/project/budget.md) |
| Архітектура (C4) | [docs/architecture/README.md](docs/architecture/README.md) |
| Архітектурні рішення (ADR) | [docs/architecture/adr/README.md](docs/architecture/adr/README.md) |
| Глосарій | [docs/glossary.md](docs/glossary.md) |

## Запуск прототипу

Прототип не має залежностей і працює без збирання. Найпростіше — відкрити файл у браузері:

- `apps/passenger/index.html`
- `apps/driver/index.html`
- `apps/admin/index.html`

Або підняти локальний сервер з кореня репозиторію:

```bash
npm start
# http://localhost:3000/apps/passenger/
```

Прототип імітує основні сценарії на фіктивних даних: бекенду, карт і реальних платежів у ньому немає. Цільова реалізація описана в [docs/architecture](docs/architecture/README.md).
