import React, { useState, useEffect } from "react";
import axios from "axios";
import SidebarElement from "./SidebarElement";

const Sidebar = () => {
  const [coingeckoData, setCoinGeckoData] = useState({
    circulatingSupply: "---",
    price: "---",
    marketCapRank: "---",
    marketCap: "---",
  });
  useEffect(() => {
    const getCGData = async () => {
      const cgData = (
        await axios.get(
          "https://api.coingecko.com/api/v3/coins/connect-financial"
        )
      ).data;
      setCoinGeckoData({
        marketCapRank: "#" + cgData["market_cap_rank"],
        price: "$" + cgData["market_data"]["current_price"]["usd"],
        circulatingSupply: cgData["market_data"]["circulating_supply"],
        marketCap: "$" + cgData["market_data"]["market_cap"]["usd"],
      });
      return coingeckoData;
    };
    getCGData();
  }, []);

  const renderElements = (sidebars) => {
    return (
      coingeckoData &&
      Object.keys(coingeckoData).map((sidebar, i) => {
        return (
          <SidebarElement
            name={sidebar}
            value={coingeckoData[sidebar]}
            key={i}
          />
        );
      })
    );
  };
  return <div>{renderElements(coingeckoData)}</div>;
};

export default Sidebar;
