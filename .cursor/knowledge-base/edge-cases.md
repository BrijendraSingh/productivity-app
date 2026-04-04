# Edge Cases

Known edge cases and tricky behaviors in this project. Specialists and the continuous-learner update this file when they encounter situations that don't fit standard patterns.

**How this file is populated**: The manage-learnings skill promotes edge cases from `_learnings/*.json` when they've been confirmed across 2+ interactions. The continuous-learner also adds entries directly after bug fixes.

## Format

Each edge case entry:
```
### [Short title]
- **Context**: When/where this occurs
- **Behavior**: What happens (vs what you'd expect)
- **Workaround**: How to handle it correctly
- **Discovered**: YYYY-MM-DD
```

## Entries

### Shared package build required before downstream consumption
- **Context**: When modifying types, constants, or utilities in `shared/src/`
- **Behavior**: Backend and frontend import from `@productivity-app/shared` which resolves to `shared/dist/`. If you edit shared source but don't rebuild, downstream packages see stale types. TypeScript errors may be confusing (e.g., missing properties that clearly exist in source).
- **Workaround**: Always run `npm run build:shared` after editing shared source files, before working on backend or frontend code that uses the changes.
- **Discovered**: 2026-04-04

### Blog slug param parsed as numeric ID
- **Context**: When navigating to `/blog/:slug` in the frontend
- **Behavior**: `BlogView` calls `parseInt(slug, 10)` on the URL parameter. The route param is named "slug" but it's actually treated as a numeric post ID. Passing a real slug string (e.g., `my-blog-post`) results in `NaN`, which breaks the post lookup.
- **Workaround**: Use numeric post IDs in blog URLs, not actual slugs. To fix properly, either rename the param to `:id` or change the lookup logic to support actual slugs.
- **Discovered**: 2026-04-04

### Route params defined but not consumed
- **Context**: Routes `/todos/:id`, `/diary/:date`, `/journal/:date` exist in `App.tsx`
- **Behavior**: The corresponding view components (`TodoView`, `DiaryView`, `BulletJournalView`) don't call `useParams()`. Navigating to `/todos/42` shows the full todo list, not todo #42. The URL changes but the view ignores the parameter.
- **Workaround**: Don't rely on deep links for these features. If implementing deep-link support, add `useParams()` to the views and sync the URL param to the hook's state.
- **Discovered**: 2026-04-04

### SQLite UNIQUE constraint handling varies by controller
- **Context**: When creating entities with unique constraints (categories with duplicate names, tags with duplicate names, users with duplicate usernames)
- **Behavior**: Some controllers (`authController`, `categoryController`) catch `UNIQUE constraint failed` errors and return 409. Others let the error propagate to the generic 500 handler. The user sees different error messages for essentially the same type of failure.
- **Workaround**: When adding new entities with UNIQUE constraints, explicitly catch the `SQLITE_CONSTRAINT` error in the controller and return 409 with a descriptive message.
- **Discovered**: 2026-04-04

### Dev login shortcut bypasses normal auth flow
- **Context**: When logging in with username `dev` and password `dev`
- **Behavior**: The auth controller skips bcrypt password verification and returns a fixed token `dev-token`. It also upserts the dev user (`dev@productivity.app`) if they don't exist. This is intentional for development convenience but means the dev user's auth flow is different from all other users.
- **Workaround**: Be aware of this when testing auth-related changes. Always test with a real user account in addition to the dev shortcut.
- **Discovered**: 2026-04-04

### Frontend 401 handler clears all credentials
- **Context**: When any API call returns 401 Unauthorized
- **Behavior**: The `fetchApi` function in `services/api.ts` calls `onUnauthorized()`, which clears localStorage and resets auth state. This triggers a redirect to `/welcome`. If the 401 was spurious (e.g., network glitch), the user loses their session.
- **Workaround**: This is the intended behavior — if the token is invalid, forcing re-login is correct. But be aware that any backend change that causes unexpected 401s (like DB migration clearing tokens) will log out all active users.
- **Discovered**: 2026-04-04

### Analytics tables have no write path
- **Context**: When viewing the analytics dashboard or Eisenhower matrix analytics
- **Behavior**: `writing_sessions` and `quadrant_analytics` tables exist in the schema and analytics controllers query them, but no code ever INSERTs into these tables. The analytics will show zeroes/empty data for writing metrics and daily quadrant breakdowns.
- **Workaround**: Don't rely on writing analytics or daily quadrant stats until these tables are wired up with write paths. The dashboard analytics and trends endpoints use different queries that work correctly with the existing todo/diary/blog tables.
- **Discovered**: 2026-04-04
