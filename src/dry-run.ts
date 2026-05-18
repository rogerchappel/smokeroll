import type { SmokePlan } from "./types.js";

export function renderDryRun(plan: SmokePlan): string {
  const lines = [
    `SmokeRoll plan: ${plan.manifestPath}`,
    `Commands: ${plan.commands.length}`,
    "",
  ];

  for (const [index, command] of plan.commands.entries()) {
    lines.push(
      `${index + 1}. ${command.name}`,
      `   cwd: ${command.cwd}`,
      `   command: ${[command.command, ...command.args].map(shellQuote).join(" ")}`,
      `   timeout: ${command.timeoutMs}ms`,
      `   expect: exit ${command.expect.exitCode}`,
    );

    if (command.expect.stdoutContains.length > 0) {
      lines.push(
        `   stdout contains: ${command.expect.stdoutContains
          .map((value) => JSON.stringify(value))
          .join(", ")}`,
      );
    }

    if (command.expect.stderrContains.length > 0) {
      lines.push(
        `   stderr contains: ${command.expect.stderrContains
          .map((value) => JSON.stringify(value))
          .join(", ")}`,
      );
    }

    const envKeys = Object.keys(command.env);
    if (envKeys.length > 0) {
      lines.push(`   env: ${envKeys.sort().join(", ")}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}
