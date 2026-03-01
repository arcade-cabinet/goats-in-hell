#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): detect potential grid/world coordinate mismatches
# Non-blocking — outputs warnings only (always exits 0)
set -uo pipefail

# Read event JSON from stdin, extract file path
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# Only check TypeScript files in level-related directories
case "$FILE" in
  */src/db/*.ts|*/scripts/build-circle-*.ts) ;;
  *) exit 0 ;;
esac

WARNINGS=0

# Flag CELL_SIZE multiplication in LevelEditor calls
# Grid coordinates should NOT be multiplied by CELL_SIZE
if grep -n 'CELL_SIZE\s*\*\|*\s*CELL_SIZE' "$FILE" 2>/dev/null; then
  echo "[WARN] coordinate-validator: Found CELL_SIZE multiplication in $FILE"
  echo "       LevelEditor API uses grid coordinates, not world coordinates."
  echo "       Remove CELL_SIZE multiplication — the engine handles conversion."
  WARNINGS=$((WARNINGS + 1))
fi

# Flag coordinates >99 in editor method calls
# Grid coordinates are typically 0-99 for a 100x100 grid
if grep -nE '\.(room|spawnEnemy|spawnPickup|spawnProp|spawnBoss|setPlayerSpawn|addTrigger|addEnvironmentZone|corridor)\(' "$FILE" 2>/dev/null | grep -E '[0-9]{3,}' 2>/dev/null; then
  echo "[WARN] coordinate-validator: Found coordinates >99 in $FILE"
  echo "       Grid coordinates should typically be <100."
  echo "       Did you accidentally use world coordinates instead of grid coordinates?"
  WARNINGS=$((WARNINGS + 1))
fi

# Flag * 2 patterns in coordinate arguments (common CELL_SIZE=2 mistake)
if grep -nE '\b[0-9]+\s*\*\s*2\b|\b2\s*\*\s*[0-9]+\b' "$FILE" 2>/dev/null | grep -vE '(boundsW|boundsH|width|height|\/\/)' 2>/dev/null; then
  echo "[WARN] coordinate-validator: Found '* 2' pattern in $FILE"
  echo "       This may be an accidental grid-to-world conversion."
  echo "       LevelEditor uses grid coordinates — no multiplication needed."
  WARNINGS=$((WARNINGS + 1))
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo ""
  echo "coordinate-validator: $WARNINGS warning(s) found in $FILE"
  echo "These are warnings only — not blocking."
fi

# Always exit 0 — this hook is non-blocking
exit 0
