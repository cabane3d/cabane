#!/usr/bin/env bash
# Posts a reviewer verdict on a factory pull request as a GitHub review (ADR-0012, ADR-0020).
#   - Findings anchored to lines of the PR diff become inline comments, with a one-click
#     suggestion when the reviewer gave replacement code; the others go to the review body.
#   - Reviewer threads whose finding id is listed in "resolved" are then marked resolved.
#     Maintainer threads are never resolved here.
# The review is always a COMMENT: GitHub refuses approvals and change requests on one's own pull
# request, so the verdict is stated in the body.
# Usage: scripts/factory/post-review.sh <pr-number> <review.json> [--dry-run]
#   --dry-run: print the review payload instead of posting it, and resolve nothing.
#   PR_DIFF_FILE=<file>: read the PR diff from a file instead of `gh pr diff` (for testing).
# review.json is the reviewer's answer, whose format is defined in .claude/agents/reviewer.md.
set -euo pipefail

[ "$#" -ge 2 ] || { echo "usage: $0 <pr-number> <review.json> [--dry-run]" >&2; exit 64; }
pr="$1"
review="$2"
dry_run=false
[ "${3:-}" = "--dry-run" ] && dry_run=true
here="$(cd "$(dirname "$0")" && pwd)"
command -v jq >/dev/null || { echo "$0 requires jq" >&2; exit 69; }
$dry_run && [ -n "${PR_DIFF_FILE:-}" ] || command -v gh >/dev/null || { echo "$0 requires gh" >&2; exit 69; }

