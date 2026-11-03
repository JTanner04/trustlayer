#!/usr/bin/env bash
# Generates a local LLVM coverage report on macOS with Xcode command-line tools.
set -euo pipefail

if ! command -v xcrun >/dev/null; then
  echo "Coverage requires Xcode command-line tools (xcrun)." >&2
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
export RUSTFLAGS='-Cinstrument-coverage'
export LLVM_PROFILE_FILE="$WORK_DIR/%m_%p.profraw"

cargo test

TEST_BINARY="$(find target/debug/deps -maxdepth 1 -type f -name 'axum_api-*' -perm -111 -exec ls -t {} + | head -1)"
[ -n "$TEST_BINARY" ] || { echo "Could not find the compiled test binary." >&2; exit 1; }

xcrun llvm-profdata merge -sparse "$WORK_DIR"/*.profraw -o "$WORK_DIR/coverage.profdata"
xcrun llvm-cov report "$TEST_BINARY" -instr-profile="$WORK_DIR/coverage.profdata" src/main.rs
