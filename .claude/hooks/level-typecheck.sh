#!/usr/bin/env bash
# Post-edit hook: typecheck level DB and build script files
# Scoped to: src/db/*.ts, scripts/build-circle-*.ts
set -euo pipefail

echo "Running TypeScript check for level files..."
npx tsc --noEmit || { echo "TypeScript check failed for level files"; exit 1; }
echo "Level typecheck passed"
