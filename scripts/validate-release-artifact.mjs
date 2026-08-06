#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function fail(message) {
  console.error(`Release artifact validation failed: ${message}`);
  process.exit(1);
}

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) fail(`missing ${name}`);
  return process.argv[index + 1];
}

const tag = argument('--tag');
const tarball = resolve(argument('--tarball'));
const source = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const extracted = spawnSync('tar', ['-xOf', tarball, 'package/package.json'], {
  encoding: 'utf8',
});

if (extracted.status !== 0) {
  fail(`cannot read package/package.json from ${basename(tarball)}`);
}

let packed;
try {
  packed = JSON.parse(extracted.stdout);
} catch {
  fail(`package/package.json in ${basename(tarball)} is not valid JSON`);
}

const expectedTag = `v${source.version}`;
if (tag !== expectedTag) fail(`tag ${tag} does not match package.json version ${expectedTag}`);
if (packed.name !== source.name) fail(`packed name ${packed.name} does not match ${source.name}`);
if (packed.version !== source.version) {
  fail(`packed version ${packed.version} does not match ${source.version}`);
}

console.log(`Validated release artifact: ${packed.name}@${packed.version} (${basename(tarball)})`);
