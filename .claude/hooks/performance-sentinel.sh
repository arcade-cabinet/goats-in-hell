#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): detect per-frame allocations inside useFrame() callbacks
# Non-blocking — outputs warnings only (always exits 0)
set -uo pipefail

# Read event JSON from stdin, extract file path
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# Only check .tsx files (R3F components)
case "$FILE" in
  *.tsx) ;;
  *) exit 0 ;;
esac

WARNINGS=0

# Use awk to detect `new Vector3()` (and similar) inside useFrame() blocks
# Track brace depth after seeing useFrame( to identify the callback body
ALLOC_TYPES="Vector3|Quaternion|Matrix4|Euler|Color|Box3"

FOUND=$(awk -v types="$ALLOC_TYPES" '
BEGIN { in_useframe = 0; depth = 0 }
/useFrame\s*\(/ {
  in_useframe = 1
  depth = 0
  # Count opening braces on same line
  n = gsub(/{/, "{")
  depth += n
  m = gsub(/}/, "}")
  depth -= m
}
in_useframe && !/useFrame/ {
  n = gsub(/{/, "{")
  depth += n
  m = gsub(/}/, "}")
  depth -= m
  if (depth <= 0) {
    in_useframe = 0
  }
}
in_useframe {
  regex = "new\\s+(" types ")\\s*\\("
  if (match($0, regex)) {
    print NR ": " $0
  }
}
' "$FILE" 2>/dev/null)

if [ -n "$FOUND" ]; then
  echo "[WARN] performance-sentinel: Per-frame allocation(s) detected in $FILE"
  echo "$FOUND"
  echo ""
  echo "Fix: Move allocation to module scope:"
  echo "  const _tmpVec = new Vector3()"
  echo "Then reuse inside useFrame: _tmpVec.set(x, y, z)"
  WARNINGS=$((WARNINGS + 1))
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo ""
  echo "performance-sentinel: $WARNINGS warning(s) found in $FILE"
  echo "These are warnings only — not blocking."
fi

# Always exit 0 — this hook is non-blocking
exit 0
