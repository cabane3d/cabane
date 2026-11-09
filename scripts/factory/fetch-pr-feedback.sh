#!/usr/bin/env bash
# Collects the open feedback on a factory pull request (ADR-0012, ADR-0020), as JSON on stdout:
#   - threads: unresolved review threads (reviewer findings and maintainer inline comments);
#     needsAction is true when the last comment of the thread is not a factory answer;
#   - general: review bodies and conversation comments posted since the last factory answers comment.
# Authors are told apart by hidden markers, since everything may be posted from the same GitHub account:
#   <!-- cabane-reviewer ... --> (review body), <!-- cabane-finding id=... --> (reviewer inline comment),
#   <!-- cabane-factory ... --> (factory answer). Anything without a marker comes from the maintainer.
# Usage: scripts/factory/fetch-pr-feedback.sh <pr-number> [--all]
#   --all: also include general items older than the last factory answers, and those answers themselves
#          (the reviewer uses it to check how previous findings were handled).
# Reads at most 100 threads, reviews and comments, and 100 comments per thread.
set -euo pipefail

[ "$#" -ge 1 ] || { echo "usage: $0 <pr-number> [--all]" >&2; exit 64; }
pr="$1"
all=false
[ "${2:-}" = "--all" ] && all=true
for tool in gh jq; do
  command -v "$tool" >/dev/null || { echo "$0 requires $tool" >&2; exit 69; }
done

query='query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      url
      headRefOid
      reviewThreads(first: 100) {
        nodes {
          id isResolved isOutdated path line startLine
          comments(first: 100) { nodes { databaseId author { login } body createdAt url } }
        }
      }
      reviews(first: 100) { nodes { databaseId author { login } body createdAt url } }
      comments(first: 100) { nodes { databaseId author { login } body createdAt url } }
    }
  }
}'

gh api graphql -F owner='{owner}' -F name='{repo}' -F pr="$pr" -f query="$query" | jq --argjson all "$all" '
  def origin:
    if test("<!-- cabane-factory") then "factory"
    elif test("<!-- cabane-(reviewer|finding)") then "reviewer"
    else "maintainer" end;
  def item: {id: .databaseId, author: .author.login, from: (.body | origin), body, createdAt, url};

  .data.repository.pullRequest as $p
  | ([$p.comments.nodes[] | select(.body | test("<!-- cabane-factory answers")) | .createdAt] | max) as $since
  | {
      url: $p.url,
      head: $p.headRefOid,
      since: $since,
      threads: [
        $p.reviewThreads.nodes[]
        | select(.isResolved | not)
        | (.comments.nodes | map(item)) as $c
        | {
            threadId: .id,
            path,
            line,
            startLine,
            outdated: .isOutdated,
            from: $c[0].from,
            findingId: (($c[0].body | capture("<!-- cabane-finding id=(?<id>[^ ]+) -->") | .id) // null),
            needsAction: ($c[-1].from != "factory"),
            comments: $c
          }
      ],
      general: [
        ($p.reviews.nodes[] | select(.body != "") | item + {kind: "review"}),
        ($p.comments.nodes[] | item + {kind: "comment"})
        | select($all or (.from != "factory" and ($since == null or .createdAt > $since)))
      ] | sort_by(.createdAt)
    }'
