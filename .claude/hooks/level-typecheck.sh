#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): typecheck after editing level DB or build script files
# Scoped to: src/db/*.ts, scripts/build-circle-*.ts
set -euo pipefail

# Read event JSON from stdin, extract file path
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
if [ -z "$FILE" ]; then
  exit 0
fi

# Only run for level DB and build script files
case "$FILE" in
  */src/db/*.ts|*/scripts/build-circle-*.ts)
    echo "Running TypeScript check for level files..."
    npx tsc --noEmit || { echo "TypeScript check failed for level files"; exit 1; }
    echo "Level typecheck passed"
    ;;
esac

exit 0
