import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
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

  it("shows run help without treating the flag as a manifest", async () => {
    const { exitCode, stdout, stderr } = await captureCli(() => main(["run", "--help"]));

    assert.equal(exitCode, 0);
    assert.match(stdout, /Usage:/);
    assert.equal(stderr, "");
  });

  it("rejects colliding transcript destinations before loading the manifest", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "smokeroll-collision-"));
    const outputPath = path.join(outputDir, "receipt.out");

    try {
      const { exitCode, stderr } = await captureCli(() =>
        main([
          "run",
          "missing-manifest.json",
          "--transcript",
          outputPath,
          "--json",
          path.join(outputDir, ".", "receipt.out"),
        ]),
      );

      assert.equal(exitCode, 1);
      assert.match(stderr, /destinations must be different paths/);
      await assert.rejects(access(outputPath));
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
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

  it("writes receipts for synchronous null-byte argv and env throws and exits nonzero", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "smokeroll-invalid-"));
    const markdownPath = path.join(outputDir, "result.md");
    const jsonPath = path.join(outputDir, "result.json");

    try {
      const { exitCode, stdout } = await captureCli(() =>
        main([
          "run",
          "fixtures/invalid-args/smokeroll.json",
          "--transcript",
          markdownPath,
          "--json",
          jsonPath,
        ]),
      );

      assert.equal(exitCode, 1);
      assert.match(stdout, /SmokeRoll FAIL: 2 commands run/);

      const markdown = await readFile(markdownPath, "utf8");
      assert.match(markdown, /FAIL: null byte in args/);
      assert.match(markdown, /Spawn error: `ERR_INVALID_ARG_VALUE`/);
      assert.match(markdown, /PASS: continues after invalid args/);

      const json = JSON.parse(await readFile(jsonPath, "utf8"));
      assert.equal(json.passed, false);
      assert.equal(json.results.length, 2);
      assert.equal(json.results[0].execution.exitCode, null);
      assert.equal(json.results[0].execution.error.code, "ERR_INVALID_ARG_VALUE");
      assert.equal(json.results[1].passed, true);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }

    const envOutputDir = await mkdtemp(path.join(tmpdir(), "smokeroll-invalid-env-"));
    const envMarkdownPath = path.join(envOutputDir, "result.md");
    const envJsonPath = path.join(envOutputDir, "result.json");

    try {
      const { exitCode } = await captureCli(() =>
        main([
          "run",
          "fixtures/invalid-env/smokeroll.json",
          "--fail-fast",
          "--transcript",
          envMarkdownPath,
          "--json",
          envJsonPath,
        ]),
      );

      assert.equal(exitCode, 1);

      const markdown = await readFile(envMarkdownPath, "utf8");
      assert.match(markdown, /FAIL: null byte in env/);
      assert.doesNotMatch(markdown, /continues after invalid env/);

      const json = JSON.parse(await readFile(envJsonPath, "utf8"));
      assert.equal(json.results.length, 1);
      assert.match(json.results[0].execution.error.message, /null bytes/);
    } finally {
      await rm(envOutputDir, { recursive: true, force: true });
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
