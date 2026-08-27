import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/classic/styles.css";
import App from "./App.jsx";
import "maplibre-gl/dist/maplibre-gl.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
