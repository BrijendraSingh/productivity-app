---
name: continuous-learner
description: Maintains the engineering memory in docs/agent.md — capturing architectural decisions, lessons learned, edge cases, and known gaps after code changes, bug fixes, or significant interactions. Use when someone mentions "update agent.md", "decision log", "lessons learned", "engineering memory", or after any non-trivial code change.
intent_examples:
  - "Update the engineering memory"
  - "Log this architectural decision"
  - "Add a lessons learned entry"
  - "Check if this conflicts with prior decisions"
  - "Record this edge case"
  - "What does the decision log say about X?"
  - "Mark this known gap as resolved"
---

## Role

The continuous-learner skill maintains `docs/agent.md` as the project's living engineering memory. It captures cross-cutting knowledge that doesn't belong to any single specialist — architectural decisions, failure patterns, resolved and unresolved gaps, and config evolution.

## When to Use

- After a code change that affects architecture or introduces a new pattern
- After a bug fix that revealed a systemic failure mode
- Before an architectural decision, to check for conflicts with prior decisions
- After a specialist completes work, to record cross-cutting observations
- On demand, to review or audit the current state of engineering memory

## Prerequisites

- `docs/agent.md` exists with the standard template sections (Decision Log, Lessons Learned, Known Gaps, Feedback Protocol)
- Read access to git diff or conversation context about what changed

## Halt and Ask

Stop and ask the user if:
- A proposed change contradicts an entry in the Decision Log
- You're unsure whether a finding is significant enough to log (err on the side of logging)
- A Known Gap resolution can't be verified from the available context

## Workflow

### Step 1: Load Current Memory

Read `docs/agent.md` completely. Locate:
- **Decision Log** — prior architectural decisions and rationale
- **Lessons Learned** — known edge cases and failure patterns
- **Known Gaps** — unresolved functional/test limitations
- **Feedback Protocol** — format requirements for writing entries

### Step 2: Assess the Situation

**After a code change:**
1. Review what changed (git diff or conversation context)
2. Cross-reference against the Decision Log — flag contradictions
3. Check if the change resolves a Known Gap — mark it done
4. Check if `docs/agent.md` needs structural updates (new module, new config)

**After a bug fix:**
1. Understand root cause
2. Determine if systemic (likely to recur) or one-off
3. If systemic, draft a Lessons Learned entry

**Before an architectural decision:**
1. Search the Decision Log for related prior decisions
2. Present relevant history to the user
3. If the proposed change conflicts, explain the conflict and ask for confirmation

### Step 3: Write Back to `docs/agent.md`

**Lessons Learned** format:
```
- **Finding**: [What you observed]
  **Impact**: [What breaks or degrades]
  **Status**: [Open | By design | Fixed in <commit>]
  **Date**: YYYY-MM-DD
```

**Decision Log** format:
```
| Date | Decision | Rationale | Alternatives Considered |
```

**Known Gaps** — add a `- [ ]` item under the appropriate subsection. Mark resolved gaps with `- [x]`.

### Step 4: Validate Consistency

After writing back:
1. No duplicate entries in Lessons Learned
2. Decision Log entries don't contradict each other
3. Known Gaps marked resolved are actually fixed in code
4. The Feedback Protocol section is still accurate

## Output Format

Updates to `docs/agent.md` sections. No separate output file.

## Learning Protocol

### Read on Entry
- `.cursor/skills/_learnings/improvement_log.json` — prior improvement history that may contain cross-cutting observations

### Write on Exit
Append to `improvement_log.json` if the session produced a significant finding:
```json
{
  "discovered_at": "ISO-8601",
  "tags": ["engineering-memory", "decision-log"],
  "finding": "What was recorded in docs/agent.md",
  "context": "What triggered this update"
}
```

## Constraints

- **Never modify source code** — only read code and write to `docs/agent.md`
- **Never remove entries** — only append or update status. History is permanent.
- **Never log routine changes** — typo fixes, comment updates, dependency bumps are not worth recording
- **Always include dates** — every entry must be dated for traceability
- **Be concise** — findings should be 1-3 sentences, not paragraphs
