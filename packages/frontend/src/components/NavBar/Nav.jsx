import React from "react";

import { NavLink } from "react-router-dom";

const Nav = () => {
  const navLinks = ["Staking", "Treasury", "Governance", "Tokenomics"];
  return (
    <div className="nav-container">
      <div className="nav-tab-container">
        {navLinks.map((nav, i) => {
          if (i === 0) {
            return (
              <NavLink
                key={i}
                className="nav-tab"
                exact
                to="/"
                activeClassName="nav-tab-active"
              >
                {nav}
              </NavLink>
            );
          }
          return (
            <NavLink
              key={i}
              className="nav-tab"
              to={`/${nav.toLowerCase()}`}
              activeClassName="nav-tab-active"
            >
              {nav}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default Nav;
