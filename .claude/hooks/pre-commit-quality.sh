#!/usr/bin/env bash
# Pre-commit quality gate: lint + typecheck
set -euo pipefail
echo "Running pre-commit quality checks..."
pnpm lint || { echo "Lint failed"; exit 1; }
npx tsc --noEmit || { echo "TypeScript check failed"; exit 1; }
echo "Pre-commit checks passed"
