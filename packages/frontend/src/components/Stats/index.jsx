import Poolstats from "./PoolStats/index";
import Mystatsstaked from "./MyStatsstaked/index";
import Mystatsearning from "./MyStatsearning/index";
import Userstats from "./UserStats/index";
import React from "react";
import { useGlobalStateContext } from "../../context/Context";

const Stats = ({ currentTier, multiplier }) => {
  const {
    userdata: data,
    getFormatted,
    prop,
    tempdata,
  } = useGlobalStateContext();
  console.log(tempdata);
  function getFormattedDays(getter) {
    const date = prop(getter);
    if (date.toString() === "0") return 0;
    const lastStaked = date.toNumber();
    return Math.floor(
      Math.abs((+new Date() - lastStaked * 1000) / (86400 * 1000))
    );
  }
  return (
    <>
      <Poolstats data={data} tempdata={tempdata} getFormatted={getFormatted} />
      <Mystatsstaked getFormatted={getFormatted} tempdata={tempdata} />
      <Mystatsearning getFormatted={getFormatted} tempdata={tempdata} />
      <Userstats
        getFormattedDays={getFormattedDays}
        currentTier={currentTier}
        multiplier={multiplier}
      />
    </>
  );
};

export default Stats;
