#!/usr/bin/env bash
# Posts the factory's answers to the feedback on a pull request (ADR-0012, ADR-0020):
# one reply in each answered review thread, then one summary comment that closes the round.
# The summary comment carries the <!-- cabane-factory answers --> marker that
# fetch-pr-feedback.sh uses to tell new general feedback from feedback already answered.
# Usage: scripts/factory/reply-pr-feedback.sh <pr-number> <answers.json> [--dry-run]
#   --dry-run: print what would be posted instead of posting it.
# answers.json:
#   {"round": 1, "commit": "<sha>",
#    "threads": [{"threadId": "PRRT_...", "status": "fixed|disputed|question", "answer": "..."}],
#    "general": [{"ref": "<finding id or comment URL>", "status": "fixed|disputed|question", "answer": "..."}]}
set -euo pipefail

[ "$#" -ge 2 ] || { echo "usage: $0 <pr-number> <answers.json> [--dry-run]" >&2; exit 64; }
pr="$1"
answers="$2"
dry_run=false
[ "${3:-}" = "--dry-run" ] && dry_run=true
command -v jq >/dev/null || { echo "$0 requires jq" >&2; exit 69; }
$dry_run || command -v gh >/dev/null || { echo "$0 requires gh" >&2; exit 69; }

jq -e '
  def text: type == "string" and length > 0;
  def answer: (.status | IN("fixed", "disputed", "question")) and (.answer | text);
  (.round | type == "number")
  and (.commit | text)
  and ((.threads // []) | type == "array" and all(.[]; (.threadId | text) and answer))
  and ((.general // []) | type == "array" and all(.[]; (.ref | text) and answer))
' "$answers" >/dev/null || { echo "$answers is not a valid answers file (see the header of $0)." >&2; exit 65; }

labels='{"fixed": "✅ Fixed", "disputed": "↩️ Not changed", "question": "❓ Question for the maintainer"}'

jq -c --argjson labels "$labels" '
  .commit as $c
  | (.threads // [])[]
  | {threadId, body: "<!-- cabane-factory -->\n**\($labels[.status])** in `\($c[0:10])`: \(.answer)"}
' "$answers" | while read -r reply; do
  thread="$(jq -r .threadId <<<"$reply")"
  body="$(jq -r .body <<<"$reply")"
  if $dry_run; then
    printf 'reply to %s:\n%s\n\n' "$thread" "$body"
  else
    gh api graphql -f id="$thread" -f body="$body" -f query='mutation($id: ID!, $body: String!) {
      addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $id, body: $body}) { comment { id } }
    }' >/dev/null
  fi
done

summary="$(jq --argjson labels "$labels" '
  {body: ([
    "<!-- cabane-factory answers round=\(.round) commit=\(.commit) -->",
    "## Factory answers, round \(.round)",
    "Pushed `\(.commit[0:10])`. \((.threads // []) | length) review thread(s) answered in place.",
    (if ((.general // []) | length) > 0 then
      "### General feedback\n\n" + (.general | map("- **\(.ref)** · \($labels[.status]): \(.answer)") | join("\n"))
    else empty end)
  ] | join("\n\n"))}
' "$answers")"

if $dry_run; then
  jq -r .body <<<"$summary"
else
  gh api --method POST "repos/{owner}/{repo}/issues/$pr/comments" --input - --jq .html_url <<<"$summary"
fi
