pragma solidity ^0.5.0;

contract MockOracle {
  function updatePrice(address /* usdcAddress */) public pure returns (bool) {
    // do nothing
    return true;
  }
  function computeAverageEthForTokens(address /* token */, uint256 /* amount */, uint256 /* min */, uint256 /* max */) public pure returns (uint224) {
    return uint224(155600000000000); // about $0.10
  }
}
