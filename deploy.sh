#!/bin/bash

# Deploy script for ACBF React Site
# This script builds the React app and pushes it to the deploy branch

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# 1. Build the React app
echo "📦 Building React app..."
npm run build:prod

# 2. Copy API directory to dist
echo "📧 Copying PHP email API..."
cp -r api dist/api

# 3. Navigate to dist worktree
cd dist

# 4. Stage all changes
echo "📝 Staging changes..."
git add .

# 5. Check if there are changes to commit
if git diff-index --quiet HEAD --; then
  echo "✅ No changes to deploy"
else
  # 6. Create commit with timestamp
  TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
  echo "💾 Creating commit..."
  git commit -m "Deploy: $TIMESTAMP"

  # 7. Push to GitHub
  echo "🌐 Pushing to GitHub..."
  git push origin deploy

  echo "✅ Deployment successful!"
fi

# 8. Return to project root
cd ..

echo "✨ Done! Your site is ready for cPanel deployment."
echo "📌 Next step: In cPanel, pull from the 'deploy' branch to update your site."
