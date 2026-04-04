#!/usr/bin/env bash
# Validate the cursor-agent-bootstrap health in a target repository.
#
# Usage:
#   ./scripts/validate.sh [/path/to/target-repo]
#
# If no path is given, validates the current directory.
# Checks: file structure, JSON validity, routing table references,
#          YAML frontmatter, cross-references, and placeholder status.

set -euo pipefail

TARGET_DIR="${1:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

errors=0
warnings=0

pass() { echo "  OK:      $1"; }
fail() { echo "  ERROR:   $1"; errors=$((errors + 1)); }
warn() { echo "  WARNING: $1"; warnings=$((warnings + 1)); }

echo "=== Agent Template Validation: $TARGET_DIR ==="

# ---------------------------------------------------------------------------
# 1. Structure checks
# ---------------------------------------------------------------------------
echo ""
echo "--- Required Files ---"

required_files=(
  "AGENTS.md"
  "docs/agent.md"
  "docs/cursor-setup.md"
  ".cursor/rules/subagent-router.mdc"
  ".cursor/rules/agent-memory.mdc"
  ".cursor/rules/code-conventions.mdc"
  ".cursor/agents/project-scanner.md"
  ".cursor/agents/skill-factory.md"
  ".cursor/agents/continuous-learner.md"
  ".cursor/agents/manage-learnings-specialist.md"
  ".cursor/skills/project-scanner/SKILL.md"
  ".cursor/skills/skill-factory/SKILL.md"
  ".cursor/skills/manage-learnings/SKILL.md"
  ".cursor/skills/continuous-learner/SKILL.md"
  ".cursor/skills/_learnings/README.md"
)

for f in "${required_files[@]}"; do
  if [ -f "$TARGET_DIR/$f" ]; then
    pass "$f"
  else
    fail "Missing: $f"
  fi
done

required_dirs=(
  ".cursor/agents"
  ".cursor/skills"
  ".cursor/skills/_learnings"
  ".cursor/rules"
  ".cursor/knowledge-base"
)

for d in "${required_dirs[@]}"; do
  if [ -d "$TARGET_DIR/$d" ]; then
    pass "$d/"
  else
    fail "Missing directory: $d/"
  fi
done

# ---------------------------------------------------------------------------
# 2. JSON validity
# ---------------------------------------------------------------------------
echo ""
echo "--- JSON Validity ---"

json_files=$(find "$TARGET_DIR/.cursor/skills/_learnings" -name "*.json" 2>/dev/null || true)
if [ -z "$json_files" ]; then
  warn "No JSON files found in _learnings/"
else
  for f in $json_files; do
    rel="${f#$TARGET_DIR/}"
    if python3 -c "import json, sys; json.load(open(sys.argv[1]))" "$f" 2>/dev/null; then
      pass "$rel"
    else
      fail "Invalid JSON: $rel"
    fi
  done
fi

# ---------------------------------------------------------------------------
# 3. YAML frontmatter checks
# ---------------------------------------------------------------------------
echo ""
echo "--- YAML Frontmatter ---"

check_frontmatter() {
  local file="$1"
  local rel="${file#$TARGET_DIR/}"
  if [ ! -f "$file" ]; then return; fi

  first_line=$(head -1 "$file")
  if [ "$first_line" != "---" ]; then
    fail "Missing YAML frontmatter: $rel"
    return
  fi

  if grep -q "^name:" "$file" 2>/dev/null; then
    pass "$rel (has name)"
  else
    fail "Frontmatter missing 'name' field: $rel"
  fi

  if grep -q "^description:" "$file" 2>/dev/null; then
    pass "$rel (has description)"
  else
    fail "Frontmatter missing 'description' field: $rel"
  fi
}

