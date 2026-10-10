import {
  defaultGitHubAuth,
  defaultGitHubPullRequestDispatch,
  githubChannel,
  type GitHubEventContext,
} from "@cursor/bdk/channels/github";
import { buildPrWorkspaceFiles } from "../lib/pr-workspace.js";
import { alreadyReviewedHead } from "../lib/review-dedupe.js";
import { REPOS, watches } from "../lib/repos.js";

const OPTIONAL_PR_ACTIONS = new Set(["opened", "reopened", "ready_for_review"]);

function reviewDispatch(
  ctx: GitHubEventContext,
  prNumber: number,
  headSha: string,
  triggerLine: string,
) {
  return {
    auth: defaultGitHubAuth(ctx),
    context: [
      triggerLine,
      "Read pr/diff.patch and pr/meta.json. Apply skill pr-review.",
      "Call post_review_decision once with risk band, score, evidence, blockers, and recommendation.",
    ],
    async workspaceFiles() {
      return buildPrWorkspaceFiles(ctx, prNumber);
    },
  };
}

export default githubChannel({
  botName: "code-review-bot",
  cursorAccount: { repos: REPOS },
  deliverReplies: false,
  onComment: () => null,

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
    if (await alreadyReviewedHead(ctx.host.kv, ctx.repository.fullName, prRef.number, headSha)) {
      return null;
    }

    const octokit = await ctx.github.getOctokit();
    const { data } = await octokit.rest.pulls.get({
      owner: ctx.repository.owner,
      repo: ctx.repository.name,
      pull_number: prRef.number,
    });
    if (data.draft || data.state !== "open" || data.head.sha !== headSha) {
      return null;
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
    if (!OPTIONAL_PR_ACTIONS.has(pr.action)) {
      return null;
    }
    const dispatch = defaultGitHubPullRequestDispatch(ctx, pr);
    if (dispatch === null) {
      return null;
    }

    const octokit = await ctx.github.getOctokit();
    const { data } = await octokit.rest.pulls.get({
      owner: ctx.repository.owner,
      repo: ctx.repository.name,
      pull_number: pr.number,
    });
    const headSha = data.head.sha;
    if (await alreadyReviewedHead(ctx.host.kv, ctx.repository.fullName, pr.number, headSha)) {
      return null;
    }

    return reviewDispatch(
      ctx,
      pr.number,
      headSha,
      `Optional early review on pull_request ${pr.action} (disable in prod if you only want post-CI).`,
    );
  },
});
