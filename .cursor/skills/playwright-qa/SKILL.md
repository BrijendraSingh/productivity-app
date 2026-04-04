---
name: playwright-qa
description: "Testing and QA specialist for the productivity-app. Writes Playwright E2E tests and sets up unit test infrastructure (Vitest). Use this skill whenever the user wants to write tests, add test coverage, create a spec file, set up test infrastructure, debug a failing test, or improve QA. Also trigger on 'test', 'spec', 'e2e', 'playwright', 'unit test', 'vitest', 'coverage', 'QA', 'write tests', 'add tests', 'test setup', or when you notice untested code that should have tests."
---

## Role

This skill handles all testing and QA for the productivity-app. The app currently has near-zero test coverage — 1 Playwright E2E spec covering bullet journal symbols and zero unit tests. This skill knows how to write effective E2E tests following the existing patterns, set up unit testing infrastructure, and systematically improve coverage across all features.

## When to Use

- Writing new Playwright E2E specs for app features
- Adding unit tests for shared utilities, backend controllers, or frontend hooks
- Setting up Vitest for the monorepo (currently unconfigured)
- Debugging or fixing a failing test
- Expanding test infrastructure (multi-browser, CI integration, test helpers)
- Reviewing test coverage and recommending what to test next

## Prerequisites

- Node.js >= 20
- `npm install` at repo root
- For E2E tests: both backend (port 3001) and frontend (port 3000) must be running (`npm run dev`)
- Playwright browsers installed: `npx playwright install chromium` (from `frontend/` directory)

## Halt and Ask

Stop and confirm with the user if:

- Setting up Vitest for the first time (confirm they want the dependency added)
- The test requires modifying production code (e.g., adding test IDs to components)
- Test data setup requires database seeding that could affect their dev data
- A test exposes a bug — confirm whether to file it or fix it

## Workflow

### Writing E2E Tests (Playwright)

#### Step 1: Understand the Feature

Read the relevant component, hook, and API files to understand the feature's behavior, user flows, and edge cases.

#### Step 2: Create the Spec File

Create spec files at `frontend/<feature-name>.spec.ts` (matching the existing `bullet-journal.spec.ts` location).

Follow the established patterns from the reference implementation:

```typescript
import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function ensureAuthenticated(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  if (page.url().includes('/welcome')) {
    // Click the Sign In button in the landing page banner
    const signInBanner = page.locator('button:has-text("Sign In")').first();
    await signInBanner.click();

    // Wait for the login dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Try signing in with test credentials
    await dialog.locator('input[name="username"]').fill('e2etest');
    await dialog.locator('input[name="password"]').fill('Test1234!');

    const signInButton = dialog.locator('button[type="submit"]:has-text("Sign In")');
    await signInButton.click();
    await page.waitForTimeout(1000);

    // If sign-in fails (user doesn't exist), switch to Sign Up
    const alert = dialog.locator('[role="alert"]');
    if (await alert.isVisible()) {
      const signUpTab = dialog.locator('[role="tab"]:has-text("Sign Up")');
      await signUpTab.click();
      await page.waitForTimeout(300);

      await dialog.locator('input[name="username"]').fill('e2etest');
      await dialog.locator('input[name="email"]').fill('e2e@test.com');
      await dialog.locator('input[name="password"]').fill('Test1234!');

      const signUpButton = dialog.locator('button[type="submit"]:has-text("Sign Up")');
      await signUpButton.click();
    }

    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');
  }
}

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${BASE_URL}/feature-path`);
    await expect(page).toHaveURL(/\/feature-path/);
  });

  test('should do something', async ({ page }) => {
    // Test assertions here
  });
});
```

#### Step 3: Key Testing Patterns

**Auth is always required**: Every feature is behind auth. Use `ensureAuthenticated()` in `beforeEach`. The function handles both sign-in and sign-up flows.

**Screenshots for debugging**: Use `await page.screenshot({ path: 'test-results/descriptive-name.png' })` at key checkpoints.

**Wait for network**: Use `page.waitForLoadState('networkidle')` after navigation, and `page.waitForTimeout()` sparingly after mutations.

**Locate by text/role**: Prefer semantic locators (`getByRole`, `getByText`, `locator('[role="..."]')`) over CSS selectors.

**Assert visibility first**: Before interacting with an element, `await expect(element).toBeVisible()`.

#### Step 4: Update Playwright Config

If adding new spec files, update `frontend/playwright.config.ts` to match them. Currently it only matches `bullet-journal.spec.ts` via `testMatch`. Expand to:

```typescript
testMatch: '*.spec.ts',
```

#### Step 5: Run and Verify

```bash
cd frontend
npx playwright test                    # Run all specs
npx playwright test feature.spec.ts    # Run specific spec
npx playwright test --headed           # Watch in browser
npx playwright show-report             # View results
```

### Writing Unit Tests (Vitest)

#### Step 1: Set Up Vitest (if not done)

If Vitest is not yet configured, set it up:

1. Install at root: `npm install -D vitest @vitest/coverage-v8`
2. For frontend testing with React: `npm install -D @testing-library/react @testing-library/jest-dom jsdom --workspace=frontend`
3. Create `vitest.config.ts` at repo root for workspace-level config
4. Create per-package configs as needed

#### Step 2: Write Unit Tests

Place test files next to the source files they test, using the `.test.ts` / `.test.tsx` naming convention.

**Shared utilities** (highest unit-test value):

```typescript
// shared/src/utils/EisenhowerUtils.test.ts
import { describe, it, expect } from 'vitest';
import { EisenhowerUtils } from './EisenhowerUtils';

