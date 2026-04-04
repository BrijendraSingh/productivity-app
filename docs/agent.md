# productivity-app: Engineering Memory

This document is the **living engineering memory** for this project. Agents read it before work and update it after. It captures architecture, decisions, lessons, and gaps so that every session starts smarter than the last.

## Project Overview

- **Type**: Monorepo (npm workspaces)
- **Language(s)**: TypeScript 5.9.3
- **Framework(s)**: React 18 + Vite 7 + MUI 6 (frontend), Express 4 + SQLite3 (backend)
- **Purpose**: A comprehensive personal productivity application combining todo management, digital diary, blog authoring, bullet journaling, Eisenhower Matrix prioritization, and analytics — with Material Design theming and token-based authentication.

## Architecture

The app is structured as an npm workspaces monorepo with three packages forming a build dependency chain:

```
┌─────────────────────────────────────────────────────────────────┐
│                        productivity-app                         │
│                                                                 │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ shared/  │    │    backend/      │    │    frontend/     │  │
│  │          │◄───│                  │    │                  │  │
│  │ Types    │    │ Express 4        │◄───│ React 18         │  │
│  │ Constants│◄───│ SQLite3          │API │ Vite 7           │  │
│  │ Utils    │    │ Controllers      │    │ MUI 6            │  │
│  │          │    │ Routes           │    │ Hooks            │  │
│  └──────────┘    │ Auth middleware  │    │ Recharts         │  │
│       ▲          └──────────────────┘    └──────────────────┘  │
│       │                  │                       │              │
│       │           Port 3001              Port 3000              │
│       │                  │          Vite proxy /api──►          │
│       └──────────────────┴───────────────────────┘              │
│                                                                 │
│  ┌──────────┐    ┌──────────────────┐                          │
│  │ Docker   │    │   data/          │                          │
│  │ Compose  │    │   *.db (SQLite)  │                          │
│  └──────────┘    └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow**: User interacts with React SPA → Vite proxies `/api` calls to Express on port 3001 → Express middleware chain (helmet, CORS, auth, validation) → controller executes parameterized SQL against SQLite → JSON response → React hook updates state → component re-renders.

**Auth flow**: Login → bcrypt password check → generate random API token → store in `users.api_token` → return token → frontend stores in localStorage → subsequent requests send `Authorization: Bearer <token>` → `authMiddleware` looks up user by token.

## Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Shared types | `shared/src/types/index.ts` | All entity interfaces, DTOs, and API response types |
| Shared constants | `shared/src/constants/index.ts` | API endpoints, config values, display metadata |
| Shared utils | `shared/src/utils/*.ts` | DateUtils, EisenhowerUtils, TextUtils, ValidationUtils |
| Database config | `backend/src/config/database.ts` | SQLite connection, 13-table schema DDL, promise wrappers |
| Auth middleware | `backend/src/middleware/auth.ts` | Bearer token verification, user attachment to request |
| Validation middleware | `backend/src/middleware/validation.ts` | express-validator batch runner |
| Controllers | `backend/src/controllers/*.ts` | 8 controllers: auth, todo, category, tag, diary, bullet, blog, analytics |
| Routes | `backend/src/routes/*.ts` | 8 route files mapping HTTP methods to controllers |
| API service | `frontend/src/services/api.ts` | Typed fetch wrapper with Bearer auth and 401 handler |
| Feature hooks | `frontend/src/hooks/*.ts` | 5 hooks: useTodos, useDiary, useBulletJournal, useBlog, useAnalytics |
| Auth context | `frontend/src/contexts/AuthContext.tsx` | User state, login/register/logout, token verify on mount |
| Theme context | `frontend/src/contexts/ThemeContext.tsx` | MUI dark/light mode with localStorage persistence |
| Components | `frontend/src/components/` | 12 components across 8 feature directories |
| Playwright E2E | `frontend/bullet-journal.spec.ts` | E2E tests for bullet journal symbol toolbar |

## System Boundaries

- **External Services**: None — fully self-contained. SQLite local file, no network dependencies.
- **Data Flow**: All data enters via REST API (`/api/*`), persists in SQLite at `data/productivity_app.db`, and exits via the same API. Vite dev proxy bridges frontend port 3000 to backend port 3001.
- **Security Boundaries**: Token-based auth with bcrypt password hashing. Helmet security headers. CORS restricted to configured origin. Rate limiting in production. Every database query scoped by `user_id` to prevent cross-user data access.

## Decision Log

Architectural decisions and their rationale. Never remove entries — history is permanent.

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-04-04 | Applied cursor-agent-bootstrap | Establish self-learning subagent architecture for development workflow | Manual agent setup, no agents |
| 2026-04-04 | Created 4 domain specialists: fullstack-feature-dev, playwright-qa, bug-investigator, code-quality-infra | Project scan revealed zero app-development skills; all 5 existing skills were meta/bootstrap only | Fewer specialists (combined dev+debug), more specialists (split frontend/backend dev) |
| 2026-04-04 | Fat controllers without service layer | Acceptable at current scale (~20 backend files). Introducing a service layer would add indirection without clear benefit for a single-dev project | Service layer extraction, repository pattern |
| 2026-04-04 | Custom API tokens instead of JWT | Simpler implementation, tokens stored in DB for easy revocation. JWT would be better for distributed systems but unnecessary here | JWT with refresh tokens, session-based auth |
| 2026-04-04 | SQLite instead of PostgreSQL | Single-file database, zero server setup, ideal for personal productivity app. WAL mode handles concurrent reads well | PostgreSQL, MongoDB |

## Lessons Learned

Edge cases, failure patterns, and discoveries. Append new entries; update status of existing ones.

- **Finding**: Cursor-agent-bootstrap applied to this repo
  **Impact**: Establishes the subagent framework and learning loop
  **Status**: Resolved — scan completed and 4 domain specialists created
  **Date**: 2026-04-04

- **Finding**: Three database tables exist with no write path — `blog_categories`, `writing_sessions`, `quadrant_analytics`
  **Impact**: Analytics features referencing these tables will show empty data. Blog category assignment via API is not possible.
  **Status**: Open — documented in remaining-issues.md
  **Date**: 2026-04-04

- **Finding**: Route params `/todos/:id`, `/diary/:date`, `/blog/:slug` are defined in React Router but not consumed by their view components
  **Impact**: Deep links to specific items don't work as expected — URL changes but view doesn't respond to the param
  **Status**: Open
  **Date**: 2026-04-04

- **Finding**: `shared/` package must be built before backend or frontend can use new types
  **Impact**: Forgetting to run `npm run build:shared` after type changes causes confusing TypeScript errors in downstream packages
  **Status**: By design — npm workspaces link to `dist/` output
  **Date**: 2026-04-04

## Known Gaps

Track what's missing or incomplete. Check items off as they're resolved.

### Architecture
- [ ] No service layer — controllers contain inline SQL (acceptable at current scale)
- [ ] No WebSocket support for real-time updates
- [ ] No data export/import functionality

### Testing
- [ ] Zero unit tests — no Vitest/Jest configured
- [ ] Only 1 E2E spec (bullet journal symbols) — all other features untested
- [ ] No test data seeding or fixture system
- [ ] No CI/CD pipeline to run tests automatically

### Code Quality
- [ ] No ESLint configured
- [ ] No Prettier configured
- [ ] No pre-commit hooks
- [ ] Inconsistent error handling across controllers (some 409, some generic 500)

### Features
- [ ] `blog_categories` table has no CRUD API
- [ ] `writing_sessions` table is never written to
- [ ] `quadrant_analytics` table is never populated
- [ ] Route params not wired: `/todos/:id`, `/diary/:date`, `/blog/:slug`
- [ ] Dev credentials hardcoded in authController.ts

### Documentation
- [x] ~~Fill in all `{{placeholder}}` fields in this document~~
- [x] ~~Complete the scan report via project-scanner~~

## Configuration Evolution

Track config schema changes so agents understand current vs historical config shapes.

| Version | Date | Change | Migration Notes |
|---------|------|--------|----------------|
| 1.0.0 | 2026-04-04 | Initial configuration — `.env.example` with PORT, DATABASE_PATH, JWT_SECRET, FRONTEND_URL, LOG_LEVEL, rate limiting vars | Copy `.env.example` to `.env` and fill in values |

## Feedback Protocol

How to write back to this document:

**Lessons Learned** — use this format:
```
- **Finding**: [What you observed]
  **Impact**: [What breaks or degrades]
  **Status**: [Open | By design | Fixed in <commit>]
  **Date**: YYYY-MM-DD
```

**Decision Log** — add a row: `| Date | Decision | Rationale | Alternatives Considered |`

**Known Gaps** — add a `- [ ]` item under the appropriate subsection.

**Configuration Evolution** — add a version note if a config schema changed.

## Cross-References

For the full directory listing, see the "Where to Find More" section in [`AGENTS.md`](../AGENTS.md).

Key links for this document:
- [`AGENTS.md`](../AGENTS.md) — agent conventions, specialist registry, architecture diagram
- [`docs/cursor-setup.md`](cursor-setup.md) — setup guide, troubleshooting, knowledge promotion workflow
- [`docs/scan-report.md`](scan-report.md) — full codebase scan results and domain proposals
- [`docs/delegation-protocol.md`](delegation-protocol.md) — delegation steps, selective loading, delegation tracking
- [`docs/remaining-issues.md`](remaining-issues.md) — tracked bugs and implementation gaps
- [`.cursor/skills/_learnings/`](../.cursor/skills/_learnings/) — accumulated runtime knowledge
