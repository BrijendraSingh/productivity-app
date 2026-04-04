# Cursor Setup Guide

How to use this project with the self-learning agent framework in Cursor.

## Prerequisites

- **Cursor IDE** with agent mode enabled
- **Git** — the project should be a git repository
- **/skill-creator** (optional but recommended) — install from `~/.agents/skills/skill-creator/` for full skill testing and iteration capabilities

## First-Time Setup

### Option A: Bootstrap Script

If applying the template to a new repo:

```bash
# From the cursor-agent-bootstrap directory
./scripts/bootstrap.sh /path/to/your-repo "Your Project Name"
```

This copies the template structure, replaces placeholder tokens, and prepares the project for scanning.

### Option B: Manual Setup

1. Copy the `.cursor/` directory into your project root
2. Copy `AGENTS.md` into your project root
3. Copy `docs/agent.md` into your project
4. Replace all `{{placeholder}}` tokens with project-specific values

### After Setup

1. Open the project in Cursor
2. Fill in remaining `{{placeholder}}` fields in `AGENTS.md` and `docs/agent.md`
3. Ask Cursor: **"Scan this project and set up specialist agents"**
4. Review the scan report (created at `docs/scan-report.md` by the project-scanner)
5. Approve the proposed specialists — the skill-factory creates them automatically

## How It Works

When you ask Cursor to do something, the always-active routing rule (`.cursor/rules/subagent-router.mdc`) checks if the task matches a specialist domain. If it does, the main agent delegates to the specialist via the Task tool. The specialist reads its SKILL.md playbook and `_learnings` files, does the work, and writes new discoveries back to the learning store. If no specialist matches, the main agent handles the task directly.

For the full architecture diagram and memory layer breakdown, see [`AGENTS.md`](../AGENTS.md).

### Adding a New Specialist

You can add specialists anytime:

1. **Ask Cursor**: "Create a specialist for [domain]" — the skill-factory handles it
2. **Or scan again**: "Re-scan the project for new domains" — project-scanner finds what's changed

### Improving a Skill

Skills improve in two ways:

1. **Automatically**: The `_learnings` store grows with each interaction, making specialists smarter
2. **Manually**: Ask Cursor "Improve the [domain] skill" — the skill-factory re-drafts and tests it

## Troubleshooting

### Agent isn't delegating to specialists
Check that `.cursor/rules/subagent-router.mdc` has `alwaysApply: true` and the routing table has an entry for the relevant keywords.

### Specialist doesn't use accumulated knowledge
Make sure the specialist's `_learnings` files exist (even as empty `[]`) and the Learning Protocol section in its SKILL.md correctly lists them.

### Skill-factory can't test skills
Ensure the /skill-creator is installed. Without it, the skill-factory falls back to lightweight testing (manual prompt execution without the full eval/benchmark pipeline).

### Bootstrap script says files already exist
The bootstrap script never overwrites existing files. To upgrade to a newer template version, use `scripts/upgrade.sh`. For a fresh start, back up `.cursor/skills/_learnings/` first, then delete `.cursor/` and re-run bootstrap.

### A `_learnings` JSON file is corrupted
Run `scripts/validate.sh` to identify invalid JSON files. Manually fix the JSON syntax or restore from git history.

### Template seems partially applied
Run `scripts/validate.sh` to verify all expected files exist, check JSON validity, and count remaining `{{placeholder}}` tokens.

## Knowledge Promotion Workflow

Over time, `_learnings/*.json` entries should graduate into permanent knowledge:

1. **Discover**: A specialist appends a new entry to its `_learnings` file during work.
2. **Verify**: The same finding is confirmed across 2+ interactions, or a user explicitly validates it.
3. **Promote**: Ask Cursor "promote verified learnings" (or invoke the manage-learnings skill). The skill moves:
   - Domain facts into `config/` files (created by project-scanner or manually as needed)
   - Reusable patterns into `.cursor/knowledge-base/patterns.md`
   - Edge cases into `.cursor/knowledge-base/edge-cases.md` or `docs/agent.md` Lessons Learned
4. **Mark**: The original `_learnings` entry gets a `"promoted_to"` field so it isn't promoted again.
5. **Compact**: When a file exceeds ~500 entries, ask Cursor "compact learnings" to merge duplicates and trim superseded entries.

## Config Directory Conventions

When the project-scanner or specialists create `config/` files for domain-specific configuration:

- Use JSON for machine-readable config, YAML for human-readable config
- Every config file should have a comment or description field explaining its purpose
- Never store secrets in config files — use `.env` and environment variables instead
- Reference config files from SKILL.md playbooks so specialists know where to look
