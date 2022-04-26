import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { formatEther, parseEther } from "@ethersproject/units";
// import { AlchemyProvider } from "@ethersproject/providers";
// import { useProvider } from "../provider/provider";
// import { Wallets } from "../provider/wallet";
import { getCNFI } from "../provider/cnfi";
import { BigNumber } from "ethers";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import trezorModule from "@web3-onboard/trezor";
import ledgerModule from "@web3-onboard/ledger";
import gnosisModule from "@web3-onboard/gnosis";
import walletConnectModule from "@web3-onboard/walletconnect";
import walletLinkModule from "@web3-onboard/walletlink";
import portisModule from "@web3-onboard/portis";
import fortmaticModule from "@web3-onboard/fortmatic";
import torusModule from "@web3-onboard/torus";
import keepkeyModule from "@web3-onboard/keepkey";
import store from "store";

// const CHAINID = Number(process.env.REACT_APP_CHAINID || "42161");
const INFURA_PROJECT_ID =
  process.env.REACT_APP_INFURA_PROJECT_ID || "c1a9ac9c4eaa432d99aa1dbf8ca7552c";
// const ALCHEMY_PROJECT_ID =
//   process.env.REACT_APP_ALCHEMY_ID || "vMrNzYo115X7_5Y9l9y2q0dFWp4HU5u5";

async function getGasPrice() {
  const { data } = await fetch(
    "https://etherchain.org/api/gasnow"
  ).then((res) => res.json());
  return ethers.BigNumber.from(data.rapid.toString());
}
ethers.providers.BaseProvider.prototype.getGasPrice = getGasPrice;

const injected = injectedModule();
const walletLink = walletLinkModule();
const gnosis = gnosisModule();
// ** WalletConnect servers
// https://safe-walletconnect.gnosis.io
// https://wcbridge.zerion.io
// https://j.bridge.walletconnect.org
// https://bridge.walletconnect.org
// const walletConnect = walletConnectModule({
//   bridge: "https://bridge.walletconnect.org",
//   qrcodeModalOptions: {
//     mobileLinks: ["rainbow", "metamask", "argent", "trust", "imtoken"],
//   },
// });
const walletConnect = walletConnectModule();
const portis = portisModule({
  apiKey: "b2b7586f-2b1e-4c30-a7fb-c2d1533b153b",
});
const fortmatic = fortmaticModule({
  apiKey: "pk_test_886ADCAB855632AA",
});
const torus = torusModule();
const ledger = ledgerModule();
const keepkey = keepkeyModule();
const trezorOptions = {
  email: "test@test.com",
  appUrl: "https://www.blocknative.com",
};
const trezor = trezorModule(trezorOptions);

const onboard = Onboard({
  wallets: [
    ledger,
    trezor,
    walletConnect,
    gnosis,
    keepkey,
    walletLink,
    injected,
    fortmatic,
    portis,
    torus,
  ],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    },
    {
      id: "0xA4B1",
      token: "ETH",
      label: "Arbitrum Mainnet",
      rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      // rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_PROJECT_ID}`,
      // rpcUrl: "https://arb1.arbitrum.io/rpc",
    },
  ],
  appMetadata: {
    name: "Connect Financial",
    icon: "<svg><svg/>",
    description: "Connect Financial Token Portal",
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
    ],
  },
});

const GlobalStateContext = createContext({
  contracts: { staking: {}, cnfi: {} },
});
const GlobalDispatchContext = createContext(null);

const { Provider: GlobalStateProvider } = GlobalStateContext;
const { Provider: GlobalDispatchProvider } = GlobalDispatchContext;

