import React from "react";

const Button = ({ active, label, handler, setShowWeb3Modal }) => {
  return (
    <button
      className="buttonbarbutton"
      onClick={(e) => {
        active ? handler(true) : setShowWeb3Modal(true);
      }}
    >
      <span>{label.toUpperCase()}</span>
    </button>
  );
};

export default Button;
