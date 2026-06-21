---
---

Add a dev-only grid overlay to the docs app for verifying vertical rhythm by eye. Toggle button in the sidenav + `?grid=on` URL persistence; renders a `--t-unit`-stepped horizontal gradient over the page. Gated on `import.meta.env.DEV` so the production build is unaffected.
