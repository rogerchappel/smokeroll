import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { main } from "../src/cli.js";

describe("cli", () => {
  it("returns success for dry-run", async () => {
    const { exitCode, stdout } = await captureCli(() =>
      main(["run", "fixtures/pass/smokeroll.json", "--dry-run"]),
    );

    assert.equal(exitCode, 0);
    assert.match(stdout, /SmokeRoll plan/);
  });

  it("returns failure for failing fixtures", async () => {
    const { exitCode, stdout } = await captureCli(() =>
      main(["run", "fixtures/fail/smokeroll.json"]),
    );

    assert.equal(exitCode, 1);
    assert.match(stdout, /SmokeRoll FAIL/);
  });
});

async function captureCli(run: () => Promise<number>): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  let stdout = "";
  let stderr = "";
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += chunk.toString();
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += chunk.toString();
    return true;
  }) as typeof process.stderr.write;

  try {
    return { exitCode: await run(), stdout, stderr };
  } finally {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
}
