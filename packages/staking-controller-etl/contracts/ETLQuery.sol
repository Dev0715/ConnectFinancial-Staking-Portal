// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;

import {ETLView} from "./ETLView.sol";
import {StakingController} from "@connectfinancial/connect-token/contracts/staking/StakingController.sol";

contract ETLQuery is ETLView {
  constructor(
    bytes4 sign,
    address stakingController,
    address[] memory users
  ) public {
    address viewLayer = address(new ETLView());
    bytes memory result = StakingController(stakingController).query(
      viewLayer,
      abi.encodeWithSelector(sign, users)
    );
    assembly {
      return(add(0x20, result), mload(result))
    }
  }
}
