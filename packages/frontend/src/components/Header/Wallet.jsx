import React, { useState } from "react";
import {
  useGlobalDispatchContext,
  useGlobalStateContext,
} from "../../context/Context";
// import store from "store";

import { parseEther } from "@ethersproject/units";
import { formatEther } from "../../util";

const formatBalance = (balance) => {
  const stringBalance = formatEther(balance);
  const decimal = stringBalance.indexOf(".");
  return stringBalance.substring(0, decimal + 2);
};

export const Balance = () => {
  const { tempdata } = useGlobalStateContext();

  return (
    <span style={{ fontSize: 13 }} className="buttonbarbalancevalue">
      {tempdata
        ? tempdata?.cnfiBalance === null
          ? "..."
          : formatBalance(tempdata?.cnfiBalance)
        : "..."}{" "}
      CNFI
    </span>
  );
};

export const Wallet = () => {
  const { contracts, account, active, chain } = useGlobalStateContext();
  const chainId = chain;
  const { connect } = useGlobalDispatchContext();
  const [value, setValue] = useState("");
  const send = async (contract, method, ...params) => {
    return await contracts[contract][method](...params);
  };
  const mintToAddress = async () => {
    await send("staking", "mintCnfi", value, parseEther("20000"));
  };
  const mint = async () => {
    await send("staking", "mintCnfi", account, parseEther("20000"));
  };
  const stake = async () => {
    await send(
      "cnfi",
      "approve",
      contracts.staking.address,
      parseEther("10000")
    );

    await send("staking", "stake", parseEther("10000"), 0);
  };
  const reward = async () => {
    await send("staking", "triggerNextReward");
  };
  const cycle = async () => {
    await send("staking", "triggerNextDailyCycle", account);
  };
  // if (error) {
  //   console.error(error.message);
  // }

  return (
    <div className="button-row">
      {[31337, 3].includes(chainId) && (
        <div className="testbuttons">
          <button onClick={mint}>Mint 20k CNFI</button>
          <button onClick={stake}>Stake 10k CNFI</button>
          <button onClick={cycle}>Trigger New Cycle</button>
          <button onClick={reward}>Trigger Next Reward</button>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          <button onClick={mintToAddress}>Mint 20k to address</button>
        </div>
      )}
      <div className="p-2 w-full text-white bg-gray-800 flex flex-row justify-between items-center">
        <div className="float-right buttongroup" style={{ display: "flex" }}>
          <div className="buttonbarbalance">
            {active ? <Balance /> : ""}
            {!active ? (
              <button
                className={"buttonbarbutton"}
                onClick={() => {
                  if (!active) connect();
                  // else {
                  //
                  // }
                }}
              >
                {/* {active
                ? "" +
                  account.slice(0, 5) +
                  "..." +
                  account.slice(account.length - 3, account.length)
                : "LINK WALLET"} */}
                LINK WALLET
              </button>
            ) : (
              <></>
            )}
          </div>
          {/* {(active || store.get("wallet")) && (
            <button
              className={"buttonbarbutton change"}
              onClick={() => {
                disconnect(); // After reset
              }}
            >
              DISCONNECT
            </button>
          )} */}
        </div>
      </div>

      {active && (
        <div className="flex flex-col p-2">
          {/* {error && <div className='text-red-600'>{error.toString()}</div>} */}
        </div>
      )}
    </div>
  );
};

export default Wallet;
