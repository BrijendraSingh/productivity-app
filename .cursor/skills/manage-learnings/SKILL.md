---
name: manage-learnings
description: Operates on the _learnings/ JSON knowledge store — compacting large files, promoting verified entries into config, auditing for stale or duplicate entries, and generating learning summaries. Use when someone mentions "learnings", "compact", "promote knowledge", "audit memory", "learning store", or when a _learnings file exceeds 500 entries.
intent_examples:
  - "Compact the learnings store"
  - "Promote verified learnings to config"
  - "Audit the learning files for duplicates"
  - "Summarize what the system has learned"
  - "The scan_history.json is getting too large"
  - "Clean up stale learning entries"
  - "How many learnings do we have?"
---

## Role

The manage-learnings skill maintains the health and utility of the `_learnings/` knowledge store. As specialists accumulate knowledge over time, these JSON files can grow large, contain duplicates, or have entries that should be promoted into permanent config.

## When to Use

- A `_learnings` file has grown past ~500 entries and needs compaction
- Verified discoveries should be promoted into config files or agent definitions
- Periodic audit to clean up stale, duplicate, or conflicting entries
- Generating a summary of what the system has learned

## Workflow

### Compact

When a file is too large (check `index.json` for entry counts, or read the file directly):

1. Read the file completely
2. **Identify duplicates** — two entries are duplicates if:
   - Their `finding` fields are semantically identical (same meaning, different wording), OR
   - They share the same `tags` set and their `finding` fields overlap by 80%+ in content
3. **Merge duplicates**: keep one entry with the most recent `discovered_at`, combine any unique details from both
4. **Remove superseded entries**: if an entry has `superseded_by` set, remove it (the correction remains)
5. **Mark promoted entries**: entries with `promoted_to` set can be removed if the promotion destination still contains the knowledge
6. Write the compacted file back
7. Update `_learnings/index.json` with the new entry count and `last_compacted` timestamp
8. Log the compaction in `_learnings/maintenance_log.json`

### Promote

When entries are verified and should become permanent knowledge:
1. Read the candidate file
2. Identify entries with sufficient evidence (multiple confirmations, user-verified)
3. Move the knowledge into the appropriate permanent location:
   - Domain facts → config files
   - Patterns → agent definitions or SKILL.md domain knowledge sections
   - Edge cases → `docs/agent.md` Lessons Learned
4. Mark promoted entries with `"promoted_to": "<destination>"` (don't delete them)
5. Log the promotion

### Audit

Periodic health check:
1. Read all `_learnings/*.json` files
2. Check for:
   - Files not referenced by any skill's Learning Protocol
   - Entries with missing timestamps
   - Contradictory entries (opposite findings for the same topic)
   - Entries older than 90 days that haven't been referenced
3. Produce an audit report
4. Ask the user before deleting anything

### Summarize

Generate a human-readable summary:
1. Read all `_learnings/*.json` files
2. Group by domain/specialist
3. Produce `.cursor/knowledge-base/learnings-summary.md` with:
   - Total entries per domain
   - Most recent discoveries
   - Most-referenced patterns
   - Candidates for promotion

### Effectiveness Report

Analyze the delegation log to measure how well the specialist system is working:
1. Read `_learnings/delegation_log.json`
2. Compute:
   - **Delegation rate**: How many tasks were delegated vs. handled directly
   - **Success rate per specialist**: Percentage of `"outcome": "success"` entries per specialist
   - **Most active specialists**: Which specialists are invoked most frequently
   - **Underperforming specialists**: Specialists with high failure/partial rates
   - **Routing gaps**: Tasks handled directly that could benefit from a specialist (look for patterns in `"specialist": "direct"` entries)
   - **Learning store growth**: Which `_learnings` files are growing fastest, which are stale
3. Produce `.cursor/knowledge-base/effectiveness-report.md` with findings and recommendations
4. If routing gaps reveal a pattern, suggest creating a new specialist or expanding routing keywords

## Constraints

- Never bulk-delete entries without user confirmation
- Always preserve timestamps and provenance
- Compacted files must have fewer entries but the same or greater information content
- Log all operations in `maintenance_log.json`
- After any file modification, update `_learnings/index.json` with current entry counts
- Validate entries against `_learnings/entry.schema.json` — flag entries missing required fields
