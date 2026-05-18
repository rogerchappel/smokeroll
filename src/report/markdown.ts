import type { SmokeCommandResult, SmokeRunResult } from "../types.js";

export function renderMarkdownTranscript(result: SmokeRunResult): string {
  const lines = [
    "# SmokeRoll Transcript",
    "",
    "- Manifest: \`" + result.manifestPath + "\`",
    "- Status: " + (result.passed ? "PASS" : "FAIL"),
    "- Started: " + result.startedAt,
    "- Finished: " + result.finishedAt,
    "- Duration: " + result.durationMs + "ms",
    "",
    "## Commands",
    "",
  ];

  for (const commandResult of result.results) {
    lines.push(...renderCommand(commandResult), "");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function renderCommand(result: SmokeCommandResult): string[] {
  const { command, execution } = result;
  const lines = [
    "### " + (result.passed ? "PASS" : "FAIL") + ": " + command.name,
    "",
    "- Command: \`" + [command.command, ...command.args].join(" ") + "\`",
    "- CWD: \`" + command.cwd + "\`",
    "- Exit: " + (execution.exitCode ?? execution.signal ?? "unknown"),
    "- Timed out: " + (execution.timedOut ? "yes" : "no"),
    "- Duration: " + execution.durationMs + "ms",
    "",
    "| Check | Result |",
    "| --- | --- |",
  ];

  for (const assertion of result.assertions) {
    lines.push("| " + escapeTable(assertion.message) + " | " + (assertion.ok ? "PASS" : "FAIL") + " |");
  }

  appendBlock(lines, "stdout", execution.stdout);
  appendBlock(lines, "stderr", execution.stderr);

  return lines;
}

function appendBlock(lines: string[], label: string, value: string): void {
  if (value.length === 0) {
    return;
  }

  lines.push("", "#### " + label, "", "\`\`\`text", value.trimEnd(), "\`\`\`");
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|");
}

