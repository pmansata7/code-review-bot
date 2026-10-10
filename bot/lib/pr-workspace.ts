import type { GitHubEventContext } from "@cursor/bdk/channels/github";

const MAX_DIFF_CHARS = 150_000;

type WorkspaceClient = Pick<GitHubEventContext, "github" | "repository">;

export async function buildPrWorkspaceFiles(
  ctx: WorkspaceClient,
  prNumber: number,
): Promise<Record<string, string>> {
  const octokit = await ctx.github.getOctokit();
  const pull = {
    owner: ctx.repository.owner,
    repo: ctx.repository.name,
    pull_number: prNumber,
  };
  const [meta, diff] = await Promise.all([
    octokit.rest.pulls.get(pull),
    octokit.rest.pulls.get({ ...pull, mediaType: { format: "diff" } }),
  ]);
  const diffText = String(diff.data);
  const truncated =
    diffText.length > MAX_DIFF_CHARS
      ? `${diffText.slice(0, MAX_DIFF_CHARS)}\n…[truncated]\n`
      : diffText;

  const metaJson = JSON.stringify(
    {
      number: meta.data.number,
      title: meta.data.title,
      state: meta.data.state,
      draft: meta.data.draft,
      mergeable: meta.data.mergeable,
      mergeable_state: meta.data.mergeable_state,
      changed_files: meta.data.changed_files,
      additions: meta.data.additions,
      deletions: meta.data.deletions,
      head: { ref: meta.data.head.ref, sha: meta.data.head.sha },
      base: { ref: meta.data.base.ref, sha: meta.data.base.sha },
      html_url: meta.data.html_url,
    },
    null,
    2,
  );

  return {
    "pr/diff.patch": truncated,
    "pr/head.sha": meta.data.head.sha,
    "pr/meta.json": metaJson,
  };
}
