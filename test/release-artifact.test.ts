import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const validator = resolve('scripts/validate-release-artifact.mjs');
const project = JSON.parse(readFileSync('package.json', 'utf8'));

function pack(name: string, version: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'smokeroll-release-artifact-'));
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, version }));
  const result = spawnSync('npm', ['pack', '--silent'], { cwd: directory, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return join(directory, result.stdout.trim());
}

function validate(tag: string, tarball: string) {
  return spawnSync(process.execPath, [validator, '--tag', tag, '--tarball', tarball], {
    encoding: 'utf8',
  });
}

test('accepts an artifact whose identity matches package.json and the tag', () => {
  const result = validate(`v${project.version}`, pack(project.name, project.version));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`${project.name}@${project.version}`));
});

test('rejects a tag that does not match package.json', () => {
  const result = validate('v9.9.9', pack(project.name, project.version));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tag v9\.9\.9 does not match/);
});

test('rejects an artifact whose embedded identity does not match package.json', () => {
  const result = validate(`v${project.version}`, pack(project.name, '9.9.9'));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /packed version 9\.9\.9 does not match/);
});
