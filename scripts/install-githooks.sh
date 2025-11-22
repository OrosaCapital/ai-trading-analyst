#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Installing git hooks to .githooks and enabling via git config..."
git config core.hooksPath .githooks
echo "Done. To revert: git config --unset core.hooksPath" 
