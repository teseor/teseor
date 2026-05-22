declare module "postcss-each" {
  import type { Plugin } from "postcss";

  const postcssEach: () => Plugin;
  export = postcssEach;
}