jq -e '
  def text: type == "string" and length > 0;
  (.round | type == "number")
  and (.verdict | IN("APPROVED", "CHANGES_REQUESTED"))
  and (.summary | text)
  and ((.resolved // []) | type == "array" and all(.[]; text))
  and ((.replies // []) | type == "array" and all(.[]; (.id | text) and (.answer | text)))
  and ((.notes // []) | type == "array" and all(.[]; text))
  and (.findings | type == "array")
  and (.findings | map(.id) | length == (unique | length))
  and all(.findings[];
    (.id | text)
    and (.severity | IN("blocker", "major", "minor"))
    and (.title | text) and (.problem | text) and (.proposal | text)
    and (.path == null or (.path | text))
    and (.line == null or (.path != null and (.line | type == "number" and . >= 1)))
    and (.startLine == null or (.line != null and (.startLine | type == "number" and . >= 1)) and .startLine <= .line)
    and (.suggestion == null or (.line != null and (.suggestion | type == "string"))))
  and (.verdict == "CHANGES_REQUESTED" or all(.findings[]; .severity == "minor"))
' "$review" >/dev/null || {
  echo "$review is not a valid reviewer answer (see .claude/agents/reviewer.md)." >&2
  echo "Check the required fields, unique ids, and that APPROVED comes with minor findings only." >&2
  exit 65
}

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Lines a review comment can be attached to: one "path<TAB>line" per added or context line,
# numbered on the new side of the diff.
if [ -n "${PR_DIFF_FILE:-}" ]; then
  cp "$PR_DIFF_FILE" "$tmp/diff"
elif ! gh pr diff "$pr" >"$tmp/diff"; then
  echo "warning: could not read the PR diff, every finding goes to the review body" >&2
  : >"$tmp/diff"
fi
awk '
  /^diff --git / { header = 1; path = ""; next }
  header && /^\+\+\+ / { path = ($0 == "+++ /dev/null") ? "" : substr($0, 7); next }
  /^@@ / { header = 0; match($0, /\+[0-9]+/); line = substr($0, RSTART + 1, RLENGTH - 1) + 0; next }
  header || path == "" { next }
  /^[+ ]/ { print path "\t" line; line++ }
' "$tmp/diff" >"$tmp/lines"
: >"$tmp/no-lines"

# Builds the review payload. Argument: the file of commentable lines.
build() {
  jq --rawfile lines "$1" '
    def icon: . as $s | {blocker: "🛑", major: "⚠️", minor: "💡"} | .[$s];
    def heading: "\(.severity | icon) **\(.severity | ascii_upcase)** · \(.id) · \(.title)";
    def details: "**Problem:** \(.problem)\n\n**Proposed fix:** \(.proposal)";
    def marker: "<!-- cabane-finding id=\(.id) -->";
    def location:
      if .path == null then ""
      elif .line == null then "`\(.path)`"
      elif .startLine != null and .startLine != .line then "`\(.path):\(.startLine)-\(.line)`"
      else "`\(.path):\(.line)`" end;
    def bullets: map("- \(.)") | join("\n");

    ($lines | split("\n") | map(select(length > 0) | {key: ., value: true}) | from_entries) as $ok
    | . as $r
    | ($r.findings | sort_by({blocker: 0, major: 1, minor: 2}[.severity]) | map(. as $f | . + {inline: (
        if $f.line == null then false
        else [range($f.startLine // $f.line; $f.line + 1) | "\($f.path)\t\(.)"] | all(. as $k | $ok | has($k))
        end)})) as $findings
    | ($findings | map(select(.inline | not))) as $outside
    | {
        event: "COMMENT",
        body: ([
          "<!-- cabane-reviewer round=\($r.round) verdict=\($r.verdict) -->",
          "## Factory review, round \($r.round): \(if $r.verdict == "APPROVED" then "✅ approved" else "❌ changes requested" end)",
          $r.summary,
          (["blocker", "major", "minor"] | map(. as $s | "\($findings | map(select(.severity == $s)) | length) \($s)") | join(" · ")),
          (if any($findings[]; .inline) then "Findings on changed lines are posted inline, in the Files changed tab." else empty end),
          (if ($outside | length) > 0 then
            "### Findings outside the diff\n\n" + ($outside | map(
              heading
              + (location | if . == "" then "" else "\n\n" + . end)
              + "\n\n" + details
              + (if .suggestion != null then "\n\nSuggested code:\n\n```\n\(.suggestion)\n```" else "" end)
              + "\n\n" + marker
            ) | join("\n\n---\n\n"))
          else empty end),
          (if (($r.replies // []) | length) > 0 then
            "### Still open from earlier rounds\n\n" + ($r.replies | map("\(.id): \(.answer)") | bullets)
          else empty end),
          (if (($r.resolved // []) | length) > 0 then "### Resolved since the previous round\n\n" + ($r.resolved | bullets) else empty end),
          (if (($r.notes // []) | length) > 0 then "### Notes\n\n" + ($r.notes | bullets) else empty end)
        ] | join("\n\n")),
        comments: [
          $findings[]
          | select(.inline)
          | {
              path,
              line,
              side: "RIGHT",
              body: (heading + "\n\n" + details
                + (if .suggestion != null then "\n\n```suggestion\n\(.suggestion)\n```" else "" end)
                + "\n\n" + marker)
            }
            + (if .startLine != null and .startLine != .line then {start_line: .startLine, start_side: "RIGHT"} else {} end)
        ]
      }
  ' "$review"
}

build "$tmp/lines" >"$tmp/payload"
if $dry_run; then
  cat "$tmp/payload"
  exit 0
fi

post() {
  gh api --method POST "repos/{owner}/{repo}/pulls/$pr/reviews" --input "$1" --jq .html_url
}
if ! url="$(post "$tmp/payload")"; then
  # GitHub rejects the whole review when one inline comment does not fit the diff.
  echo "warning: GitHub refused the inline comments, posting every finding in the review body" >&2
  build "$tmp/no-lines" >"$tmp/payload"
  url="$(post "$tmp/payload")"
fi
echo "$url"

# Follow-ups in earlier reviewer threads: one action per line, "resolve<TAB>thread" or
# "reply<TAB>thread<TAB>body as a JSON string".
jq -e '(.resolved // []) + (.replies // []) | length > 0' "$review" >/dev/null || exit 0
"$here/fetch-pr-feedback.sh" "$pr" >"$tmp/feedback"
jq -r --slurpfile r "$review" '
  [.threads[] | select(.from == "reviewer" and .findingId != null) | {key: .findingId, value: .threadId}] | from_entries as $thread
  | (($r[0].resolved // [])[] | select($thread[.] != null) | "resolve\t\($thread[.])"),
    (($r[0].replies // [])[] | select($thread[.id] != null)
      | "reply\t\($thread[.id])\t\("<!-- cabane-finding-reply id=\(.id) -->\n\(.answer)" | tojson)")
' "$tmp/feedback" | while IFS=$'\t' read -r action thread body; do
  if [ "$action" = resolve ]; then
    gh api graphql -f id="$thread" \
      -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { id } } }' >/dev/null
    echo "resolved thread $thread"
  else
    gh api graphql -f id="$thread" -f body="$(jq -r . <<<"$body")" -f query='mutation($id: ID!, $body: String!) {
      addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $id, body: $body}) { comment { id } }
    }' >/dev/null
    echo "replied in thread $thread"
  fi
done
