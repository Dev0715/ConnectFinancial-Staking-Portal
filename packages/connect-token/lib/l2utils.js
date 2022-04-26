"use strict";
const ethers = require("ethers");
const hre = require("hardhat");
const { Bridge, ArbRetryableTx__factory } = require("arb-ts");
const { correspondingL2, correspondingL1, Routers } = require("./chainutil");

const ARB_RETRYABLE_TX = "0x000000000000000000000000000000000000006E";

const correspondingChain = (() => {
  switch (hre.network.config.chainId) {
    case 42161:
      return "live";
    case 421611:
      return "rinkeby";
    case 1:
      return "arbitrum";
    default:
      return "test";
  }
})();

const provider = new ethers.providers.JsonRpcProvider(
  hre.config.networks[correspondingChain].url
);

const makeArbRetryableTx = (signer) =>
  ArbRetryableTx__factory.connect(ARB_RETRYABLE_TX, signer);

const makeArbBridge = async () => {
  const [signer] = await hre.ethers.getSigners();
  const mainNetwork = hre.network.config.chainId;
  let opts;
  const isL1 = !!correspondingL2[mainNetwork];
  const pvtKey = hre.network.config.accounts[0];
  const correspondingNetwork = isL1
    ? correspondingL2[mainNetwork]
    : correspondingL1[mainNetwork];
  const correspondingProvider = provider;
  const correspondingSigner = new ethers.Wallet(
    typeof pvtKey === "string" ? pvtKey : pvtKey.privateKey,
    provider
  );

  const signers = [signer, correspondingSigner];
  const routers = [
    Routers.address(mainNetwork),
    Routers.address(correspondingNetwork),
  ];

  const bridge = await Bridge.init(
    ...(isL1
      ? [...signers, ...routers]
      : [...signers.reverse(), ...routers.reverse()])
  );
  return {
    bridge,
    correspondingNetwork,
    correspondingProvider,
    correspondingSigner,
  };
};

module.exports = {
  provider,
  makeArbRetryableTx,
  makeArbBridge,
};
