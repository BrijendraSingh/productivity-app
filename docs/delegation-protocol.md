# Delegation Protocol Reference

Detailed instructions for how the main agent delegates to specialist subagents. This document is referenced by `subagent-router.mdc` and only needs to be read when delegation is actually happening.

## Full Delegation Steps

When a task matches a specialist domain in the Routing Table:

1. **Read the agent definition** (`.cursor/agents/<name>.md` from the table).
2. **Read the `_learnings` files** listed in the agent definition under "Persistent Memory". For files with many entries, load only the last 50 entries or entries tagged with relevant keywords to keep context usage manageable.
3. **Compose the Task tool prompt** by combining:
   - The full agent definition content
   - The relevant `_learnings` entries (filtered by recency or tag relevance)
   - The relevant SKILL.md content
   - The user's specific request and conversation context
   - Instructions to write back to `_learnings/` files after completing the work
4. **Invoke** via the Task tool with `subagent_type` from the routing table.
5. **After the specialist returns**, proceed to the Post-Work Protocol.

**NEVER** read the skill and then implement the changes yourself. The skill is a reference playbook FOR the specialist, not for you.

## Multi-Domain Tasks

When a task touches multiple specialist domains:

1. **Identify all matched domains** from the Routing Table.
2. **Check for dependencies**:
   - **Independent** domains: launch specialists **in parallel** via concurrent Task tool calls.
   - **Dependent** domains (one needs another's output): launch **sequentially**.
3. **Synthesize results**: After all specialists return, coordinate integration -- merge overlapping changes, resolve conflicts, verify tests.
4. **Self-implementation is permitted ONLY for**: integration glue code that doesn't belong to any single specialist domain.

## Post-Work Protocol

After completing work in any specialist domain:

1. **Write back to `_learnings/`**: Update the skill's learning files as specified in its Learning Protocol. This is NOT optional.
2. **Log the delegation**: Append an entry to `_learnings/delegation_log.json` (see Delegation Tracking below).
3. **Invoke the continuous-learner**: Only if architectural decisions were made, config schemas changed, or new edge cases discovered.
4. **Verify tests pass**: If code was modified, confirm tests pass.
5. **Delegation audit**: Report to the user which specialists were invoked, which `_learnings` were read/written, and whether delegation was parallel or sequential.

## Delegation Tracking

After every delegation (or direct handling of a substantive task), append an entry to `_learnings/delegation_log.json`:

```json
{
  "discovered_at": "ISO-8601",
  "tags": ["delegation", "specialist-name"],
  "specialist": "project-scanner | skill-factory | continuous-learner | manage-learnings | direct",
  "task_summary": "Brief description of the task",
  "complexity": "trivial | moderate | complex",
  "outcome": "success | partial | failure",
  "learnings_read": ["scan_history.json"],
  "learnings_written": ["scan_history.json"],
  "notes": "Optional — what went well, what didn't, any observations"
}
```

Use `"specialist": "direct"` when the main agent handled the task without delegation (only for substantive tasks, not trivial edits).

This log enables the manage-learnings `Effectiveness Report` workflow to measure delegation patterns and identify underperforming specialists.

## Selective Learning Loading

To keep context window usage efficient as `_learnings` files grow:

- If a file has fewer than 30 entries, load it entirely.
- If a file has 30-100 entries, load the most recent 30.
- If a file has 100+ entries, load the last 20 entries plus any entries whose `tags` array intersects with the current task's keywords.
- Always tell the specialist the total entry count so it knows more history exists.
