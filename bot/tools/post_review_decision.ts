import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseGitHubPrContinuationKey } from "@cursor/bdk/channels/github";
import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";
import { markReviewedHead } from "../lib/review-dedupe.js";

const SHA = /^[0-9a-f]{40}$/i;

const riskBand = z.enum(["low", "medium", "high"]);

export default defineTool({
  description:
    "Post the structured PR risk review on this session's pull request. Call once after scoring.",
  effect: "write",
  inputSchema: z.object({
    risk: riskBand.describe("Risk band from the rubric."),
    score: z.number().int().min(0).max(100).describe("0–100 weighted score; document in evidence."),
    summary: z.string().min(1).max(500).describe("Plain-language summary for auditors."),
    evidence: z
      .array(z.string().min(1).max(400))
      .min(1)
      .describe("Bullets tied to diff paths, areas, and checks."),
    blockers: z
      .array(z.string().min(1).max(300))
      .describe("Merge blockers: conflicts, failing checks, policy violations."),
    autoApproveRecommended: z
      .boolean()
      .describe("True only for low band with no blockers and policy allows bot APPROVE."),
  }),
  async execute({ risk, score, summary, evidence, blockers, autoApproveRecommended }, ctx) {
    if (ctx.session.purpose === "eval") {
      return {
        posted: false,
        reason: "eval",
        risk,
        score,
        summary,
        evidence,
        blockers,
        autoApproveRecommended,
      };
    }

    const ref = parseGitHubPrContinuationKey(ctx.session.continuationKey ?? "");
    if (ref === undefined) {
      throw new Error("post_review_decision requires a GitHub pull request session");
    }

    const headSha = (await readFile(join(ctx.workspaceDir, "pr/head.sha"), "utf8")).trim();
    if (!SHA.test(headSha)) {
      throw new Error("missing pr/head.sha");
    }

    const body = formatReviewBody({ risk, score, summary, evidence, blockers, autoApproveRecommended });
    let event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT";
    if (blockers.length > 0) {
      event = "REQUEST_CHANGES";
    } else if (risk === "low" && autoApproveRecommended && score < 25) {
      event = "APPROVE";
    } else if (risk === "high" && score >= 65) {
      event = "REQUEST_CHANGES";
    }

    const octokit = await ctx.host.github.getOctokit();
    const response = await octokit.rest.pulls.createReview({
      owner: ref.owner,
      repo: ref.repo,
      pull_number: ref.number,
      commit_id: headSha,
      body,
      event,
    });

    const fullName = `${ref.owner}/${ref.repo}`;
    await markReviewedHead(ctx.host.kv, fullName, ref.number, headSha);

    return {
      posted: true,
      pr: `${fullName}#${ref.number}`,
      url: response.data.html_url,
      event,
      risk,
      score,
    };
  },
});

function formatReviewBody(input: {
  risk: z.infer<typeof riskBand>;
  score: number;
  summary: string;
  evidence: string[];
  blockers: string[];
  autoApproveRecommended: boolean;
}): string {
  const recommendation =
    input.blockers.length > 0
      ? "request changes"
      : input.autoApproveRecommended && input.risk === "low"
        ? "auto-approve eligible"
        : "human required";

  const lines = [
    "## PR risk review",
    "",
    `**Risk:** ${input.risk} · **Score:** ${input.score}/100`,
    `**Recommendation:** ${recommendation}`,
    "",
    input.summary,
    "",
    "### Evidence",
    ...input.evidence.map((item) => `- ${item}`),
  ];

  if (input.blockers.length > 0) {
    lines.push("", "### Blockers", ...input.blockers.map((item) => `- ${item}`));
  }

  return lines.join("\n");
}
