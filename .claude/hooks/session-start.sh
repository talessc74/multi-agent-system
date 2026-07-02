#!/bin/bash
# Installs and registers the Graphify skill (https://github.com/safishamsi/graphify)
# so /graphify is available in every session, even after this ephemeral
# container gets recycled. Only runs in Claude Code on the web; degrades
# gracefully (warns, never blocks session startup) if install fails.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

export PATH="$HOME/.local/bin:$PATH"

if command -v graphify >/dev/null 2>&1; then
  echo "[session-start] graphify already installed — skipping."
  exit 0
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "[session-start] WARNING: uv not found — skipping graphify install." >&2
  exit 0
fi

if ! uv tool install graphifyy >/tmp/graphify-install.log 2>&1; then
  echo "[session-start] WARNING: 'uv tool install graphifyy' failed — graphify will be unavailable this session. See /tmp/graphify-install.log" >&2
  exit 0
fi

if ! graphify install >/tmp/graphify-register.log 2>&1; then
  echo "[session-start] WARNING: 'graphify install' failed — /graphify may be unavailable this session. See /tmp/graphify-register.log" >&2
  exit 0
fi

echo "[session-start] graphify installed and registered."
