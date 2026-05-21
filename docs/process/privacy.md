# Privacy & telemetry

Teseor collects nothing. Three explicit positions:

## No component-view telemetry

We do not embed telemetry pixels, beacons, or call-home hooks in shipped components. A telemetry pixel inside `@teseor/css` or any wrapper would phone home from every consumer's site — a privacy disaster, a GDPR landmine, broken under CSP, and exactly the failure mode OSS consumers fear when adopting a dependency.

This is a permanent non-feature. Documented here so future maintainers don't reconsider it without first removing this paragraph.

## Docs site analytics

**None at v0.3** when docs go public.

**PostHog later**, post-v1.0, when there's a concrete reason (understanding which components are most used, A/B testing onboarding flows, etc.). When PostHog ships, we use its cookieless mode — no fingerprinting, no PII, no cross-site tracking. Privacy page (below) updated at that point.

No analytics ever runs from inside shipped Teseor packages. The analytics tag, if it exists, lives only on `teseor.dev` docs pages.

## No cookie banner

With no tracking until PostHog ships, and PostHog's cookieless mode not requiring consent, we don't ship a cookie banner. Empty banners are cargo-cult security theater. If we ever add tracking that triggers GDPR's consent requirement, the banner ships at the same time — never before.

## Privacy policy page

`teseor.dev/privacy` ships when docs go public at v0.3. ~50 lines, plain prose:

> Teseor does not track users.
>
> The Teseor packages (`@teseor/css`, `@teseor/react`, ...) contain no telemetry. They do not phone home; they do not collect data; they do not embed analytics.
>
> The docs site at teseor.dev currently runs no analytics. If analytics is added later (we may use PostHog in cookieless mode), this page will document what's collected before the change ships.
>
> GitHub may set cookies and collect data when you visit github.com/letanure/teseor or interact with our repository. That's their concern; see github.com's privacy policy.

The page is required for the GitHub "community standards" checklist in some EU jurisdictions and reassures privacy-cautious consumers.

## Contributor data

We collect nothing from contributors beyond what GitHub already has — username, email if public, contribution history. No mailing list, no contributor agreement requiring additional data, no analytics tying actions to identities.

`SECURITY.md` (lands in PR #1) repeats this in its scope section: vulnerability disclosure via GHSA collects only what GHSA itself collects (the reporter's GitHub identity); no separate email list, no PII storage on our end.

## Sources

- `SECURITY.md` at repo root (overlap on contributor data; lands in PR #1)
