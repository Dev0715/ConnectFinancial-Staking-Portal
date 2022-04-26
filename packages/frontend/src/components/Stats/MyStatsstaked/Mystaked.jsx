import React from "react";

const Mystaked = ({ label, value }) => {
  return (
    <div className="mystatsitem">
      <div className="mystatstakelabel">
        <span>{label}</span>
      </div>
      <div className="mystatstakeamount">
        <span>{value} CNFI</span>
      </div>
    </div>
  );
};

export default Mystaked;
