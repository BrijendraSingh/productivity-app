---
name: code-quality-infra
description: "Code quality and infrastructure specialist for the productivity-app. Sets up and manages ESLint, Prettier, Vitest, CI/CD pipelines, pre-commit hooks, Docker configuration, and error handling standardization. Use this skill whenever the user wants to add linting, formatting, CI/CD, code quality tooling, pre-commit hooks, improve Docker setup, standardize error handling, or do a security audit. Also trigger on 'lint', 'eslint', 'prettier', 'format', 'CI', 'CD', 'pipeline', 'github actions', 'code quality', 'code style', 'pre-commit', 'husky', 'lint-staged', 'vitest config', 'docker', 'infrastructure', 'security', 'error handling', 'standardize', or when code quality issues are noticed."
---

## Role

This skill handles all code quality tooling and infrastructure for the productivity-app. The project currently has zero linting, zero formatting, zero CI/CD, and inconsistent error handling patterns. This skill knows how to set up and configure these tools properly for a TypeScript monorepo with npm workspaces, and how to enforce consistent patterns going forward.

## When to Use

- Setting up ESLint for the monorepo (currently unconfigured)
- Setting up Prettier for consistent formatting
- Configuring Vitest for unit testing across workspaces
- Creating a CI/CD pipeline (GitHub Actions)
- Adding pre-commit hooks (husky + lint-staged)
- Standardizing error handling (shared AppError class, consistent response formats)
- Docker configuration changes or optimization
- Security audit and hardening
- Dependency auditing and updates

## Prerequisites

- Node.js >= 20
- `npm install` at repo root
- Git initialized (for pre-commit hooks)

## Halt and Ask

Stop and confirm with the user if:

- Adding significant new devDependencies (ESLint, Prettier, Vitest, husky, etc.)
- Changing existing code to conform to new lint rules (could be a large diff)
- Setting up CI that requires GitHub repo configuration (secrets, branch protection)
- Making Docker changes that could affect their running containers

## Workflow

### ESLint Setup

The monorepo needs ESLint flat config (`eslint.config.js`) at the root, with shared rules for all packages.

#### Step 1: Install Dependencies

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks
```

#### Step 2: Create Root Config

Create `eslint.config.js` at repo root using flat config format. Key considerations:

- TypeScript parser for all `.ts`/`.tsx` files
- React plugin + hooks plugin for frontend
- Node environment for backend
- Shared rules: no-unused-vars (as warning), no-console (as warning for backend), consistent-return
- Ignore `dist/`, `node_modules/`, `data/`

#### Step 3: Add Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### Prettier Setup

#### Step 1: Install

```bash
npm install -D prettier eslint-config-prettier
```

#### Step 2: Configure

Create `.prettierrc` at repo root:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Create `.prettierignore`:

```
dist/
node_modules/
data/
*.db
package-lock.json
```

#### Step 3: Add Scripts

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Vitest Setup

#### Step 1: Install

```bash
npm install -D vitest @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom jsdom --workspace=frontend
```

#### Step 2: Root Config

Create `vitest.config.ts` at repo root with workspace definitions:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: ['shared', 'backend', 'frontend'],
  },
});
```

Per-package configs override as needed (frontend needs `jsdom` environment).

#### Step 3: Add Scripts

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run build
      - run: npm run test:unit

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm start &
      - run: npx wait-on http://localhost:3001/health
      - run: cd frontend && npx playwright test
```

### Pre-Commit Hooks

#### Step 1: Install

```bash
npm install -D husky lint-staged
npx husky init
```

#### Step 2: Configure

Add to root `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

Update `.husky/pre-commit`:

```bash
npx lint-staged
```

### Error Handling Standardization

The backend currently uses ad-hoc try/catch with inconsistent status codes. Standardize with:

1. **Shared error class** in `shared/src/utils/AppError.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists') {
    return new AppError(409, message, 'CONFLICT');
  }

  static badRequest(message = 'Invalid request') {
    return new AppError(400, message, 'BAD_REQUEST');
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }
}
```

2. **Controller pattern**: Throw `AppError` instances instead of manually constructing responses for errors. The global error handler in `index.ts` catches them and formats the response.

3. **Middleware update**: Enhance the global error handler to check for `AppError` instances.

### Docker Optimization

Current Dockerfile is solid (multi-stage, alpine, non-root user, healthcheck). Potential improvements:

- Add `.dockerignore` entries for new tooling dirs (`.github/`, `.husky/`)
- Layer caching optimization for `npm ci`
- Build arg for `NODE_ENV`

## Output Format

The specialist produces:

- Configuration files (ESLint, Prettier, Vitest, CI workflows, husky)
- Script additions to `package.json` files
- Shared utility code (AppError class)
- Documentation updates if the setup process has noteworthy steps

## Learning Protocol

### Read on Entry

- `.cursor/skills/_learnings/infra_log.json` — prior setup decisions, config gotchas, CI fixes

### Write on Exit

Append to `infra_log.json`:

```json
{
  "discovered_at": "ISO-8601",
  "tags": ["infrastructure", "tool-name"],
  "finding": "What was configured or learned",
  "context": "Why this decision was made",
  "config_files": ["affected config file paths"]
}
```

## Constraints

- Don't add dependencies without confirming with the user first
- ESLint rules should start lenient (warnings) and tighten over time
- CI pipeline should be fast — parallelize where possible
- Pre-commit hooks must not block on slow operations (no full test suite)
- Docker changes should be tested with `docker compose build` before committing
- Don't reformat the entire codebase in one commit — do it as a separate, isolated change
