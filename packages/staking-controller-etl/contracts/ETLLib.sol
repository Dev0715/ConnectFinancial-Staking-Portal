// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity >=0.6.0;

import {StakingControllerLib} from "@connectfinancial/connect-token/contracts/staking/StakingControllerLib.sol";
import {CNFITreasury} from "@connectfinancial/connect-token/contracts/treasury/CNFITreasury.sol";
import {ICNFI} from "@connectfinancial/connect-token/contracts/interfaces/ICNFI.sol";
import {sCNFI} from "@connectfinancial/connect-token/contracts/token/sCNFI.sol";
import {pCNFI} from "@connectfinancial/connect-token/contracts/token/pCNFI.sol";

library ETLLib {
  struct IsolateView {
    uint256 currentCycle;
    CNFITreasury cnfiTreasury;
    ICNFI cnfi;
    sCNFI sCnfi;
    pCNFI pCnfi;
    uint256 nextCycleTime;
    uint256 cycleInterval;
    uint256 nextTimestamp;
    uint256 inflateBy;
    uint256 inflatepcnfiBy;
    uint256 rewardInterval;
    uint256 tiersLength;
    uint256 baseUnstakePenalty;
    uint256 commitmentViolationPenalty;
    uint256 totalWeight;
    uint256 lastTotalWeight;
    uint256 cumulativeTotalWeight;
    address pCnfiImplementation;
    uint256 currentDay;
    CycleView[] cycles;
  }
  struct CycleView {
    uint256 totalWeight;
    uint256 totalRawWeight;
    address pCnfiToken;
    uint256 reserved;
    uint256 day;
    uint256 inflateBy;
    bool canUnstake;
  }
  struct UserView {
    StakingControllerLib.User[] user;
    StakingControllerLib.DailyUser dailyUser;
    uint256[] weightChanges;
    uint256 dailyBonusesAccrued;
    uint256 bonusesAccrued;
    uint256 lockCommitment;
    address userAddress;
    uint256 scnfiBalance;
  }
  struct ETLViewResult {
    IsolateView isolate;
    UserView[] users;
  }

  function getCycle(StakingControllerLib.Isolate storage isolate, uint256 i)
    internal
    view
    returns (CycleView memory)
  {
    StakingControllerLib.Cycle storage cycle = isolate.cycles[i];
    return
      CycleView({
        totalWeight: cycle.totalWeight,
        totalRawWeight: cycle.totalRawWeight,
        pCnfiToken: cycle.pCnfiToken,
        reserved: cycle.reserved,
        day: cycle.day,
        inflateBy: cycle.inflateBy,
        canUnstake: cycle.canUnstake
      });
  }

  function getCycles(StakingControllerLib.Isolate storage isolate)
    internal
    view
    returns (CycleView[] memory result)
  {
    result = new CycleView[](isolate.currentCycle + 1);
    for (uint256 i = 0; i < result.length; i++) {
      result[i] = getCycle(isolate, i);
    }
  }

  function getDailyUser(
    StakingControllerLib.Isolate storage isolate,
    address user
  ) internal view returns (StakingControllerLib.DailyUser memory) {
    return isolate.dailyUsers[user];
  }

  function getCycleUser(
    StakingControllerLib.Isolate storage isolate,
    uint256 i,
    address user
  ) internal view returns (StakingControllerLib.User memory) {
    return isolate.cycles[i].users[user];
  }

  function getUserWeightChanges(
    StakingControllerLib.Isolate storage isolate,
    address user
  ) internal view returns (uint256[] memory result) {
    StakingControllerLib.UserWeightChanges storage weightChanges = isolate
      .weightChanges[user];
    result = new uint256[](weightChanges.totalCyclesSeen);
    for (uint256 i = 0; i < result.length; i++) {
      result[i] = weightChanges.changes[i];
    }
  }

  function getUserCycles(
    StakingControllerLib.Isolate storage isolate,
    address user
  ) internal view returns (StakingControllerLib.User[] memory result) {
    CycleView[] memory cycles = getCycles(isolate);
    result = new StakingControllerLib.User[](cycles.length);
    for (uint256 i = 0; i < cycles.length; i++) {
      result[i] = getCycleUser(isolate, i, user);
    }
  }

  function getUser(StakingControllerLib.Isolate storage isolate, address user)
    internal
    view
    returns (UserView memory userView)
  {
    userView.user = getUserCycles(isolate, user);
    userView.dailyUser = getDailyUser(isolate, user);
    userView.weightChanges = getUserWeightChanges(isolate, user);
    userView.dailyBonusesAccrued = isolate.dailyBonusesAccrued[user];
    userView.bonusesAccrued = isolate.bonusesAccrued[user];
    userView.lockCommitment = isolate.lockCommitments[user];
    userView.userAddress = user;
    userView.scnfiBalance = isolate.sCnfi.balanceOf(user);
  }

  function getInflateByChanged(StakingControllerLib.Isolate storage isolate)
    internal
    view
    returns (uint256[] memory result)
  {
    result = new uint256[](isolate.inflateByChanged.length);
    for (uint256 i = 0; i < result.length; i++) {
      result[i] = isolate.inflateByChanged[i];
    }
  }

  function getView(
    StakingControllerLib.Isolate storage isolate,
    address[] memory users
  ) internal view returns (ETLViewResult memory result) {
    //    result.isolate = getIsolateView(isolate);
    result.users = new UserView[](users.length);
    for (uint256 i = 0; i < result.users.length; i++) {
      result.users[i] = getUser(isolate, users[i]);
    }
  }

  function getIsolateView(StakingControllerLib.Isolate storage isolate)
    internal
    view
    returns (IsolateView memory isolateView)
  {}
}
