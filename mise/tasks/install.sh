#!/usr/bin/env bash
set -euo pipefail

# Update all submodules
echo "Updating submodules..."
git submodule update --init --recursive

echo "Submodules successfully updated!"
