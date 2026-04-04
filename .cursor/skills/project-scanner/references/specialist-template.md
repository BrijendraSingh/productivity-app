# Specialist Proposal Template

Use this template when producing domain proposals in the scan report. Each proposal should contain enough detail for the skill-factory to create a full specialist without re-reading the entire codebase.

## Template

```markdown
### Domain: [kebab-case-name]

**Description**: [1-2 sentences explaining what this domain covers and why it needs a specialist]

**Key Files and Directories**:

- `path/to/dir/` — [what it contains]
- `path/to/file.ext` — [what it does]

**Config Files**:

- `config/relevant.json` — [what it configures]

**External Dependencies**:

- [API name / database / service] — [how it's used]

**Repeatable Workflows**:

1. [Workflow name] — [what a developer does, step by step]
2. [Workflow name] — [...]

**Domain Terminology**:

- [Term]: [definition in project context]

**Edge Cases and Gotchas**:

- [Known issues, tricky behaviors, common mistakes]

**Proposed Specialist**: `[name]-specialist`

**Routing Keywords**: [keyword1], [keyword2], [keyword3], ...

**Proposed \_learnings Files**:
| File | What it accumulates |
|------|-------------------|
| `[name]_discoveries.json` | [what gets discovered over time] |
| `[name]_patterns.json` | [what patterns get recognized] |

**Bootstrap Priority**: [1-5, with rationale]
```

## Quality Checklist

Before including a domain proposal in the scan report:

- [ ] The domain has at least 3 source files (not too granular)
- [ ] At least one repeatable workflow is identified
- [ ] The domain doesn't heavily overlap with another proposed domain
- [ ] Routing keywords are specific enough to avoid false matches
- [ ] The proposed \_learnings files track knowledge that actually varies across interactions
