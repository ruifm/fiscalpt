# FiscalPT development recipes

set dotenv-load := false

# Run all quality checks (typecheck + lint + format + tests with coverage)
check:
    npm run check

# Run all checks and ratchet coverage thresholds upward if improved
check-update: check
    node scripts/update-coverage-thresholds.mjs

# Type-check TypeScript
typecheck:
    npx tsc --noEmit

# Lint with ESLint
lint:
    npx eslint .

# Fix auto-fixable lint issues
lint-fix:
    npx eslint --fix .

# Check formatting
format-check:
    npx prettier --check 'src/**/*.{ts,tsx}' 'tests/**/*.ts' '*.{ts,mjs,json}'

# Auto-format all files
format:
    npx prettier --write 'src/**/*.{ts,tsx}' 'tests/**/*.ts' '*.{ts,mjs,json}'

# Run tests
test:
    npx vitest run

# Run tests in watch mode
test-watch:
    npx vitest

# Run tests with coverage report
test-coverage:
    npx vitest run --coverage

# Run dev server
dev:
    npx next dev

# Build for production
build:
    npx next build

# Build with bundle analyzer (opens report in browser)
analyze:
    ANALYZE=true npm run build

# Run E2E tests with Playwright
e2e:
    npx playwright test

# Run E2E tests in headed mode (visible browser)
e2e-headed:
    npx playwright test --headed

# Show Playwright test report
e2e-report:
    npx playwright show-report

# Pre-deployment verification (build + checks + audit)
pre-deploy:
    ./scripts/pre-deploy.sh

# Post-deployment verification against live site
post-deploy url="https://fiscalpt.com":
    ./scripts/post-deploy.sh {{url}}

# Quick pre-commit check (same as `check`)
pre-commit: check

# Install git hooks
install-hooks:
    cp hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    @echo "Git hooks installed ✓"
