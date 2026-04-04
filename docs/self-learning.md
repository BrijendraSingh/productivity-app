# Self-Learning Documentation

> This document describes how the AI agent system learns and retains knowledge in this repository.

## How Learning Works

This repo uses the **cursor-agent-bootstrap** framework. Specialist subagents accumulate knowledge in JSON files under `.cursor/skills/_learnings/`. Each interaction can produce a learning entry that persists across sessions.

### Learning Flow

1. **Task execution** -- A specialist subagent completes work
2. **Write-back** -- The subagent appends a structured entry to its `_learnings` JSON file
3. **Accumulation** -- Entries grow over time, building domain-specific knowledge
4. **Promotion** -- High-value patterns get promoted to `.cursor/knowledge-base/` or `docs/agent.md`
5. **Compaction** -- When files grow large (>500 entries), the manage-learnings specialist consolidates them

## Learning Store Location

- **Primary store**: `.cursor/skills/_learnings/`
- **Index**: `.cursor/skills/_learnings/index.json`
- **Schema**: `.cursor/skills/_learnings/entry.schema.json`
- **Improvement log**: `.cursor/skills/_learnings/improvement_log.json`

## Entry Format

Each learning entry follows this schema:

```json
{
  "discovered_at": "ISO-8601 timestamp",
  "source": "specialist name or user interaction",
  "summary": "Brief description of the learning",
  "details": "Detailed context and reasoning",
  "tags": ["domain", "keyword1", "keyword2"],
  "confidence": "high | medium | low"
}
```

## Promoting Learnings

To promote learnings from the JSON store to curated documentation:

1. Ask: "Promote learnings" or "Summarize learnings"
2. The manage-learnings specialist reviews entries, identifies high-value patterns
3. Promoted content goes to `.cursor/knowledge-base/patterns.md` or `docs/agent.md`

## Reviewing Learnings

To review what the system has learned:

1. Ask: "Show recent learnings" or "Audit memory"
2. The manage-learnings specialist will summarize recent entries by domain
3. You can request compaction if the store is getting large

## Engineering Memory

The file `docs/agent.md` serves as the long-term engineering memory for this project. It contains:

- Architecture overview and module descriptions
- Decision log with rationale
- Lessons learned
- Known gaps and areas for improvement

The continuous-learner specialist keeps this file updated after significant architectural decisions or lessons.
