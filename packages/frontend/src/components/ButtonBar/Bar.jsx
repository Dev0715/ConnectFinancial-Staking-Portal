import React from "react";
import Button from "./Button";

const Bar = ({
  setShowDeposit,
  setShowUnstake,
  setShowWeb3Modal,
  setShowWithdraw,
  active,
}) => {
  const buttonList = ["Deposit", "Withdraw", "Unstake"];
  return (
    <div className="buttonbar">
      {buttonList.map((label) => {
        return (
          <Button
            key={label}
            active={active}
            label={label}
            handler={eval(`setShow${label}`)}
            setShowWeb3Modal={setShowWeb3Modal}
          />
        );
      })}
    </div>
  );
};

export default Bar;
