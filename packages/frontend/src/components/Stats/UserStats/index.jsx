import React from "react";
import Userstat from "./Userstat";
import { useGlobalStateContext } from "../../../context/Context";

const Userstats = ({ getFormattedDays, currentTier, multiplier }) => {
  const getDays = () => {
    return getFormattedDays((obj) => {
      return obj?.user.start;
    });
  };
  const { signer } = useGlobalStateContext();

  return (
    <div className="userstats">
      <Userstat
        label={"Duration"}
        value={signer ? getDays() /* `N/A` */ : "-"}
      />
      <Userstat
        label={"Current Tier"}
        value={signer ? currentTier.name : "-"}
      />
      <Userstat label={"Earning Bonus"} value={multiplier /* "N/A" */} />
    </div>
  );
};

export default Userstats;
