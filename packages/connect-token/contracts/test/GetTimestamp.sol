// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract GetTimestamp {
  constructor() public {
    assembly {
      mstore(0x0, timestamp())
      return(0x0, 0x20)
    }
  }
}
