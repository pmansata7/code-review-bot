import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Read PR context already seeded in the workspace (pr/meta.json, pr/diff.patch, pr/head.sha). Call before scoring.",
  effect: "read",
  inputSchema: z.object({
    includeDiffPreview: z
      .boolean()
      .optional()
      .describe("When true, include first 4000 chars of the diff."),
  }),
  async execute({ includeDiffPreview }, ctx) {
    const root = ctx.workspaceDir;
    const [metaRaw, headSha, diff] = await Promise.all([
      readFile(join(root, "pr/meta.json"), "utf8"),
      readFile(join(root, "pr/head.sha"), "utf8"),
      readFile(join(root, "pr/diff.patch"), "utf8"),
    ]);
    const preview =
      includeDiffPreview === true
        ? diff.slice(0, 4000) + (diff.length > 4000 ? "\n…[truncated preview]\n" : "")
        : "";

    return {
      headSha: headSha.trim(),
      metaJson: metaRaw,
      diffChars: diff.length,
      diffLines: diff.split("\n").length,
      diffPreview: preview,
    };
  },
});
