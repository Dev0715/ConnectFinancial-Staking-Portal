import { StrictMode } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

import { Web3ReactProvider, createWeb3ReactRoot } from "web3-react-core";
import { Web3Provider } from "@ethersproject/providers";

const Web3ProviderNetwork = createWeb3ReactRoot("NETWORK");

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

ReactDOM.render(
  <StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <App />
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </StrictMode>,
  document.getElementById("root")
);
