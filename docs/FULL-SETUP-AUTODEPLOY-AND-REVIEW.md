# Full setup: Vercel auto-deploy (your GitHub) + PR code review (`code-review-bot`)

For **pmansata7**, **Individual Cursor plan** (User API key), **cloud-only**. No Team service account. No `cursor-agent` on Vercel.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  pmansata7 merges to main on insightstack (etc.)                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │  Vercel (GitHub = pmansata7)  │  ← auto-deploy production
              └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Someone opens/updates a PR on an app repo                       │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │  GitHub Actions on APP repo   │
              │  checks out code-review-bot   │
              │  CURSOR_API_KEY → bdk replay  │  ← risk review comment
              └──────────────────────────────┘
```

Bot source (never deployed to Vercel): **https://github.com/pmansata7/code-review-bot**

---

## Part A — `code-review-bot` repo (one time)

| Step | Action |
|------|--------|
| A1 | Repo exists: `pmansata7/code-review-bot` — default branch **`master`**. |
| A2 | Optional merge **PR #1** — registers app repos in `bot/lib/repos.ts`. |
| A3 | Optional merge **PR #2** — Cursor rules docs + `git-workflow.mdc`. |
| A4 | When you change bot logic, **push to `master`** — app workflows pin `ref: master`. |

No `CURSOR_API_KEY` secret needed **on code-review-bot** unless you run the review workflow there.

---

## Part B — Cursor + GitHub (one time)

### B1 — User API key

1. https://cursor.com/dashboard  
2. **API & SSH Keys** → **New API Key**  
3. Copy and store securely  

### B2 — GitHub integration (recommended)

1. Dashboard → **Integrations** → **GitHub**  
2. Install / authorize for **pmansata7**  
3. Allow access to private repos you review (e.g. insightstack)  

---

## Part C — PR code review on each app repo

Repeat **C1–C3** per app repo (start with **insightstack**, then roll out).

### C1 — Repository secret (same key everywhere)

1. `https://github.com/pmansata7/REPO/settings/secrets/actions`  
2. **New repository secret**  
3. Name: **`CURSOR_API_KEY`** (exact)  
4. Value: User API key from B1  

### C2 — Workflow on `main`

File: **`.github/workflows/pr-risk-review.yml`**

Copy from:  
https://github.com/pmansata7/code-review-bot/blob/master/.github/workflows/pr-risk-review-reusable.yml  

**insightstack:** already on `main` (merged). Other repos: merge open `chore/pr-risk-review-action` PRs.

The workflow:

- Checks out **`pmansata7/code-review-bot`** @ **`master`**
- Runs `npx @cursor/bdk serve` on the runner
- Runs `bdk github replay` for `${{ github.repository }}#<PR>`

### C3 — Test

1. Open or update any PR on the repo  
2. **Actions** → **PR risk review** → green  
3. PR gets a **PR risk review** comment (risk score, blockers, etc.)  

**Troubleshooting:** missing secret, invalid API key, or Actions permissions — see `docs/GITHUB-ACTIONS.md`.

---

## Part D — Vercel auto-deploy as **pmansata7** (per app)

### D1 — Connect GitHub as you

1. https://vercel.com — log in as account that owns the project (e.g. **StackApps**).  
2. **Settings** (account) → **Authentication** → **GitHub** → connect **pmansata7**.  
3. Grant access to repos you deploy.  

### D2 — Import / link project

1. **Add New → Project** (or open existing e.g. InsightStack).  
2. Import **`pmansata7/insightstack`** (repeat per app).  
3. **Production Branch:** `main` (or your default).  
4. Set **Root Directory**, **Build Command**, **Output** per framework (Next.js defaults often work).  
5. Add **Environment Variables** in Vercel (e.g. `DATABASE_URL`, Supabase keys) — production values, not in git.  

### D3 — Auto-deploy behavior

- Every push to **production branch** → Vercel **Production** deployment.  
- Pushes from **Cursor Agent** (`cursor-agent`) on side branches may show **failed Preview** — not required for setup.  

### D4 — Reduce preview noise (recommended)

**Option 1 — Vercel UI:** Project → **Settings → Git** → limit which branches get previews.  

**Option 2 — Ignored Build Step** (build only `main`):

```bash
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] || exit 0
exit 1
```

(Adjust branch name if you use `master`.)

### D5 — GitHub branch protection

- Do **not** require failed **Vercel Preview** on PRs that only change `.github/` or `.cursor/`.  
- Require your real CI (tests) if you use it.  

### D6 — Your deploy flow

1. Work on a PR (or merge agent PR **as pmansata7**).  
2. Merge to **`main`**.  
3. Vercel deploys automatically under **your** integration.  

---

## Part E — Cursor rules (optional, per repo)

Merge open PRs titled **`chore: Cursor agent rules`**:

- **insightstack:** `.cursor/rules/git-workflow.mdc` + `prisma.mdc`  
- **lawstack:** same + lawstack Prisma scripts  
- **Others:** `git-workflow.mdc` only  

Cloud Agents read these from git after merge.

---

## Part F — Rollout order (recommended)

### Phase 1 — Pilot (insightstack)

```
[ ] B1 User API key
[ ] C1 CURSOR_API_KEY on insightstack
[ ] C2 workflow on main (done if merged #221)
[ ] C3 test PR → review comment
[ ] D1–D6 Vercel linked to insightstack, main auto-deploy
[ ] Merge #222 rules PR (ignore Vercel red on PR if only rules)
```

### Phase 2 — Other app repos

```
[ ] C1 secret on each repo
[ ] Merge workflow PR per repo
[ ] Merge rules PR per repo
[ ] D2 import each app in Vercel (if hosted there)
```

### Phase 3 — Bot maintenance

```
[ ] Merge code-review-bot PR #1 (repo registry)
[ ] Edit bot/skills on master when rubric changes
```

---

## Secret / link cheat sheet

| Item | Where |
|------|--------|
| Bot repo | https://github.com/pmansata7/code-review-bot |
| Workflow template | https://github.com/pmansata7/code-review-bot/blob/master/.github/workflows/pr-risk-review-reusable.yml |
| Per-repo Actions secret | `https://github.com/pmansata7/REPO/settings/secrets/actions` |
| Cursor API keys | https://cursor.com/dashboard |
| Vercel Git auth | https://vercel.com/account/settings/authentication |
| Add-to-each-repo checklist | `docs/ADD-TO-EACH-REPO.md` |

---

## What you do **not** need

- Cursor **Pro Team** or service accounts  
- `bdk deploy` or Mac running 24/7  
- Adding **cursor-agent** to Vercel team  
- `CURSOR_API_KEY` on **code-review-bot** (unless testing workflow there)
