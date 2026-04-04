# Productivity App — Scan Report

**Scanned**: 2026-04-04
**Scanner**: project-scanner skill
**Repo**: `/Users/brijendrasingh/Documents/celigo-official-donotdelete/repos/forked/playground/scratch-work/productivity-app`

## Project Summary

A comprehensive personal productivity application combining todo management, digital diary, blog authoring, bullet journaling, Eisenhower Matrix prioritization, and analytics — all with Material Design theming and authentication.

- **Architecture**: npm workspaces monorepo (`shared/` → `backend/` → `frontend/`)
- **Language**: TypeScript 5.9.3 throughout
- **Frontend**: React 18 + Vite 7 + MUI 6 + Recharts + React Router v7
- **Backend**: Express 4 + SQLite3 (sqlite3 driver, WAL mode)
- **Shared**: Types, constants, utility classes (DateUtils, EisenhowerUtils, TextUtils, ValidationUtils)
- **Infrastructure**: Docker multi-stage build, docker-compose (dev, prod, sqlite-web)
- **Auth**: Custom API tokens (Bearer), bcryptjs password hashing
- **Testing**: 1 Playwright E2E spec, zero unit tests
- **Linting/Formatting**: None configured
- **CI/CD**: None

## File Inventory

| Category      | Count |
| ------------- | ----- |
| `.ts` files   | 45    |
| `.tsx` files  | 18    |
| `.md` files   | 28    |
| `.json` files | 13    |
| `.sh` scripts | 6     |
| `.js` files   | 8     |

### Backend (`backend/src/` — 20 files)

| Directory      | Files                                                                   | Role                                                                           |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `config/`      | `database.ts`                                                           | SQLite connection, schema DDL, promise wrappers (`dbGet`, `dbAll`, `dbRun`)    |
| `middleware/`  | `auth.ts`, `validation.ts`                                              | Bearer token auth, express-validator batch runner                              |
| `routes/`      | 8 files (auth, todos, categories, tags, diary, bullet, blog, analytics) | HTTP method + path mapping, middleware wiring                                  |
| `controllers/` | 8 files (matching routes)                                               | Business logic + SQL queries                                                   |
| root           | `index.ts`                                                              | Express app, middleware chain, route mounting, SPA fallback, graceful shutdown |

### Frontend (`frontend/src/` — 26 files)

| Directory     | Files                                   | Role                                                                                                           |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `components/` | 12 files across 8 subdirs               | UI views: Landing, Dashboard, Todo, Matrix, Diary, BulletJournal, Blog, Analytics, Auth, Layout, ErrorBoundary |
| `hooks/`      | 5 files                                 | `useTodos`, `useDiary`, `useBulletJournal`, `useBlog`, `useAnalytics`                                          |
| `contexts/`   | 2 files                                 | `AuthContext` (user/token/login/logout), `ThemeContext` (dark/light mode)                                      |
| `services/`   | `api.ts`                                | Typed fetch wrapper with 401 handling, grouped API functions                                                   |
| `theme/`      | `theme.ts`                              | MUI createTheme (light/dark), color constants for quadrants/priorities/statuses                                |
| root          | `index.tsx`, `App.tsx`, `vite-env.d.ts` | Entry, routing, Vite types                                                                                     |

### Shared (`shared/src/` — 7 files)

| File                       | Exports                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `types/index.ts`           | All entity types, DTOs, API response types (13 tables worth)                                         |
| `constants/index.ts`       | `BULLET_SYMBOLS`, `EISENHOWER_QUADRANTS`, `PRIORITY_LEVELS`, `API_ENDPOINTS`, `APP_CONFIG`, defaults |
| `utils/DateUtils.ts`       | Date formatting, parsing, ranges (uses date-fns)                                                     |
| `utils/EisenhowerUtils.ts` | Quadrant calculation, grouping, validation                                                           |
| `utils/TextUtils.ts`       | Word count, reading time, slugify, markdown stripping                                                |
| `utils/ValidationUtils.ts` | Email, password, username, field validation                                                          |

