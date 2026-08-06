import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeCommand } from "../src/execute.js";
import { loadManifest } from "../src/manifest.js";
import { runPlan } from "../src/runner.js";

describe("runPlan", () => {
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
    assert.ok(Number.isInteger(descendantPid));
    assert.throws(() => process.kill(descendantPid, 0), { code: "ESRCH" });
  });
});
