import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Run a shell command in the agent workspace to verify an agentic test goal. Use after stating the goal in skill agentic-testing.",
  execution: "agent",
  inputSchema: z.object({
    goal: z.string().min(1).describe("Human-readable goal being verified."),
    command: z
      .string()
      .min(1)
      .describe("Shell command to run from repo root, e.g. npm test -- --runInBand."),
  }),
  script: `#!/usr/bin/env bash
set -euo pipefail
python3 -c "import json,subprocess,sys; d=json.load(sys.stdin); print('goal:', d['goal']); print('command:', d['command']); subprocess.run(['bash','-lc', d['command']], timeout=300)"
`,
});
