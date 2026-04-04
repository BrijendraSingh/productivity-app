# Skill Learning Store

This directory is a persistent knowledge base shared by all skills in this project. Each specialist reads from and writes to these files, accumulating knowledge with every invocation.

## How It Works

1. **On invocation**: A specialist reads the relevant JSON files here to load prior knowledge (see selective loading rules in `docs/delegation-protocol.md`).
2. **During work**: The specialist uses this knowledge to make better decisions — skip known dead-ends, reuse proven patterns, avoid known gotchas.
3. **After work**: The specialist appends any new discoveries back to the relevant files.

## Entry Format

All entries must conform to `entry.schema.json` in this directory. At minimum, every entry requires:

- `discovered_at` (ISO-8601 timestamp)
- `tags` (array of 1-5 domain keywords for filtering)

Optional fields: `finding`, `context`, `promoted_to`, `superseded_by`. Individual files may add domain-specific fields.

Example entry:
```json
{
  "discovered_at": "2026-04-02T10:30:00Z",
  "tags": ["auth", "api"],
  "finding": "OAuth tokens expire silently after 3600s with no refresh",
  "context": "Discovered during integration testing with provider X"
}
```

## Core Files

Only `improvement_log.json` ships with the template. All other files are created on first use by their owning specialist.

| File | What it accumulates | Written by | Ships with template? |
|------|-------------------|------------|---------------------|
| `improvement_log.json` | What was improved, when, rationale — prevents re-suggesting the same improvement. Also captures routing misses. | All specialists | Yes |
| `scan_history.json` | Project scan results, domain proposals, user corrections | project-scanner | No — created on first scan |
| `skill_creation_log.json` | Skills created, iterations, test prompts, outcomes | skill-factory | No — created on first skill |
| `maintenance_log.json` | Compaction, promotion, and audit operations on the learning store | manage-learnings | No — created on first audit |
| `delegation_log.json` | Records of each delegation — specialist, task, outcome, learnings read/written | main-agent | No — created on first delegation |

| `fullstack_dev_log.json` | Development patterns, cross-package gotchas, feature implementation lessons | fullstack-feature-dev | No — created on first feature task |
| `testing_log.json` | Test patterns, flaky test fixes, coverage observations, infrastructure setup notes | playwright-qa | No — created on first test task |
| `debug_log.json` | Bug root causes, fix patterns, debugging discoveries, common failure modes | bug-investigator | No — created on first debug task |
| `infra_log.json` | Config decisions, tool setup gotchas, CI/CD fixes, Docker changes | code-quality-infra | No — created on first infra task |
<!-- ADD_LEARNINGS_HERE — skill-factory adds new entries as specialists are created -->

## Metadata

- `entry.schema.json` — JSON Schema for validating entries
- `index.json` — Manifest tracking file sizes, entry counts, and last-modified timestamps. Updated during audits/compactions by manage-learnings.

## Rules

- Files are **append-oriented**. New entries are added; existing entries are updated but never bulk-deleted.
- Every entry must include a `discovered_at` timestamp and a `tags` array for traceability and filtering.
- If a file doesn't exist yet, the specialist creates it with an initial entry — don't fail silently.
- If a file exceeds ~500 entries, use the `manage-learnings` skill to compact it.
- JSON files should be valid JSON arrays.
- After compaction or audit, update `index.json` with current entry counts.
