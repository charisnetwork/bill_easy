#!/bin/bash
set -e

echo "Starting monorepo restructuring..."

# 1. Trash Deletion
echo "Deleting trash..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec rm -rf '{}' +
find . -name ".wrangler" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "package-lock.json" -type f -delete
find . -name "yarn.lock" -type f -delete
find . -name "pnpm-lock.yaml" -type f -delete
rm -rf .git

# 2. Structure Reorganization
echo "Reorganizing structure..."
mkdir -p packages/core-app packages/admin-app

# Move frontend and backend if they exist in the root
if [ -d "frontend" ]; then
    mv frontend packages/core-app/frontend
fi

if [ -d "backend" ]; then
    mv backend packages/core-app/backend
fi

# Move admin frontend and backend if they exist
if [ -d "admin/frontend" ]; then
    mv admin/frontend packages/admin-app/frontend
fi

if [ -d "admin/backend" ]; then
    mv admin/backend packages/admin-app/backend
fi

# Clean up empty admin folder
if [ -d "admin" ]; then
    rmdir admin 2>/dev/null || true
fi

# 3. Git Initialization and Repo Binding
echo "Initializing Git..."
git init -b main
git config user.name "charisnetwork"
git config user.email "charisnetwork@github.com"
git add .
git commit -m "infrastructure: clean cloudflare dual-app monorepo setup"

# Configure remote and push
# Using the provided credentials
git remote add origin https://charisnetwork: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@github.com/charisnetwork/bill_easy.git
git push origin main --force

echo "Done!"
