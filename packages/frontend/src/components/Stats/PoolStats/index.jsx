import React, { useMemo } from "react";
import { parseEther, formatEther } from "@ethersproject/units";
import PoolElement from "./PoolElement";
import comma from "comma-number";

const PoolStats = ({ data, getFormatted, tempdata }) => {
  const poolData = useMemo(() => {
    let apy = "0%";

    try {
      if (data?.returnstats?.staked.lte(0)) throw new Error();
      if (data?.user?.weight) {
        apy = `${formatEther(
          data.user.weight
            .mul(data.dailyUser.multiplier)
            .div(data.returnstats.totalWeight)
            .mul(data.returnstats.cnfiReleasedPerDay)
            .div(parseEther("1"))
            .mul(365)
            .sub(data.returnstats.staked)
            .div(100)
        )
          .split(".")
          .reduce((r, v, i) => {
            return i == 0
              ? `${r}${v}`
              : `${r}.${v.length > 5 ? v.slice(0, 2) : v}`;
          }, "")}%`;
      }
    } catch (e) {
      apy = "0.0%";
    }
    return {
      totalCNFIStaked: Number(formatEther(tempdata?.totalsCNFI || 0)).toFixed(
        2
      ),
      CNFIReleasedPerDay: 5000,
      totalWeight: "N/A",

      //totalWeight: Number(getFormatted("totalWeight")).toFixed(2),
      //  currentPoolAPY: apy,
    };
  }, [data, tempdata]);
  console.log(tempdata);
  const renderElements = (poolData) => {
    return (
      poolData &&
      Object.keys(poolData).map((poolDataPoint, i) => {
        const value = comma(poolData[poolDataPoint]);
        return (
          <PoolElement
            name={
              poolDataPoint === "totalWeight"
                ? "totalPoolWeight"
                : poolDataPoint
            }
            value={value}
            key={i}
          />
        );
      })
    );
  };

  return <div className="poolstats">{renderElements(poolData)}</div>;
};

export default PoolStats;
