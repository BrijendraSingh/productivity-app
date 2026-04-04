# Common Domain Patterns

Reference guide for the project-scanner when identifying domains in a repository. Each pattern describes a typical domain archetype, the file structures that indicate it, and what a specialist for it would own.

## Backend API / Routes

**Indicators**: `routes/`, `controllers/`, `handlers/`, `api/`, Express/Fastify/Flask/Django router definitions, OpenAPI specs
**Files Owned**: Route definitions, middleware, request validation, response formatting
**Typical Workflows**: Add a new endpoint, modify request/response schema, add middleware
**Learnings to Track**: Endpoint conventions, auth patterns, error response formats

## Data / Database

**Indicators**: `models/`, `migrations/`, `schema/`, `db/`, ORM configs (Prisma, Sequelize, SQLAlchemy, GORM)
**Files Owned**: Model definitions, migration files, seed data, query builders
**Typical Workflows**: Add a new model, create a migration, modify a schema, optimize a query
**Learnings to Track**: Schema conventions, index strategies, migration gotchas

## Authentication / Security

**Indicators**: `auth/`, `middleware/auth`, JWT handling, OAuth configs, RBAC definitions, `passport.js`
**Files Owned**: Auth middleware, token management, role definitions, security policies
**Typical Workflows**: Add a new auth method, modify permissions, rotate secrets
**Learnings to Track**: Token formats, permission hierarchies, security edge cases

## Business Logic / Domain Core

**Indicators**: `services/`, `domain/`, `core/`, `lib/`, pure logic modules with few external deps
**Files Owned**: Service classes, business rule implementations, algorithms
**Typical Workflows**: Add a new business rule, modify calculation logic, handle a new edge case
**Learnings to Track**: Domain terminology, rule interactions, known edge cases

## Integration / External Services

**Indicators**: `clients/`, `integrations/`, `adapters/`, `connectors/`, HTTP clients, queue consumers
**Files Owned**: API client wrappers, webhook handlers, message queue producers/consumers
**Typical Workflows**: Add a new integration, handle API changes, add retry/fallback logic
**Learnings to Track**: API quirks, rate limits, auth token formats, error patterns

## Infrastructure / DevOps

**Indicators**: `Dockerfile`, `docker-compose.yml`, `terraform/`, `k8s/`, `helm/`, `.github/workflows/`
**Files Owned**: Container configs, IaC definitions, CI/CD pipelines, deploy scripts
**Typical Workflows**: Update a deployment, add a new environment, modify CI pipeline
**Learnings to Track**: Environment differences, deploy gotchas, scaling thresholds

## Testing

**Indicators**: `tests/`, `__tests__/`, `spec/`, `e2e/`, test configs (jest.config, pytest.ini, vitest.config)
**Files Owned**: Test files, fixtures, mocks, test utilities, CI test configuration
**Typical Workflows**: Add tests for new feature, update failing tests, add test infrastructure
**Learnings to Track**: Fixture patterns, mock strategies, flaky test causes

## UI / Frontend

**Indicators**: `components/`, `pages/`, `views/`, `src/app/`, React/Vue/Angular/Svelte markers
**Files Owned**: Components, state management, routing, styles, assets
**Typical Workflows**: Add a new page/component, modify state management, update styling
**Learnings to Track**: Component conventions, state patterns, accessibility requirements

## CLI / Command-Line

**Indicators**: `commands/`, `cli.py`, `cli.ts`, `bin/`, argument parsers (yargs, click, cobra)
**Files Owned**: Command definitions, argument parsing, output formatting
**Typical Workflows**: Add a new command, modify output format, add flags
**Learnings to Track**: Argument conventions, output formats, interactive vs non-interactive patterns

## Configuration / Environment

**Indicators**: `config/`, `.env`, `settings.py`, `config.ts`, YAML/JSON config files
**Files Owned**: Config schemas, environment-specific overrides, feature flags
**Typical Workflows**: Add a new config key, modify defaults, add environment support
**Learnings to Track**: Config dependencies, required vs optional settings, env-specific values

## Reporting / Analytics

**Indicators**: `reports/`, `reporting/`, `analytics/`, dashboard code, chart libraries
**Files Owned**: Report generators, data aggregators, visualization templates
**Typical Workflows**: Add a new report section, modify visualization, add data source
**Learnings to Track**: Data formats, aggregation logic, rendering preferences