describe('EisenhowerUtils', () => {
  it('should assign Q1 for high urgency and high importance', () => {
    expect(EisenhowerUtils.getQuadrant(8, 9)).toBe('q1');
  });
});
```

**Backend controllers** (test business logic without Express):

- Extract testable logic or test with supertest

**Frontend hooks** (test with renderHook from testing-library):

- Mock the API service, test hook state transitions

### Test Priority Matrix

Features ordered by coverage value:

| Priority | Feature                                    | Why                               |
| -------- | ------------------------------------------ | --------------------------------- |
| 1        | Auth (login, register, logout)             | Gate for all other features       |
| 2        | Todos (CRUD, filtering, Eisenhower)        | Core feature with most complexity |
| 3        | Diary (create, edit, date navigation)      | Daily-use feature                 |
| 4        | Blog (create, edit, publish, markdown)     | Rich editor interactions          |
| 5        | Bullet Journal (already partially tested)  | Expand existing coverage          |
| 6        | Analytics (dashboard rendering)            | Read-only, lower risk             |
| 7        | Categories/Tags (CRUD)                     | Simple CRUD, less likely to break |
| 8        | Eisenhower Matrix (drag, quadrant display) | Complex UI but read-heavy         |

## Output Format

The specialist produces:

- Spec files (`.spec.ts` for E2E, `.test.ts` for unit) following established patterns
- Config updates (Playwright config, Vitest config) as needed
- Test helper utilities when patterns are repeated across specs

## Learning Protocol

### Read on Entry

- `.cursor/skills/_learnings/testing_log.json` — prior test patterns, flaky test fixes, coverage observations

### Write on Exit

Append to `testing_log.json`:

```json
{
  "discovered_at": "ISO-8601",
  "tags": ["testing", "e2e|unit", "feature-name"],
  "finding": "What was learned about testing this feature",
  "context": "What test was written and any gotchas encountered",
  "test_file": "path to the spec/test file"
}
```

## Constraints

- E2E tests must handle both sign-in and sign-up flows (user may or may not exist)
- Never hardcode test data that could conflict with the user's dev database — use unique test usernames
- Keep specs focused on user-visible behavior, not implementation details
- Avoid flaky timing-dependent assertions — prefer `waitForSelector`/`waitForLoadState` over fixed timeouts
- Screenshot paths go in `test-results/` (gitignored)
