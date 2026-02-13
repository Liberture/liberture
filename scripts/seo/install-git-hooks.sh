#!/bin/bash
# Install Git hooks for automatic SEO checks

echo "🔧 Installing Git hooks for SEO automation..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook: Run SEO checks before allowing commit

echo "🔍 Running SEO health check..."

# Run SEO health check
npx tsx scripts/seo/seo-health-check.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ SEO health check failed!"
  echo "Fix the issues above before committing."
  echo ""
  echo "To bypass this check (not recommended):"
  echo "  git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ SEO health check passed!"
exit 0
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

# Create post-commit hook to update sitemap
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Post-commit hook: Remind about sitemap update

CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Check if content files changed
if echo "$CHANGED_FILES" | grep -q "prisma\|knowledge\|people\|books"; then
  echo ""
  echo "📝 Content files changed!"
  echo "💡 Remember to rebuild for sitemap update:"
  echo "   npm run build && pm2 restart liberture"
  echo ""
fi
EOF

chmod +x .git/hooks/post-commit

echo "✅ Git hooks installed!"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Runs SEO health check before commit"
echo "  - post-commit: Reminds to rebuild if content changed"
echo ""
echo "To bypass pre-commit hook (not recommended):"
echo "  git commit --no-verify"
