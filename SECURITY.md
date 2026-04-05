# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in FiscalPT, please report it
responsibly. **Do not open a public GitHub issue.**

### Contact

- **Email:** [security@fiscalpt.com](mailto:security@fiscalpt.com)
- **Response time:** We aim to acknowledge reports within 48 hours and provide
  a fix or mitigation plan within 7 days.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Scope

Security issues in the following areas are in scope:

- Data leakage or unauthorized access to user tax data
- Paywall bypass that circumvents server-side access controls
- XSS, CSRF, or injection vulnerabilities
- Dependency vulnerabilities with a realistic exploit path
- Authentication or authorization flaws (when applicable)

### Out of scope

- Vulnerabilities in third-party services (Stripe, Cloudflare, etc.) — report
  those to the respective vendor
- Issues that require physical access to the user's device
- Social engineering attacks
- Denial of service (unless trivially exploitable)

## Supported Versions

Only the latest version deployed at [fiscalpt.com](https://fiscalpt.com) is
supported. We do not maintain older versions.
