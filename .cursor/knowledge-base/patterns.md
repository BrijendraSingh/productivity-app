# Patterns

Human-readable patterns discovered across interactions. This file is curated periodically from the `_learnings/` store and direct observations.

**How this file is populated**: The manage-learnings skill promotes verified, recurring patterns from `_learnings/*.json` into this file. You can also add entries manually when you notice a reliable pattern.

## Domain Patterns

**Shared-first type contract**: All entity types, DTOs, and API response types live in `shared/src/types/index.ts`. Both backend and frontend import from `@productivity-app/shared`. Never duplicate type definitions in either package. When adding a new entity, start by defining its types in shared, then build shared (`npm run build:shared`) before working on backend or frontend.

**User-scoped database queries**: Every SQL query that touches user-owned data includes `WHERE user_id = ?` with `req.user.id`. This is the primary data isolation mechanism. Tables without `user_id` (junction tables like `todo_tags`) are accessed through joins on user-scoped parent tables.

**Constants-driven display metadata**: Colors, labels, and icons for statuses, priorities, quadrants, and bullet symbols are all defined in `shared/src/constants/index.ts` (e.g., `EISENHOWER_QUADRANTS`, `PRIORITY_LEVELS`, `TODO_STATUS_CONFIG`). The frontend theme mirrors these with matching color maps. Never hardcode display values in components.

**API endpoint registry**: All API paths are centralized in `API_ENDPOINTS` within `shared/src/constants/index.ts`. Both backend routes and frontend API service reference these constants. When adding a new route group, register it here first.

## Workflow Patterns

**Feature development order**: shared types → shared constants → `npm run build:shared` → backend DB schema → backend controller → backend route → mount in `index.ts` → frontend API service → frontend hook → frontend component → add route in `App.tsx` → add nav in `AppLayout.tsx`. Skipping the shared build step is the most common cause of confusing TypeScript errors.

**Junction table sync**: For many-to-many relationships (todo-tags, blog-post-tags), the pattern is DELETE all existing associations then INSERT OR IGNORE the new set. This runs inside the parent entity's update controller action, not as a separate endpoint.

**Custom hook data pattern**: Every feature domain has a hook (`useTodos`, `useDiary`, etc.) that encapsulates API calls and state. Hooks use `useState` for data/loading/error, `useCallback` for CRUD operations, and a `mountedRef` to guard against state updates after unmount. New features should follow this pattern rather than calling API functions directly from components.

**FAB cross-component communication**: The floating action button in `AppLayout` dispatches `window.CustomEvent`s (e.g., `open-add-todo-dialog`). View components listen for these events via `useEffect` and open their creation dialogs. This decouples the FAB from the views.

## Anti-Patterns

**Direct SQL in components**: Never execute database queries from frontend code. All data access goes through the API service layer. Even for "quick lookups," use the established hook → API → controller → DB chain.

**Manual input validation**: Don't write manual `if (req.body.title === undefined)` checks in controllers. Use `express-validator` chains in the route file with the `validate()` middleware. This provides consistent error formatting and keeps validation separate from business logic.

**Storing auth tokens in code**: The dev shortcut (`dev`/`dev` → `dev-token`) is intentionally hardcoded for local development convenience. Never add similar shortcuts for other users or environments. Production auth always uses randomly generated tokens.

**Fat components with embedded state**: When a component grows beyond ~200 lines, the state management and API calls should be extracted into a custom hook. The component should only handle rendering and user interaction.
