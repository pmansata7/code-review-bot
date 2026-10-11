# Add PR risk review to another repo (repeatable)

Same **Cursor User API key** every time. Each app repo needs the **workflow**; the **secret** depends on your GitHub setup.

---

## Before you start (once ever)

| Step | Where |
|------|--------|
| Create Cursor **User API key** | [cursor.com/dashboard](https://cursor.com/dashboard) → **API & SSH Keys** → **New API Key** |
| (Optional) Org-wide secret | GitHub org → **Settings** → **Secrets and variables** → **Actions** → name `CURSOR_API_KEY` |

---

## For each new repo

### 1. GitHub secret (skip if org secret already covers this repo)

1. Open `https://github.com/OWNER/REPO/settings/secrets/actions`
2. **New repository secret**
3. Name: `CURSOR_API_KEY` (exact)
4. Value: your Cursor **User API key** (same value as other repos)
5. **Add secret**

### 2. Add the workflow file

Create **`.github/workflows/pr-risk-review.yml`** on `main` with this content (replace nothing if repo is under `pmansata7`; for other owners the replay line uses `github.repository` automatically):

Copy from:  
https://github.com/pmansata7/code-review-bot/blob/master/.github/workflows/pr-risk-review-reusable.yml

Or minimal steps:

```bash
curl -o .github/workflows/pr-risk-review.yml \
  https://raw.githubusercontent.com/pmansata7/code-review-bot/master/.github/workflows/pr-risk-review-reusable.yml
```

Commit and push to **main** (or merge a PR).

### 3. Cursor GitHub access (recommended once per account)

Dashboard → **Integrations** → GitHub → allow this **private** repo if needed.

### 4. Verify

1. Open or update a **pull request**
2. Repo → **Actions** → workflow **PR risk review** → green or read logs
3. PR should get a **PR risk review** comment

---

## Checklist (copy per repo)

```
Repo: OWNER/REPO
[ ] Repository secret CURSOR_API_KEY  (or org secret includes this repo)
[ ] .github/workflows/pr-risk-review.yml on main
[ ] Test PR → Actions run → review on PR
```

---

## Repos already using insightstack workflow

Reference implementation merged from:  
https://github.com/pmansata7/insightstack/blob/main/.github/workflows/pr-risk-review.yml  
(insightstack pins `pmansata7/insightstack` in replay; reusable template uses `${{ github.repository }}`.)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow not listed | File must be on **default branch** (`main`) |
| Secret not found | Name must be `CURSOR_API_KEY`; repo or org scope |
| Auth failed | New User API key; check Cursor billing/limits |
| No review on PR | Open **Actions** log; redact keys if sharing errors |
