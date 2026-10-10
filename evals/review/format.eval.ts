import { defineEval, includes } from "@cursor/bdk/evals";

const BASE = [
  "Primary trigger: check_suite completed with success.",
  "Read pr/diff.patch and pr/meta.json. Apply skill pr-review.",
  "Call fetch_pr and run_review, then post_review_decision once.",
].join("\n");

export default defineEval({
  tags: ["review-format", "video-rubric"],
  cases: [
    {
      id: "output-sections-medium-risk",
      description: "Medium-risk change mentions test gaps or human review themes from video rubric.",
      async test(t) {
        await t.send(BASE, {
          workspaceFiles: {
            "pr/diff.patch": [
              "diff --git a/src/billing/charge.ts b/src/billing/charge.ts",
              "+export function applyDiscount() { /* pricing */ }",
            ].join("\n"),
            "pr/head.sha": "cccccccccccccccccccccccccccccccccccccccc",
            "pr/meta.json": JSON.stringify({
              title: "Billing discount",
              state: "open",
              draft: false,
              mergeable: true,
              changed_files: 2,
            }),
          },
        });
        t.succeeded();
        t.calledTool("post_review_decision");
        t.check(t.reply, includes(/medium|high|billing|human|test/i));
      },
    },
  ],
});
