import { parseGitHubPrContinuationKey } from "@cursor/bdk/channels/github";
import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Open a companion pull request from the current PR head with generated test or eval files. Human review required before merge.",
  effect: "write",
  inputSchema: z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(8000),
    branchSuffix: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]{0,40}$/i)
      .describe("Suffix for branch agentic-tests/<suffix>"),
    files: z
      .record(z.string(), z.string())
      .refine((f) => Object.keys(f).length > 0, "At least one file path required"),
  }),
  async execute({ title, body, branchSuffix, files }, ctx) {
    if (ctx.session.purpose === "eval") {
      return { opened: false, reason: "eval", title, fileCount: Object.keys(files).length };
    }

    const ref = parseGitHubPrContinuationKey(ctx.session.continuationKey ?? "");
    if (ref === undefined) {
      throw new Error("open_companion_test_pr requires a GitHub pull request session");
    }

    const octokit = await ctx.host.github.getOctokit();
    const pull = await octokit.rest.pulls.get({
      owner: ref.owner,
      repo: ref.repo,
      pull_number: ref.number,
    });
    const headSha = pull.data.head.sha;
    const branchName = `agentic-tests/${branchSuffix}`;

    const baseRef = await octokit.rest.git.getRef({
      owner: ref.owner,
      repo: ref.repo,
      ref: `heads/${pull.data.head.ref}`,
    });

    try {
      await octokit.rest.git.createRef({
        owner: ref.owner,
        repo: ref.repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.data.object.sha,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes("Reference already exists")) {
        throw error;
      }
    }

    for (const [path, content] of Object.entries(files)) {
      let existingSha: string | undefined;
      try {
        const existing = await octokit.rest.repos.getContent({
          owner: ref.owner,
          repo: ref.repo,
          path,
          ref: branchName,
        });
        if (!Array.isArray(existing.data) && existing.data.type === "file") {
          existingSha = existing.data.sha;
        }
      } catch {
        existingSha = undefined;
      }

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: ref.owner,
        repo: ref.repo,
        path,
        message: `agentic-test: add ${path}`,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch: branchName,
        sha: existingSha,
      });
    }

    const companion = await octokit.rest.pulls.create({
      owner: ref.owner,
      repo: ref.repo,
      title,
      head: branchName,
      base: pull.data.base.ref,
      body: `${body}\n\n---\nCompanion to #${ref.number} (head ${headSha.slice(0, 7)}).`,
    });

    return {
      opened: true,
      url: companion.data.html_url,
      number: companion.data.number,
      branch: branchName,
    };
  },
});