## Database Schema (13 tables)

| Table                | Key Columns                                                                                     | Notes                                   |
| -------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| `users`              | id, username, email, password_hash, api_token, preferences                                      | Token-based auth                        |
| `categories`         | id, user_id, name, color, icon                                                                  | UNIQUE(user_id, name)                   |
| `tags`               | id, user_id, name, color                                                                        | UNIQUE(user_id, name)                   |
| `todos`              | id, user_id, category_id, title, status, priority, urgency, importance, quadrant, bullet_symbol | Eisenhower + bullet fields              |
| `todo_tags`          | todo_id, tag_id                                                                                 | Junction table                          |
| `diary_entries`      | id, user_id, date, content, mood, energy_level, weather                                         | UNIQUE(user_id, date)                   |
| `events`             | id, user_id, title, date, type                                                                  | Bullet journal events                   |
| `bullet_logs`        | id, user_id, date, type, content                                                                | daily/weekly/monthly/yearly/future logs |
| `blog_categories`    | id, user_id, name, slug, parent_id                                                              | Hierarchical, **no CRUD API**           |
| `blog_posts`         | id, user_id, title, slug, content, status, view_count                                           | UNIQUE(user_id, slug)                   |
| `blog_post_tags`     | post_id, tag_id                                                                                 | Junction table                          |
| `writing_sessions`   | id, blog_post_id, duration_minutes, word_count                                                  | **Never written to**                    |
| `quadrant_analytics` | id, user_id, date, quadrant, completed_count, time_spent                                        | **Never populated**                     |

## API Endpoints (38+ routes across 8 groups)

| Group      | Base Path         | Auth  | Key Operations                                                 |
| ---------- | ----------------- | ----- | -------------------------------------------------------------- |
| Auth       | `/api/auth`       | Mixed | register, login, logout, verify, profile                       |
| Todos      | `/api/todos`      | All   | CRUD + search/filter/paginate, tag association                 |
| Categories | `/api/categories` | All   | CRUD                                                           |
| Tags       | `/api/tags`       | All   | CRUD + get todos by tag                                        |
| Diary      | `/api/diary`      | All   | List, get/upsert/delete by date                                |
| Bullet     | `/api/bullet`     | All   | Logs (get/upsert by date+type), events CRUD, todo symbol patch |
| Blog       | `/api/blog`       | All   | CRUD + publish toggle, view count increment                    |
| Analytics  | `/api/analytics`  | All   | dashboard, matrix, trends, writing, diary stats                |

## Architecture Patterns

### Backend

- **Fat controllers**: Business logic + SQL queries live together, no service layer
- **Promise-wrapped SQLite**: `dbGet`/`dbAll`/`dbRun` from `config/database.ts`
- **User scoping**: Every query includes `WHERE user_id = ?`
- **Auth**: Bearer token from DB lookup, dev shortcut (`dev`/`dev` → fixed `dev-token`)
- **Validation**: `express-validator` chains per route, `validate()` middleware
- **Error handling**: try/catch in controllers, generic 500s, some 409 for UNIQUE violations

### Frontend

- **Custom hooks**: One per feature domain, useState/useEffect/useCallback with `mountedRef` guard
- **API service**: Centralized fetch wrapper with Bearer token from localStorage
- **Context**: AuthContext (verify on mount, 401 global handler), ThemeContext (dark/light persistence)
- **Cross-component events**: FAB dispatches `CustomEvent`s, views listen via `useEffect`
- **MUI theming**: Full light/dark theme with color maps for quadrants/priorities/statuses
- **Responsive**: `useMediaQuery` for drawer/dialog breakpoints

### Shared

- **Type contract**: All DTOs, entities, and response types in `shared/src/types/`
- **Constants contract**: API endpoints, config values, display metadata
- **Build dependency**: `shared` must build before both `backend` and `frontend`

