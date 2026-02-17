---
name: Refine Todo App Requirements
overview: Refine the REQUIREMENTS_AND_FEATURES.txt into a buildable, phased specification with a modernized tech stack and fix all known design issues, plus create a separate Cursor workspace setup for the todo-app directory.
todos:
  - id: open-workspace
    content: Create instructions for opening todo-app as a separate Cursor workspace and initializing git
    status: pending
  - id: refine-tech-stack
    content: Update REQUIREMENTS_AND_FEATURES.txt Section 2 with modernized, real-version tech stack (Vite, React 18, Express 4, MUI 5/6, TS 5, Node 20)
    status: pending
  - id: fix-db-schema
    content: "Fix Section 4 database schema: add user_id to all 10 user-scoped tables, add ON DELETE CASCADE, add indexes"
    status: pending
  - id: fix-auth-gaps
    content: Fix Sections 5.3, 5.4, 5.7 to mark all endpoints as [auth] except public ones
    status: pending
  - id: fix-arch-issues
    content: Remove Section 12 'Known Issues' and incorporate fixes into the spec itself (shared types, dashboard stats, FAB wiring)
    status: pending
  - id: add-phase-boundaries
    content: Restructure Section 5 features into Phase 1/2/3/4 with clear scope boundaries and build order
    status: pending
  - id: create-cursor-rule
    content: Create a .cursor/rules/todo-app.mdc for the todo-app workspace with coding conventions
    status: pending
isProject: false
---

# Refine Productivity App Requirements for a Clean Build

## Part 1: Isolate the todo-app workspace

Open `playground/scratch-work/todo-app/` as its own Cursor workspace:

1. In Cursor: **File > Open Folder** and select `playground/scratch-work/todo-app/`
2. This gives a clean workspace with zero Celigo rules (no `qa-impact-mapping`, `git-workflow`, `workspace-context`, or `deprecated-repos`)
3. Create a `.cursor/rules/` directory inside the todo-app folder for any todo-app-specific rules (e.g., coding conventions, component patterns)
4. Optionally `git init` inside the todo-app directory to have its own independent git history

## Part 2: Requirements refinement -- what needs fixing

The current [REQUIREMENTS_AND_FEATURES.txt](playground/scratch-work/todo-app/REQUIREMENTS_AND_FEATURES.txt) was generated from a broken codebase analysis. The refined version will fix these issues:

### 2a. Modernize the tech stack


| Current (problematic)           | Refined                               |
| ------------------------------- | ------------------------------------- |
| Create React App                | **Vite** (with React plugin)          |
| React 19.1.1 (does not exist)   | **React 18.x** (latest stable)        |
| TypeScript 4.9.5 (frontend)     | **TypeScript 5.x** (unified version)  |
| Express 5.1.0 (unstable)        | **Express 4.21.x** (latest stable v4) |
| MUI v7.3.1 (does not exist)     | **MUI v5.x or v6.x** (latest stable)  |
| dotenv v17.2.1 (does not exist) | **dotenv 16.x** (latest stable)       |
| node:18-alpine (Docker)         | **node:20-alpine**                    |


The rest of the stack (SQLite, Emotion, React Router, Recharts, Framer Motion, date-fns, bcryptjs, helmet, cors, etc.) is fine -- just pin to real latest stable versions at build time.

### 2b. Fix database schema -- add `user_id` everywhere

Tables that currently **lack `user_id**` but need it for multi-user support:

- `categories` -- add `user_id INTEGER REFERENCES users(id)`
- `tags` -- add `user_id INTEGER REFERENCES users(id)`
- `diary_entries` -- add `user_id`
- `events` -- add `user_id`
- `bullet_logs` -- add `user_id`
- `blog_categories` -- add `user_id`
- `blog_posts` -- add `user_id`
- `writing_sessions` -- add `user_id`
- `quadrant_analytics` -- add `user_id`

All queries must filter by the authenticated user's ID. The `todos` table also needs `user_id` added.

### 2c. Fix API authentication gaps

Endpoints currently missing auth middleware that need it:

- All `/api/categories` endpoints (currently open)
- All `/api/tags` endpoints (currently open)
- All `/api/blog` endpoints (currently open)

**Every endpoint except** `/health`, `/api`, `/api/auth/register`, and `/api/auth/login` must require authentication.

### 2d. Fix architectural issues (Section 12 bugs)

- **Shared types must actually be used**: Frontend and backend must import from `@productivity-app/shared` -- no duplicate type definitions
- **Dashboard stats**: Fetch from `/api/analytics/dashboard` instead of hardcoded values
- **FAB click handler**: Wire to the appropriate add dialog for the current route context
- **Writing sessions UI**: Either add a UI for session tracking or remove the table from Phase 1

### 2e. Phase the build

**Phase 1 (Core)** -- build first:

- Authentication and user management (5 endpoints)
- Todo management with full CRUD (5 endpoints)
- Category management (5 endpoints)
- Tag management (6 endpoints)
- Eisenhower Matrix view (read-only, computed from todos)
- Main Dashboard with live stats
- Landing page
- Shared package (types, constants, utilities)
- Theme system (dark/light)
- Navigation and layout

Phase 1 scope: **10 database tables** (users, categories, tags, todos, todo_tags, events, quadrant_analytics + 3 removed), **26 API endpoints** + 2 system, **~12 frontend components**

**Phase 2 (Journaling)** -- add after Phase 1 works:

- Digital Diary (4 endpoints)
- Bullet Journal (5 endpoints)

**Phase 3 (Content)** -- add after Phase 2:

- Blog system with markdown editor (6 endpoints)
- Blog categories
- Writing sessions

**Phase 4 (Insights)** -- add after Phase 3:

- Full Analytics dashboard (5 endpoints)
- Charts and trends

## Part 3: Deliverable

Rewrite [REQUIREMENTS_AND_FEATURES.txt](playground/scratch-work/todo-app/REQUIREMENTS_AND_FEATURES.txt) as a clean, buildable spec with:

- Corrected tech stack with real, stable version ranges
- Fixed database schema (user_id on all tables)
- Auth required on all non-public endpoints
- Clear Phase 1/2/3/4 boundaries
- Removed "Known Issues" section (issues are fixed in the spec itself)
- Build order instructions (shared -> backend -> frontend)
- A `.cursor/rules/todo-app.mdc` file for the todo-app workspace with coding conventions

The refined document will be approximately 600-700 lines (trimmed from 940) since we are removing the "known issues" section and tightening language, while adding phase boundaries and build order.