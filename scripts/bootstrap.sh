#!/usr/bin/env bash
# Bootstrap the cursor-agent-bootstrap into a target repository.
#
# Usage:
#   ./scripts/bootstrap.sh /path/to/target-repo [project-name]
#   ./scripts/bootstrap.sh --dry-run /path/to/target-repo [project-name]
#   ./scripts/bootstrap.sh --validate /path/to/target-repo
#   ./scripts/bootstrap.sh --list-placeholders /path/to/target-repo
#   ./scripts/bootstrap.sh --interactive /path/to/target-repo
#
# Flags (must appear before positional args):
#   --dry-run             Preview what will be copied/replaced without making changes
#   --validate            Check template health in an already-bootstrapped repo
#   --list-placeholders   Show all remaining {{...}} placeholders in the target
#   --interactive         Prompt for all placeholder values during bootstrap

set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN=false
VALIDATE_ONLY=false
LIST_PLACEHOLDERS=false
INTERACTIVE=false
CATEGORY=""

while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --dry-run)          DRY_RUN=true; shift ;;
    --validate)         VALIDATE_ONLY=true; shift ;;
    --list-placeholders) LIST_PLACEHOLDERS=true; shift ;;
    --interactive)      INTERACTIVE=true; shift ;;
    --category)         CATEGORY="${2:?--category requires a value}"; shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

TARGET_DIR="${1:?Usage: $0 [flags] /path/to/target-repo [project-name]}"
PROJECT_NAME="${2:-$(basename "$TARGET_DIR")}"
TODAY=$(date +%Y-%m-%d)

if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Target directory '$TARGET_DIR' does not exist."
  exit 1
fi

