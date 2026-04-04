---
name: fullstack-feature-dev
description: "End-to-end feature development across the productivity-app monorepo (shared types → backend API → frontend UI). Use this skill whenever the user wants to add a new feature, create a new entity, add a field/column, build a new page or component, create an API endpoint, modify the database schema, wire up an unused table, or do any cross-package development work. Also use when someone says 'add feature', 'new endpoint', 'new component', 'CRUD', 'hook', 'controller', 'fullstack', or references the shared/backend/frontend build pipeline."
---

## Role

This skill guides end-to-end feature development across the productivity-app monorepo. The app has three packages that form a dependency chain: `shared/` (types + constants + utils) → `backend/` (Express 4 + SQLite3 API) → `frontend/` (React 18 + MUI 6 SPA). Most feature work touches all three packages, and the skill encodes the exact patterns, build order, and contracts needed to do this reliably.

## When to Use

- Adding a new entity (new DB table + types + API routes + frontend view)
- Adding a field to an existing entity
- Creating a new API endpoint or modifying an existing one
- Building a new frontend page or component
- Wiring up an unused table (`blog_categories`, `writing_sessions`, `quadrant_analytics`)
- Modifying shared types, constants, or utility functions
- Fixing data-flow bugs that span multiple packages

## Prerequisites

- Node.js >= 20
- `npm install` at repo root (installs all workspaces)
- `shared/` must be built (`npm run build:shared`) before backend or frontend can use new types

## Halt and Ask

Stop and confirm with the user if:
- The change requires adding a new database table (confirm schema design first)
- The change modifies the auth mechanism or user model
- You're unsure whether to extend an existing entity or create a new one
- The change would break existing API contracts (response shape changes)

## Workflow

### Step 1: Understand the Change

Read the relevant existing files to understand current patterns:
- For new entities: look at an existing entity end-to-end (e.g., `todos` — types, controller, route, hook, component)
- For modifications: read the specific files that will change

### Step 2: Shared Package (`shared/src/`)

If the change involves types, constants, or utilities:

1. **Types** (`shared/src/types/index.ts`): Add entity interfaces, DTOs (Create/Update requests), and response types. Follow the existing pattern — `BaseEntity` for entities with `id`/`created_at`/`updated_at`, separate `WithRelations` types for joined queries.

2. **Constants** (`shared/src/constants/index.ts`): Add display metadata (colors, labels), config values, and `API_ENDPOINTS` entries. Every new route group needs its endpoints registered here.

3. **Utilities**: Add utility methods to existing classes or create new ones. `DateUtils`, `EisenhowerUtils`, `TextUtils`, and `ValidationUtils` already exist as static-method classes.

4. **Re-export** from `shared/src/index.ts` if you added a new file.

5. **Build shared**: Run `npm run build:shared` so downstream packages pick up the changes.

### Step 3: Backend (`backend/src/`)

For new or modified API endpoints:

1. **Database schema** (`backend/src/config/database.ts`): Add `CREATE TABLE IF NOT EXISTS` in `initializeDatabase()`. Include proper foreign keys, indexes, and constraints. Every user-owned table needs a `user_id` FK to `users`.

2. **Controller** (`backend/src/controllers/<name>Controller.ts`): Create the business logic file. Follow the existing pattern:
   - Import `dbGet`, `dbAll`, `dbRun` from `../config/database`
   - Import types from `@productivity-app/shared`
   - Each function takes `(req: Request, res: Response)`
   - Wrap body in `try { ... } catch (error) { console.error(...); res.status(500).json({ success: false, message: '...' }) }`
   - Always scope queries with `WHERE user_id = ?` using `req.user.id`
   - Return `{ success: true, data: ... }` on success
   - Handle `UNIQUE constraint` errors with 409 status
   - Handle not-found with 404 status

3. **Routes** (`backend/src/routes/<name>.ts`): Create the route file:
   - `import { Router } from 'express'`
   - `import { authMiddleware } from '../middleware/auth'`
   - `import { validate } from '../middleware/validation'`
   - Apply `router.use(authMiddleware)` for authenticated routes
   - Use `body()` and `param()` from `express-validator` for validation chains
   - Map HTTP methods to controller functions

4. **Mount** in `backend/src/index.ts`: Import the router, add `app.use('/api/<name>', <name>Routes)`.

### Step 4: Frontend (`frontend/src/`)

For new or modified UI features:

1. **API service** (`frontend/src/services/api.ts`): Add typed API functions following the existing grouped pattern (e.g., `todosApi`, `diaryApi`). Each function calls `fetchApi<ApiResponse<T>>()` with the correct method, path, and body.

