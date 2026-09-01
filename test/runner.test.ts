import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeCommand } from "../src/execute.js";
import { loadManifest } from "../src/manifest.js";
import { runPlan } from "../src/runner.js";

const DESCENDANT_EXIT_TIMEOUT_MS = 1_000;
const DESCENDANT_EXIT_POLL_MS = 20;
const MAX_BUFFER_BYTES = 1024 * 1024;

async function waitForProcessExit(pid: number, timeoutMs: number): Promise<number> {
  const started = performance.now();

  while (true) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ESRCH") {
        return performance.now() - started;
      }
      throw error;
    }

    const elapsedMs = performance.now() - started;
    if (elapsedMs >= timeoutMs) {
      assert.fail(
        `descendant PID ${pid} remained alive after ${Math.round(elapsedMs)}ms (limit ${timeoutMs}ms)`,
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(DESCENDANT_EXIT_POLL_MS, timeoutMs - elapsedMs)),
    );
  }
}

describe("runPlan", () => {
  it("bounds multibyte stdout and stderr without malformed characters", async () => {
    const execution = await executeCommand({
      name: "multibyte output",
      command: process.execPath,
      args: ["-e", "const s='😀'.repeat(300000);process.stdout.write(s);process.stderr.write(s)"],
      cwd: process.cwd(),
      env: {},
      expect: { exitCode: 0, stdoutContains: [], stderrContains: [] },
      timeoutMs: 10_000,
    });

    assert.ok(Buffer.byteLength(execution.stdout, "utf8") <= MAX_BUFFER_BYTES);
    assert.ok(Buffer.byteLength(execution.stderr, "utf8") <= MAX_BUFFER_BYTES);
    assert.doesNotMatch(execution.stdout, /\uFFFD/);
    assert.doesNotMatch(execution.stderr, /\uFFFD/);
    assert.match(execution.stdout, /^😀+$/u);
    assert.match(execution.stderr, /^😀+$/u);
  });

  it("preserves valid UTF-8 when multibyte sequences cross stream chunks", async () => {
    const script = [
      "const bytes=Buffer.from('😀')",
      "for (const stream of [process.stdout,process.stderr]) {",
      "stream.write('x'.repeat(1024*1024-1))",
      "stream.write(bytes.subarray(0,2))",
      "setImmediate(()=>stream.write(bytes.subarray(2)))",
      "}",
    ].join(";");
    const execution = await executeCommand({
      name: "boundary output",
      command: process.execPath,
      args: ["-e", script],
      cwd: process.cwd(),
      env: {},
      expect: { exitCode: 0, stdoutContains: [], stderrContains: [] },
      timeoutMs: 10_000,
    });

    for (const output of [execution.stdout, execution.stderr]) {
      assert.ok(Buffer.byteLength(output, "utf8") <= MAX_BUFFER_BYTES);
      assert.doesNotMatch(output, /\uFFFD/);
      assert.match(output, /😀$/u);
    }
  });

  it("records spawn failures and continues by default", async () => {
    const result = await runPlan(await loadManifest("fixtures/spawn-failure/smokeroll.json"));

    assert.equal(result.passed, false);
    assert.equal(result.results.length, 2);
    assert.equal(result.results[0]?.execution.exitCode, null);
    assert.equal(result.results[0]?.execution.error?.code, "ENOENT");
    assert.match(result.results[0]?.execution.error?.message ?? "", /ENOENT/);
    assert.equal(result.results[0]?.passed, false);
    assert.equal(result.results[1]?.passed, true);
  });

  it("stops after a spawn failure in fail-fast mode", async () => {
    const result = await runPlan(
      await loadManifest("fixtures/spawn-failure/smokeroll.json"),
      { failFast: true },
    );

    assert.equal(result.passed, false);
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.execution.error?.code, "ENOENT");
  });

  it("passes the pass fixture", async () => {
    const result = await runPlan(await loadManifest("fixtures/pass/smokeroll.json"));

    assert.equal(result.passed, true);
    assert.equal(result.results[0]?.passed, true);
    assert.match(result.results[0]?.execution.stdout ?? "", /hello SmokeRoll/);
  });

  it("fails when expected output is missing", async () => {
    const result = await runPlan(await loadManifest("fixtures/fail/smokeroll.json"));

    assert.equal(result.passed, false);
    assert.equal(result.results[0]?.passed, false);
    assert.equal(
      result.results[0]?.assertions.some((assertion) => assertion.ok === false),
      true,
    );
  });

  it("marks timed out commands as failed", async () => {
    const result = await runPlan(await loadManifest("fixtures/timeout/smokeroll.json"));

    assert.equal(result.passed, false);
    assert.equal(result.results[0]?.execution.timedOut, true);
  });

  it("bounds timeout completion and terminates descendants on POSIX", { skip: process.platform === "win32" }, async () => {
    const started = performance.now();
    const execution = await executeCommand({
      name: "process tree",
      command: process.execPath,
      args: ["fixtures/timeout/tree.js"],
      cwd: process.cwd(),
      env: {},
      expect: { exitCode: 0, stdoutContains: [], stderrContains: [] },
      timeoutMs: 100,
    });
    const elapsedMs = performance.now() - started;

    assert.equal(execution.timedOut, true);
    assert.equal(execution.exitCode, null);
    assert.equal(execution.signal, "SIGTERM");
    assert.ok(elapsedMs < 1_500, `timeout took ${Math.round(elapsedMs)}ms`);

    const descendantPid = Number(execution.stdout.match(/descendant:(\d+)/)?.[1]);
    assert.ok(Number.isInteger(descendantPid), `missing descendant PID in stdout: ${JSON.stringify(execution.stdout)}`);
    const cleanupMs = await waitForProcessExit(descendantPid, DESCENDANT_EXIT_TIMEOUT_MS);
    assert.ok(
      cleanupMs < DESCENDANT_EXIT_TIMEOUT_MS,
      `descendant PID ${descendantPid} cleanup took ${Math.round(cleanupMs)}ms`,
    );
  });
});