export const Provider = ({ children }) => {
  const [chain, setChain] = useState(null);
  const [account, setAccount] = useState(null);
  const [active, setActive] = useState(false);
  const [userdata, setUserdata] = useState(undefined);
  const [tempdata, setTempdata] = useState(null);
  const [faux, setFaux] = useState(false);
  const [signer, setSigner] = useState(null);

  // const provider = useMemo(() => {
  //   if (chain) {
  //     return makeProvider(chain);
  //   } else {
  //     return chain;
  //   }
  // }, [chain]);

  // const makeProvider = (network) => {
  //   return new AlchemyProvider(network, ALCHEMY_PROJECT_ID);
  // };

  const { contracts } = useMemo(() => {
    if (chain && signer) {
      return getCNFI({ signer, chain });
    } else {
      return { contracts: { cnfi: {}, staking: null, scnfi: {} } };
    }
  }, [chain, signer]);

  const changeAccountState = (address) => {
    if (address) {
      setAccount(address);
      setActive(true);
    } else {
      setAccount(null);
      setActive(false);
    }
  };

  const connect = async () => {
    const walletName = store.get("onboardWallet");
    if (walletName) {
      onboard
        .connectWallet({ autoSelect: { label: walletName } })
        .then((walletStates) => {
          if (walletStates.length) {
            const address = walletStates[0].accounts[0].address;
            changeAccountState(address);
            console.log("Wallet Connected", address);
          }
        });
    } else {
      onboard.connectWallet().then((walletStates) => {
        if (walletStates.length) {
          store.set("onboardWallet", walletStates[0].label);
          const address = walletStates[0].accounts[0].address;
          changeAccountState(address);
          console.log("Wallet Connected", address);
        }
      });
    }
  };

  // useEffect(() => {
  //   if (window.ethereum) {
  //     window.ethereum.request({ method: "eth_chainId" }).then((id) => {
  //       const chainId = parseInt(Number(id), 10);
  //       setChain(chainId);
  //     });
  //     window.ethereum.on("chainChanged", (id) => {
  //       setChain(parseInt(Number(id), 10));
  //     });
  //   }
  //   return () => {
  //     if (window.ethereum) window.ethereum.removeAllListeners("chainChange");
  //   };
  // }, []);

  const handler = async () => {
    try {
      // const data = await contracts.staking.loadView(account);
      // console.log(data);
      let rewardsData = {
        amountToRedeem: BigNumber.from(0),
        bonuses: BigNumber.from(0),
      };
      try {
        rewardsData = await contracts.staking.callStatic.claimRewards();
        // console.log("Rewards", rewardsData);
      } catch (e) {
        console.log("Issue on call staking contract on network", chain);
      }
      // const sCNFI = account ? await contracts.scnfi.balanceOf(account) : null;
      const totalsCNFI = await contracts.scnfi.totalSupply();
      // console.log("TotalCNFI", totalsCNFI);
      const cnfiBalance = account ? await contracts.cnfi.balanceOf(account) : 0;
      // console.log("cnfiBalance", cnfiBalance);
      let scnfiBalance;
      if (account) scnfiBalance = await contracts.scnfi.balanceOf(account);
      // console.log("scnfiBalance", scnfiBalance);
      setUserdata(undefined);
      if (rewardsData && totalsCNFI && scnfiBalance && cnfiBalance) {
        setTempdata({
          rewardsData,
          totalsCNFI,
          scnfiBalance,
          cnfiBalance,
        });
      }
    } catch (e) {
      console.log("contract fetch handler error", chain);
    }
  };

  useEffect(() => {
    if (contracts.staking) {
      handler();
    }
    // provider.on("block", handler);
    // return () => {
    //   provider.removeAllListeners("block");
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts]);

  useEffect(() => {
    connect();

    const onboardState = onboard.state.select("wallets");
    const { unsubscribe } = onboardState.subscribe((wallets) => {
      if (wallets.length === 0) {
        store.remove("onboardWallet");
        changeAccountState();
      } else {
        const _address = wallets[0].accounts[0].address;
        const _provider = new ethers.providers.Web3Provider(
          wallets[0].provider
        );
        const _chainId = wallets[0].chains[0].id;
        changeAccountState(_address);
        setSigner(_provider.getSigner());
        setChain(parseInt(_chainId), 10);
      }
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (window.ethereum && process.env.REACT_APP_CHAINID !== "31337") {
  //     // TODO: rewrite logic here
  //   } else if (!window.ethereum && process.env.REACT_APP_CHAINID !== "31337") {
  //     setAccount(null);
  //     setActive(false);
  //   }
  // }, [window.ethereum]);

  function prop(getter) {
    if (userdata) {
      return typeof getter == "string"
        ? userdata?.returnstats[getter]
        : getter(userdata);
    }
    return "0";
  }
  function getFormatted(getter) {
    return formatEther(prop(getter) || parseEther("0"));
  }

  return (
    <GlobalStateProvider
      value={{
        contracts,
        userdata,
        active,
        account,
        prop,
        getFormatted,
        faux,
        onboard,
        signer,
        chain,
        tempdata,
      }}
    >
      <GlobalDispatchProvider
        value={{
          connect,
          setAccount,
          setFaux,
        }}
      >
        {children}
      </GlobalDispatchProvider>
    </GlobalStateProvider>
  );
};

export const useGlobalStateContext = () => {
  return useContext(GlobalStateContext);
};

export const useGlobalDispatchContext = () => {
  return useContext(GlobalDispatchContext);
};
