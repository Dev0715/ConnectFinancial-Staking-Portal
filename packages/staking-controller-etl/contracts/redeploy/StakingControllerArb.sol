pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import {StakingControllerRedeploy as StakingController} from "@connectfinancial/connect-token/contracts/staking/StakingControllerRedeploy.sol";
import {StakingRedeployLib} from "./StakingRedeployLib.sol";
import {ETLLib} from "../ETLLib.sol";

contract StakingControllerArb is StakingController {
  using StakingRedeployLib for *;

  function restoreState(ETLLib.UserView[] memory users)
    public
    onlyOwner
    returns (bool)
  {
    isolate.redeploy(users);
    return true;
  }

  function restoreBaseState(ETLLib.IsolateView memory isolateView)
    public
    onlyOwner
    returns (bool)
  {
    isolate.redeployState(isolateView);
    return true;
  }
}
