# Remaining Issues

Last updated: 2026-04-04

## Open Issues

No open issues at this time. All 7 original issues have been resolved (see below).

## Resolved Issues

| # | Issue | Severity | Component | Resolution | Date |
|---|-------|----------|-----------|------------|------|
| 1 | `blog_categories` table has no CRUD API | Medium | Backend | Created `blogCategoryController.ts` + `blogCategories.ts` routes with full CRUD. Added `CreateBlogCategoryRequest`/`UpdateBlogCategoryRequest` DTOs, `API_ENDPOINTS` entries, and `blogCategoriesApi` in frontend. Mounted at `/api/blog-categories`. | 2026-04-04 |
| 2 | `writing_sessions` never populated | Medium | Backend | Created `writingSessionController.ts` + `writingSessions.ts` routes with `POST` (start session) and `PATCH :id` (end session with auto-computed productivity score). Added DTOs, endpoints, and frontend API. Mounted at `/api/writing-sessions`. | 2026-04-04 |
| 3 | `quadrant_analytics` never populated | Medium | Backend | Added upsert logic in `todoController.update()` — when status transitions to `completed`, upserts into `quadrant_analytics` for the current date and quadrant, incrementing `tasks_completed` and adding `time_spent`. | 2026-04-04 |
| 4 | `/todos/:id` route param not consumed | Low | Frontend | `TodoView` now reads `:id` via `useParams()` and passes `highlightId` to `TodoList`. `TodoList` scrolls to and visually highlights the matching card with a focus ring. | 2026-04-04 |
| 5 | `/diary/:date` route param not synced | Low | Frontend | `DiaryView` now reads `:date` via `useParams()`, parses it with `parseISO()`, and syncs with `setSelectedDate`. Date navigation updates the URL via `navigate()` with `replace: true`. | 2026-04-04 |
| 6 | `/blog/:slug` treated as numeric ID | Low | Frontend | Renamed route param from `:slug` to `:id` in `App.tsx`. Updated `BlogView` to destructure `{ id }` instead of `{ slug }`. Matches the existing numeric ID navigation pattern. | 2026-04-04 |
| 7 | Dev credentials hardcoded | Low | Backend | Gated dev-login shortcut behind `NODE_ENV !== 'production'` check in `authController.ts`. Added startup warning log when dev credentials are active. | 2026-04-04 |

## Technical Debt

| # | Item | Priority | Component | Details |
|---|------|----------|-----------|---------|
| 1 | No ESLint configuration | Medium | All | Zero linting across the monorepo. TypeScript strict mode provides some safety but style/pattern enforcement is missing. |
| 2 | No Prettier configuration | Medium | All | No automated formatting. Code style is manually maintained. |
| 3 | No CI/CD pipeline | Medium | Infrastructure | No GitHub Actions or other automated checks. Tests, lint, and build are manual-only. |
| 4 | No unit test framework | High | All | No Vitest or Jest configured. Zero unit test coverage. |
| 5 | Near-zero E2E coverage | High | Frontend | Only 1 Playwright spec (`bullet-journal.spec.ts`) covering symbol toolbar. Auth, todos, diary, blog, matrix, analytics, categories, tags — all untested. |
| 6 | Fat controllers with inline SQL | Low | Backend | Controllers mix HTTP handling, business logic, and database queries. No service layer. Acceptable at current scale but limits testability. |
| 7 | Inconsistent error handling | Low | Backend | Some controllers return 409 for UNIQUE violations, others return generic 500. No shared `AppError` class. Controllers catch errors internally rather than using `next(err)` to the global handler. |
| 8 | No pre-commit hooks | Low | Infrastructure | No husky/lint-staged to catch issues before commit. |

## Known Limitations

| # | Limitation | Details |
|---|-----------|---------|
| 1 | Single-process architecture | Express server handles API + static files in production. No worker processes, no background jobs. |
| 2 | SQLite concurrency | WAL mode handles concurrent reads but write concurrency is limited. Sufficient for single-user or low-traffic use. |
| 3 | No real-time updates | No WebSocket or SSE. Changes by one client aren't reflected in another until page refresh. |
| 4 | No data export/import | No way to back up or migrate user data outside of copying the SQLite file. |
| 5 | No password reset | No email integration for password recovery. Lost password requires direct DB access. |

## Improvement Proposals

| # | Proposal | Impact | Effort | Status |
|---|----------|--------|--------|--------|
| 1 | Set up ESLint + Prettier | Enforces consistent code style, catches common errors | Medium | Proposed — use `code-quality-infra` specialist |
| 2 | Set up Vitest for unit testing | Enables testable controllers and utility functions | Medium | Proposed — use `playwright-qa` specialist for initial Vitest config |
| 3 | Write E2E specs for core features | Catches regressions in auth, todos, diary, blog flows | High | Proposed — use `playwright-qa` specialist |
| 4 | Wire up `blog_categories` API | Completes the blog feature as designed in schema | Medium | **Done** — resolved 2026-04-04 |
| 5 | Implement `writing_sessions` tracking | Makes writing analytics functional | Medium | **Done** — resolved 2026-04-04 |
| 6 | Create GitHub Actions CI pipeline | Automates lint, type-check, test, build on every push | Medium | Proposed — use `code-quality-infra` specialist |
