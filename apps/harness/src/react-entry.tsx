import { createRoot } from "react-dom/client";
import { reactFixtures } from "./fixtures/index.react.ts";

export function mountReact(host: HTMLElement, component: string, fixture: string): void {
  const componentFixtures = reactFixtures[component];
  if (!componentFixtures) {
    throw new Error(`harness: no React fixtures for component "${component}"`);
  }
  const render = componentFixtures[fixture];
  if (!render) {
    throw new Error(`harness: no fixture "${fixture}" for React ${component}`);
  }
  createRoot(host).render(render());
}
