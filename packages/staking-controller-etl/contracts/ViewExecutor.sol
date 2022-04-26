pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0;

interface ViewExecutor {
    function query(address viewLogic, bytes calldata payload) external returns (bytes memory);
}
