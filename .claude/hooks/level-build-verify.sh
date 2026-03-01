#!/usr/bin/env bash
# Post-edit hook: verify build scripts compile and validate against a temp DB
# Scoped to: scripts/build-circle-*.ts
# BLOCKING — exits non-zero if build fails
set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ]; then
  echo "No file specified"
  exit 0
fi

if [ ! -f "$FILE" ]; then
  exit 0
fi

# Only run for build-circle scripts
case "$(basename "$FILE")" in
  build-circle-*.ts) ;;
  *) exit 0 ;;
esac

# Create temp DB and ensure cleanup
TEMP_DB=$(mktemp /tmp/level-verify-XXXXXX.db)
trap 'rm -f "$TEMP_DB"' EXIT

echo "Verifying build script: $FILE"

# Step 1: TypeScript compile check
echo "  Checking TypeScript compilation..."
npx tsc --noEmit || { echo "Build script failed TypeScript compilation"; exit 1; }

# Step 2: Run the build script against the temp DB
echo "  Running build script against temp DB..."
npx tsx "$FILE" "$TEMP_DB" || { echo "Build script execution failed"; exit 1; }

echo "Build script verified successfully: $FILE"
