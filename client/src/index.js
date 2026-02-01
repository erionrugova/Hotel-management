import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { applyPolyfills, checkBrowserCompatibility } from "./utils/browserCompatibility";

// Apply polyfills for older browsers
applyPolyfills();

// Check browser compatibility
const compatibility = checkBrowserCompatibility();
if (!compatibility.compatible) {
  console.warn("Browser compatibility issues detected:", compatibility.missingFeatures);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
