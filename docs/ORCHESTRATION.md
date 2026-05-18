# SmokeRoll Orchestration

SmokeRoll is intentionally local-first. It reads one manifest, executes each
command in order, evaluates simple expectations, and writes transcripts that can
be attached to release notes, PRs, or agent review packs.

## Inputs

- Manifest: `smokeroll.json`
- Command fields: `name`, `command`, `args`, `cwd`, `env`,
  `expect`, `timeoutMs`
- Expectations: `exitCode`, `stdoutContains`, `stderrContains`

## Execution Rules

- Commands run sequentially.
- Commands run without a shell; `command` and `args` are explicit argv.
- `cwd` resolves relative to the manifest directory.
- `cwd` must remain inside the manifest directory.
- Environment values are merged over the current process environment.
- Timeouts terminate the child process and fail the command.

## Outputs

- Console summary: pass/fail and command count.
- Markdown transcript via `--transcript <path>`.
- JSON transcript via `--json <path>`.
- Dry-run plan via `--dry-run`.

## Verification Loop

1. Run `npm install`.
2. Run `npm run check`.
3. Run `npm test`.
4. Run `npm run smoke`.
5. Run `bash scripts/validate.sh`.

## Safety Notes

The MVP avoids shell parsing and refuses `cwd` values that escape the manifest
directory. Manifests are still code-adjacent automation: reviewers should inspect
commands before running manifests from untrusted repositories.

