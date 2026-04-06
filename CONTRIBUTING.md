# Contributing to FiscalPT

Thank you for your interest in contributing to FiscalPT! This project is a Portuguese tax optimization platform, and we welcome contributions that improve accuracy, usability, and coverage of Portuguese tax rules.

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm
- [Just](https://github.com/casey/just) command runner

### Setup

```bash
git clone https://github.com/ruifm/fiscalpt.git
cd fiscalpt
npm install
npm run dev
```

The development server will start at `http://localhost:3000`.

## Code Quality

All changes must pass the quality gate before merging:

```bash
just check
```

This runs, in order:

1. **TypeScript** — `tsc --noEmit` (no type errors)
2. **ESLint** — zero warnings, zero errors
3. **Prettier** — consistent formatting (no semis, single quotes, trailing commas, 100-char width)
4. **Vitest** — all tests pass with coverage thresholds

## Development Workflow — TDD

We follow strict Test-Driven Development:

1. **Red** — Write a failing test that describes the expected behaviour.
2. **Green** — Write the minimum code to make the test pass.
3. **Refactor** — Clean up while keeping all tests green.

Every bug fix and feature must include a test that would catch a regression.

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring without behaviour change
- `test:` — adding or updating tests
- `chore:` — maintenance, dependencies, tooling
- `docs:` — documentation updates

### Commit Rules

- **Atomic commits**: each commit is a complete, self-contained, passing unit.
- Run `just check` before every commit. Never commit failing code.
- Write descriptive commit messages that explain _what_ and _why_.

## Pull Request Process

1. Fork the repository and create a feature branch from `main`.
2. Make your changes following the TDD workflow.
3. Ensure `just check` passes.
4. Open a PR with a clear description of the changes.
5. Link any related issues in the PR description.
6. Wait for review — a maintainer will review your changes.

## Code Style

- TypeScript everywhere — no plain JavaScript.
- Prefer pure functions with no side effects (especially in the tax engine).
- Meaningful names that reveal intent.
- No magic numbers — extract named constants.
- Unused parameters prefixed with `_`.

## Tax Engine Guidelines

- All calculations must be deterministic — no LLMs, no randomness.
- Bracket tables, deduction rules, and special regimes must match official CIRS law.
- Cross-validate against Portal das Finanças official sources.
- AT liquidação documents are ground truth — the engine must match AT output within rounding tolerance (€0.01–€0.19).

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold a welcoming, inclusive, and harassment-free environment.

## License

By contributing to FiscalPT, you agree that your contributions will be licensed under the [GNU Affero General Public License v3.0](LICENSE).
