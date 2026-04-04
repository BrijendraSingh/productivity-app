---
name: skill-factory
description: Creates, tests, and iterates on specialist skills and agent definitions using the /skill-creator methodology. Use this skill when a new domain has been identified and needs a full specialist setup (SKILL.md + agent definition + routing + learnings), when an existing skill needs improvement, when someone says "create a skill for X", "improve the Y skill", "add a specialist for Z", or when the project-scanner has proposed domains that need specialists built.
intent_examples:
  - "Create a skill for database migrations"
  - "Add a specialist for the API layer"
  - "Improve the testing skill"
  - "Make a new agent for deployment"
  - "Build a specialist for authentication"
  - "The auth skill isn't working well, iterate on it"
  - "Draft a skill for CI/CD workflows"
---

## Role

The skill-factory transforms domain proposals into production-quality skills with full agent wiring. It follows the /skill-creator methodology for drafting, testing, and iterating on skills until they reliably produce useful output.

## When to Use

- After the project-scanner proposes new domains
- When a user requests a new specialist for a specific workflow
- When an existing skill is underperforming and needs revision
- When adding capabilities to the agent system

## Prerequisites

- A clear domain proposal (from project-scanner or user) with: name, description, key files, workflows, routing keywords
- Access to the /skill-creator methodology (bundled via skill reference)
- The target project's codebase must be accessible for testing

## Halt and Ask

Stop and ask the user if:
- The domain proposal is too vague to create a useful skill
- The proposed specialist would overlap significantly with an existing one
- The skill would need access to external services or MCPs not currently available
- You're unsure whether to create a new skill or extend an existing one

## Workflow

### Phase 1: Domain Intake

Validate the domain proposal has all required fields:
- **Name** (kebab-case, max 64 chars)
- **Description** (what and when, under 1024 chars)
- **Key Files** the specialist would own
- **Repeatable Workflows** the skill enables
- **Routing Keywords** for the subagent-router
- **Proposed _learnings files** with their purpose

If anything is missing, ask the project-scanner or user for it.

### Phase 2: Draft Artifacts

Create all artifacts in one pass:

#### 2a. SKILL.md

Write `.cursor/skills/<domain-name>/SKILL.md`:

```yaml
---
name: <domain-name>
description: <third-person, slightly pushy for discoverability>
---
```

Body sections:
- **Role**: What this skill enables (1 paragraph)
- **When to Use**: Trigger conditions and natural-language phrases
- **Prerequisites**: Tools, env vars, auth, MCPs
- **Halt and Ask**: When to stop and confirm with user
- **Workflow**: Step-by-step procedure (the meat of the skill)
- **Output Format**: What the specialist produces
- **Learning Protocol**: Read/write instructions for `_learnings/` files with JSON schemas
- **Reference Documents**: Pointers to deeper docs
- **Constraints**: Safety and boundary rules

Writing tips (from the skill-creator methodology):
- Explain the "why" behind instructions — models generalize better from reasoning than from rigid rules
- Keep it under 500 lines — use reference docs for overflow
- Include examples where they materially improve output quality
- Make halt conditions specific and actionable

#### 2b. Agent Definition

Write `.cursor/agents/<domain-name>-specialist.md`:

```yaml
---
name: <domain-name>-specialist
description: <what this specialist owns and when to invoke it>
---
```

Body sections:
- **Identity**: One-paragraph role statement
- **Domain Knowledge**: Key concepts, terminology, architecture patterns
- **Files You Own**: Table of files and their roles
- **Reference Documents**: External docs to consult
- **Persistent Memory**: `_learnings` files to read on entry and write on exit
- **Self-Learning Protocol**: What to capture and JSON write format
- **Constraints**: Safety and boundary rules

#### 2c. Routing Entry

Add a row to `.cursor/rules/subagent-router.mdc` at the `<!-- ADD_ROUTES_HERE -->` marker:

```
| <routing keywords> | `.cursor/agents/<name>-specialist.md` | `.cursor/skills/<name>/SKILL.md` | generalPurpose |
```

#### 2d. _learnings Schema

Create initial JSON files in `.cursor/skills/_learnings/` and add them to `_learnings/README.md`.

#### 2e. Cross-Reference Updates

- Add the specialist to the registry table in `AGENTS.md` at `<!-- ADD_SPECIALISTS_HERE -->`
- Update `docs/agent.md` if the new domain adds architectural context

### Phase 3: Test With /skill-creator

Follow the skill-creator's test/eval loop:

1. **Write 2-3 realistic test prompts** — what a real user would actually type. Make them specific with context, not abstract requests.
2. **Run with-skill test cases** using the Task tool — spawn a subagent that reads the skill and executes the test prompt.
3. **Evaluate results** — check if the specialist followed the skill's workflow, produced the right output format, and read/wrote learnings correctly.
4. **Iterate** — revise the SKILL.md based on what worked and what didn't. Focus on:
   - Removing instructions that didn't help
   - Adding clarification where the specialist went off-track
   - Improving the "why" explanations
   - Tightening halt conditions that were too loose
5. **Repeat** until the skill produces reliable, useful output on all test prompts.

### Phase 4: Validation

Before declaring the skill complete:
1. Verify SKILL.md has valid YAML frontmatter with `name` and `description`
2. Verify the agent definition is internally consistent with the skill
3. Verify the routing entry matches the specialist's keywords
4. Verify `_learnings` JSON schemas are documented
5. Verify cross-references in AGENTS.md and _learnings/README.md are updated

## Learning Protocol

### Read on Entry
- `.cursor/skills/_learnings/skill_creation_log.json` — prior skill creation history

### Write on Exit
Append to `skill_creation_log.json`:
```json
{
  "discovered_at": "ISO-8601",
  "tags": ["skill-creation", "domain-name"],
  "skill_name": "domain-name",
  "source": "project-scanner | user-request",
  "iterations": 2,
  "test_prompts": ["prompt1", "prompt2"],
  "outcome": "success | needs-more-iteration",
  "notes": "What worked, what was tricky"
}
```

## Constraints

- Every SKILL.md must have YAML frontmatter with `name` and `description`
- Skill names: kebab-case, max 64 characters
- Descriptions: under 1024 characters, no angle brackets
- Main SKILL.md: under 500 lines (use reference docs for overflow)
- Every skill must have a Learning Protocol section
- Never create a skill without at least one test prompt validation
