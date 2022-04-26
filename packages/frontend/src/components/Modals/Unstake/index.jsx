import React, { useState, useEffect } from "react";
import { Checkbox } from "pretty-checkbox-react";
import { Modal } from "../Modal";
import { useGlobalStateContext } from "../../../context/Context";
import { formatEther, parseEther } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

const UnstakeModal = ({ showUnstake, stakedRaw, setShowUnstake }) => {
  const {
    contracts: { staking },
    userdata: data,
    tempdata,
  } = useGlobalStateContext();
  const [penalty, setPenalty] = useState("0.0");
  const [penaltyCalculated, setPenaltyCalculated] = useState(false);
  const getPenalty = React.useCallback(
    async (value) => {
      if (isNaN(Number(value))) {
        setPenalty(formatEther(parseEther("0")));
      }
      //if (!value || !Number(data.returnstats.lockCommitment))
      //return formatEther(parseEther("0"));
      //const minimum = (data._tiers[Number(data.returnstats.lockCommitment)] || {}).minimum || BigNumber.from('0');
      //if (data.returnstats.staked.sub(parseEther(value)).lt(minimum)) return formatEther(data.returnstats.bonuses.mul(data.returnstats.commitmentViolationPenalty).div(parseEther('1')));
      const unstakeValue = parseEther(value);
      const totalUnstaked = await staking.callStatic.unstake(
        parseEther(unstakeValue.toString())
      );
      const penalty = unstakeValue.sub(totalUnstaked);

      setPenalty(formatEther(penalty));
      if (totalUnstaked.isZero()) setPenalty(0);
      setPenaltyCalculated(true);
      return totalUnstaked.isZero();
    },
    [staking]
  );
  async function unstake(values) {
    return await staking
      .unstake(parseEther(`${values.amount}`))
      .then(() => {
        setShowUnstake(false);
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  }
  useEffect(() => {
    //setPenalty(getPenalty());
  }, [data]);

  return (
    <Modal
      header="Unstake"
      bal
      show={showUnstake}
      mainPreset={stakedRaw}
      key="unstake"
      submitName="Unstake"
      handler={unstake}
      additionalButtonOnClick={({
        values,
        setError,
        setCustomErrorMessage,
      }) => {
        getPenalty(values.amount).then((isZero) => {
          if (typeof isZero == "boolean" && !isZero) setError(false);
          else if (typeof isZero == "boolean")
            setCustomErrorMessage("Invalid Amount");
        });
      }}
      isPenaltyCalculated={penaltyCalculated}
      inputs={[
        {
          name: "amount",
          placeholder: "0",
          preset: stakedRaw,
          intermediate: ({
            values,
            newValue,
            error,
            setError,
            setCustomErrorMessage,
          }) => {
            setPenaltyCalculated(false);
            if (
              Number(newValue) == 0 ||
              parseEther(newValue).gt(tempdata.scnfiBalance)
            ) {
              setError(true);
              setCustomErrorMessage("Invalid Amount");
            } else {
              setError(!penaltyCalculated);
              setCustomErrorMessage("Calculate Penalty before unstaking");
            }
          },
        },
        ...(Number(penalty) > 0
          ? [
              {
                name: "penaltyStatus",
                placeholder: "0",
                value: false,
                label: "Penalty",
                showAdditional: true,
                override: ({
                  setValues,
                  values,
                  setErrorMessage,
                  setError,
                }) => {
                  return (
                    <div style={{ padding: "0 5px", marginTop: 10 }}>
                      <Checkbox
                        state={values.penaltyStatus}
                        color="success-o"
                        style={{
                          color: "#fff",
                        }}
                        shape="curve"
                        onChange={() => {
                          if (values.penaltyStatus && Number(penalty) > 0) {
                            setErrorMessage(true);
                          } else {
                            setErrorMessage(false);
                          }
                          setValues({
                            name: "penaltyStatus",
                            value: !values.penaltyStatus,
                          });
                        }}
                      >
                        Approve Unstake with Penalty: {penalty} CNFI
                      </Checkbox>
                    </div>
                  );
                },
              },
            ]
          : []),
      ]}
      handleClose={(e) => {
        setShowUnstake(false);
      }}
    />
  );
};

export default UnstakeModal;
