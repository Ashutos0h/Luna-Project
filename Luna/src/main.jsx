import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

import "./index.css";
import "./styles/Polish.css";

// Log global unhandled errors for debugging and stability
window.addEventListener("error", (event) => {
  console.error("Global window error caught:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection caught:", event.reason);
});

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <HashRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HashRouter>
);

