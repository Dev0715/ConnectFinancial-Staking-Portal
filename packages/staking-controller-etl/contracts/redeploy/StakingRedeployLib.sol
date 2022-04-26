pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
import {ETLLib} from "../ETLLib.sol";
import {StakingControllerLib} from "@connectfinancial/connect-token/contracts/staking/StakingControllerLib.sol";

library StakingRedeployLib {
  function redeploy(
    StakingControllerLib.Isolate storage isolate,
    ETLLib.UserView[] memory users
  ) external {
    for (uint256 i = 0; i < users.length; i++) {
      ETLLib.UserView memory _view = users[i];
      restoreDailyUser(isolate.dailyUsers[_view.userAddress], _view.dailyUser);
      isolate.bonusesAccrued[_view.userAddress] = _view.bonusesAccrued;
      isolate.lockCommitments[_view.userAddress] = _view.lockCommitment;
      isolate.dailyBonusesAccrued[_view.userAddress] = _view
        .dailyBonusesAccrued;
      isolate.sCnfi.mint(_view.userAddress, _view.scnfiBalance);
      for (uint256 j = 0; j < _view.user.length; j++)
        redeployUserCycle(isolate, _view.userAddress, j, _view.user[j]);
      isolate.weightChanges[_view.userAddress].totalCyclesSeen = _view
        .weightChanges
        .length;
      for (uint256 j = 0; j < _view.weightChanges.length; j++) {
        isolate.weightChanges[_view.userAddress].changes[j] = _view
          .weightChanges[j];
      }
    }
  }

  function restoreDailyUser(
    StakingControllerLib.DailyUser storage user,
    StakingControllerLib.DailyUser memory _user
  ) internal {
    user.multiplier = _user.multiplier;
    user.cycleEnd = _user.cycleEnd;
    user.cyclesHeld = _user.cyclesHeld;
    user.redeemable = _user.redeemable;
    user.start = _user.start;
    user.weight = _user.weight;
    user.claimed = _user.claimed;
    user.commitment = _user.commitment;
    user.lastDaySeen = _user.lastDaySeen;
    user.cumulativeTotalWeight = _user.cumulativeTotalWeight;
    user.cumulativeRewardWeight = _user.cumulativeRewardWeight;
    user.lastTotalWeight = _user.lastTotalWeight;
    user.currentTier = _user.currentTier;
  }

  function redeployUserCycle(
    StakingControllerLib.Isolate storage isolate,
    address user,
    uint256 i,
    StakingControllerLib.User memory _user
  ) internal {
    restoreUser(isolate.cycles[i].users[user], _user);
  }

  function restoreUser(
    StakingControllerLib.User storage user,
    StakingControllerLib.User memory _user
  ) internal {
    user.currentWeight = _user.currentWeight;
    user.minimumWeight = _user.minimumWeight;
    user.dailyWeight = _user.dailyWeight;
    user.multiplier = _user.multiplier;
    user.redeemable = _user.redeemable;
    user.daysClaimed = _user.daysClaimed;
    user.start = _user.start;
    user.seen = _user.seen;
    user.currentTier = _user.currentTier;
    user.cyclesHeld = _user.cyclesHeld;
  }

  function restoreCycles(
    StakingControllerLib.Isolate storage isolate,
    ETLLib.CycleView[] memory cycles
  ) internal {
    for (uint256 i = 0; i < cycles.length; i++) {
      StakingControllerLib.Cycle storage _cycle = isolate.cycles[i];
      ETLLib.CycleView memory cycle = cycles[i];
      _cycle.totalWeight = cycle.totalWeight;
      _cycle.totalRawWeight = cycle.totalRawWeight;
      _cycle.pCnfiToken = cycle.pCnfiToken;
      _cycle.reserved = cycle.reserved;
      _cycle.day = cycle.day;
      _cycle.inflateBy = cycle.inflateBy;
      _cycle.canUnstake = cycle.canUnstake;
    }
  }

  function redeployState(
    StakingControllerLib.Isolate storage isolate,
    ETLLib.IsolateView memory isolateView
  ) external {
    isolate.currentCycle = isolateView.currentCycle;
    isolate.nextCycleTime = isolateView.nextCycleTime;
    isolate.cycleInterval = isolateView.cycleInterval;
    isolate.nextTimestamp = isolateView.nextTimestamp;
    isolate.inflateBy = isolateView.inflateBy;
    isolate.inflatepcnfiBy = isolateView.inflatepcnfiBy;
    isolate.rewardInterval = isolateView.rewardInterval;
    isolate.tiersLength = isolateView.tiersLength;
    isolate.baseUnstakePenalty = isolateView.baseUnstakePenalty;
    isolate.commitmentViolationPenalty = isolateView.commitmentViolationPenalty;
    isolate.totalWeight = isolateView.totalWeight;
    isolate.lastTotalWeight = isolateView.lastTotalWeight;
    isolate.cumulativeTotalWeight = isolateView.cumulativeTotalWeight;
    isolate.currentDay = isolateView.currentDay;
    restoreCycles(isolate, isolateView.cycles);
  }
}
