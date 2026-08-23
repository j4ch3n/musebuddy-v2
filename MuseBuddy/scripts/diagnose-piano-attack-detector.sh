#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly CORE_SOURCE="${APP_DIR}/modules/piano-attack-detector/ios/AttackDetectorCore.swift"
readonly DIAGNOSTIC_SOURCE="${SCRIPT_DIR}/diagnose-piano-attack-detector.swift"
readonly TEST_SOURCE="${SCRIPT_DIR}/spectral-flux-detector-tests.swift"
readonly ASSETS_DIR="${SCRIPT_DIR}/experimental-assets"
readonly OUTPUT_DIR="${SCRIPT_DIR}/generated-spectral-flux-diagnostics"
readonly CACHE_DIR="${TMPDIR:-/tmp}/musebuddy-piano-attack-detector"
readonly BINARY="${CACHE_DIR}/diagnose-piano-attack-detector"

command -v swiftc >/dev/null || { echo "FAIL: Swift is not installed" >&2; exit 1; }
[[ -d "${ASSETS_DIR}" ]] || { echo "FAIL: Missing ${ASSETS_DIR}" >&2; exit 1; }
mkdir -p "${CACHE_DIR}"
export SWIFT_MODULE_CACHE_PATH="${CACHE_DIR}/module-cache"
export CLANG_MODULE_CACHE_PATH="${SWIFT_MODULE_CACHE_PATH}"
mkdir -p "${SWIFT_MODULE_CACHE_PATH}"
mkdir -p "${OUTPUT_DIR}"
swiftc -parse-as-library -module-cache-path "${SWIFT_MODULE_CACHE_PATH}" -framework Accelerate "${CORE_SOURCE}" "${TEST_SOURCE}" "${DIAGNOSTIC_SOURCE}" -o "${BINARY}"
"${BINARY}" "${ASSETS_DIR}" "${OUTPUT_DIR}"
