#!/bin/bash
set -e

echo "[INSTALL] Installing n8n-nodes-arbitrum locally..."

# Build the project
./scripts/build.sh

# Create n8n custom directory if it doesn't exist
mkdir -p ~/.n8n/custom

# Remove existing symlink if present
rm -f ~/.n8n/custom/n8n-nodes-arbitrum

# Create symlink
ln -s "$(pwd)" ~/.n8n/custom/n8n-nodes-arbitrum

echo "[DONE] Installation complete!"
echo "[INFO] Please restart n8n to load the new node."
