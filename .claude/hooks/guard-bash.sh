#!/usr/bin/env bash
# PreToolUse hook (Bash): restricts shell commands for factory agents.
# Usage: guard-bash.sh <coder|reviewer>
#   coder:    blocks commands that would write to frozen paths or update snapshots.
#   reviewer: allowlist of read-only commands.
# Exit 2 blocks the tool call; stderr is shown to the agent.
set -euo pipefail

role="${1:?usage: guard-bash.sh <role>}"
command -v jq >/dev/null || { echo "guard-bash.sh requires jq" >&2; exit 2; }

cmd="$(jq -r '.tool_input.command // empty' <<<"$(cat)")"
[ -z "$cmd" ] && exit 0

deny() {
  echo "Blocked for $role: $1" >&2
  echo "Command: $cmd" >&2
  exit 2
}

case "$role" in
  coder)
    # Snapshot updates would let the implementation rewrite its own expectations.
    if grep -Eq '(^|[[:space:]])(-u|--update|--update-snapshots)([[:space:]]|$)' <<<"$cmd"; then
      deny "updating snapshots is reserved to test-writer"
    fi
    # Shell writes to frozen paths (the Edit/Write guard does not see these).
    if grep -Eq '(^|[[:space:]"'"'"'/])(tests|specs|docs/adr|\.claude|\.github|scripts/factory)/' <<<"$cmd" &&
       grep -Eq '(>|\btee\b|\bsed[[:space:]]+-i|\bmv\b|\bcp\b|\brm\b|\btouch\b|\bgit[[:space:]]+(checkout|restore|rm|mv)\b)' <<<"$cmd"; then
      deny "shell writes to frozen paths are not allowed"
    fi
    exit 0
    ;;
  reviewer)
    if grep -Eq '(>|;|&|`|\$\()' <<<"$cmd"; then
      deny "redirections, command chaining and substitutions are not allowed for the reviewer"
    fi
    IFS='|' read -ra segments <<<"$cmd"
    for segment in "${segments[@]}"; do
      read -ra words <<<"$segment"
      [ "${#words[@]}" -eq 0 ] && deny "empty pipeline segment"
      case "${words[0]}" in
        git)
          case "${words[1]:-}" in
            diff | log | show | status | rev-parse | merge-base | ls-files | blame | branch) ;;
            *) deny "only read-only git subcommands are allowed" ;;
          esac
          [[ "${words[1]}" == branch && "${#words[@]}" -gt 2 && "${words[2]}" != "--show-current" && "${words[2]}" != "-a" && "${words[2]}" != "--list" ]] &&
            deny "only listing branches is allowed"
          ;;
        pnpm)
          script="${words[1]:-}"
          [ "$script" = "--filter" ] && script="${words[3]:-}"
          case "$script" in
            lint | typecheck | test | test:e2e | test:electron | test:visual | check) ;;
            *) deny "only pnpm check scripts are allowed" ;;
          esac
          grep -Eq '(--write|--fix|(^|[[:space:]])-u([[:space:]]|$)|--update)' <<<"$segment" && deny "write flags are not allowed"
          ;;
        ls | cat | head | tail | wc | grep | rg | sort | uniq | jq | diff) ;;
        find)
          grep -Eq -- '-(delete|exec|execdir|ok|fprint)' <<<"$segment" && deny "find actions are not allowed"
          ;;
        scripts/factory/*.sh | ./scripts/factory/*.sh) ;;
        *) deny "'${words[0]}' is not in the reviewer allowlist" ;;
      esac
    done
    exit 0
    ;;
  *)
    deny "unknown role"
    ;;
esac
