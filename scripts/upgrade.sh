#!/usr/bin/env bash
# Upgrade an existing cursor-agent-bootstrap installation to a newer version.
#
# Usage:
#   ./scripts/upgrade.sh /path/to/target-repo
#   ./scripts/upgrade.sh --dry-run /path/to/target-repo
#
# This script:
#   1. Compares the installed template version with the source version
#   2. Shows a diff of structural changes
#   3. Copies new/updated template files WITHOUT overwriting:
#      - _learnings/*.json (accumulated knowledge)
#      - Custom specialists (.cursor/agents/*-specialist.md)
#      - User-filled placeholder values in AGENTS.md and docs/agent.md
#      - config/ directory contents
#   4. Updates the VERSION marker

set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

TARGET_DIR="${1:?Usage: $0 [--dry-run] /path/to/target-repo}"

if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Target directory '$TARGET_DIR' does not exist."
  exit 1
fi

TEMPLATE_VERSION="unknown"
TARGET_VERSION="unknown"

for vf in "$TEMPLATE_DIR/.cursor/template-version" "$TEMPLATE_DIR/VERSION"; do
  if [ -f "$vf" ]; then
    TEMPLATE_VERSION=$(cat "$vf" | tr -d '[:space:]')
    break
  fi
done

for vf in "$TARGET_DIR/.cursor/template-version" "$TARGET_DIR/VERSION"; do
  if [ -f "$vf" ]; then
    TARGET_VERSION=$(cat "$vf" | tr -d '[:space:]')
    break
  fi
done

echo "=== Agent Template Upgrade ==="
echo "Template version: $TEMPLATE_VERSION"
echo "Installed version: $TARGET_VERSION"
if $DRY_RUN; then echo "Mode: DRY RUN"; fi
echo ""

if [ "$TEMPLATE_VERSION" = "$TARGET_VERSION" ]; then
  echo "Already up to date (version $TARGET_VERSION). Nothing to do."
  exit 0
fi

PROTECTED_PATTERNS=(
  ".cursor/skills/_learnings/*.json"
  "config/*"
  "AGENTS.md"
  "docs/agent.md"
)

is_protected() {
  local rel="$1"
  for pattern in "${PROTECTED_PATTERNS[@]}"; do
    case "$rel" in
      $pattern) return 0 ;;
    esac
  done
  return 1
}

is_custom_specialist() {
  local rel="$1"
  case "$rel" in
    .cursor/agents/*-specialist.md) return 0 ;;
  esac
  return 1
}

updated=0
skipped=0
added=0

echo "--- Comparing files ---"

while read -r src_file; do
  rel="${src_file#$TEMPLATE_DIR/}"
  dest="$TARGET_DIR/$rel"

  case "$rel" in
    scripts/upgrade.sh) continue ;;
  esac

  if is_custom_specialist "$rel"; then
    echo "  PROTECT (custom specialist): $rel"
    skipped=$((skipped + 1))
    continue
  fi

  if [ ! -e "$dest" ]; then
    if $DRY_RUN; then
      echo "  WOULD ADD: $rel"
    else
      mkdir -p "$(dirname "$dest")"
      cp "$src_file" "$dest"
      echo "  ADD: $rel"
    fi
    added=$((added + 1))
    continue
  fi

  if is_protected "$rel"; then
    if ! diff -q "$src_file" "$dest" > /dev/null 2>&1; then
      echo "  PROTECT (user-modified): $rel"
      echo "    Template has changes. Review manually:"
      echo "    diff \"$src_file\" \"$dest\""
    else
      echo "  UNCHANGED: $rel"
    fi
    skipped=$((skipped + 1))
    continue
  fi

  if ! diff -q "$src_file" "$dest" > /dev/null 2>&1; then
    if $DRY_RUN; then
      echo "  WOULD UPDATE: $rel"
      diff --unified=3 "$dest" "$src_file" 2>/dev/null | head -20 || true
      echo ""
    else
      cp "$src_file" "$dest"
      echo "  UPDATE: $rel"
    fi
    updated=$((updated + 1))
  fi
done < <(find "$TEMPLATE_DIR" -type f \
  ! -path "*/.git/*" \
  ! -path "*/node_modules/*" \
  ! -name ".DS_Store")

if ! $DRY_RUN; then
  mkdir -p "$TARGET_DIR/.cursor"
  echo "$TEMPLATE_VERSION" > "$TARGET_DIR/.cursor/template-version"
  echo ""
  echo "  VERSION: $TARGET_VERSION -> $TEMPLATE_VERSION"
fi

echo ""
if $DRY_RUN; then
  echo "=== Dry Run Complete ==="
  echo "  Would add:    $added file(s)"
  echo "  Would update: $updated file(s)"
  echo "  Would skip:   $skipped file(s)"
else
  echo "=== Upgrade Complete: $TARGET_VERSION -> $TEMPLATE_VERSION ==="
  echo "  Added:   $added file(s)"
  echo "  Updated: $updated file(s)"
  echo "  Skipped: $skipped file(s)"
fi
echo ""
echo "After upgrading:"
echo "  1. Review any PROTECT messages above -- template changes to AGENTS.md"
echo "     and docs/agent.md are not auto-applied to preserve your customizations"
echo "  2. Run: ./scripts/validate.sh $TARGET_DIR"
echo "  3. Check the template's CHANGELOG.md for what changed in the new version"
