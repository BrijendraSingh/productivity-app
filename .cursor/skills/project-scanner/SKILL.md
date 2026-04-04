---
name: project-scanner
description: Analyzes a repository to discover its domains, architecture, and repeatable workflows, then proposes specialist subagents for each domain. Use this skill when bootstrapping the agent framework on a new project, when onboarding a repo into the self-learning subagent system, when the project has evolved significantly and the specialist roster needs re-evaluation, or when someone says "scan this project", "set up agents", "bootstrap", or "what domains does this project have".
intent_examples:
  - 'Scan this project and set up specialist agents'
  - 'What domains does this codebase have?'
  - 'Analyze this repo for me'
  - 'Bootstrap the agent framework here'
  - 'Re-scan the project for new domains'
  - 'Set up agents for this repo'
  - 'Onboard this repository'
  - 'What areas of this project could use specialists?'
---

## Role

The project-scanner skill transforms any repository into a self-learning agent system by discovering what the project does, identifying its distinct knowledge domains, and producing a structured proposal for specialist subagents that can be created via the skill-factory.

## When to Use

- First-time setup of the agent framework on a new repo
- Re-scanning after significant project evolution
- Auditing whether the current specialist roster matches the actual codebase

## Prerequisites

- The repo must be cloned locally and accessible
- Read access to the repo's source files, configs, docs, and tests
- The cursor-agent-bootstrap has been applied (AGENTS.md, .cursor/ structure exists)

## Halt and Ask

Stop and ask the user if:

- The repo is a monorepo with 5+ distinct packages — confirm scope before deep-diving
- You find no clear domain boundaries — the project might be too small for specialization
- There are conflicting README/docs about what the project does
- You can't determine the primary language or framework

## Workflow

### Phase 1: Broad Reconnaissance (parallel where possible)

Gather the following in parallel:

1. **Structure**: Directory tree (top 3 levels), count of files by extension
2. **Manifests**: All package/dependency manifests — extract dependencies, scripts, entry points
3. **CI/CD**: Workflow files, deploy configs — understand the build/test/deploy pipeline
4. **Docs**: README, any docs/ directory, architecture diagrams, ADRs
5. **Tests**: Test directory structure, test framework, test naming patterns
6. **Existing Agent Artifacts**: Check for `.cursor/`, `AGENTS.md`, `docs/agent.md`
7. **Config**: All config/env files — understand what's configurable vs hardcoded

### Phase 2: Domain Identification

From the gathered data, identify distinct domains. A good domain:

- Has its own files/directories that don't heavily overlap with other domains
- Involves repeatable workflows that agents would help with
- Has enough complexity to benefit from specialized knowledge
- Has concepts and terminology worth pre-training a specialist on

Common domain patterns to look for:

- **API/Routes**: HTTP endpoints, middleware, request/response handling
- **Data/Database**: Models, migrations, queries, ORM patterns
- **Auth/Security**: Authentication, authorization, token management
- **Business Logic**: Core domain logic, algorithms, rules engines
- **Integration**: External service clients, webhooks, message queues
- **Infrastructure**: Docker, K8s, Terraform, deploy scripts
- **Testing**: Test frameworks, fixtures, mocks, test data generation
- **UI/Frontend**: Components, state management, routing
- **CLI**: Command-line interfaces, argument parsing
- **Reporting**: Report generation, dashboards, visualization

### Phase 3: Workflow Discovery

For each domain, identify repeatable workflows:

- What tasks does a developer do repeatedly in this domain?
- What requires domain-specific knowledge to do correctly?
- What has gotchas or edge cases that trip people up?
- What would a new team member need to learn?

### Phase 4: Produce Scan Report

Write the scan report to `docs/scan-report.md` using the template in the project-scanner agent definition. Each domain entry should include enough detail for the skill-factory to create a specialist without re-reading the entire codebase.

### Phase 5: User Validation

Present the scan report summary to the user. Ask them to:

1. Confirm, modify, or remove proposed domains
2. Add domains the scan missed
3. Prioritize which specialists to create first
4. Flag any security-sensitive areas that need special handling

### Phase 6: Trigger Skill Factory

After user approval, for each approved domain (in priority order):

1. Compose a skill-factory delegation prompt with the domain proposal details
2. Delegate to the skill-factory specialist via the Task tool
3. The skill-factory will create the SKILL.md, agent definition, routing entry, and \_learnings schema

## Output Format

The primary output is `docs/scan-report.md`. Secondary outputs include conversation summaries and delegation prompts for the skill-factory.

## Learning Protocol

### Read on Entry

- `.cursor/skills/_learnings/scan_history.json` — prior scans and corrections

### Write on Exit

Append to `scan_history.json`:

```json
{
  "discovered_at": "ISO-8601",
  "tags": ["scan", "domain-discovery"],
  "project_path": "/path/to/repo",
  "domains_discovered": ["domain1", "domain2"],
  "domains_approved": ["domain1"],
  "domains_rejected": ["domain2"],
  "user_additions": ["domain3"],
  "notes": "Any observations about scan quality"
}
```

## Reference Documents

- `references/domain-patterns.md` — common domain archetypes and their typical file structures
- `references/specialist-template.md` — template for domain proposals

## Constraints

- Never modify source code — you are a read-only analyzer
- Base analysis on actual code, not just file names or README claims
- Prefer fewer, higher-quality domains over many shallow ones
- A project with fewer than 3 source files per proposed domain is probably too granular
- Don't propose a specialist for a domain that has no repeatable workflow
