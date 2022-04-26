import React, { useEffect, useState, useMemo } from "react";
import {
  formatEther as formatEtherBase,
  formatUnits,
  parseEther,
} from "@ethersproject/units";
import { formatEther } from "../../util";
import { useGlobalStateContext } from "../../context/Context";
import Stats from "../Stats";
import { ButtonBar } from "../ButtonBar";
import {
  Web3Modal,
  DepositModal,
  WithdrawModal,
  UnstakeModal,
} from "../Modals";
import rawTiers from "../Tiers";

const Staking = () => {
  const {
    userdata: data,
    active,
    faux,
    signer,
    tempdata,
  } = useGlobalStateContext();
  const tiers = useMemo(() => rawTiers, []);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showUnstake, setShowUnstake] = useState(false);
  const [showWeb3Modal, setShowWeb3Modal] = useState(false);
  const [currentTier, setCurrentTier] = useState(tiers[0]);
  const [upgradeTiers, setUpgradeTiers] = useState(tiers);
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const redeemableRaw = useMemo(
    () => formatEtherBase(tempdata?.rewardsData?.amountToRedeem || "0"),
    [tempdata]
  );
  const balRaw = useMemo(() => formatEtherBase(tempdata?.cnfiBalance || "0"), [
    tempdata,
  ]);
  const staked = useMemo(() => formatEther(tempdata?.scnfiBalance || "0"), [
    tempdata,
  ]);
  const stakedRaw = useMemo(
    () => formatEtherBase(tempdata?.scnfiBalance || "0"),
    [tempdata]
  );

  useEffect(() => {
    if (data?.dailyUser) {
      const tier = Math.max(
        data.dailyUser.commitment,
        data.dailyUser.currentTier,
        data.currentTier
      );
      const upgradeable = Math.max(
        data.dailyUser.commitment,
        data.dailyUser.currentTier
      );
      setCurrentTier(tiers[tier]);
      setCurrentTierIndex(tier);
      const _upgradeTiers = tiers.filter(
        (_tier) => _tier.minimum > tiers[upgradeable].minimum
      );
      if (_upgradeTiers.length != upgradeTiers.length)
        setUpgradeTiers(_upgradeTiers);
      /*if(data?.user?.commitment > 0) {
        console.log("here2:",upgradeTiers)
        setUpgradeTiers(() => {
          const array = upgradeTiers;
          array.shift()          
          return array
        })
      } */
    }
  }, [data?.dailyUser, data?.currentTier, tiers]);

  const multiplier = useMemo(() => {
    if (data && data.dailyUser) {
      const mul = formatUnits(
        data.dailyUser.multiplier.sub(parseEther("1")),
        16
      );
      if (Number(mul) < 0) return "-";
      return mul + "%";
    }
  }, [data?.dailyUser.multiplier]);

  const amountIntermediate = React.useCallback(
    ({
      values,
      setValues,
      error,
      setCustomErrorMessage,
      setError,
      newValue,
      newTier,
      useUpgradeTiers,
      useStaked,
    }) => {
      newValue = !isNaN(Number(newValue)) ? newValue : values.amount;
      newTier = !isNaN(Number(newTier)) ? newTier : values.tier;
      const tier = !isNaN(Number(newTier))
        ? useUpgradeTiers
          ? upgradeTiers[newTier]
          : tiers[newTier]
        : null;
      const value = (useStaked ? Number(stakedRaw) : 0) + Number(newValue || 0);
      if (Number(newValue) > Number(balRaw)) {
        setError(true);
        setCustomErrorMessage("Insufficient CNFI in Wallet");
      } else if (tier && value < tier.minimum) {
        setError(true);
        setCustomErrorMessage("Insufficient CNFI Balance for this Tier");
      } else {
        setCustomErrorMessage("");
        setError(false);
      }
    },
    [balRaw, tiers, upgradeTiers, stakedRaw]
  );
  const depositModalProps = {
    setShowDeposit,
    showDeposit,
    staked,
    balRaw,
    tiers,
    amountIntermediate,
    redeemableRaw,
    currentTierIndex,
    currentTier,
    upgradeTiers,
    setUpgradeTiers,
  };
  const withdrawModalProps = {
    redeemableRaw,
    showWithdraw,
    setShowWithdraw,
  };
  const unstakeModalProps = {
    showUnstake,
    stakedRaw,
    setShowUnstake,
  };

  return (
    <div className="body-content">
      <Web3Modal
        setShowWeb3Modal={setShowWeb3Modal}
        showWeb3Modal={showWeb3Modal}
      />
      <DepositModal {...depositModalProps} />
      <WithdrawModal {...withdrawModalProps} />
      <UnstakeModal {...unstakeModalProps} />
      <Stats currentTier={currentTier} multiplier={multiplier} />
      {signer && !faux && (
        <ButtonBar
          active={active}
          setShowDeposit={setShowDeposit}
          setShowWeb3Modal={setShowWeb3Modal}
          setShowWithdraw={setShowWithdraw}
          setShowUnstake={setShowUnstake}
        />
      )}
    </div>
  );
};

export default Staking;