## Known Implementation Gaps

| #   | Gap                                  | Severity | Details                                                                                   |
| --- | ------------------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| 1   | `blog_categories` has no API         | Medium   | Table and FK exist, blog queries join it, but no CRUD routes                              |
| 2   | `writing_sessions` never written     | Medium   | Table exists, analytics reads it, but no controller creates sessions                      |
| 3   | `quadrant_analytics` never populated | Medium   | Table exists, matrix analytics reads it, daily aggregates never computed                  |
| 4   | Route params not wired               | Low      | `/todos/:id` not read by TodoView, `/diary/:date` not synced, `/blog/:slug` parsed as int |
| 5   | Dev credentials hardcoded            | Low      | `DEV_USERNAME`/`DEV_PASSWORD`/`DEV_TOKEN` in authController — fine for dev, not for prod  |
| 6   | No service layer                     | Low      | Controllers contain inline SQL — acceptable at current scale                              |
| 7   | `docs/agent.md` all placeholders     | Info     | Engineering memory not populated after bootstrap                                          |

## Quality Gaps

| #   | Gap                                            | Severity |
| --- | ---------------------------------------------- | -------- |
| 1   | Zero unit tests                                | High     |
| 2   | Only 1 E2E spec (bullet journal symbols only)  | High     |
| 3   | No ESLint configuration                        | Medium   |
| 4   | No Prettier configuration                      | Medium   |
| 5   | No CI/CD pipeline                              | Medium   |
| 6   | No Vitest/Jest configured                      | Medium   |
| 7   | Inconsistent error handling across controllers | Low      |

## Discovered Domains

### 1. fullstack-feature-dev

End-to-end feature development across the monorepo. Covers adding/modifying entities that span shared types, backend API, and frontend UI.

- **Key files**: `shared/src/types/`, `shared/src/constants/`, `backend/src/controllers/`, `backend/src/routes/`, `frontend/src/hooks/`, `frontend/src/components/`, `backend/src/config/database.ts`
- **Repeatable workflows**: Add entity, add field, wire unused table, fix data-flow bug
- **Complexity**: High — touches 3 packages, requires understanding build order, type contracts, SQL patterns, React hook patterns

### 2. playwright-qa

Testing and QA across the app. Playwright E2E tests and unit test infrastructure setup.

- **Key files**: `frontend/bullet-journal.spec.ts`, `frontend/playwright.config.ts`, potential `*.spec.ts` and `vitest.config.ts`
- **Repeatable workflows**: Write E2E spec, add unit tests, set up test infrastructure, debug failing tests
- **Complexity**: Medium — requires knowledge of auth test patterns, app feature flows, Playwright API

### 3. bug-investigator

Cross-stack debugging: tracing issues from frontend symptoms through API middleware to SQLite queries.

- **Key files**: All (read-only diagnostic), especially `backend/src/middleware/`, `backend/src/config/database.ts`, `frontend/src/services/api.ts`, `frontend/src/contexts/AuthContext.tsx`
- **Repeatable workflows**: Trace bugs, diagnose API errors, debug auth issues, investigate data inconsistencies
- **Complexity**: High — requires understanding the full request lifecycle and common failure modes

### 4. code-quality-infra

Code quality tooling and infrastructure: linting, formatting, CI/CD, test framework setup, error handling standardization.

- **Key files**: Config files at repo root, `.github/workflows/`, `Dockerfile`, `docker-compose.yml`
- **Repeatable workflows**: Set up ESLint/Prettier, configure Vitest, create CI pipeline, add pre-commit hooks, standardize errors
- **Complexity**: Medium — one-time setup with ongoing enforcement

## User Validation Status

- Domains proposed: 4
- Awaiting user confirmation: No (approved in planning phase)
- Priority order: fullstack-feature-dev → playwright-qa → bug-investigator → code-quality-infra
