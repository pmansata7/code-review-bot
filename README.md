# code-review-bot

BDK agent that scores PR risk (How I AI / Intercom-style rubric) and posts a structured GitHub review. Optional agentic test goals via skill `agentic-testing`.

## Quick start

1. Edit `bot/lib/repos.ts` with your `org/repo` list (one GitHub owner).
2. `npm install` && `npx @cursor/bdk validate --dir .`
3. Push this directory to GitHub.
4. Deploy with `CURSOR_SERVICE_ACCOUNT_KEY` and `--cursor-events-repo` per repo (see Project doc **getting-started**).

## How it runs (production)

| Trigger | Behavior |
|---------|----------|
| **Check suite success** on a PR | **Main path** — review latest head SHA once (deduped in KV). |
| PR **opened** / **reopened** / **ready_for_review** | Optional early review (may be noisy). |
| **Draft** PRs | Skipped. |

The model reads `pr/diff.patch` + `pr/meta.json`, applies skill `pr-review`, calls `post_review_decision` once.

**Low risk** (score &lt; 25, no blockers, `autoApproveRecommended`): bot may submit **APPROVE**. Medium/high: comment only (human required). Branch protection may still block merge.

## How to use manually

```bash
# Replay a real PR through the channel (needs Cursor GitHub auth)
npx @cursor/bdk github replay your-org/repo#42 --dir .

# One-shot chat turn
npx @cursor/bdk run --dir . --message "Review this PR for risk"

# Offline tool shape check (eval session — no GitHub)
npx @cursor/bdk eval --dir . --case review/smoke/docs-low-risk
```

Local fixture (no GitHub):

```bash
npx @cursor/bdk serve --dir . --mode single --dev
curl -s -X POST http://127.0.0.1:3000/code-review-bot/v1/channels/github \
  -H 'content-type: application/json' \
  -H 'x-github-event: pull_request' \
  -d @fixtures/github/pull_request.opened.json
```

## Tools

| Tool | Role |
|------|------|
| `fetch_pr` | Read workspace PR meta/diff |
| `run_review` | Output contract reminder |
| `post_review_decision` | GitHub review (Summary, Blockers, Suggestions, Test gaps, Agentic goals) |
| `run_test_goal` | Agentic: run shell command for a stated goal |
| `open_companion_test_pr` | Open companion PR with generated test files |

Subagents: **reviewer**, **test-explorer**.

## Triggers

- **check_suite** success (primary)
- Comment **`/review`** or **`@code-review-bot review`**
- Label **`agentic-test`**

## Org rollout

Workflow templates: `.github/workflow-templates/`. Project docs: repo-onboarding, cursor-rules-sync in Context.

## Customize

| File | Purpose |
|------|---------|
| `bot/skills/pr-review.md` | Scoring rubric and bands |
| `bot/skills/agentic-testing.md` | Goal-based test exploration |
| `bot/channels/github.ts` | Triggers |
| `bot/instructions.md` | Agent identity and procedure |

## Credentials

- **Deploy / hosted events:** `CURSOR_SERVICE_ACCOUNT_KEY`
- **Local model turns:** `CURSOR_API_KEY` or `bdk login`
- **GitHub:** Cursor **cursorAccount** (repos in `repos.ts` + deploy flags)
