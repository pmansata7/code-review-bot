import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Agentic testing: state goals, run run_test_goal commands, propose pinned tests; open companion PR via open_companion_test_pr when files are ready.",
});
