import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@teseor/css/reset.css";
import "@teseor/css/tokens.css";
import "@teseor/css/base.css";
import "@teseor/css/utilities.css";
import "./preview.css";
import { App } from "./App.tsx";

const root = document.getElementById("root");
if (!root) {
  throw new Error("preview: #root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
