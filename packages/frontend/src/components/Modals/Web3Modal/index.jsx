import React from "react";
import { useGlobalStateContext } from "../../../context/Context";
import { Modal } from "../Modal";

const Web3Modal = ({ showWeb3Modal, setShowWeb3Modal }) => {
  const { connect } = useGlobalStateContext();
  const web3ModalData = () => {
    return (
      <div className="modalbuttonbar">
        <button
          className="modalbutton"
          onClick={(e) => {
            connect();
            setShowWeb3Modal(false);
          }}
        >
          Connect
        </button>
        <button
          onClick={(e) => {
            setShowWeb3Modal(false);
          }}
          className="modalbuttoninactive"
        >
          <span>Cancel</span>
        </button>
      </div>
    );
  };
  return (
    <Modal
      header="Connect to Wallet!"
      show={showWeb3Modal}
      submitName="connect"
      children={web3ModalData()}
    ></Modal>
  );
};

export default Web3Modal;
