# Support

## Getting Help

- **Bug reports** — [Open an issue](https://github.com/ruifm/fiscalpt/issues/new/choose)
  using the appropriate template.
- **Tax calculation mismatches** — Use the
  [Calculation Mismatch](https://github.com/ruifm/fiscalpt/issues/new?template=calculation_mismatch.yml)
  template. Include your AT liquidação document (anonymized) so we can verify.
- **Questions** — Start a
  [Discussion](https://github.com/ruifm/fiscalpt/discussions).
- **Security vulnerabilities** — Email
  [security@fiscalpt.com](mailto:security@fiscalpt.com). Do not open a public
  issue.

## Anonymizing Tax Documents

Before sharing tax documents publicly, anonymize personal data. We provide a
helper script:

```bash
scripts/anonymize-xml.sh your-file.xml
```

This replaces NIFs, names, and addresses with placeholder values. Always review
the output before sharing.

## Useful Links

- [FiscalPT](https://fiscalpt.com) — live platform
- [Contributing Guide](../CONTRIBUTING.md) — how to contribute
- [Security Policy](../SECURITY.md) — responsible disclosure
