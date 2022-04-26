/**
 * @param params parameters for initializing wallets
 * @param params.networkId blockchain network id
 * @param params.APP_NAME app name
 * @param params.INFURA_PROJECT_ID infura project id
 * @param params.ALCHEMY_PROJECT_ID alchemy project id
 * @param params.defaultTo service to default to
 * @param params.APP_EMAIL app email id
 * @param params.APP_URL app url
 * @dev wallets config for bnc-board (web3-onboard older version)
 */
export const Wallets = (params) => {
  const CHAIN = (() => {
    switch (params.networkId) {
      case 3:
        return "ropsten";
      case 4:
        return "rinkeby";
      case 42:
        return "kovan";
      case 5:
        return "goerli";
      case 42161:
        return "arbitrum";
      default:
        return "mainnet";
    }
  })();
  const APP_NAME = params.APP_NAME;
  const INFURA_KEY = params.INFURA_PROJECT_ID;
  const ALCHEMY_KEY = params.ALCHEMY_PROJECT_ID;
  const INFURA_URL = `https://${CHAIN}.infura.io/v3/${INFURA_KEY}`;
  const ALCHEMY_URL = `https://eth-${CHAIN}.alchemyapi.io/v2/${ALCHEMY_KEY}`;
  const rpcUrl = params.useDefault === "alchemy" ? ALCHEMY_URL : INFURA_URL;
  return [
    { walletName: "detectedwallet" },
    { walletName: "coinbase", preferred: true },
    { walletName: "trust", preferred: true, rpcUrl },
    { walletName: "metamask", preferred: true },
    { walletName: "authereum" },
    {
      walletName: "trezor",
      rpcUrl,
      appUrl: params.APP_URL,
      email: params.APP_EMAIL,
    },
    {
      walletName: "ledger",
      rpcUrl,
    },
    {
      walletName: "keepkey",
      rpcUrl,
    },
    {
      walletName: "cobovault",
      rpcUrl,
      appName: APP_NAME,
    },
    {
      walletName: "walletConnect",
      infuraKey: INFURA_KEY,
    },
    { walletName: "opera" },
    { walletName: "operaTouch" },
    { walletName: "torus" },
    { walletName: "status" },
    { walletName: "walletLink", rpcUrl, appName: APP_NAME },
    { walletName: "imToken", rpcUrl },
    { walletName: "meetone" },
    { walletName: "mykey", rpcUrl },
    { walletName: "huobiwallet", rpcUrl },
    { walletName: "hyperpay" },
    { walletName: "wallet.io", rpcUrl },
    { walletName: "atoken" },
    { walletName: "frame" },
    { walletName: "ownbit" },
    { walletName: "alphawallet" },
    { walletName: "xdefi" },
    { walletName: "bitpie" },
    { walletName: "gnosis" },
  ];
};
