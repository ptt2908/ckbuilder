import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ccc } from "@ckb-ccc/connector-react";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ccc.Provider>
      <App />
    </ccc.Provider>
  </StrictMode>,
);