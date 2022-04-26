import React from "react";
import { useGlobalStateContext } from "../../../context/Context";
import { Modal } from "../Modal";
import { parseEther } from "@ethersproject/units";

const WithdrawModal = ({ redeemableRaw, setShowWithdraw, showWithdraw }) => {
  const {
    contracts: { staking },
  } = useGlobalStateContext();
  async function claimRewards(values) {
    await staking.claimRewardsWithAmount(parseEther(values.amount.toString()));
    setShowWithdraw(false);
  }
  return (
    <Modal
      header="Withdraw"
      bal
      mainPreset={redeemableRaw}
      show={showWithdraw}
      handleClose={(e) => {
        setShowWithdraw(false);
      }}
      inputs={[
        {
          name: "amount",
          placeholder: "0",
          preset: redeemableRaw,
        },
      ]}
      handler={claimRewards}
      submitName="Withdraw Rewards"
    ></Modal>
  );
};

export default WithdrawModal;
