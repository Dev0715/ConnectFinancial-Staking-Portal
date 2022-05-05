import Myearning from "./Myearning";
import React from "react";
import comma from "comma-number";

const Mystatsearning = ({ getFormatted }) => {
  const rounder = (point) => {
    return comma(Number(getFormatted((d) => (d ? d[point] : ""))).toFixed(2));
  };

  return (
    <div className="mystatsearnings">
      <Myearning
        label={"CNFI Earnings"}
        value={
          rounder("earned")
          // "N/A"
        }
        size={"small"}
      />
      <Myearning
        label={"Total Earned"}
        value={
          rounder("totalEarned")
          // "N/A"
        }
      />
      <Myearning
        label={"Bonus CNFI Earned"}
        value={
          // "N/A"
          comma(
            Number(getFormatted((d) => d?.returnstats.bonuses || 0)).toFixed(2)
          )
        }
        size={"small"}
      />
    </div>
  );
};

export default Mystatsearning;
