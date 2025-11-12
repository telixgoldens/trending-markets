import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import { PrivyProvider } from "@privy-io/react-auth";

// Replace with your actual Privy App ID from dashboard
const PRIVY_APP_ID = "cmhrpzyxj0029l20dc5yscuoh";

const root = createRoot(document.getElementById("root"));
root.render(
  <PrivyProvider appId={PRIVY_APP_ID}>
    <App />
  </PrivyProvider>
);
