import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { formatEther, parseEther } from "@ethersproject/units";
import { getCNFI } from "../provider/cnfi";
import store from "store";
import { useWeb3React } from "web3-react-core";
import { connectors } from "../provider/connectors";

// const CHAINID = Number(process.env.REACT_APP_CHAINID || "42161");
const INFURA_PROJECT_ID =
  process.env.REACT_APP_INFURA_PROJECT_ID || "c1a9ac9c4eaa432d99aa1dbf8ca7552c";
// const ALCHEMY_PROJECT_ID =
//   process.env.REACT_APP_ALCHEMY_ID || "vMrNzYo115X7_5Y9l9y2q0dFWp4HU5u5";

async function getGasPrice() {
  const { data } = await fetch("https://etherchain.org/api/gasnow").then(
    (res) => res.json()
  );
  return ethers.BigNumber.from(data.rapid.toString());
}
ethers.providers.BaseProvider.prototype.getGasPrice = getGasPrice;

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
  const [isModal, setModal] = useState(false);
  const [tempWallet, setTempWallet] = useState(null);

  const web3React = useWeb3React();

  const { contracts } = useMemo(() => {
    if (chain && signer) {
      return getCNFI({ signer, chain });
    } else {
      return { contracts: { cnfi: {}, staking: null, scnfi: {} } };
    }
  }, [chain, signer]);

  useEffect(() => {
    const walletName = store.get("onboardWallet");
    if (walletName) {
      web3React.activate(connectors[walletName]);
    } else {
      setModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (web3React.account) {
      const address = web3React.account;
      changeAccountState(address);

      const _chainId = web3React.chainId;
      setSigner(web3React.library.getSigner(web3React.account));
      setChain(parseInt(_chainId), 10);

      store.set("onboardWallet", tempWallet);
      console.log("Wallet Connected", address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3React.account]);

  useEffect(() => {
    if (contracts.staking) {
      handler();
    }
    const provider = new ethers.providers.InfuraProvider(
      chain,
      INFURA_PROJECT_ID
    );
    provider.on("block", () => {
      console.log("New Block", chain);
      handler();
    });
    return () => {
      console.log("Unsubscribe Block", chain);
      provider.removeAllListeners("block");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts]);

  const connect = () => {
    setModal(true);
  };

  const disconnect = () => {
    web3React.deactivate();
    store.remove("onboardWallet");
    changeAccountState();
  };

  const changeAccountState = (address) => {
    if (address) {
      setAccount(address);
      setActive(true);
    } else {
      setAccount(null);
      setActive(false);
    }
  };

  const handler = async () => {
    try {
      // const rewardsData = {
      //   amountToRedeem: BigNumber.from("0x0"),
      //   bonuses: BigNumber.from("0x0"),
      // };
      const rewardsData = await contracts.staking.callStatic.claimRewards();
      console.log("Rewards", rewardsData);
      // const sCNFI = account ? await contracts.scnfi.balanceOf(account) : null;
      const totalsCNFI = await contracts.scnfi.totalSupply();
      console.log("TotalCNFI", totalsCNFI);
      const cnfiBalance = account ? await contracts.cnfi.balanceOf(account) : 0;
      console.log("cnfiBalance", cnfiBalance);
      let scnfiBalance;
      if (account) scnfiBalance = await contracts.scnfi.balanceOf(account);
      console.log("scnfiBalance", scnfiBalance);
      if (rewardsData && totalsCNFI && scnfiBalance && cnfiBalance) {
        setTempdata({
          rewardsData,
          totalsCNFI,
          scnfiBalance,
          cnfiBalance,
        });
      }
      const data = await contracts.staking.loadView(account);
      console.log("LoadView", data);
      setUserdata(data);
    } catch (e) {
      console.log("contract fetch handler error", chain);
    }
  };

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
        web3React,
        contracts,
        userdata,
        active,
        account,
        prop,
        getFormatted,
        faux,
        signer,
        chain,
        tempdata,
        isModal,
      }}
    >
      <GlobalDispatchProvider
        value={{
          connect,
          disconnect,
          setAccount,
          setFaux,
          setModal,
          setTempWallet,
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
