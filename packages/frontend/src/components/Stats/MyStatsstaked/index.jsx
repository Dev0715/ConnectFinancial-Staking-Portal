import React from "react";
import Mystaked from "./Mystaked";
import { parseEther, formatEther } from "@ethersproject/units";
import comma from "comma-number";

const Mystatsstaked = ({ getFormatted, tempdata }) => {
  return (
    <div className="mystatsstake">
      <Mystaked
        label={"Your staked CNFI"}
        value={comma(
          Number(
            tempdata
              ? formatEther(tempdata.scnfiBalance)
              : getFormatted("staked")
          ).toFixed(2)
        )}
      />
      <Mystaked
        label={"Unclaimed Rewards"}
        value={comma(
          Number(
            tempdata
              ? formatEther(tempdata.rewardsData.amountToRedeem)
              : getFormatted((d) => d?.dailyUser.redeemable)
          ).toFixed(2)
        )}
      />
    </div>
  );
};

export default Mystatsstaked;
