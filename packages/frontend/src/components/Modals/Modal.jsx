import { useState, useReducer, useMemo, useEffect } from "react";
import { BigNumber } from "ethers";
import { parseEther } from "@ethersproject/units";
export const Modal = ({
  show,
  handleClose,
  children,
  bal,
  header,
  handler,
  checkbox,
  mainPreset,
  submitName,
  additional,
  errorMessage: errDisplay,
  inputs = [],
  getPenalty,
  showDefaultErrorMessage,
  maxRaw,
  additionalButtonOnClick,
  isPenaltyCalculated,
}) => {
  const [errorMessage, setErrorMessage] = useState(!!showDefaultErrorMessage);
  const [customErrorMessage, setCustomErrorMessage] = useState(false);
  const [values, setValues] = useReducer(
    (prev, next) =>
      !next.force ? { ...prev, [next.name]: next.value } : next.override,
    inputs.reduce((r, v) => ({ ...r, [v.name]: v.value }), {})
  );

  const presets = useMemo(
    () => inputs.reduce((r, v) => ({ ...r, [v.name]: v.preset }), {}),
    [inputs]
  );
  function innerHandleClose() {
    setValues({
      force: true,
      override: {},
    });

    handleClose();
  }
  const [error, setError] = useState(
    submitName == "Unstake" ? !isPenaltyCalculated : false
  );
  const validateInput = (element, max, maxRaw) => {
    try {
      if (isNaN(max)) return true;
      const value = BigNumber.from(parseEther(element.toString()));
      if (value) {
        const minvalue = BigNumber.from("0");
        const maxvalue = BigNumber.from(parseEther(maxRaw.toString()));
        const zero = BigNumber.from("0");
        if (value.sub(minvalue).gte(zero) && maxvalue.sub(value).gte(zero)) {
          return value;
        } else return false;
      } else return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };
  /* useEffect(() => {
    if(submitName === 'Unstake') {
      setErrorMessage(true)
    } else  {
      setErrorMessage(false)
    }

  }, [submitName]) */

  return (
    show && (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={() => {
          setError(false);
          setValues({});
          innerHandleClose();
        }}
      >
        <div
          className="modalcontent-shown"
          id="deposit-wallet"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="modaltitle">{header}</div>
          {bal && (
            <div className="modalbalance">
              Available : {mainPreset.toString()} CNFI
            </div>
          )}
          {additional}
          {inputs.map((d, i) => (
            <div key={`modal-${header}-${i}`}>
              <div className="modalinput">
                {d.override ? (
                  d.override({
                    values,
                    setValues,
                    presets,
                    useMemo,
                    error,
                    setError,
                    errorMessage,
                    setErrorMessage,
                    customErrorMessage,
                    setCustomErrorMessage,
                    intermediates: inputs.map((d) => (func) => {
                      let args = {
                        values,
                        setValues,
                        error,
                        setError,
                        customErrorMessage,
                        setCustomErrorMessage,
                      };
                      if (func) {
                        args = func(args);
                      }
                      d.intermediate(args);
                    }),
                  })
                ) : (
                  <>
                    <input
                      type="number"
                      className="modalinputamount"
                      placeholder={d.placeholder}
                      key={i}
                      step={d.step}
                      value={values[d.name] || ""}
                      onChange={(e) => {
                        if (d.handleErrorMessage) {
                          inputs[i] = d.handleErrorMessage({
                            newValue: e.target.value,
                            d,
                          });
                        }
                        if (d.intermediate) {
                          d.intermediate({
                            values,
                            setValues,
                            error,
                            setError,
                            newValue: e.target.value,
                            customErrorMessage,
                            setCustomErrorMessage,
                          });
                        }

                        setValues({
                          name: d.name,
                          value: e.target.value,
                        });
                      }}
                    />
                    {d.preset && (
                      <input
                        type="button"
                        className="modalinputmax"
                        value="MAX"
                        onClick={() => {
                          if (d.intermediate) {
                            d.intermediate({
                              values,
                              setValues,
                              error,
                              setError,
                              newValue: d.preset,
                              customErrorMessage,
                              setCustomErrorMessage,
                            });
                          }

                          setValues({
                            name: d.name,
                            value: d.preset,
                          });
                        }}
                      />
                    )}
                    <label className="modalinputlabel">
                      {d.label || "CNFI"}
                    </label>
                  </>
                )}
              </div>
              {d.name == "amount" && error && (
                <label className="modalerror">
                  {customErrorMessage != ""
                    ? customErrorMessage
                    : typeof isPenaltyCalculated == "boolean" &&
                      !isPenaltyCalculated
                    ? "Calculate Penalty before unstaking"
                    : d.errorMessage || "Invalid Amount"}
                </label>
              )}
              {errorMessage && errDisplay && d.showAdditional && (
                <label className="modalerror">{errDisplay}</label>
              )}
            </div>
          ))}
          {inputs.length > 0 && (
            <div className="modalbuttonbar">
              <button
                className={
                  error || errorMessage ? "modalbutton-error" : "modalbutton"
                }
                onClick={(e) => {
                  const condition = Object.entries(values)
                    .map(([k, v]) => {
                      return validateInput(
                        v,
                        `${Number(presets[k])}`,
                        presets[k]
                      );
                    })
                    .includes(false);
                  if (!condition && !error && !errorMessage) {
                    (async () => {
                      await handler(values);
                    })().then(() => {
                      setValues({});
                    });
                  } else {
                  }
                }}
              >
                {submitName}
              </button>
              {additionalButtonOnClick && (
                <button
                  onClick={() => {
                    additionalButtonOnClick({
                      values,
                      setValues,
                      error,
                      setError,
                      customErrorMessage,
                      setCustomErrorMessage,
                    });
                  }}
                  className="modalbuttoninactive"
                >
                  Calculate Penalty
                </button>
              )}
              <button
                onClick={() => {
                  innerHandleClose();
                  setValues({});
                  setError(false);
                }}
                className="modalbuttoninactive"
              >
                Cancel
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    )
  );
};
