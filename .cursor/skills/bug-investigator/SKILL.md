---
name: bug-investigator
description: "Cross-stack debugging specialist for the productivity-app. Traces bugs from frontend symptoms through the Express API layer to SQLite queries. Use this skill whenever the user reports a bug, error, broken feature, unexpected behavior, data inconsistency, or needs help investigating why something doesn't work. Also trigger on 'bug', 'debug', 'fix', 'error', 'broken', 'not working', '500', '401', '404', 'crash', 'investigate', 'trace', 'diagnose', 'wrong data', 'missing data', 'fails', or any description of unexpected application behavior."
---

## Role

This skill systematically debugs issues in the productivity-app by tracing problems across the full stack: frontend React state → fetch API call → Vite proxy → Express middleware chain → auth verification → route validation → controller logic → SQLite query → response → hook state update → UI render. It encodes knowledge of common failure modes, the auth mechanism, SQLite quirks, and the known bugs in the codebase.

## When to Use

- User reports a bug or unexpected behavior
- API returns 4xx/5xx errors
- Data appears incorrect, missing, or inconsistent between views
- Auth/login issues
- Features that partially work or fail silently
- Performance problems (slow queries, excessive re-renders)
- Investigating why a specific code path produces wrong results

## Prerequisites

- Access to the codebase (read all source files)
- Ideally: dev server running (`npm run dev`) for live testing
- Dev shortcut for quick API testing: `Authorization: Bearer dev-token` (after logging in as `dev`/`dev`)

## Halt and Ask

Stop and confirm with the user if:

- The fix requires a database migration that could affect existing data
- The bug is actually a missing feature (e.g., `blog_categories` having no API is by-design incomplete)
- Multiple valid fixes exist with different tradeoffs
- The bug seems to be in a third-party dependency

## Workflow

### Step 1: Reproduce and Classify

Understand the symptom:

- **UI issue**: Component renders wrong data, missing elements, broken layout → start from the component
- **API error**: Specific HTTP status code → start from the route/controller
- **Auth issue**: Login fails, 401s, token problems → start from auth middleware
- **Data issue**: Wrong data in DB or missing records → start from the controller's SQL
- **Silent failure**: Feature doesn't do anything → check both frontend (hook errors swallowed) and backend (try/catch eating errors)

### Step 2: Trace the Request Lifecycle

For most bugs, trace the full path:

#### Frontend Layer

1. **Component** (`frontend/src/components/`): Check what data it renders and how it gets it (hook or direct API call)
2. **Hook** (`frontend/src/hooks/`): Check the `useEffect` trigger, the `mountedRef` guard, error handling in `catch` blocks
3. **API service** (`frontend/src/services/api.ts`): Check the `fetchApi` call — correct method, path, body? Token being sent?
4. **Auth context** (`frontend/src/contexts/AuthContext.tsx`): On 401, `clearCredentials` is called and user is logged out — is this happening unexpectedly?

#### Network Layer

5. **Vite proxy** (`frontend/vite.config.ts`): `/api` → `http://localhost:3001`. `/health` also proxied. Check if the route matches the proxy config.

#### Backend Layer

6. **Middleware chain** (`backend/src/index.ts`):
   - `helmet()` → security headers
   - `cors()` → allowed origins (localhost:3000, `FRONTEND_URL`)
   - Rate limit (production only)
   - `express.json({ limit: '10mb' })`
   - `compression()`
   - `morgan()`

7. **Auth middleware** (`backend/src/middleware/auth.ts`): Parses `Authorization: Bearer <token>`, looks up user by `api_token`, attaches `req.user`. Fails with 401 if token missing, user not found, or user inactive.

8. **Validation** (`backend/src/middleware/validation.ts`): Runs `express-validator` chains. On failure, returns 400 with `validationResult` errors.

9. **Controller** (`backend/src/controllers/`): Business logic. Check:
   - SQL query correctness (joins, WHERE clauses, parameter order)
   - User scoping (`WHERE user_id = ?`)
   - Error handling (are errors caught? What status is returned?)
   - Type coercion (especially `req.params.id` — string from URL, may need `parseInt`)

