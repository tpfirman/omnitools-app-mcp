#!/usr/bin/env bash

# Update git submodules for this repository.
# Usage:
#   bash scripts/update-submodules.sh            # init/sync/update to pinned commits
#   bash scripts/update-submodules.sh --remote   # move submodules to latest remote refs

set -euo pipefail

MODE="pinned"
if [[ "${1:-}" == "--remote" ]]; then
  MODE="remote"
fi

echo "=================================================="
echo "Git Submodule Update"
echo "=================================================="

echo "Syncing submodule URLs..."
git submodule sync --recursive

echo "Initializing and updating submodules..."
git submodule update --init --recursive

if [[ "$MODE" == "remote" ]]; then
  echo "Updating submodules to latest remote commits..."
  git submodule update --remote --recursive
fi

echo "Current submodule status:"
git submodule status --recursive

echo "Done."
