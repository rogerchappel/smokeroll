#!/usr/bin/env node
import { renderDryRun } from "./dry-run.js";
import { SmokeRollError } from "./errors.js";
import { loadManifest } from "./manifest.js";
import { runPlan } from "./runner.js";
import { writeTranscripts } from "./transcripts.js";
import { VERSION } from "./version.js";

interface CliOptions {
  manifestPath?: string;
  dryRun: boolean;
  transcriptPath?: string;
  jsonPath?: string;
  failFast: boolean;
  help: boolean;
  version: boolean;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const parsed = parseArgs(argv);

    if (parsed.help) {
      process.stdout.write(helpText());
      return 0;
    }

    if (parsed.version) {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    }

    if (!parsed.manifestPath) {
      process.stderr.write("Missing manifest path.\n\n" + helpText());
      return 2;
    }

    const plan = await loadManifest(parsed.manifestPath);

    if (parsed.dryRun) {
      process.stdout.write(renderDryRun(plan));
      return 0;
    }

    const result = await runPlan(plan, { failFast: parsed.failFast });
    await writeTranscripts(result, {
      markdown: parsed.transcriptPath,
      json: parsed.jsonPath,
    });

    process.stdout.write(summary(result.passed, result.results.length));
    return result.passed ? 0 : 1;
  } catch (error) {
    const message = error instanceof SmokeRollError || error instanceof Error
      ? error.message
      : String(error);
    process.stderr.write(`SmokeRoll error: ${message}\n`);
    return 1;
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    failFast: false,
    help: false,
    version: false,
  };

  const args = [...argv];
  const command = args.shift();

  if (command === undefined || command === "--help" || command === "-h") {
    options.help = true;
    return options;
  }

  if (command === "--version" || command === "-v") {
    options.version = true;
    return options;
  }

  if (command !== "run") {
    throw new SmokeRollError(`Unknown command: ${command}`);
  }

  options.manifestPath = args.shift();

  while (args.length > 0) {
    const arg = args.shift();
    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--transcript":
        options.transcriptPath = takeValue(args, "--transcript");
        break;
      case "--json":
        options.jsonPath = takeValue(args, "--json");
        break;
      case "--fail-fast":
        options.failFast = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new SmokeRollError(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function takeValue(args: string[], flag: string): string {
  const value = args.shift();
  if (!value) {
    throw new SmokeRollError(`${flag} requires a value.`);
  }
  return value;
}

function summary(passed: boolean, count: number): string {
  return `SmokeRoll ${passed ? "PASS" : "FAIL"}: ${count} command${count === 1 ? "" : "s"} run.\n`;
}

function helpText(): string {
  return `SmokeRoll - local CLI smoke transcripts

Usage:
  smokeroll run <smokeroll.json> [--dry-run] [--transcript smoke.md] [--json smoke.json] [--fail-fast]

Options:
  --dry-run              Print the resolved plan without executing commands.
  --transcript <path>    Write a Markdown transcript.
  --json <path>          Write a JSON transcript.
  --fail-fast            Stop after the first failed command.
  -h, --help             Show help.
  -v, --version          Show version.
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
