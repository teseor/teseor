# Security Policy

## Supported Versions

| Package | Version | Supported |
|---------|---------|-----------|
| `@teseor/css` | latest | Yes |
| `@teseor/css` | < latest | No |

Only the latest published version receives security fixes.

## Reporting a Vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

1. Go to [Security Advisories](https://github.com/teseor/teseor/security/advisories/new)
2. Click **"Report a vulnerability"**
3. Include: description, reproduction steps, affected versions, and potential impact

**Response timeline:**
- Acknowledgment: 48 hours
- Assessment and fix plan: 7 days
- Patch release for critical issues: 14 days

## Threat Model

`@teseor/css` is a **CSS-only** package — it ships compiled CSS with no JavaScript runtime. This significantly limits the attack surface:

| Threat | Risk | Mitigation |
|--------|------|------------|
| Supply chain (compromised npm publish) | Medium | Changesets-gated releases, GitHub Actions CI, dual publish to npm + GitHub Packages |
| Malicious build dependency | Medium | Dependabot alerts enabled, lockfile pinning |
| Leaked secrets in commits | Low | GitHub secret scanning + push protection enabled |
| CSS injection via custom properties | Low | Consumers should sanitize user input before setting `--ui-*` vars |
| XSS / code execution | N/A | No JavaScript shipped |

## What We Protect

- **GitHub secret scanning**: enabled — detects leaked tokens, keys, and credentials
- **Push protection**: enabled — blocks pushes containing secrets
- **Dependabot security updates**: enabled — auto-PRs for vulnerable dependencies
- **CI gates**: lint, typecheck, tests, and visual regression must pass before merge

## Consumer Recommendations

- Use a lockfile (`pnpm-lock.yaml`, `package-lock.json`) to pin transitive dependencies
- Run `pnpm audit` / `npm audit` regularly
- If you pass user-controlled values to CSS custom properties (`--ui-*`), sanitize them to prevent CSS injection
