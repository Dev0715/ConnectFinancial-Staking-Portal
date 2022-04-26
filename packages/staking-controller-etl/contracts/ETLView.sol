// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity >=0.6.0;

import {StakingControllerTemplate} from "@connectfinancial/connect-token/contracts/staking/StakingControllerTemplate.sol";
import {ETLLib} from "./ETLLib.sol";
import "hardhat/console.sol";

contract ETLView is StakingControllerTemplate {
  using ETLLib for *;

  function render(address[] memory)
    public
    view
    returns (ETLLib.IsolateView memory isolateView)
  {
    isolateView.currentCycle = isolate.currentCycle;
    isolateView.cnfiTreasury = isolate.cnfiTreasury;
    isolateView.cnfi = isolate.cnfi;
    isolateView.sCnfi = isolate.sCnfi;
    isolateView.pCnfi = isolate.pCnfi;
    isolateView.nextCycleTime = isolate.nextCycleTime;
    isolateView.cycleInterval = isolate.cycleInterval;
    isolateView.nextTimestamp = isolate.nextTimestamp;
    isolateView.inflateBy = isolate.inflateBy;
    isolateView.inflatepcnfiBy = isolate.inflatepcnfiBy;
    isolateView.rewardInterval = isolate.rewardInterval;
    isolateView.tiersLength = isolate.tiersLength;
    isolateView.baseUnstakePenalty = isolate.baseUnstakePenalty;
    isolateView.commitmentViolationPenalty = isolate.commitmentViolationPenalty;
    isolateView.totalWeight = isolate.totalWeight;
    isolateView.lastTotalWeight = isolate.lastTotalWeight;
    isolateView.cumulativeTotalWeight = isolate.cumulativeTotalWeight;
    isolateView.pCnfiImplementation = isolate.pCnfiImplementation;
    isolateView.currentDay = isolate.currentDay;
  }

  function getUsers(address[] memory users)
    public
    view
    returns (ETLLib.UserView[] memory userView)
  {
    userView = new ETLLib.UserView[](users.length);
    for (uint256 i = 0; i < users.length; i++) {
      userView[i] = isolate.getUser(users[i]);
    }
  }
}
