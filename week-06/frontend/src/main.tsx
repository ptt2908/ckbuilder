import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ccc } from "@ckb-ccc/connector-react";
import App from "./App";
import { CKB_RPC_URL } from "./config/network";
import "./index.css";

const defaultClient = CKB_RPC_URL
  ? new ccc.ClientPublicTestnet({ url: CKB_RPC_URL })
  : undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ccc.Provider defaultClient={defaultClient}>
      <App />
    </ccc.Provider>
  </StrictMode>,
);