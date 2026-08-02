#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
smoke_root="$(mktemp -d "${TMPDIR:-/tmp}/smokeroll-package-smoke.XXXXXX")"
trap 'rm -rf "$smoke_root"' EXIT

package_dir="$smoke_root/package"
consumer_dir="$smoke_root/consumer"
mkdir -p "$package_dir" "$consumer_dir"

package_name="$(node -p "require('$repo_root/package.json').name")"
package_version="$(node -p "require('$repo_root/package.json').version")"

tarball_name="$(npm pack --silent --pack-destination "$package_dir" "$repo_root")"
tarball_path="$package_dir/$tarball_name"

cd "$consumer_dir"
npm init --yes --silent >/dev/null
npm install --ignore-scripts --silent "$tarball_path"

package_root="$consumer_dir/node_modules/$package_name"
manifest="$package_root/examples/pass/smokeroll.json"
transcript="$consumer_dir/smoke.md"
json_transcript="$consumer_dir/smoke.json"

test -f "$package_root/dist/src/index.js"
test -f "$manifest"
node --input-type=module -e "import('$package_name').then((module) => { if (!module.runPlan) process.exit(1) })"
test "$(./node_modules/.bin/smokeroll --version)" = "$package_version"
./node_modules/.bin/smokeroll --help | grep -F "Usage:" >/dev/null
./node_modules/.bin/smokeroll run "$manifest" \
  --transcript "$transcript" \
  --json "$json_transcript" | grep -F "SmokeRoll PASS" >/dev/null
grep -F "# SmokeRoll Transcript" "$transcript" >/dev/null
node -e "const report = require(process.argv[1]); if (!report.passed) process.exit(1)" "$json_transcript"

printf 'Package smoke passed: %s@%s\n' "$package_name" "$package_version"
