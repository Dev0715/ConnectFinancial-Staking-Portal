import React, { useRef, useEffect } from "react";
import {
  useGlobalDispatchContext,
  useGlobalStateContext,
} from "../../../context/Context";
import { connectors } from "../../../provider/connectors";
import styles from "./index.module.css";
import { useWeb3React } from "web3-react-core";

export default function SelectWalletModal() {
  const { isModal } = useGlobalStateContext();
  const { setModal, setTempWallet } = useGlobalDispatchContext();

  const modalRef = useRef();
  const web3React = useWeb3React();

  const wallets = [
    {
      image: "/metamask.png",
      title: "Metamask Wallet",
      connector: "injected",
    },
    {
      image: "/walletconnect.png",
      title: "WalletConnect",
      connector: "walletConnect",
    },
    {
      image: "/coinbase.png",
      title: "Coinbase Wallet",
      connector: "coinbaseWallet",
    },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalRef]);

  const onWalletClick = (connector) => {
    web3React.activate(connectors[connector]);
    setTempWallet(connector);
    setModal(false);
  };

  const onClose = () => {
    setModal(false);
  };

  return isModal ? (
    <div className={styles.wrapper}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Select Wallet</div>
          <div className={styles.close} onClick={onClose}>
            CLOSE
          </div>
        </div>
        <div className={styles.walletsWrapper}>
          {wallets.map((wallet) => (
            <div
              className={styles.wallet}
              key={wallet.title}
              onClick={() => onWalletClick(wallet.connector)}
            >
              <img src={wallet.image} alt="" />
              <div>{wallet.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
}
