"use strict";

const hre = require("hardhat");
const validate = require("@openzeppelin/upgrades-core/dist/validate/index");
Object.defineProperty(validate, "assertUpgradeSafe", {
  value: () => {},
});

const TOTAL_SUPPLY = hre.ethers.utils.parseUnits("108500000", 18);
const CAP = hre.ethers.utils.parseUnits("50000000", 18);
const now = () => Math.floor(Date.now() / 1000);
const OPENING_TIME = Math.max(1608595200, now() + 120);
const CLOSING_TIME = OPENING_TIME + 60 * 60 * 24 * 7;
const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const wethArtifact = require("canonical-weth/build/contracts/WETH9");
const WETH_ADDRESS = wethArtifact.networks[1].address;
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const { FACTORY_ADDRESS, INIT_CODE_HASH } = require("@uniswap/sdk");
const { pack, keccak256 } = require("@ethersproject/solidity");
const { getCreate2Address } = require("@ethersproject/address");

const sortTokens = ([token0, token1]) => {
  if (Number(token0) < Number(token1)) return [token0, token1];
  else return [token1, token0];
};

const getPair = (token0, token1) =>
  getCreate2Address(
    FACTORY_ADDRESS,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], sortTokens([token0, token1]))]
    ),
    INIT_CODE_HASH
  );

async function main(hre) {
  return true;
  const { deployments, ethers, upgrades } = hre;
  const [signer] = await ethers.getSigners();
  const { chainId } = await signer.provider.getNetwork();
  const isTest = Number(chainId) === 31337;
  const from = await signer.getAddress();
  const wallet = isTest ? from : "0x52A62fe122FF79741e54f70F784A7aAA2F970005";
  const ConnectTokenArtifact = await deployments.getArtifact("ConnectToken");
  const ConnectToken = await ethers.getContractFactory("ConnectToken");
  const connectToken = await upgrades.deployProxy(ConnectToken, [CLOSING_TIME]);
  deployments.save("ConnectToken", {
    address: connectToken.address,
    abi: ConnectTokenArtifact.abi,
  });
  const usdcPair = getPair(connectToken.address, USDC_ADDRESS);
  const wethPair = getPair(connectToken.address, WETH_ADDRESS);
  await connectToken.mint(wallet, TOTAL_SUPPLY);
  let oracle;
  if (Number(chainId) === 31337) {
    oracle = (
      await deployments.deploy("MockOracle", {
        libraries: {},
        contractName: "MockOracle",
        args: [],
        from,
      })
    ).address;
  } else {
    oracle = "0xFa5a44D3Ba93D666Bf29C8804a36e725ecAc659A";
  }
  const openingTime = isTest ? now() + 6 : OPENING_TIME;
  const closingTime = isTest ? now() + 60 * 60 * 24 : CLOSING_TIME;
  const crowdsale = await deployments.deploy("ConnectCrowdsale", {
    contractName: "ConnectCrowdsale",
    libraries: {},
    args: [wallet, connectToken.address, openingTime, closingTime, oracle],
    from,
  });
  if (isTest) await connectToken.approve(crowdsale.address, CAP);
  if (!isTest) {
    await connectToken.authorizeBeforeUnlock(usdcPair, true);
    await connectToken.authorizeBeforeUnlock(wethPair, true);
    await connectToken.authorizeBeforeUnlock(
      "0x6213fa2e1CA0BC91d94E39Ce4329264EE5CE8A71",
      true
    );
    await connectToken.authorizeBeforeUnlock(
      "0x59474076527ED233e58B4d58addF8CD29fd60C4E",
      true
    );
    await connectToken.authorizeBeforeUnlock(UNISWAP_V2_ROUTER, true);
    await connectToken.authorizeBeforeUnlock(UNISWAP_V2_FACTORY, true);
    await connectToken.authorizeBeforeUnlock(
      "0xe0D2226F77f9d224Fc9adeb4401814770b8137Da",
      true
    );
  }
  const tx = await connectToken.transferOwnership(crowdsale.address);
  await tx.wait();
}

module.exports = {
  skip: async () => true,
};
