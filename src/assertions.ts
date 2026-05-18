import type {
  AssertionResult,
  CommandExecution,
  ResolvedSmokeCommand,
} from "./types.js";

export function evaluateCommand(
  command: ResolvedSmokeCommand,
  execution: CommandExecution,
): AssertionResult[] {
  const assertions: AssertionResult[] = [];

  assertions.push({
    ok: !execution.timedOut,
    message: execution.timedOut
      ? `timed out after ${command.timeoutMs}ms`
      : `finished within ${command.timeoutMs}ms`,
  });

  assertions.push({
    ok: execution.exitCode === command.expect.exitCode,
    message: `expected exit ${command.expect.exitCode}, got ${formatExit(execution)}`,
  });

  for (const expected of command.expect.stdoutContains) {
    assertions.push({
      ok: execution.stdout.includes(expected),
      message: `stdout contains ${JSON.stringify(expected)}`,
    });
  }

  for (const expected of command.expect.stderrContains) {
    assertions.push({
      ok: execution.stderr.includes(expected),
      message: `stderr contains ${JSON.stringify(expected)}`,
    });
  }

  return assertions;
}

export function assertionsPassed(assertions: AssertionResult[]): boolean {
  return assertions.every((assertion) => assertion.ok);
}

function formatExit(execution: CommandExecution): string {
  if (execution.exitCode !== null) {
    return String(execution.exitCode);
  }

  return execution.signal ?? "unknown";
}

