import { readFile } from "node:fs/promises";
import path from "node:path";
import { ManifestError } from "./errors.js";
import type {
  ResolvedSmokeCommand,
  SmokeCommand,
  SmokeExpectation,
  SmokeManifest,
  SmokePlan,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 15 * 60_000;

export async function loadManifest(manifestPath: string): Promise<SmokePlan> {
  const absolutePath = path.resolve(manifestPath);
  const manifestDir = path.dirname(absolutePath);
  const raw = await readFile(absolutePath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ManifestError(`Invalid JSON in ${manifestPath}: ${message}`);
  }

  const manifest = validateManifest(parsed);

  return {
    manifestPath: absolutePath,
    manifestDir,
    commands: manifest.commands.map((command, index) =>
      resolveCommand(command, manifestDir, index),
    ),
  };
}

export function validateManifest(value: unknown): SmokeManifest {
  if (!isRecord(value)) {
    throw new ManifestError("Manifest must be a JSON object.");
  }

  if (value.version !== 1) {
    throw new ManifestError("Manifest version must be 1.");
  }

  if (!Array.isArray(value.commands) || value.commands.length === 0) {
    throw new ManifestError("Manifest commands must be a non-empty array.");
  }

  return {
    version: 1,
    commands: value.commands.map(validateCommand),
  };
}

function validateCommand(value: unknown, index: number): SmokeCommand {
  const label = `commands[${index}]`;
  if (!isRecord(value)) {
    throw new ManifestError(`${label} must be an object.`);
  }

  if (!isNonEmptyString(value.name)) {
    throw new ManifestError(`${label}.name must be a non-empty string.`);
  }

  if (!isNonEmptyString(value.command)) {
    throw new ManifestError(`${label}.command must be a non-empty string.`);
  }

  if (value.args !== undefined && !isStringArray(value.args)) {
    throw new ManifestError(`${label}.args must be an array of strings.`);
  }

  if (value.cwd !== undefined && !isNonEmptyString(value.cwd)) {
    throw new ManifestError(`${label}.cwd must be a non-empty string.`);
  }

  if (value.env !== undefined && !isStringRecord(value.env)) {
    throw new ManifestError(`${label}.env must be an object of string values.`);
  }

  if (value.timeoutMs !== undefined && !isValidTimeout(value.timeoutMs)) {
    throw new ManifestError(
      `${label}.timeoutMs must be an integer from 1 to ${MAX_TIMEOUT_MS}.`,
    );
  }

  return {
    name: value.name,
    command: value.command,
    args: value.args ?? [],
    cwd: value.cwd,
    env: value.env ?? {},
    expect: validateExpectation(value.expect, label),
    timeoutMs: value.timeoutMs,
  };
}

function validateExpectation(value: unknown, label: string): SmokeExpectation {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    throw new ManifestError(`${label}.expect must be an object.`);
  }

  const exitCode = value.exitCode;
  if (exitCode !== undefined && !Number.isInteger(exitCode)) {
    throw new ManifestError(`${label}.expect.exitCode must be an integer.`);
  }

  if (value.stdoutContains !== undefined && !isStringArray(value.stdoutContains)) {
    throw new ManifestError(`${label}.expect.stdoutContains must be an array of strings.`);
  }

  if (value.stderrContains !== undefined && !isStringArray(value.stderrContains)) {
    throw new ManifestError(`${label}.expect.stderrContains must be an array of strings.`);
  }

  return {
    exitCode: typeof exitCode === "number" ? exitCode : undefined,
    stdoutContains: value.stdoutContains,
    stderrContains: value.stderrContains,
  };
}

function resolveCommand(
  command: SmokeCommand,
  manifestDir: string,
  index: number,
): ResolvedSmokeCommand {
  const cwd = path.resolve(manifestDir, command.cwd ?? ".");
  if (!isPathInside(cwd, manifestDir)) {
    throw new ManifestError(`commands[${index}].cwd must stay inside the manifest directory.`);
  }

  return {
    ...command,
    args: command.args ?? [],
    cwd,
    env: command.env ?? {},
    expect: {
      exitCode: command.expect?.exitCode ?? 0,
      stdoutContains: command.expect?.stdoutContains ?? [],
      stderrContains: command.expect?.stderrContains ?? [],
    },
    timeoutMs: command.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isValidTimeout(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= MAX_TIMEOUT_MS;
}

function isPathInside(candidate: string, parent: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
