// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ConnectCustodianTemplate is OwnableUpgradeable {
/*
  address public saleContract;
  address public cnfiAddress;
  function initialize(address _cnfiAddress) public virtual {
    __ConnectCustodianTemplate_init(_cnfiAddress);
  }
  function __ConnectCustodianTemplate_init(address _cnfiAddress) public virtual initializer {
    __Ownable_init_unchained();
    __ConnnectCustodianTemplate_init_unchained(_cnfiAddress);
  }
  function __ConnectCustodianTemplate_init_unchained(address _cnfiAddress) internal {
    cnfiAddress = _cnfiAddress;
  }
  function name() public view returns (string memory) {
    return "Connect Financial Treasury";
  }
  function symbol() public view returns (string memory) {
    return "CNFIT";
  }
  function balanceOf(address user) public view returns (uint256) {
    return IERC20(cnfiAddress).balanceOf(address(this));
  }
  function transfer(address target, uint256 amount) public onlyOwner returns (bool) {
    return IERC20(cnfiAddress).transfer(target, amount);
  }
  function transferFrom(address from, address to, uint256 amount) public onlyOwner returns (bool) {
    return IERC20(cnfiAddress).transferFrom(from, to, amount);
  }
  function approve(address target, uint256 amount) public onlyOwner returns (bool) {
    return IERC20(cnfiAddress).approve(target, amount);
  }
*/
}
