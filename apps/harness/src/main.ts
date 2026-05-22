import "@teseor/css/reset.css";
import "@teseor/css/tokens.css";
import "@teseor/css/base.css";

const root = document.getElementById("root");
if (!root) throw new Error("harness: #root not found");

const url = new URL(window.location.href);
const parts = url.pathname.split("/").filter(Boolean);
const framework = parts[0];
const component = parts[1];
const fixture = url.searchParams.get("fixture");

if (!framework || !component || !fixture) {
  root.textContent = `harness: expected /<framework>/<component>?fixture=<id>, got ${url.pathname}${url.search}`;
} else if (framework === "react") {
  const { mountReact } = await import("./react-entry.tsx");
  mountReact(root, component, fixture);
} else if (framework === "vue") {
  const { mountVue } = await import("./vue-entry.ts");
  mountVue(root, component, fixture);
} else {
  root.textContent = `harness: unknown framework "${framework}"`;
}
