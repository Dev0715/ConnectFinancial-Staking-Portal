// scripts/upgrade_stakingcontroller.js
const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
require("dotenv").config();
const {
  isMainnet,
  isFork,
  getSigner,
  getSignerByAddress,
} = require("../lib/deploy-helpers");

async function main() {
  const { deployments, ethers, upgrades, artifacts } = hre;
  const [realSigner] = await ethers.getSigners();
  const from = await realSigner.getAddress();
  const pCnfiFactoryLib = await deployments.deploy("pCNFIFactoryLib", {
    contractName: "pCNFIFactoryLib",
    args: [],
    libraries: {},
    from,
  });
  const updateToLastLib = await deployments.deploy("UpdateToLastLib", {
    contractName: "UpdateToLastLib",
    args: [],
    libraries: {},
    from,
  });
  const updateRedeemableLib = await deployments.deploy("UpdateRedeemableLib", {
    contractName: "UpdateRedeemableLib",
    args: [],
    libraries: {},
    from,
  });
  const calculateRewardsLib = await deployments.deploy("CalculateRewardsLib", {
    contractName: "CalculateRewardsLib",
    args: [],
    libraries: {},
    from,
  });
  const libraries = {
    pCNFIFactoryLib: pCnfiFactoryLib.address,
    UpdateToLastLib: updateToLastLib.address,
    UpdateRedeemableLib: updateRedeemableLib.address,
    CalculateRewardsLib: calculateRewardsLib.address,
  };
  const BoxV2 = await ethers.getContractFactory("StakingControllerTest", {
    libraries,
  });
  console.log("Upgrading ...");
  await upgrades.upgradeProxy(
    "0xc01Ac1F338e14C6E9091Ec1122DA342C4e7aa207",
    BoxV2
  );
  console.log("Upgraded");
}

main();
