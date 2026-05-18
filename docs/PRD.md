# SmokeRoll PRD

Status: in-progress

## One-liner

SmokeRoll runs tiny CLI smoke-test scripts from a checked-in manifest and writes readable transcripts that prove the happy path still works.

## Problem

Many small OSS CLIs have unit tests but no durable proof that the installed command actually works against realistic fixtures. Agents also need a safe, declarative way to run a few commands without improvising shell scripts every time.

## Users

- CLI maintainers
- Agents verifying generated tools
- Reviewers checking release readiness

## V1 Scope

- Read smokeroll.json with named commands, cwd, env, expected exit code, stdout contains, stderr contains, and timeout.
- Execute commands locally with clear timeout handling.
- Write Markdown and JSON transcripts.
- Support --dry-run to print the plan.
- Include fixtures and tests for pass/fail cases.

## Non-goals

- General test runner replacement.
- Remote execution.
- Shell-specific magic beyond explicit commands.

## CLI Sketch

    smokeroll run smokeroll.json
    smokeroll run smokeroll.json --dry-run
    smokeroll run smokeroll.json --transcript docs/smoke.md

## Differentiation

SmokeRoll is smaller than a test framework and more structured than an ad hoc shell script. It creates receipts that humans and agents can trust.

## Source attribution

Inspired by Roger's OSS factory quality bar and common release-check patterns in local-first CLI projects.

