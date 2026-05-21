# Security policy

## Reporting a vulnerability

**Do not file a public issue or pull request for security findings.**

Report the issue through GitHub's private security advisory flow:
https://github.com/teseor/teseor/security/advisories/new

Include:

- A description of the vulnerability and its impact.
- Steps to reproduce, or a minimal proof-of-concept.
- The version (or commit SHA) you tested against.
- Any suggested mitigation, if you have one.

You will receive an acknowledgement within 5 business days.

## Disclosure window

The maintainer will work with you to assess the report, develop a fix, and
coordinate disclosure. The default disclosure window is **90 days from the
acknowledgement date** — after a fix ships, or after 90 days have elapsed
(whichever comes first), the advisory becomes public.

For findings actively being exploited, the window can be shortened by mutual
agreement.

## Supported versions

Only the most recent minor release of `@teseor/*` packages receives security
fixes. Older releases are end-of-life on the day a new minor ships.
