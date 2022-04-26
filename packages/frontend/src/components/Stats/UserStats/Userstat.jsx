import React from "react";

const Userstat = ({ label, value }) => {
  return (
    <div className="userstatsitem">
      <div className="userstatsitemlabel">{label}</div>
      <div className="userstatsitemvalue">
        <span>{value}</span>
      </div>
    </div>
  );
};

export default Userstat;
