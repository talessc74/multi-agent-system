#!/bin/bash
# Installs a curated subset of the ux-ui-agent-skills kit
# (https://github.com/plugin87/ux-ui-agent-skills) so /redesign,
# /design-tokens, /a11y-audit, /design-review and /apply-aesthetic are
# available in every session, even after this ephemeral container gets
# recycled. Only runs in Claude Code on the web; degrades gracefully
# (warns, never blocks session startup) if install fails.
#
# Deliberately curated, not the full kit: skips the 138-entry named
# design-system library, non-React framework adapters, and any skill
# (e.g. "governance") that writes into a project's own CLAUDE.md — this
# project's CLAUDE.md is the ARGUS/XDRS governance file and is never
# touched by this install. The kit's own CLAUDE.md is kept as read-only
# reference material inside the support directory, never merged with
# ours.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SUPPORT_DIR="$HOME/.ux-ui-kit"
SKILLS_DIR="$HOME/.claude/skills"
MARKER="$SUPPORT_DIR/.installed"
SKILL_NAMES="redesign design-tokens a11y-audit design-review apply-aesthetic"

if [ -f "$MARKER" ]; then
  echo "[session-start] ux-ui-agent-skills already installed — skipping."
  exit 0
fi

TMP_CLONE="$(mktemp -d)"
if ! git clone --depth 1 https://github.com/plugin87/ux-ui-agent-skills.git "$TMP_CLONE" >/tmp/ux-ui-skills-clone.log 2>&1; then
  echo "[session-start] WARNING: clone of ux-ui-agent-skills failed — skill will be unavailable this session. See /tmp/ux-ui-skills-clone.log" >&2
  rm -rf "$TMP_CLONE"
  exit 0
fi

rm -rf "$SUPPORT_DIR"
mkdir -p "$SUPPORT_DIR"

# Shared reference material — kept in full, all small (tens of KB each).
for d in taste tokens workflows accessibility components reference scripts; do
  cp -r "$TMP_CLONE/$d" "$SUPPORT_DIR/$d" 2>/dev/null
done

# Only the React + Tailwind adapter — this project's stack. Skips
# Next.js/SwiftUI/Vue/Svelte/Angular/etc adapters, not relevant here.
mkdir -p "$SUPPORT_DIR/frameworks"
cp "$TMP_CLONE/frameworks/adapter-protocol.md" "$SUPPORT_DIR/frameworks/" 2>/dev/null
cp "$TMP_CLONE/frameworks/react-tailwind.md" "$SUPPORT_DIR/frameworks/" 2>/dev/null

# The kit's own CLAUDE.md, kept as isolated reference material — this is
# NOT this project's CLAUDE.md and must never be merged with it.
cp "$TMP_CLONE/CLAUDE.md" "$SUPPORT_DIR/CLAUDE.md" 2>/dev/null

mkdir -p "$SKILLS_DIR"
for name in $SKILL_NAMES; do
  mkdir -p "$SKILLS_DIR/$name"
  cp "$TMP_CLONE/.claude/skills/$name/SKILL.md" "$SKILLS_DIR/$name/SKILL.md" 2>/dev/null
done

rm -rf "$TMP_CLONE"

# The installed SKILL.md files reference shared assets with bare
# repo-relative paths (e.g. `taste/design-taste.md`) because the kit's
# intended install is "copy into project root". We instead keep shared
# assets in $SUPPORT_DIR, so rewrite those references to absolute paths.
for name in $SKILL_NAMES; do
  f="$SKILLS_DIR/$name/SKILL.md"
  [ -f "$f" ] || continue
  # Word-boundary based (not just after a backtick) so refs like
  # "node scripts/x.mjs" or "(CLAUDE.md -> ...)" get rewritten too, not
  # just the `scripts/x.py`-style ones.
  sed -i \
    -e "s#\btaste/#$SUPPORT_DIR/taste/#g" \
    -e "s#\btokens/#$SUPPORT_DIR/tokens/#g" \
    -e "s#\bworkflows/#$SUPPORT_DIR/workflows/#g" \
    -e "s#\baccessibility/#$SUPPORT_DIR/accessibility/#g" \
    -e "s#\bscripts/#$SUPPORT_DIR/scripts/#g" \
    -e "s#\bcomponents/#$SUPPORT_DIR/components/#g" \
    -e "s#\bCLAUDE\.md#$SUPPORT_DIR/CLAUDE.md#g" \
    "$f"
  # Fix any accidental double-prefixing (e.g. if a path was already absolute).
  sed -i "s#$SUPPORT_DIR/$SUPPORT_DIR/#$SUPPORT_DIR/#g" "$f"
done

touch "$MARKER"
echo "[session-start] ux-ui-agent-skills installed (redesign, design-tokens, a11y-audit, design-review, apply-aesthetic)."
