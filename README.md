# FiscalPT

**Plataforma de otimização fiscal para contribuintes portugueses.**

[fiscalpt.com](https://fiscalpt.com) · [Guias](https://fiscalpt.com/guia/como-funciona-irs) · [Blog](https://fiscalpt.com/blog)

---

## What is FiscalPT?

FiscalPT analyzes Portuguese household tax data and computes the optimal filing
strategy — joint vs separate, IRS Jovem, NHR, deduction optimization — with
concrete savings recommendations in euros.

Upload your AT tax documents (XML Modelo 3 or comprovativo PDF), answer a few
follow-up questions, and get an instant, detailed analysis comparing every
filing scenario.

### Key Features

- **Deterministic tax engine** — pure TypeScript, no LLMs in the calculation
  pipeline. Every result is reproducible and verifiable.
- **Joint vs separate filing** — side-by-side comparison with quociente conjugal.
- **IRS Jovem** — Art. 12-F CIRS, both pre-2025 and 2025+ rules.
- **NHR regime** — Art. 72, 20% flat rate on qualifying income.
- **Cat A/B/E/F/G/H** — category-specific rules, simplified regime coefficients,
  englobamento simulation.
- **Social Security** — Cat A employee and Cat B independent worker computation.
- **Deductions** — dependents, health, education, housing, PPR, and more.
- **AT document parsing** — XML Modelo 3 (primary) and comprovativo PDF
  (fallback), with automatic data extraction.
- **1060+ automated tests** — property-based fuzz testing, AT liquidação
  cross-validation, comprehensive edge case coverage.

### Tax Years Supported

- **2024** (Lei 33/2024)
- **2025** (OE 2025)

## Tech Stack

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js · React 19 · TypeScript                     |
| Styling     | Tailwind CSS · base-ui components                   |
| Tax Engine  | Pure TypeScript — deterministic, ~96% code coverage |
| Testing     | Vitest · Playwright · fast-check (property-based)   |
| Task Runner | [Just](https://github.com/casey/just)               |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
on code quality, TDD workflow, and commit conventions.

The tax engine is the core of the project — if you spot a calculation that
doesn't match the official AT output, please
[open an issue](https://github.com/ruifm/fiscalpt/issues/new?template=calculation_mismatch.yml).

### Development Setup

```bash
git clone https://github.com/ruifm/fiscalpt.git
cd fiscalpt
npm install
just check    # types → lint → format → tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full development workflow details.

## Community

- [Issues](https://github.com/ruifm/fiscalpt/issues) — bug reports and feature
  requests
- [Discussions](https://github.com/ruifm/fiscalpt/discussions) — questions and
  general discussion
- [Security Policy](SECURITY.md) — responsible disclosure
- [Careers](https://fiscalpt.com/carreiras) — open-source contribution
  opportunities

## License

[GNU Affero General Public License v3.0](LICENSE) — free to use, modify, and
distribute. If you run a modified version as a service, you must share your
source code.
