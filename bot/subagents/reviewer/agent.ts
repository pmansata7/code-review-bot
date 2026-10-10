import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Focused PR risk review: read diff and meta, apply pr-review skill, return band/score/evidence/blockers before post_review_decision.",
});
