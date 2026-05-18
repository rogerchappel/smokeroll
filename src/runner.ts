import { evaluateCommand, assertionsPassed } from "./assertions.js";
import { executeCommand } from "./execute.js";
import type {
  RunOptions,
  SmokeCommandResult,
  SmokePlan,
  SmokeRunResult,
} from "./types.js";

export async function runPlan(
  plan: SmokePlan,
  options: Pick<RunOptions, "failFast"> = {},
): Promise<SmokeRunResult> {
  const started = performance.now();
  const startedAt = new Date();
  const results: SmokeCommandResult[] = [];

  for (const command of plan.commands) {
    const execution = await executeCommand(command);
    const assertions = evaluateCommand(command, execution);
    const passed = assertionsPassed(assertions);

    results.push({
      command,
      execution,
      assertions,
      passed,
    });

    if (!passed && options.failFast) {
      break;
    }
  }

  const finishedAt = new Date();

  return {
    manifestPath: plan.manifestPath,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: Math.round(performance.now() - started),
    passed: results.every((result) => result.passed) && results.length === plan.commands.length,
    results,
  };
}

