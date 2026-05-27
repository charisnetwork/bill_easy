#!/bin/bash
set -e

echo "Setting up git safe directory..."
git config --global --add safe.directory /home/pachu/Desktop/bill-easy

echo "Setting up git identity..."
git config user.name "charisnetwork"
git config user.email "charisnetwork@github.com"

echo "Adding files and committing..."
git add .
git commit -m "infrastructure: clean cloudflare dual-app monorepo setup" || echo "Already committed"

echo "Configuring remote..."
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://charisnetwork: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@github.com/charisnetwork/bill_easy.git

echo "Pushing to GitHub..."
git push origin main --force

echo "Success!"