2. **Custom hook** (`frontend/src/hooks/use<Name>.ts`): Create the data hook:
   - Use `useState` for data, loading, and error states
   - Use `useRef` for `mountedRef` to prevent state updates after unmount
   - Wrap API calls in `useCallback` with the `mountedRef` guard
   - Export CRUD functions + data + loading + error + refresh
   - Follow `useTodos` or `useDiary` as reference implementations

3. **Component** (`frontend/src/components/<Name>/<Name>View.tsx`): Build the view:
   - Use MUI components (`Box`, `Paper`, `Grid2`, `Typography`, `TextField`, etc.)
   - Apply `sx` prop styling, reference `theme` via `useTheme()`
   - Use responsive breakpoints (`useMediaQuery`)
   - Handle loading state with `Skeleton` or `CircularProgress`
   - Handle errors with `Alert`
   - For dialogs, use the `CustomEvent` pattern if triggered from the FAB

4. **Routing** (`frontend/src/App.tsx`): Add the route inside the `AppLayout` wrapper:
   - `<Route path="/<name>" element={<ProtectedRoute><NameView /></ProtectedRoute>} />`

5. **Navigation** (`frontend/src/components/Layout/AppLayout.tsx`): Add the nav item to the drawer.

### Step 5: Verify

- Rebuild shared if types changed: `npm run build:shared`
- Run the dev server: `npm run dev` (starts all three packages)
- Test the new feature manually through the UI
- Verify API responses with curl or browser devtools

## Key Patterns Reference

### SQLite User Scoping
Every query that touches user data must include `user_id`:
```sql
SELECT * FROM todos WHERE user_id = ? AND id = ?
```

### Junction Table Sync
For many-to-many relationships (todo_tags, blog_post_tags):
```typescript
await dbRun('DELETE FROM todo_tags WHERE todo_id = ?', [todoId]);
for (const tagId of tagIds) {
  await dbRun('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [todoId, tagId]);
}
```

### API Response Format
```typescript
// Success
res.json({ success: true, data: result });
res.json({ success: true, data: items, pagination: { page, limit, total, totalPages } });

// Error
res.status(404).json({ success: false, message: 'Resource not found' });
res.status(409).json({ success: false, message: 'Resource already exists' });
```

### Frontend Hook Pattern
```typescript
const mountedRef = useRef(true);
useEffect(() => { return () => { mountedRef.current = false; }; }, []);

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await api.getData();
    if (mountedRef.current && response.success) {
      setData(response.data);
    }
  } catch (err) {
    if (mountedRef.current) setError('Failed to load');
  } finally {
    if (mountedRef.current) setLoading(false);
  }
}, []);
```

### FAB Cross-Component Event
```typescript
// Dispatch (from AppLayout FAB)
window.dispatchEvent(new CustomEvent('open-add-<name>-dialog'));

// Listen (in view component)
useEffect(() => {
  const handler = () => setDialogOpen(true);
  window.addEventListener('open-add-<name>-dialog', handler);
  return () => window.removeEventListener('open-add-<name>-dialog', handler);
}, []);
```

## Known Unwired Tables

These tables exist in the schema but lack full API support — a common task is wiring them up:

1. **`blog_categories`**: Table exists with FK from `blog_posts`, but no CRUD routes. Needs: controller, routes, mount in index.ts, frontend API/hook/component.
2. **`writing_sessions`**: Table exists, analytics reads it, but no creation endpoint. Needs: controller action to create sessions (likely triggered from blog editor), API route.
3. **`quadrant_analytics`**: Table exists, matrix analytics reads it, but nothing computes daily aggregates. Needs: a scheduled or on-demand aggregation function.

## Output Format

The specialist produces working code changes across the relevant packages, following the patterns documented above. Each change should be minimal and focused — avoid refactoring unrelated code.

## Learning Protocol

### Read on Entry
- `.cursor/skills/_learnings/fullstack_dev_log.json` — prior development patterns, gotchas, and corrections

### Write on Exit
Append to `fullstack_dev_log.json`:
```json
{
  "discovered_at": "ISO-8601",
  "tags": ["fullstack", "feature-type"],
  "finding": "What was learned during this development task",
  "context": "What was being built and why this matters",
  "files_touched": ["list of modified files"]
}
```

## Constraints

- Always scope database queries with `user_id` — never leak data across users
- Never duplicate types — all shared types live in `@productivity-app/shared`
- Build `shared/` before testing changes in backend or frontend
- Follow existing patterns rather than introducing new architectural approaches
- Keep controllers focused — one entity per controller file
- Use `express-validator` for all input validation, not manual checks
