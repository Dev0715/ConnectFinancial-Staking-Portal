// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0;

import {CNFITreasury} from "@connectfinancial/connect-token/contracts/treasury/CNFITreasury.sol";
import {ICNFI} from "@connectfinancial/connect-token/contracts/interfaces/ICNFI.sol";
import {sCNFI} from "@connectfinancial/connect-token/contracts/token/sCNFI.sol";
import {pCNFI} from "@connectfinancial/connect-token/contracts/token/pCNFI.sol";

contract StakingControllerLib {
  struct Isolate {
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
    mapping(uint256 => StakingControllerLib.Cycle) cycles;
    mapping(uint256 => StakingControllerLib.Tier) tiers;
    mapping(address => uint256) lockCommitments;
    mapping(address => uint256) bonusesAccrued;
    mapping(address => uint256) dailyBonusesAccrued;
    mapping(address => StakingControllerLib.UserWeightChanges) weightChanges;
    mapping(address => StakingControllerLib.DailyUser) dailyUsers;
    uint256[] inflateByChanged;
    mapping(uint256 => StakingControllerLib.InflateByChanged) inflateByValues;
    address pCnfiImplementation;
    uint256 currentDay;
  }
  struct User {
    uint256 currentWeight;
    uint256 minimumWeight;
    uint256 dailyWeight;
    uint256 multiplier;
    uint256 redeemable;
    uint256 daysClaimed;
    uint256 start;
    bool seen;
    uint256 currentTier;
    uint256 cyclesHeld;
  }
  struct DailyUser {
    uint256 multiplier;
    uint256 cycleEnd;
    uint256 cyclesHeld;
    uint256 redeemable;
    uint256 start;
    uint256 weight;
    uint256 claimed;
    uint256 commitment;
    uint256 lastDaySeen;
    uint256 cumulativeTotalWeight;
    uint256 cumulativeRewardWeight;
    uint256 lastTotalWeight;
    uint256 currentTier;
  }
  struct Cycle {
    uint256 totalWeight;
    uint256 totalRawWeight;
    address pCnfiToken;
    uint256 reserved;
    uint256 day;
    uint256 inflateBy;
    mapping(address => User) users;
    mapping(uint256 => uint256) cnfiRewards;
    mapping(uint256 => uint256) pcnfiRewards;
    bool canUnstake;
  }
  struct Tier {
    uint256 multiplier;
    uint256 minimum;
    uint256 cycles;
  }
  struct InflateByChanged {
    uint256 totalWeight;
    uint256 previousAmount;
  }
  struct UserWeightChanges {
    mapping(uint256 => uint256) changes;
    uint256 totalCyclesSeen;
  }
}
