import { spawn } from "node:child_process";
import type { CommandExecution, ResolvedSmokeCommand } from "./types.js";

const MAX_BUFFER_BYTES = 1024 * 1024;
const TERMINATION_GRACE_MS = 500;

export async function executeCommand(command: ResolvedSmokeCommand): Promise<CommandExecution> {
  const started = performance.now();

  return await new Promise<CommandExecution>((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(command.command, command.args, {
      cwd: command.cwd,
      env: { ...process.env, ...command.env },
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
    });

    const timer = setTimeout(() => {
      timedOut = true;
      signalProcessTree(child.pid, "SIGTERM", () => child.kill("SIGTERM"));
      setTimeout(() => {
        if (!settled) {
          signalProcessTree(child.pid, "SIGKILL", () => child.kill("SIGKILL"));
        }
      }, TERMINATION_GRACE_MS).unref();
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
      if (settled) {
        return;
      }
      clearTimeout(timer);
      settled = true;
      resolve({
        exitCode: null,
        signal: null,
        timedOut: false,
        durationMs: Math.round(performance.now() - started),
        stdout,
        stderr,
        error: {
          code: (error as NodeJS.ErrnoException).code ?? "SPAWN_ERROR",
          message: error.message,
        },
      });
    });

    child.on("close", (exitCode, signal) => {
      if (settled) {
        return;
      }
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

function signalProcessTree(
  pid: number | undefined,
  signal: NodeJS.Signals,
  fallback: () => boolean,
): void {
  if (process.platform === "win32" || pid === undefined) {
    fallback();
    return;
  }

  try {
    process.kill(-pid, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
      throw error;
    }
    fallback();
  }
}

function appendBounded(current: string, chunk: string): string {
  const next = current + chunk;
  if (Buffer.byteLength(next, "utf8") <= MAX_BUFFER_BYTES) {
    return next;
  }

  return next.slice(Math.max(0, next.length - MAX_BUFFER_BYTES));
}
