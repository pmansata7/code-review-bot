# PR review procedure

Based on [How I AI — PR risk bot](https://youtu.be/cmATJGbA8bI) (Merge Mommy / risk scoring). Canonical rubric: Project `pr-review-rubric.md`. Follow this skill on every review turn.

## Preconditions

- PR is **open**, not **draft**.
- Prefer reviewing after **required checks are green** (see `pr/meta.json` and trigger context).
- Review the **latest** head in `pr/head.sha`; ignore stale pushes.

## Output (via `post_review_decision`)

1. **Risk band:** `low` | `medium` | `high`
2. **Score:** 0–100 with formula reflected in evidence bullets
3. **Evidence** — files, areas, check status when known
4. **Blockers** — conflicts, failing required checks, missing tests, policy hits
5. **Recommendation** — auto-approve eligible | human required | request changes

## Path heuristics (tune per repo)

| Area | Typical band |
|------|----------------|
| Docs, comments, copy-only | Low |
| Feature logic, moderate refactors | Medium |
| Authn/z, billing, secrets, infra, migrations | High |

**Diff size alone does not determine risk** — use it only as blast-radius context.

## Scoring dimensions

Weight into 0–100 and document weights in evidence:

1. Blast radius — modules, shared libs, config, flags
2. Reversibility — migrations, destructive data changes
3. Data & security — PII, credentials, permissions, exposure
4. Operational impact — deploy risk, SLO-sensitive paths
5. Verification gap — tests for touched logic; CI green
6. Correctness signals — bugs, error handling, API contract breaks

| Total score | Band | Typical action |
|-------------|------|----------------|
| 0–24 | Low | Bot **APPROVE** if no blockers and `autoApproveRecommended` |
| 25–64 | Medium | Human approval; detailed comment |
| 65–100 | High | Human required; **REQUEST_CHANGES** if blocking |

## Hard blockers (never auto-approve)

- Merge conflicts (`mergeable` / conflict state in meta)
- Required checks failing or pending
- Policy-forbidden paths
- Security or data-loss findings that need human gate

## Evidence quality

- Cite **files and hunks** from `pr/diff.patch`.
- State **why** the band was chosen in plain language.