# ---------------------------------------------------------------------------
# --list-placeholders mode
# ---------------------------------------------------------------------------
if $LIST_PLACEHOLDERS; then
  echo "=== Remaining Placeholders in $TARGET_DIR ==="
  total=0
  for f in $(find "$TARGET_DIR" -type f \( -name "*.md" -o -name "*.mdc" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null); do
    matches=$(grep -c '{{[^}]*}}' "$f" 2>/dev/null || true)
    if [ "$matches" -gt 0 ]; then
      echo ""
      echo "  $f ($matches placeholder(s)):"
      grep -n '{{[^}]*}}' "$f" 2>/dev/null | while read -r line; do
        echo "    $line"
      done
      total=$((total + matches))
    fi
  done
  echo ""
  echo "Total: $total placeholder(s) remaining"
  exit 0
fi

# ---------------------------------------------------------------------------
# --validate mode — delegates to validate.sh for a single source of truth
# ---------------------------------------------------------------------------
if $VALIDATE_ONLY; then
  VALIDATE_SCRIPT="$TEMPLATE_DIR/scripts/validate.sh"
  if [ -f "$VALIDATE_SCRIPT" ]; then
    exec bash "$VALIDATE_SCRIPT" "$TARGET_DIR"
  else
    echo "Error: validate.sh not found at $VALIDATE_SCRIPT"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Bootstrap mode
# ---------------------------------------------------------------------------
echo "=== Cursor Agent Bootstrap ==="
echo "Template:     $TEMPLATE_DIR"
echo "Target:       $TARGET_DIR"
echo "Project Name: $PROJECT_NAME"
if $DRY_RUN; then echo "Mode:         DRY RUN (no changes will be made)"; fi
echo ""

copy_count=0
skip_count=0

copy_if_missing() {
  local src="$1"
  local dest="$2"
  local rel="${dest#$TARGET_DIR/}"

  if [ -e "$dest" ]; then
    echo "  SKIP (exists): $rel"
    skip_count=$((skip_count + 1))
  else
    if $DRY_RUN; then
      echo "  WOULD COPY:    $rel"
    else
      mkdir -p "$(dirname "$dest")"
      cp "$src" "$dest"
      echo "  COPY:          $rel"
    fi
    copy_count=$((copy_count + 1))
  fi
}

copy_dir_if_missing() {
  local src="$1"
  local dest="$2"

  while read -r file; do
    local rel="${file#$src/}"
    copy_if_missing "$file" "$dest/$rel"
  done < <(find "$src" -type f)
}

echo "--- Copying template files ---"

# Handle pre-existing .cursor/rules as a file (legacy format)
if [ -f "$TARGET_DIR/.cursor/rules" ] && [ ! -d "$TARGET_DIR/.cursor/rules" ]; then
  if $DRY_RUN; then
    echo "  WOULD MIGRATE: .cursor/rules (file -> .cursor/rules/legacy-rules.md)"
  else
    rules_content=$(cat "$TARGET_DIR/.cursor/rules")
    rm "$TARGET_DIR/.cursor/rules"
    mkdir -p "$TARGET_DIR/.cursor/rules"
    echo "$rules_content" > "$TARGET_DIR/.cursor/rules/legacy-rules.md"
    echo "  MIGRATE: .cursor/rules (file -> .cursor/rules/legacy-rules.md)"
  fi
fi

copy_if_missing "$TEMPLATE_DIR/AGENTS.md" "$TARGET_DIR/AGENTS.md"
copy_dir_if_missing "$TEMPLATE_DIR/.cursor" "$TARGET_DIR/.cursor"
copy_dir_if_missing "$TEMPLATE_DIR/docs" "$TARGET_DIR/docs"
copy_dir_if_missing "$TEMPLATE_DIR/scripts" "$TARGET_DIR/scripts"

# Copy infrastructure files
for f in .gitignore; do
  if [ -f "$TEMPLATE_DIR/$f" ]; then
    copy_if_missing "$TEMPLATE_DIR/$f" "$TARGET_DIR/$f"
  fi
done

# Copy docs templates (remaining-issues.md, self-learning.md, skill-inventory.md)
if [ -d "$TEMPLATE_DIR/docs-templates" ]; then
  for doc_tmpl in "$TEMPLATE_DIR/docs-templates"/*.md; do
    [ -f "$doc_tmpl" ] || continue
    copy_if_missing "$doc_tmpl" "$TARGET_DIR/docs/$(basename "$doc_tmpl")"
  done
fi

# ---------------------------------------------------------------------------
# Category-specific skill/agent templates
# ---------------------------------------------------------------------------
if [ -n "$CATEGORY" ]; then
  CAT_DIR="$TEMPLATE_DIR/category-templates/$CATEGORY"
  if [ -d "$CAT_DIR" ]; then
    echo ""
    echo "--- Copying category templates: $CATEGORY ---"

    if [ -d "$CAT_DIR/skills" ]; then
      for skill_dir in "$CAT_DIR/skills"/*/; do
        [ -d "$skill_dir" ] || continue
        skill_name=$(basename "$skill_dir")
        while read -r sfile; do
          srel="${sfile#$skill_dir}"
          copy_if_missing "$sfile" "$TARGET_DIR/.cursor/skills/$skill_name/$srel"
        done < <(find "$skill_dir" -type f)
      done
    fi

    if [ -d "$CAT_DIR/agents" ]; then
      for agent_file in "$CAT_DIR/agents"/*.md; do
        [ -f "$agent_file" ] || continue
        copy_if_missing "$agent_file" "$TARGET_DIR/.cursor/agents/$(basename "$agent_file")"
      done
    fi

    # Append category routing entries to subagent-router if they exist
    if [ -f "$CAT_DIR/routing-entries.txt" ] && [ -f "$TARGET_DIR/.cursor/rules/subagent-router.mdc" ]; then
      if ! grep -q "# Category: $CATEGORY" "$TARGET_DIR/.cursor/rules/subagent-router.mdc" 2>/dev/null; then
        if $DRY_RUN; then
          echo "  WOULD APPEND routing entries for $CATEGORY"
        else
          router_file="$TARGET_DIR/.cursor/rules/subagent-router.mdc"
          tmp_file="${router_file}.tmp"
          awk -v cat="$CATEGORY" -v entries_file="$CAT_DIR/routing-entries.txt" '
            /<!-- ADD_ROUTES_HERE -->/ {
              print "# Category: " cat
              while ((getline line < entries_file) > 0) print line
              close(entries_file)
            }
            { print }
          ' "$router_file" > "$tmp_file" && mv "$tmp_file" "$router_file"
          echo "  APPEND routing entries for $CATEGORY"
        fi
      fi
    fi
  else
    echo "  WARNING: No category template found for '$CATEGORY' at $CAT_DIR"
  fi
fi

echo ""
echo "--- Replacing placeholders ---"

replace_placeholder() {
  local file="$1"
  local placeholder="$2"
  local value="$3"

  if [ -f "$file" ] && grep -q "$placeholder" "$file" 2>/dev/null; then
    if $DRY_RUN; then
      echo "  WOULD REPLACE in $(basename "$file"): $placeholder -> $value"
    else
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|$placeholder|$value|g" "$file"
      else
        sed -i "s|$placeholder|$value|g" "$file"
      fi
      echo "  REPLACE in $(basename "$file"): $placeholder -> $value"
    fi
  fi
}

replace_placeholder "$TARGET_DIR/AGENTS.md" "{{PROJECT_NAME}}" "$PROJECT_NAME"
replace_placeholder "$TARGET_DIR/docs/agent.md" "{{PROJECT_NAME}}" "$PROJECT_NAME"

while read -r file; do
  replace_placeholder "$file" "{{YYYY-MM-DD}}" "$TODAY"
done < <(find "$TARGET_DIR" -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null)

# ---------------------------------------------------------------------------
# Interactive placeholder prompting
# ---------------------------------------------------------------------------
if $INTERACTIVE && ! $DRY_RUN; then
  echo ""
  echo "--- Interactive Placeholder Fill ---"
  echo "(Press Enter to skip any placeholder)"
  echo ""

  prompt_and_replace() {
    local placeholder="$1"
    local description="$2"
    local files="$3"

    printf "  %s\n  [%s]: " "$description" "$placeholder"
    read -r value
    if [ -n "$value" ]; then
      for file in $files; do
        if [ -f "$file" ]; then
          replace_placeholder "$file" "$placeholder" "$value"
        fi
      done
    else
      echo "  (skipped)"
    fi
  }

  prompt_and_replace "{{DESCRIBE_YOUR_ARCH_BOUNDARIES}}" \
    "Architecture boundary rules (e.g., 'Microservice boundaries: each service owns its own DB')" \
    "$TARGET_DIR/AGENTS.md"

  prompt_and_replace "{{DESCRIBE_TOOL_SAFETY_RULES}}" \
    "Tool safety rules (e.g., 'read-only external tools, no mutations to production')" \
    "$TARGET_DIR/AGENTS.md"

  prompt_and_replace "{{LIST_REQUIRED_ENV_VARS}}" \
    "Required environment variables (e.g., 'DATABASE_URL, API_KEY, NODE_ENV')" \
    "$TARGET_DIR/AGENTS.md"

  prompt_and_replace "{{DESCRIBE_DATA_BOUNDARIES}}" \
    "Data handling policies (e.g., 'no data exfiltration, LLM API boundaries')" \
    "$TARGET_DIR/AGENTS.md"

  echo ""
  echo "--- docs/agent.md Placeholders ---"
  echo ""

  agent_md="$TARGET_DIR/docs/agent.md"

  prompt_and_replace "{{library | service | monorepo | UI app | CLI | automation framework | agent}}" \
    "Project type (e.g., 'service', 'monorepo', 'UI app', 'CLI', 'library')" \
    "$agent_md"

  prompt_and_replace "{{primary, secondary}}" \
    "Programming language(s) (e.g., 'TypeScript, Python')" \
    "$agent_md"

  prompt_and_replace "{{list}}" \
    "Framework(s) used (e.g., 'Express, React, Jest')" \
    "$agent_md"

  prompt_and_replace "{{1-2 sentence description of what this project does}}" \
    "Project purpose — what does this project do? (1-2 sentences)" \
    "$agent_md"
fi

# ---------------------------------------------------------------------------
# Post-bootstrap summary
# ---------------------------------------------------------------------------
echo ""

remaining=$(find "$TARGET_DIR" -type f \( -name "*.md" -o -name "*.mdc" \) ! -path "*/node_modules/*" ! -path "*/.git/*" -exec grep -c '{{[^}]*}}' {} \; 2>/dev/null | awk '{s+=$1} END {print s+0}')

if $DRY_RUN; then
  echo "=== Dry Run Complete ==="
  echo "  Would copy: $copy_count file(s)"
  echo "  Would skip: $skip_count file(s)"
else
  echo "=== Bootstrap Complete ==="
fi

echo ""
echo "Remaining placeholders: $remaining"
if [ "$remaining" -gt 0 ]; then
  echo "  Run: $0 --list-placeholders $TARGET_DIR"
  echo "  Or:  $0 --interactive $TARGET_DIR"
fi
echo ""
echo "Next steps:"
echo "  1. Open the project in Cursor"
if [ "$remaining" -gt 0 ]; then
  echo "  2. Fill in remaining {{placeholder}} fields (run --list-placeholders to see them)"
else
  echo "  2. Review AGENTS.md and docs/agent.md for accuracy"
fi
echo "  3. Ask Cursor: 'Scan this project and set up specialist agents'"
echo "  4. Review the scan report and approve/modify the proposed specialists"
echo "  5. The skill-factory will create each specialist automatically"
echo ""
echo "Validate anytime:  $0 --validate $TARGET_DIR"
echo ""
echo "The agent system will start learning from the first interaction onward."
