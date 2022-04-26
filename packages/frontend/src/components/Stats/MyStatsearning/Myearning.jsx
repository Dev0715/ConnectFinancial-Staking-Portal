import React from "react";

const MyearningSmall = ({ label, value, size = "" }) => {
  return (
    <div className="myearningsitem">
      <div className={`myearningslabel${size}`}>
        <span>{label}</span>
      </div>
      <div className="myearningsamount">
        <span>{value}</span>
      </div>
    </div>
  );
};

export default MyearningSmall;
