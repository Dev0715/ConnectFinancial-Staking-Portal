// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract pCNFIETL is ERC20Upgradeable, OwnableUpgradeable {
  function initialize(
    uint256 /* cycle */
  ) public initializer {
    __Ownable_init_unchained();
  }

  function mint(address target, uint256 amount) public onlyOwner {
    _mint(target, amount);
  }

  function burn(address target, uint256 amount) public onlyOwner {
    _burn(target, amount);
  }
}
