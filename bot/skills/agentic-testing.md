# Agentic testing

Goal-based testing for PRs: agents explore and propose tests; **CI stays deterministic**.

## Loop

1. **State a goal** — e.g. “`npm test` passes on this branch”, “changed API has a new test”, “critical checkout flow works”.
2. **Look → act → look** in the repo sandbox (read structure, run commands, inspect failures).
3. **Propose** follow-up work: companion PR with new tests or a new `evals/**/*.eval.ts` case.
4. **Human review** before merging generated tests.

## When to use

- PR labeled **`agentic-test`** (optional org convention).
- Medium/high risk reviews that cite **verification gap**.
- Author explicitly asks for exploratory test goals in the review comment.

## What to deliver

- Short **goal list** (numbered) tied to changed paths.
- Commands you ran and outcomes (pass/fail).
- Suggested **pinned** eval or test file paths — do not silently skip failures to greenwash CI.

## Non-goals

- Model-as-judge on every push blocking release.
- Autonomous merge of generated tests without human review.

## Continuous improvement

Log reviews in evals; label false low / false high; adjust rubric weights in `pr-review.md` and Project `pr-review-rubric.md`.