for skill_dir in "$TARGET_DIR"/.cursor/skills/*/; do
  if [ -d "$skill_dir" ] && [ "$(basename "$skill_dir")" != "_learnings" ]; then
    skill_file="$skill_dir/SKILL.md"
    if [ -f "$skill_file" ]; then
      check_frontmatter "$skill_file"
    fi
  fi
done

for rule_file in "$TARGET_DIR"/.cursor/rules/*.mdc; do
  if [ -f "$rule_file" ]; then
    rel="${rule_file#$TARGET_DIR/}"
    first_line=$(head -1 "$rule_file")
    if [ "$first_line" = "---" ]; then
      pass "$rel (has frontmatter)"
    else
      fail "Missing frontmatter: $rel"
    fi
  fi
done

# ---------------------------------------------------------------------------
# 4. Routing table references
# ---------------------------------------------------------------------------
echo ""
echo "--- Routing Table References ---"

router="$TARGET_DIR/.cursor/rules/subagent-router.mdc"
if [ -f "$router" ]; then
  while read -r ref; do
    if [ -f "$TARGET_DIR/$ref" ]; then
      pass "Route -> $ref"
    else
      fail "Route references missing file: $ref"
    fi
  done < <(grep -oE '`\.[^`]+\.md`' "$router" 2>/dev/null | tr -d '`' | sort -u)

  while read -r ref; do
    if [ -f "$TARGET_DIR/$ref" ]; then
      pass "Route -> $ref"
    else
      fail "Route references missing skill: $ref"
    fi
  done < <(grep -oE '`\.[^`]+SKILL\.md`' "$router" 2>/dev/null | tr -d '`' | sort -u)
else
  fail "Routing table not found"
fi

# ---------------------------------------------------------------------------
# 5. Cross-reference: AGENTS.md specialist registry
# ---------------------------------------------------------------------------
echo ""
echo "--- AGENTS.md Cross-References ---"

agents_file="$TARGET_DIR/AGENTS.md"
if [ -f "$agents_file" ]; then
  while read -r ref; do
    if [ -f "$TARGET_DIR/$ref" ]; then
      pass "AGENTS.md -> $ref"
    else
      warn "AGENTS.md references $ref but file not found (may be a generated specialist not yet created)"
    fi
  done < <(grep -oE '`\.[^`]+\.md`' "$agents_file" 2>/dev/null | tr -d '`' | sort -u)
fi

# ---------------------------------------------------------------------------
# 6. Placeholder count
# ---------------------------------------------------------------------------
echo ""
echo "--- Placeholders ---"

placeholder_files=0
placeholder_total=0

for f in $(find "$TARGET_DIR" -type f \( -name "*.md" -o -name "*.mdc" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null); do
  count=$(grep -c '{{[^}]*}}' "$f" 2>/dev/null || true)
  if [ "$count" -gt 0 ]; then
    rel="${f#$TARGET_DIR/}"
    warn "$rel has $count placeholder(s)"
    placeholder_files=$((placeholder_files + 1))
    placeholder_total=$((placeholder_total + count))
  fi
done

if [ "$placeholder_total" -eq 0 ]; then
  pass "No remaining placeholders"
else
  warn "$placeholder_total placeholder(s) across $placeholder_files file(s)"
fi

# ---------------------------------------------------------------------------
# 7. Version check
# ---------------------------------------------------------------------------
echo ""
echo "--- Version ---"

version_found=false
for vf in "$TARGET_DIR/.cursor/template-version" "$TARGET_DIR/VERSION"; do
  if [ -f "$vf" ]; then
    version=$(cat "$vf" | tr -d '[:space:]')
    pass "Template version: $version ($(basename "$vf"))"
    version_found=true
    break
  fi
done
if ! $version_found; then
  warn "No template version file found"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Validation Complete ==="
echo "  Errors:   $errors"
echo "  Warnings: $warnings"
echo ""

if [ "$errors" -gt 0 ]; then
  echo "Fix errors before using the agent system."
  exit 1
else
  if [ "$warnings" -gt 0 ]; then
    echo "Template is functional but has warnings to address."
  else
    echo "Template is healthy."
  fi
  exit 0
fi
