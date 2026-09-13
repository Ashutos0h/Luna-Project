import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";
import "./styles/Polish.css";

import { HashRouter } from "react-router-dom";


ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <HashRouter>

    <App />

  </HashRouter>

);
