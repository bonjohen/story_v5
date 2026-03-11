#!/bin/bash
# Collect CLAUDE.md files from C:\Projects\*\ that were modified in the last 60 days.
# Copies them into ~/Documents/claude-md-collection/ renamed as {project_name}.CLAUDE.md

DEST="$HOME/Documents/claude-md-collection"
SRC="/c/Projects"
DAYS=60

mkdir -p "$DEST"

count=0
for f in "$SRC"/*/CLAUDE.md; do
  [ -f "$f" ] || continue

  # Check if modified within the last N days
  if [ "$(find "$f" -mtime -$DAYS -print 2>/dev/null)" ]; then
    project=$(basename "$(dirname "$f")")
    cp "$f" "$DEST/${project}.CLAUDE.md"
    echo "  Copied: $project"
    ((count++))
  fi
done

echo ""
echo "Done. $count file(s) copied to $DEST"
