import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// React integration renders @teseor/react components to static HTML at build
// time — zero client JS unless a client:* directive opts in.
export default defineConfig({
  site: "https://teseor.dev",
  integrations: [react()],
});
