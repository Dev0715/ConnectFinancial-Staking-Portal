import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useGlobalStateContext } from "../../../context/Context";
import { formatEther, parseEther } from "@ethersproject/units";
import { Modal } from "../Modal";
import Select from "react-select";
import { Checkbox } from "pretty-checkbox-react";

const Deposit = ({
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
}) => {
  const {
    getFormatted,
    userdata: data,
    contracts: { staking, cnfi },
    tempdata,
  } = useGlobalStateContext();
  const [depositStage, setDepositStage] = useState(0);
  // const bal = useMemo(
  //   () => formatEther(data?.returnstats.currentCnfiBalance || '0'),
  //   [data?.returnstats.currentCnfiBalance]
  // );
  const bal = useMemo(() => formatEther(tempdata?.cnfiBalance || "0"), [
    tempdata,
  ]);
  // const redeemable = useMemo(() => formatEther(data?.redeemable || '0'), [
  //   data?.redeemable,
  // ]);

  const redeemable = useMemo(
    () => formatEther(tempdata?.rewardsData[0] || "0"),
    [tempdata]
  );
  const availableTiers = useMemo(() => tiers.slice(currentTierIndex), [
    tiers,
    currentTierIndex,
  ]);

  const getTierName = useCallback((tier) => {
    if (!tier) return "";

    return `${tier.name} (Minimum: ${tier.minimum} CNFI, Evolution Bonus: ${
      tier.bonus
    }%, Duration: ${tier.cycles * 6} Months)`;
  }, []);
  const getTierDuration = useCallback((tier, raw = false) => {
    return raw ? tier.cycles * 6 : `duration: ${tier.cycles * 6} Months`;
  }, []);

  const getTimelock = useCallback(
    (tierId) => {
      if (!tiers || !tierId) return 0;
      return getTierDuration(tiers[tierId], true);
    },
    [tiers]
  );
  async function upgrade(values) {
    const tierDiff = tiers.length - upgradeTiers.length;

    const tier = tierDiff + Number(values.tier);
    return await stake({ ...values, tier });
  }
  async function stake(values) {
    const amount = parseEther(`${values.amount}`);
    const tier = values.timelock ? values.tier || 0 : 0;
    return await staking
      .stake(amount, tier)
      .then(() => {
        setDepositStage(0);
        setShowDeposit(false);
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  }
  async function restake(values) {
    return staking
      .restakeRewardsWithAmount(parseEther(`${values.amount}`), 0)
      .then(() => {
        setDepositStage(0);
        setShowDeposit(false);
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  }

  const selectStyles = useMemo(
    () => ({
      container: (base) => ({
        ...base,
        width: "100%",
        marginTop: 20,
      }),
      control: (base) => ({
        ...base,
        borderRadius: 10,
        color: "#fff",
        borderColor: "#494949",
        backgroundColor: "transparent",
      }),
      input: (base) => ({ ...base, color: "#fff" }),
      singleValue: (base) => ({ ...base, color: "#fff" }),
      menu: (base) => ({
        ...base,
        backgroundColor: "rgb(23, 26, 31)",
        color: "#fff",
      }),
      option: (base, state) => {
        return {
          ...base,
          backgroundColor:
            state.isFocused && !state.isSelected ? "#0D55BA" : "transparent",
          cursor: state.isFocused && !state.isSelected ? "pointer" : undefined,
        };
      },
    }),
    []
  );

  const depositStages = useMemo(
    () => [
      {
        children: (
          <div className="modalbuttonbar">
            <button
              className="modalbutton"
              onClick={(e) => {
                setDepositStage(1);
              }}
            >
              Deposit from wallet
            </button>
            {Number(staked) !== 0 ? (
              <button
                className="modalbutton"
                onClick={(e) => {
                  setDepositStage(2);
                }}
              >
                Reinvest
              </button>
            ) : (
              ""
            )}
            {Number(staked) !== 0 && upgradeTiers.length > 0 ? (
              <button
                className="modalbutton"
                onClick={(e) => {
                  setDepositStage(3);
                }}
              >
                Upgrade Tier
              </button>
            ) : (
              ""
            )}
            <button
              onClick={(e) => {
                setShowDeposit(false);
              }}
              className="modalbuttoninactive"
            >
              <span>Cancel</span>
            </button>
          </div>
        ),
      },
      {
        children: undefined,
        header: "Deposit from Wallet",
        mainPreset: balRaw,
        bal: true,
        submitName: "Deposit",
        value: tiers[0].minimum,
        errorMessage: "Must confirm timelock to get tier bonuses",
        inputs: [
          {
            name: "amount",
            placeholder: "0",
            preset: balRaw,

            intermediate: amountIntermediate,
          },
          ...(Number(staked) == 0
            ? [
                {
                  name: "tier",
                  placeholder: "0",
                  label: "Tier",
                  value: currentTierIndex,
                  override: ({
                    setValues,
                    values,
                    setError,
                    setErrorMessage,
                    intermediates,
                  }) => (
                    <>
                      <Select
                        styles={selectStyles}
                        options={tiers.map((d, i) => ({
                          value: i,
                          label: getTierName(d),
                        }))}
                        value={
                          tiers[values.tier]
                            ? {
                                value: values.tier,
                                label: getTierName(tiers[values.tier]),
                              }
                            : {
                                value: 0,
                                label: getTierName(tiers[0]),
                              }
                        }
                        onChange={(opt) => {
                          setValues({
                            name: "amount",
                            value: tiers[opt.value].minimum,
                          });
                          if (opt.value > 0) {
                            setErrorMessage(!values.timelock);
                          } else {
                            setErrorMessage(false);
                          }
                          setValues({ name: "tier", value: opt.value });

                          intermediates[0]((args) => {
                            return {
                              ...args,
                              newValue: tiers[opt.value].minimum,
                              newTier: opt.value,
                            };
                          });
                        }}
                      ></Select>
                      <label className="modalinputlabel">{"Tier"}</label>
                    </>
                  ),
                },
                {
                  name: "timelock",
                  placeholder: "0",
                  value: false,
                  label: "Timelock",
                  showAdditional: true,
                  override: ({
                    setValues,
                    values,
                    setErrorMessage,
                    errorMessage,
                  }) => {
                    return (
                      <div style={{ padding: "0 5px", marginTop: 10 }}>
                        <Checkbox
                          state={values.timelock}
                          color="success-o"
                          style={{
                            color: "#fff",
                          }}
                          onChange={() => {
                            if (values.tier > 0) {
                              setErrorMessage(values.timelock);
                            }
                            setValues({
                              name: "timelock",
                              value: !values.timelock,
                            });
                          }}
                        >
                          Commit to Time Lock for Evolution Bonus:{" "}
                          {getTierDuration(tiers[values.tier || 0])}
                        </Checkbox>
                      </div>
                    );
                  },
                },
              ]
            : []),
        ],
        handler: stake,
      },
      {
        children: undefined,
        header: "Reinvest Rewards",
        mainPreset: redeemableRaw,
        bal: true,
        submitName: "Reinvest",
        inputs: [
          {
            name: "amount",
            placeholder: "0",
            preset: redeemableRaw,
          },
        ],
        handler: restake,
      },
      staked !== "0" && upgradeTiers.length > 0
        ? {
            children: undefined,
            header: "Upgrade Tier",
            showDefaultErrorMessage: true,
            mainPreset: bal,
            bal: true,
            errorMessage: "Must confirm timelock to get tier bonuses",
            additional: (
              <>
                <div className="modalbalance">
                  Current Tier : {currentTier.name ? currentTier.name : "N/A"}
                </div>
                <div className="modalbalance">Current Staked : {staked}</div>
                <div className="modalbalance">
                  Current Timelock : {getTimelock(data?.user?.commitment)}{" "}
                  Months
                </div>
              </>
            ),
            submitName: "Upgrade",
            handler: upgrade,
            inputs: [
              {
                name: "amount",
                placeholder: "0",
                preset: balRaw,
                errorMessage: "Insufficient CNFI",
                value: Math.max(
                  upgradeTiers[0]?.minimum - Number(getFormatted("staked")),
                  0
                ),
                intermediate: amountIntermediate,
              },
              ...[
                {
                  name: "tier",
                  placeholder: "0",
                  label: "Tier",
                  value: "0",
                  override: ({
                    setValues,
                    values,
                    setError,
                    setErrorMessage,
                    intermediates,
                  }) => {
                    return (
                      <>
                        <Select
                          styles={selectStyles}
                          options={upgradeTiers.map((d, i) => ({
                            value: i,
                            label: getTierName(d),
                          }))}
                          value={{
                            value: values.tier,
                            label: getTierName(upgradeTiers[values.tier || 0]),
                          }}
                          onChange={(opt) => {
                            const diffBal = Math.max(
                              upgradeTiers[opt.value].minimum -
                                Number(getFormatted("staked")),
                              0
                            );
                            setValues({
                              name: "amount",
                              value: diffBal,
                            });
                            setValues({
                              name: "timelock",
                              value: false,
                            });
                            setErrorMessage(true);

                            setValues({ name: "tier", value: opt.value });
                            intermediates[0]((args) => {
                              return {
                                ...args,
                                newValue: diffBal,
                                newTier: opt.value,
                                useUpgradeTiers: true,
                                useStaked: true,
                              };
                            });
                          }}
                        ></Select>
                        <label className="modalinputlabel">{"Tier"}</label>
                      </>
                    );
                  },
                },
                {
                  name: "timelock",
                  placeholder: "0",
                  value: false,
                  label: "Timelock",
                  showAdditional: true,
                  override: ({ setValues, values, setErrorMessage }) => {
                    return (
                      <div style={{ padding: "0 5px", marginTop: 10 }}>
                        <Checkbox
                          state={values.timelock}
                          color="success-o"
                          name="timelockUpgradeCB"
                          style={{
                            color: "#fff",
                          }}
                          onChange={(e) => {
                            setErrorMessage(!e.target.checked);
                            setValues({
                              name: "timelock",
                              value: e.target.checked,
                            });
                          }}
                        >
                          Commit to Time Lock for Evolution Bonus:{" "}
                          {getTierDuration(
                            upgradeTiers[
                              !isNaN(values.tier)
                                ? values.tier > upgradeTiers.length - 1
                                  ? values.tier - upgradeTiers.length
                                  : values.tier
                                : 0
                            ]
                          )}
                        </Checkbox>
                      </div>
                    );
                  },
                },
              ],
            ],
          }
        : null,
    ],
    [
      bal,
      redeemable,
      tiers,
      currentTierIndex,
      availableTiers,
      currentTier,
      staked,
      balRaw,
      redeemableRaw,
      upgradeTiers,
    ]
  );
  const handleClose = React.useCallback(() => {
    setShowDeposit(false);
    setDepositStage(0);
  }, []);
  const DepositCB = React.useCallback(
    () => (
      <Modal
        key="deposit"
        header="Deposit"
        show={showDeposit}
        handleClose={handleClose}
        {...depositStages[depositStage]}
      ></Modal>
    ),
    [depositStage, depositStages, showDeposit]
  );
  return <DepositCB />;
};

export default Deposit;
