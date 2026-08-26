import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
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

  it("reports unknown options without throwing", async () => {
    const { exitCode, stderr } = await captureCli(() =>
      main(["run", "fixtures/pass/smokeroll.json", "--wat"]),
    );

    assert.equal(exitCode, 1);
    assert.match(stderr, /Unknown option/);
  });

  it("writes failed spawn receipts and exits nonzero", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "smokeroll-spawn-"));
    const markdownPath = path.join(outputDir, "result.md");
    const jsonPath = path.join(outputDir, "result.json");

    try {
      const { exitCode, stdout, stderr } = await captureCli(() =>
        main([
          "run",
          "fixtures/spawn-failure/smokeroll.json",
          "--fail-fast",
          "--transcript",
          markdownPath,
          "--json",
          jsonPath,
        ]),
      );

      assert.equal(exitCode, 1);
      assert.match(stdout, /SmokeRoll FAIL: 1 command run/);
      assert.equal(stderr, "");

      const markdown = await readFile(markdownPath, "utf8");
      assert.match(markdown, /FAIL: missing command/);
      assert.match(markdown, /Spawn error: `ENOENT`/);

      const json = JSON.parse(await readFile(jsonPath, "utf8"));
      assert.equal(json.passed, false);
      assert.equal(json.results.length, 1);
      assert.equal(json.results[0].execution.error.code, "ENOENT");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
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
