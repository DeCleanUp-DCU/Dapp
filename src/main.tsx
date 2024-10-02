import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./styles/globals.css";
import {
  clientIdConst,
} from "./consts/parameters";
import { Arbitrum } from "@thirdweb-dev/chains";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const container = document.getElementById("root");

const root = createRoot(container!);
const urlParams = new URL(window.location.toString()).searchParams;

const chain = (urlParams.get("chain") && urlParams.get("chain")?.startsWith("{")) ? JSON.parse(String(urlParams.get("chain"))) : urlParams.get("chain") || Arbitrum;

const clientId = urlParams.get("clientId") || clientIdConst || "";


root.render(
  <React.StrictMode>
    <ThirdwebProvider activeChain={chain} clientId={clientId}>
      <App />
      <ToastContainer />
    </ThirdwebProvider>
  </React.StrictMode>,
);
