# productivity-app: Cursor Agent Guide

Welcome! This repository uses a **self-learning specialist subagent architecture** that automatically discovers project domains, generates specialized skills, and accumulates knowledge across sessions.

## How Agents Should Work Here

This project uses a **ReAct-style agent loop** with a specialist subagent model. The main agent acts as a lightweight **router and coordinator** — it classifies tasks, delegates to domain specialists, and synthesizes results. It does not self-implement specialist work.

1. **Architecture Boundaries**: Three-package npm workspaces monorepo — `shared/` (types/constants/utils) → `backend/` (Express 4 + SQLite3) → `frontend/` (React 18 + Vite 7 + MUI 6). All types must live in `shared/`, never duplicated. Backend controllers own SQL queries; no ORM. Frontend hooks own server state; no Redux/Zustand.
2. **Tool Safety**: All API endpoints are read-write by design (CRUD app). Database is SQLite — single file, no network exposure. Dev credentials (`dev`/`dev`) are intentional for local development only.
3. **Configuration Driven**: Domain knowledge, mappings, and scope live in config files — never hardcoded.
4. **Testing**: When modifying specialist domains, update corresponding tests.

## Key Constraints & Safety

- **Required Env Vars**: `PORT` (3001), `DATABASE_PATH` (SQLite file), `FRONTEND_URL` (CORS origin), `ALLOW_REGISTRATION` (production). See `.env.example` for full list.
- **External Data Policy**: All data stays local — SQLite file at `data/productivity_app.db`. No external API calls, no telemetry, no cloud storage. User data is scoped by `user_id` on every query.
- **Continuous Learning**: After every non-trivial interaction (success or failure), the learning store MUST be updated. This is not optional — accumulated knowledge is what makes the system improve over time.

## Specialist Subagent Architecture

### How It Works

```
User Request
    │
    ▼
┌──────────────────┐
│  Routing Rule    │  .cursor/rules/subagent-router.mdc
│  (always active) │  matches intent → specialist
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌────────────────────┐
│ Specialist Agent │ ◄── │ SKILL.md playbook  │
│ .cursor/agents/  │     │ .cursor/skills/    │
│ <name>.md        │     │ <name>/SKILL.md    │
└────────┬─────────┘     └────────────────────┘
         │
         ▼
┌──────────────────┐
│ _learnings/*.json│  persistent memory — read before, write after
│ docs/agent.md    │  engineering memory — decisions, edge cases, gaps
└──────────────────┘
```

1. **Routing Rule** (`.cursor/rules/subagent-router.mdc`): Matches task keywords/intent to the right specialist and mandates delegation via the Task tool.
2. **Specialist Agents** (`.cursor/agents/*.md`): Each carries compressed domain knowledge, owns specific files and `_learnings` stores, and follows a read-learn-write protocol.
3. **Skills** (`.cursor/skills/*/SKILL.md`): Detailed reference playbooks that specialists consult — these are NOT for the main agent to self-implement.

### Specialist Registry

<!-- GENERATED — this table is populated by the project-scanner skill or manually -->

| Specialist            | Agent File                                           | Skill Playbook                                  | Domain                                                         |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| project-scanner       | `.cursor/agents/project-scanner.md`                  | `.cursor/skills/project-scanner/SKILL.md`       | Codebase analysis, domain discovery, specialist generation     |
| skill-factory         | `.cursor/agents/skill-factory.md`                    | `.cursor/skills/skill-factory/SKILL.md`         | Skill creation, testing, iteration using /skill-creator        |
| continuous-learner    | `.cursor/agents/continuous-learner.md`               | `.cursor/skills/continuous-learner/SKILL.md`    | Cross-cutting memory maintenance in `docs/agent.md`            |
| manage-learnings      | `.cursor/agents/manage-learnings-specialist.md`      | `.cursor/skills/manage-learnings/SKILL.md`      | `_learnings/` store operations (compact, promote, audit)       |
| fullstack-feature-dev | `.cursor/agents/fullstack-feature-dev-specialist.md` | `.cursor/skills/fullstack-feature-dev/SKILL.md` | End-to-end feature development across shared/backend/frontend  |
| playwright-qa         | `.cursor/agents/playwright-qa-specialist.md`         | `.cursor/skills/playwright-qa/SKILL.md`         | Playwright E2E tests, unit test infrastructure, QA coverage    |
| bug-investigator      | `.cursor/agents/bug-investigator-specialist.md`      | `.cursor/skills/bug-investigator/SKILL.md`      | Cross-stack debugging: frontend → API → SQLite                 |
| code-quality-infra    | `.cursor/agents/code-quality-infra-specialist.md`    | `.cursor/skills/code-quality-infra/SKILL.md`    | ESLint, Prettier, Vitest, CI/CD, Docker, error standardization |

