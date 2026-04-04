---
name: git-commit
description: Guide the full git commit workflow — staging, crafting Conventional Commit messages, detecting breaking changes, and post-commit verification. Use when the user asks to commit, write a commit message, stage changes, or review staged diffs.
---

# Git Commit Workflow

## Conventional Commits Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, semicolons, etc. (no logic change)          |
| `test`     | Adding or updating tests                                |
| `chore`    | Build, CI, tooling, dependencies                        |
| `perf`     | Performance improvement                                 |
| `ci`       | CI/CD pipeline changes                                  |
| `build`    | Build system or dependency changes                      |
| `revert`   | Reverts a previous commit                               |

### Scope

Optional parenthetical noun describing the section of the codebase:

- `feat(auth):` `fix(api):` `refactor(db):`
- Derive scope from the primary area of change (module, component, service)

### Description

- Imperative mood, lowercase, no period: `add user login endpoint`
- Max 72 characters

---

## Full Workflow

### Step 1: Inspect Changes

Run these in parallel:

```bash
git status                    # untracked + modified files
git diff                      # unstaged changes
git diff --cached             # already staged changes
git log --oneline -5          # recent commit style reference
```

### Step 2: Stage Files

- Stage only files relevant to a single logical change
- Never stage secrets (`.env`, credentials, tokens)
- If changes span multiple concerns, split into separate commits

### Step 3: Detect Breaking Changes

Scan the diff for breaking-change signals:

| Signal                        | Examples                                               |
| ----------------------------- | ------------------------------------------------------ |
| Removed or renamed public API | Deleted export, renamed function/class                 |
| Changed function signature    | New required param, removed param, changed return type |
| Changed data schema           | Renamed DB column, removed field, changed type         |
| Changed config format         | Renamed env var, changed config key structure          |
| Removed CLI flag or option    | Dropped a previously supported argument                |

If any signal is found:

1. Append `!` after the type/scope: `feat(api)!: remove legacy auth endpoint`
2. Add a `BREAKING CHANGE:` footer describing the migration path

### Step 4: Craft the Commit Message

**Subject line formula**: `<type>(<scope>)!?: <imperative description>`

**Body** (when needed — multi-file changes, non-obvious reasoning):

- Blank line after subject
- Explain _why_, not _what_ (the diff shows what)
- Wrap at 72 characters

**Footer** (when needed):

- `BREAKING CHANGE: <migration instructions>`
- Issue refs if applicable

### Step 5: Commit

Always use a HEREDOC for multi-line messages:

```bash
git commit -m "$(cat <<'EOF'
feat(auth): add JWT refresh token rotation

Rotate refresh tokens on each use to limit replay-attack window.
Expired refresh tokens now return 401 instead of silently failing.

BREAKING CHANGE: /api/auth/refresh now returns a new refresh_token
in every response. Clients must persist the updated token.
EOF
)"
```

For single-line messages:

```bash
git commit -m "fix(api): handle null response from upstream service"
```

### Step 6: Verify

```bash
git log -1 --format='%h %s'   # confirm subject
git status                      # confirm clean working tree
```

---

## Examples

**Simple bug fix:**

```
fix(parser): prevent crash on empty input array
```

**Feature with body:**

```
feat(dashboard): add real-time notification bell

Poll /api/notifications every 30s and display unread count
in the top nav. Includes visual badge and dropdown panel.
```

**Breaking change:**

```
feat(api)!: switch authentication from session cookies to JWT

All endpoints now require a Bearer token in the Authorization header.
Session-based auth is no longer supported.

BREAKING CHANGE: Clients must obtain a JWT from POST /api/auth/login
and include it as `Authorization: Bearer <token>` on every request.
Cookie-based sessions are removed.
```

**Chore:**

```
chore(deps): upgrade express from 4.18 to 4.21
```

**Revert:**

```
revert: feat(dashboard): add real-time notification bell

This reverts commit 3a1b2c4. The polling caused excessive API load
under high concurrency.
```

---

## Quick-Reference Checklist

- [ ] Changes are logically grouped (one concern per commit)
- [ ] No secrets or generated files staged
- [ ] Subject is imperative, lowercase, ≤72 chars, no trailing period
- [ ] Type is correct (`feat` vs `fix` vs `refactor` etc.)
- [ ] Scope matches the primary area of change
- [ ] Breaking changes have `!` suffix AND `BREAKING CHANGE:` footer
- [ ] Body explains _why_ when the change is non-obvious
- [ ] Post-commit `git log` and `git status` confirm success
