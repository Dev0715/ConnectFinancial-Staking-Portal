pragma solidity >=0.5.0 <0.7.0;

import { Crowdsale } from "ozcontracts250/crowdsale/Crowdsale.sol";
import { AllowanceCrowdsale } from "ozcontracts250/crowdsale/emission/AllowanceCrowdsale.sol";
import { IERC20 } from "ozcontracts250/token/ERC20/IERC20.sol";
import { IIndexedUniswapV2Oracle } from "../interfaces/IIndexedUniswapV2Oracle.sol";

contract ConnectSale is Crowdsale, AllowanceCrowdsale {
  address public oracle;
  address public cnfiAddress;
  constructor(
    address payable wallet,
    address _oracle,
    address _cnfiAddress
  ) public AllowanceCrowdsale(wallet) Crowdsale(IERC20(_cnfiAddress).totalSupply(), wallet, IERC20(_cnfiAddress)) {
    cnfiAddress = _cnfiAddress;
    oracle = _oracle;
  }
  function updatePrice() internal {
    IIndexedUniswapV2Oracle(oracle).updatePrice(cnfiAddress);
  }
  function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
    return weiAmount.mul(rate());
  }
  function rate() public view returns (uint256) {
    return uint256(1 ether).div(uint256(IIndexedUniswapV2Oracle(oracle).computeAverageEthForTokens(cnfiAddress, 1e18, 0, 60*60*24*2))); // take two day moving average
  }
  function() external payable {
    updatePrice();
    buyTokens(_msgSender());
  }
}
