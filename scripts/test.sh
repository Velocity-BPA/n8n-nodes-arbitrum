#!/bin/bash
set -e

echo "[TEST] Running n8n-nodes-arbitrum tests..."

# Run linting
echo "[LINT] Running ESLint..."
npm run lint

# Run unit tests
echo "[UNIT] Running unit tests..."
npm test

# Run build to verify compilation
echo "[BUILD] Verifying build..."
npm run build

echo "[DONE] All tests passed!"
