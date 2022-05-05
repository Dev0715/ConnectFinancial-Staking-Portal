import React from "react";

import { Link } from "react-router-dom";

const Nav = () => {
  const Links = ["Staking", "Treasury", "Governance", "Tokenomics"];
  return (
    <div className="nav-container">
      <div className="nav-tab-container">
        {Links.map((nav, i) => {
          if (i === 0) {
            return (
              <Link
                key={i}
                className="nav-tab"
                exact={"true"}
                to="/"
                activeclassname="active"
              >
                {nav}
              </Link>
            );
          }
          return (
            <Link
              key={i}
              className="nav-tab"
              to={`/${nav.toLowerCase()}`}
              activeclassname="active"
            >
              {nav}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Nav;
