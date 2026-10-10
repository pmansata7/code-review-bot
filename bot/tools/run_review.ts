import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";

const OUTPUT_SECTIONS = [
  "Summary",
  "Blockers",
  "Suggestions",
  "Test gaps",
  "Agentic goals proposed",
] as const;

export default defineTool({
  description:
    "Return the review output contract and rubric bands before you call post_review_decision.",
  effect: "read",
  inputSchema: z.object({}),
  async execute() {
    return {
      sections: OUTPUT_SECTIONS,
      bands: {
        low: "score 0–24, eligible for bot APPROVE when no blockers",
        medium: "25–64, human approval required",
        high: "65+, human required; request changes when blocking",
      },
      reminder:
        "Score using pr-review skill dimensions; cite files in evidence; diff size alone does not set risk.",
    };
  },
});