10. **Database** (`backend/src/config/database.ts`): SQLite with WAL mode, foreign keys ON. Check:
    - Schema matches what controller expects
    - Foreign key constraints not violated
    - UNIQUE constraint violations handled (409)

### Step 3: Common Failure Modes

| Symptom                           | Likely Cause                                   | Where to Look                                  |
| --------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| 401 Unauthorized                  | Token expired/null, user logged out            | `auth.ts` middleware, `api_token` column in DB |
| 409 Conflict                      | UNIQUE constraint (duplicate name, slug, etc.) | Controller catch block, DB schema              |
| 500 Internal Server Error         | Unhandled exception in controller              | Controller try/catch, `console.error` output   |
| Empty data despite DB having rows | User scoping mismatch (`user_id`)              | Controller SQL query, `req.user.id`            |
| Feature does nothing on click     | Event handler not wired, or error swallowed    | Component onClick/onChange, hook error catch   |
| Wrong route param data            | URL param not read (`useParams` missing)       | Component, `App.tsx` route definition          |
| CORS error                        | Origin not in allowed list                     | `backend/src/index.ts` CORS config             |
| Data out of sync                  | Stale hook state, `mountedRef` race            | Hook `useCallback` deps, refresh function      |
| Infinite re-renders               | Missing deps in useEffect/useCallback          | Hook dependency arrays                         |

### Step 4: Known Bugs in the Codebase

These are pre-existing issues discovered during the project scan:

1. **`/todos/:id` not read**: `TodoView` doesn't call `useParams()` — navigating to `/todos/123` shows the todo list, not a specific todo
2. **`/diary/:date` not synced**: URL param exists but `useDiary` hook doesn't read it — the selected date is only internal state
3. **`/blog/:slug` parsed as int**: `BlogView` uses `parseInt(slug, 10)` — the param is named "slug" but treated as a numeric post ID
4. **`blog_categories` no API**: Table exists, blog queries join it, but no CRUD routes — trying to set a blog category via API will fail
5. **`writing_sessions` never written**: Analytics reads this table but nothing creates rows — writing analytics will always be empty
6. **`quadrant_analytics` never populated**: Matrix analytics reads daily aggregates that are never computed

### Step 5: Fix and Verify

1. Implement the fix in the appropriate layer
2. If the fix spans multiple packages, rebuild `shared/` first
3. Test the fix manually or with a curl command
4. Check for regression — does fixing this break anything else?
5. Document the root cause and fix in the learning store

## Debugging Toolkit

### Quick API Testing

```bash
# Login and get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dev","password":"dev"}'

# Authenticated request
curl http://localhost:3001/api/todos \
  -H "Authorization: Bearer dev-token"
```

### Database Inspection

The SQLite DB is at `data/productivity_app.db`. Docker-compose includes `sqlite-web` on port 8081 for browser-based inspection.

### Frontend State Inspection

React DevTools can inspect hook state. The `AuthContext` exposes `user` and `token` in context. All API errors are logged to console.

## Output Format

The specialist produces:

1. Root cause analysis (which layer, which file, which line)
2. The fix (code changes)
3. Verification steps
4. Learning entry documenting the bug pattern for future reference

## Learning Protocol

### Read on Entry

- `.cursor/skills/_learnings/debug_log.json` — prior bugs, root causes, and fix patterns

### Write on Exit

Append to `debug_log.json`:

```json
{
  "discovered_at": "ISO-8601",
  "tags": ["debug", "layer-name", "feature-name"],
  "finding": "Root cause description",
  "symptom": "What the user observed",
  "fix": "What was changed to resolve it",
  "files_touched": ["modified file paths"]
}
```

## Constraints

- Read the actual code before theorizing — don't guess at implementations
- Prefer minimal, targeted fixes over broad refactors
- If a fix touches the database schema, warn the user about data migration
- Don't fix pre-existing known issues unless the user specifically asks (they may be intentionally deferred)
- Always verify the fix doesn't break auth or data scoping
