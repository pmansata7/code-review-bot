import {
  defaultGitHubAuth,
  defaultGitHubPullRequestDispatch,
  githubChannel,
  type GitHubEventContext,
} from "@cursor/bdk/channels/github";
import { buildPrWorkspaceFiles } from "../lib/pr-workspace.js";
import { alreadyReviewedHead } from "../lib/review-dedupe.js";
import { REPOS, watches } from "../lib/repos.js";

const OPTIONAL_PR_ACTIONS = new Set([
  "opened",
  "reopened",
  "ready_for_review",
  "synchronize",
]);
const AGENTIC_LABEL = "agentic-test";
const BOT_MENTION = /@code-review-bot\b/i;
const SLASH_REVIEW = /(?:^|\s)\/review\b/i;

function reviewDispatch(
  ctx: GitHubEventContext,
  prNumber: number,
  headSha: string,
  triggerLine: string,
  extraContext: string[] = [],
) {
  return {
    auth: defaultGitHubAuth(ctx),
    context: [
      triggerLine,
      "Read pr/diff.patch and pr/meta.json. Apply skill pr-review.",
      "Call fetch_pr and run_review, then post_review_decision once with risk band, score, evidence, blockers, and recommendation.",
      ...extraContext,
    ],
    async workspaceFiles() {
      return buildPrWorkspaceFiles(ctx, prNumber);
    },
  };
}

function agenticDispatch(
  ctx: GitHubEventContext,
  prNumber: number,
  headSha: string,
  triggerLine: string,
) {
  return reviewDispatch(ctx, prNumber, headSha, triggerLine, [
    "Apply skill agentic-testing. Delegate to test-explorer for goals and run_test_goal.",
    "Include agenticGoals and testGaps in post_review_decision when relevant.",
    "Use open_companion_test_pr only when you have concrete test file contents.",
  ]);
}

export default githubChannel({
  botName: "code-review-bot",
  cursorAccount: { repos: REPOS, permissions: "contents-write" },
  deliverReplies: false,

  onComment: async (ctx, comment) => {
    if (!watches(ctx.repository.fullName)) {
      return null;
    }
    const body = comment.body ?? "";
    if (!SLASH_REVIEW.test(body) && !BOT_MENTION.test(body)) {
      return null;
    }
    if (!body.toLowerCase().includes("review")) {
      return null;
    }

    if (ctx.conversation.kind !== "pull_request") {
      return null;
    }
    const issueNumber = ctx.conversation.number;
    const octokit = await ctx.github.getOctokit();
    const { data: pr } = await octokit.rest.pulls.get({
      owner: ctx.repository.owner,
      repo: ctx.repository.name,
      pull_number: issueNumber,
    });
    if (pr.draft || pr.state !== "open") {
      return null;
    }
    const headSha = pr.head.sha;

    return reviewDispatch(
      ctx,
      issueNumber,
      headSha,
      `Manual trigger: PR comment (${comment.author?.login ?? "user"}).`,
    );
  },

  onCheckSuite: async (ctx, suite) => {
    if (!watches(ctx.repository.fullName)) {
      return null;
    }
    if (suite.conclusion !== "success") {
      return null;
    }
    const prRef = suite.pullRequests[0];
    if (prRef === undefined) {
      return null;
    }
    const headSha = suite.headSha;

    const octokit = await ctx.github.getOctokit();
    const { data } = await octokit.rest.pulls.get({
      owner: ctx.repository.owner,
      repo: ctx.repository.name,
      pull_number: prRef.number,
    });
    if (data.draft || data.state !== "open" || data.head.sha !== headSha) {
      return null;
    }

    const labels = data.labels.map((l) => l.name);
    const agentic = labels.includes(AGENTIC_LABEL);
    if (
      !agentic &&
      (await alreadyReviewedHead(ctx.host.kv, ctx.repository.fullName, prRef.number, headSha))
    ) {
      return null;
    }

    if (agentic) {
      return agenticDispatch(
        ctx,
        prRef.number,
        headSha,
        `Primary trigger: check_suite success + label ${AGENTIC_LABEL}.`,
      );
    }
    return reviewDispatch(
      ctx,
      prRef.number,
      headSha,
      `Primary trigger: check_suite completed with success (head ${headSha.slice(0, 7)}).`,
    );
  },

  onPullRequest: async (ctx, pr) => {
    if (!watches(ctx.repository.fullName) || pr.draft) {
      return null;
    }

    if (pr.action === "labeled" && pr.label?.name === AGENTIC_LABEL) {
      if (await alreadyReviewedHead(ctx.host.kv, ctx.repository.fullName, pr.number, pr.headSha)) {
        return agenticDispatch(
          ctx,
          pr.number,
          pr.headSha,
          `Label ${AGENTIC_LABEL} added; run agentic testing even if head was reviewed.`,
        );
      }
      return agenticDispatch(
        ctx,
        pr.number,
        pr.headSha,
        `Label ${AGENTIC_LABEL} added on pull_request labeled.`,
      );
    }

    if (!OPTIONAL_PR_ACTIONS.has(pr.action)) {
      return null;
    }
    const dispatch = defaultGitHubPullRequestDispatch(ctx, pr);
    if (dispatch === null) {
      return null;
    }

    if (await alreadyReviewedHead(ctx.host.kv, ctx.repository.fullName, pr.number, pr.headSha)) {
      return null;
    }

    return reviewDispatch(
      ctx,
      pr.number,
      pr.headSha,
      `Optional early review on pull_request ${pr.action}.`,
    );
  },
});
