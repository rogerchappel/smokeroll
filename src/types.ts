export type TranscriptFormat = "json" | "markdown";

export interface SmokeManifest {
  version: 1;
  commands: SmokeCommand[];
}

export interface SmokeCommand {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  expect?: SmokeExpectation;
  timeoutMs?: number;
}

export interface SmokeExpectation {
  exitCode?: number;
  stdoutContains?: string[];
  stderrContains?: string[];
}

export interface ResolvedSmokeCommand extends SmokeCommand {
  cwd: string;
  args: string[];
  env: Record<string, string>;
  expect: Required<SmokeExpectation>;
  timeoutMs: number;
}

export interface SmokePlan {
  manifestPath: string;
  manifestDir: string;
  commands: ResolvedSmokeCommand[];
}

export interface CommandExecution {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface AssertionResult {
  ok: boolean;
  message: string;
}

export interface SmokeCommandResult {
  command: ResolvedSmokeCommand;
  execution: CommandExecution;
  assertions: AssertionResult[];
  passed: boolean;
}

export interface SmokeRunResult {
  manifestPath: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  passed: boolean;
  results: SmokeCommandResult[];
}

export interface RunOptions {
  dryRun?: boolean;
  transcriptPath?: string;
  jsonPath?: string;
  failFast?: boolean;
}

