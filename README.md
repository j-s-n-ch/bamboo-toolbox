# Walkscape Gear

Gear optimiser and loadout planner for [Walkscape](https://walkscape.app/), the mobile walking MMO.

**Live at [gear.walkscape.app](https://gear.walkscape.app/)** - in production since mid-2025, with ~150 daily active users.

This repository is one half of a two-part build: Walkscape Gear consumes a private game-data API (also written by me, hosted in a separate repo) which exposes game data to authorised tools. The API is deliberately constrained; no bulk fetches, no full-data dumps, so this client is built around those boundaries on purpose: minimal item lists on bootstrap, detail records hydrated by id on demand, aggressive caching, and all heavy game-math pushed to the client so the UI stays responsive.

---

## What it does

- **Build optimal gear sets** for any in-game activity using a priority-driven optimisation pass.
- **Compare loadouts** with detailed stat-impact analysis across activities.
- **Track owned items, levels and faction reputation** derived from game data exports or entered manually.
- **Inspect activity drops, loot tables and chest contents** with success-rate maths.
- **Plan recipes and crafting** with quality outcome odds and material-cost analysis.
- **Optimised travel route pathfinding** between locations.
- **Share loadouts via export** directly to the game, or quick links via URL. The entire app state encodes into a compressed link.

---

## Engineering highlights

This is the section worth reading if you're evaluating the codebase. Each bullet links to where it lives in the repo.

- **Pure domain layer** ([`frontend/src/domain/`](frontend/src/domain/)). All game math lives in a Vue/Pinia-free TypeScript module; gear stat aggregation, effective-attribute calculations, scoring, loot-table odds, level bonuses, requirement checking, travel routing. ~70 files across `character/`, `gear/`, `lootTables/`, `optimiser/`, `quality/`, `recipe/`, `stats/`, `travel/`, etc. No reactive references, no side effects, no network calls. The domain is a reusable game-logic library that happens to be mounted in a Vue app. See [`frontend/src/domain/README.md`](frontend/src/domain/README.md) for the explicit constraints it enforces.

- **Optimiser / Quick Set** ([`frontend/src/domain/optimiser/`](frontend/src/domain/optimiser/), [`frontend/src/composables/optimiser/`](frontend/src/composables/optimiser/)). Multi-phase algorithm: filter dominated items per slot, score combinations against a configurable priority (xp/step, steps/reward-roll, crafts/material, balanced, etc.). Uses a priority queue (`@datastructures-js/priority-queue`) for the search frontier. An advanced multi-target variant with weighted scoring is being shipped in phases.

- **Web Worker isolation** ([`frontend/src/workers/optimiser.worker.ts`](frontend/src/workers/optimiser.worker.ts), [`optimiserWorkerTypes.ts`](frontend/src/workers/optimiserWorkerTypes.ts)). The optimiser runs off the main thread via a fully-typed message protocol. Because the underlying logic is pure functions in `domain/`, it's testable without a Worker harness.

- **Layered caching matched to API constraints**. The frontend stores cache minimal item lists at boot and hydrate detail records by id on demand; the backend caches Game API responses; settings and user state are persisted by user UUID. The architecture is shaped by the API's deliberate refusal to allow bulk fetches.

- **URL-encoded shareable state** ([`frontend/src/domain/gearSetExport.ts`](frontend/src/domain/gearSetExport.ts), [`frontend/src/composables/useUrlMap.ts`](frontend/src/composables/useUrlMap.ts)). Full app state; character, gear sets, activity selection, settings. Round-trips through `pako`-compressed URLs. Components don't know URLs exist; the URL store handles encode/decode.

- **Undo/redo via composable** ([`frontend/src/composables/useUndoRedoShortcuts.ts`](frontend/src/composables/useUndoRedoShortcuts.ts)). History tracking is wired through the activity and gear-set stores rather than baked into individual components.

- **Type discipline end-to-end**. Full TypeScript across frontend and backend; domain types in [`frontend/src/domain/types/`](frontend/src/domain/types/) including a shared `db.ts` mirroring the Prisma schema. Worker protocol types are explicit. Requirement checking is exhaustive on the discriminant `requirement.type`.

- **Architectural inversion: logic on the client**. The backend (Express + Prisma) is deliberately thin. It orchestrates Game API calls, batches by id, caches, and persists user state. It does not contain a single line of game logic. See [`ai-dev/rules/backend.md`](ai-dev/rules/backend.md) and [`ai-dev/rules/frontend.md`](ai-dev/rules/frontend.md) for the rules that enforce this split.

- **Tested where it matters**. ~50 Vitest spec files in [`frontend/test/`](frontend/test/). predominantly domain logic (optimiser, loot tables, character import, gear aggregation, comparisons, routing, quality outcomes), plus a handful of component and composable tests. Test fixtures use realistic in-game data.

---

## Tech stack

**Frontend**: Vue 3 (Composition API), Pinia, TypeScript, Vite, SCSS, Vitest, axios, pako, `@datastructures-js/priority-queue`. No UI framework; components are hand-built mimicing the look and feel of the game.

**Backend**: Node.js, Express, Prisma 7 + PostgreSQL 17, Helmet, Vitest. Generated Prisma client deliberately excluded from version control.

**Infrastructure**: Docker Compose with three profiles (`docker/local/`, `docker/build-test/`, `docker/main/`), GitHub Actions for image builds, images published to `ghcr.io`.

---

## Architecture overview

The data flow is the inverse of many web apps:

1. **App bootstrap**: frontend stores fetch minimal lists from the backend, which proxies the Walkscape Game API. Backend caches responses to respect API constraints.
2. **Detail hydration**: full item / activity / location records are fetched by id when needed and held in store caches.
3. **Domain calculations**: components ask the [`domain/`](frontend/src/domain/) layer for gear effectiveness, scores, comparisons. Domain is pure and framework-agnostic.
4. **Persistence**: user state (gear sets, history, settings) is kept locally and synced to Postgres via the backend. Backend routes delegate to controllers, which delegate to services, which call the API or Prisma. No game logic ever lives in the backend.

The architectural rules are documented and enforced via [`ai-dev/rules/architecture.md`](ai-dev/rules/architecture.md), [`ai-dev/rules/frontend.md`](ai-dev/rules/frontend.md), and [`ai-dev/rules/backend.md`](ai-dev/rules/backend.md).

---

## Getting started

### Prerequisites

- Node.js (matching the version expected by Vite 5 and Prisma 7. recent LTS is fine).
- Docker + Docker Compose.
- A GitHub Personal Access Token with `read:packages` and `repo` scopes (needed to pull the upstream `walkscape-tools-server` image from `ghcr.io`).

### 1. Authenticate Docker against `ghcr.io`

```bash
docker login ghcr.io
# Username: your GitHub username
# Password: the PAT
```

### 2. Spin up Postgres + the upstream Game API container

```bash
cp docker/local/.env_template docker/local/.env
docker compose -f docker/local/docker-compose.yaml --env-file docker/local/.env up -d
```

This starts Postgres on `5432` and the Walkscape tools server on `3000`. The frontend and backend run locally on the host (not in Docker) for fast reloads.

### 3. Backend

```bash
cd backend
cp .env_template .env
npm install
npx prisma generate    # generated client is gitignored. Must run before first start
npm run dev            # nodemon on src/index.js, listens on 3001
```

Database migrations and seeding can be run via `npm run seed`; `npm run reset-db-dev` resets the dev database.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev            # Vite dev server on 5173
```

### 5. Open the app

Frontend at <http://localhost:5173> talks to the backend at <http://localhost:3001>, which talks to the local Walkscape tools server at <http://localhost:3000>.

### Production-style local run

`docker/main/docker-compose.yaml` runs frontend, backend and Postgres as containers using images published to `ghcr.io/schamppu/walkscape-gear-*`. This is what the live deployment uses.

---

## Project structure

```
.
├── frontend/                    Vue 3 + TypeScript SPA
│   ├── src/
│   │   ├── domain/              Pure game logic. No Vue, no Pinia, no side effects.
│   │   ├── store/               Pinia stores: API caching, user state, undo/redo.
│   │   ├── composables/         Vue composables that bridge stores and domain.
│   │   ├── components/          UI. Hub, Gear (incl. optimiser), Activity, Recipes, etc.
│   │   ├── workers/             Web Worker entry points. Optimiser runs off-thread.
│   │   └── utils/               Generic helpers (URL encoding, intersect, etc.).
│   └── test/                    Vitest specs, mirrored against src/domain.
├── backend/                     Express + Prisma orchestrator. No game logic.
│   ├── src/
│   │   ├── routes/              HTTP layer.
│   │   ├── controllers/         Request orchestration.
│   │   ├── services/            Game API + DB access.
│   │   └── generated/           Prisma client output (gitignored).
│   └── prisma/                  Schema, migrations, seed script.
├── docker/                      Compose configurations (local / build-test / main).
└── ai-dev/                      Architecture rules and design notes.
```

---

## Built by

**Juhana Autti** - sole developer.
GitHub: [@auttij](https://github.com/auttij) · LinkedIn: [auttij](https://www.linkedin.com/in/auttij/)

---

## Credits & licensing

Walkscape Gear is an officially blessed companion tool: it's hosted on infrastructure provided by **[Not A Cult Oy](https://walkscape.app/)**, the studio behind Walkscape, and built on top of an API reading game files, hosted in a separate repository. All Walkscape game data, art and IP belongs to Not A Cult Oy.

The source in this repository is **© Juhana Autti, all rights reserved**. It's published here for portfolio review and is not currently licensed for reuse, redistribution, or modification.
