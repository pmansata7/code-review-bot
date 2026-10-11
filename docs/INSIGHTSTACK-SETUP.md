# Insightstack — all three steps (detailed)

**Goal:** Hosted bot reviews PRs on `pmansata7/insightstack`.  
**Bot repo:** https://github.com/pmansata7/code-review-bot (already lists Insightstack).

Use a **Mac or Windows terminal** (Terminal, iTerm, PowerShell). Node **22.13+** required (`node -v`).

---

## STEP 1 — Cursor can access private Insightstack

### 1.1 Open Cursor settings for GitHub

1. Go to **https://cursor.com/dashboard** and sign in (same account you use for Cursor).
2. Find **Integrations**, **Connected accounts**, or **GitHub** (wording varies).
3. If GitHub is **not** connected:
   - Click **Connect GitHub** / **Install**.
   - Approve the **Cursor GitHub App** for your `pmansata7` account.

### 1.2 Grant access to the private repo

1. In the GitHub connection UI, open **repository access** (or “Configure” on the GitHub App install page).
2. Choose either:
   - **All repositories**, or  
   - **Only select repositories** → check **`insightstack`**.
3. Save / **Install** / **Update access**.

### 1.3 Confirm on GitHub.com (optional)

1. Go to **https://github.com/settings/installations**.
2. Click **Cursor** (or Cursor’s app name).
3. Under **Repository access**, confirm **`insightstack`** is listed.

### 1.4 Done checklist

- [ ] GitHub shows connected in Cursor dashboard  
- [ ] `pmansata7/insightstack` is in the allowed repo list  

**If this step is skipped:** deploy may succeed but the bot will never see PR events on Insightstack.

---

## STEP 2 — Deploy `code-review-bot` to Cursor hosting

### 2.1 Prerequisites on your computer

```bash
node -v    # must be v22.13.0 or higher
git --version
```

Install Node 22 from https://nodejs.org if needed.

### 2.2 Clone the bot and install

```bash
cd ~
git clone https://github.com/pmansata7/code-review-bot.git
cd code-review-bot
npm install
```

### 2.3 Sanity check (no secret needed)

```bash
npx @cursor/bdk validate --dir .
npm run check
```

You should see `ok: code-review-bot` with no errors.

### 2.4 Get `CURSOR_SERVICE_ACCOUNT_KEY`

This is a **team service account API key** for hosted BDK agents (not your personal Cursor password).

1. In **https://cursor.com/dashboard**, open your **Team** (or org) settings.
2. Look for **Service accounts**, **API keys**, **Agents**, or **BDK / Bot hosting** (product name may vary).
3. **Create** a service account (e.g. name: `code-review-bot`).
4. Copy the key once — store it in a password manager. It often starts with a long opaque string.

**If you cannot find it:** use Cursor **Help** or docs for “BDK deploy service account”. Alternative for local testing only: `npx @cursor/bdk login` (personal) — **deploy to hosting still needs the service account key** on most teams.

### 2.5 Deploy (run in the same terminal)

**Do not paste the key into chat or commit it.**

```bash
cd ~/code-review-bot
export CURSOR_SERVICE_ACCOUNT_KEY="PASTE_YOUR_KEY_HERE"

npx @cursor/bdk whoami --json
```

Check output: `credentialSource` should be **`service-account`**.

```bash
npx @cursor/bdk deploy --dir . \
  --cursor-events-repo pmansata7/insightstack
```

Wait until the command finishes. Success = deployment state **running** (not stuck on `deploying`).

**First-time deploy:** the CLI may print a **one-time alias token**. Save it privately; do not share. Redeploys usually do not repeat it.

### 2.6 If deploy fails

| Error vibe | What to do |
|------------|------------|
| No service account / auth | Fix Step 2.4 key; re-run `whoami --json` |
| Repo not accessible | Redo Step 1 for `insightstack` |
| Ref not on remote | `git pull` on `code-review-bot`; ensure latest `master` on GitHub |
| Hosting not enabled | Team may need BDK/hosting entitlement — contact Cursor support |

### 2.7 Done checklist

- [ ] `whoami` shows service-account  
- [ ] `deploy` completed with running deployment  
- [ ] You used `--cursor-events-repo pmansata7/insightstack`  

---

## STEP 3 — See a review on an Insightstack PR

### 3.1 Create or open a pull request

1. On **https://github.com/pmansata7/insightstack**, create a branch and open a **PR** into `main` (or use an existing open PR).

### 3.2 Wait for GitHub checks (preferred trigger)

The bot is configured to run after **check suite success** (CI green).

1. On the PR, open the **Checks** tab.
2. Wait until required workflows finish **successfully**.

**Note:** Insightstack currently has **no** GitHub Actions workflows. Use **3.4** (`/review`) until CI is added.

**Optional:** add a simple GitHub Action on Insightstack later so every PR runs `npm run lint` or `npm run build`.

### 3.3 Look for the bot review

On the PR **Conversation** tab, look for a review from the bot:

- Title/body includes **PR risk review**
- **Risk** band, **Score**, **Evidence**

### 3.4 If nothing appears — manual trigger

On the PR, add a comment:

```text
/review
```

or

```text
@code-review-bot review
```

### 3.5 Manual replay from your laptop

```bash
cd ~/code-review-bot
npx @cursor/bdk login
# or: export CURSOR_API_KEY="..."

npx @cursor/bdk github replay pmansata7/insightstack#REPLACE_WITH_PR_NUMBER --dir .
```

Replace `REPLACE_WITH_PR_NUMBER` (e.g. `42` for PR #42).

### 3.6 Optional — agentic testing

Add label **`agentic-test`** to the PR (GitHub → Labels). Bot runs the agentic-testing skill on the next eligible event.

### 3.7 Done checklist

- [ ] PR has a risk review comment or GitHub review  
- [ ] You know how to re-run with `/review` or `github replay`  

---

## Quick reference

| Step | One line |
|------|----------|
| 1 | Dashboard → GitHub → allow `insightstack` |
| 2 | `export CURSOR_SERVICE_ACCOUNT_KEY=…` → `npx @cursor/bdk deploy --dir . --cursor-events-repo pmansata7/insightstack` |
| 3 | PR + green CI, or comment `/review` |

---

## After you change the bot

Edit code → commit → `git push` → run **the same deploy command** again (Step 2.5).
