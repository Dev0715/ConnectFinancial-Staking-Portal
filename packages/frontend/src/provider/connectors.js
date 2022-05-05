import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";

const INFURA_PROJECT_ID =
  process.env.REACT_APP_INFURA_PROJECT_ID || "c1a9ac9c4eaa432d99aa1dbf8ca7552c";

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 42161],
});

const walletconnect = new WalletConnectConnector({
  rpc: {
    1: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    42161: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
  },
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
  pollingInterval: 12000,
});

const walletlink = new WalletLinkConnector({
  url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
  appName: "Connect Financial",
});

export const connectors = {
  injected: injected,
  walletConnect: walletconnect,
  coinbaseWallet: walletlink,
};
