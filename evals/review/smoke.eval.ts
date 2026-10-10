import { defineEval, includes } from "@cursor/bdk/evals";

const OPENED = [
  "GitHub pull request trigger: your-org/service-a#1",
  "Action: opened",
  "PR: https://github.com/your-org/service-a/pull/1",
  "Title: Docs tweak",
  "Head: docs/readme (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)",
  "Base: main",
  "Author: sam",
  "",
  "Read pr/diff.patch and pr/meta.json. Apply skill pr-review.",
  "Call post_review_decision once with risk band, score, evidence, blockers, and recommendation.",
].join("\n");

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "docs-low-risk",
      description: "Docs-only diff gets low risk and post_review_decision.",
      async test(t) {
        await t.send(OPENED, {
          workspaceFiles: {
            "pr/diff.patch": ["diff --git a/README.md b/README.md", "+# Getting started"].join("\n"),
            "pr/head.sha": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "pr/meta.json": JSON.stringify({
              title: "Docs tweak",
              state: "open",
              draft: false,
              mergeable: true,
              mergeable_state: "clean",
              changed_files: 1,
            }),
          },
        });
        t.succeeded();
        t.calledTool("post_review_decision");
        t.check(t.reply, includes(/low|risk|docs|readme/i));
      },
    },
    {
      id: "auth-high-risk",
      description: "Auth path change is scored medium or high.",
      async test(t) {
        await t.send(OPENED.replace("Docs tweak", "Auth middleware"), {
          workspaceFiles: {
            "pr/diff.patch": [
              "diff --git a/src/auth/session.ts b/src/auth/session.ts",
              "+export function bypassAdmin() { return true; }",
            ].join("\n"),
            "pr/head.sha": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "pr/meta.json": JSON.stringify({
              title: "Auth middleware",
              state: "open",
              draft: false,
              mergeable: true,
              changed_files: 1,
            }),
          },
        });
        t.succeeded();
        t.calledTool("post_review_decision");
        t.check(t.reply, includes(/high|medium|auth|blocker/i));
      },
    },
  ],
});
