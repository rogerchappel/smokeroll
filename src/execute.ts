import { spawn } from "node:child_process";
import { ExecutionError } from "./errors.js";
import type { CommandExecution, ResolvedSmokeCommand } from "./types.js";

const MAX_BUFFER_BYTES = 1024 * 1024;

export async function executeCommand(command: ResolvedSmokeCommand): Promise<CommandExecution> {
  const started = performance.now();

  return await new Promise<CommandExecution>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(command.command, command.args, {
      cwd: command.cwd,
      env: { ...process.env, ...command.env },
      shell: false,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) {
          child.kill("SIGKILL");
        }
      }, 500).unref();
    }, command.timeoutMs);
    timer.unref();

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout = appendBounded(stdout, chunk);
    });

    child.stderr.on("data", (chunk: string) => {
      stderr = appendBounded(stderr, chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new ExecutionError(`${command.name}: ${error.message}`));
    });

    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      settled = true;
      resolve({
        exitCode,
        signal,
        timedOut,
        durationMs: Math.round(performance.now() - started),
        stdout,
        stderr,
      });
    });
  });
}

function appendBounded(current: string, chunk: string): string {
  const next = current + chunk;
  if (Buffer.byteLength(next, "utf8") <= MAX_BUFFER_BYTES) {
    return next;
  }

  return next.slice(Math.max(0, next.length - MAX_BUFFER_BYTES));
}

