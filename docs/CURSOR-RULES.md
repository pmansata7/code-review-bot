# Cursor rules rollout (code-review-bot)

This repo and sibling `pmansata7` projects use **project rules** under `.cursor/rules/` so Cloud Agents and the IDE share the same git and database conventions.

## In this repository

| File | Purpose |
|------|---------|
| `.cursor/rules/git-workflow.mdc` | Default branch `main`, when to use PRs, run test/lint before push |

This repo does **not** use Prisma. Do not add `prisma.mdc` here unless the stack changes.

## Account-wide User Rules (Cursor UI)

In **Cursor → Settings → Rules → User rules**, include the **Prisma / database** block from the code-review-bot project docs:

- Source: `docs/prisma-per-repo-setup.md` (section **Once (account-wide) — Cursor User Rules**)

That block applies when you work in Prisma repos (`insightstack`, `lawstack`, etc.). Per-repo detail lives in each repo’s `.cursor/rules/prisma.mdc`.

## Sibling repos (rolled out via PR)

- **insightstack**, **lawstack**: `git-workflow.mdc` + `prisma.mdc` (repo-specific npm scripts)
- **Other non-fork pmansata7 repos**: `git-workflow.mdc` only (unless they gain Prisma later)
