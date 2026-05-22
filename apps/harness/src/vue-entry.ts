import { createApp } from "vue";
import { vueFixtures } from "./fixtures/index.vue.ts";

export function mountVue(host: HTMLElement, component: string, fixture: string): void {
  const componentFixtures = vueFixtures[component];
  if (!componentFixtures) {
    throw new Error(`harness: no Vue fixtures for component "${component}"`);
  }
  const render = componentFixtures[fixture];
  if (!render) {
    throw new Error(`harness: no fixture "${fixture}" for Vue ${component}`);
  }
  createApp({ render: () => render() }).mount(host);
}
