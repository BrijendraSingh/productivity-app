#!/usr/bin/env bash
# Batch-bootstrap all repos in the workspace with cursor-agent-bootstrap.
#
# Usage:
#   ./scripts/batch-bootstrap.sh [--dry-run] [--category-map /path/to/map.tsv]
#
# Reads .gh_repo_list.tsv from the workspace root, maps each repo to a category
# template, and runs bootstrap.sh with the appropriate --category flag.
#
# Non-git directories are skipped automatically. Repos that already have full
# agent infrastructure (AGENTS.md + .cursor/skills/) are flagged for holistic
# augmentation only.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$TEMPLATE_DIR/../.." && pwd)"
DRY_RUN=false
LOG_FILE="$TEMPLATE_DIR/batch-results.log"

while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    *) shift ;;
  esac
done

TSV_FILE="${1:-$WORKSPACE_ROOT/.gh_repo_list.tsv}"

if [ ! -f "$TSV_FILE" ]; then
  echo "Error: TSV file not found at $TSV_FILE"
  exit 1
fi

map_subcategory_to_template() {
  local subcat="$1"
  case "$subcat" in
    integrator.io-workspace/core-microservices)     echo "core-microservice" ;;
    integrator.io-workspace/adaptors)               echo "adaptor" ;;
    integrator.io-workspace/connectors)             echo "connector" ;;
    integrator.io-workspace/libraries-shared-utils)  echo "library" ;;
    integrator.io-workspace/ui)                     echo "ui" ;;
    integrator.io-workspace/cicd-infrastructure)    echo "cicd" ;;
    integrator.io-workspace/monitoring)             echo "monitoring" ;;
    integrator.io-workspace/ai-services)            echo "core-microservice" ;;
    test-automation/*)                              echo "test-automation" ;;
    playground/*)                                   echo "playground" ;;
    utills/*)                                       echo "core-microservice" ;;
    *)                                              echo "playground" ;;
  esac
}

echo "=== Batch Bootstrap ===" | tee "$LOG_FILE"
echo "Workspace: $WORKSPACE_ROOT" | tee -a "$LOG_FILE"
echo "Template:  $TEMPLATE_DIR" | tee -a "$LOG_FILE"
echo "TSV:       $TSV_FILE" | tee -a "$LOG_FILE"
echo "Dry Run:   $DRY_RUN" | tee -a "$LOG_FILE"
echo "Started:   $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

total=0
bootstrapped=0
skipped_nongit=0
skipped_full=0
augmented=0
failed=0

while IFS=$'\t' read -r repo_name category local_path origin_url upstream_url other_remotes; do
  # Skip header
  [[ "$repo_name" == "repo_name" ]] && continue

  total=$((total + 1))
  repo_dir="$WORKSPACE_ROOT/$local_path"

  # Skip non-git directories
  if [[ "$origin_url" == *"non-git"* ]] || [[ "$other_remotes" == *"non-git"* ]] || [ -z "$origin_url" ]; then
    if [ ! -d "$repo_dir/.git" ]; then
      echo "  SKIP (non-git): $repo_name" | tee -a "$LOG_FILE"
      skipped_nongit=$((skipped_nongit + 1))
      continue
    fi
  fi

  if [ ! -d "$repo_dir" ]; then
    echo "  SKIP (not found): $repo_name at $repo_dir" | tee -a "$LOG_FILE"
    skipped_nongit=$((skipped_nongit + 1))
    continue
  fi

  template_cat=$(map_subcategory_to_template "$category")

  # Check if repo already has full agent infrastructure
  if [ -f "$repo_dir/AGENTS.md" ] && [ -d "$repo_dir/.cursor/skills" ]; then
    echo "  AUGMENT (has agents): $repo_name [category=$template_cat]" | tee -a "$LOG_FILE"
    augmented=$((augmented + 1))

    # For fully instrumented repos, only add docs templates if missing
    if $DRY_RUN; then
      echo "    WOULD ADD: docs/remaining-issues.md, docs/skill-inventory.md (if missing)" | tee -a "$LOG_FILE"
    else
      for doc_file in remaining-issues.md self-learning.md skill-inventory.md; do
        if [ ! -f "$repo_dir/docs/$doc_file" ] && [ -f "$TEMPLATE_DIR/docs-templates/$doc_file" ]; then
          mkdir -p "$repo_dir/docs"
          cp "$TEMPLATE_DIR/docs-templates/$doc_file" "$repo_dir/docs/$doc_file"
          echo "    ADD: docs/$doc_file" | tee -a "$LOG_FILE"
        fi
      done
    fi
    continue
  fi

  # Run bootstrap with category
  echo "  BOOTSTRAP: $repo_name [category=$template_cat]" | tee -a "$LOG_FILE"

  bootstrap_flags=""
  if $DRY_RUN; then
    bootstrap_flags="--dry-run"
  fi

  if bash "$SCRIPT_DIR/bootstrap.sh" $bootstrap_flags --category "$template_cat" "$repo_dir" "$repo_name" >> "$LOG_FILE" 2>&1; then
    bootstrapped=$((bootstrapped + 1))
  else
    echo "    FAILED: $repo_name (see log)" | tee -a "$LOG_FILE"
    failed=$((failed + 1))
  fi

done < "$TSV_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== Batch Bootstrap Summary ===" | tee -a "$LOG_FILE"
echo "  Total repos:     $total" | tee -a "$LOG_FILE"
echo "  Bootstrapped:    $bootstrapped" | tee -a "$LOG_FILE"
echo "  Augmented:       $augmented" | tee -a "$LOG_FILE"
echo "  Skipped (non-git): $skipped_nongit" | tee -a "$LOG_FILE"
echo "  Skipped (full):  $skipped_full" | tee -a "$LOG_FILE"
echo "  Failed:          $failed" | tee -a "$LOG_FILE"
echo "  Completed:       $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Full log: $LOG_FILE"