<!-- ADD_SPECIALISTS_HERE -->

## Continuous Learning System

This project uses a **layered memory architecture** that grows smarter with every interaction:

| Layer                  | Location                            | Role                                      | Mutability              |
| ---------------------- | ----------------------------------- | ----------------------------------------- | ----------------------- |
| **Guardrails**         | `AGENTS.md` + `.cursor/rules/`      | What agents must/must not do              | Static                  |
| **Routing**            | `.cursor/rules/subagent-router.mdc` | Which specialist handles which task       | Static                  |
| **Specialists**        | `.cursor/agents/*.md`               | Pre-trained domain experts                | Semi-static             |
| **Skill Playbooks**    | `.cursor/skills/*/SKILL.md`         | Detailed procedures and reference docs    | Semi-static             |
| **Skill Memory**       | `.cursor/skills/_learnings/*.json`  | Accumulated runtime knowledge per domain  | Grows every interaction |
| **Engineering Memory** | `docs/agent.md`                     | Cross-cutting decisions, edge cases, gaps | Grows over time         |
| **Knowledge Base**     | `.cursor/knowledge-base/`           | Human-readable patterns and edge cases    | Curated periodically    |
| **Config**             | `config/` (created as needed)       | Domain-specific data, mappings, scope     | Updated as needed       |

Before making architectural decisions, consult the **Decision Log** in `docs/agent.md`. After discovering edge cases or fixing bugs, append to **Lessons Learned**.

## Bootstrap Workflow

When this template is applied to a new project:

1. **Scan**: Invoke the `project-scanner` skill — it analyzes the repo and proposes specialist domains.
2. **Generate**: For each discovered domain, invoke the `skill-factory` skill — it drafts a SKILL.md, agent definition, routing entry, and `_learnings` schema.
3. **Test**: The skill-factory uses `/skill-creator` to run eval prompts against each generated skill and iterate until quality is acceptable.
4. **Wire**: The routing table, specialist registry, and `_learnings/README.md` are auto-updated.
5. **Learn**: From the first real interaction onward, the learning store accumulates knowledge.

## Where to Find More

- **README**: [`README.md`](README.md) — project overview, quick start, how to bootstrap
- **Setup Guide**: [`docs/cursor-setup.md`](docs/cursor-setup.md) — setup, troubleshooting, knowledge promotion workflow
- **Architecture & Memory**: [`docs/agent.md`](docs/agent.md) — Decision Log, Lessons Learned, Known Gaps
- **Scan Report**: `docs/scan-report.md` — created by project-scanner on first scan
- **Specialist Agents**: `.cursor/agents/` — domain-specific subagents
- **Skills & Playbooks**: `.cursor/skills/` — detailed procedures per domain
- **Delegation Protocol**: [`docs/delegation-protocol.md`](docs/delegation-protocol.md) — full delegation steps and selective loading rules
- **Routing Rule**: `.cursor/rules/subagent-router.mdc` — task-to-specialist dispatch with complexity threshold
- **Learning Store**: `.cursor/skills/_learnings/` — accumulated JSON knowledge (see `entry.schema.json` for format)
- **Knowledge Base**: `.cursor/knowledge-base/` — human-readable patterns, edge cases, evolution log
- **Config**: `config/` — domain-specific configuration files (created by project-scanner or specialists as needed)
- **Scripts**: `scripts/bootstrap.sh` (install), `scripts/validate.sh` (health check), `scripts/upgrade.sh` (update)
- **Version**: `.cursor/template-version` — template version tracking
