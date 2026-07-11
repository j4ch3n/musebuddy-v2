#!/usr/bin/env bash
set -euo pipefail

mkdir -p .swift-module-cache .swift-diagnostics

export SWIFT_MODULE_CACHE_PATH=".swift-module-cache"
export CLANG_MODULE_CACHE_PATH=".swift-module-cache"

swiftc ./scripts/diagnose-play-combined-soundfonts.swift -o .swift-diagnostics/diagnose-play-combined-soundfonts
.swift-diagnostics/diagnose-play-combined-soundfonts "$@"
