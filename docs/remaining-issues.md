# Remaining Issues

Last updated: 2026-04-04

## Open Issues

| # | Issue | Severity | Component | Details |
|---|-------|----------|-----------|---------|
| 1 | `blog_categories` table has no CRUD API | Medium | Backend | Table exists with FK from `blog_posts`, blog queries join it, but no routes/controller expose CRUD. Blog category assignment via API is impossible. |
| 2 | `writing_sessions` never populated | Medium | Backend | Table exists and analytics queries read it, but no controller action creates writing session records. Writing analytics will always return empty data. |
| 3 | `quadrant_analytics` never populated | Medium | Backend | Table stores daily per-quadrant completion stats. Matrix analytics reads it, but no scheduled or on-demand aggregation writes to it. |
| 4 | `/todos/:id` route param not consumed | Low | Frontend | Route is defined in `App.tsx`, `Dashboard` navigates to `/todos/${id}`, but `TodoView` doesn't call `useParams()` — no single-todo focus from URL. |
| 5 | `/diary/:date` route param not synced | Low | Frontend | Route exists but `useDiary` hook only tracks date via internal state. URL param is ignored. |
| 6 | `/blog/:slug` treated as numeric ID | Low | Frontend | `BlogView` uses `parseInt(slug, 10)` — the URL param is named "slug" but actually holds a numeric post ID. Naming mismatch. |
| 7 | Dev credentials hardcoded | Low | Backend | `DEV_USERNAME = 'dev'`, `DEV_PASSWORD = 'dev'`, `DEV_TOKEN = 'dev-token'` in `authController.ts`. Intentional for local dev but should not reach production. |

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
| 4 | Wire up `blog_categories` API | Completes the blog feature as designed in schema | Medium | Proposed — use `fullstack-feature-dev` specialist |
| 5 | Implement `writing_sessions` tracking | Makes writing analytics functional | Medium | Proposed — use `fullstack-feature-dev` specialist |
| 6 | Create GitHub Actions CI pipeline | Automates lint, type-check, test, build on every push | Medium | Proposed — use `code-quality-infra` specialist |
