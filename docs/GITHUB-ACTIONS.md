# GitHub Actions — automatic PR reviews (no Mac, no service account)

Runs on **GitHub’s runners** when a PR opens or updates. Uses your **User API Key** (`CURSOR_API_KEY`), not `bdk deploy`.

## One-time setup (insightstack)

1. **Cursor dashboard** → **Integrations** → GitHub → allow **`pmansata7/insightstack`** (still recommended for Cursor API + GitHub linkage).

2. **Cursor dashboard** → **API & SSH Keys** → **New API Key** → copy the key.

3. **GitHub** → **insightstack** repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Name: `CURSOR_API_KEY`
   - Value: your User API key

4. Workflow file is **`.github/workflows/pr-risk-review.yml`** in insightstack (committed via this project).

## What each PR run does

1. Checks out `pmansata7/code-review-bot` at `master`
2. Starts `bdk serve` on the runner (loopback)
3. `bdk github replay` for the current PR → bot posts **PR risk review** on the PR

## Costs / limits

- One Cursor model turn per workflow run (per PR event; concurrency cancels in-flight runs on new pushes).
- Action runtime ~2–5+ minutes depending on model and diff size.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Workflow skipped / no secret | Add `CURSOR_API_KEY` on the **app** repo (insightstack) |
| Auth error in logs | Regenerate API key; check Integrations |
| No review on PR | Check Actions tab logs; confirm `post_review_decision` in trace |
| Permission denied posting review | Workflow needs `pull-requests: write` (already in YAML) |

## Updating the bot

The workflow pins `code-review-bot` @ `master`. Push changes to that repo; the next PR run picks them up.
