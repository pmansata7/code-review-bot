# Prisma + DB migrations — per-repo setup for Cursor

Cursor does **not** run migrations by magic. You wire **rules** (when the agent should run commands), **env** (so commands can connect), and **install/CI** (so Cloud Agents and deploys stay in sync).

**Your repos with Prisma today:** `insightstack`, `lawstack`. Others: skip Prisma sections unless you add Prisma later.

---

## Once (account-wide) — Cursor User Rules

**Customize → Rules → User rules** — add:

```text
Prisma / database (when this repo uses Prisma):
- After any change to prisma/schema.prisma or prisma/migrations/: run the repo’s package.json scripts (never raw prisma CLI unless no script exists).
- Always run `db:generate` (or `prisma generate`) after schema changes.
- For local dev schema sync: use `db:migrate` or `db:push` as defined in package.json — not both unless the repo docs say so.
- Commit new migration folders under prisma/migrations/ with the schema change; never apply production migrate deploy from an agent unless I explicitly ask.
- If DATABASE_URL is missing, say so and use .env.example; do not invent credentials.
```

---

## Per repo — checklist

### A) Prisma repo (insightstack-style)

| Step | Action |
|------|--------|
| 1 | Confirm `prisma/schema.prisma` + `prisma/migrations/` exist |
| 2 | Document scripts in README or AGENTS.md (`db:generate`, `db:migrate`, `db:deploy`, etc.) |
| 3 | Add **`.cursor/rules/prisma.mdc`** with `alwaysApply: true` and **this repo’s exact npm scripts** |
| 4 | **`.env.example`** lists `DATABASE_URL` / `DIRECT_URL` |
| 5 | **Local:** copy `.env.example` → `.env.local` (insightstack uses `dotenv-cli -e .env.local`) |
| 6 | **Cloud Agent:** `.cursor/environment.json` + `.cursor/install.sh` runs `prisma generate` + schema sync (insightstack already does local Postgres + `db push` in install) |
| 7 | **CI:** `prisma generate` on PR build; production **`prisma migrate deploy`** only in deploy workflow (secrets: prod `DATABASE_URL`) |
| 8 | Trigger **environment rebuild** after changing `install.sh` or Prisma major version |

**insightstack** — mostly done. Agent rule should point at:

- `npm run db:generate`
- `npm run db:migrate` (creates migration in dev)
- `npm run db:deploy` (production-style; agent should not run on prod without ask)
- `npm run db:status`

### B) Prisma + Supabase (lawstack-style)

| Step | Action |
|------|--------|
| 1–4 | Same as above |
| 5 | Rule must list **both** Prisma and Supabase scripts if you use both: `db:push`, `db:supabase:push`, etc. |
| 6 | Cloud Agent install: either local Postgres + prisma, or document that agent uses remote Supabase via **Cursor environment secrets** |
| 7 | Never run `db:rls` or destructive SQL without explicit user request |

### C) No Prisma

No Prisma rule file. Optional one line in User rules: “This repo has no Prisma — do not run prisma commands.”

---

## Copy-paste: `.cursor/rules/prisma.mdc` (customize scripts)

```markdown
---
description: Run Prisma and DB workflows automatically when schema changes
alwaysApply: true
---

# Database / Prisma

Use **only** these npm scripts (from this repo’s package.json):

- Generate client: `npm run db:generate`
- Dev migration: `npm run db:migrate`
- Dev push (if no migration): `npm run db:push`
- Check migration status: `npm run db:status`
- Production deploy (human/CI only unless user asks): `npm run db:deploy`

## When to run

1. After editing `prisma/schema.prisma` → `db:generate` then `db:migrate` (preferred) or `db:push` if that is this repo’s convention.
2. After pulling `prisma/migrations/**` → `db:generate` then `db:migrate` or `db:deploy` for local DB per package.json.
3. Before marking DB work done → `db:status` (or equivalent).

## Do not

- Run `migrate deploy` against production without explicit user approval.
- Skip committing `prisma/migrations/` when you created a migration.
- Use `prisma` CLI directly if an npm script exists.
```

Replace script names per repo (lawstack: `db:push`, `db:supabase:push`, …).

---

## Cloud Agent secrets (remote DB)

If the agent should hit **real** Supabase/Postgres (not local install DB):

1. Cursor **Dashboard → Cloud Agents → Environments** (or repo-linked environment)
2. Add secrets: `DATABASE_URL`, `DIRECT_URL` (and Supabase keys if the app needs them)
3. Rebuild environment after changing `install.sh`

Without secrets, Cloud Agents should use **local DB in install.sh** (insightstack pattern).

---

## GitHub Actions (optional, per repo)

On push to `main` after merge (deploy job only):

```yaml
- run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

PR CI usually only needs:

```yaml
- run: npm run db:generate
- run: npm test   # or build
```

---

## Quick copy checklist (per repo)

```
Repo: _______________
[ ] Uses Prisma?  If no → stop
[ ] .cursor/rules/prisma.mdc with correct npm scripts
[ ] .env.example complete
[ ] Local .env.local (developer machine)
[ ] Cloud: .cursor/install.sh includes prisma generate + local schema sync
[ ] Cloud secrets if using remote DB
[ ] CI: generate on PR; migrate deploy on production deploy only
[ ] Rebuild Cursor environment after install.sh changes
```
