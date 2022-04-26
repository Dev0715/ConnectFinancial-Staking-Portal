import React from "react";
import { ethers } from "ethers";
import { WrappedSigner } from "./util";
import store from "store";

export const useProvider = ({
  // wallets,
  onboard,
  networkId,
  effects,
  env,
  makeProvider,
  assets,
}) => {
  const [signer, setSigner] = React.useState(null);

  const _makeProvider = (network) => {
    return new ethers.providers.FallbackProvider([
      {
        provider: new ethers.providers.InfuraProvider(
          network,
          env.INFURA_PROJECT_ID
        ),
        priority: 2,
        stallTimeout: 500,
        weight: 1,
      },
      {
        provider: new ethers.providers.AlchemyProvider(
          network,
          env.ALCHEMY_PROJECT_ID
          // "7C-CsMNWAG4wpWjHHbNR_Q-IAmxSMBJ2"
        ),
        priority: 1,
        stallTimeout: 500,
        weight: 2,
      },
    ]);
  };

  function init(bypass) {
    if (networkId !== 31337) {
      const walletName = store.get("onboardWallet");
      if (walletName) {
        onboard
          .connectWallet({ autoSelect: { label: walletName } })
          .then((walletStates) => {
            if (walletStates.length) {
              effects.onAddressChange(walletStates[0].accounts[0].address);
            }
          });
      } else {
        onboard.connectWallet().then((walletStates) => {
          if (walletStates.length) {
            effects.onAddressChange(walletStates[0].accounts[0].address);
            store.set("onboardWallet", walletStates[0].label);
          }
        });
      }
    }
  }

  const onboardState = onboard.state.select("wallets");
  onboardState.subscribe((wallets) => {
    if (wallets.length === 0) {
      store.remove("onboardWallet");
      effects.onAddressChange();
    }
  });

  const provider = React.useMemo(() => {
    const _p = (() => {
      switch (networkId) {
        case 1:
        case 3:
        case 4:
        case 42161:
        case 421611:
          return makeProvider
            ? makeProvider(networkId)
            : _makeProvider(networkId);
        default:
          return new ethers.providers.JsonRpcProvider("http://localhost:8545");
      }
    })();
    global.provider = _p;
    return _p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId]);

  const getSigner = React.useCallback(
    (i = 0) => {
      try {
        const _signer = (() => {
          switch (networkId) {
            case 1:
            case 3:
            case 4:
            case 42161:
            case 421611:
              // const provider = new ethers.providers.Web3Provider(_provider);
              // const signer = provider.getSigner();
              // const provider = new ethers.providers.AlchemyProvider(
              //   networkId,
              //   env.ALCHEMY_PROJECT_ID
              // );
              // const signer = provider.getSigner();
              const wallets = onboard.state.get().wallets;
              if (wallets.length) {
                const provider = new ethers.providers.Web3Provider(
                  wallets[0].provider
                );
                const signer = provider.getSigner();
                console.log("signer from web3-onboard", signer);
              }
              return signer;
            default:
              return new WrappedSigner(provider.getSigner(i), assets);
          }
        })();
        window.signer = _signer;
        setSigner(_signer);
        return _signer;
      } catch (e) {
        console.log("error getting signer from provier");
        console.warn("no signer");
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkId]
  );
  React.useEffect(() => {
    getSigner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId]);

  const signerOrProvider = React.useMemo(() => (signer ? signer : provider), [
    signer,
    provider,
  ]);

  return {
    signer,
    provider,
    getSigner,
    onboard,
    init,
    signerOrProvider,
  };
};
