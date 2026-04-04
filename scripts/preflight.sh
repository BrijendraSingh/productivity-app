#!/usr/bin/env bash
# Developer pre-flight check for the cursor-agent-bootstrap.
#
# Run this before committing template changes to catch common issues:
#   1. shellcheck on all .sh scripts (if shellcheck is installed)
#   2. validate.sh structure/JSON/routing checks
#   3. bootstrap.sh --dry-run smoke test against a temp directory
#
# Usage:
#   ./scripts/preflight.sh
#
# Exit codes:
#   0 — all checks passed
#   1 — one or more checks failed

set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$TEMPLATE_DIR/scripts"

passed=0
failed=0
skipped=0

section() { echo ""; echo "=== $1 ==="; }
pass()    { echo "  PASS: $1"; passed=$((passed + 1)); }
fail()    { echo "  FAIL: $1"; failed=$((failed + 1)); }
skip()    { echo "  SKIP: $1"; skipped=$((skipped + 1)); }

echo "Agent Template Pre-Flight Check"
echo "Template: $TEMPLATE_DIR"

# ---------------------------------------------------------------------------
# 1. shellcheck
# ---------------------------------------------------------------------------
section "Shell Script Lint (shellcheck)"

if command -v shellcheck &>/dev/null; then
  sc_errors=0
  while read -r script; do
    rel="${script#$TEMPLATE_DIR/}"
    if shellcheck -S warning "$script" 2>/dev/null; then
      pass "$rel"
    else
      fail "$rel"
      sc_errors=$((sc_errors + 1))
    fi
  done < <(find "$SCRIPTS_DIR" -name "*.sh" -type f)

  if [ "$sc_errors" -eq 0 ]; then
    echo "  All scripts pass shellcheck."
  fi
else
  skip "shellcheck not installed (brew install shellcheck / apt install shellcheck)"
fi

# ---------------------------------------------------------------------------
# 2. validate.sh
# ---------------------------------------------------------------------------
section "Template Validation (validate.sh)"

if [ -x "$SCRIPTS_DIR/validate.sh" ] || [ -f "$SCRIPTS_DIR/validate.sh" ]; then
  if bash "$SCRIPTS_DIR/validate.sh" "$TEMPLATE_DIR" 2>&1; then
    pass "validate.sh"
  else
    fail "validate.sh (exit code $?)"
  fi
else
  fail "validate.sh not found at $SCRIPTS_DIR/validate.sh"
fi

# ---------------------------------------------------------------------------
# 3. bootstrap.sh --dry-run smoke test
# ---------------------------------------------------------------------------
section "Bootstrap Dry-Run Smoke Test"

if [ -f "$SCRIPTS_DIR/bootstrap.sh" ]; then
  SMOKE_DIR=$(mktemp -d)
  trap 'rm -rf "$SMOKE_DIR"' EXIT

  if bash "$SCRIPTS_DIR/bootstrap.sh" --dry-run "$SMOKE_DIR" "smoke-test-project" 2>&1; then
    pass "bootstrap.sh --dry-run"
  else
    fail "bootstrap.sh --dry-run (exit code $?)"
  fi
else
  fail "bootstrap.sh not found at $SCRIPTS_DIR/bootstrap.sh"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Pre-Flight Summary ==="
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$failed" -gt 0 ]; then
  echo "Pre-flight checks FAILED. Fix the issues above before committing."
  exit 1
else
  if [ "$skipped" -gt 0 ]; then
    echo "Pre-flight checks PASSED (with skipped optional checks)."
  else
    echo "Pre-flight checks PASSED."
  fi
  exit 0
fi
